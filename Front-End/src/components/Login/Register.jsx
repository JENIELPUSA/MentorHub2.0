import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { UserDisplayContext } from "../../contexts/UserManagementContext/UserManagementContext";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaUserPlus,
    FaGift,
    FaUserGraduate,
    FaUserTag
} from "react-icons/fa";

function Register() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { AddUser } = useContext(UserDisplayContext) || {};
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        email: "",
        password: "",
        confirmPassword: "",
        referralCode: ""
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const refCode = searchParams.get('ref') || searchParams.get('referralCode') || '';
        setFormData(prev => ({
            ...prev,
            referralCode: refCode
        }));

        if (refCode) {
            console.log("🔑 Referral Code applied:", refCode);
        }
    }, [searchParams]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Password strength checker
    const getPasswordStrength = (pass) => {
        if (pass.length === 0) return 0;
        if (pass.length < 4) return 25;
        if (pass.length < 8) return 50;
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 75;
        return 100;
    };

    const strength = getPasswordStrength(formData.password);
    let strengthColor = "bg-red-500";
    if (strength > 50) strengthColor = "bg-yellow-500";
    if (strength > 75) strengthColor = "bg-green-500";
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            toast.warning("Please fill in all required fields (*)");
            return;
        }

        if (formData.password.length < 6) {
            toast.warning("Password must be at least 6 characters");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        if (!formData.email.includes('@')) {
            toast.warning("Please enter a valid email address");
            return;
        }

        setLoading(true);

        const payload = {
            first_name: formData.firstName.trim(),
            middle_name: formData.middleName.trim() || null,
            last_name: formData.lastName.trim(),
            suffix: formData.suffix || null,
            email: formData.email.trim(),
            password: formData.password,
            referralCode: formData.referralCode || null
        };

        try {
            if (AddUser) {
                await AddUser(payload);
                toast.success("🎉 Registration successful! Please check your email.");
                setTimeout(() => navigate("/login"), 3000);
            } else {
                // Fallback: Direct API call kung walang AddUser
                const response = await axios.post(
                    `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/auth/register`,
                    payload,
                    { headers: { "Content-Type": "application/json" } }
                );

                if (response.data.status === "Success") {
                    toast.success("🎉 Registration successful! Please check your email.");
                    setTimeout(() => navigate("/login"), 3000);
                } else {
                    toast.error(response.data.message || "Registration failed. Please try again.");
                }
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "An error occurred. Please try again."
            );
            console.error("Registration error:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-6">
            <motion.div
                className="relative w-full max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Decorative elements */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
                <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-teal-100 rounded-full opacity-30 blur-xl"></div>

                <motion.div
                    className="bg-white rounded-2xl shadow-2xl p-6 relative overflow-hidden border border-blue-100"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="text-center mb-4">
                        <motion.div
                            className="mx-auto mb-2"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500 p-2.5 rounded-full">
                                <FaUserPlus className="text-white text-lg" />
                            </div>
                        </motion.div>

                        <motion.h2
                            className="text-xl sm:text-2xl font-bold text-gray-800"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Create Account
                        </motion.h2>
                        <motion.p
                            className="text-gray-500 text-sm mt-1"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            Join the Government File Archiving System
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* First Name & Middle Name - 2 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 mb-1">
                                    First Name *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Juan"
                                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                        required
                                    />
                                    <FaUser className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="middleName" className="block text-xs font-medium text-gray-700 mb-1">
                                    Middle Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="middleName"
                                        id="middleName"
                                        value={formData.middleName}
                                        onChange={handleChange}
                                        placeholder="Dela"
                                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                    />
                                    <FaUserGraduate className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                </div>
                            </div>
                        </div>

                        {/* Last Name & Suffix - 2 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 mb-1">
                                    Last Name *
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Cruz"
                                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                        required
                                    />
                                    <FaUserTag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="suffix" className="block text-xs font-medium text-gray-700 mb-1">
                                    Suffix
                                </label>
                                <select
                                    name="suffix"
                                    id="suffix"
                                    value={formData.suffix}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                                >
                                    <option value="">Select Suffix</option>
                                    <option value="Jr.">Jr.</option>
                                    <option value="Sr.">Sr.</option>
                                    <option value="II">II</option>
                                    <option value="III">III</option>
                                    <option value="IV">IV</option>
                                    <option value="V">V</option>
                                    <option value="VI">VI</option>
                                    <option value="VII">VII</option>
                                    <option value="VIII">VIII</option>
                                    <option value="IX">IX</option>
                                    <option value="X">X</option>
                                </select>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="mb-3">
                            <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                                Email Address *
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                    required
                                />
                                <FaEnvelope className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                            <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    placeholder="Min 6 characters"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 pl-8 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                    required
                                    minLength="6"
                                />
                                <FaLock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-2.5 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            <div className="mt-1.5">
                                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${strengthColor}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${strength}%` }}
                                        transition={{ duration: 0.5 }}
                                    ></motion.div>
                                </div>
                                <div className="flex justify-between text-[10px] mt-0.5 text-gray-400">
                                    <span>Weak</span>
                                    <span>Medium</span>
                                    <span>Strong</span>
                                </div>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    id="confirmPassword"
                                    placeholder="Re-enter your password"
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 pl-8 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                    required
                                />
                                <FaLock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 px-2.5 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                </button>
                            </div>
                        </div>

                        {/* 🔑 Referral Code - AUTO-FILLED FROM URL */}
                        <div className="mb-4">
                            <label htmlFor="referralCode" className="block text-xs font-medium text-gray-700 mb-1">
                                Referral Code {formData.referralCode ? '' : '(Optional)'}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="referralCode"
                                    id="referralCode"
                                    value={formData.referralCode}
                                    onChange={handleChange}
                                    placeholder="Enter referral code"
                                    className={`w-full px-3 py-2 pl-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm ${formData.referralCode ? 'bg-gray-50 border-gray-200 text-gray-600' : 'border-gray-300'
                                        }`}
                                    readOnly={!!formData.referralCode}
                                />
                                <FaGift className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                {formData.referralCode && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                        <span className="text-green-500 text-[10px] font-medium">✓ Applied</span>
                                    </div>
                                )}
                            </div>
                            {formData.referralCode && (
                                <p className="text-[10px] text-green-600 mt-0.5">
                                    Referral code applied successfully
                                </p>
                            )}
                        </div>

                        {/* Password Requirements - Compact */}
                        <div className="bg-blue-50 rounded-lg p-2.5 mb-4 text-xs text-gray-600">
                            <p className="font-medium mb-1 text-[11px]">Password requirements:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li className={formData.password.length >= 6 ? "text-green-600" : ""}>
                                    Minimum 6 characters
                                </li>
                                <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : ""}>
                                    At least one uppercase letter
                                </li>
                                <li className={/[0-9]/.test(formData.password) ? "text-green-600" : ""}>
                                    At least one number
                                </li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white py-2.5 rounded-lg font-medium flex justify-center items-center transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg text-sm"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? (
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
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
                                "Create Account"
                            )}
                        </motion.button>

                        {/* Login Link */}
                        <div className="text-center mt-4 text-sm text-gray-600">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-blue-500 font-medium hover:text-blue-700 hover:underline transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    </form>

                    <ToastContainer
                        position="top-center"
                        autoClose={3000}
                        toastClassName="rounded-lg"
                        progressClassName="bg-gradient-to-r from-blue-500 to-teal-500"
                    />
                </motion.div>

                {/* Footer */}
                <div className="text-center mt-4 text-xs text-gray-400">
                    <p>© {new Date().getFullYear()} BiPSU Mentor HUB System</p>
                </div>
            </motion.div>
        </div>
    );
}

export default Register;