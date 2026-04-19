import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  ShieldCheck,
  HardDrive,
  Clock3,
  LayoutGrid,
  List,
} from "lucide-react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import UploadPanel from "../components/UploadPanel";
import FileTable from "../components/FileTable";
import FileGrid from "../components/FileGrid";
import NodeHealth from "../components/NodeHealth";
import FilePreviewModal from "../components/FilePreviewModal";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

export default function Dashboard({ user, onLogout }) {
  const [files, setFiles] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [mode, setMode] = useState("replication");
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("files");
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [view, setView] = useState("grid");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");

  const { toast, showToast, clearToast } = useToast();

  const fetchFiles = async () => {
    try {
      const response = await api.get("/master/files/my");
      const rawFiles = Array.isArray(response.data) ? response.data : [];

      const uploadedOnly = rawFiles.filter((f) => f.status === "UPLOADED");
      const grouped = {};

      for (const file of uploadedOnly) {
        const name = file.fileName;

        if (!grouped[name]) {
          grouped[name] = {
            fileName: name,
            mode: file.mode,
            uploadTime: file.uploadTime,
            nodes: [],
          };
        }

        if (!grouped[name].nodes.includes(file.nodePort)) {
          grouped[name].nodes.push(file.nodePort);
        }
      }

      const normalized = Object.values(grouped).sort(
        (a, b) => new Date(b.uploadTime) - new Date(a.uploadTime)
      );

      setFiles(normalized);
    } catch (error) {
      console.error("Failed to fetch files", error);
      setFiles([]);
      showToast("Failed to fetch files", "error");
    }
  };

  const fetchNodes = async () => {
    try {
      const response = await api.get("/master/metadata");
      const raw = Array.isArray(response.data) ? response.data : [];

      const ports = [...new Set(raw.map((f) => f.nodePort))];
      const mapped = ports.map((port) => ({
        name: `Node ${port}`,
        url: `http://localhost:${port}`,
        healthy: true,
        status: "Seen in metadata",
      }));

      setNodes(mapped);
    } catch (error) {
      console.error("Failed to fetch node data", error);
      setNodes([]);
      showToast("Failed to fetch node data", "error");
    }
  };

  const refreshAll = async (showRefreshToast = true) => {
    setLoading(true);
    try {
      await Promise.all([fetchFiles(), fetchNodes()]);
      if (showRefreshToast) {
        showToast("Dashboard refreshed", "success");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchFiles(), fetchNodes()]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.fileName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesMode =
        modeFilter === "all" ? true : file.mode === modeFilter;

      return matchesSearch && matchesMode;
    });
  }, [files, searchTerm, modeFilter]);

  const recentFiles = useMemo(() => filteredFiles.slice(0, 4), [filteredFiles]);
  const healthyCount = nodes.filter((n) => n.healthy).length;

  const summary = useMemo(() => {
    return {
      totalFiles: files.length,
      totalSize: "Tracked in metadata",
    };
  }, [files]);

  const pageTitleMap = {
    files: "My Files",
    uploads: "Upload Center",
    nodes: "Storage Node Health",
    replication: "Storage Modes",
  };

  const pageSubtitleMap = {
    files: "Browse and manage files in your distributed cluster",
    uploads: "Upload files into the distributed cluster",
    nodes: "Health and monitoring overview",
    replication: "Choose how files are stored in the cluster",
  };

  const handlePreview = (fileName) => {
    setPreviewFileName(fileName);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewFileName("");
  };

  return (
    <div className="dashboard-shell">
      <Sidebar
        summary={summary}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="dashboard-main">
        <Topbar
          user={user}
          onRefresh={() => refreshAll(true)}
          onLogout={onLogout}
          mode={mode}
          setMode={setMode}
          title={pageTitleMap[activePage]}
          subtitle={pageSubtitleMap[activePage]}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activePage={activePage}
        />

        {loading ? (
          <div className="panel">
            <p className="info-message">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {activePage === "files" && (
              <>
                <div className="stats-grid">
                  <div className="stat-card premium-stat">
                    <div className="stat-icon">
                      <FolderOpen size={18} />
                    </div>
                    <div>
                      <p>Total Files</p>
                      <h3>{files.length}</h3>
                    </div>
                  </div>

                  <div className="stat-card premium-stat">
                    <div className="stat-icon">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p>Healthy Nodes</p>
                      <h3>{healthyCount}</h3>
                    </div>
                  </div>

                  <div className="stat-card premium-stat">
                    <div className="stat-icon">
                      <HardDrive size={18} />
                    </div>
                    <div>
                      <p>Current Mode</p>
                      <h3>
                        {mode === "load_balancing"
                          ? "Load balance"
                          : "Replication"}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="recent-files-section">
                  <div className="section-head">
                    <div>
                      <h3>Recent Files</h3>
                      <p>Your latest files across the cluster</p>
                    </div>
                  </div>

                  <div className="recent-files-grid">
                    {recentFiles.length === 0 ? (
                      <div className="empty-card">No recent files</div>
                    ) : (
                      recentFiles.map((file, index) => (
                        <div
                          className="recent-file-card"
                          key={`${file.fileName}-${index}`}
                          onClick={() => handlePreview(file.fileName)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="recent-file-top">
                            <div className="recent-file-icon">
                              <Clock3 size={18} />
                            </div>
                            <span className="mode-badge">
                              {file.mode === "load_balancing"
                                ? "Load balancing"
                                : "Replication"}
                            </span>
                          </div>

                          <h4 title={file.fileName}>{file.fileName}</h4>
                          <p>{formatDate(file.uploadTime)}</p>

                          <div className="recent-file-nodes">
                            {file.nodes.map((n) => (
                              <span key={n} className="node-chip">
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="files-toolbar">
                    <div>
                      <h3 className="toolbar-title">All Files</h3>
                      <p className="toolbar-subtitle">
                        {filteredFiles.length} visible file(s)
                      </p>
                    </div>

                    <div className="files-toolbar-actions">
                      <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">All Modes</option>
                        <option value="replication">Replication</option>
                        <option value="load_balancing">Load Balancing</option>
                      </select>

                      <div className="view-toggle">
                        <button
                          className={view === "grid" ? "active" : ""}
                          onClick={() => setView("grid")}
                          type="button"
                          title="Grid view"
                        >
                          <LayoutGrid size={16} />
                          Grid
                        </button>

                        <button
                          className={view === "list" ? "active" : ""}
                          onClick={() => setView("list")}
                          type="button"
                          title="List view"
                        >
                          <List size={16} />
                          List
                        </button>
                      </div>
                    </div>
                  </div>

                  {view === "grid" ? (
                    <FileGrid
                      files={filteredFiles}
                      onDeleted={() => refreshAll(false)}
                      onPreview={handlePreview}
                      showToast={showToast}
                    />
                  ) : (
                    <FileTable
                      files={filteredFiles}
                      onDeleted={() => refreshAll(false)}
                      onPreview={handlePreview}
                      showToast={showToast}
                    />
                  )}
                </div>
              </>
            )}

            {activePage === "uploads" && (
              <UploadPanel mode={mode} onUploaded={() => refreshAll(false)} />
            )}

            {activePage === "nodes" && <NodeHealth nodes={nodes} />}

            {activePage === "replication" && (
              <div className="panel">
                <div className="panel-header">
                  <h3>Storage Modes</h3>
                  <p>Choose how files should be distributed</p>
                </div>

                <div className="mode-info-grid">
                  <div
                    className={`mode-info-card ${
                      mode === "replication" ? "selected" : ""
                    }`}
                  >
                    <h4>Replication</h4>
                    <p>
                      Stores the same file on multiple healthy nodes for better
                      fault tolerance and availability.
                    </p>
                    <button
                      className="primary-btn"
                      onClick={() => setMode("replication")}
                      type="button"
                    >
                      Use Replication
                    </button>
                  </div>

                  <div
                    className={`mode-info-card ${
                      mode === "load_balancing" ? "selected" : ""
                    }`}
                  >
                    <h4>Load Balancing</h4>
                    <p>
                      Stores the file on one healthy node using round-robin
                      distribution for efficient usage.
                    </p>
                    <button
                      className="primary-btn secondary-btn"
                      onClick={() => setMode("load_balancing")}
                      type="button"
                    >
                      Use Load Balancing
                    </button>
                  </div>
                </div>

                <div className="mode-note">
                  Current active mode: <strong>{mode}</strong>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <FilePreviewModal
        isOpen={previewOpen}
        fileName={previewFileName}
        onClose={closePreview}
      />

      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
}