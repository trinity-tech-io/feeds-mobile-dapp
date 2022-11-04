import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PosttiplistPage } from './posttiplist.page';

const routes: Routes = [
  {
    path: '',
    component: PosttiplistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PosttiplistPageRoutingModule {}
