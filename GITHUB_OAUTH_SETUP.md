# GitHub OAuth Integration Setup Guide

Complete guide to set up GitHub OAuth authentication in your SRED.IO application.

## Table of Contents
1. [Overview](#overview)
2. [GitHub OAuth App Registration](#github-oauth-app-registration)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Testing the Integration](#testing-the-integration)
6. [Troubleshooting](#troubleshooting)

## Overview

This application implements GitHub OAuth 2.0 authentication to connect user GitHub accounts. The flow:

1. User clicks "Connect GitHub" button
2. User is redirected to GitHub for authorization
3. GitHub redirects back to our backend callback URL with authorization code
4. Backend exchanges code for access token
5. Backend fetches user information and stores in MongoDB
6. User is redirected back to frontend with success status
7. Frontend displays connected status with green checkmark

## GitHub OAuth App Registration

### Step 1: Create a GitHub OAuth App

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Or: GitHub → Settings → Developer settings → OAuth Apps

2. **Click "New OAuth App"**

3. **Fill in the Application Details:**
   ```
   Application name: SRED.IO (or your preferred name)
   Homepage URL: http://localhost:4200
   Application description: Your application description (optional)
   Authorization callback URL: http://localhost:3000/api/integrations/github/callback
   ```

4. **Click "Register application"**

5. **Get Your Credentials:**
   - **Client ID**: You'll see this immediately
   - **Client Secret**: Click "Generate a new client secret"
   - ⚠️ **IMPORTANT**: Copy the client secret immediately - you won't be able to see it again!

### Step 2: Save Your Credentials

Keep your Client ID and Client Secret safe. You'll need them in the next step.

## Backend Configuration

### 1. Update Environment Variables

Edit `backend/.env` file and add your GitHub OAuth credentials:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sred_db
NODE_ENV=development

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_actual_github_client_id
GITHUB_CLIENT_SECRET=your_actual_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/integrations/github/callback

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

**Replace:**
- `your_actual_github_client_id` with your actual GitHub Client ID
- `your_actual_github_client_secret` with your actual GitHub Client Secret

### 2. Verify Backend Files

Ensure these files exist (they should already be created):
- ✅ `backend/models/integration.model.js`
- ✅ `backend/controllers/integration.controller.js`
- ✅ `backend/routes/integration.routes.js`
- ✅ `backend/app.js` (with integration routes imported)

### 3. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- axios (for GitHub API calls)
- All other required packages

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
MongoDB connected successfully
Server is running on http://localhost:3000
```

### 5. Test Backend Endpoints

```bash
# Test health check
curl http://localhost:3000/health

# Test auth URL generation (replace USER_ID)
curl "http://localhost:3000/api/integrations/github/auth?userId=demo-user-123"
```

## Frontend Configuration

### 1. Environment Files

Frontend is already configured to use:
- Development: `http://localhost:3000/api`
- Production: `/api`

Files:
- `frontend/src/app/environments/environment.ts` (development)
- `frontend/src/app/environments/environment.prod.ts` (production)

### 2. Verify Frontend Files

Ensure these files exist (they should already be created):
- ✅ `frontend/src/app/services/integration.service.ts`
- ✅ `frontend/src/app/components/integrations/integrations.component.ts`
- ✅ `frontend/src/app/components/integrations/integrations.component.html`
- ✅ `frontend/src/app/components/integrations/integrations.component.scss`
- ✅ `frontend/src/app/app.routes.ts` (with integrations route)

### 3. Start Frontend

```bash
cd frontend
npm start
```

Frontend will be available at `http://localhost:4200`

## Testing the Integration

### Step 1: Open the Application

Navigate to: http://localhost:4200/integrations

You should see the Integrations page with a GitHub card.

### Step 2: Connect GitHub

1. Click the **"Connect GitHub"** button
2. You'll be redirected to GitHub's authorization page
3. Review the permissions requested
4. Click **"Authorize"**
5. You'll be redirected back to your application
6. Success message will appear: "GitHub connected successfully!"

### Step 3: Verify Connection

After successful connection, you should see:
- ✅ Green checkmark icon
- Your GitHub avatar
- Your GitHub username and display name
- Connection date
- Repository count, followers, location (if public)

### Step 4: Test Persistence

1. Refresh the page (F5)
2. The connection status should persist
3. You should still see the green checkmark and connected state

### Step 5: Verify Database

Check MongoDB to confirm data storage:

```bash
# Connect to MongoDB
mongosh

# Use your database
use sred_db

# View integrations
db['github-integration'].find().pretty()
```

You should see your integration data stored.

## OAuth Flow Diagram

```
┌─────────┐         ┌──────────┐         ┌────────┐         ┌──────────┐
│         │         │          │         │        │         │          │
│ Browser │────────▶│ Frontend │────────▶│Backend │────────▶│  GitHub  │
│         │   1     │          │   2     │        │   3     │          │
└─────────┘         └──────────┘         └────────┘         └──────────┘
     ▲                                         │                   │
     │                                         │                   │
     │                    7                    │        4          │
     └─────────────────────────────────────────┴───────────────────┘
                                               │                   │
                                          5    │                   │
                                         ┌─────▼──────┐            │
                                         │            │      6     │
                                         │  MongoDB   │◀───────────┘
                                         │            │
                                         └────────────┘

1. User clicks "Connect GitHub"
2. Frontend requests auth URL from backend
3. Backend generates GitHub OAuth URL
4. User authorizes on GitHub
5. GitHub sends callback to backend
6. Backend exchanges code for token & fetches user data
7. Backend stores in MongoDB & redirects to frontend with success
```

## API Endpoints

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/integrations/github/auth` | GET | Get GitHub OAuth authorization URL |
| `/api/integrations/github/callback` | GET | Handle GitHub OAuth callback |
| `/api/integrations/status/:userId` | GET | Get integration status for user |
| `/api/integrations/:userId` | GET | Get all integrations for user |
| `/api/integrations/:userId/:provider` | DELETE | Disconnect integration |

### Example Requests

**Get Auth URL:**
```bash
curl "http://localhost:3000/api/integrations/github/auth?userId=demo-user-123"
```

**Get Integration Status:**
```bash
curl "http://localhost:3000/api/integrations/status/demo-user-123?provider=github"
```

**Disconnect GitHub:**
```bash
curl -X DELETE "http://localhost:3000/api/integrations/demo-user-123/github"
```

## Database Schema

### Collection: `github-integration`

```javascript
{
  userId: String,              // Your app's user ID
  provider: String,            // 'github', 'gitlab', etc.
  providerUserId: String,      // GitHub user ID
  username: String,            // GitHub username
  email: String,               // GitHub email
  displayName: String,         // GitHub display name
  avatarUrl: String,           // GitHub avatar URL
  accessToken: String,         // OAuth access token (encrypted)
  refreshToken: String,        // Refresh token (if available)
  tokenType: String,           // 'bearer'
  scope: String,               // Granted scopes
  profileUrl: String,          // GitHub profile URL
  connectedAt: Date,           // When connected
  lastSyncedAt: Date,          // Last sync timestamp
  status: String,              // 'active', 'inactive', 'expired'
  metadata: Object,            // Additional GitHub data
  createdAt: Date,             // Auto-generated
  updatedAt: Date              // Auto-generated
}
```

## Troubleshooting

### Issue 1: "GitHub OAuth not configured"

**Error:** Backend returns error about missing GITHUB_CLIENT_ID

**Solution:**
1. Check `backend/.env` file
2. Ensure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set
3. Restart backend server: `npm run dev`

### Issue 2: "Redirect URI Mismatch"

**Error:** GitHub shows "redirect_uri_mismatch" error

**Solution:**
1. Go to your GitHub OAuth App settings
2. Verify Authorization callback URL is: `http://localhost:3000/api/integrations/github/callback`
3. Make sure there are no trailing slashes
4. Ensure GITHUB_CALLBACK_URL in `.env` matches exactly

### Issue 3: Connection Doesn't Persist

**Error:** After refresh, connection status is lost

**Solution:**
1. Check MongoDB is running
2. Verify MongoDB connection in backend logs
3. Check browser console for errors
4. Verify userId is consistent (currently using `demo-user-123`)

### Issue 4: CORS Errors

**Error:** CORS policy blocking requests

**Solution:**
1. Ensure backend is running on port 3000
2. Ensure frontend is running on port 4200
3. Check `backend/app.js` has `cors()` middleware
4. Restart both servers

### Issue 5: "MongoServerError: E11000 duplicate key error"

**Error:** Cannot create integration, duplicate key

**Solution:**
1. An integration already exists for this user
2. The code handles this with `findOrCreate`, but if you see errors:
```bash
# Clear existing integrations
mongosh
use sred_db
db['github-integration'].deleteMany({userId: 'demo-user-123'})
```

## Security Considerations

### Production Deployment

When deploying to production:

1. **Use HTTPS everywhere**
   ```env
   GITHUB_CALLBACK_URL=https://yourdomain.com/api/integrations/github/callback
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Update GitHub OAuth App**
   - Change Homepage URL to your production domain
   - Change Authorization callback URL to your production API endpoint

3. **Secure Environment Variables**
   - Never commit `.env` file to git
   - Use secure environment variable management
   - Rotate secrets regularly

4. **Encrypt Access Tokens**
   - Consider encrypting access tokens in database
   - Use database-level encryption
   - Implement token refresh mechanism

5. **Add Authentication**
   - Currently uses `demo-user-123` as userId
   - Implement proper user authentication
   - Get userId from authenticated session/JWT

6. **Rate Limiting**
   - Add rate limiting to API endpoints
   - Protect against abuse

## User ID Management

Currently, the application uses a hardcoded userId (`demo-user-123`). In production:

### Implement Proper User Authentication:

1. Add authentication service (JWT, OAuth, etc.)
2. Get userId from authenticated user session
3. Update `IntegrationsComponent`:

```typescript
// Replace
userId = 'demo-user-123';

// With
constructor(private authService: AuthService) {
  this.userId = this.authService.getCurrentUserId();
}
```

## Next Steps

1. ✅ Register GitHub OAuth App
2. ✅ Configure backend `.env` with credentials
3. ✅ Start MongoDB, backend, and frontend
4. ✅ Test the integration flow
5. ✅ Verify data persistence
6. 🚀 Implement proper user authentication
7. 🚀 Add more integration providers (GitLab, Bitbucket)
8. 🚀 Implement token refresh mechanism
9. 🚀 Add webhook support for real-time updates

## Support

If you encounter issues:
1. Check backend logs: `npm run dev` output
2. Check frontend console: Browser DevTools → Console
3. Check MongoDB: `mongosh` and query the collection
4. Verify all environment variables are set correctly
5. Ensure all services are running (MongoDB, Backend, Frontend)

## Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [OAuth 2.0 Specification](https://oauth.net/2/)

---

**Your GitHub OAuth integration is now ready to use!** 🎉

