import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Check,
  Archive
} from "lucide-react";

export default function FacultyArchivePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("2023-1");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">My Archive</h1>
        <p className="text-slate-400">Access your past submissions and clearance certificates</p>
      </div>

      {/* Main Grid Layout - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Clearance Status */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 text-slate-100">Clearance Status</h3>
            <div className="flex flex-col items-center mb-6">
              <div className="text-6xl text-slate-300 mb-2">
                <FileText className="h-16 w-16" />
              </div>
              <p className="text-lg font-medium mb-2 text-slate-100">Clearance Not Ready</p>
              <p className="text-slate-400 text-center mb-4">Complete all requirements to generate your digital clearance certificate</p>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500" style={{ width: '75%' }}></div>
              </div>
              <p className="text-sm text-slate-400">75% complete (3 of 4 documents)</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Course Syllabus</span>
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Final Grades</span>
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">PDF Presentations</span>
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Exam Questionnaires</span>
                <AlertCircle className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <Button 
              disabled 
              className="w-full mt-6 bg-slate-700 text-slate-500 cursor-not-allowed hover:bg-slate-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Clearance Certificate
            </Button>
          </CardContent>
        </Card>

        {/* Right Columns - Past Certificates and Archive Export */}
        <div className="lg:col-span-2 space-y-6">
          {/* Past Clearance Certificates */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-slate-100">Past Clearance Certificates</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-400 mr-4" />
                    <div>
                      <p className="font-medium text-slate-100">Semester 1, AY 2023-2024</p>
                      <p className="text-sm text-slate-400">Issued: December 20, 2023</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-400 mr-4" />
                    <div>
                      <p className="font-medium text-slate-100">Semester 2, AY 2022-2023</p>
                      <p className="text-sm text-slate-400">Issued: June 18, 2023</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-400 mr-4" />
                    <div>
                      <p className="font-medium text-slate-100">Semester 1, AY 2022-2023</p>
                      <p className="text-sm text-slate-400">Issued: December 22, 2022</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archive Export */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-100">Archive Export</h3>
                <span className="text-sm text-slate-400">Download your past submissions</span>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Semester</label>
                <select 
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2023-1">Semester 1, AY 2023-2024</option>
                  <option value="2022-2">Semester 2, AY 2022-2023</option>
                  <option value="2022-1">Semester 1, AY 2022-2023</option>
                  <option value="2021-2">Semester 2, AY 2021-2022</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Include Documents</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-slate-300">Course Syllabi</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-slate-300">Final Grades</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-slate-300">PDF Presentations</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-slate-300">Exam Questionnaires</span>
                  </label>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Archive className="h-4 w-4 mr-2" />
                Export My Archive (.zip)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
