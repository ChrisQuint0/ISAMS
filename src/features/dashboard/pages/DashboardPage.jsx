import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">ISAMS Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user?.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
          >
            Sign Out
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Thesis Archiving</CardTitle>
              <CardDescription className="text-gray-400">
                Manage thesis documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Faculty Requirements</CardTitle>
              <CardDescription className="text-gray-400">
                Submit and track requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Class Management</CardTitle>
              <CardDescription className="text-gray-400">
                Manage class lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Student Violations</CardTitle>
              <CardDescription className="text-gray-400">
                Track violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Coming soon...</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Lab Monitoring</CardTitle>
              <CardDescription className="text-gray-400">
                Monitor lab usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
