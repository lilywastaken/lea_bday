/*
============================================================
    LEA EXPERIMENT
============================================================

    Images are automatically loaded from images.json.

    images.json is generated automatically by GitHub
    Actions whenever files in the repository change.

    Every image:

        - appears simultaneously
        - starts at a random location
        - has the same maximum dimensions
        - preserves its aspect ratio
        - moves independently
        - bounces off the screen edges
        - gets a new random direction after collisions

============================================================
*/


/* =========================================================
   SETTINGS
========================================================= */

const BACKGROUND_CHANGE_TIME = 30000;

/*
    Four seconds after ALL images have appeared,
    the final screen is shown.
*/

const FINAL_DELAY = 4000;


/* =========================================================
   ELEMENTS
========================================================= */

const imageLayer =
    document.getElementById("image-layer");

const background =
    document.getElementById("background");

const loading =
    document.getElementById("loading");

const errorScreen =
    document.getElementById("error-screen");

const music =
    document.getElementById("music");


/* =========================================================
   STATE
========================================================= */

let movingImages = [];

let finished = false;

let animationFrame = null;

let backgroundTimer = null;

let finalTimer = null;


/* =========================================================
   SPEED
========================================================= */

const MIN_SPEED = 0.7;
const MAX_SPEED = 2.2;


/* =========================================================
   RANDOM SPEED
========================================================= */

function randomSpeed() {

    const speed =
        MIN_SPEED +
        Math.random() *
        (MAX_SPEED - MIN_SPEED);

    return Math.random() < 0.5
        ? speed
        : -speed;
}


/* =========================================================
   LOAD IMAGES.JSON
========================================================= */

async function loadImages() {

    try {

        /*
            Cache busting is useful on GitHub Pages.

            It prevents the browser from keeping an
            outdated images.json in cache.
        */

        const response =
            await fetch(
                "images.json?v=" + Date.now(),
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `images.json returned HTTP ${response.status}`
            );
        }


        const images =
            await response.json();


        if (!Array.isArray(images)) {

            throw new Error(
                "images.json is not an array."
            );
        }


        if (images.length === 0) {

            throw new Error(
                "images.json contains no images."
            );
        }


        console.log(
            "Images discovered:",
            images
        );


        /*
            Create every image simultaneously.
        */

        await createAllImages(images);


    } catch (error) {

        console.error(
            "Image loading failed:",
            error
        );


        loading.textContent =
            "Could not load images.";

    }
}


/* =========================================================
   CREATE ALL IMAGES
========================================================= */

async function createAllImages(images) {

    /*
        Wait for every image to preload.

        This prevents the animation from starting while
        some images are still loading.
    */

    const loadedImages =
        await Promise.all(
            images.map(
                preloadImage
            )
        );


    /*
        Remove images that failed to load.
    */

    const validImages =
        loadedImages.filter(Boolean);


    if (validImages.length === 0) {

        throw new Error(
            "None of the images could be loaded."
        );
    }


    /*
        Create one DOM element for every image.
    */

    for (const imageData of validImages) {

        createMovingImage(imageData);
    }


    loading.style.display =
        "none";


    /*
        Start everything.
    */

    startExperiment();
}


/* =========================================================
   PRELOAD IMAGE
========================================================= */

function preloadImage(imageData) {

    return new Promise(resolve => {

        const image =
            new Image();


        image.onload = () => {

            resolve(imageData);
        };


        image.onerror = () => {

            console.error(
                "Could not load:",
                imageData.path
            );

            resolve(null);
        };


        image.src =
            encodeURI(imageData.path);
    });
}


/* =========================================================
   CREATE MOVING IMAGE
========================================================= */

function createMovingImage(imageData) {

    const element =
        document.createElement("img");


    element.className =
        "moving-image";


    element.src =
        encodeURI(imageData.path);


    element.alt =
        imageData.name;


    /*
        Store movement state directly on the object.
    */

    const movingImage = {

        element: element,

        x: 0,

        y: 0,

        velocityX: randomSpeed(),

        velocityY: randomSpeed(),

        /*
            Random initial rotation.

            This is purely visual.
        */

        rotation:
            Math.random() * 360,

        rotationSpeed:
            (Math.random() - 0.5) * 1.2
    };


    /*
        Add image to the page.
    */

    imageLayer.appendChild(element);


    /*
        The browser needs to know the image dimensions
        before we can calculate its legal movement area.
    */

    requestAnimationFrame(() => {

        if (finished) {
            return;
        }


        positionRandomly(
            movingImage
        );


        /*
            Fade it in.
        */

        element.style.opacity =
            "1";
    });


    movingImages.push(
        movingImage
    );
}


/* =========================================================
   RANDOM INITIAL POSITION
========================================================= */

