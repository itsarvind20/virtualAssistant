import open from "open";
import { exec } from "child_process";

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
            // MUSIC
            // =========================

            case "play-music":

                await open(
                    `https://music.youtube.com/search?q=${encodeURIComponent(userInput)}`
                );

                break;


            case "youtube-music-play":

                await open(
                    `https://music.youtube.com/search?q=${encodeURIComponent(userInput)}`
                );

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

            // case "play-music":
            //     await playMusic(
            //                    aiResult.userInput
            //                 );
            default:

                console.log("No executable command");
        }

    } catch (error) {

        console.log("Execution Error:", error);
    }
};

export default executeCommand;
