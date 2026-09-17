import React, { useContext, useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { UpdateDisplayContext } from "../../contexts/UpdateContext/updateContext";

const UpdatePassword = () => {
    const { UpdatePasswordData, customError, setCustomError } = useContext(UpdateDisplayContext);

    const [values, setValues] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
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
                setValues({
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: "",
                });
            } else {
                setValues({
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: "",
                });
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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg sm:p-8"
            >
                <div className="mb-6 text-center">
                    <FaLock className="mx-auto mb-2 text-3xl text-blue-500 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Update Password</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter your current and new password.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="currentPassword"
                            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Current Password
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            value={values.currentPassword}
                            onChange={handleChange}
                            placeholder="Enter your current password"
                            required
                            disabled={loading}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-50 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 disabled:opacity-50"
                        />
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="newPassword"
                            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            New Password
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            value={values.newPassword}
                            onChange={handleChange}
                            placeholder="Enter your new password"
                            required
                            disabled={loading}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-50 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 disabled:opacity-50"
                        />
                    </div>

                    <div className="mb-4">
                        <label
                            htmlFor="confirmNewPassword"
                            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            name="confirmNewPassword"
                            id="confirmNewPassword"
                            value={values.confirmNewPassword}
                            onChange={handleChange}
                            placeholder="Confirm your new password"
                            required
                            disabled={loading}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-50 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-md bg-blue-600 dark:bg-blue-700 py-2 text-white transition duration-150 hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
                    >
                        {loading ? (
                            <svg
                                className="h-5 w-5 animate-spin text-white"
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
                                ></path>
                            </svg>
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </form>
            </motion.div>

            <ToastContainer position="bottom-right" theme="colored" />
        </div>
    );
};

export default UpdatePassword;