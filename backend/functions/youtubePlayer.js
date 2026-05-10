import puppeteer from "puppeteer-core";

const playYouTubeVideo = async (songName) => {

    try {

        const browser = await puppeteer.launch({

            headless: false,

            executablePath:
                "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

            defaultViewport: null,

            args: ["--start-maximized"]

        });

        const page = await browser.newPage();

        // Open YouTube search
        await page.goto(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(songName)}`,
            {
                waitUntil: "domcontentloaded"
            }
        );

        console.log(`Searching for ${songName}...`);

        // Wait for videos to load
        await page.waitForSelector("a#video-title", {
            timeout: 15000
        });

        // Get all video links
        const videos = await page.$$("a#video-title");

        // Click first video
        if (videos.length > 0) {

            await videos[0].click();

            console.log("First video clicked");

        } else {

            console.log("No videos found");
        }

        // Wait for video page
        await page.waitForNavigation({
            waitUntil: "networkidle2"
        });

        console.log(`Playing ${songName}`);

        // OPTIONAL FULLSCREEN
        await page.keyboard.press("f");

    } catch (error) {

        console.log("YouTube Automation Error:", error);
    }
};

export default playYouTubeVideo;