const Integration = require('../models/integration.model');
const Organization = require('../models/organization.model');
const Repository = require('../models/repository.model');
const axios = require('axios');
const GitHubHelper = require('../helpers/github.helper');

// GitHub OAuth Configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/integrations/github/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

/**
 * Get GitHub OAuth authorization URL
 */
exports.getGitHubAuthUrl = (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Generate state parameter (Base64 encoded)
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}&scope=user:email,repo,read:org&state=${state}`;

    res.json({
      success: true,
      authUrl,
      state
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Handle GitHub OAuth callback
 */
exports.handleGitHubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/integrations?error=missing_params`);
    }

    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL
    }, {
      headers: {
        Accept: 'application/json'
      }
    });

    const { access_token, token_type, scope } = tokenResponse.data;

    if (!access_token) {
      return res.redirect(`${FRONTEND_URL}/integrations?error=no_token`);
    }

    // Get user information from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const githubUser = userResponse.data;

    // Store integration in database
    const integration = await Integration.findOrCreate({
      userId,
      provider: 'github',
      providerUserId: githubUser.id.toString(),
      username: githubUser.login,
      email: githubUser.email,
      displayName: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      accessToken: access_token,
      tokenType: token_type,
      scope,
      profileUrl: githubUser.html_url,
      connectedAt: new Date(),
      status: 'active',
      metadata: {
        bio: githubUser.bio,
        company: githubUser.company,
        location: githubUser.location,
        publicRepos: githubUser.public_repos,
        followers: githubUser.followers,
        following: githubUser.following
      }
    });

    // Redirect back to frontend with success
    res.redirect(`${FRONTEND_URL}/integrations?success=true&provider=github`);
  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/integrations?error=auth_failed`);
  }
};

/**
 * Get integration status for a user
 */
exports.getIntegrationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { provider } = req.query;

    const query = { userId };
    if (provider) {
      query.provider = provider;
    }

    const integrations = await Integration.find(query);

    if (!integrations || integrations.length === 0) {
      return res.json({
        success: true,
        connected: false,
        message: 'No integrations found',
        integrations: []
      });
    }

    res.json({
      success: true,
      connected: true,
      count: integrations.length,
      integrations: integrations.map(integration => integration.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Disconnect an integration
 */
exports.disconnectIntegration = async (req, res) => {
  try {
    const { userId, provider } = req.params;
    debugger;
    const result = await Integration.findOneAndDelete({ userId, provider });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    res.json({
      success: true,
      message: 'Integration disconnected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all integrations for a user
 */
exports.getAllIntegrations = async (req, res) => {
  try {
    const { userId } = req.params;

    const integrations = await Integration.find({ userId });

    res.json({
      success: true,
      count: integrations.length,
      data: integrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * =====================================================
 * FETCH GITHUB DATA ENDPOINTS
 * =====================================================
 */

/**
 * Fetch user's organizations
 * GET /api/integrations/github/data/organizations/:userId
 */
exports.getGitHubOrganizations = async (req, res) => {
  try {
    const { userId } = req.params;
    // Get user's integration
    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found. Please connect your GitHub account first.'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.getOrganizations();


    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fetch organization repositories
 * GET /api/integrations/github/data/organizations/:orgName/repos
 */
exports.getGitHubOrgRepos = async (req, res) => {
  try {
    const { orgName } = req.params;
    const { userId } = req.query;

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.getOrganizationRepos(orgName);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fetch repository commits
 * GET /api/integrations/github/data/repos/:owner/:repo/commits
 */
exports.getGitHubRepoCommits = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { userId, per_page = 100, page = 1 } = req.query;

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.getRepoCommits(owner, repo, { per_page, page });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fetch repository pull requests
 * GET /api/integrations/github/data/repos/:owner/:repo/pulls
 */
exports.getGitHubRepoPulls = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { userId, state = 'all', per_page = 100, page = 1 } = req.query;

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.getRepoPullRequests(owner, repo, { state, per_page, page });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fetch repository issues
 * GET /api/integrations/github/data/repos/:owner/:repo/issues
 */
exports.getGitHubRepoIssues = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { userId, state = 'all', per_page = 100, page = 1 } = req.query;

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.getRepoIssues(owner, repo, { state, per_page, page });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fetch issue timeline/changelog
 * GET /api/integrations/github/data/repos/:owner/:repo/issues/:issueNumber/timeline
 */
exports.getGitHubIssueTimeline = async (req, res) => {
  try {
    const { owner, repo, issueNumber } = req.params;
    const { userId } = req.query;

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.getIssueTimeline(owner, repo, issueNumber);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fetch organization members/users
 * GET /api/integrations/github/data/organizations/:orgName/members
 */
exports.getGitHubOrgMembers = async (req, res) => {
  try {
    const { orgName } = req.params;
    const { userId } = req.query;

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.getOrganizationMembers(orgName);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * COMPREHENSIVE: Fetch complete organization data
 * GET /api/integrations/github/data/organizations/:orgName/complete
 */
exports.getCompleteOrgData = async (req, res) => {
  try {
    const { orgName } = req.params;
    const { userId } = req.query;

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const result = await github.fetchCompleteOrganizationData(orgName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * =====================================================
 * SYNC & STORE GITHUB DATA TO DATABASE
 * =====================================================
 */

/**
 * Sync and store organization data (including members)
 * POST /api/integrations/github/sync/organization/:orgName
 */
exports.syncOrganizationData = async (req, res) => {
  try {
    const { orgName } = req.params;
    const { userId } = req.body;

    if (!userId || !orgName) {
      return res.status(400).json({
        success: false,
        error: 'userId and orgName are required'
      });
    }

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    
    // Fetch organization details
    const orgDetailsResult = await github.getOrganizationDetails(orgName);
    if (!orgDetailsResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch organization details: ${orgDetailsResult.error}`
      });
    }

    // Fetch organization members
    const membersResult = await github.getOrganizationMembers(orgName);
    const members = membersResult.success ? membersResult.data : [];

    // Save to database
    const organization = await Organization.syncOrganization(
      userId,
      orgDetailsResult.data,
      members
    );

    // Return full organization data
    res.json({
      success: true,
      message: 'Organization data synced successfully',
      data: organization.toJSON(),
      syncStats: {
        membersCount: members.length
      }
    });
  } catch (error) {
    console.error('Sync organization error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync and store repository data (including commits, pulls, issues)
 * POST /api/integrations/github/sync/repository/:owner/:repo
 */
exports.syncRepositoryData = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { userId, includeCommits = true, includePulls = true, includeIssues = true } = req.body;

    if (!userId || !owner || !repo) {
      return res.status(400).json({
        success: false,
        error: 'userId, owner, and repo are required'
      });
    }

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    
    // Fetch repository details
    const repoResult = await github.getRepositoryDetails(owner, repo);
    if (!repoResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch repository: ${repoResult.error}`
      });
    }

    // Save repository base data
    const repository = await Repository.syncRepository(userId, owner, repoResult.data);

    const syncResults = {
      repository: repository.name,
      commits: 0,
      pullRequests: 0,
      issues: 0
    };

    // Fetch and store commits
    if (includeCommits) {
      const commitsResult = await github.getRepoCommits(owner, repo, { per_page: 100 });
      if (commitsResult.success && commitsResult.data.length > 0) {
        await repository.updateCommits(commitsResult.data);
        syncResults.commits = commitsResult.data.length;
      }
    }

    // Fetch and store pull requests
    if (includePulls) {
      const pullsResult = await github.getRepoPullRequests(owner, repo, { state: 'all', per_page: 100 });
      if (pullsResult.success && pullsResult.data.length > 0) {
        await repository.updatePullRequests(pullsResult.data);
        syncResults.pullRequests = pullsResult.data.length;
      }
    }

    // Fetch and store issues
    if (includeIssues) {
      const issuesResult = await github.getRepoIssues(owner, repo, { state: 'all', per_page: 100 });
      if (issuesResult.success && issuesResult.data.length > 0) {
        // Fetch timeline for each issue in PARALLEL with batching (to avoid blocking event loop)
        const issuesToFetchTimeline = issuesResult.data.slice(0, 30);
        const batchSize = 5; // Process 5 timelines in parallel
        let timelineFetchedCount = 0;
        
        // Helper function to process a batch
        const processBatch = async (batch) => {
          const timelinePromises = batch.map(async (issue) => {
            try {
              const timelineResult = await github.getIssueTimeline(owner, repo, issue.number);
              
              if (timelineResult.success && timelineResult.data) {
                issue.timeline = timelineResult.data.map(event => ({
                  event: event.event,
                  createdAt: event.created_at,
                  actor: {
                    login: event.actor?.login,
                    avatarUrl: event.actor?.avatar_url,
                    htmlUrl: event.actor?.html_url
                  },
                  label: event.label ? {
                    name: event.label.name,
                    color: event.label.color
                  } : undefined,
                  assignee: event.assignee ? {
                    login: event.assignee.login,
                    avatarUrl: event.assignee.avatar_url
                  } : undefined,
                  body: event.body,
                  htmlUrl: event.html_url
                }));
                console.log(`    ✓ Timeline fetched: ${issue.timeline.length} events`);
                return true;
              }
              return false;
            } catch (error) {
              console.error(`    ✗ Failed to fetch timeline for issue #${issue.number}:`, error.message);
              return false;
            }
          });
          
          const results = await Promise.allSettled(timelinePromises);
          return results.filter(r => r.status === 'fulfilled' && r.value).length;
        };
        
        // Process issues in batches to avoid blocking event loop
        for (let i = 0; i < issuesToFetchTimeline.length; i += batchSize) {
          const batch = issuesToFetchTimeline.slice(i, i + batchSize);
          const successCount = await processBatch(batch);
          timelineFetchedCount += successCount;
        }
        
        // Combine all issues (with and without timelines)
        const allIssues = [...issuesResult.data];
        
        await repository.updateIssues(allIssues);
        syncResults.issues = issuesResult.data.length;
      }
    }

    // Reload repository with all synced data
    const fullRepository = await Repository.findOne({
      userId,
      organizationLogin: owner,
      name: repo
    });

    res.json({
      success: true,
      message: 'Repository data synced successfully',
      data: fullRepository,
      syncStats: syncResults
    });
  } catch (error) {
    console.error('Sync repository error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Sync all repositories for an organization
 * POST /api/integrations/github/sync/organization/:orgName/repositories
 */
exports.syncAllOrgRepositories = async (req, res) => {
  try {
    const { orgName } = req.params;
    const { userId, limit = 10, includeDetails = true } = req.body;

    if (!userId || !orgName) {
      return res.status(400).json({
        success: false,
        error: 'userId and orgName are required'
      });
    }

    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    
    // First sync the organization
    const orgDetailsResult = await github.getOrganizationDetails(orgName);
    if (orgDetailsResult.success) {
      const membersResult = await github.getOrganizationMembers(orgName);
      await Organization.syncOrganization(
        userId,
        orgDetailsResult.data,
        membersResult.success ? membersResult.data : []
      );
    }

    // Fetch all repositories
    const reposResult = await github.getOrganizationRepos(orgName, { per_page: 100 });
    if (!reposResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch repositories: ${reposResult.error}`
      });
    }

    const repos = reposResult.data.slice(0, limit);
    const syncResults = [];

    // Sync each repository
    for (const repoData of repos) {
      try {
        const repository = await Repository.syncRepository(userId, orgName, repoData);
        
        const repoResult = {
          name: repository.name,
          synced: true,
          commits: 0,
          pullRequests: 0,
          issues: 0
        };

        if (includeDetails) {
          // Sync commits, pulls, and issues
          const [commitsResult, pullsResult, issuesResult] = await Promise.allSettled([
            github.getRepoCommits(repoData.owner.login, repoData.name, { per_page: 50 }),
            github.getRepoPullRequests(repoData.owner.login, repoData.name, { state: 'all', per_page: 50 }),
            github.getRepoIssues(repoData.owner.login, repoData.name, { state: 'all', per_page: 50 })
          ]);

          if (commitsResult.success && commitsResult.data.length > 0) {
            await repository.updateCommits(commitsResult.data);
            repoResult.commits = commitsResult.data.length;
          }

          if (pullsResult.success && pullsResult.data.length > 0) {
            await repository.updatePullRequests(pullsResult.data);
            repoResult.pullRequests = pullsResult.data.length;
          }

          if (issuesResult.success && issuesResult.data.length > 0) {
            await repository.updateIssues(issuesResult.data);
            repoResult.issues = issuesResult.data.length;
          }
        }

        syncResults.push(repoResult);
      } catch (repoError) {
        console.error(`Failed to sync ${repoData.name}:`, repoError.message);
        syncResults.push({
          name: repoData.name,
          synced: false,
          error: repoError.message
        });
      }
    }

    // Update organization repository count
    const organization = await Organization.findOne({ userId, login: orgName });
    if (organization) {
      await organization.updateRepositoryCount(repos.length);
    }

    res.json({
      success: true,
      message: `Synced ${syncResults.filter(r => r.synced).length} of ${repos.length} repositories`,
      data: {
        organization: orgName,
        totalRepos: reposResult.data.length,
        syncedRepos: syncResults.filter(r => r.synced).length,
        repositories: syncResults
      }
    });
  } catch (error) {
    console.error('Sync all repositories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get stored organization data
 * GET /api/integrations/github/stored/organizations/:userId
 */
exports.getStoredOrganizations = async (req, res) => {
  try {
    const { userId } = req.params;

    const organizations = await Organization.find({ userId }).sort({ lastSyncedAt: -1 });

    res.json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    console.error('Get stored organizations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get stored repositories for an organization
 * GET /api/integrations/github/stored/organizations/:orgName/repositories
 */
exports.getStoredOrgRepositories = async (req, res) => {
  try {
    const { orgName } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const repositories = await Repository.find({ 
      userId, 
      organizationLogin: orgName 
    })
    .select('-commits -pullRequests -issues') // Exclude large arrays for list view
    .sort({ lastSyncedAt: -1 });

    res.json({
      success: true,
      count: repositories.length,
      data: repositories
    });
  } catch (error) {
    console.error('Get stored repositories error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get stored repository details with commits, pulls, and issues
 * GET /api/integrations/github/stored/repositories/:owner/:repo
 */
exports.getStoredRepositoryDetails = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const repository = await Repository.findOne({
      userId,
      organizationLogin: owner,
      name: repo
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found in database'
      });
    }

    res.json({
      success: true,
      data: repository
    });
  } catch (error) {
    console.error('Get stored repository details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Fetch and store issue timeline for a specific issue (on-demand)
 * POST /api/integrations/github/sync/issue-timeline/:owner/:repo/:issueNumber
 */
exports.syncIssueTimeline = async (req, res) => {
  try {
    const { owner, repo, issueNumber } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Find the repository in database
    const Repository = require('../models/repository.model');
    const repository = await Repository.findOne({
      userId,
      'owner.login': owner,
      name: repo
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found in database'
      });
    }

    // Find the issue
    const issue = repository.issues.find(i => i.number === parseInt(issueNumber));
    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found in database'
      });
    }

    // Check if timeline already exists
    if (issue.timeline && issue.timeline.length > 0) {
      return res.json({
        success: true,
        message: 'Timeline already exists',
        data: issue.timeline,
        cached: true
      });
    }

    // Fetch timeline from GitHub
    const integration = await Integration.findOne({ userId, provider: 'github', status: 'active' });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'GitHub integration not found'
      });
    }

    const github = new GitHubHelper(integration.accessToken);
    const timelineResult = await github.getIssueTimeline(owner, repo, issueNumber);

    if (!timelineResult.success || !timelineResult.data) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch timeline from GitHub'
      });
    }

    // Map timeline data
    const timeline = timelineResult.data.map(event => ({
      event: event.event,
      createdAt: event.created_at,
      actor: {
        login: event.actor?.login,
        avatarUrl: event.actor?.avatar_url,
        htmlUrl: event.actor?.html_url
      },
      label: event.label ? {
        name: event.label.name,
        color: event.label.color
      } : undefined,
      assignee: event.assignee ? {
        login: event.assignee.login,
        avatarUrl: event.assignee.avatar_url
      } : undefined,
      body: event.body,
      htmlUrl: event.html_url
    }));

    // Update issue with timeline
    issue.timeline = timeline;
    issue.timelineCount = timeline.length;
    await repository.save();

    res.json({
      success: true,
      message: 'Timeline fetched and saved successfully',
      data: timeline,
      cached: false
    });
  } catch (error) {
    console.error('Error syncing issue timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
