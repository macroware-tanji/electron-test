const { ipcRenderer } = require('electron');

let localVideo = null// = document.getElementById('local_video');
let remoteVideo = null// = document.getElementById('remote_video');
//let localStream = null;
let peerConnection = null;
let textForSendSdp = null// = document.getElementById('text_for_send_sdp');
let textToReceiveSdp = null// = document.getElementById('text_for_receive_sdp');

let localStream = null
// Node.jsのすべてのAPIがプリロード処理で利用可能です。
// Chromeの拡張機能と同じサンドボックスを持っています。
window.addEventListener("DOMContentLoaded", () => {
    // DOM要素のテキストを変更します
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector);
      if (element) {
        element.textContent = text;
      }
    };
  
    for (const dependency of ["chrome", "node", "electron"]) {
      // HTMLページ内の文言を差し替えます
      replaceText(`${dependency}-version`, process.versions[dependency]);
    }
    localVideo = document.getElementById('local_video');
    remoteVideo = document.getElementById('remote_video');
    textForSendSdp = document.getElementById('text_for_send_sdp');
    textToReceiveSdp = document.getElementById('text_for_receive_sdp');
});

window.setLocalStream = (stream) => {
  localStream = stream
}

window.captureScreen = () => {
    return ipcRenderer.invoke('capture-screen');
};

window.connectPeer = () => {
  connect()
}

window.playVideo = (element, stream) => {
  playVideo(element,stream)
}

window.pauseVideo = (element) => {
  pauseVideo(element)
}

window.stopLocalStream = (stream) => {
  stopLocalStream(stream)
}

function playVideo(element, stream){
  element.srcObject = stream;
  element.onloadedmetadata = (e) => element.play()
}

function pauseVideo(element) {
  element.pause()
  element.srcObject = null;
}

function stopLocalStream(stream){
  let tracks = stream.getTracks();
  if (! tracks) {
    console.warn('NO tracks');
    return;
  }
  
  for (let track of tracks) {
    track.stop();
  }    
}

