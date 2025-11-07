# GitHub Integration - Database Storage API

This document describes the new database storage functionality for GitHub integration data.

## Database Collections

### 1. Organizations Collection
Stores GitHub organization data with members.

**Schema:**
```javascript
{
  userId: String (required, indexed),
  githubId: Number (required),
  login: String (required, indexed),
  name: String,
  description: String,
  avatarUrl: String,
  htmlUrl: String,
  type: String, // 'Organization' or 'User'
  metadata: {
    company: String,
    blog: String,
    location: String,
    email: String,
    publicRepos: Number,
    publicGists: Number,
    followers: Number,
    following: Number,
    createdAt: Date,
    updatedAt: Date
  },
  members: [{
    login: String,
    id: Number,
    avatarUrl: String,
    htmlUrl: String,
    type: String,
    siteAdmin: Boolean,
    role: String
  }],
  repositoryCount: Number,
  lastSyncedAt: Date,
  syncStatus: String, // pending, syncing, completed, failed
  syncError: String
}
```

### 2. Repositories Collection
Stores repository data with commits, pull requests, and issues.

**Schema:**
```javascript
{
  userId: String (required, indexed),
  organizationLogin: String (required, indexed),
  githubId: Number (required),
  name: String (required),
  fullName: String,
  description: String,
  owner: {
    login: String,
    avatarUrl: String,
    type: String
  },
  htmlUrl: String,
  private: Boolean,
  language: String,
  defaultBranch: String,
  stats: {
    stargazersCount: Number,
    watchersCount: Number,
    forksCount: Number,
    openIssuesCount: Number,
    size: Number
  },
  timestamps: {
    createdAt: Date,
    updatedAt: Date,
    pushedAt: Date
  },
  topics: [String],
  commits: [CommitSchema],
  pullRequests: [PullRequestSchema],
  issues: [IssueSchema],
  dataCounts: {
    commits: Number,
    pullRequests: Number,
    issues: Number
  },
  lastSyncedAt: Date,
  syncStatus: String,
  syncDetails: {
    commits: { status: String, count: Number, lastSynced: Date },
    pullRequests: { status: String, count: Number, lastSynced: Date },
    issues: { status: String, count: Number, lastSynced: Date }
  },
  syncError: String
}
```

## API Endpoints

### Sync Endpoints (POST)

#### 1. Sync Organization Data
**Endpoint:** `POST /api/integrations/github/sync/organization/:orgName`

**Body:**
```json
{
  "userId": "demo-user-123"
}
```

**Description:** Syncs organization details and members to database.

**Response:**
```json
{
  "success": true,
  "message": "Organization data synced successfully",
  "data": {
    "organization": { ...organizationObject },
    "membersCount": 15
  }
}
```

---

#### 2. Sync Repository Data
**Endpoint:** `POST /api/integrations/github/sync/repository/:owner/:repo`

**Body:**
```json
{
  "userId": "demo-user-123",
  "includeCommits": true,
  "includePulls": true,
  "includeIssues": true
}
```

**Description:** Syncs single repository with commits, pull requests, and issues.

**Response:**
```json
{
  "success": true,
  "message": "Repository data synced successfully",
  "data": {
    "repository": "myrepo",
    "commits": 50,
    "pullRequests": 15,
    "issues": 8
  }
}
```

---

#### 3. Sync All Organization Repositories
**Endpoint:** `POST /api/integrations/github/sync/organization/:orgName/repositories`

**Body:**
```json
{
  "userId": "demo-user-123",
  "limit": 10,
  "includeDetails": true
}
```

**Description:** Syncs all repositories of an organization (limited by `limit` parameter).

**Response:**
```json
{
  "success": true,
  "message": "Synced 8 of 10 repositories",
  "data": {
    "organization": "myorg",
    "totalRepos": 42,
    "syncedRepos": 8,
    "repositories": [
      {
        "name": "repo1",
        "synced": true,
        "commits": 50,
        "pullRequests": 10,
        "issues": 5
      },
      ...
    ]
  }
}
```

---

### Retrieve Stored Data Endpoints (GET)

#### 4. Get Stored Organizations
**Endpoint:** `GET /api/integrations/github/stored/organizations/:userId`

**Description:** Retrieves all stored organizations for a user.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    { ...organizationObject },
    ...
  ]
}
```

---

#### 5. Get Stored Repositories for Organization
**Endpoint:** `GET /api/integrations/github/stored/organizations/:orgName/repositories?userId=demo-user-123`

**Description:** Retrieves all stored repositories for an organization (excludes commits, pulls, issues for performance).

**Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    { ...repositoryObject },
    ...
  ]
}
```

---

#### 6. Get Stored Repository Details
**Endpoint:** `GET /api/integrations/github/stored/repositories/:owner/:repo?userId=demo-user-123`

**Description:** Retrieves complete repository data including commits, pull requests, and issues.

**Response:**
```json
{
  "success": true,
  "data": {
    ...repositoryObject,
    commits: [...],
    pullRequests: [...],
    issues: [...]
  }
}
```

---

## Usage Examples

### Example 1: Sync an Organization
```bash
curl -X POST http://localhost:3000/api/integrations/github/sync/organization/myorg \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-user-123"}'
```

### Example 2: Sync a Repository with All Data
```bash
curl -X POST http://localhost:3000/api/integrations/github/sync/repository/myorg/myrepo \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"demo-user-123",
    "includeCommits":true,
    "includePulls":true,
    "includeIssues":true
  }'
```

### Example 3: Sync All Repositories in an Organization
```bash
curl -X POST http://localhost:3000/api/integrations/github/sync/organization/myorg/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"demo-user-123",
    "limit":5,
    "includeDetails":true
  }'
```

### Example 4: Get Stored Organizations
```bash
curl http://localhost:3000/api/integrations/github/stored/organizations/demo-user-123
```

### Example 5: Get Stored Repository Details
```bash
curl http://localhost:3000/api/integrations/github/stored/repositories/myorg/myrepo?userId=demo-user-123
```

---

## Data Flow

1. **Initial Fetch**: Data is fetched from GitHub API
2. **Sync to Database**: Data is stored in MongoDB collections
3. **Retrieve from Database**: Stored data can be retrieved for offline access
4. **Re-sync**: Data can be re-synced to update with latest changes

## Features

- ✅ **Automatic Deduplication**: Commits are deduplicated by SHA
- ✅ **Update or Insert**: Existing data is updated, new data is inserted
- ✅ **Partial Sync**: Can sync commits, pulls, or issues independently
- ✅ **Sync Status Tracking**: Track sync status and errors
- ✅ **Member Management**: Store and update organization members
- ✅ **Timestamps**: Track when data was last synced

## Notes

- Commits are limited to 100 per sync (most recent)
- Pull Requests are limited to 100 per sync
- Issues are limited to 100 per sync
- Organization sync includes up to 100 members
- Repository sync can be done in batches using the limit parameter

