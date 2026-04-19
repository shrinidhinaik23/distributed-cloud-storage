import { useEffect, useState } from "react";
import axios from "axios";

export default function NodeHealth() {
  const [health, setHealth] = useState({
    "Node 1": "Unknown",
    "Node 2": "Unknown",
    "Node 3": "Unknown",
  });

  const loadHealth = async () => {
    const ports = {
      "Node 1": 8080,
      "Node 2": 8081,
      "Node 3": 8082
    };
    const next = {};

    for (const [node, port] of Object.entries(ports)) {
      try {
        const res = await axios.get(`http://localhost:${port}/storage/health`);
        next[node] = res.data === "OK" ? "Healthy" : "Unhealthy";
      } catch {
        next[node] = "Down";
      }
    }

    setHealth(next);
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="panel">
      <div className="section-header">
        <h3>Node Health</h3>
        <button className="icon-action-btn" onClick={loadHealth}>
          Refresh
        </button>
      </div>

      <div className="health-grid">
        {Object.keys(health).map((node) => (
          <div
            key={node}
            className={`health-card ${
              health[node   ] === "Healthy"
                ? "healthy"
                : health[node] === "Down"
                ? "down"
                : "unknown"
            }`}
          >
            <strong> {node}</strong>
            <span>{health[node]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}