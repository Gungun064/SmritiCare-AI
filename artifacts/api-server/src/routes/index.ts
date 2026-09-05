import { Router, type IRouter } from "express";
import healthRouter from "./health";
import smritiCareRouter from "./smriticcare";

const router: IRouter = Router();

router.use(healthRouter);
router.use(smritiCareRouter);

export default router;
