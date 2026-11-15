const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const FormatModel = require("../Models/FormatSchema");
const SectionModel = require("../Models/SectionSchema");
const GroupModel = require("../Models/GroupName");
const UserLoginSchema = require("../Models/LogInSchema");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { pdf } = require("pdf-to-img");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];

const PREVIEW_CACHE_DIR = path.join(process.cwd(), "cache", "previews");

const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "mentorhub/formats",
        timeout: 120000,
        ...options,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const truthy = (v) =>
  v === true ||
  (typeof v === "string" && ["true", "1", "yes", "on"].includes(v.toLowerCase()));

const safeObjectId = (val, label) => {
  if (!val) return null;
  const str = String(val).trim();
  if (!/^[a-fA-F0-9]{24}$/.test(str)) {
    console.warn(`[Format] Invalid ObjectId for ${label}: "${str}"`);
    return null;
  }
  return new mongoose.Types.ObjectId(str);
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSafePublicId = (originalname, prefix = "format") => {
  const safe = (originalname || "file")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);
  return `${prefix}_${Date.now()}_${safe}`;
};

const validateFileExt = (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return { ok: false, ext };
  }
  return { ok: true, ext };
};

const isPdfUrl = (url) => {
  if (!url) return false;
  const lower = String(url).toLowerCase();
  if (lower.includes(".pdf")) return true;
  if (lower.includes("/raw/upload/")) return true;
  return false;
};

const getLatestTracking = (item) => {
  if (!item || !item.fileUrl) return null;
  return {
    url: item.fileUrl,
    date: item.updatedAt || item.createdAt || null,
    action: "upload",
    isCompleted: false,
    remarks: "",
    preview: null,
    isPdf: isPdfUrl(item.fileUrl),
  };
};

const resolvePdfBuffer = async (url) => {
  let fetchUrl = url;
  if (fetchUrl.includes("/raw/upload/") && !/\.pdf$/i.test(fetchUrl)) {
    fetchUrl = `${fetchUrl}.pdf`;
  }

  const response = await axios.get(fetchUrl, {
    responseType: "arraybuffer",
    timeout: 8000,
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength: 50 * 1024 * 1024,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PDFPreview/1.0)" },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return Buffer.from(response.data);
};

const readCachedPreview = (cacheKey) => {
  try {
    const file = path.join(PREVIEW_CACHE_DIR, `${cacheKey}.png`);
    if (fs.existsSync(file)) {
      const b64 = fs.readFileSync(file).toString("base64");
      return `data:image/png;base64,${b64}`;
    }
  } catch (_) {}
  return null;
};

const writeCachedPreview = (cacheKey, dataUrl) => {
  try {
    fs.mkdirSync(PREVIEW_CACHE_DIR, { recursive: true });
    const base64 = dataUrl.split(",")[1];
    fs.writeFileSync(
      path.join(PREVIEW_CACHE_DIR, `${cacheKey}.png`),
      Buffer.from(base64, "base64")
    );
  } catch (_) {}
};

const renderPreview = async (item, latest) => {
  const cacheKey = `${item._id}_${new Date(latest.date || 0).getTime()}`;

  const cached = readCachedPreview(cacheKey);
  if (cached) return cached;

  try {
    const pdfBuffer = await resolvePdfBuffer(latest.url);
    const doc = await pdf(pdfBuffer, { scale: 1.0 });
    const firstPage = await doc.getPage(1);
    const base64 = Buffer.from(firstPage).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    writeCachedPreview(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error(`[Preview] ${item._id}:`, err.message);
    return null;
  }
};

const runWithLimit = async (items, limitCount, workerFn) => {
  const queue = [...items];
  const results = [];
  const workers = Array.from({ length: limitCount }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      const res = await workerFn(item);
      results.push(res);
    }
  });
  await Promise.all(workers);
  return results;
};

