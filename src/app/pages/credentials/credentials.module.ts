import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CredentialsPageRoutingModule } from './credentials-routing.module';

import { CredentialsPage } from './credentials.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CredentialsPageRoutingModule,
    TranslateModule,
    ComponentsModule
  ],
  declarations: [CredentialsPage]
})
export class CredentialsPageModule { }
