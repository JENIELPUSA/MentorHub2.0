const express = require("express");
const router = express.Router(); //express router
const qmsController = require("../Controller/QmsController");
router.route("/")
    .post(qmsController.createQmsCorner);

router.route("/category/:category")
    .get(qmsController.DisplayQmsCorner);

router
    .route("/:id")
    .patch(qmsController.updateQmsCorner)
    .delete(qmsController.deleteQmsCorner)


module.exports = router;