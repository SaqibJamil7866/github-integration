import { Routes } from '@angular/router';
import { IntegrationsComponent } from './components/integrations/integrations.component';
import { DataGridComponent } from './components/data-grid/data-grid.component';

export const routes: Routes = [
  { path: '', redirectTo: '/integrations', pathMatch: 'full' },
  { path: 'integrations', component: IntegrationsComponent },
  { path: 'data-grid', component: DataGridComponent }
];
