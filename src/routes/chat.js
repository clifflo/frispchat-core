const express = require('express');
const { getDb } = require('../models/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms - list all rooms
router.get('/rooms', authenticateToken, (req, res) => {
  const db = getDb();
  const rooms = db.prepare('SELECT id, name, created_at FROM rooms').all();
  return res.json({ rooms });
});

// GET /api/rooms/:roomId/messages - get messages for a room
router.get('/rooms/:roomId/messages', authenticateToken, (req, res) => {
  const { roomId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before ? parseInt(req.query.before) : null;

  const db = getDb();

  const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  let rows;
  if (before) {
    rows = db
      .prepare(
        `SELECT m.id, m.content, m.created_at, u.username
         FROM messages m
         JOIN users u ON u.id = m.user_id
         WHERE m.room_id = ? AND m.id < ?
         ORDER BY m.id DESC
         LIMIT ?`
      )
      .all(roomId, before, limit);
  } else {
    rows = db
      .prepare(
        `SELECT m.id, m.content, m.created_at, u.username
         FROM messages m
         JOIN users u ON u.id = m.user_id
         WHERE m.room_id = ?
         ORDER BY m.id DESC
         LIMIT ?`
      )
      .all(roomId, limit);
  }

  return res.json({ messages: rows.reverse() });
});

module.exports = router;
