import logo from './logo.svg';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import Home from './pages/Home';
import RequireUsername from './pages/RequireUsername';
import 'bootstrap/dist/css/bootstrap.min.css';
import PresentationEditor from "./pages/PresentationEditor";
import Error404 from './pages/Error404';

function App() {
  return (
    <Router>
      <RequireUsername>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/presentation/:id" element={<PresentationEditor />} />
          <Route path="*" element={<Error404/>} />
        </Routes>
      </RequireUsername>
    </Router>
  );
}

export default App;
