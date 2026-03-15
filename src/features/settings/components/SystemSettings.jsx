import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogo } from "../hooks/useLogo";
import { useSettings } from "../hooks/useSettings";
import { Loader2, Upload, Trash2, Image as ImageIcon, School, Save } from "lucide-react";
import ccsLogoDefault from "@/assets/images/ccs_logo.png";

export function SystemSettings() {
  const { logoUrl, isLoading: isLogoLoading, uploadLogo, deleteLogo } = useLogo();
  const { settings, isLoading: isSettingsLoading, updateCollegeName } = useSettings();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [collegeName, setCollegeName] = useState(settings.college_name);
  const [isSavingName, setIsSavingName] = useState(false);

  // Sync state when settings load
  useEffect(() => {
    setCollegeName(settings.college_name);
  }, [settings.college_name]);

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
      alert("Logo updated successfully!");
    } catch (error) {
      alert("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete the custom logo and revert to default?")) {
      try {
        await deleteLogo();
        alert("Logo reverted to default.");
      } catch (error) {
        alert("Failed to delete logo.");
      }
    }
  };

  const handleSaveName = async () => {
    if (!collegeName.trim()) return;
    setIsSavingName(true);
    try {
      await updateCollegeName(collegeName);
      alert("College name updated successfully!");
    } catch (error) {
      alert("Failed to update college name.");
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="space-y-6">
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
            Dynamic CCS Logo
          </CardTitle>
          <CardDescription>
            Customize the CCS logo displayed on the login page.
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
    </div>
  );
}

function Label({ children, className }) {
  return <label className={`block ${className}`}>{children}</label>;
}
