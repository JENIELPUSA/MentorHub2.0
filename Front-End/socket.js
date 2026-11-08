import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

const socket = io(backendUrl, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  withCredentials: true,
  auth: {
    token: localStorage.getItem("token") || null,
  },
});

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("[Socket] ⚠️ No token — skip connect");
    return;
  }
  socket.auth.token = token;
  if (!socket.connected) {
    console.log("[Socket] 🔌 Connecting...");
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("[Socket] 🔌 Disconnecting...");
    socket.disconnect();
  }
};

// ==========================
// CORE HANDLERS
// ==========================
socket.on("reconnect_attempt", (attempt) => {
  socket.auth.token = localStorage.getItem("token");
  console.log(`[Socket] 🔄 Reconnect attempt #${attempt}`);
});

socket.on("connect", () => {
  console.log("[Socket] ✅ Connected:", socket.id);

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  // ✅ userId lang ang kailangan
  if (!userId || !role) {
    console.warn("[Socket] ⚠️ Missing userId/role — skip register");
    return;
  }

  socket.emit("register-user", userId, role);

  console.log(`[Socket] 📍 register-user: userId=${userId}, role=${role}`);
});

socket.on("connect_error", (error) => {
  console.error("[Socket] ❌ connect_error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.warn("[Socket] ⚠️ Disconnected:", reason);
});

socket.on("reconnect", (attempt) => {
  console.log(`[Socket] 🔁 Reconnected (attempt #${attempt})`);
});

socket.on("reconnect_failed", () => {
  console.error("[Socket] 💥 Reconnect failed");
});

if (typeof window !== "undefined") {
  window.__socket__ = socket;
}

export default socket;