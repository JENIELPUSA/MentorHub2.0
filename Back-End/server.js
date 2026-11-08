const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");
const initDefaultUser = require("./Controller/initDefaultUser");
const UserLoginSchema = require("./Models/LogInSchema");

const {
  // core helpers
  userRoom,
  roleRoom,
  privateRoom,

  // broadcast rooms
  ROOM_ALL_ROLES,
  ROOM_EVERYONE,
  ROOM_NON_ADMINS,
  ROOM_FACULTY,
  ROOM_THESIS,

  // constants
  ROLES,

  // send helpers
  sendToAdmin,
  sendToSelf,
  sendToUser,
  sendToAll,
  sendToRoles,
  sendToUsers,
} = require("./room");

const SECRET_STR = process.env.SECRET_STR;

app.set("trust proxy", true);

// =========================================================
// 1. HTTP SERVER
// =========================================================
const server = http.createServer(app);

// =========================================================
// 2. GLOBAL ERROR HANDLERS
// =========================================================
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception! Shutting down...");
  console.error(err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection! Shutting down...");
  console.error(err);
  server.close(() => process.exit(1));
});

// =========================================================
// 3. SOCKET.IO SERVER
// =========================================================
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 60000,
});

app.set("io", io);

// =========================================================
// 4. SOCKET AUTH MIDDLEWARE
// =========================================================
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      console.warn(`[Socket] ❌ No token for socket ${socket.id}`);
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, SECRET_STR);

    const user = await UserLoginSchema.findById(decoded.id).select(
      "_id role username first_name last_name status"
    );

    if (!user) return next(new Error("User not found"));

    if (user.status === "In-Active") {
      return next(new Error("Account is inactive"));
    }

    socket.user = user;
    console.log(
      `[Socket] ✅ Auth OK: ${user._id} (role=${user.role}) socket=${socket.id}`
    );
    next();
  } catch (err) {
    console.error(`[Socket] ❌ Auth error: ${err.message}`);
    next(new Error("Unauthorized"));
  }
});

// =========================================================
// 5. GLOBAL STATE — online users
// =========================================================
// { userId: { socketId, role, username } }
global.connectedUsers = {};

