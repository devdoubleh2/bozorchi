import { v4 as uuidv4 } from "uuid";
import { Client } from "minio";
import logger from "../../logs/log";
import multer from "multer";

class FileUploadService {
  static minioClient: Client;
  static bucketName = "uploads";
  static publicEndpoint = "https://minio.bozorchi.store";

  private static initialized = false;

  static ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  static ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
  static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  static EXT_TO_MIME: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  constructor() {
    if (FileUploadService.initialized) return;

    // Read config from environment at runtime (not at module load time)
    const endpoint = process.env["MINIO_ENDPOINT"] || "minio";
    const port = parseInt(process.env["MINIO_PORT"] || "9000", 10);
    const useSSL = process.env["MINIO_USE_SSL"] === "true";
    const accessKey = process.env["MINIO_ACCESS_KEY"] || "minioadmin";
    const secretKey = process.env["MINIO_SECRET_KEY"] || "xhzjs55iu6sqxg7x";

    // Update static properties from env
    FileUploadService.bucketName = process.env["MINIO_BUCKET"] || "uploads";
    FileUploadService.publicEndpoint = process.env["MINIO_PUBLIC_URL"] || "https://minio.bozorchi.store";

    // === OBSERVABILITY: Log all MinIO config values ===
    logger.info("[MinIO] ========== CONFIGURATION DEBUG ==========", "fileUpload");
    logger.info("[MinIO] Raw env values:", "fileUpload", {
      MINIO_ENDPOINT: process.env["MINIO_ENDPOINT"] || "(not set, using default: minio)",
      MINIO_PORT: process.env["MINIO_PORT"] || "(not set, using default: 9000)",
      MINIO_USE_SSL: process.env["MINIO_USE_SSL"] || "(not set, using default: false)",
      MINIO_ACCESS_KEY: process.env["MINIO_ACCESS_KEY"] ? "[SET]" : "(not set, using default)",
      MINIO_SECRET_KEY: process.env["MINIO_SECRET_KEY"] ? "[SET]" : "(not set, using default)",
      MINIO_BUCKET: process.env["MINIO_BUCKET"] || "(not set, using default: uploads)",
      MINIO_PUBLIC_URL: process.env["MINIO_PUBLIC_URL"] || "(not set, using default)",
    });
    logger.info("[MinIO] Resolved config:", "fileUpload", {
      endpoint,
      port,
      useSSL,
      bucket: FileUploadService.bucketName,
      publicEndpoint: FileUploadService.publicEndpoint,
    });
    logger.info("[MinIO] ==========================================", "fileUpload");

    FileUploadService.minioClient = new Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    FileUploadService.initialized = true;

    // Fire and forget bucket initialization
    void this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const exists = await FileUploadService.minioClient.bucketExists(
        FileUploadService.bucketName
      );

      if (!exists) {
        await FileUploadService.minioClient.makeBucket(
          FileUploadService.bucketName,
          "" // default region
        );

      }

      // Set public read policy
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${FileUploadService.bucketName}/*`],
          },
        ],
      };

      await FileUploadService.minioClient.setBucketPolicy(
        FileUploadService.bucketName,
        JSON.stringify(policy)
      );

    } catch (error: any) {
      logger.warn("Bucket initialization failed or already set", "fileUpload", {
        error: error?.message || error,
      });
      // Don't throw — it's okay if bucket already exists or policy is already set
    }
  }

  static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      fileFilter: (_req, file, cb) => {
        logger.info(`[Multer] Processing file: ${file.originalname}, mimetype: ${file.mimetype}`, "fileUpload");
        const isAllowed = FileUploadService.ALLOWED_MIME_TYPES.includes(
          file.mimetype
        );
        if (!isAllowed) {
          logger.warn(`[Multer] File rejected. Mimetype ${file.mimetype} not in allowed list: ${FileUploadService.ALLOWED_MIME_TYPES.join(", ")}`, "fileUpload");
        } else {
          logger.info(`[Multer] File accepted: ${file.originalname}`, "fileUpload");
        }
        cb(null, isAllowed);
      },
      limits: { fileSize: FileUploadService.MAX_FILE_SIZE },
    });
  }

  static async uploadImage(
    fileBuffer: Buffer,
    originalName?: string
  ): Promise<string> {
    FileUploadService.ensureClient();

    if (fileBuffer.length > FileUploadService.MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds ${FileUploadService.MAX_FILE_SIZE / (1024 * 1024)
        }MB limit`
      );
    }

    const extension = originalName?.split(".").pop()?.toLowerCase() || "jpg";

    if (!FileUploadService.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(
        `Invalid file type. Allowed: ${FileUploadService.ALLOWED_EXTENSIONS.join(
          ", "
        )}`
      );
    }

    const fileName = `${uuidv4()}.${extension}`;
    const objectName = FileUploadService.sanitizeFileName(fileName);
    const contentType =
      FileUploadService.EXT_TO_MIME[extension] || "image/jpeg";

    // === OBSERVABILITY: Log upload attempt details ===
    logger.info("[MinIO] Upload attempt:", "fileUpload", {
      bucket: FileUploadService.bucketName,
      objectName,
      contentType,
      fileSize: fileBuffer.length,
    });

    try {
      await FileUploadService.minioClient.putObject(
        FileUploadService.bucketName,
        objectName,
        fileBuffer,
        fileBuffer.length,
        { "Content-Type": contentType }
      );
      logger.info("[MinIO] Upload SUCCESS:", "fileUpload", { objectName });
    } catch (uploadError: any) {
      // === OBSERVABILITY: Detailed error logging ===
      logger.error("[MinIO] Upload FAILED - Detailed error:", "fileUpload", {
        errorName: uploadError?.name,
        errorMessage: uploadError?.message,
        errorCode: uploadError?.code,
        statusCode: uploadError?.statusCode,
        resource: uploadError?.resource,
        requestId: uploadError?.requestid,
        // Log the full error for debugging
        fullError: JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError)),
      });
      throw uploadError;
    }

    const publicUrl = `${FileUploadService.publicEndpoint}/${FileUploadService.bucketName}/${objectName}`;

    return publicUrl;
  }

  static async deleteFile(objectName: string): Promise<void> {
    FileUploadService.ensureClient();
    const sanitizedName = FileUploadService.sanitizeFileName(objectName);
    await FileUploadService.minioClient.removeObject(
      FileUploadService.bucketName,
      sanitizedName
    );
  }

  static async fileExists(objectName: string): Promise<boolean> {
    FileUploadService.ensureClient();
    try {
      await FileUploadService.minioClient.statObject(
        FileUploadService.bucketName,
        FileUploadService.sanitizeFileName(objectName)
      );
      return true;
    } catch (error: any) {
      if (error.code === "NoSuchKey" || error.code === "NotFound") {
        return false;
      }
      throw error; // Re-throw unexpected errors
    }
  }

  private static ensureClient(): void {
    if (!FileUploadService.minioClient) {
      new FileUploadService();
    }
  }

  /**
   * Extracts the object name from a MinIO URL
   * Example: https://minio.bozorchi.store/uploads/uuid.jpg -> uuid.jpg
   */
  static extractObjectNameFromUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      // Remove empty strings and the bucket name (first part after leading slash)
      const filteredParts = pathParts.filter((p) => p);
      if (filteredParts.length >= 2) {
        // Return everything after the bucket name
        return filteredParts.slice(1).join("/");
      }
      return null;
    } catch {
      return null;
    }
  }
}

export default FileUploadService;
