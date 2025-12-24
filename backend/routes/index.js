import express from "express";

import AuthRoutes from "./authRoutes.js";
import OrganizationRoutes from "./organizationRoutes.js";

const router = express.Router();

router.use("/auth", AuthRoutes);
router.use("/organizations", OrganizationRoutes);

export default router;
