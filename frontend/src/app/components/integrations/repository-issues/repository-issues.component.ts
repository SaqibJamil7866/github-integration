import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { IntegrationService } from '../../../services/integration.service';

@Component({
  selector: 'app-repository-issues',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './repository-issues.component.html',
  styleUrl: './repository-issues.component.scss'
})
export class RepositoryIssuesComponent {
  @Input() issues: any[] = [];
  @Input() loading: boolean = false;
  @Input() userId: string = '';
  @Input() owner: string = '';
  @Input() repo: string = '';

  expandedTimelines = new Set<number>();
  loadingTimelines = new Set<number>();
  isLoadingMore: boolean = false;
  hasLoadedAll: boolean = false;

  constructor(private integrationService: IntegrationService) {}

  onPanelExpanded(): void {
    // Only load more if we have exactly 10 issues (initial load) and haven't loaded all yet
    if (this.issues && this.issues.length === 10 && !this.hasLoadedAll && !this.isLoadingMore) {
      this.loadAllIssues();
    }
  }

  loadAllIssues(): void {
    this.isLoadingMore = true;

    // Call the backend to sync and get all issues in one call
    this.integrationService.syncRepository(
      this.userId,
      this.owner,
      this.repo,
      false, // Don't include commits
      false, // Don't include pulls
      true   // Include issues
    ).subscribe({
      next: (response) => {
        
        // Use the data returned directly from sync API
        if (response.success && response.data && response.data.issues) {
          this.issues = [...response.data.issues];
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  toggleTimeline(issue: any): void {
    const issueNumber = issue.number;
    
    if (this.expandedTimelines.has(issueNumber)) {
      // Collapse
      this.expandedTimelines.delete(issueNumber);
    } else {
      // Expand
      this.expandedTimelines.add(issueNumber);
      
      // Check if timeline needs to be loaded
      if (!issue.timeline || issue.timeline.length === 0) {
        this.loadTimeline(issue);
      }
    }
  }

  loadTimeline(issue: any): void {
    const issueNumber = issue.number;
    
    // Mark as loading
    this.loadingTimelines.add(issueNumber);
    
    this.integrationService.syncIssueTimeline(this.userId, this.owner, this.repo, issueNumber)
      .subscribe({
        next: (response) => {
          
          if (response.success && response.data) {
            // Update the issue with timeline data
            issue.timeline = response.data;
            issue.timelineCount = response.data.length;
          }
          
          this.loadingTimelines.delete(issueNumber);
        },
        error: (error) => {
          console.error(`❌ Failed to load timeline for issue #${issueNumber}:`, error);
          this.loadingTimelines.delete(issueNumber);
        }
      });
  }

  isTimelineLoading(issueNumber: number): boolean {
    return this.loadingTimelines.has(issueNumber);
  }

  getEventIcon(event: string): string {
    const iconMap: { [key: string]: string } = {
      'closed': 'check_circle',
      'reopened': 'radio_button_checked',
      'merged': 'merge',
      'labeled': 'label',
      'unlabeled': 'label_off',
      'assigned': 'person_add',
      'unassigned': 'person_remove',
      'commented': 'comment',
      'mentioned': 'alternate_email',
      'subscribed': 'notifications_active',
      'unsubscribed': 'notifications_off',
      'referenced': 'link',
      'renamed': 'edit',
      'locked': 'lock',
      'unlocked': 'lock_open',
      'milestoned': 'flag',
      'demilestoned': 'flag_outlined',
      'review_requested': 'rate_review',
      'review_dismissed': 'cancel_presentation'
    };
    return iconMap[event] || 'info';
  }

  getEventAction(event: string): string {
    const actionMap: { [key: string]: string} = {
      'closed': 'closed this issue',
      'reopened': 'reopened this issue',
      'merged': 'merged this',
      'labeled': 'added label',
      'unlabeled': 'removed label',
      'assigned': 'assigned',
      'unassigned': 'unassigned',
      'commented': 'commented',
      'mentioned': 'mentioned',
      'subscribed': 'subscribed',
      'unsubscribed': 'unsubscribed',
      'referenced': 'referenced this issue',
      'renamed': 'renamed',
      'locked': 'locked this issue',
      'unlocked': 'unlocked this issue',
      'milestoned': 'added to milestone',
      'demilestoned': 'removed from milestone',
      'review_requested': 'requested review',
      'review_dismissed': 'dismissed review'
    };
    return actionMap[event] || event.replace(/_/g, ' ');
  }
}
