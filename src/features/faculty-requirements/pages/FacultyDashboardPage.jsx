import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  BarChart3, 
  FileSliders, 
  HelpCircle, 
  Upload, 
  RotateCcw, 
  Eye, 
  Clock, 
  Send,
  Download
} from "lucide-react";

export default function FacultyDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">To-Do Command Center</h1>
        <p className="text-slate-400">Semester 2, AY 2023-2024 | Deadline: June 15, 2024 (12 days left)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Overall Progress</h3>
            <span className="text-2xl font-bold text-blue-400">75%</span>
          </div>
          <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-blue-500" style={{ width: '75%' }}></div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-slate-400">
            <span>3/4 documents submitted</span>
            <span>1 pending</span>
          </div>
        </div>

        {/* Deadline Status */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Deadline Status</h3>
            <span className="text-amber-400 font-semibold">On Track</span>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold mr-3 text-slate-100">12</div>
            <div>
              <p className="font-medium text-slate-100">Days remaining</p>
              <p className="text-sm text-slate-400">Deadline: June 15, 2024</p>
            </div>
          </div>
        </div>

        {/* Clearance Status */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Clearance Status</h3>
            <span className="px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded">Not Ready</span>
          </div>
          <p className="text-sm text-slate-400 mb-4">Complete all requirements to generate clearance certificate</p>
          <Button 
            disabled 
            className="w-full bg-slate-700 text-slate-500 cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        </div>
      </div>

      {/* Your Courses Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Your Courses</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course 1 - CCS 101 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-100">CCS 101 - Intro to Computer Science</h3>
                <p className="text-slate-400">Section: CS-1A | Units: 3.0</p>
              </div>
              <div className="text-right">
                <div className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mb-2">75% Complete</div>
                <div className="text-sm text-slate-400">Deadline: 12 days</div>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              {/* Course Syllabus */}
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <div className="flex items-center">
                  <FileText className="text-green-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">Course Syllabus</p>
                    <p className="text-sm text-slate-400">Updated based on outcomes</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mr-3">Submitted</span>
                  <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Final Grades */}
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <div className="flex items-center">
                  <BarChart3 className="text-blue-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">Final Grades</p>
                    <p className="text-sm text-slate-400">Excel template required</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mr-3">Submitted</span>
                  <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* PDF Presentations */}
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <div className="flex items-center">
                  <FileSliders className="text-purple-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">PDF Presentations</p>
                    <p className="text-sm text-slate-400">All lecture slides</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mr-3">Submitted</span>
                  <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Exam Questionnaires - Pending */}
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded border border-amber-500/20">
                <div className="flex items-center">
                  <HelpCircle className="text-amber-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">Exam Questionnaires</p>
                    <p className="text-sm text-slate-400">Midterm & Final Exams</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded mr-3">Pending</span>
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/faculty-requirements/submission")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    <Upload className="h-4 w-4 mr-1" />Submit Now
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                <Send className="h-4 w-4 mr-2" />
                Submit All at Once
              </Button>
            </div>
          </div>

          {/* Course 2 - CCS 201 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-100">CCS 201 - Data Structures</h3>
                <p className="text-slate-400">Section: CS-2B | Units: 3.0</p>
              </div>
              <div className="text-right">
                <div className="px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded mb-2">50% Complete</div>
                <div className="text-sm text-slate-400">Deadline: 12 days</div>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              {/* Course Syllabus */}
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <div className="flex items-center">
                  <FileText className="text-green-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">Course Syllabus</p>
                    <p className="text-sm text-slate-400">Updated based on outcomes</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mr-3">Submitted</span>
                  <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Final Grades */}
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <div className="flex items-center">
                  <BarChart3 className="text-blue-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">Final Grades</p>
                    <p className="text-sm text-slate-400">Excel template required</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mr-3">Submitted</span>
                  <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* PDF Presentations - Returned */}
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded border border-red-500/20">
                <div className="flex items-center">
                  <FileSliders className="text-red-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">PDF Presentations</p>
                    <p className="text-sm text-slate-400">All lecture slides</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-red-500/10 text-red-400 rounded mr-3">Returned</span>
                  <Button 
                    size="sm"
                    onClick={() => navigate("/faculty-requirements/submission")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />Resubmit
                  </Button>
                </div>
              </div>

              {/* Exam Questionnaires - Under Review */}
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                <div className="flex items-center">
                  <HelpCircle className="text-slate-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-slate-100">Exam Questionnaires</p>
                    <p className="text-sm text-slate-400">Midterm & Final Exams</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded mr-3">Under Review</span>
                  <Button size="sm" variant="outline" disabled className="text-sm bg-slate-700 border-slate-600 text-slate-500">
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                <Send className="h-4 w-4 mr-2" />
                Submit All at Once
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4 text-slate-100">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-100">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Course</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Document</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <tr>
                <td className="py-3 px-4 text-slate-300">June 3, 2024 • 2:45 PM</td>
                <td className="py-3 px-4 text-slate-300">CCS 101</td>
                <td className="py-3 px-4 text-slate-300">PDF Presentations</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Approved</span>
                </td>
                <td className="py-3 px-4">
                  <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Eye className="h-4 w-4 mr-1" />View Receipt
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">June 1, 2024 • 10:15 AM</td>
                <td className="py-3 px-4 text-slate-300">CCS 101</td>
                <td className="py-3 px-4 text-slate-300">Final Grades</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Approved</span>
                </td>
                <td className="py-3 px-4">
                  <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Eye className="h-4 w-4 mr-1" />View Receipt
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">May 30, 2024 • 3:30 PM</td>
                <td className="py-3 px-4 text-slate-300">CCS 201</td>
                <td className="py-3 px-4 text-slate-300">PDF Presentations</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-semibold bg-red-500/10 text-red-400 rounded">Returned</span>
                </td>
                <td className="py-3 px-4">
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/faculty-requirements/submission")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />Resubmit
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