// =========================================================
// 6. CONNECTION HANDLER
// =========================================================
io.on("connection", (socket) => {
  console.log(`🔌 New Connection: ${socket.id}`);

  // ---------------------------------------------------------
  // 6.0 AUTO-REGISTER + JOIN ROOMS (from JWT)
  // ---------------------------------------------------------
  const user = socket.user;
  const userId = String(user._id);
  const role = String(user.role).toLowerCase().trim();

  socket.userId = userId;
  socket.role = role;

  // === BASIC ROOMS ===
  socket.join(userRoom(userId));
  socket.join(roleRoom(role));
  socket.join(privateRoom(role, userId));

  // === BROADCAST ROOMS ===
  socket.join(ROOM_ALL_ROLES);
  socket.join(ROOM_EVERYONE);

  // === CONDITIONAL BROADCAST ROOMS ===
  const isAdmin = role === ROLES.ADMIN;
  const isFaculty = [
    ROLES.SUBJECT_INSTRUCTOR,
    ROLES.PANELIST,
    ROLES.ADVISER,
    ROLES.COADVISER,
  ].includes(role);
  const isThesis = [
    ROLES.STUDENT,
    ROLES.ADVISER,
    ROLES.COADVISER,
    ROLES.PANELIST,
  ].includes(role);

  if (!isAdmin) socket.join(ROOM_NON_ADMINS);
  if (isFaculty) socket.join(ROOM_FACULTY);
  if (isThesis) socket.join(ROOM_THESIS);

  // Track online user
  global.connectedUsers[userId] = {
    socketId: socket.id,
    role,
    username: user.username,
  };

  console.log(
    `✅ AUTO-REGISTERED ${role.toUpperCase()}: ${userId} (${user.username})`
  );
  console.log(`📥 Joined rooms: ${[...socket.rooms].join(", ")}`);

  // ---------------------------------------------------------
  // 6.1 REGISTER USER — manual re-register (backward compat)
  // ---------------------------------------------------------
  socket.on("register-user", (clientUserId, clientRole) => {
    if (
      String(clientUserId) !== userId ||
      String(clientRole).toLowerCase() !== role
    ) {
      console.warn(
        `⚠️ Client tried to register as userId=${clientUserId} role=${clientRole}, ` +
          `but JWT says userId=${userId} role=${role}. Ignoring client values.`
      );
    }
    console.log(`ℹ️ register-user acknowledged: ${userId} (${role})`);
  });

  socket.on("send-message", (data) => {
    try {
      const {
        // new API
        audience,
        // legacy API
        targetRoles,
        targetUsers,
        self,
        // common
        event,
        payload,
        includeSelf,
      } = data || {};

      if (!event || typeof event !== "string") {
        console.log("⚠️ send-message: no valid event name");
        return;
      }

      const messageData = {
        ...payload,
        from: userId,
        fromRole: role,
        fromUsername: user.username,
        timestamp: new Date(),
      };

      const emitToSelf = () => {
        io.to(sendToSelf(userId)).emit(event, messageData);
      };

      // =====================================================
      // NEW API: `audience` object
      // =====================================================
      if (audience && typeof audience === "object") {
        const { to, toUsers, toRoles } = audience;
        let rooms = [];

        // --- `to` single target ---
        if (to) {
          switch (String(to).toLowerCase()) {
            case "self":
              rooms.push(sendToSelf(userId));
              break;
            case "all":
              rooms.push(sendToAll());
              break;
            case "everyone":
              rooms.push(ROOM_EVERYONE);
              break;
            case "non_admins":
            case "non-admins":
              rooms.push(ROOM_NON_ADMINS);
              break;
            case "faculty":
              rooms.push(ROOM_FACULTY);
              break;
            case "thesis":
              rooms.push(ROOM_THESIS);
              break;
            case "admin":
              rooms.push(sendToAdmin());
              break;
            default:
              // Treat as role name
              rooms.push(roleRoom(to));
          }
        }

        // --- `toUsers` multiple users ---
        if (Array.isArray(toUsers) && toUsers.length > 0) {
          rooms.push(...sendToUsers(toUsers));
        }

        // --- `toRoles` multiple roles ---
        if (Array.isArray(toRoles) && toRoles.length > 0) {
          rooms.push(...sendToRoles(toRoles));
        }

        // Dedupe
        rooms = [...new Set(rooms.filter(Boolean))];

        if (rooms.length === 0) {
          console.log("⚠️ send-message: audience resolved to no rooms");
          return;
        }

        rooms.forEach((room) => io.to(room).emit(event, messageData));

        if (
          includeSelf &&
          !rooms.includes(sendToSelf(userId))
        ) {
          emitToSelf();
        }

        console.log(
          `📨 ${role}:${userId} → [${rooms.join(", ")}] (${event})`
        );
        return;
      }

      // =====================================================
      // LEGACY API: `self` / `targetUsers` / `targetRoles`
      // =====================================================

      // CASE 1: SELF ONLY
      if (self === true) {
        emitToSelf();
        console.log(`📨 ${role}:${userId} → SELF (${event})`);
        return;
      }

      // CASE 2: SPECIFIC USERS
      if (Array.isArray(targetUsers) && targetUsers.length > 0) {
        sendToUsers(targetUsers).forEach((room) =>
          io.to(room).emit(event, messageData)
        );

        if (includeSelf && !targetUsers.includes(userId)) {
          emitToSelf();
        }

        console.log(
          `📨 ${role}:${userId} → users: ${targetUsers.join(", ")} (${event})`
        );
        return;
      }

      // CASE 3: SPECIFIC ROLES
      if (Array.isArray(targetRoles) && targetRoles.length > 0) {
        // 3a: ALL
        if (targetRoles.includes("all")) {
          io.to(sendToAll()).emit(event, messageData);
          console.log(`📨 ${role}:${userId} → ALL ROLES (${event})`);
          return;
        }

        // 3b: MULTIPLE ROLES
        sendToRoles(targetRoles).forEach((room) =>
          io.to(room).emit(event, messageData)
        );

        if (includeSelf) {
          const includesSelfRole = targetRoles
            .map((r) => String(r).toLowerCase().trim())
            .includes(role);

          if (!includesSelfRole) emitToSelf();
        }

        console.log(
          `📨 ${role}:${userId} → roles: ${targetRoles.join(", ")} (${event})`
        );
        return;
      }

      console.log("⚠️ send-message: no target specified");
    } catch (err) {
      console.error("❌ send-message error:", err);
    }
  });

  // ---------------------------------------------------------
  // 6.3 EQUIPMENT STATUS UPDATE
  // ---------------------------------------------------------
  socket.on("updatestatusequipment:send", (payload) => {
    try {
      const ownerId = payload?.loan?.userId;

      // Send sa admins
      io.to(sendToAdmin()).emit("updatestatusequipment:update", payload);

      // Send sa owner (kung meron)
      if (ownerId) {
        io.to(sendToUser(ownerId)).emit(
          "updatestatusequipment:update",
          payload
        );
      }

      console.log(
        `📦 Equipment update by ${role}:${userId} → admins${
          ownerId ? ` + owner:${ownerId}` : ""
        }`
      );
    } catch (err) {
      console.error("❌ equipment update error:", err);
    }
  });

  // ---------------------------------------------------------
  // 6.4 DISCONNECT
  // ---------------------------------------------------------
  socket.on("disconnect", (reason) => {
    if (socket.userId) {
      delete global.connectedUsers[socket.userId];
    }
    console.log(`❌ Disconnected: ${socket.id} (${reason}) user=${userId}`);
  });
});

// =========================================================
// 7. DB CONNECT + START SERVER
// =========================================================
mongoose
  .connect(process.env.CONN_STR)
  .then(async () => {
    console.log("✅ Database connected successfully");
    await initDefaultUser();

    const port = process.env.PORT || 3000;
    server.listen(port, () =>
      console.log(`🚀 Server running on port ${port}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  });