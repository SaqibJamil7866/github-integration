const mongoose = require('mongoose');

// Sub-schemas for commits, pulls, and issues
const CommitSchema = new mongoose.Schema({
  sha: { type: String, required: true },
  message: String,
  author: {
    name: String,
    email: String,
    date: Date,
    login: String,
    avatarUrl: String
  },
  committer: {
    name: String,
    email: String,
    date: Date
  },
  htmlUrl: String,
  stats: {
    additions: Number,
    deletions: Number,
    total: Number
  },
  files: [{
    filename: String,
    status: String,
    additions: Number,
    deletions: Number,
    changes: Number
  }],
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const PullRequestSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  title: String,
  state: String, // open, closed, merged
  user: {
    login: String,
    avatarUrl: String,
    htmlUrl: String
  },
  body: String,
  htmlUrl: String,
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date,
  mergedAt: Date,
  mergedBy: {
    login: String,
    avatarUrl: String
  },
  labels: [{
    name: String,
    color: String,
    description: String
  }],
  comments: Number,
  reviewComments: Number,
  commits: Number,
  additions: Number,
  deletions: Number,
  changedFiles: Number
}, { _id: false });

const IssueSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  title: String,
  state: String, // open, closed
  user: {
    login: String,
    avatarUrl: String,
    htmlUrl: String
  },
  body: String,
  htmlUrl: String,
  labels: [{
    name: String,
    color: String,
    description: String
  }],
  assignees: [{
    login: String,
    avatarUrl: String
  }],
  comments: Number,
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date,
  closedBy: {
    login: String,
    avatarUrl: String
  },
  // Timeline/Changelog events
  timeline: [{
    event: String, // e.g., 'commented', 'labeled', 'closed', 'reopened', 'assigned', etc.
    createdAt: Date,
    actor: {
      login: String,
      avatarUrl: String,
      htmlUrl: String
    },
    // Event-specific data
    label: {
      name: String,
      color: String
    },
    assignee: {
      login: String,
      avatarUrl: String
    },
    body: String, // For comments
    htmlUrl: String
  }],
  timelineCount: { type: Number, default: 0 }
}, { _id: false });

// Main Repository Schema
const RepositorySchema = new mongoose.Schema({
  // User/Integration reference
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Organization reference
  organizationLogin: {
    type: String,
    required: true,
    index: true
  },
  
  // GitHub repository details
  githubId: {
    type: Number,
    required: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  fullName: String, // owner/repo
  
  description: String,
  
  owner: {
    login: { type: String },
    avatarUrl: { type: String },
    type: { type: String }
  },
  
  htmlUrl: String,
  
  private: {
    type: Boolean,
    default: false
  },
  
  // Repository metadata
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
  
  // Repository data
  commits: [CommitSchema],
  pullRequests: [PullRequestSchema],
  issues: [IssueSchema],
  
  // Data counts for quick reference
  dataCounts: {
    commits: { type: Number, default: 0 },
    pullRequests: { type: Number, default: 0 },
    issues: { type: Number, default: 0 }
  },
  
  // Sync metadata
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'completed', 'partial', 'failed'],
    default: 'pending'
  },
  
  syncDetails: {
    commits: { status: String, count: Number, lastSynced: Date },
    pullRequests: { status: String, count: Number, lastSynced: Date },
    issues: { status: String, count: Number, lastSynced: Date }
  },
  
  syncError: String

}, {
  timestamps: true,
  collection: 'repositories'
});

// Indexes
RepositorySchema.index({ userId: 1, organizationLogin: 1, name: 1 }, { unique: true });
RepositorySchema.index({ userId: 1, githubId: 1 });
RepositorySchema.index({ 'commits.sha': 1 });
RepositorySchema.index({ 'pullRequests.number': 1 });
RepositorySchema.index({ 'issues.number': 1 });

// Static methods
RepositorySchema.statics.findOrCreate = async function(repoData) {
  const { userId, organizationLogin, name, githubId } = repoData;
  
  let repository = await this.findOne({ userId, organizationLogin, name });
  
  if (repository) {
    // Update existing
    Object.assign(repository, repoData);
    repository.lastSyncedAt = new Date();
    await repository.save();
  } else {
    // Create new
    repository = await this.create(repoData);
  }
  
  return repository;
};

RepositorySchema.statics.syncRepository = async function(userId, orgLogin, repoData) {
  const repository = await this.findOrCreate({
    userId,
    organizationLogin: orgLogin,
    githubId: repoData.id,
    name: repoData.name,
    fullName: repoData.full_name,
    description: repoData.description,
    owner: {
      login: repoData.owner.login,
      avatarUrl: repoData.owner.avatar_url,
      type: repoData.owner.type
    },
    htmlUrl: repoData.html_url,
    private: repoData.private,
    language: repoData.language,
    defaultBranch: repoData.default_branch,
    stats: {
      stargazersCount: repoData.stargazers_count,
      watchersCount: repoData.watchers_count,
      forksCount: repoData.forks_count,
      openIssuesCount: repoData.open_issues_count,
      size: repoData.size
    },
    timestamps: {
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      pushedAt: repoData.pushed_at
    },
    topics: repoData.topics || [],
    lastSyncedAt: new Date(),
    syncStatus: 'completed'
  });
  
  return repository;
};

