import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <Card className="p-8 bg-slate-900/60 border-slate-800 max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">403</h1>
          <h2 className="text-xl font-semibold text-slate-300">Access Denied</h2>
        </div>

        <p className="text-slate-400 mb-6">
          You don't have permission to access this resource. Only Administrators,
          OJT Coordinators, and Research Coordinators can view reports and
          analytics.
        </p>

        <p className="text-sm text-slate-500 mb-6">
          If you believe this is an error, please contact your system administrator.
        </p>

        <div className="flex gap-3">
          <Link to="/dashboard" className="flex-1">
            <Button variant="default" className="w-full">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
