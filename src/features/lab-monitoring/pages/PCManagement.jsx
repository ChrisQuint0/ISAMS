import { useOutletContext } from "react-router-dom";

export default function PCManagement() {
  const { labName } = useOutletContext();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-100">{labName} — PC Management</h1>
      <p className="text-slate-400">PC Management will appear here.</p>
    </div>
  );
}