import React from 'react';
import { USERNAME_LOCALSTORAGE } from '../utils/constants';

function RequireUsername({ children }) {
  const username = localStorage.getItem(USERNAME_LOCALSTORAGE);
  if (!username) {
    return <UsernamePrompt />;
  }
  return children;
}

function UsernamePrompt() {
  const [tempUsername, setTempUsername] = React.useState("");

  const handleSetUsername = () => {
    if (tempUsername.trim()) {
      localStorage.setItem(USERNAME_LOCALSTORAGE, tempUsername);
      window.location.reload();
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 vw-100 bg-light">
      <div className="card p-5 shadow-lg text-center" style={{ maxWidth: "30rem" }}>
        <h2 className="mb-4 fw-bold">Enter your username</h2>
        <input
          type="text"
          className="form-control mb-3 text-center"
          placeholder="Username"
          value={tempUsername}
          onChange={(e) => setTempUsername(e.target.value)}
        />
        <button 
          className="btn btn-primary w-100 py-2 fs-5"
          onClick={handleSetUsername}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default RequireUsername;
