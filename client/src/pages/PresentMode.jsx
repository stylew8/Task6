import React, { use, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as fabric from 'fabric';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { API_URL, CLIENT_URL, JOIN_PRESENTATION_COMMAND, LEAVE_PRESENTATION, ON_SLIDE_CHANGED, PRESENT_MODE_HUB, PRESENT_MODE_URL, PRESENTATION_MODE_STATUS_CHECK_API, SET_SLIDE, USERNAME_LOCALSTORAGE } from '../utils/constants';
import { useParams } from 'react-router-dom';
import { usePostApi } from '../utils/useApi';
import { Button } from 'react-bootstrap';
import { jsPDF } from 'jspdf';


function PresentMode() {
    const { presentationId, isPresenter } = useParams();
    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [connection, setConnection] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const post = usePostApi();

    const isPresenterBool = (isPresenter === 'true');
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const connectionRef = useRef(null);
    const [username, setUsername] = useState(localStorage.getItem(USERNAME_LOCALSTORAGE));

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                await post(PRESENTATION_MODE_STATUS_CHECK_API, {
                    presentationId,
                    username
                });
            } catch (error) {
                window.location.href = '/';
            } finally {
                setLoading(false);
            }
        }

        if (isPresenterBool) {
            fetch();
        }
    }, [isPresenterBool]);

    useEffect(() => {
        connectionRef.current = connection;
    }, [connection]);

    useEffect(() => {
        if (!presentationId) return;

        axios
            .get(`${API_URL}${presentationId}/slides`)
            .then((res) => {
                setSlides(res.data);
                setCurrentIndex(0);
            })
            .catch((err) => console.error('Error loading slides:', err));
    }, [presentationId]);

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl(`${API_URL}${PRESENT_MODE_HUB}`)
            .withAutomaticReconnect()
            .build();

        async function startConnection() {
            try {
                await newConnection.start();
                console.log('SignalR Connected!');

                newConnection.on(ON_SLIDE_CHANGED, (slideIndex) => {
                    setCurrentIndex(slideIndex);
                });

                await newConnection.invoke(JOIN_PRESENTATION_COMMAND, presentationId);
            } catch (e) {
                console.log('Connection failed: ', e);
            }
        }


        startConnection();
        setConnection(newConnection);


        return () => {
            if (newConnection) {
                newConnection.stop();

            }
        };
    }, []);

    useEffect(() => {

        if (!canvasRef.current || slides.length === 0) return;

        if (fabricCanvasRef.current) {
            try {
                fabricCanvasRef.current.dispose();
            } catch (error) {
                console.error(error);
            }
        }

        const canvas = new fabric.Canvas(canvasRef.current, {
            selection: false,
            skipTargetFind: true,
            hoverCursor: 'default',
            defaultCursor: 'default',
        });
        fabricCanvasRef.current = canvas;

        let jsonData = slides[currentIndex];

        canvas.loadFromJSON(jsonData, () => {
            canvas.getObjects().forEach(obj => {
                obj.set({
                    visible: true,
                    selectable: false,
                    evented: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    hasControls: false,
                    hasBorders: false,
                });
            });
            canvas.selection = false;
            canvas.renderAll();
            canvas.calcOffset();

            setTimeout(() => {
                canvas.requestRenderAll();
            }, 0);
        });

        return () => {
            canvas.dispose();
        };


    }, [slides, currentIndex]);

    const handlePrevSlide = async () => {
        if (!connectionRef.current) return;
        const newIndex = Math.max(currentIndex - 1, 0);
        try {
            await connectionRef.current.invoke(SET_SLIDE, presentationId, newIndex);
        } catch (err) {
            console.error('SetSlide failed:', err);
        }
    };

    const handleNextSlide = async () => {
        if (!connectionRef.current) return;
        const newIndex = Math.min(currentIndex + 1, slides.length - 1);
        try {
            await connectionRef.current.invoke(SET_SLIDE, presentationId, newIndex);
        } catch (err) {
            console.error('SetSlide failed:', err);
        }
    };

    if (slides.length === 0 || isLoading) {
        return <div>Loading slides...</div>;
    }

    const handleExportToPdf = async () => {
        const pdf = new jsPDF('p', 'pt', 'a4');

        for (let i = 0; i < slides.length; i++) {
            const slideJSON = slides[i];

            const tempDiv = document.createElement('div');
            document.body.appendChild(tempDiv);

            const fabricCanvas = new fabric.StaticCanvas(tempDiv, {
                width: 1000,
                height: 800,
                renderOnAddRemove: false
            });

            await new Promise((resolve) => {
                fabricCanvas.loadFromJSON(slideJSON, () => {
                    fabricCanvas.renderAll();

                    setTimeout(() => {
                        if (fabricCanvas.isEmpty()) {
                            console.error('Canvas is empty!', slideJSON);
                            resolve();
                            return;
                        }

                        const imgData = fabricCanvas.toDataURL({
                            format: 'png',
                            multiplier: 2,
                            quality: 1
                        });

                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

                        tempDiv.remove();
                        resolve();
                    }, 500);
                });
            });

            if (i < slides.length - 1) {
                pdf.addPage();
            }
        }

        pdf.save('slides.pdf');
    };

    return (
        <div className="mx-3 my-4">
            <div className="row mb-2">
                <div className="col">
                    <div className='d-flex row-flex'>
                        <h2>Presentation ID: {presentationId}</h2>
                        <div className='mx-5'>
                            <Button onClick={handleExportToPdf}>Export pdf</Button>
                        </div>

                        <div className="col d-flex align-items-center">
                            <span className="me-2">{CLIENT_URL + PRESENT_MODE_URL(presentationId, false)}</span>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    navigator.clipboard.writeText(CLIENT_URL + PRESENT_MODE_URL(presentationId, false));
                                }}
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                    <p>Slide {currentIndex + 1} of {slides.length}</p>
                </div>
            </div>

            {isPresenterBool && (
                <div className="row mb-1">
                    <div className="col">
                        <button
                            className="btn btn-outline-primary me-2"
                            onClick={handlePrevSlide}
                            disabled={currentIndex === 0}
                        >
                            Previous
                        </button>
                        <button
                            className="btn btn-outline-primary"
                            onClick={handleNextSlide}
                            disabled={currentIndex === slides.length - 1}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col">
                    <canvas
                        ref={canvasRef}
                        width={1850}
                        height={700}
                        style={{ border: '1px solid #ccc', width: '100%', height: 'auto' }}
                    />
                </div>
            </div>
        </div>
    );
}

export default PresentMode;
