// room.js

// =========================================================
// ROLE CONSTANTS — i-match sa UserLoginSchema enum
// =========================================================
const ROLES = Object.freeze({
  ADMIN: "admin",
  SUBJECT_INSTRUCTOR: "subject_instructor",
  STUDENT: "student",
  PANELIST: "panelist",
  ADVISER: "adviser",
  COADVISER: "coadviser", // ⚠️ idagdag sa schema enum kung gagamitin
});

// Lahat ng valid roles (para sa iteration)
const ALL_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.SUBJECT_INSTRUCTOR,
  ROLES.STUDENT,
  ROLES.PANELIST,
  ROLES.ADVISER,
  ROLES.COADVISER,
]);

// =========================================================
// ROOM NAME HELPERS
// =========================================================

const normalizeRole = (role) => String(role ?? "").toLowerCase().trim();
const normalizeId = (id) => String(id ?? "").trim();

// ---------------------------------------------------------
// 1. USER ROOM — isang specific user
// ---------------------------------------------------------
const userRoom = (userId) => `user:${normalizeId(userId)}`;

// ---------------------------------------------------------
// 2. ROLE ROOM — lahat ng users na may parehong role
// ---------------------------------------------------------
const roleRoom = (role) => `role:${normalizeRole(role)}`;

// ---------------------------------------------------------
// 3. PRIVATE ROOM — unique per (role + userId)
// ---------------------------------------------------------
const privateRoom = (role, userId) =>
  `private:${normalizeRole(role)}:${normalizeId(userId)}`;

// =========================================================
// BROADCAST ROOMS
// =========================================================

// Lahat ng authenticated users
const ROOM_ALL_ROLES = "all-roles";

// Lahat ng users (pareho lang sa all-roles, pero semantically iba)
// Gamitin ito kung may "public" announcements na kahit guest makakatanggap
const ROOM_EVERYONE = "everyone";

// Admins lang
const ROOM_ADMINS = roleRoom(ROLES.ADMIN);

// Lahat ng NON-admin (students, instructors, panelists, advisers)
// Useful para sa announcements na hindi kailangan ng admin
const ROOM_NON_ADMINS = "non-admins";

// Lahat ng FACULTY (subject_instructor + panelist + adviser + coadviser)
const ROOM_FACULTY = "faculty";

// Lahat ng THESIS-RELATED roles (student + adviser + coadviser + panelist)
const ROOM_THESIS = "thesis";

// =========================================================
// HIGH-LEVEL SEND HELPERS
// =========================================================

// --- Single targets ---
const sendToAdmin = () => roleRoom(ROLES.ADMIN);
const sendToSubjectInstructor = () => roleRoom(ROLES.SUBJECT_INSTRUCTOR);
const sendToStudent = () => roleRoom(ROLES.STUDENT);
const sendToPanelist = () => roleRoom(ROLES.PANELIST);
const sendToAdviser = () => roleRoom(ROLES.ADVISER);
const sendToCoadviser = () => roleRoom(ROLES.COADVISER);

// --- User targets ---
const sendToSelf = (userId) => userRoom(userId);
const sendToUser = (userId) => userRoom(userId);

// --- Broadcast targets ---
const sendToAll = () => ROOM_ALL_ROLES; // lahat ng authenticated
const sendToEveryone = () => ROOM_EVERYONE; // lahat (kasama guest kung meron)
const sendToNonAdmins = () => ROOM_NON_ADMINS;
const sendToFaculty = () => ROOM_FACULTY;
const sendToThesis = () => ROOM_THESIS;

// --- Multiple targets ---
const sendToRoles = (roles = []) =>
  roles.map((r) => roleRoom(r)).filter(Boolean);

const sendToUsers = (userIds = []) =>
  userIds.map((uid) => userRoom(uid)).filter(Boolean);

// =========================================================
// ADVANCED: BROADCAST EXCEPT SOMEONE
// =========================================================

/**
 * I-return ang lahat ng rooms ng "all-roles" broadcast,
 * PERO i-exclude ang sender (o ibang user) kung ayaw mong
 * makatanggap siya ng sariling message.
 *
 * NOTE: Hindi ito socket-level exclusion. Gumagamit ng
 * `io.to(room1).to(room2)` — pero dahil lahat ay nasa
 * `all-roles`, kailangan mo i-emit sa individual role rooms
 * para ma-exclude ang isang role.
 *
 * @returns {string[]} array of role room names (walang `all-roles`)
 */
const sendToAllRolesExcept = (excludeRoles = []) => {
  const excluded = new Set(excludeRoles.map(normalizeRole));
  return ALL_ROLES.filter((r) => !excluded.has(r)).map((r) =>
    roleRoom(r)
  );
};

/**
 * Same as above, pero per-user exclusion — i-emit sa lahat ng role rooms,
 * tapos i-check kung ang sender ay kasama. Karaniwang pattern:
 *
 *   const rooms = sendToAllRolesExceptRole(senderRole);
 *   rooms.forEach(r => io.to(r).emit(event, data));
 *
 * Para ma-exclude ang isang USER (hindi role), kailangan mong
 * i-check sa client side o gumamit ng custom middleware.
 */
const sendToAllRolesExceptRole = (senderRole) =>
  sendToAllRolesExcept([senderRole]);

// =========================================================
// EXPORTS
// =========================================================
module.exports = {
  // constants
  ROLES,
  ALL_ROLES,
  ROOM_ALL_ROLES,
  ROOM_EVERYONE,
  ROOM_ADMINS,
  ROOM_NON_ADMINS,
  ROOM_FACULTY,
  ROOM_THESIS,

  // core helpers
  userRoom,
  roleRoom,
  privateRoom,
  normalizeRole,
  normalizeId,

  // single-target send
  sendToAdmin,
  sendToSubjectInstructor,
  sendToStudent,
  sendToPanelist,
  sendToAdviser,
  sendToCoadviser,
  sendToSelf,
  sendToUser,

  // broadcast send
  sendToAll,
  sendToEveryone,
  sendToNonAdmins,
  sendToFaculty,
  sendToThesis,
  sendToRoles,
  sendToUsers,
  sendToAllRolesExcept,
  sendToAllRolesExceptRole,
};