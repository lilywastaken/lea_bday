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

        All images are preloaded before PLAY appears.

        There is NO artificial delay.

        If an image fails to load, the exact filename
        is shown in the loading message.


    AFTER PLAY:

        0s       Object #1
        4s       Object #2
        8s       Object #3
        ...

        30s      background2.jpg

        Final object + 4s:

                 music stops
                 all moving images disappear
                 error.png fills the screen

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

const FLICKER_INTERVAL = 400;

const BACKGROUND_CHANGE_TIME = 30000;

const FINAL_DELAY = 4000;

/*
    Movement speed.

    Previous:
        1.8

    Current:
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
   IMAGE PATH
========================================================= */

/*
    IMPORTANT FOR GITHUB PAGES

    Do NOT use:

        encodeURIComponent(filename)

    because filenames such as:

        1lea.png

    do not need encoding.

    Using ./img/ keeps the path relative to the
    GitHub Pages project.

    Example:

        ./img/1lea.png
*/

function getImagePath(filename) {
    return "./" + filename;
}


/* =========================================================
   GROUP FILES BY NUMBER
========================================================= */

function createGroups() {

    const groups = new Map();

    for (const filename of IMAGE_FILES) {

        /*
            Extract the number at the beginning.

            1lea.png
                -> 1

            1lea2.png
                -> 1

            10alexi_pony.png
                -> 10
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

        Example:

            1lea.png
            1lea2.png
    */

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

    const promises =
        IMAGE_FILES.map(
            filename => {

                return new Promise(
                    resolve => {

                        const image =
                            new Image();

                        const path =
                            getImagePath(
                                filename
                            );


                        image.onload =
                            () => {

                                console.log(
                                    "Loaded:",
                                    path
                                );

                                resolve({
                                    success: true,
                                    filename: filename
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
                                    filename: filename
                                });
                            };


                        /*
                            IMPORTANT:

                            Use the simple relative
                            GitHub Pages path.

                            No encodeURIComponent().
                        */

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
                `${successful.length}/${IMAGE_FILES.length} images loaded.`
            );


            /*
                If even one image is missing,
                stop loading and tell us exactly
                which file is the problem.
            */

            if (failed.length > 0) {

                const failedFiles =
                    failed
                        .map(
                            result =>
                                result.filename
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
        Start music directly from the
        PLAY button interaction.

        This is important for mobile browsers.
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
        Start animation.
    */

    animationFrame =
        requestAnimationFrame(
            animate
        );


    /*
        First object appears immediately.
    */

    addNextObject();


    /*
        Add another object every 4 seconds.
    */

    objectTimer =
        setInterval(
            () => {

                addNextObject();

            },
            OBJECT_INTERVAL
        );


    /*
        Change background 30 seconds
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
        One container = one moving object.

        The image inside can change frames
        without changing the object's position.
    */

    const container =
        document.createElement("div");

    container.className =
        "moving-image";


    const image =
        document.createElement("img");


    /*
        FIRST FRAME

        Use the relative GitHub Pages path.
    */

    image.src =
        getImagePath(
            group.files[0]
        );


    image.alt =
        group.files[0];


    /*
        Never rotate the image.
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

        frames: group.files,

        frameIndex: 0,

        x: 0,

        y: 0,

        velocityX: 0,

        velocityY: 0,

        lastFlicker:
            performance.now()
    };


    /*
        Random initial direction.
    */

    setRandomDirection(
        object
    );


    /*
        Random initial position.
    */

    setRandomPosition(
        object
    );


    /*
        Apply initial position.
    */

    applyTransform(
        object
    );


    /*
        Keep object alive.
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
        Position only.

        Never rotate the object.
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
        FRAME SWITCHING

        Every 0.4 seconds.

        Only the image changes.

        The object position does NOT change.
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
        MOVEMENT
    */

    object.x +=
        object.velocityX;

    object.y +=
        object.velocityY;


    /*
        BOUNDARIES
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
        LEFT / RIGHT COLLISION
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
        TOP / BOTTOM COLLISION
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
        Pick a completely new random angle.
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
        Force the new direction back
        into the viewport.
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
        Normalize the vector so the
        movement speed remains exactly SPEED.
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
        'url("./background2.jpg")';


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

    imageLayer.innerHTML = "";


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
                Keep existing objects
                inside the new viewport.
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
        Loading message appears immediately.
    */

    loading.textContent =
        "Loading!!....";


    try {

        /*
            Build image groups.
        */

        createGroups();


        /*
            Preload every image.

            There is NO artificial delay.

            Loading lasts only as long as
            the images actually need.
        */

        await preloadImages();


        /*
            Everything loaded successfully.
        */

        showPlayButton();

    } catch (error) {

        console.error(
            error
        );


        /*
            Show the exact problem on screen.

            This is particularly useful for
            diagnosing GitHub Pages paths.
        */

        loading.textContent =
            error.message ||
            "Could not load images.";
    }
}


/* =========================================================
   START
========================================================= */

initialize();