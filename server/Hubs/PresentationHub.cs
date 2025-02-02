using Microsoft.AspNetCore.SignalR;
using server.Repositories.Models;
using System.Collections.Concurrent;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Text;
using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Crypto;
using server.Hubs.Models;
using server.Infastructure.Exceptions;
using Svg.Skia;

namespace server.Hubs;


public class PresentationHub : Hub
{
    private readonly AppDbContext context;
    private static readonly ConcurrentDictionary<int, List<User>> Presentations = new();

    private List<User> ConnectedUsers(int id)
    {
        if (!Presentations.ContainsKey(id))
        {
            Console.WriteLine($"[Server] Presentation with id {id} not found.");
            return new List<User>();
        }

        return Presentations[id];
    }
    private string GroupName(int id) => $"presentation-{id}";


    public PresentationHub(AppDbContext context)
    {
        this.context = context;
    }

    public async Task JoinPresentation(string id, string username)
    {
        int presentationId = int.Parse(id);

        if (presentationId == 0 || string.IsNullOrEmpty(username))
        {
            Console.WriteLine("[Server] Error: Invalid parameters.");
            return;
        }

        if (!context.Presentations.Any(x=>x.Id == presentationId))
        {
            throw new NotFoundException("Presentation was not created");
        }

        var presentation = Presentations.GetOrAdd(presentationId, _ => new());


        if (!ConnectedUsers(presentationId)
            .Any(u => u.Username == username))
        {
            ConnectedUsers(presentationId)
                .Add(new User() { Username = username });
        }
        
        //
        // Console.WriteLine(JsonConvert.SerializeObject(presentation.Slides));
        //

        await Groups
            .AddToGroupAsync(Context.ConnectionId, GroupName(presentationId));


        var firstSlide = await context
            .Slides
            .FirstOrDefaultAsync(x => x.PresentationId == presentationId);

        if (firstSlide == null)
        {
            firstSlide = (await context.Slides.AddAsync(new Slide()
            {
                Content = "[]",
                PresentationId = presentationId
            })).Entity;
        }

        await GetSlidesCount(presentationId);

        await Clients
            .Caller
            .SendAsync(
                Commands.SLIDE_UPDATED_COMMAND,
                0,
                firstSlide.Content
                );

        var user = await context.Users.FirstOrDefaultAsync(x => x.Username == username);

        if (user == null)
        {
            user = (await context.Users.AddAsync(new User()
            {
                Username = username
            })).Entity;

            await context.SaveChangesAsync();
        }

        var perm = await context
            .UserPresentation
            .FirstOrDefaultAsync(x => 
                x.User.Username == username && x.PresentationId == presentationId
                );

        if (perm == null)
        {
            perm = (await context.UserPresentation.AddAsync(new UserPresentation()
            {
                UserId = user.Id,
                PresentationId = presentationId,
                IsOwner = false,
                CanEdit = false
            })).Entity;

            await context.SaveChangesAsync();
        }


        List<Permission> permissions = await GetPermissions(presentationId, ConnectedUsers(presentationId));

        await Clients
            .Group(GroupName(presentationId))
            .SendAsync(
                Commands.USER_LIST_UPDATED,
                permissions
                );
    }

    public async Task UserDisconnect(string presentationId, string username)
    {
        if (int.TryParse(presentationId, out int presId))
        {
            if (Presentations.TryGetValue(presId, out var presentation))
            {
                var firstOrDefault = Presentations[presId].FirstOrDefault(x => x.Username == username);

                if (firstOrDefault != null) Presentations[presId].Remove(firstOrDefault);

                List<Permission> permissions = await GetPermissions(presId, ConnectedUsers(presId));

                await Clients
                    .Group(GroupName(presId))
                    .SendAsync(
                        Commands.USER_LIST_UPDATED,
                        permissions
                    );
            }
        }
    }

    private async Task<List<Permission>> GetPermissions(int presentationId, List<User> connectedUsers)
    {
        var connectedUsernames = connectedUsers.Select(user => user.Username).ToList();

        var userPresentation = await context.UserPresentation
            .Include(x => x.User)
            .Where(x => x.PresentationId == presentationId && connectedUsernames.Contains(x.User.Username))
            .ToListAsync();

        var result = userPresentation.Select(x => new Permission(
            x.User.Username,
            x.CanEdit,
            x.IsOwner
        )).ToList();

        return result;
    }

    public async Task SetUserEditPermission(string presentationId, string username, bool canEdit)
    {
        if (int.TryParse(presentationId, out int presId))
        {
            if (Presentations.TryGetValue(presId, out var presentation))
            {
                var user = context
                    .UserPresentation
                    .Include(x => x.User)
                    .FirstOrDefault(u => u.User.Username == username && u.PresentationId == presId);

                if (user != null)
                {
                    user.CanEdit = canEdit;

                    await context.SaveChangesAsync();
                }

                List<Permission> permissions = await GetPermissions(presId, ConnectedUsers(presId));

                await Clients.Group(GroupName(presId))
                    .SendAsync(
                        Commands.USER_LIST_UPDATED,
                        permissions
                    );
            }
        }
    }

    public async Task UpdateSlide(string presentationId, string username, int slideId, string svgContent)
    {
    
        int presId = int.Parse(presentationId);
    
        if (!Presentations.TryGetValue(presId, out var presentation))
        {
            return;
        }
    
        var user = await context
            .UserPresentation
            .Include(x=>x.Presentation)
                .ThenInclude(x=>x.Slides)
            .FirstOrDefaultAsync(x =>
                x.Presentation.Id == presId && x.User.Username == username
                );
    
        if (user == null || !user.CanEdit)
        {
            Console.WriteLine($"User {username} does not have permission to edit.");
            return;
        }
    
        var slide = user.Presentation.Slides[slideId];

        if (slide.Content != svgContent)
        {
            
            slide.Content = svgContent;
        
            await context.SaveChangesAsync();
            
        
            if (slide == null)
            {
                Console.WriteLine($"Slide with ID {slideId} not found.");
                return;
            }
        
            await GetSlidesCount(presId);

        
            await Clients
                .Group(GroupName(presId))
                .SendAsync(
                    Commands.SLIDE_UPDATED_COMMAND,
                    slideId,
                    svgContent
                    );
        }
    }



    public async Task GetSlide(string presentationId, int slideId)
    {
        if (int.TryParse(presentationId, out int presId))
        {
            var slides = await context.Slides.Where(x => x.PresentationId == presId).ToListAsync();

            var slide = slides[slideId];

            await Clients
                .Caller
                .SendAsync(
                    Commands.SLIDE_RECEIVED_COMMAND,
                    slide.Content
                );
            
        }
    }

    public async Task AddSlide(string presentationId)
    {
        var id = int.Parse(presentationId);

        await context.Slides.AddAsync(new Slide()
        {
            PresentationId = id,
            Content = "[]"
        });

        await context.SaveChangesAsync();

        await GetSlidesCount(id);
    }

    public async Task GetSlidesCount(int presentationId)
    {
        var slidesCount = (await context
            .Slides
            .Where(x=>x.PresentationId == presentationId)
            .ToListAsync())
            .Count;

        await Clients
            .Groups(GroupName(presentationId))
            .SendAsync(Commands.SLIDES_COUNT_RECEIVED, slidesCount);
    }
}

public record Permission(string Username, bool CanEdit, bool IsOwner);