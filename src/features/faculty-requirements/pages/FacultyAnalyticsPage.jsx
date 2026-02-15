import { useNavigate } from "react-router-dom";

export default function FacultyAnalyticsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">My Analytics</h1>
        <p className="text-slate-400">Track your submission progress and performance</p>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Progress Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-slate-100">Personal Progress</h3>
          <div className="flex flex-col items-center">
            {/* Circular Progress Ring */}
            <div className="relative mb-4" style={{ width: '120px', height: '120px' }}>
              <svg className="transform -rotate-90" viewBox="0 0 120 120" style={{ width: '120px', height: '120px' }}>
                {/* Background Circle */}
                <circle
                  className="stroke-slate-700"
                  strokeWidth="10"
                  fill="transparent"
                  r="50"
                  cx="60"
                  cy="60"
                />
                {/* Progress Circle */}
                <circle
                  className="stroke-blue-500"
                  strokeWidth="10"
                  fill="transparent"
                  r="50"
                  cx="60"
                  cy="60"
                  strokeDasharray="314"
                  strokeDashoffset="78.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-100">75%</span>
              </div>
            </div>
            <p className="text-lg font-medium mb-1 text-slate-100">3 of 4 documents submitted</p>
            <p className="text-slate-400 text-sm">You're ahead of department average (68%)</p>
          </div>
        </div>

        {/* Submission Timeline Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-slate-100">Submission Timeline</h3>
          <div className="space-y-4">
            {/* Course Syllabus */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Course Syllabus</span>
                <span className="font-medium text-slate-300">May 28 (Early)</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Final Grades */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Final Grades</span>
                <span className="font-medium text-slate-300">June 1 (On Time)</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* PDF Presentations */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">PDF Presentations</span>
                <span className="font-medium text-slate-300">June 3 (On Time)</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Exam Questionnaires */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Exam Questionnaires</span>
                <span className="font-medium text-slate-300">Due June 15</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Comparison Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-slate-100">Performance Comparison</h3>
          <div className="space-y-4">
            {/* Your Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Your Progress</span>
                <span className="font-medium text-slate-300">75%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Department Average */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Department Average</span>
                <span className="font-medium text-slate-300">68%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: '68%' }}></div>
              </div>
            </div>



            {/* Best Performer */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Best Performer</span>
                <span className="font-medium text-slate-300">92%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <p className="text-blue-400 text-sm font-medium">
              🎉 You're performing 7% above department average!
            </p>
          </div>
        </div>
      </div>

      {/* Submission History */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4 text-slate-100">Submission History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-300">Semester</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Completion Rate</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Submission Date</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Badges Earned</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="py-3 px-4 font-medium text-slate-100">Semester 2, 2023-2024</td>
                <td className="py-3 px-4 text-slate-300">75% (In Progress)</td>
                <td className="py-3 px-4 text-slate-300">-</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded">Pending</span>
                </td>
                <td className="py-3 px-4 text-slate-300">-</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-3 px-4 font-medium text-slate-100">Semester 1, 2023-2024</td>
                <td className="py-3 px-4 text-slate-300">100%</td>
                <td className="py-3 px-4 text-slate-300">Dec 20, 2023</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Approved</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mr-1">On-Time</span>
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Perfect</span>
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-3 px-4 font-medium text-slate-100">Semester 2, 2022-2023</td>
                <td className="py-3 px-4 text-slate-300">100%</td>
                <td className="py-3 px-4 text-slate-300">June 18, 2023</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Approved</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">On-Time</span>
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-3 px-4 font-medium text-slate-100">Semester 1, 2022-2023</td>
                <td className="py-3 px-4 text-slate-300">100%</td>
                <td className="py-3 px-4 text-slate-300">Dec 22, 2022</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Approved</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">On-Time</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
