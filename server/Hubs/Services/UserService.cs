using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Asn1.Ocsp;
using server.Hubs.Services.Interfaces;
using server.Infastructure.Exceptions;
using server.Repositories.Models;

namespace server.Hubs.Services;

public class UserService : IUserService
{
    private readonly AppDbContext context;

    public UserService(AppDbContext context)
    {
        this.context = context;
    }

    public async Task<User> EnsureUserExists(string username)
    {
        var user = await context.Users.FirstOrDefaultAsync(x => x.Username == username);
        if (user == null)
        {
            user = (await context.Users.AddAsync(new User { Username = username })).Entity;
            await context.SaveChangesAsync();
        }

        return user;
    }

    public async Task EnsureUserPresentationPermissionsAsync(int presentationId, string username)
    {
        var user = await context.Users.FirstAsync(x => x.Username == username);
        var exists = await context.UserPresentation
            .AnyAsync(x => x.UserId == user.Id && x.PresentationId == presentationId);

        if (!exists)
        {
            await context.UserPresentation.AddAsync(new UserPresentation
            {
                UserId = user.Id,
                PresentationId = presentationId,
                IsOwner = false,
                CanEdit = false
            });
            await context.SaveChangesAsync();
        }
    }

    public async Task<Presentation> CreatePresentationAsync(Presentation presentation)
    {
        var presentationEntity = (await context.Presentations.AddAsync(presentation)).Entity;

        await context.SaveChangesAsync();

        await context.Slides.AddAsync(new Slide()
        {
            Content = "[]",
            PresentationId = presentationEntity.Id,
            Version = 0
        });
        await context.SaveChangesAsync();


        return presentationEntity;
    }

    public async Task<UserPresentation> CreateUserPresentation(UserPresentation userPresentation)
    {
       var userPres = (await context.UserPresentation.AddAsync(userPresentation)).Entity;

       await context.SaveChangesAsync();

       return userPres;
    }

    public async Task ChangePresentationMode(int presentationId, bool isEnable)
    {
        var presentation = await context.Presentations.FirstOrDefaultAsync(x => x.Id == presentationId);

        if (presentation == null)
        {
            throw new NotFoundException("Presentation was not found");
        }

        presentation.IsPresentMode = isEnable;

        await context.SaveChangesAsync();
    }

    public async Task CheckStatusMode(int requestPresentationId, string requestUsername)
    {
        var presentation = await context.Presentations
            .Include(x => x.UserPresentations)
            .ThenInclude(userPresentation => userPresentation.User).FirstOrDefaultAsync(x => x.Id == requestPresentationId);

        if (presentation == null || !presentation.IsPresentMode)
        {
            throw new NotFoundException("Presentation not exists or not in present mode");
        }

        var permission = presentation.UserPresentations.FirstOrDefault(x => x.User.Username == requestUsername);

        if (permission == null || !permission.IsOwner)
        {
            throw new UnauthorizedAccessException("Permission denied");
        }
    }
}