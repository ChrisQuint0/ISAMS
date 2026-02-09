import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import {
  Shield,
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  BarChart,
  Database,
  Settings,
  User,
  Eye,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Dynamic State
  const [stats, setStats] = useState({
    activeFaculty: 0,
    pendingValidation: 0,
    dashboardAlerts: 0,
    systemStatus: 'Online'
  });
  const [loading, setLoading] = useState(true);

  const isActive = (path) => location.pathname === path;

  // Fetch Real Data on Mount
  useEffect(() => {
    fetchSidebarStats();
    
    // Optional: Auto-refresh stats every 60 seconds
    const interval = setInterval(fetchSidebarStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSidebarStats = async () => {
    try {
      // Run both queries in parallel for speed
      const [dashStats, validStats] = await Promise.all([
        invoke('get_dashboard_stats'),
        invoke('get_validation_stats')
      ]);

      setStats({
        activeFaculty: dashStats.total_faculty || 0,
        pendingValidation: validStats.pending_count || 0,
        // For dashboard badge, we can show total pending approvals as the "Alert" number
        dashboardAlerts: dashStats.pending_approvals || 0, 
        systemStatus: 'Online'
      });
    } catch (error) {
      console.error("Failed to update sidebar stats:", error);
      setStats(prev => ({ ...prev, systemStatus: 'Error' }));
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { 
      path: '/admin-dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      // Only show badge if > 0
      badge: stats.dashboardAlerts > 0 ? stats.dashboardAlerts.toString() : null, 
      badgeColor: 'bg-blue-500' 
    },
    { path: '/faculty-monitor', label: 'Faculty Monitor', icon: Users },
    { path: '/deadlines', label: 'Deadline Manager', icon: Calendar },
    { 
      path: '/validation', 
      label: 'Validation Queue', 
      icon: CheckSquare, 
      badge: stats.pendingValidation > 0 ? stats.pendingValidation.toString() : null, 
      badgeColor: 'bg-red-500' 
    },
    { path: '/reports', label: 'Reports', icon: BarChart },
    { path: '/archive', label: 'Document Archive', icon: Database },
  ];

  return (
    <div className="sidebar flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10 transition-all duration-200 ease-in-out">
      {/* Header */}
      <div className="sidebar-header p-6">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center font-bold mr-3 shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Admin Portal</h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dean's Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="nav-section px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          Admin Navigation
        </div>

        {navItems.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`nav-item px-6 py-3 flex items-center cursor-pointer transition-colors duration-150 group relative ${
              isActive(item.path)
                ? 'bg-green-50 text-green-700 border-r-4 border-green-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className={`mr-3 h-5 w-5 transition-colors ${
              isActive(item.path) ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
            <span className="font-medium text-sm">{item.label}</span>
            
            {item.badge && (
              <div className="ml-auto">
                <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold text-white rounded-full shadow-sm ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>
            )}
          </div>
        ))}

        <div className="nav-section px-6 py-2 mt-6 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          System Tools
        </div>

        <div
          onClick={() => navigate('/settings')}
          className={`nav-item px-6 py-3 flex items-center cursor-pointer transition-colors duration-150 group ${
            isActive('/settings')
              ? 'bg-green-50 text-green-700 border-r-4 border-green-500'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings className={`mr-3 h-5 w-5 transition-colors ${
            isActive('/settings') ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
          }`} />
          <span className="font-medium text-sm">System Settings</span>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="user-profile mt-auto p-5 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-green-600 flex items-center justify-center font-bold mr-3 shrink-0 shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm text-gray-900 truncate">Dean's Office</p>
            <p className="text-xs text-gray-500 truncate">Administrator</p>
          </div>
        </div>
        
        <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex justify-between text-xs items-center">
            <span className="text-gray-500">System Status:</span>
            <span className={`font-semibold flex items-center ${
              stats.systemStatus === 'Online' ? 'text-green-600' : 'text-red-500'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${
                stats.systemStatus === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></span>
              {stats.systemStatus}
            </span>
          </div>
          <div className="flex justify-between text-xs items-center border-t border-gray-50 pt-2">
            <span className="text-gray-500">Active Faculty:</span>
            <span className="font-semibold text-gray-900">{stats.activeFaculty}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
            <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200"
                onClick={fetchSidebarStats}
                disabled={loading}
            >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Sync
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Logout"
                onClick={() => alert("Logout logic here")}
            >
                <LogOut className="h-3.5 w-3.5" />
            </Button>
        </div>
      </div>
    </div>
  );
}