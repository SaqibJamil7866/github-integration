# GitHub Data Fetching API Documentation

## Overview

After connecting your GitHub account via OAuth, you can use these endpoints to fetch various GitHub data including organizations, repositories, commits, pull requests, issues, and more.

## Prerequisites

1. ✅ User must have connected their GitHub account via OAuth
2. ✅ A valid `userId` is required for all requests
3. ✅ The integration must be active (status: 'active')

## Base URL

```
http://localhost:3000/api/integrations/github/data
```

---

## 📊 Available Endpoints

### a. Get User's Organizations

Fetches all organizations the authenticated user belongs to.

**Endpoint:**
```
GET /api/integrations/github/data/organizations/:userId
```

**Parameters:**
- `userId` (path) - Your user ID

**Example Request:**
```bash
curl http://localhost:3000/api/integrations/github/data/organizations/demo-user-123
```

**Example Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "login": "my-org",
      "id": 123456,
      "avatar_url": "https://avatars.githubusercontent.com/u/123456",
      "description": "My Organization",
      "name": "My Org",
      "company": null,
      "blog": "https://myorg.com",
      "location": "San Francisco, CA",
      "email": "hello@myorg.com",
      "public_repos": 42,
      "followers": 150
    }
  ]
}
```

---

### b. Get Organization Repositories

Fetches all repositories for a specific organization.

**Endpoint:**
```
GET /api/integrations/github/data/organizations/:orgName/repos?userId=:userId
```

**Parameters:**
- `orgName` (path) - Organization name (e.g., "microsoft", "google")
- `userId` (query) - Your user ID
- `per_page` (query, optional) - Results per page (default: 100)
- `sort` (query, optional) - Sort by: created, updated, pushed, full_name (default: updated)

**Example Request:**
```bash
curl "http://localhost:3000/api/integrations/github/data/organizations/my-org/repos?userId=demo-user-123&per_page=50&sort=updated"
```

**Example Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": 789012,
      "name": "awesome-project",
      "full_name": "my-org/awesome-project",
      "private": false,
      "owner": {
        "login": "my-org",
        "id": 123456
      },
      "html_url": "https://github.com/my-org/awesome-project",
      "description": "An awesome project",
      "fork": false,
      "created_at": "2023-01-15T10:30:00Z",
      "updated_at": "2025-10-30T19:00:00Z",
      "pushed_at": "2025-10-30T18:45:00Z",
      "size": 1234,
      "stargazers_count": 256,
      "watchers_count": 256,
      "language": "TypeScript",
      "forks_count": 42,
      "open_issues_count": 5,
      "default_branch": "main"
    }
  ]
}
```

---

### c. Get Repository Commits

Fetches commits from a specific repository.

**Endpoint:**
```
GET /api/integrations/github/data/repos/:owner/:repo/commits?userId=:userId
```

**Parameters:**
- `owner` (path) - Repository owner (organization or username)
- `repo` (path) - Repository name
- `userId` (query) - Your user ID
- `per_page` (query, optional) - Results per page (default: 100)
- `page` (query, optional) - Page number (default: 1)

**Example Request:**
```bash
curl "http://localhost:3000/api/integrations/github/data/repos/my-org/awesome-project/commits?userId=demo-user-123&per_page=10"
```

**Example Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "sha": "abc123def456",
      "commit": {
        "author": {
          "name": "John Doe",
          "email": "john@example.com",
          "date": "2025-10-30T18:45:00Z"
        },
        "message": "Fix: Resolve memory leak issue",
        "tree": {
          "sha": "def789",
          "url": "https://api.github.com/repos/my-org/awesome-project/git/trees/def789"
        }
      },
      "author": {
        "login": "johndoe",
        "id": 987654,
        "avatar_url": "https://avatars.githubusercontent.com/u/987654"
      },
      "html_url": "https://github.com/my-org/awesome-project/commit/abc123def456"
    }
  ]
}
```

---

### d. Get Repository Pull Requests

Fetches pull requests from a specific repository.

**Endpoint:**
```
GET /api/integrations/github/data/repos/:owner/:repo/pulls?userId=:userId
```

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name
- `userId` (query) - Your user ID
- `state` (query, optional) - Filter by state: open, closed, all (default: all)
- `per_page` (query, optional) - Results per page (default: 100)
- `page` (query, optional) - Page number (default: 1)

**Example Request:**
```bash
curl "http://localhost:3000/api/integrations/github/data/repos/my-org/awesome-project/pulls?userId=demo-user-123&state=open&per_page=20"
```

**Example Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 456789,
      "number": 42,
      "state": "open",
      "title": "Add new feature X",
      "user": {
        "login": "janedoe",
        "id": 234567,
        "avatar_url": "https://avatars.githubusercontent.com/u/234567"
      },
      "body": "This PR adds feature X to improve performance...",
      "created_at": "2025-10-25T10:00:00Z",
      "updated_at": "2025-10-30T15:30:00Z",
      "closed_at": null,
      "merged_at": null,
      "merge_commit_sha": null,
      "assignees": [],
      "requested_reviewers": [],
      "labels": [
        {
          "id": 111,
          "name": "enhancement",
          "color": "a2eeef"
        }
      ],
      "draft": false,
      "html_url": "https://github.com/my-org/awesome-project/pull/42"
    }
  ]
}
```

