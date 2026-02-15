import { useOutletContext } from "react-router-dom";

export default function LabSettings() {
  const { labName } = useOutletContext();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-100">{labName} — Laboratory Settings</h1>
      <p className="text-slate-400">Laboratory Settings will appear here.</p>
    </div>
  );
}