using Microsoft.EntityFrameworkCore;
using server.Hubs.Services.Interfaces;
using server.Repositories.Models;

namespace server.Hubs.Services;

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _context;
    private readonly IPresentationManager _presentationManager;

    public PermissionService(
        AppDbContext context,
        IPresentationManager presentationManager)
    {
        _context = context;
        _presentationManager = presentationManager;
    }

    public async Task<List<Permission>> GetPermissions(int presentationId)
    {
        var connectedUsers = _presentationManager.GetConnectedUsers(presentationId);
        var usernames = connectedUsers.Select(u => u.Username).ToList();

        var userPresentations = await _context.UserPresentation
            .Include(x => x.User)
            .Where(x => x.PresentationId == presentationId && usernames.Contains(x.User.Username))
            .ToListAsync();

        return userPresentations.Select(x => new Permission(
            x.User.Username,
            x.CanEdit,
            x.IsOwner
        )).ToList();
    }

    public async Task UpdateEditPermission(int presentationId, string username, bool canEdit)
    {
        var userPresentation = await _context.UserPresentation
            .Include(x => x.User)
            .FirstOrDefaultAsync(x =>
                x.User.Username == username &&
                x.PresentationId == presentationId);

        if (userPresentation != null)
        {
            userPresentation.CanEdit = canEdit;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasEditPermission(int presId, string username)
    {
        var permission = await _context.UserPresentation
            .Include(x => x.User)
            .FirstOrDefaultAsync(x =>
                x.PresentationId == presId &&
                x.User.Username == username);

        return permission?.CanEdit ?? false;
    }
}

public record Permission(string Username, bool CanEdit, bool isOwner);