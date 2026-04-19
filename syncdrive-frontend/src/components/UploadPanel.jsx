import { useRef, useState } from "react";
import { UploadCloud, FileUp, X, CheckCircle2 } from "lucide-react";
import api from "../services/api";

export default function UploadPanel({ mode, onUploaded }) {
  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const setFile = (file) => {
    setSelectedFile(file || null);
    setMessage("");
    setProgress(0);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) setFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please choose a file first.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      setProgress(0);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await api.post(
        `/master/upload?mode=${encodeURIComponent(mode)}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            if (!event.total) return;
            const percent = Math.round((event.loaded * 100) / event.total);
            setProgress(percent);
          },
        }
      );

      setMessage(
        typeof response.data === "string" ? response.data : "Upload successful"
      );
      setProgress(100);
      setSelectedFile(null);

      if (fileRef.current) fileRef.current.value = "";
      if (onUploaded) onUploaded();
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Upload failed"
      );
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setProgress(0);
    setMessage("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="panel upload-panel">
      <div className="panel-header">
        <h3>Upload Files</h3>
        <p>Current mode: {mode}</p>
      </div>

      <div
        className={`upload-dropzone ${dragActive ? "drag-active" : ""}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="upload-dropzone-icon">
          <UploadCloud size={46} />
        </div>

        <h4>Drag and drop files here</h4>
        <p>or click to browse from your device</p>

        <input
          type="file"
          ref={fileRef}
          onChange={handleFileChange}
          hidden
        />
      </div>

      {selectedFile && (
        <div className="selected-file-card">
          <div className="selected-file-left">
            <div className="selected-file-icon">
              <FileUp size={18} />
            </div>

            <div className="selected-file-meta">
              <span className="selected-file-name">{selectedFile.name}</span>
              <span className="selected-file-size">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          </div>

          <button
            className="clear-file-btn"
            onClick={clearFile}
            type="button"
            disabled={uploading}
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {uploading && (
        <div className="upload-progress-wrap">
          <div className="upload-progress-top">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>

          <div className="upload-progress-bar">
            <div
              className="upload-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="upload-actions">
        <button
          className="primary-btn"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          type="button"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      {message && (
        <div className="upload-message">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}