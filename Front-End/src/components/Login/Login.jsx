import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import LoadingIntro from "../ReusableFolder/loadingintro";
import ForgotPassword from "../Login/ForgotPassword";
import logo from "@/assets/bipsulogo.png";
import { BookOpen, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoginStatusModal from "./LogInStatusModal";

export default function AuthForm() {
    const [isForgotPassword, setForgotPassword] = useState(false);
    const [loginStatus, setLoginStatus] = useState({
        show: false,
        status: "success",
        message: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    // Form values para sa Login
    const [values, setValues] = useState({
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleInput = useCallback((event) => {
        const { name, value } = event.target;
        setValues((prevValues) => ({
            ...prevValues,
            [name]: value,
        }));
    }, []);

    const toggleShowPassword = useCallback(() => {
        setShowPassword((prev) => !prev);
    }, []);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Login Payload
        const loginPayload = {
            email: values.email,
            password: values.password,
        };

        console.log("📤 LOGIN PAYLOAD:", loginPayload);

        const response = await login(values.email, values.password);

        if (response?.success) {
            setLoginStatus({
                show: true,
                status: "success",
                message: "Login successful!",
            });
            setIsLoading(false);
        } else {
            setIsLoading(false);
            setLoginStatus({
                show: true,
                status: "error",
                message:
                    response?.message ||
                    "Login failed. Please check your credentials.",
            });
        }
    };

    const handleModalClose = () => {
        setLoginStatus((prev) => ({ ...prev, show: false }));
        if (loginStatus.status === "success") {
            navigate("/dashboard");
        }
    };

    // Variants para sa Framer Motion animations
    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" },
        },
    };

    return (
        <>
            {/* Full-screen Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="loading-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
                        <LoadingIntro />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="font-inter flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-4 dark:bg-slate-900">
                {/* Status Modal */}
                <LoginStatusModal
                    isOpen={loginStatus.show}
                    onClose={handleModalClose}
                    status={loginStatus.status}
                    customMessage={loginStatus.message}
                />

                {/* Subtle background animation */}
                <motion.div
                    className="absolute inset-0 z-0 opacity-10"
                    initial={{ backgroundPosition: "0% 0%" }}
                    animate={{ backgroundPosition: "100% 100%" }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        backgroundImage: `radial-gradient(circle at top left, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
                                          radial-gradient(circle at bottom right, rgba(30, 64, 175, 0.3) 0%, transparent 50%)`,
                    }}
                />

                <motion.div
                    className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Left Column - MentorHub Branding Section */}
                    <div
                        className="relative hidden w-2/5 flex-col items-start justify-between overflow-hidden p-12 text-white md:flex"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(30, 64, 175, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
                            borderRight:
                                "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        {/* Background pattern */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 100%),
                                                  linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 100%)`,
                                backgroundSize: "20px 20px ",
                            }}
                        ></div>

                        <motion.div
                            className="relative z-10 mb-8 flex items-center gap-2"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <BookOpen className="h-14 w-14 text-white" />
                            </div>
                        </motion.div>

                        <div className="relative z-10">
                            <motion.h1
                                className="mb-4 text-4xl font-extrabold leading-tight"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.4 }}
                            >
                                Welcome to <br />
                                <span className="text-emerald-400">
                                    MentorHub
                                </span>
                            </motion.h1>
                            <motion.p
                                className="text-sm mb-8 text-blue-100 leading-relaxed"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.5 }}
                            >
                                Your centralized repository for thesis and
                                capstone manuscripts. Connect with advisors,
                                track project revisions, and archive research
                                work efficiently.
                            </motion.p>
                        </div>
                    </div>

                    {/* Right Column - Login Form */}
                    <div className="flex w-full flex-col justify-center bg-white p-8 md:w-3/5 md:p-12">
                        <motion.div
                            className="mb-6 text-center"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ delay: 0.2 }}
                        >
                            <div className="mb-3 flex justify-center">
                                <img
                                    src={logo}
                                    alt="BiPSU Logo"
                                    className="h-24 w-24 object-contain xs:h-16 xs:w-16"
                                />
                            </div>
                            <h2 className="text-center text-3xl font-extrabold leading-tight">
                                <span className="block text-blue-800 xs:text-xl">
                                    MentorHub Portal
                                </span>
                                <span className="block text-emerald-600 text-lg font-semibold xs:text-base">
                                    Research & Manuscript Archiving
                                </span>
                            </h2>

                            <p className="text-sm mt-2 text-gray-600">
                                Sign in to access your capstone dashboard
                            </p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {/* LOGIN FORM */}
                            <motion.form
                                key="login-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5 xs:space-y-3"
                                onSubmit={handleLoginSubmit}
                            >
                                <div>
                                    <label
                                        htmlFor="login-email"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 xs:text-[12px]"
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            type="email"
                                            id="login-email"
                                            name="email"
                                            value={values.email}
                                            onChange={handleInput}
                                            disabled={isLoading}
                                            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 disabled:opacity-50 xs:text-[12px]"
                                            placeholder="mentorhub123@gmail.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="login-password"
                                        className="mb-1.5 block text-sm font-medium text-gray-700 xs:text-[12px]"
                                    >
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            id="login-password"
                                            name="password"
                                            value={values.password}
                                            onChange={handleInput}
                                            disabled={isLoading}
                                            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 disabled:opacity-50 xs:text-[12px]"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={toggleShowPassword}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end text-sm">
                                    <a
                                        onClick={() =>
                                            setForgotPassword(true)
                                        }
                                        className="cursor-pointer font-medium text-blue-700 hover:text-blue-900 hover:underline xs:text-[12px]"
                                    >
                                        Forgot password?
                                    </a>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white shadow-md transition-all duration-300 xs:text-[12px] ${
                                        isLoading
                                            ? "cursor-not-allowed bg-blue-400"
                                            : "bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 hover:from-blue-800 hover:to-slate-950 active:scale-[0.99]"
                                    }`}
                                >
                                    {isLoading ? "Signing in..." : "Log In"}
                                </button>
                            </motion.form>
                        </AnimatePresence>
                    </div>

                    <ForgotPassword
                        show={isForgotPassword}
                        onClose={() => {
                            setForgotPassword(false);
                        }}
                    />
                </motion.div>
            </div>
        </>
    );
}