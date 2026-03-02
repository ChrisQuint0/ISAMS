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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse opacity-20"
          style={{ background: 'var(--gradient-primary)' }}
        ></div>
        <div
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse opacity-20"
          style={{ background: 'var(--gradient-heritage)', animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[100px] animate-pulse opacity-10"
          style={{ background: 'var(--gradient-accent)', animationDelay: "2s" }}
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
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            Integrated Smart Academic Management System
          </p>
          <p className="text-xs text-primary/60 mt-0.5 font-semibold">
            College of Computer Studies
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border bg-card/80 backdrop-blur-md shadow-2xl">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold text-foreground text-center tracking-tight">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-foreground/80"
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
                  className="h-11 bg-background border-input focus:ring-primary-500 transition-all font-medium"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground/80"
                  >
                    Password
                  </Label>
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
                  className="h-11 bg-background border-input focus:ring-primary-500 transition-all font-medium"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground font-medium">
            © 2026 College of Computer Studies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
