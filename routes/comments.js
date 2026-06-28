const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware - verify JWT token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. Please login.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
}

// GET ALL COMMENTS FOR A SNIPPET
router.get('/:snippetId', async (req, res) => {
    try {
        const [comments] = await db.query(
            `SELECT comments.id, comments.comment, comments.created_at,
            users.username
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.snippet_id = ?
            ORDER BY comments.created_at ASC`,
            [req.params.snippetId]
        );

        res.json(comments);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ADD COMMENT
router.post('/:snippetId', verifyToken, async (req, res) => {
    try {
        const { comment } = req.body;

        if (!comment || comment.trim() === '') {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        await db.query(
            'INSERT INTO comments (user_id, snippet_id, comment) VALUES (?, ?, ?)',
            [req.user.id, req.params.snippetId, comment.trim()]
        );

        res.status(201).json({ message: 'Comment added' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE COMMENT
router.delete('/:commentId', verifyToken, async (req, res) => {
    try {
        // Only comment owner can delete
        const [comment] = await db.query(
            'SELECT id FROM comments WHERE id = ? AND user_id = ?',
            [req.params.commentId, req.user.id]
        );

        if (comment.length === 0) {
            return res.status(403).json({ message: 'Not allowed' });
        }

        await db.query('DELETE FROM comments WHERE id = ?', [req.params.commentId]);

        res.json({ message: 'Comment deleted' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;