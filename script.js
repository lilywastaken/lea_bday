const imageButton = document.getElementById("imageButton");
const image = imageButton.querySelector("img");
const countElement = document.getElementById("count");
const message = document.getElementById("message");

let clicks = 0;
let rotation = 0;

const messages = [
    "Nice.",
    "Again.",
    "Keep going.",
    "Interesting...",
    "You found the button.",
    "Okay, now we're experimenting.",
    "One more.",
    "This is getting excessive."
];

imageButton.addEventListener("click", () => {
    clicks++;
    rotation += 45;

    countElement.textContent = clicks;

    imageButton.style.transform =
        `scale(${1 + Math.random() * 0.15}) rotate(${rotation}deg)`;

    document.body.style.background =
        `hsl(${Math.random() * 360}, 30%, 10%)`;

    message.textContent =
        messages[(clicks - 1) % messages.length];
});