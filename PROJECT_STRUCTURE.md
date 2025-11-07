# SRED.IO Project Structure

Complete overview of the project structure and all components.

## 📁 Root Directory Structure

```
sred.io/
├── backend/                          # Node.js/Express API Server
├── frontend/                         # Angular v19 Application
├── README.md                         # Main project documentation
├── GITHUB_OAUTH_SETUP.md            # GitHub OAuth setup guide
├── QUICK_START_OAUTH.md             # Quick start for OAuth
├── PROJECT_STRUCTURE.md             # This file
├── START.md                         # Quick start guide
├── package.json                     # Root npm scripts
└── .gitignore                       # Git ignore rules
```

## 🔙 Backend Structure (Node.js + Express + MongoDB)

```
backend/
├── app.js                           # Main Express application
├── package.json                     # Backend dependencies
├── .env                            # Environment variables (create this!)
├── .env.example                    # Environment template
├── .gitignore                      # Backend git ignore
├── README.md                       # Backend documentation
├── MONGODB_SETUP.md               # MongoDB setup guide
│
├── controllers/                    # Request handlers
│   ├── example.controller.js      # Example CRUD operations
│   └── integration.controller.js  # GitHub OAuth controller
│
├── models/                        # MongoDB/Mongoose models
│   ├── example.model.js          # Example schema
│   └── integration.model.js      # Integration schema (github-integration)
│
├── routes/                        # API route definitions
│   ├── example.routes.js         # Example API routes
│   └── integration.routes.js     # Integration API routes
│
├── helpers/                       # Utility functions
│   ├── response.helper.js        # API response helpers
│   └── validation.helper.js      # Validation helpers
│
└── scripts/                       # Utility scripts
    ├── kill-port.js              # Kill process on port 3000
    └── test-mongo.js             # Test MongoDB connection
```

### Backend API Endpoints

```
Health & Status:
  GET  /                           # Welcome message
  GET  /health                     # Health check

Examples (Demo):
  GET    /api/examples             # Get all examples
  GET    /api/examples/:id         # Get example by ID
  POST   /api/examples             # Create example
  PUT    /api/examples/:id         # Update example
  DELETE /api/examples/:id         # Delete example

GitHub OAuth Integration:
  GET    /api/integrations/github/auth              # Get OAuth URL
  GET    /api/integrations/github/callback          # OAuth callback
  GET    /api/integrations/status/:userId           # Get status
  GET    /api/integrations/:userId                  # Get all integrations
  DELETE /api/integrations/:userId/:provider        # Disconnect
```

### Backend Technologies

- **Runtime**: Node.js v22
- **Framework**: Express.js v4
- **Database**: MongoDB with Mongoose v8
- **HTTP Client**: Axios v1.6
- **Environment**: dotenv v16
- **CORS**: cors v2.8
- **Dev Tools**: nodemon v3

## 🎨 Frontend Structure (Angular v19 + Material)

```
frontend/
├── angular.json                    # Angular CLI configuration
├── package.json                    # Frontend dependencies
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json              # App TypeScript config
├── README.md                       # Frontend documentation
│
├── src/
│   ├── index.html                 # Main HTML file
│   ├── main.ts                    # Application entry point
│   ├── styles.scss                # Global styles
│   │
│   └── app/
│       ├── app.component.ts       # Root component
│       ├── app.component.html     # Root template
│       ├── app.component.scss     # Root styles
│       ├── app.config.ts          # App configuration
│       ├── app.routes.ts          # Route definitions
│       │
│       ├── components/            # Feature components
│       │   └── integrations/     # Integrations feature
│       │       ├── integrations.component.ts
│       │       ├── integrations.component.html
│       │       └── integrations.component.scss
│       │
│       ├── services/             # Application services
│       │   ├── api.service.ts   # Generic API service
│       │   └── integration.service.ts  # Integration service
│       │
│       └── environments/         # Environment configs
│           ├── environment.ts    # Development config
│           └── environment.prod.ts  # Production config
│
└── public/                       # Static assets
    └── favicon.ico
```

### Frontend Routes

```
/                        → Redirects to /integrations
/integrations           → GitHub integration page
```

### Frontend Technologies

- **Framework**: Angular v19 (Standalone components)
- **UI Library**: Angular Material v19 (Azure Blue theme)
- **Styling**: SCSS
- **HTTP**: HttpClient
- **Router**: Angular Router
- **State**: RxJS BehaviorSubject

### Material Components Used

- MatToolbarModule - Top navigation bar
- MatCardModule - Card containers
- MatButtonModule - Buttons
- MatIconModule - Material icons
- MatChipsModule - Status chips
- MatProgressSpinnerModule - Loading spinners
- MatSnackBarModule - Toast notifications

## 🗄️ Database Structure

### MongoDB Database: `sred_db`

#### Collection: `github-integration`

```javascript
{
  _id: ObjectId,                  // Auto-generated
  userId: String,                 // App user identifier
  provider: String,               // "github", "gitlab", etc.
  providerUserId: String,         // GitHub user ID
  username: String,               // GitHub username (@username)
  email: String,                  // GitHub email
  displayName: String,            // Full name
  avatarUrl: String,              // Profile picture URL
  accessToken: String,            // OAuth access token
  refreshToken: String,           // Refresh token (if any)
  tokenType: String,              // "bearer"
  scope: String,                  // "user:email,repo"
  profileUrl: String,             // GitHub profile URL
  connectedAt: Date,              // Connection timestamp
  lastSyncedAt: Date,             // Last sync timestamp
  status: String,                 // "active", "inactive", "expired"
  metadata: {                     // Additional GitHub data
    bio: String,
    company: String,
    location: String,
    publicRepos: Number,
    followers: Number,
    following: Number
  },
  createdAt: Date,               // Auto-generated
  updatedAt: Date                // Auto-generated
}
```

