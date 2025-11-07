import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntegrationService, Integration } from '../../services/integration.service';
import { forkJoin } from 'rxjs';
import { RepositoryCommitsComponent } from './repository-commits/repository-commits.component';
import { RepositoryPullsComponent } from './repository-pulls/repository-pulls.component';
import { RepositoryIssuesComponent } from './repository-issues/repository-issues.component';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatBadgeModule,
    MatListModule,
    MatTooltipModule,
    RepositoryCommitsComponent,
    RepositoryPullsComponent,
    RepositoryIssuesComponent
  ],
  templateUrl: './integrations.component.html',
  styleUrl: './integrations.component.scss'
})
export class IntegrationsComponent implements OnInit {
  userId = 'demo-user-123'; // In production, get from auth service
  loading = true;
  githubIntegration: Integration | null = null;
  isConnected = false;
  
  // Organizations and repos
  organizations: any[] = [];
  organizationsLoading = false;
  organizationRepos: { [orgName: string]: any[] } = {};
  loadingRepos: { [orgName: string]: boolean } = {};
  
  // Repository details
  repoCommits: { [repoKey: string]: any[] } = {};
  repoPulls: { [repoKey: string]: any[] } = {};
  repoIssues: { [repoKey: string]: any[] } = {};
  loadingRepoDetails: { [repoKey: string]: boolean } = {};
  expandedRepos: { [repoKey: string]: boolean } = {};
  
  // Organization members
  organizationMembers: { [orgName: string]: any[] } = {};
  loadingMembers: { [orgName: string]: boolean } = {};
  showMembers: { [orgName: string]: boolean } = {};

  constructor(
    private integrationService: IntegrationService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check for OAuth callback parameters
    this.route.queryParams.subscribe(params => {
      if (params['success'] === 'true') {
        this.snackBar.open('GitHub connected successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        // Clean up URL
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true
        });
      } else if (params['error']) {
        this.snackBar.open(`Connection failed: ${params['error']}`, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        // Clean up URL
        this.router.navigate([], {
          queryParams: {},
          replaceUrl: true
        });
      }
    });

    this.loadIntegrationStatus();
  }

