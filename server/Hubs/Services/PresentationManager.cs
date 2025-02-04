using server.Hubs.Services.Interfaces;
using server.Repositories.Models;
using System.Collections.Concurrent;

namespace server.Hubs.Services;

public class PresentationManager : IPresentationManager
{
    private static readonly ConcurrentDictionary<int, List<User>> Presentations = new();

    public List<User> GetConnectedUsers(int presentationId)
    {
        return Presentations.TryGetValue(presentationId, out var users)
            ? users
            : new List<User>();
    }

    public void RemoveUser(int presentationId, string username)
    {
        if (Presentations.TryGetValue(presentationId, out var users))
        {
            users.RemoveAll(u => u.Username == username);
        }
    }

    public string GetGroupName(int presentationId) => $"presentation-{presentationId}";

    public bool TryAddUser(int presentationId, string username)
    {
        var users = Presentations.GetOrAdd(presentationId, _ => new());
        if (users.Any(u => u.Username == username)) return false;

        users.Add(new User { Username = username });
        return true;
    }
}