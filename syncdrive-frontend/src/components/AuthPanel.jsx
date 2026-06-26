import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from "firebase/auth";
import { auth } from "../services/firebase";
import api from "../services/api";

export default function AuthPanel({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (isRegistering) {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // 2. Send validation email
        await sendEmailVerification(firebaseUser);
        
        // 3. Sync user metadata stub to Spring Boot database
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem("token", idToken); // Set temporarily for interceptor
        await api.post("/auth/sync-user", {
          name: name || email.split("@")[0],
          email: email
        });

        setMessage("Registration initiated! Please check your inbox to verify your email address before logging in.");
        setIsRegistering(false);
      } else {
        // Login flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        if (!firebaseUser.emailVerified) {
          setError("Please verify your email address before gaining entry to the cluster.");
          return;
        }

        // Trigger sync update on login to ensure consistency
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem("token", idToken);
        await api.post("/auth/sync-user", { email: firebaseUser.email });
        
        onLogin(firebaseUser);
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="loading-screen">
      <form onSubmit={handleSubmit} className="loader-card" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "320px" }}>
        <h3>{isRegistering ? "Create SyncDrive Account" : "Sign In to Cluster"}</h3>
        
        {error && <p style={{ color: "var(--error-color, #ff4d4d)", fontSize: "14px" }}>{error}</p>}
        {message && <p style={{ color: "var(--success-color, #4daf7c)", fontSize: "14px" }}>{message}</p>}

        {isRegistering && (
          <input 
            type="text" 
            placeholder="Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        )}
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />

        <button type="submit" className="primary-btn" style={{ cursor: "pointer", padding: "10px" }}>
          {isRegistering ? "Sign Up" : "Log In"}
        </button>

        <p style={{ fontSize: "13px", textAlign: "center", marginTop: "8px" }}>
          {isRegistering ? "Already have an account?" : "Need an account?"} {" "}
          <span 
            onClick={() => { setIsRegistering(!isRegistering); setError(""); }} 
            style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
          >
            {isRegistering ? "Sign In" : "Register"}
          </span>
        </p>
      </form>
    </div>
  );
}