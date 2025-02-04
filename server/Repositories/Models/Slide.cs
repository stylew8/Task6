using System.ComponentModel.DataAnnotations;

namespace server.Repositories.Models;

public class Slide : Entity
{
    public int PresentationId { get; set; }

    public Presentation Presentation { get; set; }

    public string Content { get; set; }

    public int Version { get; set; }
}