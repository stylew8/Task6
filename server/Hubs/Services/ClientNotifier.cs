using Microsoft.AspNetCore.SignalR;
using server.Hubs.Services.Interfaces;
using server.Repositories.Models;

namespace server.Hubs.Services;

public class ClientNotifier : IClientNotifier
{
    private readonly IHubContext<PresentationHub> _hubContext;
    private readonly IPresentationManager _presentationManager;

    public ClientNotifier(
        IHubContext<PresentationHub> hubContext,
        IPresentationManager presentationManager)
    {
        _hubContext = hubContext;
        _presentationManager = presentationManager;
    }

    public async Task NotifySlideUpdated(int presId, int slideId, string content, int newVersion)
    {
        await _hubContext.Clients
            .Group(_presentationManager.GetGroupName(presId))
            .SendAsync(Commands.SLIDE_UPDATED_COMMAND, slideId, content, newVersion);
    }

    public async Task NotifySlidesCountChanged(int presId)
    {
        await _hubContext.Clients
            .Group(_presentationManager.GetGroupName(presId))
            .SendAsync(Commands.SLIDES_COUNT_RECEIVED);
    }

    public async Task SendToCaller<T>(string method, HubCallerContext context, T message)
    {
        await _hubContext.Clients
            .Client(context.ConnectionId)
            .SendAsync(method, message);
    }

    public async Task NotifyGroup<T>(string method, int presId, T message)
    {
        await _hubContext.Clients
            .Group(_presentationManager.GetGroupName(presId))
            .SendAsync(method, message);
    }

    public async Task AddToGroup(string connectionId, int presId)
    {
        await _hubContext.Groups.AddToGroupAsync(
            connectionId,
            _presentationManager.GetGroupName(presId)
        );
    }

    public async Task SendInitialSlideData(HubCallerContext context, int presId, Slide slide)
    {
        await SendToCaller(
            Commands.SLIDE_UPDATED_COMMAND,
            context,
            new { SlideId = 0, Content = slide.Content }
        );
    }
}