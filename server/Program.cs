
using Microsoft.EntityFrameworkCore;
using server.Hubs;
using server.Hubs.Services;
using server.Hubs.Services.Interfaces;
using server.Repositories.Models;

namespace server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.SetMinimumLevel(LogLevel.Debug);

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseMySQL(
                    builder.Configuration.GetConnectionString("Default") ?? ""
                )
            );

            builder.Services.AddSignalR(options =>
            {
                options.MaximumReceiveMessageSize = 1048576;
            });

            builder.Services.AddScoped<IClientNotifier, ClientNotifier>();
            builder.Services.AddScoped<IPermissionService, PermissionService>();
            builder.Services.AddScoped<IPresentationManager, PresentationManager>();
            builder.Services.AddScoped<ISlideService, SlideService>();
            builder.Services.AddScoped<IUserService, UserService>();

            builder.Services.AddCors(cors =>
                cors.AddDefaultPolicy(d =>
                    d.WithOrigins("http://localhost:3000", "https://tkti.lt", "https://uniqum.school")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                )
            );

            builder.Services.AddControllers();

            var app = builder.Build();

            app.Use(async (context, next) =>
            {
                try
                {
                    await next();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Global exception: {ex.Message} \n {ex.StackTrace}");
                    throw;
                }
            });


            app.UseCors();

            app.UseAuthorization();

            app.MapControllers();

            app.MapHub<PresentationHub>("/presentationHub");
            app.MapHub<PresentModeHub>("/presentModeHub");

            app.Run();
        }
    }
}
