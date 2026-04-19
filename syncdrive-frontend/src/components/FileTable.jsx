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

export default function FileTable({ files, onDeleted, onPreview, showToast }) {
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
    <div className="file-table-wrap">
      <table className="file-table premium-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Nodes</th>
            <th>Mode</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {files.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-cell">
                No files found
              </td>
            </tr>
          ) : (
            files.map((file, index) => (
              <tr key={`${file.fileName}-${index}`}>
                <td>
                  <div className="file-name rich-file-name">
                    <div className="file-icon-shell">{getFileIcon(file.fileName)}</div>
                    <div className="file-meta">
                      <span className="file-title">{file.fileName}</span>
                      <span className="file-subtitle">
                        {file.nodes.length} node{file.nodes.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  {file.nodes.map((n) => (
                    <span key={n} className="node-chip">
                      {n}
                    </span>
                  ))}
                </td>

                <td>
                  <span className="mode-badge">
                    {file.mode === "load_balancing" ? "Load balancing" : "Replication"}
                  </span>
                </td>

                <td>{formatDate(file.uploadTime)}</td>

                <td>
                  <div className="table-actions">
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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

  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return <FileImage size={18} />;
  if (/\.(zip|rar|7z)$/.test(lower)) return <FileArchive size={18} />;
  if (/\.(js|jsx|java|py|html|css|json|ts|tsx)$/.test(lower)) return <FileCode2 size={18} />;
  return <FileText size={18} />;
}