'use strickt';

let traceLevel = 7;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const sendButton = document.getElementById('sendButton');
const dataChannelSend = document.getElementById('localText');
const dataChannelReceive = document.getElementById('remoteText');



let localStream;
let remoteStream;
let sendChannel;
let receiveChannel;
let currentConstraints = {
    video: true,
    audio: true
};

let pcConstraints = null;
let dataConstraints = null;

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
    leveledTrace(`remotePeer answers`, 5);
    leveledTrace(`Answer from remotePeer:\n${description.sdp}`, 7);

    leveledTrace(`remotePeer starts setLocalDescription method`, 5);
    remotePeer.setLocalDescription(description).
    then(()=>{
        setDescriptionSuccess(remotePeer,'setLocalDescription');
    }).
    catch(setSessionDescriptionError);

    leveledTrace(`localPeer starts setLocalDescription method`, 5);
    localPeer.setRemoteDescription(description).
    then(()=>{
        setDescriptionSuccess(localPeer,'setLocalDescription');
    }).
    catch(setSessionDescriptionError);


}

function createdOffer(description){
    
    leveledTrace(`localPeer creates offer`, 5);
    leveledTrace(`Offer from remotePeer:\n${description.sdp}`, 7);

    leveledTrace(`localPeer starts setLocalDescription method:`,5);
    localPeer.setLocalDescription(description).
    then(()=>{
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

    
    localPeer = new RTCPeerConnection(localPeerConfiguration,pcConstraints);
    leveledTrace('Local peer created. Object: localPeer', 5);
    //leveledTrace(`Peer settings:`,7); //подумать
    leveledTrace('Using SCTP based data channels',5);
    sendChannel = localPeer.createDataChannel('sendDataChannel', dataConstraints);
    leveledTrace('Send data channel created.',5);
    leveledTrace(`Send data channel ID: ${sendChannel.id}`, 7);
    localPeer.addEventListener('icecandidate', connectionHandler);
    localPeer.addEventListener('iceconnectionstatechange', connectionChangeHandler);
    sendChannel.addEventListener('open', onSendChannelStateChange);
    sendChannel.addEventListener('close', onSendChannelStateChange);

    remotePeer = new RTCPeerConnection(null,pcConstraints);
    leveledTrace('Remote peer created. Object: remotePeer', 5);
    remotePeer.addEventListener('icecandidate', connectionHandler);
    remotePeer.addEventListener('iceconnectionstatechange', connectionChangeHandler);
    remotePeer.addEventListener('addstream', gotRemoteMediaStream);
    remotePeer.addEventListener('datachannel', receiveChannelCallback);

    localPeer.addStream(localStream);
    leveledTrace(`Local stream added to localPeer`, 7);

    leveledTrace(`Local peer creates offer.`, 5);
    localPeer.createOffer(offerOptions).
    then(createdOffer).
    catch(setSessionDescriptionError);

    leveledTrace('Data connection initialization complete', 5);

}


function onSendChannelStateChange(){
    let readyState = sendChannel.readyState;
    leveledTrace(`Send channel state is: ${readyState}`, 5);
    if (readyState==='open') {
        dataChannelSend.focus();

    } else{
        dataChannelSend.disabled=true;
    }
}

function receiveChannelCallback(event){
    leveledTrace('Received channel callback',5);
    receiveChannel = event.channel;
    receiveChannel.addEventListener('message', onReceiveMessageCallback);
    receiveChannel.addEventListener('open', onReceiveChannelStateChange);
    receiveChannel.addEventListener('close', onReceiveChannelStateChange);

}

function onReceiveMessageCallback(event){
    leveledTrace('Message received', 5);
    leveledTrace(`Received message: ${event.data}`,7);
    dataChannelReceive.value = event.data;
}

function onReceiveChannelStateChange(){
    leveledTrace(`Receive channel state is: ${receiveChannel.readyState}`);
}

function sendInstantMessage() {
    let data = dataChannelSend.value;
    sendChannel.send(data);
    leveledTrace('Message sent.', 5);
    leveledTrace(`Sent message: ${data}`, 7);
}

function endCall() {
    sendChannel.close();
    receiveChannel.close();
    localPeer.close();
    remotePeer.close();
    localPeer = null;
    remotePeer = null;
    //hangupButton.disabled = true;
    //callButton.disabled = false;
    leveledTrace('Call ended', 5);
  }
