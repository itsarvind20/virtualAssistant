import open from "open";
import { exec } from "child_process";
import playYouTubeVideo from "./functions/youtubePlayer.js";

const executeCommand = async (type, userInput) => {

    try {

        switch (type) {

            // =========================
            // OPEN YOUTUBE
            // =========================

            case "open-youtube":

                await open("https://www.youtube.com");

                break;


            // =========================
            // GOOGLE SEARCH
            // =========================

            case "google-search":

                await open(
                    `https://www.google.com/search?q=${encodeURIComponent(userInput)}`
                );

                break;


            // =========================
            // YOUTUBE SEARCH
            // =========================

            case "youtube-search":

                await open(
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`
                );

                break;


            // =========================
            // YOUTUBE MUSIC PLAYER
            // =========================

            case "youtube-play":

            case "play-music":

                await playYouTubeVideo(userInput);

                break;


            // =========================
            // OPEN CHROME
            // =========================

            case "open-chrome":

                exec("start chrome");

                break;


            // =========================
            // OPEN NOTEPAD
            // =========================

            case "open-notepad":

                exec("start notepad");

                break;


            // =========================
            // OPEN VS CODE
            // =========================

            case "open-vscode":

                exec("code");

                break;


            // =========================
            // CALCULATOR
            // =========================

            case "calculator-open":

                exec("calc");

                break;


            // =========================
            // INSTAGRAM
            // =========================

            case "instagram-open":

                await open("https://instagram.com");

                break;


            // =========================
            // FACEBOOK
            // =========================

            case "facebook-open":

                await open("https://facebook.com");

                break;


            default:

                console.log("No executable command");
        }

    } catch (error) {

        console.log("Execution Error:", error);
    }
};

export default executeCommand;
