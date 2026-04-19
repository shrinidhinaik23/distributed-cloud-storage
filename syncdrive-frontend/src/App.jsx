import { useEffect, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import Dashboard from "./pages/Dashboard";
import api from "./services/api";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const response = await api.get("/user/me");
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setBooting(false);
      }
    };

    init();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (booting) {
    return (
      <div className="loading-screen">
        <div className="loader-card">Loading...</div>
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <AuthPanel onLogin={setUser} />
  );
}