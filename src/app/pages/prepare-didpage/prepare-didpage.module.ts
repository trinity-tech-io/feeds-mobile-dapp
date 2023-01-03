import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PrepareDIDPagePageRoutingModule } from './prepare-didpage-routing.module';
import { PrepareDIDPagePage } from './prepare-didpage.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrepareDIDPagePageRoutingModule,
    ComponentsModule,
    TranslateModule
  ],
  declarations: [PrepareDIDPagePage]
})
export class PrepareDIDPagePageModule {}
