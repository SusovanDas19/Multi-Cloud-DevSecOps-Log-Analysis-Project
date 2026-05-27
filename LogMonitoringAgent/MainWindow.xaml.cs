using System;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using LogMonitoringAgent.Models;
using LogMonitoringAgent.Services;

namespace LogMonitoringAgent
{
    public partial class MainWindow : Window
    {
        private readonly ConfigService _configService;
        private readonly ApiClient _apiClient;
        private AgentConfig _config;

        private CancellationTokenSource? _monitoringCts;
        private WebSocketClientService _wsClient;
        private LogCollectorService _collector;

        public MainWindow()
        {
            InitializeComponent();

            _configService = new ConfigService();
            _config = _configService.Load();

            _apiClient = new ApiClient(_config.ApiBaseUrl);
            _collector = new LogCollectorService(_config);
            _wsClient = new WebSocketClientService(_config);

            _wsClient.OnRemoteStopRequested += RemoteStopHandler;

            if (!string.IsNullOrWhiteSpace(_config.MachineCode))
            {
                MachineCodeTextBox.Text = _config.MachineCode;
            }

            StatusTextBlock.Text = "Status: Not logged in";
        }

        private void UpdateLoginButtonState()
        {
            var username = UsernameTextBox.Text.Trim();
            var password = PasswordBox.Password;
            var machineCode = MachineCodeTextBox.Text.Trim();

            LoginButton.IsEnabled =
                !string.IsNullOrWhiteSpace(username) &&
                !string.IsNullOrWhiteSpace(password) &&
                !string.IsNullOrWhiteSpace(machineCode);
        }

        private void InputField_Changed(object sender, System.Windows.Controls.TextChangedEventArgs e)
        {
            UpdateLoginButtonState();
        }

        private void PasswordBox_PasswordChanged(object sender, RoutedEventArgs e)
        {
            UpdateLoginButtonState();
        }

        private async void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            var username = UsernameTextBox.Text.Trim();
            var password = PasswordBox.Password;
            var machineCode = MachineCodeTextBox.Text.Trim();

            if (string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password) ||
                string.IsNullOrWhiteSpace(machineCode))
            {
                StatusTextBlock.Text = "Status: Please fill all fields.";
                return;
            }

            LoginButton.IsEnabled = false;
            StatusTextBlock.Text = "Status: Logging in...";

            try
            {
                var response = await _apiClient.LoginAsync(username, password, machineCode);

                if (response?.Token == null || response.User == null)
                {
                    StatusTextBlock.Text = "Status: Invalid response from server.";
                    LoginButton.IsEnabled = true;
                    return;
                }

                _config.JwtToken = response.Token;
                _config.UserId = response.User.Id;
                _config.MachineCode = response.User.MachineCode ?? machineCode;

                _configService.Save(_config);

                StatusTextBlock.Text = "Status: Logged in.";
                StartMonitoringButton.IsEnabled = true;
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Status: Login failed. {ex.Message}";
            }
            finally
            {
                LoginButton.IsEnabled = true;
            }
        }

        private async void StartMonitoringButton_Click(object sender, RoutedEventArgs e)
        {
            if (_monitoringCts != null)
            {
                _monitoringCts.Cancel();
                _monitoringCts = null;

                StartMonitoringButton.Content = "Start Monitoring";
                StatusTextBlock.Text = "Status: Monitoring stopped.";
                return;
            }

            StatusTextBlock.Text = "Status: Connecting WebSocket and starting monitoring...";

            try
            {
                var authed = await _wsClient.ConnectAndAuthAsync();
                if (!authed)
                {
                    StatusTextBlock.Text = "Status: WebSocket auth failed.";
                    return;
                }

                StatusTextBlock.Text = "Status: Monitoring started (every 30 seconds).";
                StartMonitoringButton.Content = "Stop Monitoring";

                _monitoringCts = new CancellationTokenSource();
                var token = _monitoringCts.Token;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        var interval = TimeSpan.FromSeconds(30);

                        while (!token.IsCancellationRequested)
                        {
                            try
                            {
                                var logs = _collector.GetNewLogs();

                                if (logs.Count > 0)
                                {
                                    var sent = await _wsClient.SendLogBatchAsync(logs);
                                    if (sent)
                                    {
                                        _configService.Save(_config);

                                        Dispatcher.Invoke(() =>
                                        {
                                            StatusTextBlock.Text =
                                                $"Status: Sent {logs.Count} logs at {DateTime.Now:T}";
                                        });
                                    }
                                    else
                                    {
                                        Dispatcher.Invoke(() =>
                                        {
                                            StatusTextBlock.Text =
                                                "Status: Failed to send log batch (see console).";
                                        });
                                    }
                                }
                                else
                                {
                                    Dispatcher.Invoke(() =>
                                    {
                                        StatusTextBlock.Text =
                                            $"Status: No new logs at {DateTime.Now:T}";
                                    });
                                }
                            }
                            catch (Exception exLoop)
                            {
                                Dispatcher.Invoke(() =>
                                {
                                    StatusTextBlock.Text =
                                        $"Status: Error in monitoring loop: {exLoop.Message}";
                                });
                            }

                            await Task.Delay(interval, token);
                        }
                    }
                    finally
                    {
                        await _wsClient.CloseAsync();

                        Dispatcher.Invoke(() =>
                        {
                            StartMonitoringButton.Content = "Start Monitoring";
                        });
                    }
                }, token);
            }
            catch (Exception ex)
            {
                StatusTextBlock.Text = $"Status: Error: {ex.Message}";
            }
        }

        private void RemoteStopHandler()
        {
            Dispatcher.Invoke(() =>
            {
                if (_monitoringCts != null)
                {
                    _monitoringCts.Cancel();
                    _monitoringCts = null;

                    StartMonitoringButton.Content = "Start Monitoring";
                    StatusTextBlock.Text = "Status: Monitoring stopped by server.";
                }
            });
        }
    }
}
