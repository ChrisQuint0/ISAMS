import { useOutletContext } from "react-router-dom";

export default function LabSchedule() {
  const { labName } = useOutletContext();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-100">{labName} — Laboratory Schedule</h1>
      <p className="text-slate-400">Laboratory Schedule will appear here.</p>
    </div>
  );
}