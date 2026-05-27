namespace LogMonitoringAgent.Models
{
    public class LoginUser
    {
        public string? Id { get; set; }
        public string? Username { get; set; }
        public string? MachineCode { get; set; }
    }

    public class LoginResponse
    {
        public string? Token { get; set; }
        public LoginUser? User { get; set; }
    }
}
