import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Check, RotateCcw, AlertTriangle,
  FileText, Bot, Scale, CheckCircle, Zap, CheckCircle2,
  SlidersHorizontal, Mail, FileCheck, Download, RefreshCw, X, ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Hook
import { useAdminValidation } from '../hooks/AdminValidationHook';

export default function AdminValidationPage() {
  const navigate = useNavigate();
  const {
    loading, queue, recentApprovals, stats, processAction, approveAll, downloadFile, runBotCheck, refresh
  } = useAdminValidation();

  // Dialog State
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview & Analysis State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzingId, setAnalyzingId] = useState(null);

  // --- Handlers ---

  const handleActionClick = (item, action) => {
    setSelectedItem(item);
    setPendingAction(action);
    setRemarks('');
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedItem || !pendingAction) return;
    setSubmitting(true);
    const result = await processAction(selectedItem.submission_id, pendingAction, remarks);
    setSubmitting(false);

    if (result.success) {
      setActionDialogOpen(false);
      setSelectedItem(null);
    } else {
      alert("Error: " + result.message);
    }
  };

  const handleApproveAll = async () => {
    if (queue.length === 0) return;
    if (!window.confirm(`Are you sure you want to approve ALL ${queue.length} pending items?`)) return;

    const result = await approveAll();
    if (!result.success) alert("Error: " + result.message);
    refresh();
  };

  const handlePreview = (url) => {
    if (!url) return;
    // Google Drive specific: Convert /view to /preview for embedding
    const embedUrl = url.replace('/view', '/preview');
    setPreviewUrl(embedUrl);
    setIsPreviewOpen(true);
  };

  const handleRunAnalysis = async (item) => {
    setAnalyzingId(item.submission_id);
    const result = await runBotCheck(item.submission_id);
    setAnalyzingId(null);
    if (!result.success) alert("Analysis failed: " + result.message);
  };

  // --- Helpers ---
  const getFileIcon = (filename = "") => {
    if (filename.endsWith('.pdf')) return <FileText className="h-8 w-8 text-rose-400" />;
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <FileText className="h-8 w-8 text-emerald-400" />;
    if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <FileText className="h-8 w-8 text-blue-400" />;
    return <FileText className="h-8 w-8 text-slate-400" />;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Validation Queue</h1>
          <p className="text-slate-400 text-sm">Review and approve flagged submissions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* Pending Review Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-none flex-1 flex flex-col min-h-[400px]">
            <CardHeader className="border-b border-slate-800 py-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Pending Review
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 ml-2 border-slate-700">{queue.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-slate-950/30">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading queue...</div>
                  ) : queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                        <CheckCircle className="h-8 w-8 text-emerald-500/50" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300">All caught up!</h3>
                      <p className="text-sm">No pending submissions require validation.</p>
                    </div>
                  ) : (
                    queue.map((item) => (
                      <div key={item.submission_id} className="group border border-slate-800 rounded-lg bg-slate-900 hover:border-slate-700 transition-all shadow-sm">
                        {/* Header Row */}
                        <div className="p-4 border-b border-slate-800/50">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                {item.validation_status === 'FAILED' ? (
                                  <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                                    Validation Failed
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                                    Manual Review
                                  </Badge>
                                )}
                                <span className="text-xs text-slate-500 flex items-center">
                                  <Bot className="h-3 w-3 mr-1" /> Automated Check
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-200 text-sm">
                                {item.doc_type_name}
                              </h4>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Submitted by <span className="text-slate-300">{item.faculty_name}</span> • {item.course_code}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-500 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                              {item.submitted_at}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          {/* File Info Row */}
                          <div className="flex items-center p-3 rounded-md bg-slate-950/50 border border-slate-800/50 mb-4 group-hover:border-slate-700/50 transition-colors">
                            <div className="mr-3">
                              {getFileIcon(item.original_filename)}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate" title={item.original_filename}>
                                {item.original_filename || "Untitled Document"}
                              </p>
                              <button
                                onClick={() => downloadFile(item.submission_id)}
                                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center mt-0.5"
                              >
                                <Download className="h-3 w-3 mr-1" /> Download Original
                              </button>
                            </div>
                            {item.gdrive_web_view_link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                onClick={() => handlePreview(item.gdrive_web_view_link)}
                              >
                                <Eye className="h-4 w-4 mr-2" /> Preview
                              </Button>
                            )}
                          </div>

                          {/* Bot Analysis Section */}
                          <div className="flex items-center gap-2 mb-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                              onClick={() => handleRunAnalysis(item)}
                              disabled={analyzingId === item.submission_id}
                            >
                              {analyzingId === item.submission_id ? (
                                <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                              ) : (
                                <Zap className="h-3.5 w-3.5 mr-2" />
                              )}
                              {item.bot_analysis && item.bot_analysis.status ? 'Re-Run Analysis' : 'Run AI Analysis'}
                            </Button>

                            {item.bot_analysis && item.bot_analysis.status === 'PASSED' && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> AI Clean
                              </Badge>
                            )}
                          </div>

                          {/* Analysis Results / Issues */}
                          {((item.validation_issues && item.validation_issues.length > 0) || (item.bot_analysis && item.bot_analysis.issues && item.bot_analysis.issues.length > 0)) && (
                            <div className="bg-rose-950/10 border border-rose-900/30 rounded-md p-3 mb-4">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-semibold text-rose-400 text-xs uppercase tracking-wider mb-1">Issues Detected</p>
                                  <ul className="list-disc list-inside text-xs text-rose-300/80 space-y-0.5">
                                    {/* Traditional Issues */}
                                    {item.validation_issues?.map((issue, i) => (
                                      <li key={`v-${i}`} className="truncate">{issue}</li>
                                    ))}
                                    {/* Bot Issues */}
                                    {item.bot_analysis?.issues?.map((issue, i) => (
                                      <li key={`b-${i}`} className="truncate">{issue} <span className="text-[10px] opacity-60 ml-1">(AI)</span></li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                              onClick={() => handleActionClick(item, 'REVISION')}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-2" /> Request Revision
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20"
                              onClick={() => handleActionClick(item, 'APPROVE')}
                            >
                              <Check className="h-3.5 w-3.5 mr-2" /> Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recently Approved */}
          <Card className="bg-slate-900 border-slate-800 shadow-none shrink-0">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Recently Approved</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {recentApprovals.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded bg-slate-950/50 border border-slate-800/50">
                    <div className="flex items-center overflow-hidden min-w-0">
                      <div className="p-1.5 bg-emerald-500/10 rounded mr-3">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-slate-200 truncate">{item.filename}</p>
                        <p className="text-[10px] text-slate-500 truncate">Approved by Admin • {item.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentApprovals.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">No history available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="space-y-6 flex flex-col">

          {/* Statistics Widget */}
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <StatItem label="Pending Review" value={stats.pending_count} color="text-amber-400" />
              <StatItem label="Auto-Approved" value={stats.auto_approved_count} color="text-emerald-400" />
              <StatItem label="Rejected / Revised" value={stats.rejected_count} color="text-rose-400" />
            </CardContent>
          </Card>

          {/* Quick Actions Widget */}
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <SidebarBtn
                icon={CheckCircle}
                color="text-emerald-400"
                bg="hover:bg-slate-800 border-slate-800"
                label="Approve All"
                sub="Clear entire queue"
                onClick={handleApproveAll}
              />
              <SidebarBtn
                icon={Mail}
                color="text-blue-400"
                bg="hover:bg-slate-800 border-slate-800"
                label="Bulk Revision"
                sub="Email all failed items"
                onClick={() => alert("Bulk revisions sent.")}
              />
              <SidebarBtn
                icon={SlidersHorizontal}
                color="text-purple-400"
                bg="hover:bg-slate-800 border-slate-800"
                label="Validation Rules"
                sub="Adjust automated checks"
                onClick={() => navigate('/settings')}
              />
            </CardContent>
          </Card>

          {/* Active Rules Widget */}
          <Card className="bg-slate-900 border-slate-800 shadow-none flex-1">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Active Checks</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <RuleItem
                icon={Bot}
                color="text-rose-400"
                bg="bg-rose-500/10"
                title="Syllabus Auditor"
                desc="Scans for Vision, Mission & Grading"
              />
              <RuleItem
                icon={FileCheck}
                color="text-blue-400"
                bg="bg-blue-500/10"
                title="Format Validator"
                desc="Strict .pdf & .docx enforcement"
              />
              <RuleItem
                icon={Scale}
                color="text-emerald-400"
                bg="bg-emerald-500/10"
                title="Size Limiter"
                desc="Max file size 25MB"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              {pendingAction === 'APPROVE' ? (
                <><Check className="h-5 w-5 text-emerald-500" /> Approve Submission</>
              ) : (
                <><RotateCcw className="h-5 w-5 text-amber-500" /> Request Revision</>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {pendingAction === 'APPROVE'
                ? "This will mark the document as valid and notify the faculty."
                : "This will return the document to the faculty for correction."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-400 uppercase">
                {pendingAction === 'REVISION' ? "Reason for Rejection" : "Remarks (Optional)"}
              </Label>
              <Textarea
                placeholder={pendingAction === 'REVISION' ? "e.g., Wrong file format, missing signature..." : "Add a note..."}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-[100px] focus:border-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={pendingAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Confirm Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 w-[90vw] max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 shrink-0">
            <DialogTitle className="text-slate-100 text-sm">Document Preview</DialogTitle>
            {/* Close button provided by Dialog primitive, usually */}
          </div>
          <div className="flex-1 bg-slate-950 relative">
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Document Preview"
              allow="autoplay"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Visual Helpers ---

const RuleItem = ({ icon: Icon, color, bg, title, desc }) => (
  <div className="flex items-start gap-3">
    <div className={`p-2 rounded-md ${bg} shrink-0`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="min-w-0">
      <p className="font-medium text-sm text-slate-200">{title}</p>
      <p className="text-xs text-slate-500 leading-tight mt-0.5">{desc}</p>
    </div>
  </div>
);

const StatItem = ({ label, value, color }) => (
  <div className="flex justify-between items-center p-2 rounded bg-slate-950/30 border border-slate-800/50">
    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`font-mono font-bold text-lg ${color}`}>{value}</span>
  </div>
);

const SidebarBtn = ({ icon: Icon, color, bg, label, sub, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg border transition-all text-left group ${bg}`}
  >
    <div className={`mr-3 p-1.5 rounded bg-slate-950/50 group-hover:bg-slate-950 transition-colors`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm text-slate-200 truncate">{label}</p>
      <p className="text-[10px] text-slate-500 truncate">{sub}</p>
    </div>
    <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
  </button>
);