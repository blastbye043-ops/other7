import { Router, type IRouter } from "express";
import healthRouter from "./health";
import videoRouter from "./video";
import historyRouter from "./history";
import formatsRouter from "./formats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videoRouter);
router.use(historyRouter);
router.use(formatsRouter);

export default router;
