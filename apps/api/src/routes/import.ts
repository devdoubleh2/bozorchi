import express from "express";
import multer from "multer";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { ImportController } from "../controllers/importController";

const router: express.Router = express.Router();
const importController = new ImportController();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept Excel files
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "text/csv"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel (.xlsx, .xls) and CSV files are allowed"));
    }
  },
});

// All routes require authentication
router.use(createAuthMiddleware());

// GET /api/import/template - Download import template
router.get("/template", createAuthHandler(importController.downloadTemplate));

// POST /api/import/validate - Validate uploaded file
router.post(
  "/validate",
  upload.single("file"),
  createAuthHandler(importController.validateFile)
);

// POST /api/import/validate-json - Validate JSON data (from AG Grid edits)
router.post("/validate-json", createAuthHandler(importController.validateJson));

// POST /api/import/execute - Execute bulk import
router.post("/execute", createAuthHandler(importController.executeImport));

export default router;
