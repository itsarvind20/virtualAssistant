import puppeteer from "puppeteer";

const playYouTubeVideo = async (songName) => {

    try {
// 
        // Launch Browser
        const browser = await puppeteer.launch({
            headless: false,

            defaultViewport: null,

            args: [
                "--start-maximized",
                "--autoplay-policy=no-user-gesture-required"
            ]
        });

        // Open New Page
        const page = await browser.newPage();

        // Create Search Query
        const query = `${songName} official audio`;

        console.log(`Searching for: ${query}`);

        // Open YouTube Music Search
        await page.goto(
            `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
            {
                waitUntil: "networkidle2",
                timeout: 60000
            }
        );

        // Wait for song results
        await page.waitForSelector(
            "ytmusic-responsive-list-item-renderer a[href*='watch']",
            {
                timeout: 30000
            }
        );

        // Get all song links
        const songs = await page.$$(
            "ytmusic-responsive-list-item-renderer a[href*='watch']"
        );

        // If songs found
        if (songs.length > 0) {

            console.log("Song found. Playing now...");

            // Click first result
            await songs[0].click();

            // Wait for player to load
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log(`Now Playing: ${songName}`);

        } else {

            console.log("No songs found.");
        }

    } catch (error) {

        console.log("YouTube Automation Error:");
        console.log(error);

    }
};

export default playYouTubeVideo;
