using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using LogMonitoringAgent.Models;

namespace LogMonitoringAgent.Services
{
    public class ApiClient
    {
        private readonly HttpClient _httpClient;

        public ApiClient(string apiBaseUrl)
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri(apiBaseUrl.TrimEnd('/'))
            };
        }

        public async Task<LoginResponse?> LoginAsync(string username, string password, string machineCode)
        {
            var body = new
            {
                username,
                password,
                machineCode
            };

            using var response = await _httpClient.PostAsJsonAsync("/api/users/login", body);

            if (!response.IsSuccessStatusCode)
            {
                var errorText = await response.Content.ReadAsStringAsync();
                throw new Exception($"Login failed ({(int)response.StatusCode}): {errorText}");
            }

            var data = await response.Content.ReadFromJsonAsync<LoginResponse>();
            return data;
        }
    }
}