let wsUrl = 'ws://localhost:3001/';
let ws = new WebSocket(wsUrl);
ws.onopen = function(evt) {
  console.log('ws open()');
};
ws.onerror = function(err) {
  console.error('ws onerror() ERR:', err);
};
ws.onmessage = async function(evt) {
  let str=null;
  if(typeof evt.data === "string"){
    str = evt.data
  }
  else{
    str = await evt.data.text();
  }
  console.log('ws onmessage() data:', str);
  let message = JSON.parse(str);
  if (message.type === 'offer') {
    // -- got offer ---
    console.log('Received offer ...');
    textToReceiveSdp.value = message.sdp;
    let offer = new RTCSessionDescription(message);
    setOffer(offer);
  }
  else if (message.type === 'answer') {
    // --- got answer ---
    console.log('Received answer ...');
    textToReceiveSdp.value = message.sdp;
    let answer = new RTCSessionDescription(message);
    setAnswer(answer);
  }
  else if (message.type === 'candidate') {
    // --- got ICE candidate ---
    console.log('Received ICE candidate ...');
    let candidate = new RTCIceCandidate(message.ice);
    console.log(candidate);
    addIceCandidate(candidate);
  }
};

  // ----- hand signaling ----
  function onSdpText() {
    let text = textToReceiveSdp.value;
    if (peerConnection) {
      console.log('Received answer text...');
      let answer = new RTCSessionDescription({
        type : 'answer',
        sdp : text,
      });
      setAnswer(answer);
    }
    else {
      console.log('Received offer text...');
      let offer = new RTCSessionDescription({
        type : 'offer',
        sdp : text,
      });
      setOffer(offer);
    }
    textToReceiveSdp.value ='';
  }
 
  function sendSdp(sessionDescription) {
    console.log('---sending sdp ---');
    
    textForSendSdp.value = sessionDescription.sdp;
    /*---
    textForSendSdp.focus();
    textForSendSdp.select();
    ----*/

    let message = JSON.stringify(sessionDescription);
    console.log('sending SDP=' + message);
    ws.send(message);
  }

  function sendIceCandidate(candidate) {
    console.log('---sending ICE candidate ---');
    let obj = { type: 'candidate', ice: candidate };
    let message = JSON.stringify(obj);
    console.log('sending candidate=' + message);
    ws.send(message);
  }

  // ---------------------- connection handling -----------------------
  function prepareNewConnection() {
    let pc_config = {"iceServers":[]};
    let peer = new RTCPeerConnection(pc_config);

    // --- on get remote stream ---
    if ('ontrack' in peer) {
      peer.ontrack = function(event) {
        console.log('-- peer.ontrack()');
        let stream = event.streams[0];
        playVideo(remoteVideo, stream);
      };
    }
    else {
      peer.onaddstream = function(event) {
        console.log('-- peer.onaddstream()');
        let stream = event.stream;
        playVideo(remoteVideo, stream);
      };
    }

    // --- on get local ICE candidate
    peer.onicecandidate = function (evt) {
      if (evt.candidate) {
        console.log(evt.candidate);

        // Trickle ICE の場合は、ICE candidateを相手に送る
        sendIceCandidate(evt.candidate);

        // Vanilla ICE の場合には、何もしない
      } else {
        console.log('empty ice event');

        // Trickle ICE の場合は、何もしない
        
        // Vanilla ICE の場合には、ICE candidateを含んだSDPを相手に送る
        //sendSdp(peer.localDescription);
      }
    };

    // --- when need to exchange SDP ---
    peer.onnegotiationneeded = function(evt) {
      console.log('-- onnegotiationneeded() ---');
    };

    // --- other events ----
    peer.onicecandidateerror = function (evt) {
      console.error('ICE candidate ERROR:', evt);
    };

    peer.onsignalingstatechange = function() {
      console.log('== signaling status=' + peer.signalingState);
    };

    peer.oniceconnectionstatechange = function() {
      console.log('== ice connection status=' + peer.iceConnectionState);
      if (peer.iceConnectionState === 'disconnected') {
        console.log('-- disconnected --');
        hangUp();
      }
    };

    peer.onicegatheringstatechange = function() {
      console.log('==***== ice gathering state=' + peer.iceGatheringState);
    };
    
    peer.onconnectionstatechange = function() {
      console.log('==***== connection state=' + peer.connectionState);
    };

    peer.onremovestream = function(event) {
      console.log('-- peer.onremovestream()');
      pauseVideo(remoteVideo);
    };
    
    
    // -- add local stream --
    if (localStream) {
      console.log('Adding local stream...');
      peer.addStream(localStream);
    }
    else {
      console.warn('no local stream, but continue.');
    }

    return peer;
  }

  function makeOffer() {
    peerConnection = prepareNewConnection();
    peerConnection.createOffer()
    .then(function (sessionDescription) {
      console.log('createOffer() succsess in promise');
      return peerConnection.setLocalDescription(sessionDescription);
    }).then(function() {
      console.log('setLocalDescription() succsess in promise');

      // -- Trickle ICE の場合は、初期SDPを相手に送る -- 
      sendSdp(peerConnection.localDescription);

      // -- Vanilla ICE の場合には、まだSDPは送らない --
    }).catch(function(err) {
      console.error(err);
    });
  }

  function setOffer(sessionDescription) {
    if (peerConnection) {
      console.error('peerConnection alreay exist!');
    }
    peerConnection = prepareNewConnection();
    peerConnection.setRemoteDescription(sessionDescription)
    .then(function() {
      console.log('setRemoteDescription(offer) succsess in promise');
      makeAnswer();
    }).catch(function(err) {
      console.error('setRemoteDescription(offer) ERROR: ', err);
    });
  }
  
  function makeAnswer() {
    console.log('sending Answer. Creating remote session description...' );
    if (! peerConnection) {
      console.error('peerConnection NOT exist!');
      return;
    }
    
    peerConnection.createAnswer()
    .then(function (sessionDescription) {
      console.log('createAnswer() succsess in promise');
      return peerConnection.setLocalDescription(sessionDescription);
    }).then(function() {
      console.log('setLocalDescription() succsess in promise');

      // -- Trickle ICE の場合は、初期SDPを相手に送る -- 
      sendSdp(peerConnection.localDescription);

      // -- Vanilla ICE の場合には、まだSDPは送らない --
    }).catch(function(err) {
      console.error(err);
    });
  }

  function setAnswer(sessionDescription) {
    if (! peerConnection) {
      console.error('peerConnection NOT exist!');
      return;
    }

    peerConnection.setRemoteDescription(sessionDescription)
    .then(function() {
      console.log('setRemoteDescription(answer) succsess in promise');
    }).catch(function(err) {
      console.error('setRemoteDescription(answer) ERROR: ', err);
    });
  }

  // --- tricke ICE ---
  function addIceCandidate(candidate) {
    if (peerConnection) {
      peerConnection.addIceCandidate(candidate);
    }
    else {
      console.error('PeerConnection not exist!');
      return;
    }
  }
  
  // start PeerConnection
  function connect() {
    if (! peerConnection) {
      console.log('make Offer');
      makeOffer();
    }
    else {
      console.warn('peer already exist.');
    }
  }

  // close PeerConnection
  function hangUp() {
    if (peerConnection) {
      console.log('Hang up.');
      peerConnection.close();
      peerConnection = null;
      pauseVideo(remoteVideo);
    }
    else {
      console.warn('peer NOT exist.');
    }
  }