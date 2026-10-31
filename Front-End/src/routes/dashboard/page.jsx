import { AuthContext } from "../../contexts/AuthContext";
import UserDashboard from "../../components/UserDashboard/UserDashboard";
import AdCoAdviserDashboard from "../../components/ad_co_AdviserDashboard/AdCoAdviserDashboard";
import Instructor_Dashboard from "../../components/Subject_InstructorDashboard/Instructor_Dashboard";
import AdminDashboard from "../../components/AdminDashboard/AdminDashboard";
import PanelistDashboard from "../../components/PanelistDashboard/panelistDashboard"
import { useContext } from "react";

const DashboardPage = () => {
    const { role } = useContext(AuthContext);

    // If role is student, render UserDashboard
    if (role === 'student') {
        return <UserDashboard />;
    }
    // If role is student, render UserDashboard
    if (role === 'admin') {
        return <AdminDashboard />;
    }

    // If role is adviser, panelist, or co-adviser, render AdCoAdviserDashboard
    if (role === 'adviser' || role === 'co-adviser') {
        return <AdCoAdviserDashboard />;
    }

    // If role is adviser, panelist, or co-adviser, render AdCoAdviserDashboard
    if (role === 'panelist') {
        return <PanelistDashboard />;
    }
    // If role is student, render UserDashboard
    if (role === 'subject_instructor') {
        return <Instructor_Dashboard />;
    }
};

export default DashboardPage;