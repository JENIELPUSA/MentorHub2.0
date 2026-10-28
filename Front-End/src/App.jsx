import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import Layout from "@/routes/layout";
import DashboardPage from "@/routes/dashboard/page";
import Login from "./components/Login/Login";
import RegisterFormModal from "./components/Login/Register"; // <-- Import Register
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import PublicRoute from "./components/PublicRoute/PublicRoute";
import ResetPassword from "./components/Login/ResetPassword";
import UserManagement from "./components/UserManagement/usermanagement";
import SubjectManagement from "./components/SubjectManagement/subjectManagement";
import GroupDashboard from "./components/SubjectManagement/GroupComponents";
import ProposedTitle from "./components/ProposedTitle/ProposedTitle";
import DefenseSchedule from "./components/DefenseSchedule/DefenseSchedule";
import Archivecomponents from "./components/ArchiveComponents/Archivecomponents";
import AuditLogs from "./components/AuditLogs/AuditLogs";
import MyProject from "./components/MyProject/myproject"
import ManuscriptUpload from "./components/ManuscriptUpload/manuscriptupload"
import MyResearchGroups from "./components/PanelistDashboard/MyResearchGroups";
import DefenseCalendar from "./components/Subject_InstructorDashboard/DefenseCalendar";
import ProposedTopics from "./components/PanelistDashboard/ProposedTopics";

function App() {
    const router = createBrowserRouter([
        {
            element: <PublicRoute />,
            children: [
                // Inilagay ang "/" para mag-redirect sa "/login" (o kaya pwedeng element: <Login />)
                { path: "/", element: <Navigate to="/login" replace /> },
                { path: "/login", element: <Login /> },
                {
                    path: "/register",
                    element: <RegisterFormModal /> // <-- ADD THIS
                },
                {
                    path: "/signup",
                    element: <RegisterFormModal /> // <-- Optional: para sa /signup din
                },
                { path: "/reset-password/:token", element: <ResetPassword /> },
            ],
        },
        {
            path: "dashboard",
            element: <PrivateRoute />,
            children: [
                {
                    path: "",
                    element: <Layout />,
                    children: [
                        { index: true, element: <DashboardPage /> },

                        {
                            path: "/dashboard/Add-User",
                            element: <UserManagement />,
                        },
                        {
                            path: "/dashboard/Add-Subject",
                            element: <SubjectManagement />,
                        },
                        {
                            path: "/dashboard/propose-title",
                            element: <ProposedTitle />,
                        },
                        {
                            path: "/dashboard/defense_schedule",
                            element: <DefenseSchedule />,
                        },
                        {
                            path: "/dashboard/archived",
                            element: <Archivecomponents />,
                        },
                        {
                            path: "/dashboard/logs-audit",
                            element: <AuditLogs />,
                        },
                        {
                            path: "/dashboard/myproject",
                            element: <MyProject />,
                        },

                        {
                            path: "/dashboard/manuscript-upload",
                            element: <ManuscriptUpload />,
                        },
                        {
                            path: "/dashboard/my-researchGroups",
                            element: <MyResearchGroups />,
                        },
                        {
                            path: "/dashboard/defense-calendar",
                            element: <DefenseCalendar />,
                        },
                        {
                            path: "/dashboard/proposedTopics",
                            element: <ProposedTopics />,
                        },


                    ],
                },
            ],
        },
        {
            // Kapag hindi mahanap ang path, ididirekta pabalik sa "/login"
            path: "*",
            element: <Navigate to="/login" replace />,
        },
    ]);

    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

export default App;