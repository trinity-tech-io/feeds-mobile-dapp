import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { UserlistPageRoutingModule } from './userlist-routing.module';
import { UserlistPage } from './userlist.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ComponentsModule,
    UserlistPageRoutingModule
  ],
  declarations: [UserlistPage]
})
export class UserlistPageModule { }
