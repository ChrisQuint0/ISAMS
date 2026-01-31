import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/hooks/useAuth";
import plpLogo from "@/assets/images/plp_logo.png";
import ccsLogo from "@/assets/images/ccs_logo.png";
import isamsLogo from "@/assets/images/isams_logo_icon.png";
import isamsLogoText from "@/assets/images/isams_logo_text.png";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Sign in with Supabase
      await signIn(formData.email, formData.password);

      // Redirect to dashboard on success
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src={plpLogo}
              alt="PLP Logo"
              className="h-16 w-16 object-contain"
            />
            <img
              src={ccsLogo}
              alt="CCS Logo"
              className="h-16 w-16 object-contain"
            />
            <img
              src={isamsLogo}
              alt="ISAMS Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          <img src={isamsLogoText} alt="ISAMS" className="h-8 mx-auto mb-2" />
          <p className="text-sm text-slate-400 mt-1.5">
            Integrated Smart Academic Management System
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            College of Computer Studies
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-100 text-center">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-200"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-200"
                  >
                    Password
                  </Label>
                  {/* Forgot password - hidden but kept for future implementation */}
                  <button
                    type="button"
                    className="hidden text-xs text-slate-400 hover:text-slate-300 font-medium transition-colors"
                    onClick={() =>
                      alert("Forgot password functionality coming soon!")
                    }
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:ring-slate-600"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-950/50 border border-red-900/50 text-red-200 px-3.5 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium shadow-sm transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            © 2026 College of Computer Studies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
