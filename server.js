const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const snippetRoutes = require('./routes/snippets');
const commentRoutes = require('./routes/comments');

const app = express();

// Security headers
app.use(helmet({
    contentSecurityPolicy: false // CodeMirror CDN load aaga false pannuvom
}));

// Rate limiting - overall
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per 15 mins
    message: { message: 'Too many requests, please try again later.' }
});

// Rate limiting - auth routes (strict)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // max 10 login/register attempts
    message: { message: 'Too many attempts, please try again later.' }
});

// Middlewares
app.use(globalLimiter);
app.use(cors());
app.use(express.json({ limit: '10kb' })); // payload size limit
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/comments', commentRoutes);

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
app.listen(PORT, () => {
    console.log(`CodeHive server running on http://localhost:${PORT}`);
});