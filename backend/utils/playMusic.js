import puppeteer from "puppeteer";

let musicBrowser = null;
let musicPage = null;
const pagesWithAdSkipper = new WeakSet();

const runOnPlayer = async (script) => {

    if (!musicPage || musicPage.isClosed()) {
        return false;
    }

    await musicPage.evaluate(script).catch(() => {});

    return true;
};

const skipAds = async (page) => {

    if (pagesWithAdSkipper.has(page)) return;

    pagesWithAdSkipper.add(page);

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

const getMusicPage = async () => {

    if (
        musicBrowser &&
        musicBrowser.isConnected() &&
        musicPage &&
        !musicPage.isClosed()
    ) {

        return musicPage;
    }

    musicBrowser = await puppeteer.launch({
        headless: false,

        defaultViewport: null,

        args: [
            "--start-maximized",
            "--autoplay-policy=no-user-gesture-required"
        ]
    });

    musicBrowser.on("disconnected", () => {
        musicBrowser = null;
        musicPage = null;
    });

    const pages = await musicBrowser.pages();

    musicPage = pages[0] || await musicBrowser.newPage();

    return musicPage;
};

const playMusic = async (songName) => {

    try {

        const page = await getMusicPage();

        const query = `${songName} official audio`;

        await page.bringToFront();

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

export const stopMusic = async () => {

    return runOnPlayer(() => {
        const video = document.querySelector("video");

        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    });
};

export const pauseMusic = async () => {

    return runOnPlayer(() => {
        document.querySelector("video")?.pause();
    });
};

export const resumeMusic = async () => {

    return runOnPlayer(() => {
        document.querySelector("video")?.play()?.catch(() => {});
    });
};

export const nextMusic = async () => {

    return runOnPlayer(() => {
        const selectors = [
            "ytmusic-player-bar .next-button",
            "tp-yt-paper-icon-button.next-button",
            "button[aria-label='Next']",
            "button[title='Next']"
        ];

        const nextButton = selectors
            .map((selector) => document.querySelector(selector))
            .find(Boolean);

        if (nextButton) {
            nextButton.click();
            return;
        }

        const video = document.querySelector("video");

        if (video) {
            video.currentTime = video.duration || video.currentTime;
        }
    });
};

export default playMusic;
