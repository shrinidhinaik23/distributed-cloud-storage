import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from '../services/firebase';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Regular Email/Password Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('Access Denied. Please verify your email address via the link sent to your inbox before logging in.');
        setLoading(false);
        return; 
      }

      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);

      await api.post("/auth/sync-user", {
        email: user.email,
        name: user.displayName || user.email.split("@")[0]
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your email or password.');
      } else {
        setError(err.message.replace("Firebase: ", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. SaaS Google OAuth2 Provider Logic
  const handleGoogleSignIn = async () => {
    setError('');
    setInfoMessage('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Google accounts are auto-verified, safe to pull token instantly
      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);

      // Sync verified Google Profile metadata with Spring Boot
      await api.post("/auth/sync-user", {
        email: user.email,
        name: user.displayName
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  // 3. Forgot Password Link Handler
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address in the input field first so we know where to send the link.");
      return;
    }
    setError('');
    setInfoMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage("Password reset recovery link successfully dispatched! Check your email inbox.");
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fb' }}>
      <div className="loader-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '360px', background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '22px', fontWeight: '700' }}>Welcome back</h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>Enter your credentials to access your storage cluster</p>
        </div>
        
        {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0', background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2', textAlign: 'center' }}>{error}</p>}
        {infoMessage && <p style={{ color: '#10b981', fontSize: '13px', margin: '0', background: '#ecfdf5', padding: '10px', borderRadius: '8px', border: '1px solid #d1fae5', textAlign: 'center' }}>{infoMessage}</p>}

        {/* Continue with Google SaaS Button */}
        <button 
          onClick={handleGoogleSignIn} 
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.3 1.56-1.17 2.88-2.48 3.75v3.13h3.99c2.34-2.16 3.62-5.33 3.62-8.73z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.99-3.13c-1.11.75-2.53 1.19-3.94 1.19-3.04 0-5.61-2.05-6.53-4.82H1.43v3.24C3.41 21.92 7.42 24 12 24z"/>
            <path fill="#FBBC05" d="M5.47 14.33c-.24-.72-.38-1.49-.38-2.33s.14-1.61.38-2.33V6.43H1.43C.52 8.26 0 10.07 0 12s.52 3.74 1.43 5.57l4.04-3.24z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.93 1.19 15.24 0 12 0 7.42 0 3.41 2.08 1.43 5.57l4.04 3.24c.92-2.77 3.49-4.82 6.53-4.82z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '4px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <span style={{ padding: '0 10px', color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e2e8f0' }} />
        </div>

        {/* Regular Email Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
            
            {/* SaaS Forgot Password Trigger Link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
              <span onClick={handleForgotPassword} style={{ color: '#4f46e5', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                Forgot password?
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '11px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', marginTop: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ fontSize: '13px', textAlign: 'center', marginTop: '4px', color: '#64748b', margin: '0' }}>
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')} style={{ color: '#4f46e5', cursor: 'pointer', fontWeight: '600' }}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}