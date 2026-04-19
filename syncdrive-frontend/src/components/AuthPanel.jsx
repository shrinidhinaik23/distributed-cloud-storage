import { useState } from "react";
import { LogIn, UserPlus, User, Lock, Mail } from "lucide-react";
import api from "../services/api";

export default function AuthPanel({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setMessage("");

      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      setMessage("Registration successful. Please login with email.");
      setMode("login");
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
    try {
      setLoading(true);
      setMessage("");

      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const token = response.data?.token;
      if (!token) {
        throw new Error("Token not received");
      }

      localStorage.setItem("token", token);

      const me = await api.get("/user/me");
      onLogin(me.data);
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

  const submit = (e) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else handleRegister();
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">DS</div>
          <div>
            <h1>Distributed Storage</h1>
            <p>Secure file syncing across storage nodes</p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            type="button"
          >
            <LogIn size={16} />
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
            type="button"
          >
            <UserPlus size={16} />
            Register
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <label>
              <User size={16} />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </label>
          )}

          <label>
            <Mail size={16} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <Lock size={16} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create account"}
          </button>

          {message && <p className="auth-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}