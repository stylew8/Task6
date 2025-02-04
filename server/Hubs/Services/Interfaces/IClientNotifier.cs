using Microsoft.AspNetCore.SignalR;
using server.Repositories.Models;

namespace server.Hubs.Services.Interfaces;

public interface IClientNotifier
{
    Task NotifySlideUpdated(int presId, int slideId, string content, int newVersion);
    Task NotifySlidesCountChanged(int presId);
    Task SendToCaller<T>(string method, HubCallerContext context, T message);
    Task NotifyGroup<T>(string method, int presId, T message);
    Task AddToGroup(string connectionId, int presId);
    Task SendInitialSlideData(HubCallerContext context, int presId, Slide slide);
}