exports.DisplayFormats = AsyncErrorHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const userId = req.user?._id;
  const role = (req.user?.role || "").toLowerCase().trim();

  if (!userId) {
    return res.status(401).json({
      status: "fail",
      message: "User ID not found in request. Please log in again.",
    });
  }

  const { search, type, uploadedBy } = req.query;

  if (role === "student") {
    try {
      const user = await UserLoginSchema.findById(userId)
        .select("referredBy role")
        .lean();

      if (!user) {
        return res.status(200).json({
          status: "success",
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          results: 0,
          data: [],
          message: "Student record not found",
        });
      }

      if (!user.referredBy || !user.referredBy.trim()) {
        return res.status(200).json({
          status: "success",
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          results: 0,
          data: [],
          message: "Student has no referral code — not yet in a group",
        });
      }

      const group = await GroupModel.findOne({
        referralCode: user.referredBy.trim().toUpperCase(),
      })
        .select("_id name referralCode sectionId")
        .lean();

      if (!group) {
        return res.status(200).json({
          status: "success",
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          results: 0,
          data: [],
          message: `No group found for referral code: ${user.referredBy}`,
        });
      }

      const section = await SectionModel.findById(group.sectionId)
        .select("_id name formatID")
        .lean();

      if (!section) {
        return res.status(200).json({
          status: "success",
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          results: 0,
          data: [],
          message: "Section not found for this group",
        });
      }

      if (!section.formatID) {
        return res.status(200).json({
          status: "success",
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          results: 0,
          data: [],
          sectionName: section.name,
          message: "No format assigned to your section yet",
        });
      }

      const format = await FormatModel.findById(section.formatID)
        .select(
          "_id titleFormat description fileUrl type isSelected uploadedBy createdAt updatedAt"
        )
        .lean();

      if (!format) {
        return res.status(200).json({
          status: "success",
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          results: 0,
          data: [],
          sectionName: section.name,
          message: "Format not found in database",
        });
      }

      const latest = getLatestTracking(format);
      format.latestTracking = latest;

      if (latest && latest.isPdf) {
        const preview = await Promise.race([
          renderPreview(format, latest),
          new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        format.latestTracking.preview = preview;
      }

      return res.status(200).json({
        status: "success",
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        results: 1,
        data: [format],
        sectionName: section.name,
        groupName: group.name,
        referralCode: group.referralCode,
      });
    } catch (err) {
      console.error("[DisplayFormats] Student resolution error:", err);
      return res.status(500).json({
        status: "fail",
        message: "Failed to resolve student format",
        error: err.message,
      });
    }
  }

  const matchStage = {};

  if (role === "subject_instructor") {
    matchStage.uploadedBy = new mongoose.Types.ObjectId(userId);
  } else if (uploadedBy) {
    const ubId = safeObjectId(uploadedBy, "uploadedBy");
    if (ubId) matchStage.uploadedBy = ubId;
  }

  if (search) {
    const safe = escapeRegex(search.trim());
    matchStage.$or = [
      { titleFormat: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
    ];
  }

  if (type) matchStage.type = type;

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

  const itemsWithLatest = formats.map((item) => {
    item.latestTracking = getLatestTracking(item);
    return item;
  });

  await runWithLimit(itemsWithLatest, 2, async (item) => {
    if (!item.latestTracking) return item;

    if (item.latestTracking.isPdf) {
      const preview = await Promise.race([
        renderPreview(item, item.latestTracking),
        new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
      item.latestTracking.preview = preview;
    }

    return item;
  });

  res.status(200).json({
    status: "success",
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalCount,
    results: itemsWithLatest.length,
    data: itemsWithLatest,
  });
});

exports.createFormat = AsyncErrorHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { titleFormat, description, type, isSelected } = req.body;

    if (!titleFormat || !titleFormat.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title format is required" });
    }
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found in request" });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required" });
    }
    if (req.file.size > 25 * 1024 * 1024) {
      return res
        .status(400)
        .json({ success: false, message: "File too large (max 25MB)" });
    }

    const extCheck = validateFileExt(req.file);
    if (!extCheck.ok) {
      return res.status(400).json({
        success: false,
        message: `File type not allowed: ${extCheck.ext || "unknown"}`,
      });
    }

    const validTypes = ["Capstone", "Thesis"];
    const formatType = validTypes.includes(type) ? type : "Capstone";
    const isSelectedBool = truthy(isSelected);

    const existingFormat = await FormatModel.findOne({
      titleFormat: titleFormat.trim(),
    }).lean();

    if (existingFormat) {
      return res
        .status(400)
        .json({ success: false, message: "Title format already exists" });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary env vars not set (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)"
      );
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "mentorhub/formats",
      resource_type: "auto",
      public_id: buildSafePublicId(req.file.originalname, "format"),
    });

    const fileData = {
      fileUrl: result.secure_url,
    };

    let format;
    try {
      format = await FormatModel.create({
        titleFormat: titleFormat.trim(),
        description: description?.trim() || "",
        type: formatType,
        uploadedBy: userId,
        isSelected: isSelectedBool,
        ...fileData,
      });
    } catch (createErr) {
      try {
        await cloudinary.uploader.destroy(result.public_id, {
          resource_type: result.resource_type,
        });
      } catch (cleanupErr) {
        console.error("Rollback failed:", cleanupErr.message);
      }
      throw createErr;
    }

    return res.status(201).json({
      success: true,
      status: "Success",
      message: "Format created successfully",
      data: format,
    });
  } catch (error) {
    console.error("createFormat error:", JSON.stringify(error.message));
    console.error("Code:", error.code);
    console.error("HTTP Status:", error.http_code || error.response?.status);
    if (error.response?.data) {
      const bodyStr =
        typeof error.response.data === "string"
          ? error.response.data.slice(0, 2000)
          : JSON.stringify(error.response.data, null, 2);
      console.error("Response:", bodyStr);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create format",
      error: error.message || error.code || "Unknown error",
      httpStatus: error.http_code || error.response?.status || null,
    });
  }
});

