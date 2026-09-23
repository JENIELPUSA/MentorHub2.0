import React, { useContext, useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { FaLock, FaTimes, FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../contexts/AuthContext";

const UpdatePasswordModal = ({ isOpen, onClose }) => {
    const { UpdatePasswordData, customError, setCustomError } = useContext(AuthContext);

    const [values, setValues] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmNewPassword: false,
    });

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const resetForm = () => {
        setValues({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        });
        setShowPasswords({
            currentPassword: false,
            newPassword: false,
            confirmNewPassword: false,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (values.newPassword !== values.confirmNewPassword) {
            toast.error("New password and confirm password do not match.");
            return;
        }

        setLoading(true);

        try {
            if (typeof UpdatePasswordData === "function") {
                await UpdatePasswordData(values);
            }
            if (customError) {
                toast.error(customError);
                setCustomError("");
                resetForm();
            } else {
                toast.success("Password updated successfully!");
                resetForm();
                if (onClose) onClose();
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customError) {
            toast.error(customError);
            setCustomError("");
        }
    }, [customError, setCustomError]);

    useEffect(() => {
        if (isOpen) resetForm();
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && onClose) onClose();
        };
        if (isOpen) document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const passwordStrength = (password) => {
        if (!password) return { level: 0, label: "", color: "" };
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
            { level: 1, label: "Weak", color: "bg-red-500" },
            { level: 2, label: "Fair", color: "bg-orange-500" },
            { level: 3, label: "Good", color: "bg-yellow-500" },
            { level: 4, label: "Strong", color: "bg-emerald-500" },
        ];
        return levels[score - 1] || { level: 0, label: "", color: "" };
    };

    const strength = passwordStrength(values.newPassword);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 40 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 sm:max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Solid Blue Header */}
                        <div className="relative h-28 overflow-hidden bg-blue-600">
                            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-8 left-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                            <div className="absolute right-12 top-4 h-16 w-16 rounded-full bg-white/5" />

                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/30"
                                aria-label="Close modal"
                            >
                                <FaTimes size={16} />
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-6 pb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                    <FaShieldAlt className="text-xl text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white sm:text-xl">
                                        Update Password
                                    </h2>
                                    <p className="text-xs text-white/80">
                                        Keep your account secure
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 pt-5 sm:p-8">
                            {/* Current Password */}
                            <div className="mb-4">
                                <label
                                    htmlFor="currentPassword"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Current Password
                                </label>
                                <div className="relative">
                                    <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500" />
                                    <input
                                        type={showPasswords.currentPassword ? "text" : "password"}
                                        name="currentPassword"
                                        id="currentPassword"
                                        value={values.currentPassword}
                                        onChange={handleChange}
                                        placeholder="Enter current password"
                                        required
                                        disabled={loading}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:focus:border-blue-500 dark:focus:bg-gray-800 dark:focus:ring-blue-500/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("currentPassword")}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-blue-600 dark:hover:text-blue-400"
                                        tabIndex={-1}
                                    >
                                        {showPasswords.currentPassword ? (
                                            <FaEyeSlash size={15} />
                                        ) : (
                                            <FaEye size={15} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="mb-4">
                                <label
                                    htmlFor="newPassword"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    New Password
                                </label>
                                <div className="relative">
                                    <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500" />
                                    <input
                                        type={showPasswords.newPassword ? "text" : "password"}
                                        name="newPassword"
                                        id="newPassword"
                                        value={values.newPassword}
                                        onChange={handleChange}
                                        placeholder="Enter new password"
                                        required
                                        disabled={loading}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:focus:border-blue-500 dark:focus:bg-gray-800 dark:focus:ring-blue-500/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility("newPassword")}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-blue-600 dark:hover:text-blue-400"
                                        tabIndex={-1}
                                    >
                                        {showPasswords.newPassword ? (
                                            <FaEyeSlash size={15} />
                                        ) : (
                                            <FaEye size={15} />
                                        )}
                                    </button>
                                </div>

                                {/* Strength meter */}
                                {values.newPassword && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="mt-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-1 gap-1">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                            i <= strength.level
                                                                ? strength.color
                                                                : "bg-gray-200 dark:bg-gray-700"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                {strength.label}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Confirm New Password */}
                            <div className="mb-5">
                                <label
                                    htmlFor="confirmNewPassword"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                                >
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500" />
                                    <input
                                        type={showPasswords.confirmNewPassword ? "text" : "password"}
                                        name="confirmNewPassword"
                                        id="confirmNewPassword"
                                        value={values.confirmNewPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                        required
                                        disabled={loading}
                                        className={`w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:bg-white focus:ring-4 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-50 dark:focus:bg-gray-800 ${
                                            values.confirmNewPassword &&
                                            values.newPassword !== values.confirmNewPassword
                                                ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500"
                                                : "border-gray-200 focus:border-blue-600 focus:ring-blue-600/10 dark:border-gray-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/10"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            togglePasswordVisibility("confirmNewPassword")
                                        }
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-blue-600 dark:hover:text-blue-400"
                                        tabIndex={-1}
                                    >
                                        {showPasswords.confirmNewPassword ? (
                                            <FaEyeSlash size={15} />
                                        ) : (
                                            <FaEye size={15} />
                                        )}
                                    </button>
                                </div>
                                {values.confirmNewPassword &&
                                    values.newPassword !== values.confirmNewPassword && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-1.5 text-xs text-red-500"
                                        >
                                            Passwords do not match
                                        </motion.p>
                                    )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    {loading ? (
                                        <>
                                            <svg
                                                className="h-4 w-4 animate-spin text-white"
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
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                />
                                            </svg>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <FaShieldAlt size={13} />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <ToastContainer position="bottom-right" theme="colored" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UpdatePasswordModal;