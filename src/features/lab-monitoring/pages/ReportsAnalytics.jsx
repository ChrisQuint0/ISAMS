import { useOutletContext } from "react-router-dom";

export default function ReportsAnalytics() {
  const { labName } = useOutletContext();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-100">{labName} — Reports & Analytics</h1>
      <p className="text-slate-400">Reports & Analytics will appear here.</p>
    </div>
  );
}