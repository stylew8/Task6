using server.Repositories.Models;

namespace server.Hubs.Services.Interfaces;

public interface IUserService
{
    Task<User> EnsureUserExists(string username);
    Task EnsureUserPresentationPermissionsAsync(int presentationId, string username);
    Task<Presentation> CreatePresentationAsync(Presentation presentation);
    Task<UserPresentation> CreateUserPresentation(UserPresentation userPresentation);
    Task ChangePresentationMode(int presentationId, bool isEnable);
    Task CheckStatusMode(int requestPresentationId, string requestUsername);
}