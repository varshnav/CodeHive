const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
require('dotenv').config();

// Setup DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Sanitize code helper
function sanitizeCode(code) {
    if (!code) return '';
    return DOMPurify.sanitize(code, {
        FORCE_BODY: true,
        ALLOW_UNKNOWN_PROTOCOLS: true
    });
}

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

// SAVE NEW SNIPPET
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, html_code, css_code, js_code, is_public } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ message: 'Title is required' });
        }

        if (title.length > 100) {
            return res.status(400).json({ message: 'Title must be under 100 characters' });
        }

        const sanitizedHtml = sanitizeCode(html_code);
        const sanitizedCss = sanitizeCode(css_code);
        const sanitizedJs = sanitizeCode(js_code);

        const [result] = await db.query(
            'INSERT INTO snippets (user_id, title, html_code, css_code, js_code, is_public) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, title.trim(), sanitizedHtml, sanitizedCss, sanitizedJs, is_public ?? true]
        );

        res.status(201).json({
            message: 'Snippet saved successfully',
            snippetId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET ALL PUBLIC SNIPPETS (for feed)
router.get('/feed', async (req, res) => {
    try {
        const [snippets] = await db.query(
            `SELECT snippets.id, snippets.title, snippets.created_at, snippets.is_public,
            users.username,
            COUNT(DISTINCT likes.id) as like_count,
            COUNT(DISTINCT comments.id) as comment_count
            FROM snippets
            JOIN users ON snippets.user_id = users.id
            LEFT JOIN likes ON snippets.id = likes.snippet_id
            LEFT JOIN comments ON snippets.id = comments.snippet_id
            WHERE snippets.is_public = true
            GROUP BY snippets.id
            ORDER BY snippets.created_at DESC`
        );

        res.json(snippets);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// AI CODE EXPLAINER - Gemini
router.post('/explain', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'No code provided' });
        }

        let attempts = 0;
        let data;
        let response;

        while (attempts < 3) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a helpful coding teacher. Explain the following HTML, CSS, and JavaScript code in simple English. Be beginner friendly, clear, and concise.\n\n${code}`
                        }]
                    }]
                })
            });

            data = await response.json();

            if (response.ok) break;

            if (data.error && data.error.code === 503) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                break;
            }
        }

        if (!response.ok) {
            console.error('Gemini API error:', data);
            return res.status(500).json({ message: 'AI explanation failed. Try again!' });
        }

        const explanation = data.candidates[0].content.parts[0].text;
        res.json({ explanation });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET SINGLE SNIPPET BY ID
router.get('/:id', async (req, res) => {
    try {
        const [snippets] = await db.query(
            `SELECT snippets.*, users.username,
            COUNT(DISTINCT likes.id) as like_count,
            COUNT(DISTINCT comments.id) as comment_count
            FROM snippets
            JOIN users ON snippets.user_id = users.id
            LEFT JOIN likes ON snippets.id = likes.snippet_id
            LEFT JOIN comments ON snippets.id = comments.snippet_id
            WHERE snippets.id = ?
            GROUP BY snippets.id`,
            [req.params.id]
        );

        if (snippets.length === 0) {
            return res.status(404).json({ message: 'Snippet not found' });
        }

        res.json(snippets[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET MY SNIPPETS
router.get('/my/snippets', verifyToken, async (req, res) => {
    try {
        const [snippets] = await db.query(
            `SELECT snippets.*, 
            COUNT(DISTINCT likes.id) as like_count,
            COUNT(DISTINCT comments.id) as comment_count
            FROM snippets
            LEFT JOIN likes ON snippets.id = likes.snippet_id
            LEFT JOIN comments ON snippets.id = comments.snippet_id
            WHERE snippets.user_id = ?
            GROUP BY snippets.id
            ORDER BY snippets.created_at DESC`,
            [req.user.id]
        );

        res.json(snippets);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// LIKE / UNLIKE SNIPPET
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const snippetId = req.params.id;
        const userId = req.user.id;

        const [existing] = await db.query(
            'SELECT id FROM likes WHERE user_id = ? AND snippet_id = ?',
            [userId, snippetId]
        );

        if (existing.length > 0) {
            await db.query(
                'DELETE FROM likes WHERE user_id = ? AND snippet_id = ?',
                [userId, snippetId]
            );
            return res.json({ message: 'Unliked', liked: false });
        }

        await db.query(
            'INSERT INTO likes (user_id, snippet_id) VALUES (?, ?)',
            [userId, snippetId]
        );

        res.json({ message: 'Liked', liked: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE SNIPPET
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [snippet] = await db.query(
            'SELECT id FROM snippets WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (snippet.length === 0) {
            return res.status(403).json({ message: 'Not allowed' });
        }

        await db.query('DELETE FROM snippets WHERE id = ?', [req.params.id]);

        res.json({ message: 'Snippet deleted' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// EDIT SNIPPET
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { title, html_code, css_code, js_code, is_public } = req.body;

        const [snippet] = await db.query(
            'SELECT id FROM snippets WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (snippet.length === 0) {
            return res.status(403).json({ message: 'Not allowed' });
        }

        const sanitizedHtml = sanitizeCode(html_code);
        const sanitizedCss = sanitizeCode(css_code);
        const sanitizedJs = sanitizeCode(js_code);

        await db.query(
            'UPDATE snippets SET title=?, html_code=?, css_code=?, js_code=?, is_public=? WHERE id=?',
            [title, sanitizedHtml, sanitizedCss, sanitizedJs, is_public ?? true, req.params.id]
        );

        res.json({ message: 'Snippet updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// FORK SNIPPET
router.post('/:id/fork', verifyToken, async (req, res) => {
    try {
        const [snippets] = await db.query(
            'SELECT * FROM snippets WHERE id = ?',
            [req.params.id]
        );

        if (snippets.length === 0) {
            return res.status(404).json({ message: 'Snippet not found' });
        }

        const original = snippets[0];

        const [result] = await db.query(
            'INSERT INTO snippets (user_id, title, html_code, css_code, js_code, is_public) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, `Fork of ${original.title}`, original.html_code, original.css_code, original.js_code, true]
        );

        res.status(201).json({
            message: 'Snippet forked!',
            snippetId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;