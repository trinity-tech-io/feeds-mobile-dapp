import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditprofileinfoPage } from './editprofileinfo.page';

const routes: Routes = [
  {
    path: '',
    component: EditprofileinfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditprofileinfoPageRoutingModule {}
