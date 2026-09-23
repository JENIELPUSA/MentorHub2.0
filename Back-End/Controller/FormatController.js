const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const FormatModel = require("../Models/FormatSchema");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const sendEmail = require("../Utils/email");

// ==========================================
// CREATE FORMAT (WITH FILE UPLOAD)
// ==========================================
exports.createFormat = AsyncErrorHandler(async (req, res) => {
    console.log("Middleware Called");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    // ==========================================
    // USER ID FROM AUTH MIDDLEWARE
    // ==========================================
    const userId = req.user?._id;

    console.log("userId:", userId);

    const {
        titleFormat,
        description,
        type,
        isSelected
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================
    if (!titleFormat || !titleFormat.trim()) {
        return res.status(400).json({
            success: false,
            message: "Title format is required",
        });
    }

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: user not found in request",
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "File is required",
        });
    }

    // ==========================================
    // VALIDATE TYPE
    // ==========================================
    const validTypes = ["Capstone", "Thesis"];

    const formatType = validTypes.includes(type)
        ? type
        : "Capstone";

    // ==========================================
    // CAST isSelected TO BOOLEAN
    // ==========================================
    const isSelectedBool =
        isSelected === true ||
        isSelected === "true" ||
        isSelected === "1";

    // ==========================================
    // DUPLICATE CHECK
    // ==========================================
    const existingFormat = await FormatModel.findOne({
        titleFormat: titleFormat.trim(),
    });

    if (existingFormat) {

        // Delete temporary uploaded file
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);

            console.log(
                "🗑️ Temp file deleted (duplicate):",
                req.file.path
            );
        }

        return res.status(400).json({
            success: false,
            message: "Title format already exists",
        });
    }

    // ==========================================
    // FILE UPLOAD
    // ==========================================
    let fileData = {};

    console.log("📤 Uploading file to UPLOADAGTA...");

    console.log("📁 File:", {
        originalname: req.file.originalname,
        size: `${(req.file.size / 1024).toFixed(2)} KB`,
        mimetype: req.file.mimetype,
        path: req.file.path,
    });

    try {

        const form = new FormData();

        form.append(
            "file",
            fs.createReadStream(req.file.path),
            req.file.originalname
        );

        const response = await axios.post(
            process.env.UPLOADAGTA_URL,
            form,
            {
                maxBodyLength: Infinity,
                headers: {
                    ...form.getHeaders(),
                },
            }
        );

        console.log(
            "📤 Upload Response:",
            response.data
        );

        // ==========================================
        // EXTRACT FILE INFORMATION
        // ==========================================

        let fileUrl = "";
        let publicId = "";

        if (
            response.data &&
            response.data.url
        ) {

            fileUrl = response.data.url;

            publicId =
                response.data.public_id ||
                response.data.filename ||
                req.file.filename;

        } else if (
            response.data &&
            response.data.success &&
            response.data.data
        ) {

            fileUrl = response.data.data.url;

            publicId =
                response.data.data.public_id ||
                req.file.filename;

        } else if (
            response.data &&
            response.data.file
        ) {

            fileUrl = response.data.file;

            publicId = req.file.filename;

        } else {

            console.log(
                "⚠️ Unexpected response format:",
                response.data
            );

            fileUrl =
                `/temp-uploads/${req.file.filename}`;

            publicId = req.file.filename;
        }

        // ==========================================
        // FILE DATA
        // ==========================================

        fileData = {
            fileUrl,
            fileName: req.file.originalname,
            publicId,
            fileType: req.file.mimetype,
            isPdf:
                req.file.mimetype ===
                "application/pdf",
        };

        console.log(
            "✅ File uploaded successfully:",
            fileData
        );

        // ==========================================
        // DELETE TEMP FILE
        // ==========================================

        if (
            req.file?.path &&
            fs.existsSync(req.file.path)
        ) {

            fs.unlinkSync(req.file.path);

            console.log(
                "🗑️ Temporary file deleted:",
                req.file.path
            );
        }

    } catch (err) {

        console.error(
            "❌ Upload Error:",
            err.message
        );

        // ==========================================
        // DELETE TEMP FILE ON ERROR
        // ==========================================

        if (
            req.file?.path &&
            fs.existsSync(req.file.path)
        ) {

            fs.unlinkSync(req.file.path);

            console.log(
                "🗑️ Temporary file deleted (error):",
                req.file.path
            );
        }

        return res.status(500).json({
            success: false,
            message: "File upload failed",
            error: err.message,
        });
    }

    // ==========================================
    // CREATE FORMAT
    // ==========================================

    const format = await FormatModel.create({
        titleFormat: titleFormat.trim(),

        description:
            description?.trim() || "",

        fileUrl:
            fileData.fileUrl,

        type:
            formatType,

        uploadedBy:
            userId,

        isSelected:
            isSelectedBool,
    });

    console.log(
        "✅ Format created:",
        format._id
    );

    // ==========================================
    // SEND EMAIL NOTIFICATION
    // ==========================================

    try {

        await sendEmail({
            email: process.env.EMAIL_USER,

            subject:
                "New Format Uploaded - PSA Biliran HRIS",

            message:
                `A new format has been uploaded.

Title Format: ${format.titleFormat}
Type: ${format.type}
Description: ${format.description || "None"}

Uploaded By: ${userId}

File:
${format.fileUrl}
`,
        });

        console.log(
            "📧 Email notification sent successfully"
        );

    } catch (emailError) {

        // IMPORTANT:
        // Huwag i-fail ang format creation
        // kapag email lang ang nag-error.

        console.error(
            "⚠️ Email notification failed:",
            emailError.message
        );
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
        success: true,
        status: "Success",
        message: "Format created successfully",
        data: format,
    });
});
// ==========================================
// DISPLAY ALL FORMATS (WITH PAGINATION + SEARCH)
// ==========================================
exports.DisplayFormats = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = req.user?._id;
    const role = req.user?.role;

    const { search, type, uploadedBy } = req.query;

    const matchStage = {};

    // ---------- ROLE-BASED FILTER ----------
    if (role === "admin") {
        // Admin: see all formats.
        // But still allow explicit ?uploadedBy= filter if provided.
        if (uploadedBy) {
            matchStage.uploadedBy = new mongoose.Types.ObjectId(uploadedBy);
        }
    } else {
        // Non-admin: only see their own uploads.
        matchStage.uploadedBy = new mongoose.Types.ObjectId(userId);
    }

    // ---------- SEARCH ----------
    if (search) {
        matchStage.$or = [
            { titleFormat: { $regex: search.trim(), $options: "i" } },
            { description: { $regex: search.trim(), $options: "i" } },
        ];
    }

    // ---------- TYPE FILTER ----------
    if (type) {
        matchStage.type = type;
    }

    const result = await FormatModel.aggregate([
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
                            titleFormat: 1,
                            description: 1,
                            fileUrl: 1,
                            isSelected: 1,
                            type: 1,
                            uploadedBy: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const formats = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: formats.length,
        data: formats,
    });
});

