const express = require("express");
const router = express.Router(); //express router
const announcement = require("../Controller/AnnouncementController");
router.route("/").get(announcement.DisplayAnnouncement)
    .post(announcement.createAnnouncement);

router.route("/memorandum").get(announcement.DisplayMemorandum)
router.route("/scorner").get(announcement.Display5sCorner)
router.route("/gadcorner").get(announcement.GadCorner)

router
    .route("/:id")
    .patch(announcement.updateAnnouncement)
    .delete(announcement.deleteAnnouncement)


module.exports = router;