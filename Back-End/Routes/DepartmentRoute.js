const express = require("express");
const router = express.Router(); //express router
const department = require("../Controller/DepartmentController");

// ==========================================
// DEPARTMENT ROUTES
// ==========================================

// GET all departments (with pagination + search) & CREATE department
router.route("/")
    .get(department.DisplayDepartments)
    .post(department.createDepartment);

// GET all departments (simple list for dropdowns)
router.route("/all-simple")
    .get(department.getAllDepartmentsSimple);

// GET department by code
router.route("/by-code/:code")
    .get(department.getDepartmentByCode);

// GET, UPDATE, DELETE department by ID
router.route("/:id")
    .get(department.getSingleDepartment)
    .patch(department.updateDepartment)
    .delete(department.deleteDepartment);

module.exports = router;