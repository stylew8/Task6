import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as fabric from 'fabric';
import { Button, Dropdown } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import * as signalR from "@microsoft/signalr";
import * as constants from "../utils/constants";
import debounce from 'lodash.debounce';


function PresentationEditor() {
  const { id } = useParams(0);
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const connectionRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [tool, setTool] = useState("select");
  const [slides, setSlides] = useState([]);
  const [currentSlideId, setCurrentSlideId] = useState(0);
  const [userPermissions, setUserPermissions] = useState({});
  const [currentUser, setCurrentUser] = useState(localStorage.getItem(constants.USERNAME_LOCALSTORAGE));

  const [slidesCount, setSlidesCount] = useState(0);

  const prevCanvasJsonRef = useRef('');


  const [currentUserPermission, setCurrentUserPermission] = useState(null);

  const currentUserPermissionRef = useRef(currentUserPermission);
  const currentSlideIdRef = useRef(currentSlideId);
  const isConnectedRef = useRef(isConnected);

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
      connectionRef.current = new signalR.HubConnectionBuilder()
        .withUrl(`${constants.API_URL}${constants.PRESENTATION_HUB}`, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();
    }

    const connection = connectionRef.current;

    if (connection.state === constants.DISCONNECTED_STATE) {
      connection.start()
        .then(() => {
          console.log("✅ Connected to SignalR.");
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
              console.error("🚨 Error in JoinPresentation:", err);
              window.location.href = "/";
            });
        })
        .catch(err => console.error("🚨 Error connecting to SignalR:", err));
    }
    connection.onclose(constants.USER_DISCONNECTED_COMMAND,()=>{
      console.warn("connection was closed");
    }
    );

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

    connection.on(constants.SLIDE_UPDATED_COMMAND, (slideId, content) => {
      try {
        const parsedJSON = JSON.parse(content);

        if (parsedJSON != null && currentSlideIdRef.current === slideId) {
          fabricCanvas.current.clear();
          fabricCanvas.current.loadFromJSON(parsedJSON, () => {
            fabricCanvas.current.requestRenderAll();

            fabricCanvas.current.getObjects().forEach(obj => {
              obj.set('visible', true);
            });
          });
        }

      } catch (error) {
        console.error("❌ Failed to parse or load JSON content:", error);
      }
    });

    connection.on(constants.SLIDES_COUNT_RECEIVED, (slidesCount) => {
      setSlidesCount(slidesCount);
    });

    connection.on(constants.SLIDE_RECEIVED_COMMAND, (content) => {
      const parsedJSON = JSON.parse(content);

      if (parsedJSON != null) {
        fabricCanvas.current.clear();
        fabricCanvas.current.loadFromJSON(parsedJSON, () => {
          fabricCanvas.current.requestRenderAll();

          fabricCanvas.current.getObjects().forEach(obj => {
            obj.set('visible', true);
          });
        });
      }
    });

    if (!fabricCanvas.current) {
      fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
        backgroundColor: "#fff",
      });

      fabricCanvas.current.setWidth(window.innerWidth * 0.9);
      fabricCanvas.current.setHeight(window.innerHeight * 1);

    }

    const debouncedSave = debounce(() => {
      handleSave();
    }, 500);

    fabricCanvas.current.on('object:modified', () => {
      handleSave();
    });

    fabricCanvas.current.on('object:added', () => {
      debouncedSave();
    });

    // fabricCanvas.current.on('object:removed',() => {
    //   handleSave();
    // });

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
      let jsonData = JSON.stringify(fabricCanvas.current.toJSON());

      connectionRef.current.invoke(constants.UPDATE_SLIDE_COMMAND, id.toString(), currentUser, currentSlideIdRef.current, jsonData)
        .catch(err => console.error("🚨 Ошибка при обновлении слайда:", err));

    } else {
      console.error("🚨 Нет подключения или прав на редактирование.");
    }
  };


  const setDrawingMode = (mode) => {
    setTool(mode);
    if (fabricCanvas.current) {
      fabricCanvas.current.isDrawingMode = mode === "draw";
      if (mode === "draw") {
        fabricCanvas.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.current);
        fabricCanvas.current.freeDrawingBrush.width = 3;
        fabricCanvas.current.freeDrawingBrush.color = "black";
      }
    }
  };

  const addRectangle = () => {
    if (fabricCanvas.current) {
      const rect = new fabric.Rect({
        left: 50,
        top: 50,
        fill: "blue",
        width: 100,
        height: 100,
      });
      fabricCanvas.current.add(rect);
    }
  };

  const addCircle = () => {
    if (fabricCanvas.current) {
      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        fill: "red",
        radius: 50,
      });
      fabricCanvas.current.add(circle);
    }
  };

  const addText = () => {
    if (fabricCanvas.current) {
      const text = new fabric.Textbox("Enter text", {
        left: 150,
        top: 150,
        fontSize: 20,
        fill: "black",
      });
      fabricCanvas.current.add(text);
    }
  };

  const addArrow = () => {
    if (fabricCanvas.current) {
      const line = new fabric.Line([50, 50, 150, 50], {
        stroke: "black",
        strokeWidth: 5,
        selectable: true,
      });
      fabricCanvas.current.add(line);
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
      connectionRef.current.invoke("SetUserEditPermission", id.toString(), username, canEdit)
        .catch(err => console.error("🚨 Error setting user permissions:", err));
    }
  };

  return (
    <div className="d-flex">
      <div className="col-9 p-3 d-flex flex-column">
        <div className='position-relative' style={{ zIndex: 1200 }}>
          {currentUserPermission && currentUserPermission.canEdit === true &&(
          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="dropdown-basic">
              Tools
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setDrawingMode("select")}>🔲 Select</Dropdown.Item>
              <Dropdown.Item onClick={() => setDrawingMode("draw")}>✏️ Draw</Dropdown.Item>
              <Dropdown.Item onClick={addRectangle}>🔲 Rectangle</Dropdown.Item>
              <Dropdown.Item onClick={addCircle}>⭕ Circle</Dropdown.Item>
              <Dropdown.Item onClick={addArrow}>➡️ Arrow</Dropdown.Item>
              <Dropdown.Item onClick={addText}>📝 Text</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          )}
        </div>
        <div>
          <canvas ref={canvasRef} className="border shadow-sm" />
        </div>
      </div>
      <div className="mx-auto my-auto position-relative " style={{ zIndex: 1200 }}>
        <Button variant="primary" onClick={handleSave} disabled={!isConnected || !userPermissions[currentUser]}>
          {isConnected ? "Save Slide" : "Connecting..."}
        </Button>
        {currentUserPermission && currentUserPermission.isOwner === true &&(
          <Button variant="secondary" onClick={addSlide} disabled={!userPermissions[currentUser]}>➕ Add Slide</Button>
        )}
        <Button variant="secondary" onClick={() => loadSlide(currentSlideId - 1)} disabled={currentSlideId <= 0}>
          ⬅️ Prev Slide
        </Button>
        <Button variant="secondary" onClick={() => loadSlide(currentSlideId + 1)} disabled={currentSlideId >= slidesCount - 1}>
          ➡️ Next Slide
        </Button>
      </div>
      <div className="col-3 p-4 border-left bg-light d-flex flex-column">
        <h5 className="fw-bold">Connected Users:</h5>

        <ul className="list-group mt-3 overflow-auto" style={{ maxHeight: '400px' }}>
          {users.map((user, index) => (
            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
              <span className="text-truncate" style={{ maxWidth: '80%' }}>{user.username} {user.canEdit ? "can edit":""}</span>
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
    </div>
  );
}

export default PresentationEditor;