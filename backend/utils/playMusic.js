import puppeteer from "puppeteer";

const playMusic = async (songName) => {

    try {

        const browser =
            await puppeteer.launch({

                headless: false,

                executablePath:
                "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

                defaultViewport: null,

                args: [

                    "--start-maximized",

                    "--disable-notifications",

                    "--autoplay-policy=no-user-gesture-required"
                ]
            });

        const page =
            await browser.newPage();



        // =====================================
        // BLOCK ADS REQUESTS
        // =====================================

        await page.setRequestInterception(true);

        page.on("request", (req) => {

            const url = req.url();

            if (

                url.includes("doubleclick.net") ||

                url.includes("googlesyndication") ||

                url.includes("googleads") ||

                url.includes("adservice")

            ) {

                req.abort();

            } else {

                req.continue();
            }
        });



        // =====================================
        // OPEN YOUTUBE MUSIC
        // =====================================

        await page.goto(

            `https://music.youtube.com/search?q=${encodeURIComponent(songName)}`,

            {
                waitUntil: "networkidle2",
                timeout: 0
            }
        );



        // =====================================
        // WAIT FOR SONGS
        // =====================================

        await page.waitForSelector(

            "ytmusic-responsive-list-item-renderer",

            {
                timeout: 15000
            }
        );



        // =====================================
        // SMALL WAIT
        // =====================================

        await new Promise(resolve =>
            setTimeout(resolve, 3000)
        );



        // =====================================
        // CLICK FIRST SONG
        // =====================================

        await page.evaluate(() => {

            const firstSong =
                document.querySelector(

                    "ytmusic-responsive-list-item-renderer a"
                );

            if (firstSong) {

                firstSong.click();
            }
        });



        console.log(
            "Playing Music..."
        );



        // =====================================
        // WAIT PLAYER
        // =====================================

        await new Promise(resolve =>
            setTimeout(resolve, 5000)
        );



        // =====================================
        // FORCE PLAY
        // =====================================

        await page.evaluate(() => {

            const video =
                document.querySelector("video");

            if (video) {

                video.play();
            }
        });



        // =====================================
        // AUTO SKIP ADS
        // =====================================

        setInterval(async () => {

            try {

                // SKIP BUTTON

                const skipButton =
                    await page.$(

                        ".ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-skip-button"
                    );

                if (skipButton) {

                    await skipButton.click();

                    console.log(
                        "Ad skipped"
                    );
                }



                // CLOSE OVERLAY ADS

                const overlay =
                    await page.$(

                        ".ytp-ad-overlay-close-button"
                    );

                if (overlay) {

                    await overlay.click();

                    console.log(
                        "Overlay closed"
                    );
                }



                // FAST FORWARD ADS

                const adShowing =
                    await page.evaluate(() => {

                        return document.querySelector(
                            ".ad-showing"
                        ) !== null;
                    });

                if (adShowing) {

                    await page.evaluate(() => {

                        const video =
                            document.querySelector(
                                "video"
                            );

                        if (video) {

                            video.playbackRate = 16;
                        }
                    });

                } else {

                    await page.evaluate(() => {

                        const video =
                            document.querySelector(
                                "video"
                            );

                        if (video) {

                            video.playbackRate = 1;
                        }
                    });
                }

            } catch (error) {

                console.log(
                    "Ad skip error:",
                    error.message
                );
            }

        }, 1500);



    } catch (error) {

        console.log(
            "Play Music Error:",
            error.message
        );
    }
};

export default playMusic;
