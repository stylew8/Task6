namespace server.Hubs.Services.Interfaces;

public interface IPermissionService
{
    Task<List<Permission>> GetPermissions(int presentationId);
    Task UpdateEditPermission(int presentationId, string username, bool canEdit);
    Task<bool> HasEditPermission(int presId, string username);
}