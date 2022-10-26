import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { UserprofilePageRoutingModule } from './userprofile-routing.module';

import { UserprofilePage } from './userprofile.page';
import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    TranslateModule,
    ComponentsModule,
    FormsModule,
    IonicModule,
    UserprofilePageRoutingModule
  ],
  declarations: [UserprofilePage]
})
export class UserprofilePageModule {}
