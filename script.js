/*
============================================================
    LEA BIRTHDAY EXPERIMENT
============================================================

    MAIN SEQUENCE

        PLAY
          |
          v
        tunak.mp3
          |
          v
        Objects appear every 4 seconds
          |
          v
        background2.jpg after 30 seconds
          |
          v
        Final object appears
          |
          v
        4 seconds
          |
          v
        tunak.mp3 stops
          |
          v
        finalboss.mp3 starts
          |
          v
        EXACTLY 10 seconds
          |
          v
        DAN BOSS APPEARS
          |
          v
        Click boss
          |
          v
        Damage
          |
          +----> dan1.jpg
          |
          +----> dan2.jpg
          |
          +----> dan3.jpg
          |
          +----> dan4.jpg
          |
          +----> dan5.jpg
          |
          +----> dan6.jpg
          |
          +----> dan7.jpg
          |
          v
        Boss reaches 0 HP
          |
          v
        Defeat animation
          |
          v
        defeated.mp3
          |
          v
        defeated.mp3 finishes
          |
          v
        error.png


============================================================
*/


/* =========================================================
   MOVING OBJECT FILES
========================================================= */

const IMAGE_FILES = [
    "1lea.png",
    "1lea2.png",

    "2arthur.png",
    "2arthur2.png",

    "3savan.png",
    "3savan2.png",

    "4meg.png",

    "5danila.png",
    "5danila2.png",

    "6anton.png",
    "6anton2.png",

    "7lea_pony.png",

    "8donald.png",

    "9art.png",
    "9art2.png",

    "10alexi_pony.png",

    "11chat.png",
    "11chat2.png",

    "12copine.png",
    "12copine2.png"
];



/* =========================================================
   SETTINGS
========================================================= */

const OBJECT_INTERVAL = 4000;

const FLICKER_INTERVAL = 400;

const BACKGROUND_CHANGE_TIME = 30000;

const FINAL_DELAY = 4000;

const SPEED = 2.7;


/* =========================================================
   BOSS SETTINGS
========================================================= */

const BOSS_MAX_HEALTH = 100;

/*
    Every click does 10 damage.
*/

const BOSS_DAMAGE_PER_CLICK = 1;


/*
    Boss image for each health stage.

    100 - 91 -> dan1
    90  - 76 -> dan2
    75  - 61 -> dan3
    60  - 46 -> dan4
    45  - 31 -> dan5
    30  - 16 -> dan6
    15  - 1  -> dan7
*/

const BOSS_IMAGES = [
    "dan1.jpg",
    "dan2.jpg",
    "dan3.jpg",
    "dan4.jpg",
    "dan5.jpg",
    "dan6.jpg",
    "dan7.jpg"
];


/*
    The boss appears exactly 10 seconds
    after finalboss.mp3 starts.
*/

const BOSS_APPEAR_DELAY = 10000;


/* =========================================================
   ELEMENTS
========================================================= */

const imageLayer =
    document.getElementById(
        "image-layer"
    );


const background =
    document.getElementById(
        "background"
    );


const loading =
    document.getElementById(
        "loading"
    );


const playButton =
    document.getElementById(
        "play-button"
    );


const errorScreen =
    document.getElementById(
        "error-screen"
    );


const music =
    document.getElementById(
        "music"
    );


const bossMusic =
    document.getElementById(
        "boss-music"
    );


const hitSound =
    document.getElementById(
        "hit-sound"
    );


const defeatedSound =
    document.getElementById(
        "defeated-sound"
    );


const bossScreen =
    document.getElementById(
        "boss-screen"
    );


const boss =
    document.getElementById(
        "boss"
    );


const bossImage =
    document.getElementById(
        "boss-image"
    );


const bossHealthBar =
    document.getElementById(
        "boss-health-bar"
    );


const bossHealthText =
    document.getElementById(
        "boss-health-text"
    );


/* =========================================================
   STATE
========================================================= */

let imageGroups = [];

let movingObjects = [];

let nextGroupIndex = 0;

let animationFrame = null;

let objectTimer = null;

let backgroundTimer = null;

let finalTimer = null;

let bossAppearTimer = null;

let finished = false;

let started = false;

let bossActive = false;

let bossDefeated = false;

let bossHealth = BOSS_MAX_HEALTH;

let currentBossStage = 0;


/* =========================================================
   IMAGE PATH
========================================================= */

function getImagePath(filename) {

    return "./" + filename;
}


/* =========================================================
   GROUP FILES BY NUMBER
========================================================= */