  loadIntegrationStatus(): void {
    this.loading = true;
    this.integrationService.getIntegrationStatus(this.userId, 'github').subscribe({
      next: (response) => {
        if (response.success) {
          this.isConnected = response.connected;
          if (response.integrations && response.integrations.length > 0) {
            this.githubIntegration = response.integrations[0];
          }
          
          // Load organizations if connected
          if (this.isConnected) {
            this.loadOrganizations();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load integration status:', error);
        this.loading = false;
        this.snackBar.open('Failed to load integration status', 'Close', {
          duration: 3000
        });
      }
    });
  }

  connectGitHub(): void {
    this.integrationService.initiateGitHubOAuth(this.userId);
  }

  disconnectGitHub(): void {
    if (confirm('Are you sure you want to disconnect GitHub?')) {
      this.integrationService.disconnectIntegration(this.userId, 'github').subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('GitHub disconnected successfully', 'Close', {
              duration: 3000
            });
            this.loadIntegrationStatus();
          }
        },
        error: (error) => {
          console.error('Failed to disconnect GitHub:', error);
          this.snackBar.open('Failed to disconnect GitHub', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  loadOrganizations(): void {
    if (!this.isConnected) return;
    
    this.organizationsLoading = true;
    this.integrationService.getGitHubOrganizations(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.organizations = response.data;
          
          // Automatically sync each organization to database
          this.organizations.forEach(org => {
            this.syncOrganizationToDatabase(org.login);
          });
        }
        this.organizationsLoading = false;
      },
      error: (error) => {
        console.error('Failed to load organizations:', error);
        this.organizationsLoading = false;
        this.snackBar.open('Failed to load organizations', 'Close', {
          duration: 3000
        });
      }
    });
  }

  loadOrganizationRepos(orgName: string): void {
    if (this.organizationRepos[orgName]) {
      // Already loaded
      return;
    }

    this.loadingRepos[orgName] = true;
    this.integrationService.getOrganizationRepos(this.userId, orgName).subscribe({
      next: (response) => {
        if (response.success) {
          this.organizationRepos[orgName] = response.data;
          
          // Sync repositories to database in background
          // Limit to first 10 repos to avoid overwhelming the server
          const reposToSync = response.data.slice(0, 10);
          if (reposToSync.length > 0) {
            this.syncRepositoriesToDatabase(orgName, reposToSync);
          }
        }
        this.loadingRepos[orgName] = false;
      },
      error: (error) => {
        console.error(`Failed to load repos for ${orgName}:`, error);
        this.loadingRepos[orgName] = false;
        this.snackBar.open(`Failed to load repos for ${orgName}`, 'Close', {
          duration: 3000
        });
      }
    });
  }

  onOrganizationExpanded(orgName: string): void {
    this.loadOrganizationRepos(orgName);
  }

  /**
   * Load repository details (commits, pulls, issues)
   */
  loadRepoDetails(orgName: string, repoName: string, owner: string): void {
    const repoKey = `${orgName}/${repoName}`;
    
    if (this.expandedRepos[repoKey]) {
      // Already loaded or loading
      return;
    }

    this.expandedRepos[repoKey] = true;
    this.loadingRepoDetails[repoKey] = true;

    // Fetch commits, pulls, and issues in parallel
    const commits$ = this.integrationService.getRepoCommits(this.userId, owner, repoName, 10);
    const pulls$ = this.integrationService.getRepoPulls(this.userId, owner, repoName, 10);
    const issues$ = this.integrationService.getRepoIssues(this.userId, owner, repoName, 10);
    
    forkJoin({
      commits: commits$,
      pulls: pulls$,
      issues: issues$
    }).subscribe({
      next: (results) => {
        if (results.commits.success) {
          this.repoCommits[repoKey] = results.commits.data;
        }
        if (results.pulls.success) {
          this.repoPulls[repoKey] = results.pulls.data;
        }
        if (results.issues.success) {
          this.repoIssues[repoKey] = results.issues.data;
        }
        this.loadingRepoDetails[repoKey] = false;
        
        // Sync repository details to database AND reload with timeline data
        this.syncAndReloadRepositoryDetails(owner, repoName, repoKey);
      },
      error: (error) => {
        console.error(`Failed to load details for ${repoKey}:`, error);
        this.loadingRepoDetails[repoKey] = false;
        this.snackBar.open(`Failed to load details for ${repoName}`, 'Close', {
          duration: 3000
        });
      }
    });
  }

  /**
   * Sync repository to database and get data with timeline in one call
   */
  private syncAndReloadRepositoryDetails(owner: string, repo: string, repoKey: string): void {
    
    this.integrationService.syncRepository(
      this.userId,
      owner,
      repo,
      true, // Include commits
      true, // Include pulls
      true  // Include issues (with timelines!)
    ).subscribe({
      next: (response) => {
        
        // Use the data returned directly from sync API
        if (response.success && response.data) {
          
          // Update issues with timeline data from response
          if (response.data.issues && response.data.issues.length > 0) {
            
            // Force update the issues array
            this.repoIssues[repoKey] = [...response.data.issues];
          } else {
            console.warn(`⚠️ No issues found in response`);
          }
        } else {
          console.warn(`⚠️ Response not successful or no data`);
        }
      },
      error: (error) => {
        console.error(`❌ Failed to sync repository details ${owner}/${repo}:`, error);
      }
    });
  }

  /**
   * Sync organization data to database (background operation)
   */
  private syncOrganizationToDatabase(orgName: string): void {
    this.integrationService.syncOrganization(this.userId, orgName).subscribe({
      next: (response) => {
        
        console.log(`Organization ${orgName} synced to database:`, response);
      },
      error: (error) => {
        console.error(`Failed to sync organization ${orgName}:`, error);
        // Silent fail - don't interrupt user experience
      }
    });
  }

  /**
   * Sync repositories to database (background operation)
   */
  private syncRepositoriesToDatabase(orgName: string, repos: any[]): void {
    // Sync each repository without details (just basic info)
    repos.forEach(repo => {
      this.integrationService.syncRepository(
        this.userId, 
        repo.owner.login, 
        repo.name,
        false, // Don't include commits initially
        false, // Don't include pulls initially
        false  // Don't include issues initially
      ).subscribe({
        next: (response) => {
          console.log(`Repository ${repo.name} synced:`, response);
        },
        error: (error) => {
          console.error(`Failed to sync repository ${repo.name}:`, error);
          // Silent fail
        }
      });
    });
  }

  /**
   * Toggle repository expansion
   */
  onRepoExpanded(orgName: string, repo: any): void {
    const repoKey = `${orgName}/${repo.name}`;
    this.loadRepoDetails(orgName, repo.name, repo.owner.login);
  }

  /**
   * Load organization members
   */
  loadOrganizationMembers(orgName: string): void {
    if (this.organizationMembers[orgName] || this.loadingMembers[orgName]) {
      // Already loaded or loading
      this.showMembers[orgName] = !this.showMembers[orgName];
      return;
    }

    this.loadingMembers[orgName] = true;
    this.integrationService.getOrganizationMembers(this.userId, orgName).subscribe({
      next: (response) => {
        if (response.success) {
          this.organizationMembers[orgName] = response.data;
          this.showMembers[orgName] = true;
          
          // Re-sync organization with members data
          this.syncOrganizationToDatabase(orgName);
        }
        this.loadingMembers[orgName] = false;
      },
      error: (error) => {
        console.error(`Failed to load members for ${orgName}:`, error);
        this.loadingMembers[orgName] = false;
        this.snackBar.open(`Failed to load members for ${orgName}`, 'Close', {
          duration: 3000
        });
      }
    });
  }
}

