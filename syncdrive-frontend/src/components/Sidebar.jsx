import {
  Files,
  UploadCloud,
  Activity,
  ShieldCheck,
  HardDrive,
} from "lucide-react";

const items = [
  { key: "files", label: "Files", icon: Files },
  { key: "uploads", label: "Uploads", icon: UploadCloud },
  { key: "nodes", label: "Node Health", icon: Activity },
  { key: "replication", label: "Replication", icon: ShieldCheck },
];

export default function Sidebar({ summary, activePage, setActivePage }) {
  return (
    <aside className="sidebar">
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

      <div className="storage-box">
        <div className="storage-head">
          <HardDrive size={18} />
          <span>Storage Summary</span>
        </div>
        <p>Total Files: {summary.totalFiles}</p>
        <p>Total Size: {summary.totalSize}</p>
      </div>
    </aside>
  );
}