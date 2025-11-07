const axios = require('axios');

/**
 * GitHub API Helper
 * Fetches various data from GitHub API
 */

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubHelper {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    };
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(url, params = {}) {
    try {
      const response = await axios.get(url, {
        headers: this.headers,
        params
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`GitHub API Error: ${url}`, error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  /**
   * a. Get user's organizations
   * https://docs.github.com/en/rest/orgs/orgs#list-organizations-for-the-authenticated-user
   */
  async getOrganizations() {
    
    // Get organizations the user is a member of
    const orgsResult = await this.makeRequest(`${GITHUB_API_BASE}/user/orgs`);
    
    // Also get the authenticated user's info to include their personal account
    const userResult = await this.makeRequest(`${GITHUB_API_BASE}/user`);
    
    if (!orgsResult.success || !userResult.success) {
      return { success: false, error: orgsResult.error || userResult.error };
    }
    
    // Combine user's personal account with their organizations
    const organizations = [];
    
    // Add user's personal account as the first "organization"
    if (userResult.success && userResult.data) {
      organizations.push({
        login: userResult.data.login,
        id: userResult.data.id,
        avatar_url: userResult.data.avatar_url,
        description: userResult.data.bio || 'Personal Account',
        url: userResult.data.html_url,
        type: 'User' // Mark as personal account
      });
    }
    
    // Add actual organizations
    if (orgsResult.success && orgsResult.data) {
      organizations.push(...orgsResult.data);
    }
    
    return { success: true, data: organizations };
  }

  /**
   * Get organization details
   */
  async getOrganizationDetails(orgName) {
    return await this.makeRequest(`${GITHUB_API_BASE}/orgs/${orgName}`);
  }

  /**
   * Get user details (for personal accounts)
   */
  async getUserDetails(username) {
    return await this.makeRequest(`${GITHUB_API_BASE}/users/${username}`);
  }

  /**
   * Get repository details
   */
  async getRepositoryDetails(owner, repo) {
    return await this.makeRequest(`${GITHUB_API_BASE}/repos/${owner}/${repo}`);
  }

  /**
   * b. Get organization repositories
   * https://docs.github.com/en/rest/repos/repos#list-organization-repositories
   * Note: Also handles personal account repos by detecting if orgName is a user
   */
  async getOrganizationRepos(orgName, params = {}) {
    const defaultParams = {
      per_page: 100,
      sort: 'updated',
      ...params
    };
    
    // First, try to get as organization repos
    let result = await this.makeRequest(
      `${GITHUB_API_BASE}/orgs/${orgName}/repos`,
      defaultParams
    );
    
    // If failed (might be a user account, not an org), try user repos
    if (!result.success) {
      result = await this.makeRequest(
        `${GITHUB_API_BASE}/users/${orgName}/repos`,
        defaultParams
      );
    }
    
    return result;
  }

  /**
   * Get user's repositories (if no org)
   */
  async getUserRepos(params = {}) {
    const defaultParams = {
      per_page: 100,
      sort: 'updated',
      ...params
    };
    return await this.makeRequest(
      `${GITHUB_API_BASE}/user/repos`,
      defaultParams
    );
  }

  /**
   * c. Get repository commits
   * https://docs.github.com/en/rest/commits/commits#list-commits
   */
  async getRepoCommits(owner, repo, params = {}) {
    const defaultParams = {
      per_page: 100,
      ...params
    };
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits`,
      defaultParams
    );
  }

  /**
   * Get commit details
   */
  async getCommitDetails(owner, repo, commitSha) {
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${commitSha}`
    );
  }

  /**
   * d. Get repository pull requests
   * https://docs.github.com/en/rest/pulls/pulls#list-pull-requests
   */
  async getRepoPullRequests(owner, repo, params = {}) {
    const defaultParams = {
      state: 'all', // 'open', 'closed', 'all'
      per_page: 100,
      sort: 'updated',
      ...params
    };
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`,
      defaultParams
    );
  }

  /**
   * Get pull request details
   */
  async getPullRequestDetails(owner, repo, pullNumber) {
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}`
    );
  }

  /**
   * e. Get repository issues
   * https://docs.github.com/en/rest/issues/issues#list-repository-issues
   */
  async getRepoIssues(owner, repo, params = {}) {
    const defaultParams = {
      state: 'all', // 'open', 'closed', 'all'
      per_page: 100,
      sort: 'updated',
      ...params
    };
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues`,
      defaultParams
    );
  }

  /**
   * Get issue details
   */
  async getIssueDetails(owner, repo, issueNumber) {
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`
    );
  }

  /**
   * f. Get issue comments/timeline (changelogs)
   * https://docs.github.com/en/rest/issues/comments#list-issue-comments
   */
  async getIssueComments(owner, repo, issueNumber) {
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`
    );
  }

  /**
   * Get issue timeline (complete history/changelog)
   * https://docs.github.com/en/rest/issues/timeline
   */
  async getIssueTimeline(owner, repo, issueNumber) {
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/timeline`,
      {},
      {
        Accept: 'application/vnd.github.mockingbird-preview+json'
      }
    );
  }

  /**
   * Get issue events (status changes, labels, etc.)
   */
  async getIssueEvents(owner, repo, issueNumber) {
    return await this.makeRequest(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/events`
    );
  }

  /**
   * g. Get organization members/users
   * https://docs.github.com/en/rest/orgs/members#list-organization-members
   */
  async getOrganizationMembers(orgName, params = {}) {
    const defaultParams = {
      per_page: 100,
      ...params
    };
    return await this.makeRequest(
      `${GITHUB_API_BASE}/orgs/${orgName}/members`,
      defaultParams
    );
  }

  /**
   * Get organization teams
   */
  async getOrganizationTeams(orgName) {
    return await this.makeRequest(
      `${GITHUB_API_BASE}/orgs/${orgName}/teams`
    );
  }

  /**
   * COMPREHENSIVE: Fetch all data for an organization
   */
  async fetchCompleteOrganizationData(orgName) {

    const result = {
      organization: null,
      repos: [],
      members: [],
      teams: [],
      details: {}
    };

    // 1. Get organization details
    const orgDetails = await this.getOrganizationDetails(orgName);
    if (orgDetails.success) {
      result.organization = orgDetails.data;
    }

    // 2. Get repositories
    const repos = await this.getOrganizationRepos(orgName);
    if (repos.success) {
      result.repos = repos.data;

      // For each repo, fetch commits, PRs, and issues
      for (const repo of repos.data.slice(0, 5)) { // Limit to first 5 repos for demo
        const repoName = repo.name;
        
        result.details[repoName] = {
          commits: [],
          pullRequests: [],
          issues: []
        };

        // Get commits
        const commits = await this.getRepoCommits(orgName, repoName, { per_page: 10 });
        if (commits.success) {
          result.details[repoName].commits = commits.data;
        }

        // Get pull requests
        const prs = await this.getRepoPullRequests(orgName, repoName, { per_page: 10 });
        if (prs.success) {
          result.details[repoName].pullRequests = prs.data;
        }

        // Get issues
        const issues = await this.getRepoIssues(orgName, repoName, { per_page: 10 });
        if (issues.success) {
          result.details[repoName].issues = issues.data;
          
          // For each issue, get timeline/changelog
          for (const issue of issues.data.slice(0, 3)) { // First 3 issues
            const timeline = await this.getIssueTimeline(orgName, repoName, issue.number);
            if (timeline.success) {
              issue.timeline = timeline.data;
            }
          }
        }
      }
    }

    // 3. Get members
    const members = await this.getOrganizationMembers(orgName);
    if (members.success) {
      result.members = members.data;
    }

    // 4. Get teams
    const teams = await this.getOrganizationTeams(orgName);
    if (teams.success) {
      result.teams = teams.data;
    }

    return result;
  }
}

module.exports = GitHubHelper;

