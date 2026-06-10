import express from "express";
import { runPowerAction } from "../controllers/systemController.js";
import isAuth from "../middlewares/isAuth.js";

const systemRouter = express.Router();

systemRouter.use(isAuth);
systemRouter.post("/power", runPowerAction);

export default systemRouter;
