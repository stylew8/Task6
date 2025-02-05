import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as fabric from 'fabric';
import { Button, Dropdown } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import * as signalR from "@microsoft/signalr";
import * as constants from "../utils/constants";
import debounce from 'lodash.debounce';
import { usePostApi } from '../utils/useApi';

const MODE_DRAW = "draw";
const MODE_SELECT = "select";
const VISIBLE = "visible";
const WHITE_COLOR = "#fff"

const DEFAULT_BRUSH_WIDTH = 3;
const DEFAULT_BRUSH_COLOR = "black";

const RECT_LEFT = 50;
const RECT_TOP = 50;
const RECT_WIDTH = 100;
const RECT_HEIGHT = 100;
const RECT_FILL_COLOR = "blue";

const CIRCLE_LEFT = 100;
const CIRCLE_TOP = 100;
const CIRCLE_RADIUS = 50;
const CIRCLE_FILL_COLOR = "red";

const TEXT_LEFT = 150;
const TEXT_TOP = 150;
const TEXT_FONT_SIZE = 20;
const TEXT_FILL_COLOR = "black";
const TEXT_PLACEHOLDER = "Enter text";

const LINE_POINTS = [50, 50, 150, 50];
const LINE_STROKE_WIDTH = 5;
const LINE_STROKE_COLOR = "black";


function PresentationEditor() {
  const { id } = useParams();

  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [tool, setTool] = useState("select");
  const [currentSlideId, setCurrentSlideId] = useState(0);
  const [userPermissions, setUserPermissions] = useState({});
  const [currentUser, setCurrentUser] = useState(localStorage.getItem(constants.USERNAME_LOCALSTORAGE));
  const [currentUserPermission, setCurrentUserPermission] = useState(null);
  const [slidesCount, setSlidesCount] = useState(0);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);

  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const connectionRef = useRef(null);
  const currentUserPermissionRef = useRef(currentUserPermission);
  const currentSlideIdRef = useRef(currentSlideId);
  const isConnectedRef = useRef(isConnected);




  const debouncedSave = debounce(() => {
    handleSave();
  }, 2000);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete') {
        handleDelete();
      }
    };

    const handleWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        if (event.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false }); 

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    if (fabricCanvas.current) {
      const handleObjectModified = () => {
        if (isAutoSaveEnabled) {
          debouncedSave();
        }
      };

      fabricCanvas.current.on('object:modified', handleObjectModified);
      fabricCanvas.current.on('object:added', handleObjectModified);

      return () => {
        fabricCanvas.current.off('object:modified', handleObjectModified);
        fabricCanvas.current.off('object:added', handleObjectModified);
      };
    }
  }, [isAutoSaveEnabled]);

  useEffect(() => {
    currentUserPermissionRef.current = currentUserPermission;
  }, [currentUserPermission]);

  useEffect(() => {
    currentSlideIdRef.current = currentSlideId;
  }, [currentSlideId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (connectionRef.current) {
        connectionRef.current.invoke("UserDisconnect", id.toString(), currentUser);
        connectionRef.current.stop();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [connectionRef, id, currentUser]);

  useEffect(() => {
    if (!connectionRef.current) {
      try {
        connectionRef.current = new signalR.HubConnectionBuilder()
          .withUrl(`${constants.API_URL}${constants.PRESENTATION_HUB}`, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Information)
          .build();
      } catch (error) {
        console.log(error);
      }
    }

    const connection = connectionRef.current;

    if (connection.state === constants.DISCONNECTED_STATE) {
      connection.start()
        .then(() => {
        })
        .then(() => {
          isConnectedRef.current = true;
          setIsConnected(true);

          const username = localStorage.getItem(constants.USERNAME_LOCALSTORAGE);
          if (!username) return;

          connection.invoke(constants.JOIN_PRESENTATION_COMMAND, id, username)
            .then(() => {
              isConnectedRef.current = true;
            })
            .catch(err => {
              console.error(constants.JOIN_PRESENTATION_COMMAND, " ", err);
              window.location.href = "/";
            });
        })
        .catch(err => console.error("🚨 Error connecting to SignalR:", err));
    }

    connection.on(constants.USER_JOINED_COMMAND, (username) => {
      setUsers(prevUsers => (prevUsers.includes(username) ? prevUsers : [...prevUsers, username]));
    });

    connection.on(constants.USER_LIST_UPDATED, (updatedUsers) => {
      const permissions = {};

      updatedUsers.forEach(user => {
        permissions[user.username] = user.canEdit;
      });


      const foundUser = updatedUsers.find(user => user.username === currentUser);

      if (foundUser) {
        const currentUserPermission = {
          canEdit: foundUser.canEdit,
          isOwner: foundUser.isOwner
        };

        setCurrentUserPermission(currentUserPermission);
      }

      setUserPermissions(permissions);
      setUsers(updatedUsers);
    });

    connection.on(constants.SLIDE_UPDATED_COMMAND, (slideId, content, version) => {
      if (version > currentVersion) {
        try {
          const parsedJSON = JSON.parse(content);

          if (parsedJSON != null && currentSlideIdRef.current === slideId) {
            loadFabric(parsedJSON);
          }
          setCurrentVersion(version);
        } catch (error) {
          console.error("❌ Failed to parse or load JSON content:", error);
        }
      }
    });

    const loadFabric = (parsedJSON) => {
      fabricCanvas.current.clear();
      fabricCanvas.current.loadFromJSON(parsedJSON, () => {
        fabricCanvas.current.requestRenderAll();

        fabricCanvas.current.getObjects().forEach(obj => {
          obj.set(VISIBLE, true);
        });
      });
    }

    connection.on(constants.SLIDES_COUNT_RECEIVED, (slidesCount) => {
      setSlidesCount(slidesCount);
    });

    connection.on(constants.SLIDE_RECEIVED_COMMAND, (resp) => {
      try {
        console.log(currentVersion);

        if (resp != null) {
          loadFabric(resp.content);

          setCurrentVersion(resp.version);
        }
      } catch (error) {
        console.error("❌ Failed to parse or load JSON content:", error);
      }
    });

    if (!fabricCanvas.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        backgroundColor: WHITE_COLOR,
      });

      fabricCanvas.current.setWidth(window.innerWidth * 0.8);
      fabricCanvas.current.setHeight(window.innerHeight * 0.92);

      fabricCanvas.current.on('selection:created', (e) => setSelectedObject(e.selected[0]));
      fabricCanvas.current.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
      fabricCanvas.current.on('selection:cleared', () => setSelectedObject(null));
    }

    return () => {
      if (connection.state === constants.CONNECTED_STATE) {
        connection.stop().then(() => setIsConnected(false));
      }
      if (fabricCanvas.current) {
        fabricCanvas.current.off('object:modified');
        fabricCanvas.current.off('object:added');
        fabricCanvas.current.off('object:removed');

        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, []);

  const handleSave = () => {
    if (isConnectedRef.current && connectionRef.current?.state === constants.CONNECTED_STATE) {
      const jsonString = JSON.stringify(fabricCanvas.current.toJSON());

      console.log(currentVersion);

      connectionRef.current.invoke(
        constants.UPDATE_SLIDE_COMMAND,
        id.toString(),
        currentUser,
        currentSlideIdRef.current,
        jsonString,
        currentVersion
      )
        .catch(err => console.error("🚨 Ошибка при обновлении слайда:", err));

    } else {
      console.error("🚨 Нет подключения или прав на редактирование.");
    }
  };


  const setDrawingMode = (mode) => {
    setTool(mode);
  
    if (fabricCanvas.current) {
      if (mode === MODE_DRAW) {
        fabricCanvas.current.isDrawingMode = true;
        fabricCanvas.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.current);
        fabricCanvas.current.freeDrawingBrush.width = DEFAULT_BRUSH_WIDTH;
        fabricCanvas.current.freeDrawingBrush.color = DEFAULT_BRUSH_COLOR;
      } else {
        fabricCanvas.current.isDrawingMode = false;
      }
  
      fabricCanvas.current.renderAll();
    }
  };

  const addRectangle = () => {
    if (fabricCanvas.current) {
      const rect = new fabric.Rect({
        left: RECT_LEFT,
        top: RECT_TOP,
        fill: RECT_FILL_COLOR,
        width: RECT_WIDTH,
        height: RECT_HEIGHT,
      });

      fabricCanvas.current.add(rect);
      setDrawingMode(MODE_SELECT);
    }
  };

  const addCircle = () => {
    if (fabricCanvas.current) {
      const circle = new fabric.Circle({
        left: CIRCLE_LEFT,
        top: CIRCLE_TOP,
        fill: CIRCLE_FILL_COLOR,
        radius: CIRCLE_RADIUS,
      });

      fabricCanvas.current.add(circle);
      setDrawingMode(MODE_SELECT);
    }
  };

  const addText = () => {
    if (fabricCanvas.current) {
      const text = new fabric.Textbox(TEXT_PLACEHOLDER, {
        left: TEXT_LEFT,
        top: TEXT_TOP,
        fontSize: TEXT_FONT_SIZE,
        fill: TEXT_FILL_COLOR,
      });

      fabricCanvas.current.add(text);
      setDrawingMode(MODE_SELECT);
    }
  };

  const addArrow = () => {
    if (fabricCanvas.current) {
      const line = new fabric.Line(LINE_POINTS, {
        stroke: LINE_STROKE_COLOR,
        strokeWidth: LINE_STROKE_WIDTH,
        selectable: true,
      });

      fabricCanvas.current.add(line);
      setDrawingMode(MODE_SELECT);
    }
  };

  const addSlide = () => {
    connectionRef.current.invoke(constants.SLIDE_ADD_COMMAND, id.toString());
  };

  const loadSlide = (index) => {
    setCurrentSlideId(index);

    connectionRef.current.invoke(constants.GET_SLIDE_COMMAND, id.toString(), index);

  };

  const toggleEditPermission = (username) => {
    if (isConnectedRef.current && currentUser) {
      const canEdit = !userPermissions[username];
      connectionRef.current.invoke(constants.SET_USER_EDIT_PERMISSION, id.toString(), username, canEdit)
        .catch(err => console.error("🚨 Error setting user permissions:", err));
    }
  };

  const post = usePostApi();

  const handlePresentMode = async () => {
    let isEnable = true;

    await post(`${constants.PRESENTATION_MODE_STATUS_API}`, {
      presentationId: id,
      isEnable: isEnable
    });

    connectionRef.current.stop();
    window.location.href = constants.PRESENT_MODE_URL(id, isEnable);
  }

  const handleDelete = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects?.length) {
      canvas.discardActiveObject();
      canvas.remove(...activeObjects);
      canvas.requestRenderAll();
    }
  };
  
  const handleZoomIn = () => {
    fabricCanvas.current?.setZoom(fabricCanvas.current.getZoom() * 1.2);
    fabricCanvas.current?.requestRenderAll();
  };
  
  const handleZoomOut = () => {
    fabricCanvas.current?.setZoom(fabricCanvas.current.getZoom() / 1.2);
    fabricCanvas.current?.requestRenderAll();
  };
  
  const editText = () => {
    const text = fabricCanvas.current?.getActiveObject();
    if (text?.type === 'textbox') {
      text.enterEditing();
      text.hiddenTextarea.focus();
    }
  };

  return (
    <div className="d-flex">
      <div className="col-9 p-3 d-flex flex-column">
        <div className='position-relative' style={{ zIndex: 1200 }}>
          {currentUserPermission && currentUserPermission.canEdit === true && (
            <div className='d-flex flex-row my-auto mx-1 gap-1 mb-1'>
              <Button
                variant={tool === MODE_SELECT ? 'primary' : 'secondary'}
                onClick={() => setDrawingMode(MODE_SELECT)}
              >
                🔲 Select
              </Button>
              <Button
                variant={tool === MODE_DRAW ? 'primary' : 'secondary'}
                onClick={() => setDrawingMode(MODE_DRAW)}
              >
                ✏️ Draw
              </Button>
              <Button variant="secondary" onClick={addRectangle}>🔲 Rectangle</Button>
              <Button variant="secondary" onClick={addCircle}>⭕ Circle</Button>
              <Button variant="secondary" onClick={addArrow}>➡️ Arrow</Button>
              <Button variant="secondary" onClick={addText}>📝 Text</Button>
              <Button
                variant="secondary"
                onClick={editText}
                disabled={!selectedObject || selectedObject.type !== 'textbox'}
              >
                Edit Text
              </Button>
              <Button variant="danger" onClick={handleDelete}>🗑️ Delete</Button>

              <div className="d-flex gap-1 ms-2">
                <Button variant="secondary" onClick={handleZoomIn}>➕ Zoom In</Button>
                <Button variant="secondary" onClick={handleZoomOut}>➖ Zoom Out</Button>
              </div>
              <div className="form-check form-switch mx-2 my-auto">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="autoSaveSwitch"
                  checked={isAutoSaveEnabled}
                  onChange={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}
                />
                <label className="form-check-label" htmlFor="autoSaveSwitch">
                  AutoSave
                </label>
              </div>
            </div>
          )}
        </div>
        <div>
          <canvas ref={canvasRef} className="border shadow-sm" />
        </div>
      </div>
      <div className="mx-5 my-auto" style={{ zIndex: 1200 }}>
        <Button variant="primary" onClick={handleSave} disabled={!isConnected || !userPermissions[currentUser]}>
          {isConnected ? "Save Slide" : "Connecting..."}
        </Button>

        {currentUserPermission && currentUserPermission.isOwner === true && (
          <Button variant="secondary" onClick={addSlide} disabled={!userPermissions[currentUser]}>➕ Add Slide</Button>
        )}

        <Button variant="secondary" onClick={() => loadSlide(currentSlideId - 1)} disabled={currentSlideId <= 0}>
          ⬅️ Prev Slide
        </Button>

        <Button variant="secondary" onClick={() => loadSlide(currentSlideId + 1)} disabled={currentSlideId >= slidesCount - 1}>
          ➡️ Next Slide
        </Button>
      </div>
      <div className="col-2 p-4 border-left bg-light d-flex flex-column">
        <div>
          {currentUserPermission && currentUserPermission.isOwner === true && (
            <Button variant='success' className='my-3' onClick={handlePresentMode}>PRESENT</Button>
          )}

        </div>
        <h5 className="fw-bold">Connected Users:</h5>

        <ul className="list-group mt-3 overflow-auto" style={{ maxHeight: '400px' }}>


          {users.map((user, index) => (
            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
              <span className="text-truncate" style={{ maxWidth: '80%' }}>{user.username} {user.canEdit ? "can edit" : ""}</span>

              {user &&
                currentUserPermission.canEdit &&
                currentUserPermission.isOwner &&
                !user.isOwner && (
                  <Button
                    variant={userPermissions[user.username] ? "danger" : "success"}
                    size="sm"
                    className="ms-1 px-2 py-1"
                    style={{ whiteSpace: 'nowrap', minWidth: '70px' }}
                    onClick={() => toggleEditPermission(user.username)}
                  >
                    {userPermissions[user.username] ? "Revoke" : "Grant"}
                  </Button>
                )}

            </li>
          ))}

        </ul>
      </div>
    </div >
  );
}

export default PresentationEditor;