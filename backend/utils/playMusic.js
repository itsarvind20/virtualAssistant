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

const clickFirstMusicResult = async (page) => {

    const clickedTopResult = await page.evaluate(() => {
        const isVisible = (element) => {
            const box = element?.getBoundingClientRect();

            return Boolean(box && box.width > 0 && box.height > 0);
        };

        const clickFirstVisible = (selectors) => {
            for (const selector of selectors) {
                const element = Array.from(document.querySelectorAll(selector))
                    .find(isVisible);

                if (element) {
                    element.click();
                    return true;
                }
            }

            return false;
        };

        const topResult = document.querySelector("ytmusic-card-shelf-renderer");

        if (!topResult) return false;

        return clickFirstVisible([
            "ytmusic-card-shelf-renderer ytmusic-play-button-renderer",
            "ytmusic-card-shelf-renderer button[aria-label*='Play' i]",
            "ytmusic-card-shelf-renderer a[href*='watch']"
        ]);
    });

    if (clickedTopResult) return true;

    const firstSongLink = await page.$(
        "ytmusic-responsive-list-item-renderer a[href*='watch']"
    );

    if (!firstSongLink) return false;

    await firstSongLink.click();
    return true;
};

const playMusic = async (songName) => {

    try {

        const page = await getMusicPage();

        const query = songName;

        await page.bringToFront();

        await page.goto(
            `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
            {
                waitUntil: "networkidle2"
            }
        );

        console.log(`Searching for ${songName}`);

        await page.waitForSelector(
            "ytmusic-card-shelf-renderer, ytmusic-responsive-list-item-renderer a[href*='watch']",
            {
                timeout: 30000
            }
        );

        const didClickResult = await clickFirstMusicResult(page);

        if (didClickResult) {

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
