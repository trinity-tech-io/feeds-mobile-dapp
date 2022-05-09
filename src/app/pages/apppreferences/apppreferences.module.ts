import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ApppreferencesPageRoutingModule } from './apppreferences-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { ApppreferencesPage } from './apppreferences.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    ApppreferencesPageRoutingModule
  ],
  declarations: [ApppreferencesPage]
})
export class ApppreferencesPageModule {}
