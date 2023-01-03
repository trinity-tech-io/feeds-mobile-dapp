/*
 * @Author: liaihong
 * @Date: 2022-12-06 18:19:22
 * @LastEditors: liaihong 
 * @LastEditTime: 2022-12-21 17:18:58
 * @FilePath: /feeds-mobile-dapp-2/src/app/pages/feeds/feeds-routing.module.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
      // {
      //   path: 'home',
      //   children: [
      //     {
      //       path: '',
      //       loadChildren: () =>
      //         import('./importdid/importdid.module').then(
      //           m => m.ImportdidPageModule,
      //         ),
      //     },
      //   ],
      // },
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
