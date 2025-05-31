// Initialize global objects
window.peerConnection = null;
window.localStream = null;
window.roomId = 'classroom1';
window.socket = null;

function initRTC(name, role) {
  try {
    // Initialize socket connection
    window.socket = io();
    
    // Add error handling for socket connection
    window.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      alert('Failed to connect to signaling server. Please refresh the page.');
    });

    window.socket.emit('join', {
      name: name,
      role: role,
      room: window.roomId
    });

    // Setup peer connection
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    window.peerConnection = new RTCPeerConnection(config);
    
    // Signal handling
    window.socket.on('signal', data => {
      if (data.sdp) {
        window.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
          .then(() => {
            if (data.sdp.type === 'offer') {
              return window.peerConnection.createAnswer();
            }
          })
          .then(answer => window.peerConnection.setLocalDescription(answer))
          .then(() => {
            window.socket.emit('signal', {
              sdp: window.peerConnection.localDescription,
              room: window.roomId
            });
          })
          .catch(console.error);
      } else if (data.candidate) {
        window.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(console.error);
      }
    });

    // ICE candidate handling
    window.peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate && window.socket) {
        window.socket.emit('signal', {
          candidate: candidate,
          room: window.roomId
        });
      }
    };

    // Remote stream handling
    window.peerConnection.ontrack = event => {
      document.getElementById('remoteScreen').srcObject = event.streams[0];
    };

    // Microphone setup
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        window.localStream = stream;
        stream.getTracks().forEach(track => {
          window.peerConnection.addTrack(track, stream);
        });
        
        // Initialize mic button state
        document.getElementById('micToggle').textContent = 'Mic: On';
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
      });
  } catch (error) {
    console.error('WebRTC initialization error:', error);
    alert('Failed to initialize WebRTC. Please try again.');
  }
}
window.socket.on('teacher_left', () => {
  alert('The teacher has left the classroom. You will be redirected.');
  leaveClass();
});

// Screen sharing function
function shareScreen() {
  navigator.mediaDevices.getDisplayMedia({ video: true })
    .then(stream => {
      const screenTrack = stream.getVideoTracks()[0];
      const sender = window.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
      
      if (sender) {
        sender.replaceTrack(screenTrack);
      } else {
        window.peerConnection.addTrack(screenTrack, stream);
      }
      
      return window.peerConnection.createOffer();
    })
    .then(offer => window.peerConnection.setLocalDescription(offer))
    .then(() => {
      window.socket.emit('signal', {
        sdp: window.peerConnection.localDescription,
        room: window.roomId
      });
    })
    .catch(error => {
      console.error('Screen sharing error:', error);
      if (error.name === 'NotAllowedError') {
        alert('Screen sharing permission denied.');
      }
    });
}