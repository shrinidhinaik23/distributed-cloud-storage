import {
  Download,
  Trash2,
  Eye,
  FileText,
  FileImage,
  FileArchive,
  FileCode2,
} from "lucide-react";
import api from "../services/api";

export default function FileGrid({ files, onDeleted, onPreview, showToast }) {
  const handleDownload = async (fileName) => {
    try {
      const response = await api.get(
        `/master/download/${encodeURIComponent(fileName)}`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      showToast?.("File downloaded successfully", "success");
    } catch (error) {
      console.error(error);
      showToast?.("Download failed", "error");
    }
  };

  const handleDelete = async (fileName) => {
    try {
      await api.delete(`/master/delete/${encodeURIComponent(fileName)}`);
      onDeleted();
      showToast?.("File deleted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast?.("Delete failed", "error");
    }
  };

  return (
    <div className="file-grid">
      {files.length === 0 ? (
        <div className="empty-card">No files found</div>
      ) : (
        files.map((file, index) => (
          <div className="file-card" key={`${file.fileName}-${index}`}>
            <div className="file-card-top">
              <div className="file-icon">
                {getFileIcon(file.fileName)}
              </div>

              <span className="mode-badge">
                {file.mode === "load_balancing" ? "Load balancing" : "Replication"}
              </span>
            </div>

            <h4 title={file.fileName}>{file.fileName}</h4>
            <p>{formatDate(file.uploadTime)}</p>

            <div className="file-nodes">
              {file.nodes.map((n) => (
                <span key={n} className="node-chip">
                  {n}
                </span>
              ))}
            </div>

            <div className="file-actions">
              <button
                className="table-btn"
                onClick={() => onPreview(file.fileName)}
                type="button"
                title="Preview"
              >
                <Eye size={16} />
              </button>

              <button
                className="table-btn"
                onClick={() => handleDownload(file.fileName)}
                type="button"
                title="Download"
              >
                <Download size={16} />
              </button>

              <button
                className="table-btn danger"
                onClick={() => handleDelete(file.fileName)}
                type="button"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString();
}

function getFileIcon(fileName) {
  const lower = fileName.toLowerCase();

  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return <FileImage size={20} />;
  if (/\.(zip|rar|7z)$/.test(lower)) return <FileArchive size={20} />;
  if (/\.(js|jsx|java|py|html|css|json|ts|tsx)$/.test(lower)) return <FileCode2 size={20} />;
  return <FileText size={20} />;
}