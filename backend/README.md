# github-integration Backend

Backend server built with Node.js v22 and Express.js

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

## Project Structure

```
backend/
├── app.js              # Main application file with Express setup
├── controllers/        # Request handlers
├── routes/            # Route definitions
├── helpers/           # Utility functions
├── models/            # MongoDB/Mongoose models
├── package.json       # Dependencies and scripts
└── .env               # Environment variables (create from .env.example)
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Tech Stack

- Node.js v22
- Express.js
- MongoDB with Mongoose
- CORS enabled for frontend integration

