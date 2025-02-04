using server.Repositories.Models;

namespace server.Hubs.Services.Interfaces;

public interface IPresentationManager
{
    List<User> GetConnectedUsers(int presentationId);
    void RemoveUser(int presentationId, string username);
    string GetGroupName(int presentationId);
    bool TryAddUser(int presentationId, string username);
}