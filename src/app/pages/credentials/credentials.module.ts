import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CredentialsPageRoutingModule } from './credentials-routing.module';

import { CredentialsPage } from './credentials.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CredentialsPageRoutingModule
  ],
  declarations: [CredentialsPage]
})
export class CredentialsPageModule {}
