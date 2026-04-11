import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogo } from "../hooks/useLogo";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { settingsService } from "../services/settingsService";
import { Loader2, Upload, Trash2, Image as ImageIcon, School, Save, Key, CheckCircle2, AlertCircle } from "lucide-react";
import ccsLogoDefault from "@/assets/images/ccs_logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SystemSettings() {
  const { user, rbac } = useAuth();
  const { logoUrl, isLoading: isLogoLoading, uploadLogo, deleteLogo } = useLogo();
  const { settings, isLoading: isSettingsLoading, updateCollegeName } = useSettings();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [collegeName, setCollegeName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Google Auth State
  const [googleStatus, setGoogleStatus] = useState({
    authenticated: false,
    email: "",
    isLoading: true,
    authUrl: ""
  });

  const isFetching = useRef(false);
  const lastCheckedId = useRef(null);

  // Dialog States
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: "",
    description: "",
    variant: "default"
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: null
  });

  const showAlert = (title, description, variant = "default") => {
    setAlertDialog({ open: true, title, description, variant });
  };

  const showConfirm = (title, description, onConfirm) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  // Sync state when settings load
  useEffect(() => {
    if (settings.college_name) {
      setCollegeName(settings.college_name);
    }
  }, [settings.college_name]);

  const checkGoogleStatus = useCallback(async (force = false) => {
    if (!user?.id) return;
    if (!force && isFetching.current) return;
    if (!force && lastCheckedId.current === user.id && googleStatus.authUrl) return;

    isFetching.current = true;
    lastCheckedId.current = user.id;

    if (!googleStatus.authUrl) {
      setGoogleStatus(prev => ({ ...prev, isLoading: true }));
    }

    try {
      const status = await settingsService.getGoogleAuthStatus(user.id);
      let url = "";
      if (!status.authenticated) {
        url = await settingsService.getGoogleAuthUrl(user.id);
      }
      setGoogleStatus({
        authenticated: status.authenticated,
        email: status.email || "",
        isLoading: false,
        authUrl: url || ""
      });
    } catch (error) {
      console.error("Error checking Google status:", error);
      setGoogleStatus(prev => ({ ...prev, authenticated: false, isLoading: false }));
    } finally {
      isFetching.current = false;
    }
  }, [user?.id, googleStatus.authUrl]);

  useEffect(() => {
    if (user?.id && lastCheckedId.current !== user.id) {
      checkGoogleStatus();
    }
  }, [user?.id, checkGoogleStatus]);

  const handleGoogleAuth = async () => {
    let url = googleStatus.authUrl;

    try {
      // If we don't have a URL yet (e.g. we were already authenticated), fetch it now
      if (!url) {
        setGoogleStatus(prev => ({ ...prev, isLoading: true }));
        url = await settingsService.getGoogleAuthUrl(user.id);
        if (!url) {
          showAlert("Error", "Could not retrieve authentication link.");
          setGoogleStatus(prev => ({ ...prev, isLoading: false }));
          return;
        }
        setGoogleStatus(prev => ({ ...prev, authUrl: url, isLoading: false }));
      }

      if (window.__TAURI_INTERNALS__) {
        try {
          // Use Tauri Shell Plugin to open external browser
          const { open } = await import("@tauri-apps/plugin-shell");
          await open(url);
        } catch (err) {
          console.error("Tauri shell open failed:", err);
          // Fallback to standard open
          window.open(url, "_blank");
        }
      } else {
        // Standard browser behavior
        window.open(url, "_blank");
      }

      // Start polling to check if authentication is complete
      const timer = setInterval(() => {
        checkGoogleStatus(true);
      }, 5000);

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(timer), 300000);
    } catch (error) {
      console.error("Google handleAuth error:", error);
      showAlert("Authentication Error", "Failed to initiate Google authentication. Please try again.", "destructive");
      setGoogleStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      await uploadLogo(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
      showAlert("Success", "Logo updated successfully!");
    } catch (error) {
      showAlert("Upload Failed", "Failed to upload logo. Please try again.", "destructive");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    showConfirm(
      "Revert to Default?",
      "Are you sure you want to delete the custom logo and revert to the default CCS logo?",
      async () => {
        try {
          await deleteLogo();
          showAlert("Success", "Logo reverted to default.");
        } catch (error) {
          showAlert("Error", "Failed to delete logo.", "destructive");
        }
      }
    );
  };

  const handleSaveName = async () => {
    if (!collegeName.trim()) return;
    setIsSavingName(true);
    try {
      await updateCollegeName(collegeName);
      showAlert("Success", "College name updated successfully!");
    } catch (error) {
      showAlert("Error", "Failed to update college name.", "destructive");
    } finally {
      setIsSavingName(false);
    }
  };

  const isAdmin =
    rbac?.superadmin ||
    rbac?.thesis_role === "admin" ||
    rbac?.facsub_role === "admin" ||
    rbac?.labman_role === "admin" ||
    rbac?.studvio_role === "admin";

  return (
    <div className="space-y-6">
      {/* Google Drive Connection - Only for admins */}
      {isAdmin && (
        <Card className="max-w-2xl border-border bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-primary-500" />
              Google Drive Connection
            </CardTitle>
            <CardDescription>
              Authenticate your Google account to manage uploads and ownership in Google Drive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleStatus.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking connection status...
              </div>
            ) : googleStatus.authenticated ? (
              <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Connected as</p>
                    <p className="text-xs text-muted-foreground">{googleStatus.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoogleAuth}
                  className="border-primary-500/30 text-primary-600 hover:bg-primary-500/10"
                >
                  Change Account
                </Button>
              </div>
            ) : (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Not Connected</p>
                    <p className="text-xs text-muted-foreground text-pretty">
                      You are currently using the system's global Google Drive account. Authenticate to use your own.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGoogleAuth}
                  className="w-full bg-[#008A45] hover:bg-[#007038] text-white"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google" />
                  Authenticate Google Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* College Name Settings */}
      <Card className="max-w-2xl border-border bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <School className="h-5 w-5 text-primary-500" />
            General Information
          </CardTitle>
          <CardDescription>
            Update the name of the college displayed across the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground/70">College Name</Label>
            <div className="flex gap-2">
              <Input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="Enter College Name"
                className="flex-1"
                disabled={isSettingsLoading}
              />
              <Button
                onClick={handleSaveName}
                disabled={isSavingName || isSettingsLoading || collegeName === settings.college_name}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {isSavingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Settings */}
      <Card className="max-w-2xl border-border bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary-500" />
            Dynamic Logo
          </CardTitle>
          <CardDescription>
            Customize the logo displayed on the login page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Current Logo Preview */}
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-semibold text-foreground/70">Current Displayed Logo</Label>
              <div className="h-40 w-40 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-background/50 overflow-hidden relative group">
                {isLogoLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <img
                    src={logoUrl || ccsLogoDefault}
                    alt="Current CCS Logo"
                    className="h-32 w-32 object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      if (e.target.src !== ccsLogoDefault) {
                        e.target.src = ccsLogoDefault;
                      }
                    }}
                  />
                )}
                {!logoUrl && !isLogoLoading && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary-500/10 text-primary-500 text-[10px] font-bold rounded-full border border-primary-500/20">
                    DEFAULT
                  </div>
                )}
              </div>
              {logoUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  className="w-full mt-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revert to Default
                </Button>
              )}
            </div>

            {/* Upload New Logo */}
            <div className="space-y-4 flex-1 w-full">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground/70">Upload New Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {previewUrl && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                  <p className="text-xs font-medium text-muted-foreground">Preview:</p>
                  <div className="h-24 w-24 rounded-lg border border-border flex items-center justify-center bg-background p-2">
                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full bg-primary-500 hover:bg-primary-600 shadow-md shadow-primary-500/20"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Uploading..." : "Save New Logo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Alert Dialog */}
      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={alertDialog.variant === "destructive" ? "text-destructive" : ""}>
              {alertDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertDialog(prev => ({ ...prev, open: false }))}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              className="bg-primary-500 hover:bg-primary-600"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Label({ children, className }) {
  return <label className={`block ${className}`}>{children}</label>;
}