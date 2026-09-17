const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const DepartmentModel = require("../Models/DepartmentSchema");

// ==========================================
// CREATE DEPARTMENT
// ==========================================
exports.createDepartment = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called");
    console.log(req.body);

    const { departmentName, departmentCode, description } = req.body;

    // basic validation
    if (!departmentName) {
        return res.status(400).json({
            success: false,
            message: "Department name is required",
        });
    }

    // Check if department name already exists
    const existingDept = await DepartmentModel.findOne({ departmentName });
    if (existingDept) {
        return res.status(400).json({
            success: false,
            message: "Department name already exists",
        });
    }

    const department = await DepartmentModel.create({
        departmentName,
        departmentCode, // Optional - will be auto-generated if not provided
        description,
    });

    return res.status(201).json({
        status: "Success",
        message: "Department created successfully",
        data: department,
    });
});

// ==========================================
// DISPLAY ALL DEPARTMENTS (WITH PAGINATION + SEARCH)
// ==========================================
exports.DisplayDepartments = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search } = req.query;

    const matchStage = {};

    if (search) {
        matchStage.$or = [
            { departmentName: { $regex: search.trim(), $options: "i" } },
            { departmentCode: { $regex: search.trim(), $options: "i" } },
            { description: { $regex: search.trim(), $options: "i" } },
        ];
    }

    const result = await DepartmentModel.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            departmentName: 1,
                            departmentCode: 1,
                            description: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const departments = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: departments.length,
        data: departments,
    });
});

// ==========================================
// GET SINGLE DEPARTMENT
// ==========================================
exports.getSingleDepartment = AsyncErrorHandler(async (req, res) => {
    const department = await DepartmentModel.findById(req.params.id);

    if (!department) {
        return res.status(404).json({
            status: "fail",
            message: "Department not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: department,
    });
});

// ==========================================
// UPDATE DEPARTMENT
// ==========================================
exports.updateDepartment = AsyncErrorHandler(async (req, res) => {
    const { departmentName, departmentCode, description } = req.body;
    console.log(req.body)

    // Check if department exists
    const existingDept = await DepartmentModel.findById(req.params.id);
    if (!existingDept) {
        return res.status(404).json({
            status: "fail",
            message: "Department not found",
        });
    }

    // Check if new department name conflicts with another department
    if (departmentName && departmentName !== existingDept.departmentName) {
        const nameExists = await DepartmentModel.findOne({
            departmentName,
            _id: { $ne: req.params.id }
        });
        if (nameExists) {
            return res.status(400).json({
                status: "fail",
                message: "Department name already exists",
            });
        }
    }

    // Check if new department code conflicts with another department
    if (departmentCode && departmentCode !== existingDept.departmentCode) {
        const codeExists = await DepartmentModel.findOne({
            departmentCode,
            _id: { $ne: req.params.id }
        });
        if (codeExists) {
            return res.status(400).json({
                status: "fail",
                message: "Department code already exists",
            });
        }
    }

    const department = await DepartmentModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        status: "success",
        message: "Department updated successfully",
        data: department,
    });
});

// ==========================================
// DELETE DEPARTMENT
// ==========================================
exports.deleteDepartment = AsyncErrorHandler(async (req, res) => {
    const department = await DepartmentModel.findById(req.params.id);

    if (!department) {
        return res.status(404).json({
            status: "fail",
            message: "Department not found",
        });
    }

    await DepartmentModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        message: "Department deleted successfully",
    });
});

// ==========================================
// GET DEPARTMENT BY CODE (ADDITIONAL UTILITY)
// ==========================================
exports.getDepartmentByCode = AsyncErrorHandler(async (req, res) => {
    const department = await DepartmentModel.findOne({
        departmentCode: req.params.code.toUpperCase()
    });

    if (!department) {
        return res.status(404).json({
            status: "fail",
            message: "Department not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: department,
    });
});

// ==========================================
// GET ALL DEPARTMENTS (NO PAGINATION - FOR DROPDOWNS)
// ==========================================
exports.getAllDepartmentsSimple = AsyncErrorHandler(async (req, res) => {
    const departments = await DepartmentModel.find()
        .select("departmentName departmentCode")
        .sort({ departmentName: 1 });

    res.status(200).json({
        status: "success",
        count: departments.length,
        data: departments,
    });
});