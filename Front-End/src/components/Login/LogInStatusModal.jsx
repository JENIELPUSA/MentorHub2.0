import { motion, AnimatePresence } from "framer-motion";

export default function LoginStatusModal({ 
  isOpen, 
  onClose, 
  status = "success",
  customMessage 
}) {
  const isSuccess = status === "success";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[999] p-4 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full relative text-center border border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 text-2xl"
              aria-label="Close modal"
            >
              ✕
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                transition: { 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15 
                }
              }}
              className={`mx-auto mb-6 w-24 h-24 flex items-center justify-center rounded-full
                ${isSuccess 
                  ? "bg-gradient-to-br from-green-400 to-green-600" 
                  : "bg-gradient-to-br from-red-400 to-red-600"
                } text-white shadow-lg`}
            >
              <motion.span
                animate={{ 
                  scale: [0.8, 1.1, 1],
                  transition: { delay: 0.2 }
                }}
                className="text-5xl"
              >
                {isSuccess ? "🔓" : "⚠️"}
              </motion.span>
            </motion.div>

            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { delay: 0.3 }
              }}
              className="text-3xl font-bold mb-3 text-gray-900 dark:text-white"
            >
              {isSuccess ? "Login Successful!" : "Login Failed!"}
            </motion.h2>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { delay: 0.4 }
              }}
              className="text-gray-700 dark:text-gray-300 text-base mb-8 leading-relaxed"
            >
              {customMessage || (
                isSuccess
                  ? "You've successfully accessed your account. Welcome back!"
                  : "Invalid credentials or connection issue. Please check your details and try again."
              )}
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`w-full py-3 px-6 rounded-full text-white font-semibold text-lg
                ${isSuccess 
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" 
                  : "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                } transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50
                ${isSuccess 
                  ? "focus:ring-blue-300/70" 
                  : "focus:ring-orange-300/70"
                } shadow-md`}
            >
              {isSuccess ? "Continue to Dashboard" : "Try Again"}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}