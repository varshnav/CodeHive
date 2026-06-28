# CodeHive 🐝

A community platform for students to write, share, and explore HTML/CSS/JS code snippets with live preview.

## 🔗 Live Demo
[CodeHive Live](https://codehive.onrender.com)

## 🚀 Features
- ✅ Register & Login with JWT Authentication
- ✅ HTML/CSS/JS Code Editor with Syntax Highlighting (CodeMirror)
- ✅ Live Preview using iframe
- ✅ Save & Share Snippets publicly
- ✅ Community Feed with Search
- ✅ Like & Comment System
- ✅ AI Code Explainer (Gemini API)
- ✅ Fork Snippets
- ✅ Edit & Delete Snippets
- ✅ User Profile Page

## 🛠️ Tech Stack
| Part | Tech |
|------|------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT + Bcrypt |
| Editor | CodeMirror |
| AI | Google Gemini API |
| Deploy | Render + Railway |

## 📁 Project Structure
## ⚙️ Local Setup
```bash
# Clone the repo
git clone https://github.com/varshnav/CodeHive.git
cd CodeHive

# Install dependencies
npm install

# Create .env file
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=codehive
JWT_SECRET=your_secret
PORT=3000
GEMINI_API_KEY=your_gemini_key

# Run the server
npm run dev
```

## 🗄️ Database Tables
- `users` — Login/Register
- `snippets` — Code storage
- `likes` — Like system
- `comments` — Comment system
