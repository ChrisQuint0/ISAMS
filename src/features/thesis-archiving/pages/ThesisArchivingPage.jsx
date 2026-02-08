import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, FileText, ExternalLink, RefreshCw, Settings, FolderCog } from "lucide-react";
import { useState, useEffect } from "react";

export default function ThesisArchivingPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Settings
  const [thesisFolderLink, setThesisFolderLink] = useState("");
  const [hteFolderLink, setHteFolderLink] = useState("");
  const [currentTab, setCurrentTab] = useState("thesis");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize links from localStorage or defaults
  useEffect(() => {
    const savedThesisLink = localStorage.getItem("thesisFolderLink") || "https://drive.google.com/drive/folders/1PoDMue8jouBrCUFYFARqynszJfJxzHT6?usp=drive_link";
    const savedHteLink = localStorage.getItem("hteFolderLink") || "https://drive.google.com/drive/folders/1TN4ul79WYVlaNODeVMvMBhKZkFkUal3c?usp=drive_link";
    setThesisFolderLink(savedThesisLink);
    setHteFolderLink(savedHteLink);
  }, []);

  // Helpers to extract ID
  const getFolderId = (link) => {
    try {
      // Regex to extract ID from URL
      const match = link.match(/folders\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    } catch (e) {
      console.error("Invalid link", e);
      return null;
    }
  };

  const getCurrentFolderId = () => {
    const link = currentTab === "thesis" ? thesisFolderLink : hteFolderLink;
    return getFolderId(link);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [currentTab, thesisFolderLink, hteFolderLink]);

  const checkAuthStatus = async () => {
    fetchFiles();
  };

  const fetchFiles = async () => {
    const folderId = getCurrentFolderId();
    if (!folderId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/files?folderId=${folderId}`);
      if (res.status === 401) {
        setIsAuthenticated(false);
      } else if (res.ok) {
        setIsAuthenticated(true);
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch files", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "width=500,height=600");
        alert("Please authorize in the popup window and then click OK to refresh.");
        checkAuthStatus();
      }
    } catch (error) {
      console.error("Failed to get auth URL", error);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const folderId = getCurrentFolderId();
    if (!folderId) {
      alert("Invalid folder configuration. Please check settings.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", folderId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("File uploaded successfully!");
        fetchFiles();
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("Upload error");
    } finally {
      setUploading(false);
      event.target.value = ""; // Reset input
    }
  };

  const saveSettings = () => {
    localStorage.setItem("thesisFolderLink", thesisFolderLink);
    localStorage.setItem("hteFolderLink", hteFolderLink);
    setIsSettingsOpen(false);
    fetchFiles(); // Refresh with new settings
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Thesis Archiving
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Manage and archive thesis documents via Google Drive
                </p>
              </div>
            </div>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                  <DialogTitle>Archive Settings</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Configure the Google Drive folders for each archive type.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="thesis-link">Thesis Folder Link</Label>
                    <Input
                      id="thesis-link"
                      value={thesisFolderLink}
                      onChange={(e) => setThesisFolderLink(e.target.value)}
                      className="bg-slate-950 border-slate-800 focus:border-blue-500"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hte-link">HTE Folder Link</Label>
                    <Input
                      id="hte-link"
                      value={hteFolderLink}
                      onChange={(e) => setHteFolderLink(e.target.value)}
                      className="bg-slate-950 border-slate-800 focus:border-blue-500"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-500 text-white">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl max-w-md w-full">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.01 1.993C6.486 1.993 2 6.48 2 12.007c0 5.526 4.486 10.014 10.01 10.014 5.526 0 10.01-4.488 10.01-10.014 0-5.527-4.484-10.014-10.01-10.014zm0 18.028c-4.417 0-8.01-3.593-8.01-8.014 0-4.42 3.593-8.013 8.01-8.013 4.417 0 8.01 3.593 8.01 8.013 0 4.42-3.593 8.014-8.01 8.014zm-1.002-9.014h-3.004l4.006-4.007 4.006 4.007h-3.004v5.008h-2.004v-5.008z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Connect Google Drive</h2>
              <p className="text-slate-400 mb-6 text-sm">
                Link your Google Drive account to access and archive thesis documents.
              </p>
              <Button
                onClick={handleConnect}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 transition-all duration-200"
              >
                Connect Account
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="bg-slate-900 border border-slate-800 p-1">
              <TabsTrigger value="thesis" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Thesis Archive</TabsTrigger>
              <TabsTrigger value="hte" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">HTE Archive</TabsTrigger>
            </TabsList>

            <TabsContent value="thesis" className="space-y-6">
              <FileView
                title="Thesis Documents"
                files={files}
                loading={loading}
                uploading={uploading}
                onRefresh={fetchFiles}
                onUpload={handleUpload}
                folderLink={thesisFolderLink}
              />
            </TabsContent>

            <TabsContent value="hte" className="space-y-6">
              <FileView
                title="HTE Documents"
                files={files}
                loading={loading}
                uploading={uploading}
                onRefresh={fetchFiles}
                onUpload={handleUpload}
                folderLink={hteFolderLink}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/30 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-xs text-slate-500 text-center">
            ISAMS - Thesis Archiving Module
          </p>
        </div>
      </footer>
    </div>
  );
}

function FileView({ title, files, loading, uploading, onRefresh, onUpload, folderLink }) {
  return (
    <div className="space-y-8">
      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-slate-200">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="h-8 w-8 text-slate-400 hover:text-white">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500 hidden md:block max-w-[200px] truncate" title={folderLink}>
            {folderLink}
          </div>
          <div className="relative">
            <input
              type="file"
              onChange={onUpload}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button
                asChild
                disabled={uploading}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <span>
                  {uploading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload</>}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 rounded-xl border border-slate-800/50 border-dashed">
          <FolderCog className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No files found used configured folder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="group bg-slate-900/60 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-slate-800 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-blue-400 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <h3 className="font-medium text-slate-200 truncate mb-1" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-500">Google Drive File</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
