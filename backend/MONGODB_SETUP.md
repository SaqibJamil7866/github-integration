# MongoDB Setup and Configuration Guide

## Current Configuration

Your backend is already configured to connect to MongoDB! Here's what's set up:

### In `app.js` (lines 13-18):
```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sred_db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));
```

### In `.env` file:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sred_db
NODE_ENV=development
```

## MongoDB Installation

### Option 1: MongoDB Community Server (Recommended for Production-like Setup)

#### Windows:
1. **Download MongoDB**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Download and run the installer

2. **Install MongoDB**
   - Choose "Complete" installation
   - Install as a Service (recommended)
   - Install MongoDB Compass (GUI tool)

3. **Verify Installation**
   ```bash
   mongod --version
   ```

4. **Start MongoDB Service**
   ```bash
   net start MongoDB
   ```

5. **Stop MongoDB Service**
   ```bash
   net stop MongoDB
   ```

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: MongoDB Atlas (Cloud - Free Tier Available)

1. **Sign up** at https://www.mongodb.com/cloud/atlas
2. **Create a free cluster**
3. **Get connection string**
4. **Update `.env` file**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sred_db?retryWrites=true&w=majority
   ```

### Option 3: Docker (Quick Setup)

```bash
# Pull and run MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Stop MongoDB
docker stop mongodb

# Start MongoDB
docker start mongodb
```

## Configuration Options

### 1. Local MongoDB (Default)
```env
MONGODB_URI=mongodb://localhost:27017/sred_db
```
- **Database:** sred_db
- **Host:** localhost
- **Port:** 27017 (default)

### 2. MongoDB with Authentication
```env
MONGODB_URI=mongodb://username:password@localhost:27017/sred_db?authSource=admin
```

### 3. MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sred_db?retryWrites=true&w=majority
```

### 4. Multiple Hosts (Replica Set)
```env
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/sred_db?replicaSet=myReplicaSet
```

## Verify MongoDB Connection

### Method 1: Check Server Logs
When you start your backend server (`npm run dev`), you should see:
```
MongoDB connected successfully
Server is running on http://localhost:3000
```

### Method 2: Use MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. You should see `sred_db` database

### Method 3: Use Mongo Shell
```bash
# Connect to MongoDB
mongosh

# Show databases
show dbs

# Use your database
use sred_db

# Show collections
show collections
```

### Method 4: Test via API
```bash
# Start your backend server
cd backend
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/examples
```

## Database Structure

Your project uses **Mongoose** for MongoDB object modeling. 

### Example Model (already created):
```javascript
// backend/models/example.model.js
const exampleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

## Common Issues & Solutions

### Issue 1: "MongoNetworkError: connect ECONNREFUSED"
**Solution:** MongoDB is not running
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Issue 2: "Authentication failed"
**Solution:** Check username/password in connection string or disable auth for local development

### Issue 3: "Database name is required"
**Solution:** Ensure your connection string includes the database name:
```
mongodb://localhost:27017/sred_db
```

### Issue 4: Port 27017 already in use
**Solution:** Either stop the existing process or use a different port
```bash
# Find process
netstat -ano | findstr :27017

# Kill process (Windows)
taskkill /F /PID <PID>
```

## Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/sred_db |
| `NODE_ENV` | Environment (development/production) | development |

## Testing MongoDB Connection

### Create a test script:
```javascript
// backend/test-mongo.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/sred_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
```

Run it:
```bash
node backend/test-mongo.js
```

## Best Practices

1. **Never commit `.env` files** (already in .gitignore)
2. **Use environment variables** for sensitive data
3. **Enable authentication** in production
4. **Use connection pooling** (Mongoose does this by default)
5. **Handle connection errors** gracefully
6. **Close connections** properly on app shutdown

## MongoDB Compass (Recommended GUI Tool)

MongoDB Compass provides a visual interface to:
- Browse collections and documents
- Run queries
- Create indexes
- Monitor performance

Download: https://www.mongodb.com/try/download/compass

## Connection String Format

```
mongodb://[username:password@]host[:port][/database][?options]
```

**Examples:**
- Simple: `mongodb://localhost:27017/mydb`
- With auth: `mongodb://user:pass@localhost:27017/mydb`
- Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/mydb`

## Next Steps

1. ✅ MongoDB is configured in your backend
2. 📦 Install MongoDB on your system
3. 🚀 Start MongoDB service
4. ▶️ Run your backend server
5. ✔️ Verify connection in logs

Need help? Check the logs when starting your server!

