# Debugging Guide - Repository Data Not Saving

## Issue
Organizations are saving to database, but repository data (commits, pulls, issues) are NOT saving.

## Root Cause Analysis
The issue could be due to:
1. ❌ API calls failing silently
2. ❌ Data not being passed correctly to update methods
3. ❌ Database save operations failing

## Solution - Added Comprehensive Logging

### Changes Made:

#### 1. Backend Controller Logging (`integration.controller.js`)

Added detailed logging in `syncRepositoryData()`:

```javascript
// Before fetching
console.log(`Fetching commits for ${owner}/${repo}...`);

// After fetching
console.log(`Commits result:`, commitsResult.success, commitsResult.data?.length || 0);

// After saving
console.log(`✓ Saved ${commitsResult.data.length} commits`);
```

**This will show:**
- ✅ When each API call starts
- ✅ Success/failure status
- ✅ Number of records fetched
- ✅ Number of records saved

#### 2. Repository Model Logging (`repository.model.js`)

Added logging in update methods:

```javascript
// updateCommits()
console.log(`[Repository] Updating commits for ${this.name}. Received ${commits.length} commits`);
console.log(`[Repository] ${newCommits.length} new commits to add (${existingShas.size} already exist)`);
console.log(`[Repository] ✓ Commits saved. Total commits: ${this.commits.length}`);

// updatePullRequests()
console.log(`[Repository] Updating pull requests for ${this.name}. Received ${pulls.length} PRs`);
console.log(`[Repository] ${newCount} new PRs added, ${updatedCount} PRs updated`);
console.log(`[Repository] ✓ Pull requests saved. Total PRs: ${this.pullRequests.length}`);

// updateIssues()
console.log(`[Repository] Updating issues for ${this.name}. Received ${issues.length} issues`);
console.log(`[Repository] ${newCount} new issues added, ${updatedCount} issues updated`);
console.log(`[Repository] ✓ Issues saved. Total issues: ${this.issues.length}`);
```

---

## How to Debug

### Step 1: Check Backend Console Logs

When you expand a repository on frontend, you should see in **backend terminal**:

```
Fetching commits for owner/repo...
Commits result: true 50
[Repository] Updating commits for myrepo. Received 50 commits
[Repository] 50 new commits to add (0 already exist)
[Repository] ✓ Commits saved. Total commits: 50

Fetching pull requests for owner/repo...
Pull requests result: true 15
[Repository] Updating pull requests for myrepo. Received 15 PRs
[Repository] 15 new PRs added, 0 PRs updated
[Repository] ✓ Pull requests saved. Total PRs: 15

Fetching issues for owner/repo...
Issues result: true 8
[Repository] Updating issues for myrepo. Received 8 issues
[Repository] 8 new issues added, 0 issues updated
[Repository] ✓ Issues saved. Total issues: 8
```

### Step 2: Check Frontend Console Logs

In browser console (F12), you should see:

```
Repository details for owner/repo synced: {
  success: true,
  data: {
    repository: "myrepo",
    commits: 50,
    pullRequests: 15,
    issues: 8
  }
}
```

### Step 3: Verify in MongoDB

```javascript
// Check if repositories exist
db.repositories.find({ userId: "demo-user-123" }).pretty()

// Check specific repo with counts
db.repositories.findOne({ 
  userId: "demo-user-123",
  name: "myrepo" 
}, {
  name: 1,
  "dataCounts": 1,
  "commits": { $slice: 1 },  // Just first commit to verify
  "pullRequests": { $slice: 1 },
  "issues": { $slice: 1 }
})
```

---

## Expected Behavior vs Issues

### ✅ If Working Correctly:

**Backend Console:**
```
Fetching commits for owner/repo...
Commits result: true 50
[Repository] Updating commits for myrepo. Received 50 commits
[Repository] 50 new commits to add (0 already exist)
[Repository] ✓ Commits saved. Total commits: 50
```

**MongoDB:**
```javascript
{
  name: "myrepo",
  dataCounts: {
    commits: 50,
    pullRequests: 15,
    issues: 8
  },
  commits: [ /* 50 commits */ ],
  pullRequests: [ /* 15 PRs */ ],
  issues: [ /* 8 issues */ ]
}
```

### ❌ If API Calls Failing:

**Backend Console:**
```
Fetching commits for owner/repo...
Commits result: false 0
```

**Solution:** Check GitHub API access token or rate limits

### ❌ If No Data Returned:

**Backend Console:**
```
Fetching commits for owner/repo...
Commits result: true 0
```

**Solution:** Repository might not have any commits/pulls/issues

### ❌ If Save Failing:

**Backend Console:**
```
[Repository] Updating commits for myrepo. Received 50 commits
[Repository] 50 new commits to add (0 already exist)
// ❌ No "✓ Commits saved" message
```

**Solution:** Check MongoDB connection or schema validation errors

---

## Testing Checklist

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   # Watch console for logs
   ```

2. **Open Frontend**
   - Navigate to Integrations page
   - Open browser DevTools (F12) → Console tab

3. **Expand Organization**
   - Should see: `Organization myorg synced to database`
   - Check backend console for organization sync logs

4. **Expand Repository**
   - Should see frontend: `Repository details for owner/repo synced`
   - Check backend console for detailed fetching logs

5. **Verify Database**
   ```javascript
   db.organizations.count({ userId: "demo-user-123" })
   db.repositories.count({ userId: "demo-user-123" })
   
   // Check specific repo
   db.repositories.findOne({ 
     userId: "demo-user-123",
     name: "your-repo-name"
   })
   ```

---

## Common Issues & Fixes

### Issue 1: No Backend Logs
**Problem:** Backend console shows nothing when repo is expanded  
**Fix:** Check if frontend is calling the sync endpoint:
- Open Network tab in browser DevTools
- Look for POST requests to `/api/integrations/github/sync/repository/...`

### Issue 2: API Rate Limit
**Problem:** `Commits result: false 0` with rate limit error  
**Fix:** Wait for GitHub API rate limit to reset or use authenticated requests

### Issue 3: Empty Arrays in Database
**Problem:** Repository document exists but arrays are empty  
**Fix:** Check if `includeCommits`, `includePulls`, `includeIssues` are all `true` in frontend

### Issue 4: Data Not Updating on Re-sync
**Problem:** Same data appears even after new commits added  
**Fix:** This is expected! Commits are deduplicated by SHA. New commits will be added, existing ones won't be duplicated.

---

## Next Steps

After implementing these changes:

1. ✅ Restart backend server
2. ✅ Clear browser cache
3. ✅ Navigate to Integrations page
4. ✅ Expand an organization
5. ✅ Expand a repository
6. ✅ **Watch backend console logs**
7. ✅ Check MongoDB for data

The detailed logging will show exactly where the process is failing!

