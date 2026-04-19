import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import AuthPanel from "../components/AuthPanel";
import UploadPanel from "../components/UploadPanel";
import FileTable from "../components/FileTable";
import NodeHealth from "../components/NodeHealth";

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshFiles = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="drive-layout">
      <Sidebar />

      <main className="drive-main">
        <Topbar userEmail={userEmail} />

        <div className="drive-content">
          <div className="drive-toolbar">
            <h1>My Drive</h1>
          </div>

          <div className="drive-grid">
            <AuthPanel onAuthChange={setUserEmail} />
            <UploadPanel onRefresh={refreshFiles} />
          </div>

          <NodeHealth />
          <FileTable refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}