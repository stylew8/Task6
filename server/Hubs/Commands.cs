namespace server.Hubs;

public static class Commands
{
    public const string JOIN_PRESENTATION_COMMAND = "JoinPresentation";
    public const string USER_JOINED_COMMAND = "UserJoined";

    public const string USER_LIST_UPDATED = "UserListUpdated";
    public const string USER_DISCONNECTED_COMMAND = "UserDisconnected";

    public const string SLIDE_UPDATED_COMMAND = "SlideUpdated";
    public const string UPDATE_SLIDE_COMMAND = "UpdateSlide";

    public const string GET_SLIDE_COMMAND = "GetSlide";
    public const string SLIDE_RECEIVED_COMMAND = "SlideReceived";

    public const string GET_SLIDES_COUNT_COMMAND = "GetSlidesCount";
    public const string SLIDES_COUNT_RECEIVED = "SlidesCountReceived";

    public const string NEXT_SLIDE = "NextSlide";
    public const string NEXT_SLIDE_RECEIVED = "NextSlideReceived";

    public const string PREV_SLIDE = "PrevSlide";
    public const string PREV_SLIDE_RECEIVED = "PrevSlideReceived";

    public const string ON_SLIDE_CHANGED = "OnSlideChanged";
}