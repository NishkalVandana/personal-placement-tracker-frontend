
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Applications from "./components/Applications";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import Jobs from "./components/Jobs";
import Login from "./components/Login";
import Home from "./components/Home";
import Register from "./components/Register";
import ResumeLibrary from "./components/ResumeLibrary";
import Interviews from "./components/Interviews";
import Statistics from "./components/Statistics";
import Profile from "./components/Profile";

// Keep your existing imports.

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/resumes" element={<ResumeLibrary />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
