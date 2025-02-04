using Microsoft.AspNetCore.SignalR;

namespace server.Hubs;

public class PresentModeHub : Hub
{
    public async Task JoinPresentation(string presentationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, presentationId);
    }

    public async Task LeavePresentation(string presentationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, presentationId);
    }

    public async Task SetSlide(string presentationId, int slideIndex)
    {
        // Здесь можно дополнительно сделать валидацию: 
        // проверка, что slideIndex не выходит за границы и т.д.
        await Clients.Group(presentationId).SendAsync(Commands.ON_SLIDE_CHANGED, slideIndex);
    }
}