function createGroups() {

    const groups = new Map();


    for (
        const filename
        of IMAGE_FILES
    ) {

        const match =
            filename.match(/^(\d+)/);


        if (!match) {

            console.warn(
                "Ignoring file:",
                filename
            );

            continue;
        }


        const number =
            parseInt(
                match[1],
                10
            );


        if (
            !groups.has(number)
        ) {

            groups.set(
                number,
                []
            );
        }


        groups
            .get(number)
            .push(filename);
    }


    imageGroups =
        Array.from(
            groups.entries()
        )
        .map(
            ([number, files]) => {

                return {
                    number: number,

                    files: files.sort(
                        naturalSort
                    )
                };

            }
        )
        .sort(
            (a, b) =>
                a.number - b.number
        );


    console.log(
        "Image groups:",
        imageGroups
    );
}


/* =========================================================
   NATURAL SORT
========================================================= */

function naturalSort(a, b) {

    return a.localeCompare(
        b,
        undefined,
        {
            numeric: true,
            sensitivity: "base"
        }
    );
}


/* =========================================================
   PRELOAD IMAGES
========================================================= */

function preloadImages() {

    /*
        Preload normal moving images.
    */

    const normalImages =
        IMAGE_FILES.map(
            filename =>
                getImagePath(filename)
        );


    /*
        Preload boss images too.

        This means there should be no visible
        delay when changing from dan1 -> dan2 etc.
    */

    const bossImages =
        BOSS_IMAGES.map(
            filename =>
                getImagePath(filename)
        );


    const allImages = [
        ...normalImages,
        ...bossImages,

        /*
            error.png is also loaded beforehand.
        */

        "./error.png"
    ];


    const promises =
        allImages.map(
            path => {

                return new Promise(
                    resolve => {

                        const image =
                            new Image();


                        image.onload =
                            () => {

                                console.log(
                                    "Loaded:",
                                    path
                                );

                                resolve({
                                    success: true,
                                    path: path
                                });
                            };


                        image.onerror =
                            () => {

                                console.error(
                                    "FAILED TO LOAD:",
                                    path
                                );

                                resolve({
                                    success: false,
                                    path: path
                                });
                            };


                        image.src = path;
                    }
                );
            }
        );


    return Promise
        .all(promises)
        .then(results => {

            const failed =
                results.filter(
                    result =>
                        !result.success
                );


            const successful =
                results.filter(
                    result =>
                        result.success
                );


            console.log(
                `${successful.length}/${allImages.length} images loaded.`
            );


            if (
                failed.length > 0
            ) {

                const failedFiles =
                    failed
                        .map(
                            result =>
                                result.path
                        )
                        .join(", ");


                throw new Error(
                    "Failed to load: " +
                    failedFiles
                );
            }
        });
}


/* =========================================================
   SHOW PLAY BUTTON
========================================================= */

function showPlayButton() {

    loading.style.display =
        "none";


    playButton.style.display =
        "block";
}


/* =========================================================
   PLAY BUTTON
========================================================= */

playButton.addEventListener(
    "click",
    () => {

        if (
            started ||
            finished
        ) {
            return;
        }


        started = true;


        playButton.style.display =
            "none";


        startExperiment();
    }
);


/* =========================================================
   START EXPERIMENT
========================================================= */

function startExperiment() {

    if (finished) {
        return;
    }


    /*
        Start main music.

        This happens directly from the PLAY click,
        allowing mobile browsers to permit playback.
    */

    music.currentTime = 0;


    music.play()
        .then(() => {

            console.log(
                "Music started."
            );

        })
        .catch(error => {

            console.warn(
                "Music could not start:",
                error
            );
        });


    /*
        Start movement.
    */

    animationFrame =
        requestAnimationFrame(
            animate
        );


    /*
        First object immediately.
    */

    addNextObject();


    /*
        More objects every 4 seconds.
    */

    objectTimer =
        setInterval(
            () => {

                addNextObject();

            },
            OBJECT_INTERVAL
        );


    /*
        Background changes 30 seconds
        after PLAY.
    */

    backgroundTimer =
        setTimeout(
            () => {

                changeBackground();

            },
            BACKGROUND_CHANGE_TIME
        );


    /*
        Final object appears at:

            (13 - 1) * 4
            = 48 seconds

        Boss sequence begins:

            48 + 4
            = 52 seconds
    */

    const finalObjectTime =
        (
            imageGroups.length - 1
        ) *
        OBJECT_INTERVAL;


    finalTimer =
        setTimeout(
            () => {

                beginBossSequence();

            },
            finalObjectTime + FINAL_DELAY
        );
}


