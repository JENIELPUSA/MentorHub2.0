import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { FaLock, FaEye, FaEyeSlash, FaTooth } from "react-icons/fa";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/resetPassword/${token}`,
        { password, confirmPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.status === "Success") {
        toast.success("Password updated successfully!");
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        "An error occurred. Please try again."
      );
      console.error("Reset error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pass) => {
    if (pass.length === 0) return 0;
    if (pass.length < 4) return 25;
    if (pass.length < 8) return 50;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 75;
    return 100;
  };

  const strength = getPasswordStrength(password);
  let strengthColor = "bg-red-500";
  if (strength > 50) strengthColor = "bg-yellow-500";
  if (strength > 75) strengthColor = "bg-green-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-8">
      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-100 rounded-full opacity-30 blur-xl"></div>
        
        <motion.div 
          className="bg-white rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div 
              className="mx-auto mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-500 p-3 rounded-full">
                <FaLock className="text-white text-xl" />
              </div>
            </motion.div>
            
            <motion.h2 
              className="text-2xl sm:text-3xl font-bold text-gray-800"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Reset Your Password
            </motion.h2>
            <motion.p 
              className="text-gray-600 mt-2"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Create a new password for your account
            </motion.p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* New Password Field */}
            <motion.div 
              className="mb-5"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${strengthColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${strength}%` }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
                <div className="flex justify-between text-xs mt-1 text-gray-500">
                  <span>Weak</span>
                  <span>Medium</span>
                  <span>Strong</span>
                </div>
              </div>
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div 
              className="mb-6"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  autoComplete="off"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </motion.div>

            {/* Requirements */}
            <motion.div 
              className="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-gray-600"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="font-medium mb-2">Password requirements:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li className={password.length >= 6 ? "text-green-600" : ""}>
                  Minimum 6 characters
                </li>
                <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                  At least one uppercase letter
                </li>
                <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                  At least one number
                </li>
              </ul>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-teal-600 text-white py-3 rounded-xl font-medium flex justify-center items-center transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              ) : (
                "Save New Password"
              )}
            </motion.button>
            
            {/* Back to Login */}
            <motion.div 
              className="text-center mt-6 text-sm text-gray-600"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <button 
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-500 font-medium hover:text-blue-700 hover:underline transition-colors"
              >
                ← Back to login
              </button>
            </motion.div>
          </form>

          <ToastContainer 
            position="top-center"
            autoClose={3000}
            toastClassName="rounded-lg"
            progressClassName="bg-gradient-to-r from-blue-500 to-teal-500"
          />
        </motion.div>
        
        {/* Footer */}
        <motion.div 
          className="text-center mt-6 text-sm text-gray-500"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>© {new Date().getFullYear()} Government File Archiving System</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ResetPassword;