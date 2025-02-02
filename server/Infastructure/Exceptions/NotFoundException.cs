using System.Net;

namespace server.Infastructure.Exceptions;

public class NotFoundException : ServiceException
{
    public NotFoundException(string title):base(title, (int)HttpStatusCode.NotFound)
    {
        
    }
}