/* =========================================================
   ADD NEXT OBJECT
========================================================= */

function addNextObject() {

    if (finished) {
        return;
    }


    if (
        nextGroupIndex >=
        imageGroups.length
    ) {

        return;
    }


    const group =
        imageGroups[
            nextGroupIndex
        ];


    nextGroupIndex++;


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "moving-image";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        getImagePath(
            group.files[0]
        );


    image.alt =
        group.files[0];


    image.style.transform =
        "rotate(0deg)";


    container.appendChild(
        image
    );


    imageLayer.appendChild(
        container
    );


    const object = {

        container: container,

        image: image,

        frames: group.files,

        frameIndex: 0,

        x: 0,

        y: 0,

        velocityX: 0,

        velocityY: 0,

        lastFlicker:
            performance.now()
    };


    setRandomDirection(
        object
    );


    setRandomPosition(
        object
    );


    applyTransform(
        object
    );


    movingObjects.push(
        object
    );


    console.log(
        `Object #${group.number}:`,
        group.files
    );
}


/* =========================================================
   RANDOM DIRECTION
========================================================= */

function setRandomDirection(
    object
) {

    const angle =
        Math.random() *
        Math.PI *
        2;


    object.velocityX =
        Math.cos(angle) *
        SPEED;


    object.velocityY =
        Math.sin(angle) *
        SPEED;
}


/* =========================================================
   RANDOM INITIAL POSITION
========================================================= */

function setRandomPosition(
    object
) {

    const width =
        object.container.offsetWidth;


    const height =
        object.container.offsetHeight;


    const maxX =
        Math.max(
            0,
            window.innerWidth - width
        );


    const maxY =
        Math.max(
            0,
            window.innerHeight - height
        );


    object.x =
        Math.random() * maxX;


    object.y =
        Math.random() * maxY;
}


/* =========================================================
   APPLY POSITION
========================================================= */

function applyTransform(
    object
) {

    object.container.style.transform =
        `translate3d(
            ${object.x}px,
            ${object.y}px,
            0
        )`;
}


/* =========================================================
   ANIMATION LOOP
========================================================= */

function animate(timestamp) {

    if (
        finished ||
        bossActive
    ) {

        return;
    }


    for (
        const object
        of movingObjects
    ) {

        moveObject(
            object,
            timestamp
        );
    }


    animationFrame =
        requestAnimationFrame(
            animate
        );
}


/* =========================================================
   MOVE + FLICKER
========================================================= */

function moveObject(
    object,
    timestamp
) {

    /*
        Frame switching.
    */

    if (
        object.frames.length > 1 &&
        timestamp -
            object.lastFlicker >=
            FLICKER_INTERVAL
    ) {

        object.frameIndex =
            (
                object.frameIndex + 1
            ) %
            object.frames.length;


        object.image.src =
            getImagePath(
                object.frames[
                    object.frameIndex
                ]
            );


        object.image.alt =
            object.frames[
                object.frameIndex
            ];


        object.lastFlicker =
            timestamp;
    }


    /*
        Movement.
    */

    object.x +=
        object.velocityX;


    object.y +=
        object.velocityY;


    const width =
        object.container.offsetWidth;


    const height =
        object.container.offsetHeight;


    const maxX =
        Math.max(
            0,
            window.innerWidth - width
        );


    const maxY =
        Math.max(
            0,
            window.innerHeight - height
        );


    /*
        Horizontal collision.
    */

    if (
        object.x <= 0 ||
        object.x >= maxX
    ) {

        object.x =
            Math.max(
                0,
                Math.min(
                    object.x,
                    maxX
                )
            );


        chooseDirectionFromEdge(
            object,
            "horizontal"
        );
    }


    /*
        Vertical collision.
    */

    if (
        object.y <= 0 ||
        object.y >= maxY
    ) {

        object.y =
            Math.max(
                0,
                Math.min(
                    object.y,
                    maxY
                )
            );


        chooseDirectionFromEdge(
            object,
            "vertical"
        );
    }


    applyTransform(
        object
    );
}


/* =========================================================
   RANDOM NEW DIRECTION AFTER COLLISION
========================================================= */

