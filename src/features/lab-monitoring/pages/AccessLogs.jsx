import { useOutletContext } from "react-router-dom";

export default function AccessLogs() {
  const { labName } = useOutletContext();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-100">{labName} — Access Logs</h1>
      <p className="text-slate-400">Student entry and exit logs will appear here.</p>
    </div>
  );
}