import { createContext, useState, useCallback, useEffect } from "react";
import axios from "axios";

export const DepartmentContext = createContext();

export const DepartmentProvider = ({ children }) => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

  // GET ALL DEPARTMENTS
  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await axios.get(`${BASE_URL}/api/v1/Department`);

      if (res.data?.status === "success") {
        setDepartments(res.data.data);
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
      const res = await axios.post(
        `${BASE_URL}/api/v1/departments`,
        values
      );

      if (res.data?.status === "success") {
        await fetchDepartments();

        return { success: true, data: res.data.data };
      }

      return { success: false };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error creating department",
      };
    }
  };

  // UPDATE DEPARTMENT
  const updateDepartment = async (id, values) => {
    try {
      const res = await axios.put(
        `${BASE_URL}/api/v1/departments/${id}`,
        values
      );

      if (res.data?.status === "success") {
        await fetchDepartments();

        return { success: true, data: res.data.data };
      }

      return { success: false };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error updating department",
      };
    }
  };

  // DELETE DEPARTMENT
  const deleteDepartment = async (id) => {
    try {
      const res = await axios.delete(
        `${BASE_URL}/api/v1/departments/${id}`
      );

      if (res.data?.status === "success") {
        await fetchDepartments();

        return { success: true };
      }

      return { success: false };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Error deleting department",
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