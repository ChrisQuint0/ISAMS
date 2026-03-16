import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    Database,
    BookOpen,
    FileSearch,
    User,
    ChevronUp,
    LogOut,
    LayoutDashboard,
    Archive,
    BarChart3,
    History,
    GraduationCap
} from "lucide-react";
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

    const hteItems = [
        {
            path: "/thesis-archiving/hte-archiving/document-archive",
            label: "Document Archive",
            icon: Archive,
        },
    ];

    const insightItems = [
        {
            path: "/thesis-archiving/insights/reports",
            label: "Reports and Analytics",
            icon: BarChart3,
        },
        {
            path: "/thesis-archiving/insights/audit-trail",
            label: "Audit Trail",
            icon: History,
        },
    ];

    return (
        <Sidebar variant="sidebar" collapsible="icon" className="bg-white border-neutral-200">
            <SidebarHeader className="bg-white border-b border-neutral-200 h-16 flex items-center justify-center">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="hover:bg-neutral-50 data-[state=open]:bg-neutral-50 w-full"
                        >
                            {/* Icon Container */}
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary-500 text-white">
                                <BookOpen className="size-4" />
                            </div>

                            {/* Text Container - SidebarMenuButton handles hiding this automatically */}
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium text-neutral-900">
                                    Thesis / HTE Archiving
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-white overflow-x-hidden">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="mb-1">
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/thesis-archiving/dashboard")}
                                    tooltip="Dashboard"
                                    className={`transition-colors group ${isActive("/thesis-archiving/dashboard") ? "!bg-primary-50 !text-primary-600 font-medium" : "text-neutral-600 hover:!bg-primary-50 hover:!text-primary-600"
                                        }`}
                                >
                                    <Link to="/thesis-archiving/dashboard">
                                        <LayoutDashboard className={`h-4 w-4 transition-colors ${isActive("/thesis-archiving/dashboard") ? "text-primary-600" : "text-neutral-500 group-hover:text-primary-600"}`} />
                                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-neutral-500 font-medium group-data-[collapsible=icon]:hidden">
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
                                        className={`transition-colors group ${isActive(item.path) ? "!bg-primary-50 !text-primary-600 font-medium" : "text-neutral-600 hover:!bg-primary-50 hover:!text-primary-600"
                                            }`}
                                    >
                                        <Link to={item.path}>
                                            <item.icon
                                                className={`h-4 w-4 transition-colors ${isActive(item.path) ? "text-primary-600" : "text-neutral-500 group-hover:text-primary-600"}`}
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

                <SidebarGroup>
                    <SidebarGroupLabel className="text-neutral-500 group-data-[collapsible=icon]:hidden text-[10px] font-bold tracking-wider uppercase">
                        HTE / INTERNSHIP
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {hteItems.map((item) => (
                                <SidebarMenuItem key={item.path} className="mb-1">
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.path)}
                                        tooltip={item.label}
                                        className={`transition-colors group ${isActive(item.path) ? "!bg-primary-50 !text-primary-600 font-medium" : "text-neutral-600 hover:!bg-primary-50 hover:!text-primary-600"
                                            }`}
                                    >
                                        <Link to={item.path}>
                                            <item.icon
                                                className={`h-4 w-4 transition-colors ${isActive(item.path) ? "text-primary-600" : "text-neutral-500 group-hover:text-primary-600"}`}
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

                <SidebarGroup>
                    <SidebarGroupLabel className="text-neutral-500 group-data-[collapsible=icon]:hidden text-[10px] font-bold tracking-wider uppercase">
                        INSIGHTS
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {insightItems.map((item) => (
                                <SidebarMenuItem key={item.path} className="mb-1">
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.path)}
                                        tooltip={item.label}
                                        className={`transition-colors group ${isActive(item.path) ? "!bg-primary-50 !text-primary-600 font-medium" : "text-neutral-600 hover:!bg-primary-50 hover:!text-primary-600"
                                            }`}
                                    >
                                        <Link to={item.path}>
                                            <item.icon
                                                className={`h-4 w-4 transition-colors ${isActive(item.path) ? "text-primary-600" : "text-neutral-500 group-hover:text-primary-600"}`}
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

            <SidebarFooter className="bg-white border-t border-neutral-200 p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="w-full justify-start gap-3 hover:bg-neutral-50 text-neutral-900 group-data-[collapsible=icon]:justify-center"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary-100 shrink-0">
                                        <User className="size-4 text-primary-600" />
                                    </div>
                                    <div className="flex-1 text-left text-neutral-900 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                                        <span className="truncate font-medium block">User Account</span>
                                        <span className="truncate text-xs text-neutral-500">Thesis Archiving</span>
                                    </div>
                                    <ChevronUp className="ml-auto size-4 text-neutral-400 group-data-[collapsible=icon]:hidden shrink-0" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" className="w-56 bg-white border-neutral-200 text-neutral-900 shadow-md">
                                <DropdownMenuItem
                                    onClick={() => navigate("/dashboard")}
                                    className="text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
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
