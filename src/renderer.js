// In the renderer process.
//const {ipcRenderer} = require('electron')

const localVideo = document.getElementById("local_video");
const remoteVideo = document.getElementById("remote_video");
const logElem = document.getElementById("log");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");
const connElem = document.getElementById("connect");

const thumbnailElem = document.getElementById("thumbnail");

let localStream = null

//let peerConnection = null;

const textForSendSdp = document.getElementById('text_for_send_sdp');
const textToReceiveSdp = document.getElementById('text_for_receive_sdp');

// Set event listeners for the start and stop buttons
startElem.addEventListener("click", (evt) => {
    startCapture();
}, false);

stopElem.addEventListener("click", (evt) => {
    stopCapture();
}, false);

connElem.addEventListener("click", (evt) => {
    if(localStream!=null){
        window.connectPeer();
    }
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

        const image = document.createElement('img');
        image.src = source.thumbnail.toDataURL()
        //thumbnailElem.innerHTML += `<img src="${source.thumbnail.toDataURL()}"/>`;
        thumbnailElem.appendChild(image)
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

        localStream = stream
        window.setLocalStream(stream)

        window.playVideo(localVideo,stream)
    } catch (e) {
        handleError(e)
    }
  }

  function stopCapture(evt) {
    console.log("stopCapture")
    //videoElem.srcObject = null;
    window.pauseVideo(localVideo)
    window.stopLocalStream(localStream)
    thumbnailElem.innerHTML = ""
}
  
// function handleStream (stream) {
//     videoElem.srcObject = stream
//     videoElem.onloadedmetadata = (e) => videoElem.play()
// }

function handleError (e) {
    console.log(e)
}

// function playVideo(element, stream){
//     window.playVideo(element, stream)
//     //element.srcObject = stream;
//     //element.onloadedmetadata = (e) => element.play()
// }

// function pauseVideo(element) {
//     window.pauseVideo( stream)
//     //element.pause()
//     //element.srcObject = null;
// }

// function stopLocalStream(stream){
//     window.stopLocalStream(stream)
//     //let tracks = stream.getTracks();
//     //if (! tracks) {
//     //  console.warn('NO tracks');
//     //  return;
//     //}
//     //
//     //for (let track of tracks) {
//     //  track.stop();
//     //}    
// }


