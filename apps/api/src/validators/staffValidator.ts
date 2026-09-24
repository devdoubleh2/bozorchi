import { z } from "zod";
import { Permission } from "../generated/public/client";

export const approveAssignmentSchema = z.object({
  permissions: z.array(z.nativeEnum(Permission)).optional(),
});
