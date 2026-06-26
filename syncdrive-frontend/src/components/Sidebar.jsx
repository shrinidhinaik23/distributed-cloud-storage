import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, signOut } from '../services/firebase';
import {
  Files,
  UploadCloud,
  Activity,
  ShieldCheck,
  HardDrive,
  LogOut, // 👈 Imported the LogOut icon
} from "lucide-react";

const items = [
  { key: "files", label: "Files", icon: Files },
  { key: "uploads", label: "Uploads", icon: UploadCloud },
  { key: "nodes", label: "Node Health", icon: Activity },
  { key: "replication", label: "Replication", icon: ShieldCheck },
];

export default function Sidebar({ summary, activePage, setActivePage }) {
  const navigate = useNavigate();

  // SaaS Logout Session Handler
  const handleLogout = async () => {
    try {
      // 1. Terminate live socket connection on Firebase
      await signOut(auth);

      // 2. Clear secure JWT tokens out of storage
      localStorage.removeItem("token");

      // 3. Kick session context back to login landing card
      navigate('/login');
    } catch (error) {
      console.error("Error during log out session termination:", error);
    }
  };

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div>
        <div className="sidebar-brand">
          <div className="logo-box">DS</div>
          <div>
            <h3>SyncDrive</h3>
            <p>Distributed Cloud Storage</p>
          </div>
        </div>

        <div className="sidebar-menu">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`menu-item ${activePage === item.key ? "active" : ""}`}
                onClick={() => setActivePage(item.key)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pushes storage summary box and logout button smoothly to the bottom */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="storage-box">
          <div className="storage-head">
            <HardDrive size={18} />
            <span>Storage Summary</span>
          </div>
          <p>Total Files: {summary?.totalFiles || 0}</p>
          <p>Total Size: {summary?.totalSize || "Tracked in metadata"}</p>
        </div>

        {/* Real SaaS Functional Logout Control */}
        <div style={{ padding: '0 16px 20px 16px' }}>
          <button 
            onClick={handleLogout} 
            type="button"
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              backgroundColor: '#fef2f2', 
              color: '#ef4444', 
              border: '1px solid #fee2e2', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}