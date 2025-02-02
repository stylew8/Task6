using server.Repositories.Models;

namespace server.Hubs.Models;

public class PresentationModel
{

    public List<User> ConnectedUsers { get; set; } = new List<User>();
}