using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using LogMonitoringAgent.Models;

namespace LogMonitoringAgent.Services
{
    public class LogSenderService
    {
        private readonly HttpClient _httpClient;
        private readonly AgentConfig _config;

        public LogSenderService(AgentConfig config)
        {
            _config = config;

            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(config.ApiBaseUrl);

            if (!string.IsNullOrEmpty(config.JwtToken))
            {
                _httpClient.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", config.JwtToken);
            }
        }

        public async Task<bool> SendLogsAsync(List<LogEvent> logs)
        {
            var body = new { logs };

            var res = await _httpClient.PostAsJsonAsync("/api/logs/from-agent", body);

            return res.IsSuccessStatusCode;
        }
    }
}
