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

const offerOptions = {
    offerToReceiveVideo: 1,
}

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
        const oppositePeer = getOppositPeer(peer);

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

function setDescriptionSuccess(peer, functionName){
    leveledTrace(`${getPeerName(peer)}: ${functionName} complete.`, 5);
}

function setLocalDescriptionSuccess(peer) {
    setLocalDescriptionSuccess(peer, 'setLocalDescription');
}

function setSessionDescriptionError(error){
    leveledTrace(`Failed to create session description: ${error.toString()}`, 1);
}

function createdAnswer(description){
    console.log('@@@@01')
    leveledTrace(`remotePeer answers`, 5);
    leveledTrace(`Answer from remotePeer:\n${description.sdp}`, 7);

    leveledTrace(`remotePeer starts setLocalDescription method`, 5);
    remotePeer.setLocalDescription(description).
    then(()=>{
        console.log('@@@@02')
        setDescriptionSuccess(remotePeer,'setLocalDescription');
    }).
    catch(setSessionDescriptionError);

    console.log('@@@@03')
    leveledTrace(`localPeer starts setLocalDescription method`, 5);
    localPeer.setRemoteDescription(description).
    then(()=>{
        setDescriptionSuccess(localPeer,'setLocalDescription');
        console.log('@@@@4')
    }).
    catch(setSessionDescriptionError);


}

function createdOffer(description){
    
    leveledTrace(`localPeer creates offer`, 5);
    leveledTrace(`Offer from remotePeer:\n${description.sdp}`, 7);

    leveledTrace(`localPeer starts setLocalDescription method:`,5);
    localPeer.setLocalDescription(description).
    then(()=>{
        //setLocalDescriptionSuccess(localPeer);
        setDescriptionSuccess(localPeer, 'setLocalDescription');
    }).
    catch (setSessionDescriptionError);
    
    leveledTrace(`remotePeer starts setLocalDescription method:`,5);
    remotePeer.setRemoteDescription(description).
    then(()=>{    
        setDescriptionSuccess(remotePeer, 'setLocalDescription');
    }).
    catch (setSessionDescriptionError);
    leveledTrace(`remotePeer starts createAnswer method`, 5);
    remotePeer.createAnswer().
    then(createdAnswer).
    catch (setSessionDescriptionError);

}

function initCall(){
    leveledTrace('Starting a call', 5);

    const videoTracks = localStream.getVideoTracks();
    const audioTracks = localStream.getAudioTracks();

    if (videoTracks.length>0) { 
        leveledTrace(`Video device in use: ${videoTracks[0].label}`,5);
    } else {
        leveledTrace(`No video device detected`, 3);

    }
    if (audioTracks.length>0) { 
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
    localPeer.createOffer(offerOptions).
    then(createdOffer).
    catch(setSessionDescriptionError);

}

function endCall() {
    localPeer.close();
    remotePeer.close();
    localPeer = null;
    remotePeer = null;
    //hangupButton.disabled = true;
    //callButton.disabled = false;
    leveledTrace('Call ended', 5);
  }
