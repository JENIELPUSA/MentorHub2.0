import {
    // Core
    Home,
    Settings,

    // Management
    UserCog,
    BookOpen,
    FileText,

    // Scheduling
    CalendarDays,
    CalendarCheck,

    // Student Portal
    FolderOpen,
    Upload,
    Users,
    Lightbulb,

    // Records
    Archive,
    ScrollText,
} from "lucide-react";

import ProfileImage from "@/assets/profile-image.jpg";
import ProductImage from "@/assets/product-image.jpg";

/* ============================================================
   SIDEBAR NAVIGATION
   ============================================================ */
export const navbarLinks = [
    {
        title: "Dashboard",
        links: [
            {
                label: "Dashboard",
                icon: Home,
                path: "/dashboard",
            },
        ],
    },
    {
        title: "Management",
        links: [
            {
                label: "Manage User",
                icon: UserCog,
                path: "/dashboard/Add-User",
            },
            {
                label: "Manage Semester",
                icon: BookOpen,
                path: "/dashboard/Add-Subject",
            },
            {
                label: "Title Management",
                icon: FileText,
                path: "/dashboard/propose-title",
            },
        ],
    },
    {
        title: "Scheduling",
        links: [
            {
                label: "Defense Schedule",
                icon: CalendarDays,
                path: "/dashboard/defense_schedule",
            },
            {
                label: "Defense Calendar",
                icon: CalendarCheck,
                path: "/dashboard/defense-calendar",
            },
        ],
    },
    {
        title: "Student Portal",
        links: [
            {
                label: "My Project",
                icon: FolderOpen,
                path: "/dashboard/myproject",
            },
            {
                label: "Manuscript Upload",
                icon: Upload,
                path: "/dashboard/manuscript-upload",
            },
            {
                label: "My Research Groups",
                icon: Users,
                path: "/dashboard/my-researchGroups",
            },
            {
                label: "Proposed Topics",
                icon: Lightbulb,
                path: "/dashboard/proposedTopics",
            },
        ],
    },
    {
        title: "Records",
        links: [
            {
                label: "Archived",
                icon: Archive,
                path: "/dashboard/archived",
            },
            {
                label: "Audit Trail",
                icon: ScrollText,
                path: "/dashboard/logs-audit",
            },
        ],
    },
    {
        title: "Settings",
        links: [
            {
                label: "Settings",
                icon: Settings,
                path: "/settings",
            },
        ],
    },
];
