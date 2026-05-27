using System;
using System.IO;
using System.Text.Json;
using LogMonitoringAgent.Models;

namespace LogMonitoringAgent.Services
{
    public class ConfigService
    {
        private readonly string _configDirectory;
        private readonly string _configFilePath;

        public ConfigService()
        {
            _configDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "LogMonitoringAgent"
            );

            _configFilePath = Path.Combine(_configDirectory, "config.json");
        }

        public AgentConfig Load()
        {
            try
            {
                if (!Directory.Exists(_configDirectory))
                {
                    Directory.CreateDirectory(_configDirectory);
                }

                if (!File.Exists(_configFilePath))
                {
                    return new AgentConfig();
                }

                var json = File.ReadAllText(_configFilePath);
                var config = JsonSerializer.Deserialize<AgentConfig>(json);

                return config ?? new AgentConfig();
            }
            catch
            {
                return new AgentConfig();
            }
        }

        public void Save(AgentConfig config)
        {
            try
            {
                if (!Directory.Exists(_configDirectory))
                {
                    Directory.CreateDirectory(_configDirectory);
                }

                var json = JsonSerializer.Serialize(
                    config,
                    new JsonSerializerOptions { WriteIndented = true }
                );

                File.WriteAllText(_configFilePath, json);
            }
            catch
            {
            }
        }
    }
}
