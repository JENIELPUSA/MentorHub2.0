import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { FolderArchive } from "lucide-react";
import SuccessModal from "../ReusableFolder/SuccessAuthenticationModal";
const ForgotPassword = ({ show, onClose }) => {
    const [values, setValues] = useState({ email: "" });
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalStatus, setModalStatus] = useState("success");
    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!values.email) {
            toast.warning("Please enter your email address");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1/authentication/forgotPassword`, values);
            if (res.data.status === "Success") {
                setModalStatus("success");
                setShowModal(true);
                setValues({ email: "" });
                setTimeout(() => onClose(), 2000);
            } else {
                setModalStatus("failed");
                setShowModal(true);
            }
        } catch (error) {
            setModalStatus("failed");
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-white to-blue-50 p-6 shadow-2xl sm:p-8"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 20,
                            stiffness: 300,
                        }}
                    >
                        {/* Decorative elements */}
                        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-100 opacity-30"></div>
                        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-teal-100 opacity-30"></div>

                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-1 text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 mb-6 text-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-3 inline-flex items-center justify-center rounded-full bg-blue-100 p-3"
                            >
                                <FolderArchive className="text-2xl text-blue-600" />
                            </motion.div>
                            <motion.h2
                                className="text-2xl font-bold text-gray-800"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Reset Your Password
                            </motion.h2>
                            <motion.p
                                className="mt-2 text-sm text-gray-600"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                Enter your email to receive a secure reset link
                            </motion.p>
                        </div>

                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="mb-5">
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Email Address
                                </label>
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={values.email}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        required
                                        disabled={loading}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                                    />
                                </motion.div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 py-3 font-medium text-white shadow-md transition-all duration-300 hover:from-blue-800 hover:to-teal-600 hover:shadow-lg disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
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
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        ></path>
                                    </svg>
                                ) : (
                                    <span className="flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="mr-2 h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                        </svg>
                                        Send Reset Link
                                    </span>
                                )}
                            </motion.button>
                        </motion.form>

                        <ToastContainer
                            position="top-center"
                            autoClose={3000}
                        />
                        <SuccessModal
                            isOpen={showModal}
                            onClose={() => setShowModal(false)}
                            status={modalStatus}
                            title={modalStatus === "success" ? "Email Sent!" : "Failed to Send"}
                            message={
                                modalStatus === "success"
                                    ? "Check your inbox for the password reset link"
                                    : "Couldn't send reset email. Please try again later"
                            }
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ForgotPassword;