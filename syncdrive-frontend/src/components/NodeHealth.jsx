import { Activity, Server, ShieldCheck, AlertTriangle } from "lucide-react";

export default function NodeHealth({ nodes }) {
  const healthyCount = nodes.filter((node) => node.healthy).length;
  const downCount = nodes.length - healthyCount;

  return (
    <div className="panel node-health-panel">
      <div className="node-health-top">
        <div>
          <h3>Storage Cluster</h3>
          <p>Live node monitoring for your distributed storage system</p>
        </div>

        <div className="cluster-summary">
          <div className="cluster-pill success">
            <ShieldCheck size={16} />
            <span>{healthyCount} Healthy</span>
          </div>

          <div className="cluster-pill danger">
            <AlertTriangle size={16} />
            <span>{downCount} Down</span>
          </div>
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="node-empty-state">
          <Activity size={28} />
          <h4>No node data available</h4>
          <p>Refresh the dashboard to fetch cluster health information.</p>
        </div>
      ) : (
        <div className="node-health-grid">
          {nodes.map((node, index) => (
            <div
              key={`${node.name}-${index}`}
              className={`node-health-card ${node.healthy ? "healthy" : "down"}`}
            >
              <div className="node-health-card-top">
                <div className="node-health-title">
                  <div className="node-icon-wrap">
                    <Server size={18} />
                  </div>
                  <div>
                    <h4>{node.name}</h4>
                    <p>{node.healthy ? "Operational" : "Unavailable"}</p>
                  </div>
                </div>

                <div className={`node-status-badge ${node.healthy ? "healthy" : "down"}`}>
                  <span className="status-dot" />
                  {node.healthy ? "Healthy" : "Down"}
                </div>
              </div>

              <div className="node-metrics">
                <div className="node-metric">
                  <span className="metric-label">Environment</span>
                  <span className="metric-value">Local Cluster</span>
                </div>

                <div className="node-metric">
                  <span className="metric-label">Port</span>
                  <span className="metric-value">{extractPort(node.name)}</span>
                </div>

                <div className="node-metric full">
                  <span className="metric-label">Health Check</span>
                  <span className="metric-value">
                    {node.status || (node.healthy ? "OK" : "DOWN")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function extractPort(name) {
  const match = String(name).match(/\d+/);
  return match ? match[0] : "-";
}