import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FeedsPage } from './feeds.page';

const routes: Routes = [
  {
    path: 'tabs', // Bottom Tab Navigation
    component: FeedsPage,
    children: [
      // 1st Tab
      {
        path: 'home',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./home/home.module').then(
                m => m.HomePageModule,
              ),
          },
        ],
      },
      // 2nd Tab
      {
        path: 'profile',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./profile/profile.module').then(
                m => m.ProfilePageModule,
              ),
          },
        ],
      },
      // 3rd Tab
      {
        path: 'notification',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./notification/notification.module').then(
                m => m.NotificationPageModule,
              ),
          },
        ],
      },
      // 4th Tab
      {
        path: 'search',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('./search/search.module').then(
                m => m.SearchPageModule,
              ),
          },
        ],
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [TranslateModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeedsRoutingModule { }
