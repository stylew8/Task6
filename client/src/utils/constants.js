export const USERNAME_LOCALSTORAGE = "username";
export const API_URL = "http://localhost:5000/";
export const PRESENTATION_HUB = "presentationHub";
export const PRESENT_MODE_HUB = "presentModeHub";

export const PRESENTATION_URL = "/presentation/"











export const DISCONNECTED_STATE = "Disconnected";
export const CONNECTED_STATE = "Connected";

export const JOIN_PRESENTATION_COMMAND = "JoinPresentation";
export const USER_LIST_UPDATED = "UserListUpdated";

export const USER_JOINED_COMMAND = "UserJoined";
export const USER_DISCONNECTED_COMMAND = "UserDisconnected";

export const SLIDE_UPDATED_COMMAND = "SlideUpdated";
export const UPDATE_SLIDE_COMMAND = "UpdateSlide";

export const GET_SLIDE_COMMAND = "GetSlide";
export const SLIDE_RECEIVED_COMMAND = "SlideReceived";

export const GET_SLIDES_COUNT_COMMAND = "GetSlidesCount";
export const SLIDES_COUNT_RECEIVED = "SlidesCountReceived";

export const NEXT_SLIDE = "NextSlide";
export const NEXT_SLIDE_RECEIVED = "NextSlideReceived";

export const PREV_SLIDE = "PrevSlide";
export const PREV_SLIDE_RECEIVED = "PrevSlideReceived";

export const SLIDE_ADD_COMMAND = "AddSlide";
export const SLIDE_ADDED_COMMAND = "SlideAdded";

export const SET_USER_EDIT_PERMISSION = "SetUserEditPermission";
export const ON_SLIDE_CHANGED = "OnSlideChanged";
export const LEAVE_PRESENTATION = "LeavePresentation";
export const SET_SLIDE = "SetSlide";

export const PRESENT_MODE_URL = (id, isPresenter) => `/presentMode/${id}/${isPresenter}`;

export const PRESENTATION_MODE_STATUS_API = "presentation/modeStatus";
export const PRESENTATION_MODE_STATUS_CHECK_API = "presentation/modeStatus/check";