function chooseDirectionFromEdge(
    object,
    edge
) {

    const angle =
        Math.random() *
        Math.PI *
        2;


    let vx =
        Math.cos(angle);


    let vy =
        Math.sin(angle);


    if (
        edge === "horizontal"
    ) {

        if (
            object.x <= 0
        ) {

            vx =
                Math.abs(vx);

        } else {

            vx =
                -Math.abs(vx);
        }
    }


    if (
        edge === "vertical"
    ) {

        if (
            object.y <= 0
        ) {

            vy =
                Math.abs(vy);

        } else {

            vy =
                -Math.abs(vy);
        }
    }


    const magnitude =
        Math.sqrt(
            vx * vx +
            vy * vy
        );


    if (
        magnitude === 0
    ) {

        setRandomDirection(
            object
        );

        return;
    }


    object.velocityX =
        (
            vx / magnitude
        ) *
        SPEED;


    object.velocityY =
        (
            vy / magnitude
        ) *
        SPEED;
}


/* =========================================================
   BACKGROUND CHANGE
========================================================= */

function changeBackground() {

    if (finished) {
        return;
    }


    background.style.backgroundImage =
        'url("./background2.jpg")';


    console.log(
        "Changed to background2.jpg"
    );
}


/* =========================================================
   BEGIN BOSS SEQUENCE
========================================================= */

function beginBossSequence() {
    // Stop normal music
    music.pause();
    music.currentTime = 0;

    // Remove normal moving images
    imageLayer.innerHTML = "";

    // Change background to arena
    background.style.backgroundImage = 'url("./arena.jpg")';

    // Get red overlay
    const arenaOverlay =
        document.getElementById("arena-red-overlay");

    // Make sure the overlay starts transparent
    arenaOverlay.style.transition = "none";
    arenaOverlay.style.opacity = "0";

    // Force browser to apply opacity 0 first
    void arenaOverlay.offsetWidth;

    // Restore 10-second transition
    arenaOverlay.style.transition =
        "opacity 10s linear";

    // Start final boss music
    bossMusic.currentTime = 0;
    bossMusic.play().catch(() => {});

    // Gradually turn arena red
    arenaOverlay.style.opacity = "0.65";

    // Show boss after exactly 10 seconds
    setTimeout(() => {
        showBoss();
    }, 10000);
}

/* =========================================================
   SHOW BOSS
========================================================= */

function showBoss() {

    if (
        finished ||
        bossDefeated
    ) {

        return;
    }


    bossActive = true;


    bossHealth =
        BOSS_MAX_HEALTH;


    currentBossStage = 0;


    bossImage.src =
        getImagePath(
            BOSS_IMAGES[0]
        );


    bossHealthBar.style.width =
        "100%";


    bossHealthText.textContent =
        `${bossHealth} / ${BOSS_MAX_HEALTH}`;


    boss.classList.remove(
        "boss-defeating"
    );


    bossScreen.style.display =
        "flex";


    console.log(
        "Boss appeared."
    );
}


/* =========================================================
   BOSS CLICK
========================================================= */

boss.addEventListener(
    "click",
    () => {

        if (
            !bossActive ||
            bossDefeated
        ) {

            return;
        }


        damageBoss();
    }
);


/* =========================================================
   DAMAGE BOSS
========================================================= */

function damageBoss() {

    /*
        Deal damage.
    */

    bossHealth =
        Math.max(
            0,
            bossHealth -
                BOSS_DAMAGE_PER_CLICK
        );


    console.log(
        "Boss hit.",
        "HP:",
        bossHealth
    );


    /*
        Update life bar.
    */

    const healthPercent =
        (
            bossHealth /
            BOSS_MAX_HEALTH
        ) *
        100;


    bossHealthBar.style.width =
        `${healthPercent}%`;


    bossHealthText.textContent =
        `${bossHealth} / ${BOSS_MAX_HEALTH}`;


    /*
        Play nyet.mp3 on every hit.

        Reset first so repeated clicks
        always trigger the sound.
    */

    hitSound.pause();

    hitSound.currentTime = 0;


    hitSound.play()
        .catch(error => {

            console.warn(
                "nyet.mp3 could not play:",
                error
            );
        });


    /*
        Brief hit animation.
    */

    boss.classList.remove(
        "boss-hit"
    );


    /*
        Force the animation to restart.
    */

    void boss.offsetWidth;


    boss.classList.add(
        "boss-hit"
    );


    /*
        Check whether the boss has been defeated.
    */

    if (
        bossHealth <= 0
    ) {

        defeatBoss();

        return;
    }


    /*
        Determine which image should
        now be displayed.
    */

    updateBossImage();
}


/* =========================================================
   UPDATE BOSS IMAGE
========================================================= */

