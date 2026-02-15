import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Archive,
  Search,
  Filter,
  FileText,
  Download,
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useFacultyResources } from "../hooks/FacultyResourcesHook";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FacultyArchivePage() {
  const { archives, loading, error, loadArchives } = useFacultyResources();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("2023-1");

  useEffect(() => {
    // Load archives for previous semester by default, or just all archives
    // For now, we load all
    loadArchives();
  }, []);

  const filteredArchives = archives.filter(item =>
    item.standardized_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.courses?.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.courses?.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <div>
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
      </Card >

      {/* Archive Export */}
      < Card className="bg-slate-900/50 border-slate-800" >
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
      </Card >
    </div>
  );
}
