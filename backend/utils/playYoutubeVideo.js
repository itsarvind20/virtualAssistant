import puppeteer from "puppeteer";

let youtubeBrowser = null;
let youtubePage = null;

const getYoutubePage = async () => {

    if (
        youtubeBrowser &&
        youtubeBrowser.isConnected() &&
        youtubePage &&
        !youtubePage.isClosed()
    ) {

        return youtubePage;
    }

    youtubeBrowser = await puppeteer.launch({
        headless: false,

        defaultViewport: null,

        args: [
            "--start-maximized",
            "--autoplay-policy=no-user-gesture-required"
        ]
    });

    youtubeBrowser.on("disconnected", () => {
        youtubeBrowser = null;
        youtubePage = null;
    });

    const pages = await youtubeBrowser.pages();

    youtubePage = pages[0] || await youtubeBrowser.newPage();

    return youtubePage;
};

const playFirstYoutubeVideo = async (query) => {

    try {

        const page = await getYoutubePage();

        await page.bringToFront();

        await page.goto(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            {
                waitUntil: "networkidle2",
                timeout: 60000
            }
        );

        await page.waitForSelector("a#video-title[href*='watch']", {
            timeout: 30000
        });

        const firstVideoUrl = await page.$eval(
            "a#video-title[href*='watch']",
            (link) => link.href
        );

        if (!firstVideoUrl) {
            console.log("No YouTube video found");
            return false;
        }

        await page.goto(firstVideoUrl, {
            waitUntil: "networkidle2",
            timeout: 60000
        });

        await page.evaluate(() => {
            const video = document.querySelector("video");

            if (video) {
                video.play()?.catch(() => {});
            }
        }).catch(() => {});

        console.log(`Playing YouTube video for: ${query}`);

        return true;

    } catch (error) {

        console.log("YouTube Video Error:", error);
        return false;
    }
};

export default playFirstYoutubeVideo;
