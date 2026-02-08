import { Router } from "express";
import FileUploadService from "../services/fileUpload";
import { createAuthMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { z } from "zod";
import logger from "../../logs/log";

const router: Router = Router();
const upload = new FileUploadService().getMulterConfig();

// Validation schemas
const fileUploadSchema = z.object({
  // File validation is handled by multer, but we can add additional checks
});

router.use(createAuthMiddleware());

router.post(
  "/upload",
  upload.single("file"),
  validateRequest(fileUploadSchema),
  async (req, res) => {
    logger.info(`[Upload] Request received. Content-Type: ${req.headers["content-type"]}`, "files");
    if (req.file) {
      logger.info(`[Upload] File attached: ${req.file.originalname} (${req.file.size} bytes)`, "files");
    } else {
      logger.error("[Upload] No file attached to request object (multer might have rejected it)", "files");
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
          details: ["Please select a file to upload"],
        });
      }
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/jpg",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type",
          details: ["Only JPEG, PNG, GIF, and WebP images are allowed"],
        });
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          error: "File too large",
          details: ["File size must be less than 5MB"],
        });
      }

      const publicUrl = await FileUploadService.uploadImage(
        req.file.buffer,
        req.file.originalname
      );
      return res.status(201).json({ url: publicUrl, path: publicUrl });
    } catch (error) {
      logger.error("Error uploading to MinIO:", "files", error);
      return res.status(500).json({
        error: "Failed to upload file",
        details: [(error as Error).message || "An unexpected error occurred"],
      });
    }
  }
);

export default router;
