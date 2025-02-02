using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Repositories.Models;

namespace server.Controllers;

[Controller]
public class PresentationController : ControllerBase
{
    private readonly AppDbContext _context;

    public PresentationController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Route("/presentations")]
    public async Task<ActionResult<IEnumerable<Presentation>>> GetPresentations(GetPresentationsRequest request)
    {

        var presentations = await _context
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
        var presentation = (await _context.Presentations.AddAsync(new Presentation()
        {
            Title = request.Title
        })).Entity;

        await _context.SaveChangesAsync();

        string authorizationHeader = HttpContext.Request?.Headers["Authorization"];
        int userId = 0;

        if (!string.IsNullOrEmpty(authorizationHeader))
        {
            var user = await _context.Users.FirstOrDefaultAsync(x => x.Username == authorizationHeader);

            if (user == null)
            {
                user = (await _context.Users.AddAsync(new User() { Username = authorizationHeader })).Entity;

                await _context.SaveChangesAsync();
            }
            userId = user.Id;
        }

        await _context.UserPresentation.AddAsync(new UserPresentation()
        {
            PresentationId = presentation.Id,
            UserId = userId,
            CanEdit = true,
            IsOwner = true

        });


        await _context.SaveChangesAsync();

        return Ok(new CreatePresentationResponse(presentation.Id));
    }
}

public record CreatePresentationRequest(string Title);
public record CreatePresentationResponse(int Id);
public record GetPresentationsRequest(string Username);