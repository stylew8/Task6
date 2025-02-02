using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Migrations.Internal;

namespace server.Repositories.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        
    }

    public DbSet<Presentation> Presentations { get; set; }

    public DbSet<Slide> Slides { get; set; }

    public DbSet<User> Users { get; set; }

    public DbSet<UserPresentation> UserPresentation { get; set; }
}