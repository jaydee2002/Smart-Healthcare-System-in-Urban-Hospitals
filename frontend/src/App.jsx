import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<div>Welcome to Healthcare App</div>} />
          {/* Placeholders for future routes */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
