import React, { Component } from 'react';
import io from 'socket.io-client';

class App extends Component {

    localVidRef = React.createRef();
    remoteVidRef = React.createRef();

    socket = null;
    candidates = [];

  componentDidMount() {
    const pc_config = null;
    const test_pc_config = {
      "iceServers": [
        {urls: 'stun:stun.l.google.com:19302'}
      ]
    }
    this.socket = io(
      '/webrtcPeer',
      {
        path: '/webrtc',
        query: {}
      }

    )
    this.socket.on('offerOrAnswer', (sdp) => {
      // this.textref.value = JSON.stringify(sdp);
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
      .then(val => {
        console.log('remote desc set ', val);
      })
      .catch(error => {console.log('set remote err ', error)});
    })
    this.socket.on('candidate', (candidate) => {
      console.log('received candidate ', candidate);
      this.candidates.push(candidate);
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    })
    this.pc = new RTCPeerConnection(test_pc_config);
    this.pc.onicecandidate = (e) => {
      if (e.candidate) console.log('new candidate ', JSON.stringify(e.candidate));
      if (e.candidate) this.sendToPeer('candidate', e.candidate);
    }
    this.pc.oniceconnectionstatechange = (e) => {
      console.log('state change ', e);
    }
    this.pc.ontrack = (e) => {
      console.log('on track ', e)
      this.remoteVidRef.current.srcObject = e.streams[0]
    }
    navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(stream => {
      window.localStream = stream;
      this.localVidRef.current.srcObject = stream;
      const tracks = stream.getTracks();
      console.log('track ', tracks);
      this.pc.addTrack(tracks[0], stream);
      this.pc.addTrack(tracks[1], stream);
    })
    .catch(error => {
      console.warn(error.message);
    })
  }

  createOffer = () => {
    console.log('offer');
    this.pc.createOffer({offerToReceiveVideo: 1, offerToReceiveAudio: 1})
    .then(sdp => {
      this.sendToPeer('offerOrAnswer', sdp);
      this.pc.setLocalDescription(sdp)
      .then(val => {
        console.log('local sdp set ', val);
      })
      .catch(error => {console.log('set local err ', error)});
    })
    .catch(error => {
      console.log('offer error', error);
    })
  }

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload
    })
  }

/*   setRemoteDescription = () => {
    const desc = JSON.parse(this.textref.value);
    this.pc.setRemoteDescription(new RTCSessionDescription(desc))
    .then(val => {
      console.log('remote desc set ', val);
    })
    .catch(error => {console.log('set remote err ', error)});
  } */
  createAnswer = () => {
    console.log('answer');
    this.pc.createAnswer({offerToReceiveVideo: 1, offerToReceiveAudio: 1})
    .then(sdp => {
      this.sendToPeer('offerOrAnswer', sdp);
      this.pc.setLocalDescription(sdp)
      .then(val => {
        console.log('local desc set ', val);
      })
      .catch(error => {console.log('set local err ', error)});
    })
    .catch(error => {
      console.log('answer error', error);
    }) 
  }

/*   addCandidate = () => {
    // const candidate = JSON.parse(this.textref.value);
    // console.log('adding candidate: ', candidate);
    // this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('candidates ', this.candidates);
    this.candidates.forEach(candidate => {
      console.log('candidate ', candidate);
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    })
  } */

  render() {

    return (
      <div>
    <video 
      style={{
        width: 240,
        height:240,
        margin: 5,
        backgroundColor: 'black'
      }}
      ref={this.localVidRef} autoPlay muted>
    
    </video>
    <video 
      style={{
        width: 240,
        height:240,
        margin: 5,
        backgroundColor: 'black'
      }}
      ref={this.remoteVidRef} autoPlay muted>
      
    </video>
    <br />
    <button onClick={this.createOffer}>Offer</button>
    <button onClick={this.createAnswer}>Answer</button>
    <br />
    {/* <textarea ref={ref => {this.textref = ref}} /> */}
    <br />
    {/* <button onClick={this.setRemoteDescription}>Set Remote Desc</button> */}
    {/* <button onClick={this.addCandidate}>Add Candidate</button> */}
    <br />
    </div>
    );
  }
  
}

export default App;
