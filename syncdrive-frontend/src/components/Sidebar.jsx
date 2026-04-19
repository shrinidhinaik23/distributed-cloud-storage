import { Cloud, Folder, Star, Clock3, Trash2 } from "lucide-react";

export default function Sidebar() {
  const items = [
    { label: "My Drive", icon: Folder },
    { label: "Starred", icon: Star },
    { label: "Recent", icon: Clock3 },
    { label: "Trash", icon: Trash2 },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Cloud size={20} />
        </div>
        <div>
          <h2>SyncDrive</h2>
          <p>Distributed Storage</p>
        </div>
      </div>

      <button className="primary-btn full">+ New</button>

      <nav className="nav-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="nav-item">
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}