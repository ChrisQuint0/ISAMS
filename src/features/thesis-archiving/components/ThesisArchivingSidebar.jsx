import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Database, BookOpen, FileSearch, User, ChevronUp, LogOut, LayoutDashboard } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThesisArchivingSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        {
            path: "/thesis-archiving/digital-repository",
            label: "Digital Repository",
            icon: Database,
        },
        {
            path: "/thesis-archiving/similarity-check",
            label: "Similarity Check",
            icon: FileSearch,
        },
    ];

    return (
        <Sidebar variant="sidebar" collapsible="icon" className="bg-slate-900 border-slate-800">
            <SidebarHeader className="bg-slate-900 border-b border-slate-800">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="hover:bg-slate-800 data-[state=open]:bg-slate-800"
                        >
                            {/* Icon Container */}
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                                <BookOpen className="size-4" />
                            </div>

                            {/* Text Container - SidebarMenuButton handles hiding this automatically */}
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold text-slate-100">
                                    Thesis / HTE Archiving
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-slate-900 overflow-x-hidden">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="mb-1">
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/thesis-archiving/dashboard")}
                                    tooltip="Dashboard"
                                    className={`text-slate-300 hover:text-slate-300 hover:!bg-slate-800 transition-colors ${isActive("/thesis-archiving/dashboard") ? "!bg-slate-800 !text-slate-300" : ""
                                        }`}
                                >
                                    <Link to="/thesis-archiving/dashboard">
                                        <LayoutDashboard className={`h-4 w-4 ${isActive("/thesis-archiving/dashboard") ? "text-blue-400" : ""}`} />
                                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-slate-500 group-data-[collapsible=icon]:hidden">
                        THESIS / CAPSTONE
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.path} className="mb-1">
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.path)}
                                        tooltip={item.label}
                                        className={`text-slate-300 hover:!text-slate-300 hover:!bg-slate-800 transition-colors ${isActive(item.path) ? "!bg-slate-800 !text-slate-300" : ""
                                            }`}
                                    >
                                        <Link to={item.path}>
                                            <item.icon
                                                className={`h-4 w-4 ${isActive(item.path) ? "text-blue-400" : ""}`}
                                            />
                                            <span className="group-data-[collapsible=icon]:hidden">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="bg-slate-900 border-slate-800 p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-200 group-data-[collapsible=icon]:justify-center"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-slate-700 shrink-0">
                                        <User className="size-4 text-slate-100" />
                                    </div>
                                    <div className="flex-1 text-left text-slate-200 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                                        <span className="truncate font-medium block">User Account</span>
                                        <span className="truncate text-xs text-slate-400">Thesis Archiving</span>
                                    </div>
                                    <ChevronUp className="ml-auto size-4 text-slate-500 group-data-[collapsible=icon]:hidden shrink-0" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                                <DropdownMenuItem
                                    onClick={() => navigate("/dashboard")}
                                    className="text-red-400 hover:bg-red-950/30 focus:bg-red-950/30 focus:text-red-400"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
