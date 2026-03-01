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
    const result = await processAction(selectedItem, pendingAction, remarks);
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
    if (filename.endsWith('.pdf')) return <FileText className="h-8 w-8 text-destructive" />;
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <FileText className="h-8 w-8 text-success" />;
    if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <FileText className="h-8 w-8 text-info" />;
    return <FileText className="h-8 w-8 text-neutral-400" />;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Validation Queue</h1>
          <p className="text-neutral-500 text-sm font-medium">Review and approve flagged submissions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 shadow-sm transition-all"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* Pending Review Card */}
          <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-[400px]">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Pending Review
                  <Badge variant="secondary" className="bg-white text-neutral-700 ml-2 border-neutral-200 shadow-sm">{queue.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-neutral-50/50">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {loading ? (
                    <div className="text-center py-12 text-neutral-500 font-medium">Loading queue...</div>
                  ) : queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                      <div className="h-16 w-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-neutral-200">
                        <CheckCircle className="h-8 w-8 text-success" />
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900">All caught up!</h3>
                      <p className="text-sm font-medium mt-1">No pending submissions require validation.</p>
                    </div>
                  ) : (
                    queue.map((item) => (
                      <div key={item.submission_id} className="group border border-neutral-200 rounded-xl bg-white hover:border-primary-400 transition-all shadow-sm">
                        {/* Header Row */}
                        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 rounded-t-xl">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                {item.is_staged && (
                                  <Badge className="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 px-1.5 py-0.5 text-[10px] font-bold uppercase shadow-sm">
                                    <Scale className="h-3 w-3 mr-1" /> Sandbox
                                  </Badge>
                                )}
                                {item.submission_status === 'VALIDATED' ? (
                                  <Badge className="bg-success/10 text-success border-success/20 px-1.5 py-0.5 text-[10px] font-bold uppercase shadow-sm">
                                    Validated
                                  </Badge>
                                ) : (
                                  <Badge className="bg-warning/10 text-warning border-warning/20 px-1.5 py-0.5 text-[10px] font-bold uppercase shadow-sm">
                                    Manual Review
                                  </Badge>
                                )}
                                <span className="text-xs text-neutral-500 font-bold flex items-center uppercase tracking-wider">
                                  <Bot className="h-3.5 w-3.5 mr-1" /> Automated Check
                                </span>
                              </div>
                              <h4 className="font-bold text-neutral-900 text-sm">
                                {item.doc_type_name}
                              </h4>
                              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                                Submitted by <span className="text-neutral-900 font-bold">{item.faculty_name}</span> • {item.course_code}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-neutral-500 bg-white px-2 py-1 rounded-md border border-neutral-200 shadow-sm uppercase tracking-wider">
                              {item.submitted_at}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          {/* File Info Row */}
                          <div className="flex items-center p-3 rounded-lg bg-neutral-50 border border-neutral-200 mb-4 group-hover:border-primary-200 transition-colors shadow-inner">
                            <div className="mr-3 bg-white p-2 rounded border border-neutral-100 shadow-sm">
                              {getFileIcon(item.original_filename)}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-sm font-bold text-neutral-900 truncate" title={item.original_filename}>
                                {item.original_filename || "Untitled Document"}
                              </p>
                              <button
                                onClick={() => downloadFile(item.submission_id)}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center mt-1"
                              >
                                <Download className="h-3 w-3 mr-1" /> Download Original
                              </button>
                            </div>
                            {item.gdrive_web_view_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 bg-white ml-2 transition-all shadow-sm"
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
                              className="h-7 text-xs border-info/20 bg-info/5 text-info hover:bg-info/10 font-bold shadow-sm"
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
                              <Badge className="bg-success/10 text-success border-success/20 font-bold shadow-sm">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> AI Clean
                              </Badge>
                            )}
                          </div>

                          {/* Analysis Results / Issues */}
                          {((item.validation_issues && item.validation_issues.length > 0) || (item.bot_analysis && item.bot_analysis.issues && item.bot_analysis.issues.length > 0)) && (
                            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 mb-4 shadow-sm">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-bold text-destructive text-xs uppercase tracking-wider mb-1">Issues Detected</p>
                                  <ul className="list-disc list-inside text-xs text-destructive/80 font-medium space-y-0.5">
                                    {/* Traditional Issues */}
                                    {item.validation_issues?.map((issue, i) => (
                                      <li key={`v-${i}`} className="truncate">{issue}</li>
                                    ))}
                                    {/* Bot Issues */}
                                    {item.bot_analysis?.issues?.map((issue, i) => (
                                      <li key={`b-${i}`} className="truncate">{issue} <span className="text-[10px] opacity-60 ml-1 font-bold">(AI)</span></li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-2 border-t border-neutral-100">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 shadow-sm font-bold transition-all active:scale-95"
                              onClick={() => handleActionClick(item, 'REQUEST_REVISION')}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-2 text-warning" /> Request Revision
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-success hover:bg-success/90 text-white shadow-sm font-bold transition-all active:scale-95"
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
          <Card className="bg-white border-neutral-200 shadow-sm shrink-0">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3">
              <CardTitle className="text-base text-neutral-900 font-bold">Recently Approved</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {recentApprovals.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 shadow-sm">
                    <div className="flex items-center overflow-hidden min-w-0">
                      <div className="p-1.5 bg-success/10 border border-success/20 rounded-md mr-3">
                        <FileCheck className="h-4 w-4 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-neutral-900 truncate">{item.filename}</p>
                        <p className="text-[10px] text-neutral-500 font-medium truncate">Approved by Admin • {item.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {recentApprovals.length === 0 && (
                  <p className="text-sm font-medium text-neutral-500 text-center py-2">No history available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="space-y-6 flex flex-col">

          {/* Statistics Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3">
              <CardTitle className="text-base text-neutral-900 font-bold">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <StatItem label="Pending Review" value={stats.pending_count} color="text-warning" />
              <StatItem label="Auto-Approved" value={stats.auto_approved_count} color="text-success" />
              <StatItem label="Rejected / Revised" value={stats.rejected_count} color="text-destructive" />

              <div className="pt-3 border-t border-neutral-100 space-y-3 mt-1">
                <StatItem label="Staging Sandbox" value={stats.sandbox_count} color="text-fuchsia-600" />
                <StatItem label="Official Vault" value={stats.vault_count} color="text-primary-600" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3">
              <CardTitle className="text-base text-neutral-900 font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <SidebarBtn
                icon={CheckCircle}
                color="text-success"
                label="Approve All"
                sub="Clear entire queue"
                onClick={handleApproveAll}
              />
              <SidebarBtn
                icon={Mail}
                color="text-info"
                label="Bulk Revision"
                sub="Email all failed items"
                onClick={() => alert("Bulk revisions sent.")}
              />
              <SidebarBtn
                icon={SlidersHorizontal}
                color="text-primary-600"
                label="Validation Rules"
                sub="Adjust automated checks"
                onClick={() => navigate('/settings')}
              />
            </CardContent>
          </Card>

          {/* Active Rules Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm flex-1">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3">
              <CardTitle className="text-base text-neutral-900 font-bold">Active Checks</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <RuleItem
                icon={Bot}
                color="text-primary-600"
                bg="bg-primary-50 border border-primary-100"
                title="Syllabus Auditor"
                desc="Scans for Vision, Mission & Grading"
              />
              <RuleItem
                icon={FileCheck}
                color="text-info"
                bg="bg-info/10 border border-info/20"
                title="Format Validator"
                desc="Strict .pdf & .docx enforcement"
              />
              <RuleItem
                icon={Scale}
                color="text-warning"
                bg="bg-warning/10 border border-warning/20"
                title="Size Limiter"
                desc="Max file size 25MB"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-white border-neutral-200 text-neutral-900 sm:max-w-[425px] shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 flex items-center gap-2 font-bold">
              {pendingAction === 'APPROVE' ? (
                <><Check className="h-5 w-5 text-success" /> Approve Submission</>
              ) : (
                <><RotateCcw className="h-5 w-5 text-warning" /> Request Revision</>
              )}
            </DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium">
              {pendingAction === 'APPROVE'
                ? "This will mark the document as valid and notify the faculty."
                : "This will return the document to the faculty for correction."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {pendingAction === 'REQUEST_REVISION' ? "Reason for Rejection *" : "Remarks (Optional)"}
              </Label>
              <Textarea
                placeholder={pendingAction === 'REQUEST_REVISION' ? "e.g., Wrong file format, missing signature..." : "Add a note..."}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 min-h-[100px] focus-visible:ring-primary-500 focus-visible:border-primary-500 shadow-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2 border-t border-neutral-100 pt-4">
            <Button
              variant="outline"
              className="bg-transparent border-neutral-200 text-neutral-700 hover:bg-neutral-100 shadow-sm"
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={`shadow-sm transition-all active:scale-95 font-bold ${pendingAction === 'APPROVE' ? 'bg-success hover:bg-success/90 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
              disabled={submitting || (pendingAction === 'REQUEST_REVISION' && remarks.trim().length === 0)}
            >
              {submitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? 'Processing...' : 'Confirm Action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-white border-neutral-200 text-neutral-900 w-[90vw] max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b border-neutral-200 bg-neutral-50/50 shrink-0">
            <DialogTitle className="text-neutral-900 text-sm font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary-600" /> Document Preview
            </DialogTitle>
          </div>
          <div className="flex-1 bg-neutral-100 relative">
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
  <div className="flex items-start gap-3 p-2 border border-transparent rounded-lg hover:border-neutral-100 hover:bg-neutral-50 transition-colors">
    <div className={`p-2 rounded-md ${bg} shrink-0 shadow-sm`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="min-w-0 pt-0.5">
      <p className="font-bold text-sm text-neutral-900 truncate">{title}</p>
      <p className="text-xs text-neutral-500 font-medium leading-tight mt-0.5">{desc}</p>
    </div>
  </div>
);

const StatItem = ({ label, value, color }) => (
  <div className="flex justify-between items-center p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 shadow-sm transition-colors hover:border-neutral-200">
    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
    <span className={`font-mono font-bold text-lg ${color}`}>{value}</span>
  </div>
);

const SidebarBtn = ({ icon: Icon, color, label, sub, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center w-full p-3 rounded-xl border border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50 transition-all text-left group shadow-sm active:scale-95"
  >
    <div className="mr-3 p-1.5 rounded-md bg-neutral-50 border border-neutral-100 group-hover:bg-white group-hover:border-primary-200 transition-colors shadow-sm">
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-sm text-neutral-900 truncate group-hover:text-primary-700 transition-colors">{label}</p>
      <p className="text-[10px] font-medium text-neutral-500 truncate mt-0.5">{sub}</p>
    </div>
    <ArrowRight className="h-3 w-3 text-neutral-400 group-hover:text-primary-600 transition-colors ml-2" />
  </button>
);