---

### e. Get Repository Issues

Fetches issues from a specific repository.

**Endpoint:**
```
GET /api/integrations/github/data/repos/:owner/:repo/issues?userId=:userId
```

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name
- `userId` (query) - Your user ID
- `state` (query, optional) - Filter by state: open, closed, all (default: all)
- `per_page` (query, optional) - Results per page (default: 100)
- `page` (query, optional) - Page number (default: 1)

**Example Request:**
```bash
curl "http://localhost:3000/api/integrations/github/data/repos/my-org/awesome-project/issues?userId=demo-user-123&state=open"
```

**Example Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": 345678,
      "number": 15,
      "title": "Bug: Application crashes on startup",
      "user": {
        "login": "bugfinder",
        "id": 345678,
        "avatar_url": "https://avatars.githubusercontent.com/u/345678"
      },
      "labels": [
        {
          "id": 222,
          "name": "bug",
          "color": "d73a4a"
        },
        {
          "id": 333,
          "name": "high-priority",
          "color": "e11d21"
        }
      ],
      "state": "open",
      "assignees": [
        {
          "login": "johndoe",
          "id": 987654
        }
      ],
      "comments": 5,
      "created_at": "2025-10-28T09:00:00Z",
      "updated_at": "2025-10-30T16:20:00Z",
      "closed_at": null,
      "body": "The application crashes when...",
      "html_url": "https://github.com/my-org/awesome-project/issues/15"
    }
  ]
}
```

---

### f. Get Issue Timeline/Changelog

Fetches the complete timeline/changelog of an issue, including all events like status changes, label additions, comments, etc.

**Endpoint:**
```
GET /api/integrations/github/data/repos/:owner/:repo/issues/:issueNumber/timeline?userId=:userId
```

**Parameters:**
- `owner` (path) - Repository owner
- `repo` (path) - Repository name
- `issueNumber` (path) - Issue number
- `userId` (query) - Your user ID

**Example Request:**
```bash
curl "http://localhost:3000/api/integrations/github/data/repos/my-org/awesome-project/issues/15/timeline?userId=demo-user-123"
```

**Example Response:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": 111111,
      "event": "commented",
      "created_at": "2025-10-28T09:15:00Z",
      "user": {
        "login": "janedoe",
        "id": 234567
      },
      "body": "I can confirm this bug..."
    },
    {
      "id": 222222,
      "event": "labeled",
      "created_at": "2025-10-28T10:00:00Z",
      "label": {
        "name": "bug",
        "color": "d73a4a"
      }
    },
    {
      "id": 333333,
      "event": "assigned",
      "created_at": "2025-10-28T10:30:00Z",
      "assignee": {
        "login": "johndoe",
        "id": 987654
      }
    },
    {
      "id": 444444,
      "event": "renamed",
      "created_at": "2025-10-28T11:00:00Z",
      "rename": {
        "from": "Application crashes",
        "to": "Bug: Application crashes on startup"
      }
    }
  ]
}
```

---

### g. Get Organization Members/Users

Fetches all members of an organization.

**Endpoint:**
```
GET /api/integrations/github/data/organizations/:orgName/members?userId=:userId
```

**Parameters:**
- `orgName` (path) - Organization name
- `userId` (query) - Your user ID
- `per_page` (query, optional) - Results per page (default: 100)

**Example Request:**
```bash
curl "http://localhost:3000/api/integrations/github/data/organizations/my-org/members?userId=demo-user-123"
```

