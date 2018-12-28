'use strickt';

let traceLevel = 7;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let currentConstraints = {
    video: true,
    audio: true
};
//Helpers:
function getOppositPeer(peer){ //если на вход локальный - вернет удаленный Peer, и наоборот.
    if (peer === localPeer){
        return remotePeer;
    }
    else {
        return localPeer;
    }
};

function getPeerName(peer){
    return (peer===localPeer)?'remotePeer':'localPeer'; //конструкция аналогична if-else в фунуции getOppositePeer()
}




//Main functions:
function initLocalMedia(constraints) {
    leveledTrace('Initiate media', 5);
    
    navigator.mediaDevices.getUserMedia(constraints).
    then(function(stream) {
        leveledTrace('Camera initiated successfully',5);
        leveledTrace(`Initiated stream ID: ${stream.id}`,7);
        localVideo.srcObject = stream;
        localStream=stream;
    }).
    catch (function(error){
        leveledTrace(error,1);
    })
};

function connectionHandlerSuccess(peer){
    leveledTrace(`${getPeerName(peer)}-> addIceCandidate = OK`, 5)
}

function connectionHandlerFail(peer, error){
    leveledTrace(`${getPeerName(peer)}-> addIceCandidate = FAILED`, 5);
    leveledTrace(`${error}`, 1);
}

function connectionHandler(event){
    const peer = event.target; //event.target содержит ссылку на объект который этот event породил. Т.е. мы получаем так ссылку на peer
    const iceCandidate = event.candidate; //returns the RTCIceCandidate associated with the event

    if (iceCandidate) {
        const newIceCandidate = new RTCIceCandidate(iceCandidate); //как я понимаю, мы создаем кандидата из самого себя, т.е. мы будем передавать поток сами себе. Для реальной передачи надо как-то создать реального кандидата.
        const oppositePeer = getOtherPeer(peer);

        oppositePeer.addIceCandidate(newIceCandidate). 
        then(function(){
            connectionHandlerSuccess(peer);
        }).
        catch(function(error){
            connectionHandlerFail(peer,error);
        });

        leveledTrace(`${getPeerName(peer)} ICE candidate:\n${event.candidate.candidate}`,7);
    }
}

function connectionChangeHandler(event){
    const peer = event.target;
    leveledTrace(`ICE state has been. Event: ${event}`, 5);
    leveledTrace(`ICE State:\n${peer.iceConnectionState}`,7); //посмотреть подумать над уровнями
}

function gotRemoteMediaStream(event){
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    leveledTrace(`Remote peer got remote stream`, 5);

}

function initCall(){
    leveledTrace('Starting a call', 5);

    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();

    if (videoTracks.lenght>0) { 
        leveledTrace(`Video device in use: ${videoTracks[0].label}`,5);
    } else {
        leveledTrace(`No video device detected`, 3);
    }
    if (audioTracks.lenght>0) { 
        leveledTrace(`Audio device in use: ${audioTracks[0].label}`,5);
    } else {
        leveledTrace(`No audio device detected`, 3);
    }

    const localPeerConfiguration = null;

    localPeer = new RTCPeerConnection(localPeerConfiguration);
    leveledTrace('Local peer created. Object: localPeer', 5);
    //leveledTrace(`Peer settings:`,7); //подумать
    localPeer.addEventListener('icecandidate', connectionHandler);
    localPeer.addEventListener('iceconnectionstatechange', connectionChangeHandler);

    remotePeer = new RTCPeerConnection(null);
    leveledTrace('Remote peer created. Object: remotePeer', 5);
    remotePeer.addEventListener('icecandidate', connectionHandler);
    remotePeer.addEventListener('iceconnectionstatechange', connectionChangeHandler);
    remotePeer.addEventListener('addstream', gotRemoteMediaStream);

    localPeer.addStream(localStream);
    leveledTrace(`Local stream added to localPeer`, 7);

    leveledTrace(`Local peer creates offer.`, 5);

    localPeer.createOffer(offerOptions)

}
