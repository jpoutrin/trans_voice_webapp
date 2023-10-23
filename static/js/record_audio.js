//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
//var pauseButton = document.getElementById("pauseButton");

var seconds = 0;
var secondsCounter = document.getElementById("secondsCounter");
var ticker;


//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

//pauseButton.addEventListener("click", pauseRecording);

function incrementSeconds() {
    seconds += 1;
    secondsCounter.innerHTML = seconds + " secondes";

}

function startRecording() {
    console.log("recordButton clicked");

    /*
        Simple constraints object, for more advanced audio features see
        https://addpipe.com/blog/audio-constraints-getusermedia/
    */

    var constraints = {audio: true, video: false}

    /*
       Disable the record button until we get a success or fail from getUserMedia()
   */

    recordButton.disabled = true;
    stopButton.disabled = false;
    secondsCounter.disabled = false;
    //pauseButton.disabled = false

    /*
        We're using the standard promise based getUserMedia()
        https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    */

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

        /*
            create an audio context after getUserMedia is called
            sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
            the sampleRate defaults to the one set in your OS for your playback device

        */
        audioContext = new AudioContext();

        //update the format
        //document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

        /*  assign to gumStream for later use  */
        gumStream = stream;

        /* use the stream */
        input = audioContext.createMediaStreamSource(stream);

        /*
            Create the Recorder object and configure to record mono sound (1 channel)
            Recording 2 channels  will double the file size
        */
        rec = new Recorder(input, {numChannels: 1});

        console.log(rec);

        //start the recording process
        rec.record();

        console.log("Recording started");

        ticker = setInterval(incrementSeconds, 1000);

    }).catch(function (err) {
        //enable the record button if getUserMedia() fails
        recordButton.disabled = false;
        stopButton.disabled = true;
        //pauseButton.disabled = true
    });
}

function pauseRecording() {
    console.log("pauseButton clicked rec.recording=", rec.recording);
    if (rec.recording) {
        //pause
        rec.stop();
        pauseButton.innerHTML = "Resume";
    } else {
        //resume
        rec.record()
        pauseButton.innerHTML = "Pause";

    }
}

function stopRecording() {
    console.log("stopButton clicked");

    //disable the stop button, enable the record too allow for new recordings
    stopButton.disabled = true;
    recordButton.disabled = false;
    //pauseButton.disabled = true;
    stopButton.style.display = "none";
    secondsCounter.style.display = "none";


    //reset button just in case the recording is stopped while paused
    // pauseButton.innerHTML="Pause";

    //tell the recorder to stop the recording
    rec.stop();

    //stop microphone access
    gumStream.getAudioTracks()[0].stop();

    //create the wav blob and pass it on to createDownloadLink
    rec.exportWAV(createDownloadLink);

    clearInterval(ticker);
}

function createDownloadLink(blob) {

    var url = URL.createObjectURL(blob);
    console.log(url)

    var au = document.createElement('audio');
    var player = document.createElement('div');
    //var link = document.createElement('a');
    //var upload = document.createElement('a');
    var recording_actions = document.getElementById('recording_actions');
    var upload = document.getElementById('upload');
    //var retry = document.createElement('a');

    //name of .wav file to use during upload and download (without extendion)
    var filename = new Date().toISOString();
    console.log(filename)

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;
    au.style.border = "thick solid #2f80ed";
    au.style.borderRadius = "30px";

    //retry link
    //retry.href = "";
    //retry.className = "link"
    //retry.innerHTML = "Recommencer l'enregistrement";

    //save to disk link
    //link.href = url;
    //link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
    //link.innerHTML = "Sauvegarder";


    //add the new audio element to div
    player.appendChild(au);

    //add the filename to the div
    // player.appendChild(document.createTextNode(filename+".wav "));


    //upload link
    //upload.href="{{ url_for('result') }}";
    //upload.className = "main-button only-text w-button"
    //upload.innerHTML = "Analyser la voix";
    upload.addEventListener("click", function (event) {
        event.preventDefault();
        console.log("Commencer à analyser l'audio");
        var fd = new FormData();
        fd.append("file", blob, filename);

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/result");

        xhr.onload = () => {
            if (xhr.status === 200) {
                const segmentation = xhr.responseText;
                console.log('Segmentation:', segmentation);
            } else {
                console.error('Failed to upload file');
            }
        };

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
              const html = xhr.responseText;
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, "text/html");
              const body = doc.body;
              // Do something with the data
              document.body = body;
            } else if (xhr.readyState === 4) {
              console.log('Request failed.  Returned status of ' + xhr.status);
            }
          };

        xhr.send(fd);
        //xhr.onload=function(e) {
        //    if(this.readyState === 4) {
        //        console.log("Server returned: ",e.target.responseText);
        //    }
        //};
    })
    //player.appendChild(upload);//add the upload link to li

    //add the player element to the div
    recordingsList.appendChild(player);
    recording_actions.style.display = "flex";
    //recordingsList.appendChild(retry);
    //recordingsList.appendChild(upload);
    //recordingsList.appendChild(document.createTextNode (" "));//add a space in between

    //recordingsList.appendChild(link);//add the upload link to li
    //recordingsList.appendChild(document.createTextNode (" "));//add a space in between

}