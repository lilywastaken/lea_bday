/*
============================================================
    LEA BIRTHDAY EXPERIMENT
============================================================

    Each number represents ONE moving object.

    Example:

        1lea.png
        1lea2.png

    These are two frames of the SAME object.

    The object has:

        - one position
        - one velocity
        - constant speed
        - random starting position
        - random movement direction

    The image itself is NEVER rotated.

    Frames switch every 0.4 seconds.


    LOADING:

        The page preloads all images.

        There is NO artificial delay.

        As soon as everything has loaded:

            "Loading!!...." disappears
                    ↓
                PLAY appears

        Pressing PLAY starts:

            - music
            - first image
            - movement
            - object spawning


    TIMELINE AFTER PLAY:

        0s       Object #1
        4s       Object #2
        8s       Object #3
        ...

        30s      background2.jpg

        Final object + 4s:

                 music stops
                 all images disappear
                 error.png fills screen

============================================================
*/


/* =========================================================
   IMAGE FILES
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
    "12copine2.png",

    "13flupke.png"
];


/* =========================================================
   SETTINGS
========================================================= */

const OBJECT_INTERVAL = 4000;


/*
    0.4 seconds between frames.
*/

const FLICKER_INTERVAL = 400;


/*
    Background changes 30 seconds after PLAY.
*/

const BACKGROUND_CHANGE_TIME = 30000;


/*
    Final screen appears 4 seconds after
    the final object appears.
*/

const FINAL_DELAY = 4000;


/*
    Previous speed:

        1.8

    +50%:

        2.7
*/

const SPEED = 2.7;


/* =========================================================
   ELEMENTS
========================================================= */

const imageLayer =
    document.getElementById("image-layer");

const background =
    document.getElementById("background");

const loading =
    document.getElementById("loading");

const playButton =
    document.getElementById("play-button");

const errorScreen =
    document.getElementById("error-screen");

const music =
    document.getElementById("music");


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

let finished = false;

let started = false;


/* =========================================================
   GROUP FILES BY NUMBER
========================================================= */

