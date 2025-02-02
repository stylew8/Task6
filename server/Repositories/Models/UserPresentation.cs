namespace server.Repositories.Models
{
    public class UserPresentation : Entity
    {
        public User User { get; set; }

        public int UserId { get; set; }

        public Presentation Presentation { get; set; }
        public int PresentationId { get; set; }

        public bool IsOwner { get; set; }

        public bool CanEdit { get; set; }
    }
}
