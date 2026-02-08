export default function LabDashboard() {
  return (
    <div className="flex items-center justify-center h-full px-6 py-12">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mb-6">
          <span className="text-3xl">🔬</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-100 mb-2">
          Laboratory Dashboard
        </h2>
        <p className="text-slate-400 max-w-md">
          Welcome to the monitoring module. This dashboard will soon display real-time active users and occupancy rates.
        </p>
      </div>
    </div>
  );
}