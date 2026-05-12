import puppeteer from "puppeteer";

const skipAds = async (page) => {

    const interval = setInterval(async () => {

        try {

            if (page.isClosed()) {
                clearInterval(interval);
                return;
            }

            const skipButton = await page.$(
                ".ytp-ad-skip-button, .ytp-skip-ad-button"
            );

            if (skipButton) {

                console.log("Ad skipped");

                await skipButton.click().catch(() => {});
            }

            const adShowing = await page.$(".ad-showing");

            if (adShowing) {

                console.log("Skipping video ad");

                await page.evaluate(() => {

                    const video = document.querySelector("video");

                    if (video) {
                        video.currentTime = video.duration;
                    }

                }).catch(() => {});
            }

        } catch (error) {

            console.log("Retrying ad skip...");
        }

    }, 2000);
};

const playMusic = async (songName) => {

    try {

        const browser = await puppeteer.launch({
            headless: false,

            defaultViewport: null,

            args: [
                "--start-maximized",
                "--autoplay-policy=no-user-gesture-required"
            ]
        });

        const page = await browser.newPage();

        const query = `${songName} official audio`;

        await page.goto(
            `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
            {
                waitUntil: "networkidle2"
            }
        );

        console.log(`Searching for ${songName}`);

        await page.waitForSelector(
            "ytmusic-responsive-list-item-renderer a[href*='watch']",
            {
                timeout: 30000
            }
        );

        const songs = await page.$$(
            "ytmusic-responsive-list-item-renderer a[href*='watch']"
        );

        if (songs.length > 0) {

            await songs[0].click();

            console.log("Playing song...");

            await new Promise(resolve => setTimeout(resolve, 5000));

            await skipAds(page);

        } else {

            console.log("No songs found");
        }

    } catch (error) {

        console.log("YouTube Error:", error);
    }
};

export default playMusic;