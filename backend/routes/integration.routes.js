const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');

// Base route - List available endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Integration API',
    categories: {
      oauth: 'OAuth Authentication',
      management: 'Integration Management',
      data: 'GitHub Data Fetching'
    },
    endpoints: {
      // OAuth
      'GET /api/integrations/github/auth?userId=<userId>': 'Get GitHub OAuth authorization URL',
      'GET /api/integrations/github/callback': 'GitHub OAuth callback (auto-redirect)',
      
      // Management
      'GET /api/integrations/status/<userId>?provider=<provider>': 'Get integration status',
      'GET /api/integrations/<userId>': 'Get all integrations for user',
      'DELETE /api/integrations/<userId>/<provider>': 'Disconnect integration',
      
      // GitHub Data Fetching
      'GET /api/integrations/github/data/organizations/<userId>': 'Get user\'s organizations',
      'GET /api/integrations/github/data/organizations/<orgName>/repos?userId=<userId>': 'Get organization repositories',
      'GET /api/integrations/github/data/repos/<owner>/<repo>/commits?userId=<userId>': 'Get repository commits',
      'GET /api/integrations/github/data/repos/<owner>/<repo>/pulls?userId=<userId>': 'Get repository pull requests',
      'GET /api/integrations/github/data/repos/<owner>/<repo>/issues?userId=<userId>': 'Get repository issues',
      'GET /api/integrations/github/data/repos/<owner>/<repo>/issues/<issueNumber>/timeline?userId=<userId>': 'Get issue timeline/changelog',
      'GET /api/integrations/github/data/organizations/<orgName>/members?userId=<userId>': 'Get organization members',
      'GET /api/integrations/github/data/organizations/<orgName>/complete?userId=<userId>': 'Get complete org data (comprehensive)'
    },
    examples: {
      oauth: {
        getAuthUrl: 'GET /api/integrations/github/auth?userId=demo-user-123',
        checkStatus: 'GET /api/integrations/status/demo-user-123?provider=github'
      },
      data: {
        getOrganizations: 'GET /api/integrations/github/data/organizations/demo-user-123',
        getOrgRepos: 'GET /api/integrations/github/data/organizations/myorg/repos?userId=demo-user-123',
        getCommits: 'GET /api/integrations/github/data/repos/myorg/myrepo/commits?userId=demo-user-123',
        getPulls: 'GET /api/integrations/github/data/repos/myorg/myrepo/pulls?userId=demo-user-123&state=open',
        getIssues: 'GET /api/integrations/github/data/repos/myorg/myrepo/issues?userId=demo-user-123&state=all',
        getIssueTimeline: 'GET /api/integrations/github/data/repos/myorg/myrepo/issues/1/timeline?userId=demo-user-123',
        getOrgMembers: 'GET /api/integrations/github/data/organizations/myorg/members?userId=demo-user-123',
        getCompleteData: 'GET /api/integrations/github/data/organizations/myorg/complete?userId=demo-user-123'
      }
    }
  });
});

// GitHub OAuth routes
router.get('/github/auth', integrationController.getGitHubAuthUrl);
router.get('/github/callback', integrationController.handleGitHubCallback);

// Integration management routes
router.get('/status/:userId', integrationController.getIntegrationStatus);
router.get('/:userId', integrationController.getAllIntegrations);
router.delete('/:userId/:provider', integrationController.disconnectIntegration);

// =====================================================
// GITHUB DATA FETCHING ROUTES
// =====================================================

// a. Organizations
router.get('/github/data/organizations/:userId', integrationController.getGitHubOrganizations);

// b. Organization Repositories
router.get('/github/data/organizations/:orgName/repos', integrationController.getGitHubOrgRepos);

// c. Repository Commits
router.get('/github/data/repos/:owner/:repo/commits', integrationController.getGitHubRepoCommits);

// d. Repository Pull Requests
router.get('/github/data/repos/:owner/:repo/pulls', integrationController.getGitHubRepoPulls);

// e. Repository Issues
router.get('/github/data/repos/:owner/:repo/issues', integrationController.getGitHubRepoIssues);

// f. Issue Timeline/Changelog
router.get('/github/data/repos/:owner/:repo/issues/:issueNumber/timeline', integrationController.getGitHubIssueTimeline);

// g. Organization Members/Users
router.get('/github/data/organizations/:orgName/members', integrationController.getGitHubOrgMembers);

// COMPREHENSIVE: Get complete organization data
router.get('/github/data/organizations/:orgName/complete', integrationController.getCompleteOrgData);

// =====================================================
// SYNC & STORE GITHUB DATA TO DATABASE
// =====================================================

// Sync organization data (including members)
router.post('/github/sync/organization/:orgName', integrationController.syncOrganizationData);

// Sync single repository data (including commits, pulls, issues)
router.post('/github/sync/repository/:owner/:repo', integrationController.syncRepositoryData);

// Sync all repositories for an organization
router.post('/github/sync/organization/:orgName/repositories', integrationController.syncAllOrgRepositories);

// Get stored organization data
router.get('/github/stored/organizations/:userId', integrationController.getStoredOrganizations);

// Get stored repositories for an organization
router.get('/github/stored/organizations/:orgName/repositories', integrationController.getStoredOrgRepositories);

// Get stored repository details with commits, pulls, and issues
router.get('/github/stored/repositories/:owner/:repo', integrationController.getStoredRepositoryDetails);

// Sync single issue timeline on-demand
router.post('/github/sync/issue-timeline/:owner/:repo/:issueNumber', integrationController.syncIssueTimeline);

// =====================================================
// AG GRID DATA ENDPOINTS
// =====================================================

const gridController = require('../controllers/grid.controller');

// Get available collections
router.get('/github/collections', gridController.getCollections);

// Get collection schema for dynamic columns
router.get('/github/collection-schema/:collection', gridController.getCollectionSchema);

// Get paginated, sorted, filtered data for AG Grid
router.get('/github/grid-data/:collection', gridController.getGridData);

module.exports = router;

