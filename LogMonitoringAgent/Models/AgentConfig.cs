namespace LogMonitoringAgent.Models
{
    public class AgentConfig
    {
        public string ApiBaseUrl { get; set; } = "http://20.239.53.137:3000";

        public string? JwtToken { get; set; }

        public string? UserId { get; set; }

        public string? MachineCode { get; set; }

        public long LastRecordId { get; set; } = -1;
    }
}
