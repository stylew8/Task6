﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using server.Repositories.Models;

#nullable disable

namespace server.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.12")
                .HasAnnotation("Relational:MaxIdentifierLength", 64);

            modelBuilder.Entity("server.Repositories.Models.Presentation", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<bool>("IsPresentMode")
                        .HasColumnType("tinyint(1)");

                    b.Property<DateTime>("ModifiedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("Id");

                    b.ToTable("Presentations");
                });

            modelBuilder.Entity("server.Repositories.Models.Slide", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    b.Property<string>("Content")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<DateTime>("ModifiedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<int>("PresentationId")
                        .HasColumnType("int");

                    b.Property<int>("Version")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("PresentationId");

                    b.ToTable("Slides");
                });

            modelBuilder.Entity("server.Repositories.Models.User", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<DateTime>("ModifiedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<string>("Username")
                        .IsRequired()
                        .HasColumnType("longtext");

                    b.HasKey("Id");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("server.Repositories.Models.UserPresentation", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    b.Property<bool>("CanEdit")
                        .HasColumnType("tinyint(1)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<bool>("IsOwner")
                        .HasColumnType("tinyint(1)");

                    b.Property<DateTime>("ModifiedAt")
                        .HasColumnType("datetime(6)");

                    b.Property<int>("PresentationId")
                        .HasColumnType("int");

                    b.Property<int>("UserId")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.HasIndex("PresentationId");

                    b.HasIndex("UserId");

                    b.ToTable("UserPresentation");
                });

            modelBuilder.Entity("server.Repositories.Models.Slide", b =>
                {
                    b.HasOne("server.Repositories.Models.Presentation", "Presentation")
                        .WithMany("Slides")
                        .HasForeignKey("PresentationId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Presentation");
                });

            modelBuilder.Entity("server.Repositories.Models.UserPresentation", b =>
                {
                    b.HasOne("server.Repositories.Models.Presentation", "Presentation")
                        .WithMany("UserPresentations")
                        .HasForeignKey("PresentationId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("server.Repositories.Models.User", "User")
                        .WithMany()
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Presentation");

                    b.Navigation("User");
                });

            modelBuilder.Entity("server.Repositories.Models.Presentation", b =>
                {
                    b.Navigation("Slides");

                    b.Navigation("UserPresentations");
                });
#pragma warning restore 612, 618
        }
    }
}