// ==========================================
// GET SINGLE FORMAT
// ==========================================
exports.getSingleFormat = AsyncErrorHandler(async (req, res) => {
    const format = await FormatModel.findById(req.params.id)
        .populate("uploadedBy", "name email role");

    if (!format) {
        return res.status(404).json({
            status: "fail",
            message: "Format not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: format,
    });
});

// ==========================================
// UPDATE FORMAT (WITH OPTIONAL FILE REPLACEMENT)
// ==========================================
exports.updateFormat = AsyncErrorHandler(async (req, res) => {
    const { titleFormat, description, type, isSelected } = req.body;
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    // Check if format exists
    const existingFormat = await FormatModel.findById(req.params.id);
    if (!existingFormat) {
        return res.status(404).json({
            status: "fail",
            message: "Format not found",
        });
    }

    // Check if new title format conflicts with another format
    if (titleFormat && titleFormat !== existingFormat.titleFormat) {
        const titleExists = await FormatModel.findOne({
            titleFormat,
            _id: { $ne: req.params.id },
        });
        if (titleExists) {
            return res.status(400).json({
                status: "fail",
                message: "Title format already exists",
            });
        }
    }

    // ============================================
    // OPTIONAL FILE UPLOAD (REPLACE FILE)
    // ============================================
    let fileData = {};

    if (req.file) {
        console.log("📸 Replacing file — uploading to UPLOADAGTA...");
        console.log("📁 File:", {
            originalname: req.file.originalname,
            size: `${(req.file.size / 1024).toFixed(2)} KB`,
            mimetype: req.file.mimetype,
            path: req.file.path,
        });

        const form = new FormData();
        form.append(
            "file",
            fs.createReadStream(req.file.path),
            req.file.originalname
        );

        try {
            const response = await axios.post(
                process.env.UPLOADAGTA_URL,
                form,
                {
                    maxBodyLength: Infinity,
                    headers: { ...form.getHeaders() },
                }
            );

            console.log("📤 Upload Response:", response.data);

            let fileUrl = "";
            let publicId = "";

            if (response.data && response.data.url) {
                fileUrl = response.data.url;
                publicId = response.data.public_id || response.data.filename || req.file.filename;
            } else if (response.data && response.data.success && response.data.data) {
                fileUrl = response.data.data.url;
                publicId = response.data.data.public_id || req.file.filename;
            } else if (response.data && response.data.file) {
                fileUrl = response.data.file;
                publicId = req.file.filename;
            } else {
                console.log("⚠️ Unexpected response format:", response.data);
                fileUrl = `/temp-uploads/${req.file.filename}`;
                publicId = req.file.filename;
            }

            fileData = {
                fileUrl: fileUrl,
                fileName: req.file.originalname,
                publicId: publicId,
                fileType: req.file.mimetype,
                isPdf: req.file.mimetype === "application/pdf",
            };

            console.log("✅ File replaced successfully:", fileData);

            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
                console.log("🗑️ Temporary file deleted:", req.file.path);
            }
        } catch (err) {
            console.error("❌ Upload Error:", err.message);
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
                console.log("🗑️ Temporary file deleted (error):", req.file.path);
            }

            return res.status(500).json({
                status: "fail",
                message: "File upload failed",
                error: err.message,
            });
        }
    }

    // ============================================
    // BUILD UPDATE PAYLOAD
    // ============================================
    const updatePayload = { ...req.body };

    // Kung may bagong file, i-override ang fileUrl
    if (fileData.fileUrl) {
        updatePayload.fileUrl = fileData.fileUrl;
    }

    const format = await FormatModel.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        {
            new: true,
            runValidators: true,
        }
    );

    console.log("🔄 Format updated:", format._id);

    res.status(200).json({
        status: "success",
        message: "Format updated successfully",
        data: format,
    });
});

