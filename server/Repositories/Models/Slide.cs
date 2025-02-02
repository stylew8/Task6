using System.ComponentModel.DataAnnotations.Schema;

namespace server.Repositories.Models;

public class Slide : Entity
{
    public int PresentationId { get; set; }

    public Presentation Presentation { get; set; }

    //[Column(TypeName = "json")]
    public string Content { get; set; }
}