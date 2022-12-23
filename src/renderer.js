// In the renderer process.
//const {ipcRenderer} = require('electron')

const videoElem = document.getElementById("video");
const logElem = document.getElementById("log");
const startElem = document.getElementById("start");
const stopElem = document.getElementById("stop");

const thumbnailElem = document.getElementById("thumbnail");
// const displayMediaOptions = {
//     video: {
//       displaySurface: "window"
//     },
//     audio: false
//   };
  
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
      //if (source.name === 'Electron') {
      //  //mainWindow.webContents.send('SET_SOURCE', source.id)
      //  return
      //}
      names += source.name
      console.log(source.thumbnail.toDataURL())
      //   var thumbnailImage = new Image(200, 200);
      //   thumbnailImage.src = source.thumbnail.toDataURL();
      //   thumbnailElem.appendChild(thumbnailImage);
      thumbnailElem.innerHTML += `<img src="${source.thumbnail.toDataURL()}"/><br>`;
    }
    console.log(names)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
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
      })
      handleStream(stream)
    } catch (e) {
      handleError(e)
    }
  // try {
    //   videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    //   dumpOptionsInfo();
    // } catch (err) {
    //   console.error(`Error: ${err}`);
    // }
  }

  function stopCapture(evt) {
    console.log("stopCapture")
    // let tracks = videoElem.srcObject.getTracks();
  
    // tracks.forEach((track) => track.stop());
    videoElem.srcObject = null;
    thumbnailElem.innerHTML = ""
}
// console.log(desktopCapturer)
// desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
//     if (error) throw error
//     for (let i = 0; i < sources.length; ++i) {
//       if (sources[i].name === 'Electron') {
//         navigator.mediaDevices.getUserMedia({
//           audio: false,
//           video: {
//             mandatory: {
//               chromeMediaSource: 'desktop',
//               chromeMediaSourceId: sources[i].id,
//               minWidth: 1280,
//               maxWidth: 1280,
//               minHeight: 720,
//               maxHeight: 720
//             }
//           }
//         })
//         .then((stream) => handleStream(stream))
//         .catch((e) => handleError(e))
//         return
//       }
//     }
//   })

  
  function handleStream (stream) {
    //const video = document.querySelector('video')
    videoElem.srcObject = stream
    videoElem.onloadedmetadata = (e) => video.play()
  }
  
  function handleError (e) {
    console.log(e)
  }