import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { PosttiplistPageRoutingModule } from './posttiplist-routing.module';
import { PosttiplistPage } from './posttiplist.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    IonicModule,
    PosttiplistPageRoutingModule
  ],
  declarations: [PosttiplistPage]
})
export class PosttiplistPageModule {}
