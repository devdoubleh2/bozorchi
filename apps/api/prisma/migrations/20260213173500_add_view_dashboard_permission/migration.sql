-- Add dashboard visibility permission for role assignment controls.
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'VIEW_DASHBOARD';
