// Toggle microphone
document.getElementById('micToggle').addEventListener('click', function() {
  if(window.localStream) {
    const audioTrack = window.localStream.getAudioTracks()[0];
    if(audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.textContent = audioTrack.enabled ? 'Mic: On' : 'Mic: Off';
    }
  }
});

// Screen sharing
document.getElementById('shareScreenBtn').addEventListener('click', shareScreen);

document.getElementById('leaveBtn').addEventListener('click', leaveClass);

  // Close peer connection
  function leaveClass() {
    try {
      // Close peer connection
      if (window.peerConnection) {
        window.peerConnection.close();
        window.peerConnection = null;
      }
      
      // Stop all media tracks
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
        window.localStream = null;
      }
      
      // Clear remote video
      const remoteVideo = document.getElementById('remoteScreen');
      if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
      }
      
      // Disconnect socket
      if (window.socket) {
        window.socket.emit('leave', { room: window.roomId });
        window.socket.disconnect();
        window.socket = null;
      }
      
      // Redirect to login page
      window.location.href = '/index.html';
    } catch (error) {
      console.error('Error leaving class:', error);
      window.location.href = '/index.html';
    }
  }
// Chat functionality
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', e => {
  if(e.key === 'Enter') sendMessage();
});

function sendMessage() {
  if (!window.socket) return;
  
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  
  if(text) {
    window.socket.emit('message', {
      text: text,
      room: window.roomId
    });
    input.value = '';
  }
}

// Handle incoming messages
function setupSocketListeners() {
  if (window.socket) {
    window.socket.on('message', data => {
      const messages = document.querySelector('.messages');
      const isOwn = data.name === window.userName;
      
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      if(isOwn) messageElement.classList.add('own');
      
      messageElement.innerHTML = `
        <div class="name">${data.name}</div>
        <div class="text">${data.text}</div>
        <div class="timestamp">${new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      `;
      
      messages.appendChild(messageElement);
      messages.scrollTop = messages.scrollHeight;
    });

    window.socket.on('teacher_left', () => {
      alert('The teacher has left the classroom. You will be redirected.');
      leaveClass();
    });
  }
}

// Initialize socket listeners
const initInterval = setInterval(() => {
  if (window.socket) {
    clearInterval(initInterval);
    setupSocketListeners();
  }
}, 100);
