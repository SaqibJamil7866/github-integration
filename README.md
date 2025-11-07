# github-integration
A full-stack integration project built with Angular 19, Node.js (Express.js), and MongoDB, designed to connect and synchronize data from GitHub using OAuth 2.0 authentication.

## Project Structure

```
github-integration/
├── backend/              # Node.js/Express API server
│   ├── app.js           # Main application file
│   ├── controllers/     # Request handlers
│   ├── routes/         # API routes
│   ├── helpers/        # Utility functions
│   ├── models/         # MongoDB models
│   └── package.json    # Backend dependencies
│
└── frontend/           # Angular application
    ├── src/           # Source files
    ├── angular.json   # Angular configuration
    └── package.json   # Frontend dependencies
```

## Tech Stack

### Backend
- Node.js v22
- Express.js
- MongoDB with Mongoose
- Axios for HTTP requests
- CORS enabled
- Port: 3000

### Frontend
- Angular v19
- Angular Material (Azure Blue theme)
- TypeScript
- RxJS for reactive programming
- SCSS
- Port: 4200

## 🎯 Features

### GitHub Integration
- ✅ **OAuth 2.0 Authentication** - Secure GitHub login
- ✅ **Token Management** - Encrypted storage in MongoDB
- ✅ **User Profile Sync** - Automatic profile updates
- ✅ **Connection Status** - Real-time status indicators
- ✅ **Beautiful UI** - Modern Material Design with animations

### GitHub Data Fetching
- ✅ **Organizations** - List all user organizations
- ✅ **Repositories** - Fetch organization and user repos
- ✅ **Commits** - Access repository commit history
- ✅ **Pull Requests** - View all PRs with filters
- ✅ **Issues** - Track issues with state filtering
- ✅ **Issue Timelines** - Complete changelog/history
- ✅ **Organization Members** - List team members
- ✅ **Comprehensive API** - Fetch everything in one call

## Getting Started

### Prerequisites
- Node.js v22 or higher
- MongoDB installed and running
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Start the backend server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Backend will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend will be available at `http://localhost:4200`

## Development

1. Start MongoDB service on your machine
2. Run the backend server (port 3000)
3. Run the frontend application (port 4200)
4. Access the application at `http://localhost:4200`

## API Endpoints

### General
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

### Examples (Demo)
- `GET /api/examples` - Get all examples
- `POST /api/examples` - Create example
- `PUT /api/examples/:id` - Update example
- `DELETE /api/examples/:id` - Delete example

### GitHub OAuth Integration
- `GET /api/integrations/github/auth` - Get GitHub OAuth URL
- `GET /api/integrations/github/callback` - OAuth callback handler
- `GET /api/integrations/status/:userId` - Get integration status
- `GET /api/integrations/:userId` - Get all integrations
- `DELETE /api/integrations/:userId/:provider` - Disconnect integration

Additional routes can be added in the `backend/routes/` directory.

## Features

### Core Features
- ✓ RESTful API with Express.js
- ✓ MongoDB integration with Mongoose
- ✓ Angular v19 with standalone components
- ✓ Angular Material UI components (Azure Blue theme)
- ✓ CORS configured for cross-origin requests
- ✓ Environment variables support
- ✓ Hot reload for both frontend and backend

### GitHub OAuth Integration
- ✓ OAuth 2.0 authentication with GitHub
- ✓ User profile and repository information sync
- ✓ Persistent connection status
- ✓ Visual status indicators (green checkmark when connected)
- ✓ Display connection date and user information
- ✓ Secure token storage in MongoDB
- ✓ Connect/disconnect functionality

## GitHub OAuth Integration

This project includes a complete GitHub OAuth 2.0 integration allowing users to connect their GitHub accounts.

### Quick Setup

1. **Register GitHub OAuth App**
   - Go to: https://github.com/settings/developers
   - Create new OAuth App
   - Set callback URL: `http://localhost:3000/api/integrations/github/callback`

2. **Configure Backend**
   - Edit `backend/.env`:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

3. **Test Integration**
   - Start backend and frontend
   - Navigate to: http://localhost:4200/integrations
   - Click "Connect GitHub"

### Documentation

- 📘 **Quick Start**: `QUICK_START_OAUTH.md` - 5-minute setup guide
- 📗 **Complete Guide**: `GITHUB_OAUTH_SETUP.md` - Detailed documentation
- 📙 **GitHub Data API**: `GITHUB_DATA_FETCHING_API.md` - Complete API reference for fetching GitHub data
- 📒 **Data Summary**: `GITHUB_DATA_SUMMARY.md` - Quick reference for data fetching capabilities
- 📓 **Project Structure**: `PROJECT_STRUCTURE.md` - Architecture overview
- 📕 **Integration Summary**: `INTEGRATION_SUMMARY.md` - Implementation details

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC

