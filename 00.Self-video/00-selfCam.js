/* Simple webcamera test application */
'use strict';
navigator.getWebcam = ( navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mediaDevices.getUserMedia ||
                        navigator.msGetUserMedia);

var localStream;
var fpsSelect = document.getElementById('frameRateSelect');
//console.log(fpsSelect);
var isFirstRun = true;
var qvgaConstraints={
    video: {
        frameRate: {
            exact: 30.0
        },
        width: {
            exact: 320
        }, 
        height: {
            exact: 200
        }       
    },
    audio: true
};

var vgaConstraints={
    video: {
        frameRate: {
            exact: 30.0
        },
        width: {
            exact: 640
        }, 
        height: {
            exact: 480
        }       
    },
    audio: true
};

var hdConstraints={
    video: {
        frameRate: {
            exact: 30.0
        },
        width: {
            exact: 1280
        }, 
        height: {
            exact: 720
        }        
    },
    audio: true
};

var fullhdConstraints={
    video: {
        frameRate: {
            exact: 30.0
        },
        width: {
            exact: 1920
        }, 
        height: {
            exact: 1080
        }
    },
    audio: true
};

let constraints = new Map();
constraints.set ('qvga',qvgaConstraints);
constraints.set ('vga',vgaConstraints);
constraints.set ('hd',hdConstraints);
constraints.set ('fullhd',fullhdConstraints);

function GetMediaParameters(stream) {

    return     `Camera:   ${stream.getVideoTracks()[0].label}
StreamId: ${stream.getVideoTracks()[0].id}
DeviceId: ${stream.getVideoTracks()[0].getSettings().deviceId}
Width:    ${stream.getVideoTracks()[0].getSettings().width}
Height:   ${stream.getVideoTracks()[0].getSettings().height}
Framerate:${stream.getVideoTracks()[0].getSettings().frameRate}`;

//stream.getVideoTracks()[0].ApplyConstraints
}
function StartVideo(){
    console.log(`[INFO]: Starting video`);
    var selfVideoElement = document.getElementById('selfVideo');
    let currentConstraints = constraints.get(document.getElementById('resolutionSelect').value);
    currentConstraints.video.frameRate = fpsSelect.options[fpsSelect.selectedIndex].value;

    //navigator.mediaDevices.getUserMedia(currentConstraints)
    navigator.mediaDevices.getUserMedia(currentConstraints)
    .then (function(stream) {
        localStream = stream;
        if (isFirstRun){
            navigator.mediaDevices.enumerateDevices().then (function(devices){
                var select = document.getElementById('cameraSelect');
                devices.forEach(device=>{
                    if (device.kind==='videoinput'){
                        let option = document.createElement('option');
                        option.value = device.deviceId;
                        //console.log(device.deviceId);
                        option.text = device.label;
                        select.add(option);
                        //console.log(device);
                    }
                })
            });
            isFirstRun = false;
        }   

        selfVideoElement.srcObject = stream;
        document.getElementById('stopVideo').removeAttribute('disabled');
        document.getElementById('startVideo').setAttribute('disabled','');
        document.getElementById('pauseVideo').removeAttribute('disabled');
        document.getElementById('infoText').value = GetMediaParameters(stream);
        document.getElementById('applyConstraints').removeAttribute('disabled');
        console.log(`[INFO]: Video started. Camera: ${stream.getVideoTracks()[0].label} ID: ${stream.getVideoTracks()[0].id}`);
    })
    .catch(function(error) {
        console.log(`[ERROR]: ${error}`);
    });
}

function StopVideo(){
    var selfVideoElement = document.getElementById('selfVideo');
    let stream = selfVideoElement.srcObject;
    let tracks = stream.getTracks();
    tracks.forEach(function(track) {
        track.stop();
    });
    selfVideoElement.srcObject=null;
    document.getElementById('stopVideo').setAttribute('disabled','');
    document.getElementById('startVideo').removeAttribute('disabled');
    document.getElementById('pauseVideo').setAttribute('disabled','');
    document.getElementById('infoText').value = '';
    document.getElementById('applyConstraints').setAttribute('disabled','');
    console.log(`[INFO]: Video stopped`);
}

function PauseVideo(){
    let selfVideoElement = document.getElementById('selfVideo');
    let pauseVideoButton = document.getElementById('pauseVideo');
    if (selfVideoElement.paused) {
        selfVideoElement.play();
        pauseVideoButton.textContent = "Pause"
        console.log(`[INFO]: Video resumed`);
    }
    else {
        selfVideoElement.pause();
        pauseVideoButton.textContent = "Resume"
        console.log(`[INFO]: Video paused`);
    }
}
    
function ApplyConstraints(){
    let currentConstraints = constraints.get(document.getElementById('resolutionSelect').value);
    currentConstraints.video.frameRate.exact=fpsSelect.options[fpsSelect.selectedIndex].value;
    localStream.getVideoTracks()[0].applyConstraints(currentConstraints.video).
    then(function(){
        console.log(`[INFO]: Video settings has been changed. Resolution=${currentConstraints.video.width.exact}x${currentConstraints.video.height.exact}, FrameRate=${currentConstraints.video.frameRate.exact}`);
        document.getElementById('infoText').value = GetMediaParameters(localStream);
    }).
        catch(function(error){
        console.log(`[ERROR]: ${error}`);
    });
}


function TakeSnapshot(){
    let canvas = document.createElement('canvas');
    let image = document.createElement('img');
    let context;
    let selfVideo = document.getElementById('selfVideo');
    let width = localStream.getVideoTracks()[0].getSettings().width;
    let height = localStream.getVideoTracks()[0].getSettings().height;
    let snapshotURL;

    canvas.width = width;
    canvas.height = height;
    
    context = canvas.getContext('2d');
    context.drawImage(selfVideo,0,0,width,height);
    snapshotURL = canvas.toDataURL('image/png');
    image.src= snapshotURL;
    
    downloadFile(snapshotURL);
    console.log(`[INFO]: Snapshot has been taken`);
    
    
}


/*function TakeSnapshot(){
    let image = document.createElement('img');
    let track = localStream.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);

    imageCapture.takePhoto()
    .then(blob => {
        console.log(`taken: ${blob.type}, ${blob.size} B`);
        var img = document.createElement('img'); 
        img.source = blob;
        //document.body.appendChild(img);
        console.log(img.source);
    })
    .catch (err => {
        console.log(err);
    });
    
} */

function downloadFile(name) {
    let pom = document.createElement('a');
    pom.setAttribute('href', name);
    pom.setAttribute('download','');

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

function changeCamera(){
    StopVideo();
    let camSelector = document.getElementById('cameraSelect');
    let selectedCameraId = camSelector.options[camSelector.selectedIndex].value;
    let currentConstraints = constraints.get(document.getElementById('resolutionSelect').value);
    currentConstraints.video.deviceId={exact: selectedCameraId};
    navigator.mediaDevices.getUserMedia(currentConstraints)
    .then(function(stream){
        localStream = stream;
        document.getElementById('selfVideo').srcObject=stream;

        document.getElementById('stopVideo').removeAttribute('disabled');
        document.getElementById('startVideo').setAttribute('disabled','');
        document.getElementById('pauseVideo').removeAttribute('disabled');
        document.getElementById('infoText').value = GetMediaParameters(stream);
        document.getElementById('applyConstraints').removeAttribute('disabled');
  
        console.log(`[INFO]: Camera has been change to: ${selectedCameraId}`);
    }).
    catch(function(error){
        console.log(`[ERROR]: ${error}`)
    })
}

