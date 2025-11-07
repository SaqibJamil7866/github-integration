import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IntegrationService } from '../../../services/integration.service';

@Component({
  selector: 'app-repository-pulls',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './repository-pulls.component.html',
  styleUrl: './repository-pulls.component.scss'
})
export class RepositoryPullsComponent {
  @Input() pulls: any[] = [];
  @Input() loading: boolean = false;
  @Input() userId: string = '';
  @Input() owner: string = '';
  @Input() repo: string = '';

  isLoadingMore: boolean = false;
  hasLoadedAll: boolean = false;

  constructor(private integrationService: IntegrationService) {}

  onPanelExpanded(): void {
    // Only load more if we have exactly 10 pulls (initial load) and haven't loaded all yet
    if (this.pulls && this.pulls.length === 10 && !this.hasLoadedAll && !this.isLoadingMore) {
      this.loadAllPulls();
    }
  }

  loadAllPulls(): void {
    this.isLoadingMore = true;

    // Call the backend to sync and get all pull requests in one call
    this.integrationService.syncRepository(
      this.userId,
      this.owner,
      this.repo,
      false, // Don't include commits
      true,  // Include pulls
      false  // Don't include issues
    ).subscribe({
      next: (response) => {
        
        // Use the data returned directly from sync API
        if (response.success && response.data && response.data.pullRequests) {
          this.pulls = [...response.data.pullRequests];
          this.hasLoadedAll = true;
        }
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error(`❌ Failed to sync repository:`, error);
        this.isLoadingMore = false;
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

