const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const snippetRoutes = require('./routes/snippets');
const commentRoutes = require('./routes/comments');

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Security headers
app.use(helmet({
    contentSecurityPolicy: false
}));

// Rate limiting - overall
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later.' }
});

// Rate limiting - auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts, please try again later.' }
});

// Middlewares
app.use(globalLimiter);
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/comments', commentRoutes);

// Track rooms and users
const rooms = {};

// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a snippet room
    socket.on('join-room', ({ snippetId, username }) => {
        const room = `snippet-${snippetId}`;
        socket.join(room);

        // Track users in room
        if (!rooms[room]) rooms[room] = {};
        rooms[room][socket.id] = username;

        // Tell everyone in room who joined
        io.to(room).emit('room-users', Object.values(rooms[room]));
        socket.to(room).emit('user-joined', username);

        console.log(`${username} joined room ${room}`);
    });

    // Sync code changes
    socket.on('code-change', ({ snippetId, type, value }) => {
        const room = `snippet-${snippetId}`;
        // Broadcast to everyone else in room
        socket.to(room).emit('code-update', { type, value });
    });

    // Cursor position
    socket.on('cursor-move', ({ snippetId, username, line, ch }) => {
        const room = `snippet-${snippetId}`;
        socket.to(room).emit('cursor-update', { username, line, ch });
    });

    // Disconnect
    socket.on('disconnect', () => {
        // Remove user from all rooms
        for (const room in rooms) {
            if (rooms[room][socket.id]) {
                const username = rooms[room][socket.id];
                delete rooms[room][socket.id];
                io.to(room).emit('room-users', Object.values(rooms[room]));
                io.to(room).emit('user-left', username);

                // Clean empty rooms
                if (Object.keys(rooms[room]).length === 0) {
                    delete rooms[room];
                }
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`CodeHive server running on http://localhost:${PORT}`);
});