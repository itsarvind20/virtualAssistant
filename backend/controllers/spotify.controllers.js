import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const spotifyAccountsUrl = "https://accounts.spotify.com";
const spotifyApiUrl = "https://api.spotify.com/v1";
const spotifyScopes = [
    "user-read-playback-state",
    "user-modify-playback-state"
].join(" ");

const getRedirectUri = () =>
    process.env.SPOTIFY_REDIRECT_URI ||
    "http://localhost:8000/api/spotify/callback";

const getFrontendUrl = () =>
    process.env.FRONTEND_URL || "http://localhost:5173";

const getBasicAuthHeader = () =>
    `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64")}`;

const requireSpotifyConfig = () => {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        throw new Error("Spotify credentials are missing");
    }
};

const saveSpotifyTokens = async (userId, tokenData) => {
    const expiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;

    await User.findByIdAndUpdate(userId, {
        spotify: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt
        }
    });
};

const refreshSpotifyToken = async (user) => {
    if (!user.spotify?.refreshToken) {
        throw new Error("Spotify is not connected");
    }

    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.spotify.refreshToken
    });

    const result = await axios.post(
        `${spotifyAccountsUrl}/api/token`,
        body,
        {
            headers: {
                Authorization: getBasicAuthHeader(),
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    const expiresAt = Date.now() + (result.data.expires_in - 60) * 1000;
    const refreshToken =
        result.data.refresh_token || user.spotify.refreshToken;

    user.spotify = {
        accessToken: result.data.access_token,
        refreshToken,
        expiresAt
    };

    await user.save();

    return result.data.access_token;
};

const getSpotifyAccessToken = async (userId) => {
    const user = await User.findById(userId);

    if (!user?.spotify?.accessToken) {
        throw new Error("Spotify is not connected");
    }

    if (user.spotify.expiresAt && user.spotify.expiresAt > Date.now()) {
        return user.spotify.accessToken;
    }

    return refreshSpotifyToken(user);
};

const getPlaybackDeviceId = async (accessToken) => {
    const devicesResult = await axios.get(`${spotifyApiUrl}/me/player/devices`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const devices = devicesResult.data.devices || [];
    const activeDevice = devices.find((device) => device.is_active);
    const selectedDevice = activeDevice || devices[0];

    if (!selectedDevice) {
        return null;
    }

    if (!activeDevice) {
        await axios.put(
            `${spotifyApiUrl}/me/player`,
            {
                device_ids: [selectedDevice.id],
                play: false
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
    }

    return selectedDevice.id;
};

export const spotifyLogin = async (req, res) => {
    try {
        requireSpotifyConfig();

        const state = jwt.sign(
            { userId: req.userId },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        const params = new URLSearchParams({
            response_type: "code",
            client_id: process.env.SPOTIFY_CLIENT_ID,
            scope: spotifyScopes,
            redirect_uri: getRedirectUri(),
            state
        });

        return res.json({
            url: `${spotifyAccountsUrl}/authorize?${params.toString()}`
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "Spotify login failed"
        });
    }
};

export const spotifyCallback = async (req, res) => {
    try {
        requireSpotifyConfig();

        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`${getFrontendUrl()}/?spotify=denied`);
        }

        const decodedState = jwt.verify(state, process.env.JWT_SECRET);

        const body = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: getRedirectUri()
        });

        const result = await axios.post(
            `${spotifyAccountsUrl}/api/token`,
            body,
            {
                headers: {
                    Authorization: getBasicAuthHeader(),
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        await saveSpotifyTokens(decodedState.userId, result.data);

        return res.redirect(`${getFrontendUrl()}/?spotify=connected`);
    } catch (error) {
        console.log(error.response?.data || error.message);

        return res.redirect(`${getFrontendUrl()}/?spotify=error`);
    }
};

export const spotifyStatus = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("spotify");

        return res.json({
            connected: Boolean(user?.spotify?.refreshToken)
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            connected: false
        });
    }
};

export const spotifyPlay = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                message: "Song name is required"
            });
        }

        const accessToken = await getSpotifyAccessToken(req.userId);

        const searchResult = await axios.get(`${spotifyApiUrl}/search`, {
            params: {
                q: query,
                type: "track",
                limit: 1
            },
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const track = searchResult.data.tracks?.items?.[0];

        if (!track) {
            return res.status(404).json({
                message: "I couldn't find that song on Spotify"
            });
        }

        const deviceId = await getPlaybackDeviceId(accessToken);

        if (!deviceId) {
            return res.status(404).json({
                message:
                    "Open Spotify on your phone, desktop, or web player first, then try again."
            });
        }

        await axios.put(
            `${spotifyApiUrl}/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
            {
                uris: [track.uri]
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return res.json({
            message: `Playing ${track.name} by ${track.artists
                .map((artist) => artist.name)
                .join(", ")} on Spotify.`
        });
    } catch (error) {
        const status = error.response?.status;

        console.log(error.response?.data || error.message);

        if (status === 403) {
            return res.status(403).json({
                message: "Spotify playback needs a Premium account."
            });
        }

        if (status === 404) {
            return res.status(404).json({
                message:
                    "Open Spotify on any device first, then try playing the song again."
            });
        }

        return res.status(500).json({
            message: "Spotify playback failed."
        });
    }
};