exports.getSingleFormat = AsyncErrorHandler(async (req, res) => {
  const format = await FormatModel.findById(req.params.id).populate(
    "uploadedBy",
    "name email role first_name last_name"
  );

  if (!format) {
    return res.status(404).json({ status: "fail", message: "Format not found" });
  }

  const data = format.toObject();
  const latest = getLatestTracking(data);
  data.latestTracking = latest;

  if (latest && latest.isPdf) {
    const preview = await Promise.race([
      renderPreview(data, latest),
      new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    data.latestTracking.preview = preview;
  }

  res.status(200).json({ status: "success", data });
});

exports.updateFormat = AsyncErrorHandler(async (req, res) => {
  try {
    const existingFormat = await FormatModel.findById(req.params.id);
    if (!existingFormat) {
      return res
        .status(404)
        .json({ status: "fail", message: "Format not found" });
    }

    const { titleFormat, description, type, isSelected } = req.body;

    if (titleFormat && titleFormat.trim() !== existingFormat.titleFormat) {
      const dup = await FormatModel.findOne({
        titleFormat: titleFormat.trim(),
        _id: { $ne: req.params.id },
      }).lean();
      if (dup) {
        return res
          .status(400)
          .json({ status: "fail", message: "Title format already exists" });
      }
    }

    const updatePayload = {};
    if (titleFormat !== undefined) updatePayload.titleFormat = titleFormat.trim();
    if (description !== undefined)
      updatePayload.description = (description || "").trim();
    if (type !== undefined && ["Capstone", "Thesis"].includes(type))
      updatePayload.type = type;
    if (isSelected !== undefined) updatePayload.isSelected = truthy(isSelected);

    let uploadedPublicId = null;
    let uploadedResourceType = "image";

    if (req.file) {
      if (req.file.size > 25 * 1024 * 1024) {
        return res
          .status(400)
          .json({ status: "fail", message: "File too large (max 25MB)" });
      }

      const extCheck = validateFileExt(req.file);
      if (!extCheck.ok) {
        return res.status(400).json({
          status: "fail",
          message: `File type not allowed: ${extCheck.ext || "unknown"}`,
        });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "mentorhub/formats",
        resource_type: "auto",
        public_id: buildSafePublicId(req.file.originalname, "format"),
      });

      uploadedPublicId = result.public_id;
      uploadedResourceType = result.resource_type;

      updatePayload.fileUrl = result.secure_url;
    }

    let format;
    try {
      format = await FormatModel.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        { new: true, runValidators: true }
      );
    } catch (dbErr) {
      if (uploadedPublicId) {
        try {
          await cloudinary.uploader.destroy(uploadedPublicId, {
            resource_type: uploadedResourceType,
          });
        } catch (cleanupErr) {
          console.error("Rollback failed:", cleanupErr.message);
        }
      }
      throw dbErr;
    }

    res.status(200).json({
      status: "success",
      message: "Format updated successfully",
      data: format,
    });
  } catch (error) {
    console.error("updateFormat error:", error.message);
    return res.status(500).json({
      status: "fail",
      message: "Failed to update format",
      error: error.message || "Unknown error",
    });
  }
});

exports.deleteFormat = AsyncErrorHandler(async (req, res) => {
  const format = await FormatModel.findById(req.params.id);
  if (!format) {
    return res
      .status(404)
      .json({ status: "fail", message: "Format not found" });
  }

  await FormatModel.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: "success",
    message: "Format deleted successfully",
  });
});

exports.getFormatsByType = AsyncErrorHandler(async (req, res) => {
  const formatType = req.params.type;
  const safe = escapeRegex(formatType);

  const formats = await FormatModel.find({
    type: { $regex: `^${safe}$`, $options: "i" },
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

exports.getAllFormatsSimple = AsyncErrorHandler(async (req, res) => {
  const formats = await FormatModel.find()
    .select("titleFormat type fileUrl")
    .sort({ titleFormat: 1 })
    .limit(500);

  res.status(200).json({
    status: "success",
    count: formats.length,
    data: formats,
  });
});

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

  const format = await FormatModel.findOne(filter).populate(
    "uploadedBy",
    "name email role first_name last_name"
  );

  if (!format) {
    return res
      .status(404)
      .json({ status: "fail", message: "No selected format found" });
  }

  res.status(200).json({ status: "success", data: format });
});