function positionRandomly(movingImage) {

    const element =
        movingImage.element;


    const maxX =
        Math.max(
            0,
            window.innerWidth -
            element.offsetWidth
        );


    const maxY =
        Math.max(
            0,
            window.innerHeight -
            element.offsetHeight
        );


    movingImage.x =
        Math.random() * maxX;


    movingImage.y =
        Math.random() * maxY;


    applyTransform(
        movingImage
    );
}


/* =========================================================
   APPLY TRANSFORM
========================================================= */

function applyTransform(movingImage) {

    movingImage.element.style.transform =
        `translate3d(
            ${movingImage.x}px,
            ${movingImage.y}px,
            0
        )
        rotate(${movingImage.rotation}deg)`;
}


/* =========================================================
   START
========================================================= */

function startExperiment() {

    if (finished) {
        return;
    }


    /*
        Try to start music immediately.
    */

    tryStartMusic();


    /*
        Begin animation.
    */

    animationFrame =
        requestAnimationFrame(
            animate
        );


    /*
        Change background after 30 seconds.
    */

    backgroundTimer =
        setTimeout(() => {

            background.style.backgroundImage =
                'url("background2.jpg")';

        }, BACKGROUND_CHANGE_TIME);


    /*
        All images appeared simultaneously.

        Wait 4 seconds after that.
    */

    finalTimer =
        setTimeout(() => {

            showFinalScreen();

        }, FINAL_DELAY);
}


/* =========================================================
   MUSIC
========================================================= */

function tryStartMusic() {

    music.play()
        .then(() => {

            console.log(
                "Music started automatically."
            );

        })
        .catch(() => {

            /*
                Audible autoplay may be blocked by
                mobile browsers.

                The first interaction starts it.
            */

            console.log(
                "Autoplay blocked."
            );


            const unlockMusic = () => {

                music.play().catch(() => {});

            };


            document.addEventListener(
                "pointerdown",
                unlockMusic,
                {
                    once: true
                }
            );


            document.addEventListener(
                "keydown",
                unlockMusic,
                {
                    once: true
                }
            );
        });
}


/* =========================================================
   ANIMATION
========================================================= */

function animate() {

    if (finished) {
        return;
    }


    for (const movingImage of movingImages) {

        moveSingleImage(
            movingImage
        );
    }


    animationFrame =
        requestAnimationFrame(
            animate
        );
}


/* =========================================================
   MOVE ONE IMAGE
========================================================= */

function moveSingleImage(movingImage) {

    const element =
        movingImage.element;


    /*
        Move.
    */

    movingImage.x +=
        movingImage.velocityX;


    movingImage.y +=
        movingImage.velocityY;


    /*
        Slowly rotate.

        Each image rotates independently.
    */

    movingImage.rotation +=
        movingImage.rotationSpeed;


    /*
        Calculate screen boundaries.
    */

    const maxX =
        Math.max(
            0,
            window.innerWidth -
            element.offsetWidth
        );


    const maxY =
        Math.max(
            0,
            window.innerHeight -
            element.offsetHeight
        );


    /*
        LEFT
    */

    if (movingImage.x <= 0) {

        movingImage.x = 0;

        movingImage.velocityX =
            Math.abs(
                randomSpeed()
            );
    }


    /*
        RIGHT
    */

    else if (movingImage.x >= maxX) {

        movingImage.x = maxX;

        movingImage.velocityX =
            -Math.abs(
                randomSpeed()
            );
    }


    /*
        TOP
    */

    if (movingImage.y <= 0) {

        movingImage.y = 0;

        movingImage.velocityY =
            Math.abs(
                randomSpeed()
            );
    }


    /*
        BOTTOM
    */

    else if (movingImage.y >= maxY) {

        movingImage.y = maxY;

        movingImage.velocityY =
            -Math.abs(
                randomSpeed()
            );
    }


    applyTransform(
        movingImage
    );
}


/* =========================================================
   FINAL SCREEN
========================================================= */

function showFinalScreen() {

    if (finished) {
        return;
    }


    finished = true;


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
        Stop music immediately.
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
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (finished) {
            return;
        }


        /*
            Make sure existing images remain inside
            the screen after rotating/resizing a phone.
        */

        for (const movingImage of movingImages) {

            const element =
                movingImage.element;


            const maxX =
                Math.max(
                    0,
                    window.innerWidth -
                    element.offsetWidth
                );


            const maxY =
                Math.max(
                    0,
                    window.innerHeight -
                    element.offsetHeight
                );


            movingImage.x =
                Math.min(
                    movingImage.x,
                    maxX
                );


            movingImage.y =
                Math.min(
                    movingImage.y,
                    maxY
                );
        }
    }
);


/* =========================================================
   START LOADING
========================================================= */

loadImages();