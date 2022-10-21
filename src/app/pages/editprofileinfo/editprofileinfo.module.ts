import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { EditprofileinfoPageRoutingModule } from './editprofileinfo-routing.module';

import { EditprofileinfoPage } from './editprofileinfo.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    ComponentsModule,
    EditprofileinfoPageRoutingModule
  ],
  declarations: [EditprofileinfoPage]
})
export class EditprofileinfoPageModule {}
