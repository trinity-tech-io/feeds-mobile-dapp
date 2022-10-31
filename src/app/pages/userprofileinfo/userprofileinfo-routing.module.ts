import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserprofileinfoPage } from './userprofileinfo.page';

const routes: Routes = [
  {
    path: '',
    component: UserprofileinfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserprofileinfoPageRoutingModule {}
