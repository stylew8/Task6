using server.Hubs.Models;
using server.Repositories.Models;

namespace server.Hubs.Services.Interfaces;

public interface ISlideService
{
    Task<int> UpdateSlideContent(int presId, int slideId, string content, int expectedVersion);
    Task<SlideDto> GetSlideContent(int presId, int slideId);
    Task AddNewSlide(int presId);
    Task NotifySlidesCountChanged(int presId);
    Task<int> GetSlidesCount(int presId);
    Task<Slide> GetOrCreateFirstSlide(int presId);
    Task<IEnumerable<Slide>?> GetSlides(int presId);
}