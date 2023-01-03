import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrepareDIDPagePage } from './prepare-didpage.page';

const routes: Routes = [
  {
    path: '',
    component: PrepareDIDPagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrepareDIDPagePageRoutingModule {}
