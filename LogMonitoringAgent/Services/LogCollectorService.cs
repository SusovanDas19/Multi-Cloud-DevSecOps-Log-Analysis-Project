using System;
using System.Collections.Generic;
using System.Diagnostics;
using LogMonitoringAgent.Models;

namespace LogMonitoringAgent.Services
{
    public class LogCollectorService
    {
        private readonly AgentConfig _config;

        public LogCollectorService(AgentConfig config)
        {
            _config = config;
        }

        public List<LogEvent> GetNewLogs()
        {
            var logs = new List<LogEvent>();

            using var eventLog = new EventLog("Application");

            int total = eventLog.Entries.Count;
            if (total == 0)
            {
                return logs;
            }

            int lastProcessedIndex = (int)_config.LastRecordId;

            const int initialBatchSize = 11;

            if (lastProcessedIndex < 0)
            {
                lastProcessedIndex = total - initialBatchSize;
                if (lastProcessedIndex < 0) lastProcessedIndex = 0;
            }
            else if (lastProcessedIndex >= total)
            {
                lastProcessedIndex = total - 1;
            }

            for (int i = lastProcessedIndex + 1; i < total; i++)
            {
                var entry = eventLog.Entries[i];

                var log = new LogEvent
                {
                    Timestamp = entry.TimeGenerated.ToUniversalTime(),
                    OriginalMessage = entry.Message ?? "",
                    Severity = MapSeverity(entry.EntryType),
                    IsThreat = false,
                    ThreatType = null,
                    Recommendation = null
                };

                logs.Add(log);
            }

            _config.LastRecordId = total - 1;
            return logs;
        }


        private int MapSeverity(EventLogEntryType type)
        {
            return type switch
            {
                EventLogEntryType.Information => 2,
                EventLogEntryType.Warning => 5,
                EventLogEntryType.Error => 8,
                EventLogEntryType.FailureAudit => 7,
                EventLogEntryType.SuccessAudit => 3,
                _ => 1
            };
        }
    }
}
