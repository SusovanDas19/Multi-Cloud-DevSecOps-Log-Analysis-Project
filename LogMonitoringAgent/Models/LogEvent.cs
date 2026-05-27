namespace LogMonitoringAgent.Models
{
    public class LogEvent
    {
        public DateTime Timestamp { get; set; }
        public string OriginalMessage { get; set; } = "";
        public int Severity { get; set; } = 0;
        public bool IsThreat { get; set; } = false;
        public string? ThreatType { get; set; }
        public string? Recommendation { get; set; }
    }
}
