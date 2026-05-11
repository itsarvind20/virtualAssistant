import express from "express";
import {
    spotifyCallback,
    spotifyLogin,
    spotifyPlay,
    spotifyStatus
} from "../controllers/spotify.controllers.js";
import isAuth from "../middlewares/isAuth.js";

const spotifyRouter = express.Router();

spotifyRouter.get("/login", isAuth, spotifyLogin);
spotifyRouter.get("/callback", spotifyCallback);
spotifyRouter.get("/status", isAuth, spotifyStatus);
spotifyRouter.post("/play", isAuth, spotifyPlay);

export default spotifyRouter;
