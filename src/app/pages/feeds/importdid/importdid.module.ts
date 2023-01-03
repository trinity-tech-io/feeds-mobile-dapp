/*
 * @Author: liaihong
 * @Date: 2022-12-20 16:58:49
 * @LastEditors: liaihong
 * @LastEditTime: 2022-12-21 23:38:02
 * @FilePath: /feeds-mobile-dapp-2/src/app/pages/feeds/importdid/importdid.module.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ImportdidPageRoutingModule } from './importdid-routing.module';

import { ImportdidPage } from './importdid.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ImportdidPageRoutingModule,
    ComponentsModule
  ],
  declarations: [ImportdidPage]
})
export class ImportdidPageModule {}
