import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function Error404() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-center">
      <h1 className="display-1 fw-bold text-danger">404</h1>
      <h2 className="mb-4">Page Not Found</h2>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary mt-3">Go Home</Link>
    </div>
  );
}

export default Error404;