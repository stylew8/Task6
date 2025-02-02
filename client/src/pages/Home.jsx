import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import DataTable from 'react-data-table-component';
import { Modal, Button, Form } from 'react-bootstrap';
import { PRESENTATION_URL, USERNAME_LOCALSTORAGE } from '../utils/constants';
import { useApi, useGetApi, usePostApi } from '../utils/useApi';

const columns = [
  {
    name: "Title",
    selector: row => row.title,
    sortable: true,
  },
  {
    name: "Author",
    selector: row => row.author,
    sortable: true,
  },
  {
    name: "Uploaded",
    selector: row => row.uploaded,
    sortable: true,
  },
  {
    name: "Permission",
    selector: row => row.grant ? "Edit" : "View",
    sortable: true,
  }
];


function PresentationsTable() {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const postPresentation = usePostApi();
  const getPresentations = useGetApi();
  const [presentations, setPresentations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const presentations = await getPresentations("presentations", {
          username: localStorage.getItem(USERNAME_LOCALSTORAGE),
        });
        console.log(presentations);
        setPresentations(presentations);
      } catch (error) {
        console.error("Error fetching presentations:", error);
      }
    };
  
    fetch();
  }, []);

  const handleRowClick = (row) => {
    window.open(`${PRESENTATION_URL}${row.id}`, "_blank");
  };

  const handleCreate = async () => {
    if (newTitle) {
      setNewTitle('');
      setShowModal(false);

      const data = await postPresentation("presentations", {
        title: newTitle
      });

      window.document.location.href = `${PRESENTATION_URL}${data.id}`
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center vh-100">
      <div className="card p-4 shadow-lg w-75">
        <h6 className='text-danger'>{error}</h6>
        <h2 className="mb-4 fw-bold text-center">All Presentations</h2>
        <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
          Add Presentation
        </Button>
        <DataTable
          columns={columns}
          data={presentations}
          defaultSortFieldId={1}
          pagination
          highlightOnHover
          striped
          onRowClicked={handleRowClick}
        />
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Presentation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="presentationTitle">
              <Form.Label>Presentation Title</Form.Label>
              <Form.Control
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter presentation title"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleCreate}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PresentationsTable;