function createGroups() {

    const groups = new Map();


    for (const filename of IMAGE_FILES) {

        /*
            Extract the number at the beginning.

            1lea.png       -> 1
            1lea2.png      -> 1
            10alexi...     -> 10
        */

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


        if (!groups.has(number)) {

            groups.set(
                number,
                []
            );
        }


        groups
            .get(number)
            .push(filename);
    }


    /*
        Sort frames naturally.

        This produces:

            1lea.png
            1lea2.png

        rather than random ordering.
    */

    imageGroups =
        Array.from(
            groups.entries()
        )
        .map(
            ([number, files]) => ({

                number: number,

                files: files.sort(
                    naturalSort
                )

            })
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

    const promises = IMAGE_FILES.map(filename => {

        return new Promise((resolve, reject) => {

            const image = new Image();

            const path = "./img/" + filename;

            image.onload = () => {

                console.log("Loaded:", path);

                resolve();
            };

            image.onerror = () => {

                console.error(
                    "FAILED TO LOAD:",
                    path
                );

                reject(
                    new Error(
                        "Could not load " + path
                    )
                );
            };

            image.src = path;
        });
    });


    return Promise.all(promises);
}


/* =========================================================
   SHOW PLAY BUTTON
========================================================= */

function showPlayButton() {

    /*
        Loading is finished.

        No artificial timeout.

        Show PLAY immediately.
    */

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

        if (started || finished) {
            return;
        }


        started = true;


        /*
            Hide PLAY.
        */

        playButton.style.display =
            "none";


        /*
            Start everything.
        */

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
        Start music.

        Because this function is called directly from
        the PLAY button click, mobile browsers should
        permit audio playback.
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
        Spawn another object every 4 seconds.
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
        after PLAY was pressed.
    */

    backgroundTimer =
        setTimeout(
            () => {

                changeBackground();

            },
            BACKGROUND_CHANGE_TIME
        );


    /*
        Calculate final object timing.

        With 13 objects:

            #1  = 0s
            #2  = 4s
            #3  = 8s
            ...
            #13 = 48s

        Final screen:

            48 + 4 = 52s
    */

    const finalObjectTime =
        (
            imageGroups.length - 1
        ) *
        OBJECT_INTERVAL;


    finalTimer =
        setTimeout(
            () => {

                finishExperiment();

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


    /*
        This container represents ONE object.

        The image inside it can change frames
        without affecting the position.
    */

    const container =
        document.createElement("div");


    container.className =
        "moving-image";


    /*
        Actual image.
    */

    const image =
        document.createElement("img");


    image.src =
        "img/" +
        encodeURIComponent(
            group.files[0]
        );


    image.alt =
        group.files[0];


    /*
        Explicitly make sure there is no rotation.
    */

    image.style.transform =
        "rotate(0deg)";


    container.appendChild(
        image
    );


    imageLayer.appendChild(
        container
    );


    /*
        Object state.
    */

    const object = {

        container: container,

        image: image,

        /*
            All frames for this number.
        */

        frames: group.files,

        /*
            Current frame.
        */

        frameIndex: 0,

        /*
            Position.
        */

        x: 0,

        y: 0,

        /*
            Velocity.
        */

        velocityX: 0,

        velocityY: 0,

        /*
            Time when the current frame
            was displayed.
        */

        lastFlicker:
            performance.now()
    };


    /*
        Random movement direction.
    */

    setRandomDirection(
        object
    );


    /*
        Random starting position.
    */

    setRandomPosition(
        object
    );


    /*
        Put it on screen.
    */

    applyTransform(
        object
    );


    /*
        Save it.
    */

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

function setRandomDirection(object) {

    const angle =
        Math.random() *
        Math.PI *
        2;


    /*
        SPEED is 2.7.

        Direction is random.

        Speed remains constant.
    */

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

function setRandomPosition(object) {

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

function applyTransform(object) {

    /*
        Only position changes.

        No rotation.
    */

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

    if (finished) {
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
        ====================================================
        FLICKER
        ====================================================
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


        /*
            ONLY change the image source.

            Position is untouched.
        */

        object.image.src =
            "img/" +
            encodeURIComponent(
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
        ====================================================
        MOVEMENT
        ====================================================
    */

    object.x +=
        object.velocityX;

    object.y +=
        object.velocityY;


    /*
        ====================================================
        BOUNDARIES
        ====================================================
    */

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
        ====================================================
        LEFT / RIGHT
        ====================================================
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
        ====================================================
        TOP / BOTTOM
        ====================================================
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

    /*
        Generate random direction.
    */

    const angle =
        Math.random() *
        Math.PI *
        2;


    let vx =
        Math.cos(angle);

    let vy =
        Math.sin(angle);


    /*
        Force direction back into the screen.
    */

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


    /*
        Normalize vector.

        This preserves the exact speed of 2.7.
    */

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
        'url("background2.jpg")';


    console.log(
        "Changed to background2.jpg"
    );
}


/* =========================================================
   FINISH
========================================================= */

function finishExperiment() {

    if (finished) {
        return;
    }


    finished = true;


    console.log(
        "Experiment finished."
    );


    /*
        Stop spawning.
    */

    clearInterval(
        objectTimer
    );


    /*
        Stop timers.
    */

    clearTimeout(
        backgroundTimer
    );

    clearTimeout(
        finalTimer
    );


    /*
        Stop animation.
    */

    if (animationFrame) {

        cancelAnimationFrame(
            animationFrame
        );
    }


    /*
        Stop music completely.
    */

    music.pause();

    music.currentTime = 0;


    /*
        Remove every moving image.
    */

    imageLayer.innerHTML =
        "";


    /*
        Show error.png fullscreen.
    */

    errorScreen.style.display =
        "flex";
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


            /*
                Keep existing objects inside
                the new viewport.
            */

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

    /*
        Loading message is visible immediately.
    */

    loading.textContent =
        "Loading!!....";


    try {

        /*
            Group filenames.
        */

        createGroups();


        /*
            Preload all images.

            There is NO setTimeout here.

            If loading takes 0.5 seconds,
            PLAY appears after 0.5 seconds.

            If it takes 3 seconds,
            PLAY appears after 3 seconds.
        */

        await preloadImages();


        /*
            Everything is ready.
        */

        showPlayButton();

    } catch (error) {

        console.error(
            error
        );


        loading.textContent =
            "Could not load images.";
    }
}


/* =========================================================
   START
========================================================= */

initialize();
