import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { GridService, GridDataRequest } from '../../services/grid.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    AgGridAngular
  ],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss'
})
export class DataGridComponent implements OnInit, OnDestroy {
  userId = 'demo-user-123'; // In production, get from auth service

  // Dropdowns
  selectedIntegration = 'github';
  integrations = [{ value: 'github', label: 'GitHub' }];
  
  selectedCollection = '';
  collections: any[] = [];
  collectionsLoading = false;

  // Search
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // AG Grid
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 150,
    floatingFilter: true, // Enable floating filters
    filterParams: {
      debounceMs: 500
    }
  };
  
  gridOptions: GridOptions = {
    theme: 'legacy', // Use legacy CSS-based themes (v32 style)
    rowModelType: 'infinite',
    cacheBlockSize: 100,
    maxBlocksInCache: 10,
    pagination: true,
    paginationPageSize: 100,
    paginationPageSizeSelector: [50, 100, 200, 500],
    overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No data found</span>'
  };
  
  loading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 100;

  // Grid state
  private gridApi: any;
  private sortModel: any[] = [];
  private filterModel: any = {};

  constructor(private gridService: GridService) {}

  ngOnInit(): void {
    this.loadCollections();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  /**
   * Setup search with debounce
   */
  setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        if (this.gridApi) {
          this.gridApi.purgeInfiniteCache();
        }
      });
  }

  /**
   * Load available collections
   */
  loadCollections(): void {
    this.collectionsLoading = true;
    this.gridService.getCollections(this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.collections = response.collections;
          if (this.collections.length > 0) {
            this.selectedCollection = this.collections[0].name;
            this.onCollectionChange();
          }
        }
        this.collectionsLoading = false;
      },
      error: (error) => {
        console.error('Failed to load collections:', error);
        this.collectionsLoading = false;
      }
    });
  }

  /**
   * Handle collection change
   */
  onCollectionChange(): void {
    if (!this.selectedCollection) return;
    
    // Clear existing grid data
    this.columnDefs = [];
    this.totalCount = 0;
    
    // Reset grid API reference (Angular will recreate the component via *ngIf)
    this.gridApi = null;
    
    this.loading = true;
    this.gridService.getCollectionSchema(this.userId, this.selectedCollection).subscribe({
      next: (response) => {
        if (response.success) {
          this.generateColumns(response.fields);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load schema:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Generate column definitions dynamically
   */
  generateColumns(fields: any[]): void {
    this.columnDefs = [];

    fields.forEach(field => {
      if (field.field === 'commits' || field.field === 'pullRequests' || field.field === 'issues') {
        // Handle array fields - show count
        this.columnDefs.push({
          field: `${field.field}Count`,
          headerName: `${field.headerName} Count`,
          valueGetter: (params) => {
            return params.data[field.field]?.length || 0;
          },
          filter: 'agNumberColumnFilter',
          sortable: true
        });
      } else if (field.type === 'object' && field.children) {
        // Handle nested objects - create columns for each child
        field.children.forEach((child: any) => {
          this.columnDefs.push({
            field: child.field,
            headerName: `${field.headerName} - ${child.headerName}`,
            valueGetter: (params) => {
              const keys = child.field.split('.');
              let value = params.data;
              for (const key of keys) {
                value = value?.[key];
                if (value === undefined) break;
              }
              return value;
            },
            filter: this.getFilterType(child.type),
            sortable: true
          });
        });
      } else if (field.type === 'date') {
        // Handle date fields
        this.columnDefs.push({
          field: field.field,
          headerName: field.headerName,
          valueFormatter: (params) => {
            if (!params.value) return '';
            return new Date(params.value).toLocaleString();
          },
          filter: 'agDateColumnFilter',
          sortable: true
        });
      } else if (field.type === 'number') {
        // Handle number fields
        this.columnDefs.push({
          field: field.field,
          headerName: field.headerName,
          filter: 'agNumberColumnFilter',
          sortable: true
        });
      } else if (field.type === 'boolean') {
        // Handle boolean fields - use text filter for community version
        this.columnDefs.push({
          field: field.field,
          headerName: field.headerName,
          filter: 'agTextColumnFilter',
          valueFormatter: (params) => params.value ? 'Yes' : 'No',
          sortable: true
        });
      } else if (Array.isArray(field.type) || field.field === 'members' || field.field === 'topics') {
        // Handle array fields - show count or comma-separated list
        this.columnDefs.push({
          field: field.field,
          headerName: field.headerName,
          valueGetter: (params) => {
            const value = params.data[field.field];
            if (Array.isArray(value)) {
              return value.length;
            }
            return 0;
          },
          filter: 'agNumberColumnFilter',
          sortable: true
        });
      } else {
        // Handle string fields
        this.columnDefs.push({
          field: field.field,
          headerName: field.headerName,
          filter: 'agTextColumnFilter',
          sortable: true
        });
      }
    });
  }

  /**
   * Get appropriate filter type for field
   */
  getFilterType(fieldType: string): string {
    switch (fieldType) {
      case 'number':
        return 'agNumberColumnFilter';
      case 'date':
        return 'agDateColumnFilter';
      case 'boolean':
        return 'agTextColumnFilter'; // Use text filter for community version
      default:
        return 'agTextColumnFilter';
    }
  }

  /**
   * Grid ready event - called when AG Grid is fully initialized
   */
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    
    const datasource: IDatasource = {
      getRows: (params: IGetRowsParams) => {
        this.loading = true;
        
        const page = Math.floor(params.startRow / this.pageSize) + 1;
        
        // Build filter object from AG Grid filter model
        const filters: any = {};
        const filterModel = params.filterModel;
        
        Object.keys(filterModel).forEach(key => {
          const filter = filterModel[key];
          if (filter.filter !== undefined) {
            filters[key] = filter.filter;
          }
        });

        // Build sort
        let sortField: string | undefined;
        let sortOrder: 'asc' | 'desc' = 'asc';
        
        if (params.sortModel.length > 0) {
          sortField = params.sortModel[0].colId;
          sortOrder = params.sortModel[0].sort as 'asc' | 'desc';
        }

        const request: GridDataRequest = {
          userId: this.userId,
          page,
          pageSize: this.pageSize,
          sortField,
          sortOrder,
          search: this.searchTerm,
          filters
        };

        this.gridService.getGridData(this.selectedCollection, request).subscribe({
          next: (response) => {
            if (response.success) {
              this.totalCount = response.pagination.totalCount;
              
              params.successCallback(
                response.data,
                response.pagination.totalCount
              );
            } else {
              params.failCallback();
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Failed to load grid data:', error);
            params.failCallback();
            this.loading = false;
          }
        });
      }
    };

    this.gridApi.setGridOption('datasource', datasource);
  }

  /**
   * Handle sort change
   */
  onSortChanged(): void {
    if (this.gridApi) {
      this.sortModel = this.gridApi.getSortModel();
    }
  }

  /**
   * Handle filter change
   */
  onFilterChanged(): void {
    if (this.gridApi) {
      this.filterModel = this.gridApi.getFilterModel();
    }
  }

  /**
   * Handle search input
   */
  onSearchChange(event: any): void {
    this.searchSubject.next(event.target.value);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.searchTerm = '';
      this.gridApi.purgeInfiniteCache();
    }
  }

  /**
   * Refresh grid
   */
  refreshGrid(): void {
    if (this.gridApi) {
      this.gridApi.purgeInfiniteCache();
    }
  }

  /**
   * Export to CSV
   */
  exportToCsv(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `${this.selectedCollection}-${new Date().toISOString()}.csv`
      });
    }
  }
}

