const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createApp } = require('./src/app');
const { getDb } = require('./src/models/db');
const { JWT_SECRET } = require('./src/middleware/auth');

const PORT = process.env.PORT || 3000;

const app = createApp();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : false,
    methods: ['GET', 'POST'],
  },
});

// Socket.io JWT authentication middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth && socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);

  // Join a room
  socket.on('join_room', (roomId) => {
    const db = getDb();
    const room = db.prepare('SELECT id, name FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    socket.join(`room:${roomId}`);
    socket.emit('joined_room', { roomId: room.id, roomName: room.name });
    console.log(`${socket.user.username} joined room ${room.name}`);
  });

  // Leave a room
  socket.on('leave_room', (roomId) => {
    socket.leave(`room:${roomId}`);
  });

  // Send a message
  socket.on('send_message', ({ roomId, content }) => {
    if (!content || typeof content !== 'string' || content.trim() === '') {
      socket.emit('error', { message: 'Message content cannot be empty' });
      return;
    }

    const trimmedContent = content.trim().slice(0, 2000);

    const db = getDb();
    const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const result = db
      .prepare('INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)')
      .run(roomId, socket.user.id, trimmedContent);

    const message = {
      id: result.lastInsertRowid,
      roomId,
      content: trimmedContent,
      username: socket.user.username,
      created_at: new Date().toISOString(),
    };

    io.to(`room:${roomId}`).emit('new_message', message);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

server.listen(PORT, () => {
  console.log(`FrispChat server running at http://localhost:${PORT}`);
});

module.exports = { server, io };
