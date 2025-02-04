using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using server.Hubs.Services;
using server.Hubs.Services.Interfaces;
using server.Infastructure.Exceptions;
using server.Migrations;
using server.Repositories.Models;

namespace server.Hubs;

public partial class PresentationHub : Hub
{
    private readonly IPresentationManager presentationManager;
    private readonly IPermissionService permissionService;
    private readonly ISlideService slideService;
    private readonly IUserService userService;
    private readonly IClientNotifier clientNotifier;
    private readonly AppDbContext context;
    private readonly ILogger<PresentationHub> logger;

    public PresentationHub(
        IPresentationManager presentationManager,
        IPermissionService permissionService,
        ISlideService slideService,
        IUserService userService,
        IClientNotifier clientNotifier,
        AppDbContext context, ILogger<PresentationHub> logger)
    {
        this.presentationManager = presentationManager;
        this.permissionService = permissionService;
        this.slideService = slideService;
        this.userService = userService;
        this.clientNotifier = clientNotifier;
        this.context = context;
        this.logger = logger;
    }

    public async Task JoinPresentation(string id, string username)
    {
        var (presId, valid) = await ValidateRequest(id, username);
        if (!valid) return;

        await userService.EnsureUserExists(username);
        await userService.EnsureUserPresentationPermissionsAsync(presId, username);
        await HandleGroupJoining(presId, username);
        await UpdatePermissionsAndNotify(presId);
        await slideService.NotifySlidesCountChanged(presId);
        await GetSlide(id, 0);

    }

    public async Task UserDisconnect(string presentationId, string username)
    {
        if (!int.TryParse(presentationId, out int presId)) return;

        presentationManager.RemoveUser(presId, username);
        await UpdatePermissionsAndNotify(presId);
    }

    public async Task SetUserEditPermission(string presentationId, string username, bool canEdit)
    {
        if (!int.TryParse(presentationId, out int presId)) return;

        await permissionService.UpdateEditPermission(presId, username, canEdit);
        await UpdatePermissionsAndNotify(presId);
    }

    public async Task UpdateSlide(string presentationId, string username, int slideId, string svgContent, int expectedVersion)
    {
        var (presId, valid) = await ValidateSlideUpdate(presentationId, username, slideId);
        if (!valid) return;

        var newVersion = await slideService.UpdateSlideContent(presId, slideId, svgContent, expectedVersion);
        await clientNotifier.NotifySlideUpdated(presId, slideId, svgContent, newVersion);
        await slideService.NotifySlidesCountChanged(presId);
    }

    public async Task GetSlide(string presentationId, int slideId)
    {
        if (!int.TryParse(presentationId, out int presId)) return;

        var content = await slideService.GetSlideContent(presId, slideId);
        await clientNotifier.SendToCaller(Commands.SLIDE_RECEIVED_COMMAND, Context, content);
    }

    public async Task AddSlide(string presentationId)
    {
        var presId = int.Parse(presentationId);
        await slideService.AddNewSlide(presId);
        await slideService.NotifySlidesCountChanged(presId);
    }

    private async Task UpdatePermissionsAndNotify(int presId)
    {
        var permissions = await permissionService.GetPermissions(presId);
        await clientNotifier.NotifyGroup(Commands.USER_LIST_UPDATED, presId, permissions);
    }

    private async Task<(int presId, bool valid)> ValidateRequest(string id, string username)
    {
        if (!int.TryParse(id, out int presId) || presId == 0 || string.IsNullOrEmpty(username))
        {
            Console.WriteLine("[Server] Error: Invalid parameters.");
            return (0, false);
        }

        if (!await context.Presentations.AnyAsync(x => x.Id == presId))
        {
            throw new NotFoundException("Presentation was not created");
        }

        return (presId, true);
    }

    private async Task HandleGroupJoining(int presId, string username)
    {
        if (presentationManager.TryAddUser(presId, username))
        {
            await clientNotifier.AddToGroup(Context.ConnectionId, presId);
        }
    }

    private async Task SendInitialSlideData(int presId, string username)
    {
        var firstSlide = await slideService.GetOrCreateFirstSlide(presId);
        await clientNotifier.SendInitialSlideData(Context, presId, firstSlide);
    }

    private async Task<(int presId, bool valid)> ValidateSlideUpdate(
        string presentationId,
        string username,
        int slideId)
    {
        var (presId, valid) = await ValidateRequest(presentationId, username);
        if (!valid) return (0, false);

        var hasPermission = await permissionService.HasEditPermission(presId, username);
        return (presId, hasPermission);
    }
}