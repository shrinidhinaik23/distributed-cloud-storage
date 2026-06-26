import React from "react";
import { RefreshCw, Search } from "lucide-react"; // 👈 Dropped LogOut icon import

export default function Topbar({
  user,
  onRefresh,
  mode,
  setMode,
  title,
  subtitle,
  searchTerm,
  setSearchTerm,
  activePage,
}) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <h2>{title || "My Drive"}</h2>
        <p>{subtitle || `Welcome, ${user?.username || user?.email || "User"}`}</p>
      </div>

      <div className="topbar-center">
        {activePage === "files" && (
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="mode-switch">
          <button
            type="button"
            className={mode === "replication" ? "active" : ""}
            onClick={() => setMode("replication")}
          >
            Replication
          </button>

          <button
            type="button"
            className={mode === "load_balancing" ? "active" : ""}
            onClick={() => setMode("load_balancing")}
          >
            Load Balance
          </button>
        </div>

        <button className="icon-btn" type="button" onClick={onRefresh}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>

        {/* ❌ Legay header logout button removed to keep sidebar as sole controller */}
      </div>
    </div>
  );
}