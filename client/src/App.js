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
import PresentationEditor from "./pages/PresentationEditor.jsx";
import Error404 from './pages/Error404';
import PresentMode from './pages/PresentMode.jsx';
import ErrorBoundary from './utils/ErrorBoundary.jsx'

function App() {
  return (
    <Router>
      <RequireUsername>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/presentation/:id" element={<PresentationEditor />} />
            <Route path="/presentMode/:presentationId/:isPresenter" element={<PresentMode />} />
            <Route path="*" element={<Error404 />} />
          </Routes>
        </ErrorBoundary>
      </RequireUsername>
    </Router>
  );
}

export default App;
