import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { X, FileQuestion, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import api from "../services/api";

export default function FilePreviewModal({
  isOpen,
  fileName,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [previewType, setPreviewType] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen || !fileName) return;

    let objectUrl = "";

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError("");
        setPreviewType("");
        setPreviewUrl("");
        setTextContent("");
        setHtmlContent("");
        setZoom(1);

        const lower = fileName.toLowerCase();

        const response = await api.get(
          `/master/preview/${encodeURIComponent(fileName)}`,
          { responseType: "blob" }
        );

        const blob =
          response.data instanceof Blob
            ? response.data
            : new Blob([response.data], {
                type:
                  response.headers["content-type"] ||
                  "application/octet-stream",
              });

        objectUrl = window.URL.createObjectURL(blob);

        if (/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(lower)) {
          setPreviewType("image");
          setPreviewUrl(objectUrl);
          return;
        }

        if (/\.(pdf)$/i.test(lower)) {
          setPreviewType("pdf");
          setPreviewUrl(objectUrl);
          return;
        }

        if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(lower)) {
          setPreviewType("video");
          setPreviewUrl(objectUrl);
          return;
        }

        if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(lower)) {
          setPreviewType("audio");
          setPreviewUrl(objectUrl);
          return;
        }

        if (
          /\.(txt|md|json|js|jsx|ts|tsx|java|py|c|cpp|html|css|xml|yml|yaml)$/i.test(
            lower
          )
        ) {
          const text = await blob.text();
          setPreviewType("text");
          setTextContent(text);
          return;
        }

        if (/\.(docx)$/i.test(lower)) {
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewType("docx");
          setHtmlContent(result.value || "<p>No readable content found.</p>");
          return;
        }

        setPreviewType("unsupported");
      } catch (err) {
        console.error("Preview failed:", err);
        setError("Preview failed for this file.");
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, fileName]);

  if (!isOpen) return null;

  const canZoom = previewType === "image" || previewType === "docx";
  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div
        className="preview-modal large-preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preview-modal-top">
          <h3>{fileName}</h3>

          <div className="preview-top-actions">
            {canZoom && (
              <>
                <button
                  className="preview-action-btn"
                  onClick={zoomOut}
                  type="button"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  className="preview-action-btn"
                  onClick={resetZoom}
                  type="button"
                  title="Reset zoom"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className="preview-action-btn"
                  onClick={zoomIn}
                  type="button"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
              </>
            )}

            <button className="preview-close-btn" onClick={onClose} type="button">
              <X size={16} />
              Close
            </button>
          </div>
        </div>

        <div className="preview-modal-body">
          {loading && <div className="preview-state">Loading preview...</div>}

          {!loading && error && (
            <div className="preview-state error-state">{error}</div>
          )}

          {!loading && !error && previewType === "image" && (
            <div className="zoom-stage">
              <img
                src={previewUrl}
                alt={fileName}
                className="preview-image"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          )}

          {!loading && !error && previewType === "pdf" && (
            <iframe
              src={previewUrl}
              title={fileName}
              className="preview-pdf"
            />
          )}

          {!loading && !error && previewType === "video" && (
            <div className="video-stage">
              <video controls className="preview-video">
                <source src={previewUrl} />
                Your browser does not support video preview.
              </video>
            </div>
          )}

          {!loading && !error && previewType === "audio" && (
            <div className="audio-preview-wrap">
              <audio controls className="preview-audio">
                <source src={previewUrl} />
                Your browser does not support audio preview.
              </audio>
            </div>
          )}

          {!loading && !error && previewType === "text" && (
            <pre className="preview-text">{textContent}</pre>
          )}

          {!loading && !error && previewType === "docx" && (
            <div className="zoom-stage docx-stage">
              <div
                className="preview-docx"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          )}

          {!loading && !error && previewType === "unsupported" && (
            <div className="preview-state">
              <FileQuestion size={36} />
              <p>Preview is not available for this file type.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}