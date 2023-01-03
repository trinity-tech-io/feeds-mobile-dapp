/*
 * @Author: liaihong
 * @Date: 2022-12-20 16:58:49
 * @LastEditors: liaihong
 * @LastEditTime: 2022-12-20 19:44:19
 * @FilePath: /feeds-mobile-dapp-2/src/app/pages/feeds/importdid/importdid-routing.module.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ImportdidPage } from './importdid.page';

const routes: Routes = [
  {
    path: '',
    component: ImportdidPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImportdidPageRoutingModule {}
