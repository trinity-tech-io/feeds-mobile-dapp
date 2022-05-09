import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApppreferencesPage } from './apppreferences.page';

const routes: Routes = [
  {
    path: '',
    component: ApppreferencesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApppreferencesPageRoutingModule {}
