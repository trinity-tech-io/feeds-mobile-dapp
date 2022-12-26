import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { PaypromptComponent } from './payprompt/payprompt.component';
import { NftdialogComponent } from './../components/nftdialog/nftdialog.component';
import { TipdialogComponent } from './tipdialog/tipdialog.component';
import { MorenameComponent } from './morename/morename.component';

import { ConfirmdialogComponent } from './confirmdialog/confirmdialog.component';
import { AlertdialogComponent } from './alertdialog/alertdialog.component';
import {  NftloadingComponent } from './nftloading/nftloading.component';
import { NfttransferdialogComponent } from './nfttransferdialog/nfttransferdialog.component';
import { NftdisclaimerComponent } from './nftdisclaimer/nftdisclaimer.component';
import { DeleteaccountdialogComponent } from './deleteaccountdialog/deleteaccountdialog.component'

import { MyfeedsComponent } from './myfeeds/myfeeds.component';
import { FollowingComponent } from './following/following.component';
import { ChannelcollectionsitemComponent } from './channelcollectionsitem/channelcollectionsitem.component';
import { LikesComponent } from './likes/likes.component';
import { CommentComponent } from './comment/comment.component';
import { SwitchfeedComponent } from './switchfeed/switchfeed.component';
import { PreviewqrcodeComponent } from './previewqrcode/previewqrcode.component';
import { SharemenuComponent } from './sharemenu/sharemenu.component';
import { ConnectionmenuComponent } from './connectionmenu/connectionmenu.component';
import { PicturemenuComponent } from './picturemenu/picturemenu.component';
import { RoundloadingComponent } from './roundloading/roundloading.component';
import { PercentageloadingComponent } from './percentageloading/percentageloading.component';
import { AddassetComponent } from './addasset/addasset.component';
import { AssetitemComponent } from './assetitem/assetitem.component';
import { NewassetitemComponent } from './newassetitem/newassetitem.component';
import { HeartbtnComponent } from './heartbtn/heartbtn.component';
import { ChannelcardComponent } from './channelcard/channelcard.component';
import { VideofullscreenComponent } from './videofullscreen/videofullscreen.component';

import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';

import { ShareModule } from 'src/app/share/share.module';

import { TitleBarComponent } from './titlebar/titlebar.component';
import { TitlebarmenuitemComponent } from './titlebarmenuitem/titlebarmenuitem.component';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { VideostyleComponent } from './videostyle/videostyle.component';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    TranslateModule,
    IonicModule,
    ShareModule,
    QRCodeModule,
    RoundProgressModule,
  ],

  declarations: [
    AlertdialogComponent,
    ConfirmdialogComponent,
    DeleteaccountdialogComponent,
    MorenameComponent,
    TipdialogComponent,
    PaypromptComponent,
    NftdialogComponent,
    PreviewqrcodeComponent,
    MyfeedsComponent,
    FollowingComponent,
    ChannelcollectionsitemComponent,
    LikesComponent,
    CommentComponent,
    SwitchfeedComponent,
    SharemenuComponent,
    ConnectionmenuComponent,
    PicturemenuComponent,
    VideofullscreenComponent,
    RoundloadingComponent,
    PercentageloadingComponent,
    TitleBarComponent,
    TitlebarmenuitemComponent,
    AddassetComponent,
    AssetitemComponent,
    VideostyleComponent,
    NewassetitemComponent,
    HeartbtnComponent,
    ChannelcardComponent,
    NftloadingComponent,
    NfttransferdialogComponent,
    NftdisclaimerComponent,
  ],
  exports: [
    AlertdialogComponent,
    ConfirmdialogComponent,
    DeleteaccountdialogComponent,
    MorenameComponent,
    TipdialogComponent,
    PaypromptComponent,
    NftdialogComponent,
    PreviewqrcodeComponent,
    MyfeedsComponent,
    FollowingComponent,
    ChannelcollectionsitemComponent,
    LikesComponent,
    CommentComponent,
    SwitchfeedComponent,
    SharemenuComponent,
    ConnectionmenuComponent,
    PicturemenuComponent,
    VideofullscreenComponent,
    RoundloadingComponent,
    PercentageloadingComponent,
    TitleBarComponent,
    AddassetComponent,
    AssetitemComponent,
    VideostyleComponent,
    NewassetitemComponent,
    HeartbtnComponent,
    ChannelcardComponent,
    NftloadingComponent,
  ],

  providers: [],
  entryComponents: [
    VideofullscreenComponent,
    AlertdialogComponent,
    ConfirmdialogComponent,
    MorenameComponent,
    TipdialogComponent,
    PaypromptComponent,
    NftdialogComponent,
    PreviewqrcodeComponent,
    NftloadingComponent,
    NfttransferdialogComponent,
    NftdisclaimerComponent
  ],
})
export class ComponentsModule {}
