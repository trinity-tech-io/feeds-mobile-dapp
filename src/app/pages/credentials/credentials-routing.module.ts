import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CredentialsPage } from './credentials.page';

const routes: Routes = [
  {
    path: '',
    component: CredentialsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CredentialsPageRoutingModule {}
