const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Login endpoint
app.post('/login', (req, res) => {
  if(req.body.username === 'Youruser' && req.body.password === 'Yourpassword') {
    res.redirect('/app.html');
  } else {
    res.redirect('/?error=1');
  }
});

// WebRTC signaling
io.on('connection', (socket) => {
  socket.on('join', (data) => {
    socket.join(data.room);
    socket.role = data.role;
    socket.name = data.name;
    
    if(data.role === 'teacher') {
      io.to(data.room).emit('teacher_joined', { name: data.name });
    }
  });
  socket.on('leave', (data) => {
    if (data.room) {
      socket.leave(data.room);
    }
  });
  socket.on('disconnect', () => {
    if (socket.role === 'teacher') {
      socket.to(socket.room).emit('teacher_left');
    }
  });

  socket.on('signal', (data) => {
    socket.to(data.room).emit('signal', data);
  });

  socket.on('message', (data) => {
    io.to(data.room).emit('message', {
      name: socket.name,
      text: data.text,
      timestamp: new Date()
    });
  });
});

server.listen(3000, () => {
  console.log('Server running on http://danielcreux:3000');
});