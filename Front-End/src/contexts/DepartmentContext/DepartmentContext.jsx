// DepartmentContext.js
import { createContext, useState, useCallback, useEffect } from "react";
import axios from "axios";

export const DepartmentContext = createContext();

export const DepartmentProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

  // ⭐ Helper: tanggapin kahit anong 2xx + valid payload
  const isSuccessResponse = (res) => {
    if (!res) return false;
    // HTTP 2xx = success
    if (res.status >= 200 && res.status < 300) return true;
    return false;
  };

  // GET ALL DEPARTMENTS
  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${BASE_URL}/api/v1/departments`);

      if (isSuccessResponse(res)) {
        const list = res.data?.data || res.data || [];
        setDepartments(Array.isArray(list) ? list : []);
      } else {
        console.warn("⚠️ fetchDepartments unexpected:", res.data);
      }
    } catch (error) {
      console.error("Fetch Departments Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL]);

  // CREATE DEPARTMENT
  const createDepartment = async (values) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/v1/departments`, values);

      console.log("📥 createDepartment response:", {
        status: res.status,
        data: res.data,
      });

      if (isSuccessResponse(res)) {
        await fetchDepartments();
        return { success: true, data: res.data?.data || res.data };
      }

      return {
        success: false,
        error: res.data?.message || `HTTP ${res.status}`,
      };
    } catch (error) {
      console.error("❌ createDepartment error:", error.response?.data || error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Error creating department",
      };
    }
  };

  // UPDATE DEPARTMENT
  const updateDepartment = async (id, values) => {
    try {
      const res = await axios.patch(
        `${BASE_URL}/api/v1/departments/${id}`,
        values
      );

      console.log("📥 updateDepartment response:", {
        status: res.status,
        data: res.data,
      });

      if (isSuccessResponse(res)) {
        await fetchDepartments();
        return { success: true, data: res.data?.data || res.data };
      }

      return {
        success: false,
        error: res.data?.message || `HTTP ${res.status}`,
      };
    } catch (error) {
      console.error("❌ updateDepartment error:", error.response?.data || error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Error updating department",
      };
    }
  };

  // DELETE DEPARTMENT
  const deleteDepartment = async (id) => {
    try {
      const res = await axios.delete(`${BASE_URL}/api/v1/departments/${id}`);

      if (isSuccessResponse(res)) {
        await fetchDepartments();
        return { success: true };
      }

      return {
        success: false,
        error: res.data?.message || `HTTP ${res.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Error deleting department",
      };
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        isLoading,
        fetchDepartments,
        createDepartment,
        updateDepartment,
        deleteDepartment,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
};