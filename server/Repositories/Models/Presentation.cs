namespace server.Repositories.Models;

public class Presentation : Entity
{
    public string Title { get; set; }

    public List<Slide> Slides { get; set; } = new();

    public List<UserPresentation> UserPresentations { get; set; } = new();
}