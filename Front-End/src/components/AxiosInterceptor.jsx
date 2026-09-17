import { useContext, useEffect } from 'react';
import axiosInstance from '../ReusableFolder/axioxInstance'; 
import { AuthContext } from '../contexts/AuthContext';

const AxiosInterceptor = () => {
  const { logout } = useContext(AuthContext);
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      response => response, 
      error => {
        if (error.response?.status === 401) {
            console.log("401 Unauthorized - Logging out...");
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axiosInstance.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  return null;
};

export default AxiosInterceptor;