// Instance methods
RepositorySchema.methods.updateCommits = async function(commits) {
  
  // Add only new commits (avoid duplicates based on SHA)
  const existingShas = new Set(this.commits.map(c => c.sha));
  
  const newCommits = commits
    .filter(commit => !existingShas.has(commit.sha))
    .map(commit => ({
      sha: commit.sha,
      message: commit.commit?.message,
      author: {
        name: commit.commit?.author?.name,
        email: commit.commit?.author?.email,
        date: commit.commit?.author?.date,
        login: commit.author?.login,
        avatarUrl: commit.author?.avatar_url
      },
      committer: {
        name: commit.commit?.committer?.name,
        email: commit.commit?.committer?.email,
        date: commit.commit?.committer?.date
      },
      htmlUrl: commit.html_url,
      stats: commit.stats,
      files: commit.files
    }));
  
  
  this.commits.push(...newCommits);
  this.dataCounts.commits = this.commits.length;
  this.syncDetails.commits = {
    status: 'completed',
    count: newCommits.length,
    lastSynced: new Date()
  };
  this.lastSyncedAt = new Date();
  
  await this.save();
  return this;
};

RepositorySchema.methods.updatePullRequests = async function(pulls) {
  
  // Add or update pull requests
  const existingPRs = new Map(this.pullRequests.map(pr => [pr.number, pr]));
  
  let updatedCount = 0;
  let newCount = 0;
  
  pulls.forEach(pull => {
    const prData = {
      number: pull.number,
      title: pull.title,
      state: pull.state,
      user: {
        login: pull.user?.login,
        avatarUrl: pull.user?.avatar_url,
        htmlUrl: pull.user?.html_url
      },
      body: pull.body,
      htmlUrl: pull.html_url,
      createdAt: pull.created_at,
      updatedAt: pull.updated_at,
      closedAt: pull.closed_at,
      mergedAt: pull.merged_at,
      mergedBy: pull.merged_by ? {
        login: pull.merged_by.login,
        avatarUrl: pull.merged_by.avatar_url
      } : undefined,
      labels: pull.labels?.map(label => ({
        name: label.name,
        color: label.color,
        description: label.description
      })),
      comments: pull.comments,
      reviewComments: pull.review_comments,
      commits: pull.commits,
      additions: pull.additions,
      deletions: pull.deletions,
      changedFiles: pull.changed_files
    };
    
    if (existingPRs.has(pull.number)) {
      // Update existing
      Object.assign(existingPRs.get(pull.number), prData);
      updatedCount++;
    } else {
      // Add new
      this.pullRequests.push(prData);
      newCount++;
    }
  });
  
  
  this.dataCounts.pullRequests = this.pullRequests.length;
  this.syncDetails.pullRequests = {
    status: 'completed',
    count: pulls.length,
    lastSynced: new Date()
  };
  this.lastSyncedAt = new Date();
  
  await this.save();
  return this;
};

RepositorySchema.methods.updateIssues = async function(issues) {
  
  // Add or update issues
  const existingIssues = new Map(this.issues.map(issue => [issue.number, issue]));
  
  let updatedCount = 0;
  let newCount = 0;
  
  issues.forEach(issue => {
    const issueData = {
      number: issue.number,
      title: issue.title,
      state: issue.state,
      user: {
        login: issue.user?.login,
        avatarUrl: issue.user?.avatar_url,
        htmlUrl: issue.user?.html_url
      },
      body: issue.body,
      htmlUrl: issue.html_url,
      labels: issue.labels?.map(label => ({
        name: label.name,
        color: label.color,
        description: label.description
      })),
      assignees: issue.assignees?.map(assignee => ({
        login: assignee.login,
        avatarUrl: assignee.avatar_url
      })),
      comments: issue.comments,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      closedBy: issue.closed_by ? {
        login: issue.closed_by.login,
        avatarUrl: issue.closed_by.avatar_url
      } : undefined,
      // Include timeline if provided
      timeline: issue.timeline || [],
      timelineCount: issue.timeline?.length || 0
    };
    
    if (existingIssues.has(issue.number)) {
      // Update existing
      Object.assign(existingIssues.get(issue.number), issueData);
      updatedCount++;
    } else {
      // Add new
      this.issues.push(issueData);
      newCount++;
    }
  });
  
  
  this.dataCounts.issues = this.issues.length;
  this.syncDetails.issues = {
    status: 'completed',
    count: issues.length,
    lastSynced: new Date()
  };
  this.lastSyncedAt = new Date();
  
  await this.save();
  return this;
};

const Repository = mongoose.model('Repository', RepositorySchema);

module.exports = Repository;

