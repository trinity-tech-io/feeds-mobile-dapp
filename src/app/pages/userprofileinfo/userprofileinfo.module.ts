import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { UserprofileinfoPageRoutingModule } from './userprofileinfo-routing.module';

import { UserprofileinfoPage } from './userprofileinfo.page';
import { QRCodeModule } from 'angularx-qrcode';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    QRCodeModule,
    ComponentsModule,
    UserprofileinfoPageRoutingModule
  ],
  declarations: [UserprofileinfoPage]
})
export class UserprofileinfoPageModule {}
