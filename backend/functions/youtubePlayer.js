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

        const query = `${songName} official audio`;

        // Open YouTube Music search
        await page.goto(
            `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
            {
                waitUntil: "networkidle2"
            }
        );

        console.log(`Searching for ${songName}...`);

        // Wait for YouTube Music results to load
        await page.waitForSelector("a[href*='watch']", {
            timeout: 15000
        });

        const songs = await page.$$("a[href*='watch']");

        if (songs.length > 0) {

            await Promise.all([
                page.waitForNavigation({
                    waitUntil: "networkidle2",
                    timeout: 15000
                }).catch(() => null),
                songs[0].click()
            ]);

            console.log("First YouTube Music result clicked");

        } else {

            console.log("No songs found");
        }

        console.log(`Playing ${songName}`);

    } catch (error) {

        console.log("YouTube Automation Error:", error);
    }
};

export default playYouTubeVideo;
