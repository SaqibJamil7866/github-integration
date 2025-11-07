# Quick Start - GitHub OAuth Integration

## 🚀 5-Minute Setup

### Step 1: Register GitHub OAuth App (2 minutes)

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: SRED.IO
   - **Homepage URL**: `http://localhost:4200`
   - **Callback URL**: `http://localhost:3000/api/integrations/github/callback`
4. Click "Register application"
5. Copy your **Client ID** and generate/copy **Client Secret**

### Step 2: Configure Backend (1 minute)

Edit `backend/.env`:

```env
GITHUB_CLIENT_ID=paste_your_client_id_here
GITHUB_CLIENT_SECRET=paste_your_client_secret_here
```

### Step 3: Install & Start (2 minutes)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Step 4: Test It! (30 seconds)

1. Open: http://localhost:4200/integrations
2. Click "Connect GitHub"
3. Authorize on GitHub
4. See your connected status! ✅

## ✅ What You Get

- ✅ OAuth 2.0 authentication with GitHub
- ✅ User info stored in MongoDB
- ✅ Persistent connection status
- ✅ Green checkmark when connected
- ✅ Display connection date
- ✅ Show GitHub user details (avatar, name, repos, followers)
- ✅ Disconnect functionality
- ✅ Auto-refresh on page reload

## 📁 What Was Created

### Backend Files
```
backend/
├── models/integration.model.js          # MongoDB schema
├── controllers/integration.controller.js # OAuth logic
├── routes/integration.routes.js         # API routes
└── .env                                 # Config (YOU EDIT THIS)
```

### Frontend Files
```
frontend/src/app/
├── services/integration.service.ts                    # API service
├── components/integrations/
│   ├── integrations.component.ts                     # Component logic
│   ├── integrations.component.html                   # UI template
│   └── integrations.component.scss                   # Styles
└── app.routes.ts                                     # Routing
```

## 🎯 Key Endpoints

| URL | Description |
|-----|-------------|
| `http://localhost:4200/integrations` | Integrations page |
| `http://localhost:3000/api/integrations/github/auth` | Get auth URL |
| `http://localhost:3000/api/integrations/status/:userId` | Check status |

## 🔧 Common Commands

```bash
# Kill port 3000 if in use
cd backend && npm run kill-port

# Test MongoDB connection
cd backend && npm run test-mongo

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm start
```

## 📊 Database

Collection: `github-integration`

View data:
```bash
mongosh
use sred_db
db['github-integration'].find().pretty()
```

## 🐛 Troubleshooting

**"GitHub OAuth not configured"**
→ Add GITHUB_CLIENT_ID to `backend/.env`

**"redirect_uri_mismatch"**
→ Check callback URL in GitHub app settings

**Connection not persisting**
→ Ensure MongoDB is running

**CORS errors**
→ Restart both backend and frontend

## 📖 Full Documentation

See `GITHUB_OAUTH_SETUP.md` for complete documentation.

---

**That's it! Your GitHub OAuth integration is ready! 🎉**

