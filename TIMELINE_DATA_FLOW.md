# Timeline Data Flow - GitHub Issues

## 🔍 Overview

The timeline/changelog data for GitHub issues is fetched in **two stages** to optimize performance and avoid rate limiting.

## 📊 Data Flow Diagram

```
User Expands Repository
         ↓
┌────────────────────────────────────────┐
│  STAGE 1: Initial Load (Fast)         │
├────────────────────────────────────────┤
│ 1. Fetch from GitHub API:             │
│    - Commits (10)                      │
│    - Pull Requests (10)                │
│    - Issues (10) ❌ NO TIMELINE        │
│                                        │
│ 2. Display immediately                 │
│    ✅ Users see data quickly           │
│    ❌ No timeline yet                  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  STAGE 2: Background Sync (Detailed)  │
├────────────────────────────────────────┤
│ 1. Call backend syncRepository()       │
│    - Fetch commits                     │
│    - Fetch pull requests               │
│    - Fetch issues                      │
│    - For FIRST 10 issues:              │
│      └─ Fetch timeline for each ✅     │
│                                        │
│ 2. Save to MongoDB with timeline       │
│                                        │
│ 3. Reload from database                │
│    - Get issues WITH timeline          │
│    - Update UI                         │
│    ✅ Timeline now visible             │
└────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### Frontend: `integrations.component.ts`

#### Step 1: Initial Load
```typescript
loadRepoDetails(orgName: string, repoName: string, owner: string): void {
  // Fetch from GitHub API (no timeline)
  const issues$ = this.integrationService.getRepoIssues(this.userId, owner, repoName, 10);
  
  forkJoin({ commits: commits$, pulls: pulls$, issues: issues$ })
    .subscribe({
      next: (results) => {
        // Display issues WITHOUT timeline
        this.repoIssues[repoKey] = results.issues.data;
        
        // Trigger background sync
        this.syncAndReloadRepositoryDetails(owner, repoName, repoKey);
      }
    });
}
```

#### Step 2: Background Sync & Reload
```typescript
private syncAndReloadRepositoryDetails(owner: string, repo: string, repoKey: string): void {
  // 1. Sync to database (fetches timeline)
  this.integrationService.syncRepository(userId, owner, repo, true, true, true)
    .subscribe({
      next: (response) => {
        // 2. Reload from database (with timeline)
        this.integrationService.getStoredRepositoryDetails(userId, owner, repo)
          .subscribe({
            next: (dbResponse) => {
              // 3. Update UI with timeline data
              this.repoIssues[repoKey] = [...dbResponse.data.issues];
            }
          });
      }
    });
}
```

### Backend: `integration.controller.js`

#### Sync Repository Method
```javascript
async syncRepositoryData(req, res) {
  // Fetch issues
  const issuesResult = await github.getRepoIssues(owner, repo, { state: 'all', per_page: 100 });
  
  if (issuesResult.success && issuesResult.data.length > 0) {
    const issuesWithTimeline = [];
    
    // Fetch timeline for FIRST 10 issues only (rate limit protection)
    for (const issue of issuesResult.data.slice(0, 10)) {
      const timelineResult = await github.getIssueTimeline(owner, repo, issue.number);
      
      if (timelineResult.success && timelineResult.data) {
        issue.timeline = timelineResult.data.map(event => ({
          event: event.event,
          createdAt: event.created_at,
          actor: { login: event.actor?.login, ... },
          label: event.label ? { name: event.label.name, ... } : undefined,
          assignee: event.assignee ? { login: event.assignee.login } : undefined,
          body: event.body,
          htmlUrl: event.html_url
        }));
      }
      issuesWithTimeline.push(issue);
    }
    
    // Add remaining issues without timeline
    issuesWithTimeline.push(...issuesResult.data.slice(10));
    
    // Save to database
    await repository.updateIssues(issuesWithTimeline);
  }
}
```

### Backend: `github.helper.js`

```javascript
async getIssueTimeline(owner, repo, issueNumber) {
  return await this.makeRequest(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/timeline`,
    {},
    {
      Accept: 'application/vnd.github.mockingbird-preview+json'
    }
  );
}
```

## ⚡ Why This Approach?

### Advantages:
1. **Fast Initial Load**: Users see issues immediately
2. **Rate Limit Protection**: Only fetch timeline for first 10 issues
3. **Progressive Enhancement**: Timeline loads in background
4. **Better UX**: No blocking wait for timeline data

### Trade-offs:
1. **Timeline not immediate**: Takes 2-5 seconds to appear
2. **Limited timeline**: Only first 10 issues get timeline
3. **Two API calls**: Initial + background sync

## 🐛 Why Timeline Might Not Show

### Common Issues:

1. **Database Not Updated**
   - Check: Backend logs show "✓ Timeline fetched: X events"
   - Fix: Ensure `syncRepository` is being called

2. **Frontend Not Reloading**
   - Check: Console shows "✅ Updated repoIssues[...] with X issues"
   - Fix: Ensure `getStoredRepositoryDetails` is called after sync

3. **Timeline Data Structure Mismatch**
   - Check: Console shows timeline array structure
   - Fix: Verify `IssueSchema` in `repository.model.js`

4. **Change Detection Not Triggered**
   - Check: UI doesn't update even though data changed
   - Fix: Use spread operator `[...dbResponse.data.issues]`

## 🔍 Debugging

### Frontend Console Logs:
```
🔄 Starting sync for owner/repo...
✅ Repository owner/repo synced successfully
📥 Loading repository details from database...
📦 Database response: { success: true, data: {...} }
✅ Loaded repository from database with 10 issues
📊 First issue timeline data: [{event: 'closed', ...}, ...]
📊 Timeline count: 5
✅ Updated repoIssues[owner/repo] with 10 issues
```

### Backend Console Logs:
```
Fetching issues for owner/repo...
  Fetching timeline for issue #123...
    ✓ Timeline fetched: 5 events
  Fetching timeline for issue #124...
    ✓ Timeline fetched: 3 events
✓ Saved 50 issues (10 with timeline)
```

## 📝 Summary

| Aspect | Details |
|--------|---------|
| **When Fetched** | During background sync after initial load |
| **How Many** | First 10 issues only (rate limit protection) |
| **Where Stored** | MongoDB `repositories` collection |
| **How Displayed** | Reloaded from database after sync completes |
| **Time to Appear** | 2-5 seconds after expanding repository |

## 🚀 Future Improvements

1. **On-Demand Timeline**: Fetch timeline when user expands issue
2. **Cached Timeline**: Store in localStorage for faster subsequent loads
3. **Pagination**: Fetch timeline for more issues on demand
4. **Real-time Updates**: WebSocket for live timeline updates
5. **Loading Indicator**: Show spinner while timeline is loading

