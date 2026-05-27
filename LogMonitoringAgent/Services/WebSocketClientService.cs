using System;
using System.Collections.Generic;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using LogMonitoringAgent.Models;

namespace LogMonitoringAgent.Services
{
    public class WebSocketClientService
    {
        private readonly AgentConfig _config;
        private ClientWebSocket? _socket;

        public event Action? OnRemoteStopRequested;

        public WebSocketClientService(AgentConfig config)
        {
            _config = config;
        }

        public async Task<bool> ConnectAndAuthAsync()
        {
            if (string.IsNullOrWhiteSpace(_config.JwtToken) ||
                string.IsNullOrWhiteSpace(_config.MachineCode))
            {
                throw new InvalidOperationException("Missing token or machine code in config.");
            }

            _socket = new ClientWebSocket();

            var uri = new Uri("ws://20.239.53.137:4000/agent");
            await _socket.ConnectAsync(uri, CancellationToken.None);

            var authMsg = new
            {
                type = "auth",
                token = _config.JwtToken,
                machineCode = _config.MachineCode
            };

            var json = JsonSerializer.Serialize(authMsg);
            var buffer = Encoding.UTF8.GetBytes(json);
            await _socket.SendAsync(
                new ArraySegment<byte>(buffer),
                WebSocketMessageType.Text,
                endOfMessage: true,
                CancellationToken.None
            );

            var recvBuffer = new byte[4096];
            var result = await _socket.ReceiveAsync(
                new ArraySegment<byte>(recvBuffer),
                CancellationToken.None
            );

            var respText = Encoding.UTF8.GetString(recvBuffer, 0, result.Count);
            try
            {
                var doc = JsonDocument.Parse(respText);
                var root = doc.RootElement;
                var type = root.GetProperty("type").GetString();

                if (type == "auth_ok")
                {
                    _ = Task.Run(ListenForMessages);
                    return true;
                }

                return false;
            }
            catch
            {
                return false;
            }
        }

        private async Task ListenForMessages()
        {
            var buffer = new byte[4096];

            try
            {
                while (_socket != null && _socket.State == WebSocketState.Open)
                {
                    var result = await _socket.ReceiveAsync(
                        new ArraySegment<byte>(buffer),
                        CancellationToken.None
                    );

                    if (result.MessageType == WebSocketMessageType.Close)
                        break;

                    var msg = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    try
                    {
                        using var doc = JsonDocument.Parse(msg);
                        var root = doc.RootElement;

                        if (root.TryGetProperty("type", out var typeEl))
                        {
                            var type = typeEl.GetString();

                            if (type == "control")
                            {
                                HandleControlMessage(root);
                            }
                            else if (type == "error")
                            {
                                var message = root.TryGetProperty("message", out var m)
                                    ? m.GetString()
                                    : null;
                                Console.WriteLine("WS error from server: " + message);
                            }
                        }
                    }
                    catch
                    {
                    }
                }
            }
            catch
            {
            }
        }

        private void HandleControlMessage(JsonElement root)
        {
            if (root.TryGetProperty("action", out var actionEl))
            {
                var action = actionEl.GetString();

                if (action == "stop_monitoring")
                {
                    OnRemoteStopRequested?.Invoke();
                }
            }
        }

        public async Task<bool> SendLogBatchAsync(List<LogEvent> logs)
        {
            if (_socket == null || _socket.State != WebSocketState.Open)
            {
                throw new InvalidOperationException("WebSocket is not connected.");
            }

            var batchMsg = new
            {
                type = "log_batch",
                logs = logs
            };

            var json = JsonSerializer.Serialize(batchMsg);
            var buffer = Encoding.UTF8.GetBytes(json);

            await _socket.SendAsync(
                new ArraySegment<byte>(buffer),
                WebSocketMessageType.Text,
                endOfMessage: true,
                CancellationToken.None
            );

      
            return true;
        }

        public async Task CloseAsync()
        {
            if (_socket != null)
            {
                await _socket.CloseAsync(
                    WebSocketCloseStatus.NormalClosure,
                    "Closing",
                    CancellationToken.None
                );
                _socket.Dispose();
                _socket = null;
            }
        }
    }
}
