# Quick Start Guide

## Prerequisites
- Node.js v22 or higher
- MongoDB installed and running locally
- npm package manager

## Installation

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

Or install all at once from the root:
```bash
npm run install:all
```

## Running the Application

### Option 1: Run Manually (Recommended for Development)

#### Terminal 1 - Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

#### Terminal 2 - Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3000

#### Terminal 3 - Start Frontend Server
```bash
cd frontend
npm start
```
Frontend will run on http://localhost:4200

### Option 2: Run from Root Directory
```bash
# Backend (Terminal 1)
npm run backend

# Frontend (Terminal 2)
npm run frontend
```

## Verify Installation

1. **Backend Health Check**
   - Open: http://localhost:3000/health
   - Should return: `{"status":"OK","message":"Server is running","timestamp":"..."}`

2. **Frontend**
   - Open: http://localhost:4200
   - Should see the Angular Material welcome page

3. **Example API Endpoint**
   - GET: http://localhost:3000/api/examples
   - Should return a list of examples (empty array initially)

## Project Structure

```
sred.io/
├── backend/              # Express API (Port 3000)
│   ├── app.js           # Main server file
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── helpers/         # Utility functions
│   └── models/          # MongoDB models
│
└── frontend/            # Angular App (Port 4200)
    └── src/
        ├── app/         # Application components
        │   ├── services/    # API services
        │   └── environments/ # Environment configs
        └── ...
```

## Next Steps

1. Create your own models in `backend/models/`
2. Add controllers in `backend/controllers/`
3. Define routes in `backend/routes/`
4. Create Angular components in `frontend/src/app/`
5. Use the `ApiService` to call backend endpoints

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is installed and running
- Check the connection string in `backend/.env`

### Port Already in Use
- Backend: Change PORT in `backend/.env`
- Frontend: Change port in `frontend/angular.json` under serve.options.port

### Module Not Found
- Run `npm install` in both backend and frontend directories

## API Examples

### Create an Example
```bash
curl -X POST http://localhost:3000/api/examples \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test example"}'
```

### Get All Examples
```bash
curl http://localhost:3000/api/examples
```

## Development Tips

- Backend auto-reloads on changes (using nodemon)
- Frontend hot-reloads automatically
- Check browser console for frontend errors
- Check terminal for backend errors
- Use Angular DevTools browser extension for debugging

Happy coding! 🚀

