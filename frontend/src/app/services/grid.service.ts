import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface GridDataRequest {
  userId: string;
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: any;
}

export interface GridDataResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  collection: string;
}

export interface Collection {
  name: string;
  label: string;
  count: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class GridService {
  private apiUrl = `${environment.apiUrl}/integrations`;

  constructor(private http: HttpClient) {}

  /**
   * Get available collections
   */
  getCollections(userId: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/collections`, { params });
  }

  /**
   * Get collection schema for dynamic column generation
   */
  getCollectionSchema(userId: string, collection: string): Observable<any> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get(`${this.apiUrl}/github/collection-schema/${collection}`, { params });
  }

  /**
   * Get paginated grid data with sorting and filtering
   */
  getGridData(collection: string, request: GridDataRequest): Observable<GridDataResponse> {
    let params = new HttpParams()
      .set('userId', request.userId)
      .set('page', request.page.toString())
      .set('pageSize', request.pageSize.toString());

    if (request.sortField) {
      params = params.set('sortField', request.sortField);
      params = params.set('sortOrder', request.sortOrder || 'asc');
    }

    if (request.search) {
      params = params.set('search', request.search);
    }

    if (request.filters && Object.keys(request.filters).length > 0) {
      params = params.set('filters', JSON.stringify(request.filters));
    }

    return this.http.get<GridDataResponse>(`${this.apiUrl}/github/grid-data/${collection}`, { params });
  }
}

