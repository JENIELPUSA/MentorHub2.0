import { Navigate, Outlet, useLocation } from "react-router-dom";

const PublicRoute = () => {
  const token = localStorage.getItem("authToken");
  const location = useLocation();

  const isLoginPath = location.pathname === "/login" || location.pathname === "/";

  if (token && isLoginPath) {
    const destination = location.state?.from?.pathname || "/dashboard";
    
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;