'use strict'


//navigator.getUserMedia.
const localVideo=document.getElementById('localVideo');
const remoteVideo=document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeer;
let remotePeer;

const offerOptions = {
    offerToReceiveVideo: 1,
};

let localCameraConstraints = {
    video: true,
    audio: true
};

initLocalCamera(localCameraConstraints);

/*
//Create a new RTCPeerConnection and add the stream:
var localPeer = new RTCPeerConnection();
localStream.getTracks().array.forEach((track )=> {
    localPeer.addTrack(track, localStream);
});

//Create an offer and set is as local description for localPeer and as remote for remotePeer
var remotePeer = new RTCPeerConnection();
localPeer.setLocalDescription(desc).then(()=>{
    onSetLocalSuccess(localPeer);
}, onSetSessionDescriptionError);
console.log(`[INFO]: RemotePeer setRemoteDescription start`);
remotePeer.setRemoteDescription(desc).then(()=>{
    onSetRemoteSuccess(remotePeer);
},
onSetSessionDescriptionError);

remotePeer.ontrack = gotRemoteStream;

function gotRemoteStream(e){
    remoteVideo.srcObject=e.stream;
}
*/

/*
var peer = new Peer();
peer.on('open', function(){
    document.getElementById('localSessionId').value=peer.id;
})
*/

function initLocalCamera(constraints) {
    console.log(`[INFO]: Initiating camera...`);
    navigator.mediaDevices.getUserMedia(constraints).
    then(function(stream) {
        console.log(`[INFO]: Camera initiated. Stream=${stream.id}`);
        localVideo.srcObject = stream;
        localStream=stream;
    }).
    catch (function(error){
        console.log(`[ERROR]: ${error}`);
    })
}

function getRemoteStream(event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    console.log(`[INFO]: Remote peer connection got remote stream. Stream=${mediaStream.id}`);

}

function handleConnection(event){
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if(iceCandidate) {
        const newIceCandidate = new RTCIceCandidate(iceCandidate);
        const otherPeer = getOtherPeer(peerConnection);

        otherPeer.addIceCandidate(newIceCandidate)
        .then (()=>{
            console.log(`[INFO]: ${getPeerName(peerConnection)} addIceCandidate success.`);
        })
        .catch((error) => {
            console.log(`[INFO]: ${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+
            `${error.toString()}.`);
        });
    }
}

//COPY-PASTE:
function setDescriptionSuccess(peerConnection, functionName) {
    const peerName = getPeerName(peerConnection);
    console.log(`${peerName} ${functionName} complete.`);
  }

function createdOffer(description) {
    console.log(`[INFO]: Offer from localPeer:\n${description.sdp}`);
    console.log(`[INFO]: localPeer setLocalDescription start.`);

    localPeer.setLocalDescription(description)
    .then(()=> {
        setDescriptionSuccess(localPeer, 'setLocalDescription');
    })
    .catch((error) => {
        console.log(`[ERROR]: Failed to create session description: ${error.toString()}.`);
    });

    console.log(`[INFO]: remotePeer setRemoteDescription start.`);

    remotePeer.setRemoteDescription(description)
    .then(()=>{
        setDescriptionSuccess(remotePeer, 'setRemoteDescription');
    })
    .catch((error) => {
        console.log(`[ERROR]: Failed to create session description: ${error.toString()}.`);
    });

    console.log(`[INFO]: remotePeer createAnswer start`);

    remotePeer.createAnswer().
    then(createdAnswer).
    catch((error) => {
        console.log(`[ERROR]: Failed to create session description: ${error.toString()}.`);
    });

}

//COPY-PASTE(MOD):
function createdAnswer(description) {
    console.log(`[INFO]: Answer from remotePeerConnection:\n${description.sdp}.`);
  
    console.log(`[INFO]: remotePeerConnection setLocalDescription start.`);
    remotePeer.setLocalDescription(description).
    then(() => {
        setDescriptionSuccess(remotePeer, 'setRemoteDescription');
    }).
    catch((error) => {
        console.log(`[ERROR]: Failed to create session description: ${error.toString()}.`);
    });
  
    trace('localPeerConnection setRemoteDescription start.');
    localPeerConnection.setRemoteDescription(description).
    then(() => {
        setDescriptionSuccess(localPeer, 'setRemoteDescription');
    }).
    catch((error) => {
        console.log(`[ERROR]: Failed to create session description: ${error.toString()}.`);
    });
  }
  

function startCall() {
    console.log(`[INFO]: Call is starting.`);

    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();
    const servers = null;

    localPeer = new RTCPeerConnection(servers);
    localPeer.addEventListener('icecandidate', handleConnection);
    //localPeer.addEventListener('')
    remotePeer = new RTCPeerConnection(servers);
    remotePeer.addEventListener('icecandidate', handleConnection);
    remotePeer.addEventListener('addstream',getRemoteStream);

    localPeer.addStream(localStream);
    localPeer.createdOffer(offerOptions).
    then(createdOffer).
    catch((error) => {
        console.log(`[ERROR]: ${error}`);
    });
}

