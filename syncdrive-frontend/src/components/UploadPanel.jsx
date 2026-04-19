import { useState } from "react";
import api from "../services/api";

export default function UploadPanel({ onRefresh }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("replication");
  const [message, setMessage] = useState("No upload attempted yet.");

  const token = localStorage.getItem("token");

  const handleUpload = async () => {
    if (!token) {
      setMessage("Please login first");
      return;
    }

    if (!file) {
      setMessage("Please choose a file first");
      return;
    }

    try {
      setMessage("Uploading...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await api.post("/master/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(typeof res.data === "string" ? res.data : "Upload successful");
      onRefresh();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Upload failed"
      );
    }
  };

  return (
    <div className="panel">
      <h3>Upload File</h3>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="replication">Replication</option>
        <option value="load_balancing">Load Balancing</option>
      </select>

      <button className="primary-btn" onClick={handleUpload}>
        Upload
      </button>

      <p className="status-text">{message}</p>
    </div>
  );
}