#### Indexes

```javascript
{ userId: 1, provider: 1 }        // Compound index
{ providerUserId: 1, provider: 1 } // Compound index
```

## 🔐 Environment Variables

### Backend `.env`

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sred_db

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/integrations/github/callback

# Frontend
FRONTEND_URL=http://localhost:4200
```

### Frontend Environments

**Development** (`environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**Production** (`environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: '/api'
};
```

## 🚀 npm Scripts

### Root Scripts (`package.json`)

```bash
npm run install:backend   # Install backend dependencies
npm run install:frontend  # Install frontend dependencies
npm run install:all       # Install all dependencies
npm run backend          # Start backend
npm run frontend         # Start frontend
```

### Backend Scripts

```bash
npm start               # Start server (production)
npm run dev            # Start with nodemon (development)
npm run kill-port      # Kill process on port 3000
npm run test-mongo     # Test MongoDB connection
```

### Frontend Scripts

```bash
npm start              # Start dev server (port 4200)
npm run build          # Build for production
npm test               # Run unit tests
npm run watch          # Build in watch mode
```

## 📊 Data Flow

### OAuth Authentication Flow

```
User → Frontend → Backend → GitHub → Backend → MongoDB → Frontend → User
  │        │          │        │         │         │         │        │
  │        │          │        │         │         │         │        │
  1. Click 2. Get   3. Redirect 4. Auth 5. Token  6. Store  7. Success 8. Display
  Connect   auth URL  to GitHub  user    exchange  data     status    connected
```

### Component Communication

```
IntegrationsComponent
  ↓ uses
IntegrationService
  ↓ calls
HttpClient
  ↓ requests
Backend API
  ↓ queries/saves
MongoDB
```

## 🎯 Key Features Implemented

### ✅ Backend Features

1. **RESTful API** with Express.js
2. **MongoDB Integration** with Mongoose
3. **GitHub OAuth 2.0** authentication
4. **CORS enabled** for cross-origin requests
5. **Environment variables** support
6. **Error handling** middleware
7. **Example CRUD** operations
8. **Helper utilities** for responses and validation
9. **Port management** script
10. **MongoDB test** script

### ✅ Frontend Features

1. **Angular v19** standalone components
2. **Angular Material** UI components
3. **Routing** with Angular Router
4. **GitHub OAuth** integration
5. **Persistent state** with RxJS
6. **Responsive design** with SCSS
7. **Loading states** and spinners
8. **Success/error** notifications
9. **User profile** display
10. **Connection status** with visual indicators

### ✅ Integration Features

1. **OAuth 2.0** authentication flow
2. **Token storage** in MongoDB
3. **User data** fetching from GitHub API
4. **Connection status** persistence
5. **Green checkmark** when connected
6. **Connection date** display
7. **User information** display (avatar, name, stats)
8. **Disconnect** functionality
9. **Auto-refresh** on page reload
10. **Error handling** throughout flow

## 🔄 Application Lifecycle

### Development Workflow

1. Start MongoDB service
2. Start backend server (port 3000)
3. Start frontend server (port 4200)
4. Access application at `http://localhost:4200`
5. Make changes (hot reload enabled)
6. Test OAuth flow
7. Check MongoDB for stored data

### Production Deployment

1. Build frontend: `npm run build`
2. Set production environment variables
3. Update GitHub OAuth app URLs
4. Deploy backend to server
5. Deploy frontend static files
6. Configure reverse proxy (nginx)
7. Enable HTTPS
8. Monitor logs and errors

## 📝 Important Notes

### Security Considerations

- ✅ `.env` files are gitignored
- ✅ Access tokens stored securely in MongoDB
- ✅ CORS configured properly
- ⚠️ Add encryption for production tokens
- ⚠️ Implement proper user authentication
- ⚠️ Add rate limiting for API endpoints

### Current Limitations

- Using hardcoded `userId` ("demo-user-123")
- No user authentication system yet
- No token refresh mechanism
- Single user mode (for demo)
- No webhooks for real-time updates

### Future Enhancements

- [ ] Add user authentication (JWT/OAuth)
- [ ] Implement token refresh
- [ ] Add GitLab and Bitbucket integrations
- [ ] Add webhook support
- [ ] Implement rate limiting
- [ ] Add unit and integration tests
- [ ] Add Docker configuration
- [ ] Add CI/CD pipeline
- [ ] Implement logging system
- [ ] Add monitoring and analytics

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project overview |
| `START.md` | Quick start guide |
| `GITHUB_OAUTH_SETUP.md` | Detailed OAuth setup |
| `QUICK_START_OAUTH.md` | 5-minute OAuth setup |
| `PROJECT_STRUCTURE.md` | This file - project structure |
| `backend/README.md` | Backend documentation |
| `backend/MONGODB_SETUP.md` | MongoDB setup guide |
| `frontend/README.md` | Frontend documentation |

## 🆘 Support & Resources

### Documentation Links

- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Express.js Docs](https://expressjs.com/)
- [Angular Docs](https://angular.io/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Material Design](https://material.angular.io/)

### Common Issues

See `GITHUB_OAUTH_SETUP.md` → Troubleshooting section

---

**Complete project structure for SRED.IO with GitHub OAuth integration** 🎉

