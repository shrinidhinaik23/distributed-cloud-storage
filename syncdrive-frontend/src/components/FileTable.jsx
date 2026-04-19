import { useEffect, useState } from "react";
import { Download, Trash2, RefreshCcw } from "lucide-react";
import api from "../services/api";

export default function FileTable({ refreshKey }) {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("Loading files...");

  const loadFiles = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setFiles([]);
      setMessage("Please login to view your files");
      return;
    }

    try {
      const res = await api.get("/master/files/my");
      const data = Array.isArray(res.data) ? res.data : [];
      setFiles(data);
      setMessage(data.length === 0 ? "No files found" : "");
    } catch (error) {
      setFiles([]);
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to load files"
      );
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshKey]);

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Delete ${fileName}?`)) return;

    try {
      await api.delete(`/master/delete/${encodeURIComponent(fileName)}`);
      setMessage(`Deleted ${fileName}`);
      loadFiles();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Delete failed"
      );
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const res = await api.get(`/master/download/${encodeURIComponent(fileName)}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage(`Downloaded ${fileName}`);
    } catch {
      setMessage("Download failed");
    }
  };

  return (
    <section className="table-panel">
      <div className="section-header">
        <h3>My Files</h3>
        <button className="icon-action-btn" onClick={loadFiles}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Node</th>
              <th>Status</th>
              <th>Mode</th>
              <th>User</th>
              <th>Upload Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length > 0 ? (
              files.map((file) => (
                <tr key={file.id}>
                  <td>{file.fileName}</td>
                  <td>{file.nodePort}</td>
                  <td>{file.status}</td>
                  <td>{file.mode}</td>
                  <td>{file.userEmail}</td>
                  <td>{file.uploadTime}</td>
                  <td>
                    <div className="action-row">
                      <button
                        className="mini-btn"
                        onClick={() => handleDownload(file.fileName)}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        className="mini-btn danger-outline"
                        onClick={() => handleDelete(file.fileName)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-cell">
                  {message}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {message && files.length > 0 && <p className="status-text">{message}</p>}
    </section>
  );
}