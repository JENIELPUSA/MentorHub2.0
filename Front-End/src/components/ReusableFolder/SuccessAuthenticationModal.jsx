import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { X } from "lucide-react";
const SuccessModal = ({ isOpen, onClose, status, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`mb-4 rounded-full p-3 ${
                  status === "success"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {status === "success" ? (
                  <CheckCircle size={48} />
                ) : (
                  <XCircle size={48} />
                )}
              </motion.div>

              <h3 className="mb-2 text-xl font-bold text-gray-800">
                {title || (status === "success" ? "Success!" : "Failed!")}
              </h3>
              <p className="text-gray-600">
                {message ||
                  (status === "success"
                    ? "Your request was completed successfully"
                    : "An error occurred. Please try again")}
              </p>

              <button
                onClick={onClose}
                className={`mt-6 w-full rounded-lg py-3 font-medium text-white transition-colors ${
                  status === "success"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;