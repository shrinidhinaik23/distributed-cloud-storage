import { Search, Bell, Settings } from "lucide-react";

export default function Topbar({ userEmail }) {
  return (
    <div className="topbar">
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input placeholder="Search in SyncDrive" />
      </div>

      <div className="topbar-right">
        <button className="icon-btn">
          <Bell size={18} />
        </button>
        <button className="icon-btn">
          <Settings size={18} />
        </button>
        <div className="user-chip">
          <div className="avatar">SN</div>
          <span>{userEmail || "Guest"}</span>
        </div>
      </div>
    </div>
  );
}