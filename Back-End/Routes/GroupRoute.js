const express = require("express");
const router = express.Router();
const GroupController = require("../Controller/GroupNameController");
const authController = require("../Controller/authController");

// ==========================================
// GROUP ROUTES
// ==========================================

// GET all groups (with pagination + search + filters) & CREATE group
router.route("/")
    .get(authController.protect, GroupController.DisplayGroups)
    .post(authController.protect, GroupController.createGroup); // ✅ FIXED: Changed from addMemberToGroup to createGroup

// GET simple groups list (for dropdowns)
router.route("/simple")
    .get(authController.protect, GroupController.getSimpleGroups);


// GET simple groups list (for dropdowns)
router.route("/GroupForDefense")
    .get(authController.protect, GroupController.getGroupForDefense);

// GET simple groups list (for dropdowns)
router.route("/getGroupByUserId")
    .get(authController.protect, GroupController.getGroupByUserId);

// GET groups without mentor
router.route("/no-mentor")
    .get(authController.protect, GroupController.getGroupsWithoutMentor);

// GET group by referral code
router.route("/referral/:referralCode")
    .get(authController.protect, GroupController.getGroupByReferralCode);

// GET groups by section
router.route("/section/:sectionId")
    .get(authController.protect, GroupController.getGroupsBySection);

// GET groups by mentor
router.route("/mentor/:mentorId")
    .get(authController.protect, GroupController.getGroupsByMentor);

// GET single group, UPDATE group, DELETE group
router.route("/:id")
    .patch(authController.protect, GroupController.updateGroup)
    .delete(authController.protect, GroupController.deleteGroup);


router.route("/ReferalData/:referredBy")
    .get(authController.protect, GroupController.getSingleGroup)

router.route("/getgroupDetails/:referredBy")
    .get(authController.protect, GroupController.getgroupdetails)


router.route("/assignAdviserCoAdviser/:id")
    .patch(authController.protect, GroupController.AssignAdviserandCoAdviser)


// ADD member to group
router.route("/:id/members")
    .post(authController.protect, GroupController.addMemberToGroup)
    .delete(authController.protect, GroupController.removeMemberFromGroup);

// ASSIGN mentor to group
router.route("/:id/mentor")
    .post(authController.protect, GroupController.assignMentor);

module.exports = router;