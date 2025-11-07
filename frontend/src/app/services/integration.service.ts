import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Integration {
  id: string;
  provider: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  connectedAt: string;
  lastSyncedAt: string;
  status: string;
  metadata: any;
}

export interface IntegrationStatus {
  connected: boolean;
  integrations: Integration[];
}

@Injectable({
  providedIn: 'root'
})
export class IntegrationService {
  private apiUrl = `${environment.apiUrl}/integrations`;
  private integrationStatusSubject = new BehaviorSubject<IntegrationStatus | null>(null);
  public integrationStatus$ = this.integrationStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get GitHub OAuth authorization URL
   */
  getGitHubAuthUrl(userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/auth`, { params });
  }

  /**
   * Get integration status for a user
   */
  getIntegrationStatus(userId: string, provider?: string): Observable<any> {
    let params = new HttpParams();
    if (provider) {
      params = params.set('provider', provider);
    }
    
    return this.http.get(`${this.apiUrl}/status/${userId}`, { params }).pipe(
      tap((response: any) => {
        if (response.success) {
          this.integrationStatusSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Get all integrations for a user
   */
  getAllIntegrations(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  /**
   * Disconnect an integration
   */
  disconnectIntegration(userId: string, provider: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/${provider}`).pipe(
      tap(() => {
        // Refresh status after disconnect
        this.getIntegrationStatus(userId).subscribe();
      })
    );
  }

  /**
   * Initialize OAuth flow for GitHub
   */
  initiateGitHubOAuth(userId: string): void {
    this.getGitHubAuthUrl(userId).subscribe({
      next: (response) => {
        if (response.success && response.authUrl) {
          // Redirect to GitHub OAuth page
          window.location.href = response.authUrl;
        }
      },
      error: (error) => {
        console.error('Failed to get GitHub auth URL:', error);
        alert('Failed to initiate GitHub authentication. Please check your configuration.');
      }
    });
  }

  /**
   * Clear integration status cache
   */
  clearStatus(): void {
    this.integrationStatusSubject.next(null);
  }

  /**
 * Fetch user's GitHub organizations
 */
  getGitHubOrganizations(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/github/data/organizations/${userId}`);
  }

  /**
   * Fetch organization repositories
   */
  getOrganizationRepos(userId: string, orgName: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/data/organizations/${orgName}/repos`, { params });
  }

  /**
   * Fetch repository commits
   */
  getRepoCommits(userId: string, owner: string, repo: string, perPage: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('per_page', perPage.toString());
    return this.http.get(`${this.apiUrl}/github/data/repos/${owner}/${repo}/commits`, { params });
  }

  /**
   * Fetch repository pull requests
   */
  getRepoPulls(userId: string, owner: string, repo: string, perPage: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('state', 'all')
      .set('per_page', perPage.toString());
    return this.http.get(`${this.apiUrl}/github/data/repos/${owner}/${repo}/pulls`, { params });
  }

  /**
   * Fetch repository issues
   */
  getRepoIssues(userId: string, owner: string, repo: string, perPage: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('state', 'all')
      .set('per_page', perPage.toString());
    return this.http.get(`${this.apiUrl}/github/data/repos/${owner}/${repo}/issues`, { params });
  }

  /**
   * Fetch issue timeline/changelog
   */
  getIssueTimeline(userId: string, owner: string, repo: string, issueNumber: number): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/data/repos/${owner}/${repo}/issues/${issueNumber}/timeline`, { params });
  }

  /**
   * Fetch organization members
   */
  getOrganizationMembers(userId: string, orgName: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/data/organizations/${orgName}/members`, { params });
  }

  /**
   * =====================================================
   * SYNC & STORE METHODS
   * =====================================================
   */

  /**
   * Sync organization data to database
   */
  syncOrganization(userId: string, orgName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/github/sync/organization/${orgName}`, { userId });
  }

  /**
   * Sync repository data to database
   */
  syncRepository(userId: string, owner: string, repo: string, includeCommits = true, includePulls = true, includeIssues = true): Observable<any> {
    return this.http.post(`${this.apiUrl}/github/sync/repository/${owner}/${repo}`, {
      userId,
      includeCommits,
      includePulls,
      includeIssues
    });
  }

  /**
   * Sync single issue timeline on-demand
   */
  syncIssueTimeline(userId: string, owner: string, repo: string, issueNumber: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/github/sync/issue-timeline/${owner}/${repo}/${issueNumber}`, {
      userId
    });
  }

  /**
   * Sync all repositories of an organization
   */
  syncAllOrgRepositories(userId: string, orgName: string, limit = 10, includeDetails = true): Observable<any> {
    return this.http.post(`${this.apiUrl}/github/sync/organization/${orgName}/repositories`, {
      userId,
      limit,
      includeDetails
    });
  }

  /**
   * Get stored organizations from database
   */
  getStoredOrganizations(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/github/stored/organizations/${userId}`);
  }

  /**
   * Get stored repositories from database
   */
  getStoredOrgRepositories(userId: string, orgName: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/stored/organizations/${orgName}/repositories`, { params });
  }

  /**
   * Get stored repository details from database
   */
  getStoredRepositoryDetails(userId: string, owner: string, repo: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/stored/repositories/${owner}/${repo}`, { params });
  }
}

