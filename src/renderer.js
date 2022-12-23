// In the renderer process.
//const {ipcRenderer} = require('electron')

const videoElem = document.getElementById("video");
const logElem = document.getElementById("log");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");

const thumbnailElem = document.getElementById("thumbnail");
  
// Set event listeners for the start and stop buttons
startElem.addEventListener("click", (evt) => {
    startCapture();
}, false);

stopElem.addEventListener("click", (evt) => {
    stopCapture();
}, false);

console.log = (msg) => logElem.innerHTML += `${msg}<br>`;
console.error = (msg) => logElem.innerHTML += `<span class="error">${msg}</span><br>`;
console.warn = (msg) => logElem.innerHTML += `<span class="warn">${msg}<span><br>`;
console.info = (msg) => logElem.innerHTML += `<span class="info">${msg}</span><br>`;

async function startCapture() {
    logElem.innerHTML = "";
    thumbnailElem.innerHTML = ""
    console.log("startCapture")
    const sources = await window.captureScreen();
    let names = "";
    for (const source of sources) {
        names += source.name
        console.log(source.thumbnail.toDataURL())
        thumbnailElem.innerHTML += `<img src="${source.thumbnail.toDataURL()}"/><br>`;
    }
    console.log(names)

    try {
        const displayMediaOptions={
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sources[0].id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
              }
            }
        }
        const stream = await navigator.mediaDevices.getUserMedia(displayMediaOptions)
        handleStream(stream)
    } catch (e) {
        handleError(e)
    }
  }

  function stopCapture(evt) {
    console.log("stopCapture")
    videoElem.srcObject = null;
    thumbnailElem.innerHTML = ""
}
  
function handleStream (stream) {
    videoElem.srcObject = stream
    videoElem.onloadedmetadata = (e) => video.play()
}

function handleError (e) {
    console.log(e)
}