# CodeHive 🐝

> A community platform for students to write, share, and explore HTML/CSS/JS code snippets with live preview.

## 🔗 Live Demo
**[https://codehive-d1ip.onrender.com](https://codehive-d1ip.onrender.com)**

## 💡 Problem
Developers and students have no dedicated platform to write, test, and share code snippets with a community.

## ✅ Solution
CodeHive lets students write HTML/CSS/JS code, see a live preview instantly, and share it with the community — all in one place.

## 🚀 Features
- 🔐 Register & Login with JWT Authentication + Bcrypt password hashing
- ✏️ HTML/CSS/JS Code Editor with Syntax Highlighting (CodeMirror)
- ⚡ Live Preview using iframe — updates as you type
- 💾 Save & Share Snippets with a public link
- 🌍 Community Feed with Search functionality
- ❤️ Like & Unlike Snippets
- 💬 Comment System with delete option
- 🍴 Fork Snippets — copy and edit others' code
- ✏️ Edit & Delete your own Snippets
- 👤 User Profile Page — manage all your snippets
- 🤖 AI Code Explainer powered by Google Gemini API
- 📱 Mobile Responsive Design

## 🛠️ Tech Stack
| Part | Tech |
|------|------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT + Bcrypt |
| Code Editor | CodeMirror |
| AI | Google Gemini API |
| Deployment | Render + Railway MySQL |

## 📁 Project Structure
CodeHive/

├── public/

│   ├── index.html       # Landing page

│   ├── editor.html      # Code editor

│   ├── feed.html        # Community feed

│   ├── snippet.html     # Snippet view

│   ├── profile.html     # User profile

│   ├── login.html       # Login page

│   ├── register.html    # Register page

│   └── style.css        # Global styles

├── routes/

│   ├── auth.js          # Register & Login routes

│   ├── snippets.js      # Snippet CRUD + AI explainer

│   └── comments.js      # Comment routes

├── config/

│   └── db.js            # MySQL connection pool

├── server.js            # Express server entry point

└── .env                 # Environment variables

## ⚙️ Local Setup

```bash
# Clone the repo
git clone https://github.com/varshnav/CodeHive.git
cd Code

## 🗄️ Database Schema
| Table | Purpose |
|-------|---------|
| users | Store user accounts |
| snippets | Store code snippets |
| likes | Track snippet likes |
| comments | Store comments |

## 🌐 Deployment
- **Backend:** Render (Node.js Web Service)
- **Database:** Railway MySQL
