import { useEffect, useState } from "react";
import api from "../services/api";

export default function AuthPanel({ onAuthChange }) {
  const [mode, setMode] = useState("login");
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setCurrentUser("");
        onAuthChange("");
        return;
      }

      try {
        const res = await api.get("/user/me");
        const text = typeof res.data === "string" ? res.data : "";
        const email = text.replace("Logged in as: ", "");
        setCurrentUser(email);
        onAuthChange(email);
      } catch {
        localStorage.removeItem("token");
        setCurrentUser("");
        onAuthChange("");
      }
    };

    fetchUser();
  }, [token, onAuthChange]);

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await api.post("/auth/register", registerForm);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      setMessage(res.data.message || "Registered successfully");

      const me = await api.get("/user/me");
      const email = String(me.data).replace("Logged in as: ", "");
      setCurrentUser(email);
      onAuthChange(email);
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setMessage("Please fill email and password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await api.post("/auth/login", loginForm);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      setMessage(res.data.message || "Login successful");

      const me = await api.get("/user/me");
      const email = String(me.data).replace("Logged in as: ", "");
      setCurrentUser(email);
      onAuthChange(email);
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser("");
    setMessage("Logged out successfully");
    onAuthChange("");
  };

  if (token && currentUser) {
    return (
      <div className="panel">
        <h3>Account</h3>
        <p className="muted">Logged in as</p>
        <p className="strong-text">{currentUser}</p>
        <button className="danger-btn" onClick={handleLogout}>
          Logout
        </button>
        <p className="status-text">{message}</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="tab-row">
        <button
          className={mode === "login" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={mode === "register" ? "tab-btn active-tab" : "tab-btn"}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      {mode === "login" ? (
        <>
          <h3>Login</h3>
          <input
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm({ ...loginForm, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />
          <button className="primary-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </>
      ) : (
        <>
          <h3>Register</h3>
          <input
            type="text"
            placeholder="Name"
            value={registerForm.name}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, name: e.target.value })
            }
          />
          <input
            type="email"
            placeholder="Email"
            value={registerForm.email}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={registerForm.password}
            onChange={(e) =>
              setRegisterForm({ ...registerForm, password: e.target.value })
            }
          />
          <button className="success-btn" onClick={handleRegister} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </>
      )}

      <p className="status-text">{message}</p>
    </div>
  );
}