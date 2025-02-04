using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using server.Hubs.Models;
using server.Hubs.Services.Interfaces;
using server.Repositories.Models;

namespace server.Hubs.Services;

public class SlideService : ISlideService
{
    private readonly AppDbContext context;
    private readonly IClientNotifier clientNotifier;

    public SlideService(AppDbContext context, IClientNotifier clientNotifier)
    {
        this.context = context;
        this.clientNotifier = clientNotifier;
    }

    public async Task<int> UpdateSlideContent(int presId, int slideId, string content, int expectedVersion)
    {
        var slide = await GetSlide(presId, slideId);
        if (slide == null) throw new Exception("Slide not found");
        //
        // if (slide.Version != expectedVersion)
        //     return slide.Version;

        slide.Content = content;
        slide.Version++;
        await context.SaveChangesAsync();

        return slide.Version;
    }

    public async Task<SlideDto> GetSlideContent(int presId, int slideId)
    {
        var slide = await GetSlide(presId, slideId);
        return new SlideDto()
        {
            Content = slide.Content,
            Version = slide.Version,
            SlideId = slideId
        };
    }

    public async Task AddNewSlide(int presId)
    {
        await context.Slides.AddAsync(new Slide
        {
            PresentationId = presId,
            Content = "[]"
        });
        await context.SaveChangesAsync();
    }

    public async Task NotifySlidesCountChanged(int presId)
    {
        var count = await GetSlidesCount(presId);
        await clientNotifier.NotifyGroup(Commands.SLIDES_COUNT_RECEIVED, presId, count);
    }

    public async Task<int> GetSlidesCount(int presId)
    {
        return await context.Slides
            .Where(x => x.PresentationId == presId)
            .CountAsync();
    }

    private async Task<Slide> GetSlide(int presId, int slideId)
    {
        return await context.Slides
            .Where(x => x.PresentationId == presId)
            .Skip(slideId)
            .FirstAsync();
    }

    public async Task<Slide> GetOrCreateFirstSlide(int presId)
    {
        var firstSlide = await context.Slides
            .FirstOrDefaultAsync(x => x.PresentationId == presId);

        if (firstSlide == null)
        {
            firstSlide = (await context.Slides.AddAsync(new Slide
            {
                Content = "[]",
                PresentationId = presId
            })).Entity;
            await context.SaveChangesAsync();
        }

        return firstSlide;
    }

    public async Task<IEnumerable<Slide>?> GetSlides(int presId)
    {
        return (
            await context
                .Presentations
                .Include(i => i.Slides)
                .FirstOrDefaultAsync(x => x.Id == presId)
        )?.Slides;
    }
}