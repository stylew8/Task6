using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Hubs.Services.Interfaces;
using server.Infastructure.Exceptions;
using server.Repositories.Models;

namespace server.Controllers;

[Controller]
public class PresentationController : ControllerBase
{
    private readonly AppDbContext context;
    private readonly IUserService userService;
    private readonly ISlideService slideService;

    public PresentationController(
        AppDbContext context,
        IUserService userService,
        ISlideService slideService)
    {
        this.context = context;
        this.userService = userService;
        this.slideService = slideService;
    }

    [HttpGet]
    [Route("/presentations")]
    public async Task<ActionResult<IEnumerable<Presentation>>> GetPresentations(GetPresentationsRequest request)
    {

        var presentations = await context
            .Presentations
            .Include(x => x.UserPresentations)
            .ThenInclude(u=>u.User)
            .Select(p => new
            {
                p.Id,
                p.Title,
                Uploaded = p.CreatedAt.Date.ToString("yyyy-MM-dd"),
                Author = p.UserPresentations.Select(x=>x.User.Username).FirstOrDefault(),
                Grant = p.UserPresentations.Where(w=>w.User.Username == request.Username).Any(s=>s.IsOwner)

            })
            .ToListAsync();

        return Ok(presentations);

    }

    [HttpPost]
    [Route("/presentations")]
    public async Task<IActionResult> CreatePresentation([FromBody] CreatePresentationRequest request)
    {
        var presentation = await userService.CreatePresentationAsync(new Presentation()
        {
            Title = request.Title
        });

        string username = HttpContext.Request?.Headers["Authorization"];
        int userId = 0;

        if (!string.IsNullOrEmpty(username))
        {
           userId = (await userService.EnsureUserExists(username)).Id;
        }

        await userService.CreateUserPresentation(new UserPresentation()
        {
            PresentationId = presentation.Id,
            UserId = userId,
            CanEdit = true,
            IsOwner = true

        });
        

        return Ok(new CreatePresentationResponse(presentation.Id));
    }

    [HttpGet("{presentationId}/slides")]
    public async Task<IActionResult> GetSlides(GetSlidesRequest request)
    {
        var slides = await slideService.GetSlides(request.presentationId);
        if (slides is null || !slides.Any())
            return NotFound();

        return Ok(slides.Select(x=>x.Content));
    }

    [HttpPost]
    [Route("presentation/modeStatus")]
    public async Task<IActionResult> ChangeModeStatus([FromBody] ChangeModeStatusRequest request)
    {
        await userService.ChangePresentationMode(request.PresentationId, request.IsEnable);

        return Ok();
    }

    [HttpPost]
    [Route("presentation/modeStatus/check")]
    public async Task<IActionResult> CheckStatusMode([FromBody] CheckStatusModeRequest request)
    {
        await userService.CheckStatusMode(request.PresentationId, request.Username);

        return Ok();
    }
}

public record CheckStatusModeRequest(int PresentationId, string Username);
public record ChangeModeStatusRequest(int PresentationId, bool IsEnable);
public record GetSlidesRequest(int presentationId);
public record CreatePresentationRequest(string Title);
public record CreatePresentationResponse(int Id);
public record GetPresentationsRequest(string Username);