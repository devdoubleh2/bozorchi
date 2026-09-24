import { Router } from "express";
import { createAuthHandler, createAuthMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validation";
import { AuthController } from "../controllers/authController";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidator";

const router: Router = Router();
const authController = new AuthController();

// Register endpoint
router.post(
  "/register",
  validateRequest(registerSchema),
  createAuthHandler((req, res) => authController.register(req, res))
);

// Get profile endpoint (pending members allowed: identity read for waiting UI)
router.get(
  "/profile",
  createAuthMiddleware({ requireStore: false, allowPending: true }),
  createAuthHandler((req, res) => authController.getProfile(req, res))
);

// Login endpoint
router.post(
  "/login",
  validateRequest(loginSchema),
  createAuthHandler((req, res) => authController.login(req, res))
);

router.post(
  "/google",
  validateRequest(googleLoginSchema),
  createAuthHandler((req, res) => authController.googleLogin(req, res))
);

// Logout endpoint - clears the HttpOnly auth cookie
router.post("/logout", (_req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "none",
    expires: new Date(0), // Expire immediately
    path: "/",
  });
  return res.json({ message: "Logged out successfully" });
});

// Change password endpoint
router.put(
  "/password",
  createAuthMiddleware(),
  validateRequest(changePasswordSchema),
  createAuthHandler((req, res) => authController.updatePassword(req, res))
);

// Update profile endpoint
router.put(
  "/profile",
  createAuthMiddleware(),
  validateRequest(updateProfileSchema),
  createAuthHandler((req, res) => authController.updateProfile(req, res))
);



router.delete(
  "/me",
  createAuthMiddleware(),
  createAuthHandler((req, res) => authController.deleteMe(req, res))
);

// Password reset endpoints
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  createAuthHandler((req, res) => authController.forgotPassword(req, res))
);

router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  createAuthHandler((req, res) => authController.resetPassword(req, res))
);

export default router;