// ==========================================
// DELETE FORMAT
// ==========================================
exports.deleteFormat = AsyncErrorHandler(async (req, res) => {
    const format = await FormatModel.findById(req.params.id);

    if (!format) {
        return res.status(404).json({
            status: "fail",
            message: "Format not found",
        });
    }

    await FormatModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        message: "Format deleted successfully",
    });
});

// ==========================================
// GET FORMATS BY TYPE (ADDITIONAL UTILITY)
// ==========================================
exports.getFormatsByType = AsyncErrorHandler(async (req, res) => {
    const formatType = req.params.type;

    const formats = await FormatModel.find({
        type: { $regex: `^${formatType}$`, $options: "i" },
    }).sort({ createdAt: -1 });

    if (!formats || formats.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: `No formats found for type: ${formatType}`,
        });
    }

    res.status(200).json({
        status: "success",
        count: formats.length,
        data: formats,
    });
});

// ==========================================
// GET ALL FORMATS (NO PAGINATION - FOR DROPDOWNS)
// ==========================================
exports.getAllFormatsSimple = AsyncErrorHandler(async (req, res) => {
    const formats = await FormatModel.find()
        .select("titleFormat type fileUrl")
        .sort({ titleFormat: 1 });

    res.status(200).json({
        status: "success",
        count: formats.length,
        data: formats,
    });
});

// ==========================================
// GET SELECTED FORMAT BY USER
// ==========================================
exports.getSelectedFormat = AsyncErrorHandler(async (req, res) => {
    const { uploadedBy, type } = req.query;

    if (!uploadedBy) {
        return res.status(400).json({
            status: "fail",
            message: "uploadedBy query parameter is required",
        });
    }

    const filter = { uploadedBy, isSelected: true };
    if (type) filter.type = type;

    const format = await FormatModel.findOne(filter)
        .populate("uploadedBy", "name email role");

    if (!format) {
        return res.status(404).json({
            status: "fail",
            message: "No selected format found",
        });
    }

    res.status(200).json({
        status: "success",
        data: format,
    });
});