function updateBossImage() {

    let newStage;


    if (
        bossHealth >= 91
    ) {

        newStage = 0;

    } else if (
        bossHealth >= 76
    ) {

        newStage = 1;

    } else if (
        bossHealth >= 61
    ) {

        newStage = 2;

    } else if (
        bossHealth >= 46
    ) {

        newStage = 3;

    } else if (
        bossHealth >= 31
    ) {

        newStage = 4;

    } else if (
        bossHealth >= 16
    ) {

        newStage = 5;

    } else {

        newStage = 6;
    }


    /*
        Only change the image if
        the stage actually changed.
    */

    if (
        newStage ===
        currentBossStage
    ) {

        return;
    }


    currentBossStage =
        newStage;


    bossImage.src =
        getImagePath(
            BOSS_IMAGES[
                currentBossStage
            ]
        );


    /*
        The nyet sound has already been
        played by damageBoss().

        Therefore every image transition
        gets exactly one nyet sound.
    */

    console.log(
        "Boss changed to:",
        BOSS_IMAGES[
            currentBossStage
        ]
    );
}


/* =========================================================
   DEFEAT BOSS
========================================================= */

function defeatBoss() {

    if (
        bossDefeated
    ) {

        return;
    }


    bossDefeated = true;

    bossActive = false;


    console.log(
        "Boss defeated."
    );


    /*
        Stop accepting clicks.
    */

    boss.style.pointerEvents =
        "none";


    /*
        Stop final boss music.
    */

    bossMusic.pause();

    bossMusic.currentTime = 0;


    /*
        Play defeat animation.
    */

    boss.classList.remove(
        "boss-hit"
    );


    void boss.offsetWidth;


    boss.classList.add(
        "boss-defeating"
    );


    /*
        Wait for the defeat animation
        to finish before playing defeated.mp3.

        CSS animation = 1.2 seconds.
    */

    setTimeout(
        () => {

            bossScreen.style.display =
                "none";


            playDefeatedSound();

        },
        1200
    );
}


/* =========================================================
   PLAY DEFEATED SOUND
========================================================= */

function playDefeatedSound() {

    console.log(
        "Playing defeated.mp3."
    );


    defeatedSound.currentTime = 0;


    /*
        When defeated.mp3 ends,
        show error.png.
    */

    defeatedSound.onended =
        () => {

            showErrorScreen();
        };


    defeatedSound.play()
        .catch(error => {

            console.warn(
                "defeated.mp3 could not play:",
                error
            );


            /*
                If the browser refuses the sound,
                do not leave the experiment stuck.
            */

            showErrorScreen();
        });
}


/* =========================================================
   SHOW ERROR SCREEN
========================================================= */

function showErrorScreen() {

    if (finished) {
        return;
    }


    finished = true;


    bossActive = false;


    /*
        Stop everything else.
    */

    clearInterval(
        objectTimer
    );


    clearTimeout(
        backgroundTimer
    );


    clearTimeout(
        finalTimer
    );


    clearTimeout(
        bossAppearTimer
    );


    if (animationFrame) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;
    }


    /*
        Stop all audio except
        defeated.mp3, which has already ended.
    */

    music.pause();

    music.currentTime = 0;


    bossMusic.pause();

    bossMusic.currentTime = 0;


    /*
        Remove moving objects.
    */

    imageLayer.innerHTML = "";


    /*
        Hide boss.
    */

    bossScreen.style.display =
        "none";


    /*
        Finally show error.png.
    */

    errorScreen.style.display =
        "flex";


    console.log(
        "Final error screen displayed."
    );
}


/* =========================================================
   RESIZE / PHONE ROTATION
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (finished) {
            return;
        }


        for (
            const object
            of movingObjects
        ) {

            const width =
                object.container.offsetWidth;


            const height =
                object.container.offsetHeight;


            const maxX =
                Math.max(
                    0,
                    window.innerWidth - width
                );


            const maxY =
                Math.max(
                    0,
                    window.innerHeight - height
                );


            object.x =
                Math.min(
                    object.x,
                    maxX
                );


            object.y =
                Math.min(
                    object.y,
                    maxY
                );


            applyTransform(
                object
            );
        }
    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

async function initialize() {

    loading.textContent =
        "Loading!!....";


    try {

        createGroups();


        /*
            Preload:

                - normal images
                - dan1.jpg -> dan7.jpg
                - error.png

            No artificial loading delay.
        */

        await preloadImages();


        showPlayButton();

    } catch (error) {

        console.error(
            error
        );


        loading.textContent =
            error.message ||
            "Could not load images.";
    }
}


/* =========================================================
   START
========================================================= */

initialize();