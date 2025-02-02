namespace server.Infastructure.Exceptions;

public class ServiceException : Exception
{
    public ServiceException(string title, int status)
    {
        Title = title;
        Status = status;
    }

    public string Title { get; set; }
    public int Status { get; set; }
}