**Example Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "login": "johndoe",
      "id": 987654,
      "avatar_url": "https://avatars.githubusercontent.com/u/987654",
      "type": "User",
      "site_admin": false,
      "html_url": "https://github.com/johndoe"
    },
    {
      "login": "janedoe",
      "id": 234567,
      "avatar_url": "https://avatars.githubusercontent.com/u/234567",
      "type": "User",
      "site_admin": false,
      "html_url": "https://github.com/janedoe"
    }
  ]
}
```

---

### 🚀 COMPREHENSIVE: Get Complete Organization Data

Fetches ALL data for an organization in one call:
- Organization details
- Repositories (first 5)
  - Commits (first 10 per repo)
  - Pull Requests (first 10 per repo)
  - Issues (first 10 per repo)
    - Issue Timeline (first 3 issues)
- Members
- Teams

⚠️ **Warning:** This endpoint makes many API calls and may take 30-60 seconds to complete.

**Endpoint:**
```
GET /api/integrations/github/data/organizations/:orgName/complete?userId=:userId
```

**Parameters:**
- `orgName` (path) - Organization name
- `userId` (query) - Your user ID

**Example Request:**
```bash
curl "http://localhost:3000/api/integrations/github/data/organizations/my-org/complete?userId=demo-user-123"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "organization": {
      "login": "my-org",
      "id": 123456,
      "name": "My Organization",
      "description": "Building awesome things",
      "public_repos": 42,
      "followers": 150
    },
    "repos": [
      {
        "id": 789012,
        "name": "awesome-project",
        "full_name": "my-org/awesome-project",
        "private": false,
        "stargazers_count": 256
      }
    ],
    "details": {
      "awesome-project": {
        "commits": [...],
        "pullRequests": [...],
        "issues": [...]
      }
    },
    "members": [...],
    "teams": [...]
  }
}
```

---

## 🔒 Authentication & Scope

All endpoints require:
1. A valid GitHub OAuth token (obtained during connection)
2. The user must have appropriate permissions based on GitHub scopes:
   - `user:email` - Access user email
   - `repo` - Access repositories (public and private)
   - `read:org` - Read organization data (automatically included with `repo`)

If you need additional scopes, update the OAuth scope in `backend/controllers/integration.controller.js`:
```javascript
&scope=user:email,repo,read:org
```

---

## 📝 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Errors:**

1. **Integration Not Found** (404)
```json
{
  "success": false,
  "error": "GitHub integration not found. Please connect your GitHub account first."
}
```

2. **Insufficient Permissions** (403)
```json
{
  "success": false,
  "error": "Resource not accessible"
}
```

3. **Rate Limit Exceeded** (429)
```json
{
  "success": false,
  "error": "API rate limit exceeded"
}
```

---

## 📊 Rate Limits

GitHub API rate limits:
- **Authenticated requests:** 5,000 requests per hour
- **Unauthenticated requests:** 60 requests per hour

All our endpoints use authenticated requests (via OAuth token).

**Check your rate limit:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/rate_limit
```

---

## 🎯 Usage Examples

### Example 1: Fetch All Data for Your Organizations

```javascript
// 1. Get organizations
fetch('http://localhost:3000/api/integrations/github/data/organizations/demo-user-123')
  .then(res => res.json())
  .then(data => {
    console.log('Organizations:', data.data);
    
    // 2. For each organization, get repos
    data.data.forEach(org => {
      fetch(`http://localhost:3000/api/integrations/github/data/organizations/${org.login}/repos?userId=demo-user-123`)
        .then(res => res.json())
        .then(repos => {
          console.log(`${org.login} repos:`, repos.data);
        });
    });
  });
```

### Example 2: Monitor Repository Activity

```javascript
async function monitorRepo(owner, repo, userId) {
  // Get recent commits
  const commits = await fetch(
    `http://localhost:3000/api/integrations/github/data/repos/${owner}/${repo}/commits?userId=${userId}&per_page=10`
  ).then(r => r.json());
  
  // Get open PRs
  const prs = await fetch(
    `http://localhost:3000/api/integrations/github/data/repos/${owner}/${repo}/pulls?userId=${userId}&state=open`
  ).then(r => r.json());
  
  // Get open issues
  const issues = await fetch(
    `http://localhost:3000/api/integrations/github/data/repos/${owner}/${repo}/issues?userId=${userId}&state=open`
  ).then(r => r.json());
  
  return {
    recentCommits: commits.data,
    openPullRequests: prs.data,
    openIssues: issues.data
  };
}
```

---

## 🧪 Testing

Test the endpoints using curl or Postman:

```bash
# 1. First, connect GitHub account via OAuth
# Visit: http://localhost:4200/integrations

# 2. Test endpoints
curl http://localhost:3000/api/integrations/github/data/organizations/demo-user-123

curl "http://localhost:3000/api/integrations/github/data/organizations/my-org/repos?userId=demo-user-123"

curl "http://localhost:3000/api/integrations/github/data/repos/my-org/my-repo/commits?userId=demo-user-123"
```

---

## 📚 Additional Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [GitHub OAuth Scopes](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)

---

## 🤝 Support

For issues or questions:
1. Check the endpoint list: `GET http://localhost:3000/api/integrations/`
2. Review GitHub API docs
3. Check server logs for detailed error messages


