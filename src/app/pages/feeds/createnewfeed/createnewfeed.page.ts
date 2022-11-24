import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { TipdialogComponent } from '../../../components/tipdialog/tipdialog.component';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { PopupProvider } from 'src/app/services/popup';
import { LanguageService } from 'src/app/services/language.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service'
import { UtilService } from 'src/app/services/utilService';
import { MorenameComponent } from 'src/app/components/morename/morename.component';
import _ from 'lodash';

@Component({
  selector: 'app-createnewfeed',
  templateUrl: './createnewfeed.page.html',
  styleUrls: ['./createnewfeed.page.scss'],
})
export class CreatenewfeedPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public namelen = 0;
  public len = 0;
  public channelAvatar = '';
  public avatar = '';
  public curChannelPublicStatus: boolean = true;
  public developerMode: boolean = false;
  public isHelp: boolean = false;
  public arrowBoxStyle: any = { top: '0px' };
  public curLang: string = '';
  public tippingAddress: string = '';
  public lightThemeType: number = 3;
  public clickButton: boolean = false;
  private infoPopover: any = null;
  //public displayName: string = "";
  public channelName: string = "";
  public channelDes: string = "";
  constructor(
    private feedService: FeedService,
    private popoverController: PopoverController,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private popup: PopupProvider,
    private languageService: LanguageService,
    private ipfsService: IPFSService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private popupProvider: PopupProvider

  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.theme.setTheme1();
    this.initTitle();
    this.curLang = this.languageService.getCurLang();
    this.developerMode = this.dataHelper.getDeveloperMode();
    this.channelAvatar = this.dataHelper.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
  }

  mintChannel(destDid: string, channelId: string) {
    this.native.navigateForward(['/galleriachannel'], { queryParams: { "destDid": destDid, "channelId": channelId }, replaceUrl: true});
  }

  ionViewDidEnter() { }

  ionViewWillLeave() {
    this.theme.restTheme();
    this.native.hideLoading();
    this.clickButton = false;
    this.native.handleTabsEvents();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('CreatenewfeedPage.createNewFeed'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }
  // 创建频道
  async createChannel( ) {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    await this.processCreateChannel();
  }

  async processCreateChannel( ) {
    let nameValue = this.channelName || '';
     nameValue = this.native.iGetInnerText(nameValue);
    if (nameValue == '') {
      this.native.toastWarn('CreatenewfeedPage.tipMsg1');
      return;
    }

    if (nameValue.length > 32) {
      this.native.toastWarn('CreatenewfeedPage.tipMsgLength1');
      return;
    }

    let descValue = this.channelDes || '';
    descValue = this.native.iGetInnerText(descValue);
    if (descValue == '') {
      this.native.toastWarn('CreatenewfeedPage.tipMsg2');
      return;
    }

    if (descValue.length > 128) {
      this.native.toastWarn('CreatenewfeedPage.tipMsgLength');
      return;
    }


    this.channelAvatar = this.dataHelper.getProfileIamge() || '';

    if (this.channelAvatar == '') {
      this.native.toastWarn('CreatenewfeedPage.tipMsg');
      return;
    }

    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);

    this.clickButton = true;
    const signinDid = (await this.dataHelper.getSigninData()).did;
    const channelId = UtilService.generateChannelId(signinDid,  nameValue);
    await this.native.showLoading('common.waitMoment');
    try {

      const selfchannels = await this.hiveVaultController.getSelfChannel() || [];

      if (selfchannels.length >= 5) {
        this.native.hideLoading();
        this.clickButton = false;
        this.native.toastWarn('CreatenewfeedPage.feedMaxNumber');
        return;
      }

      const list = _.filter(selfchannels, (channel: FeedsData.ChannelV3) => {
        return channel.destDid === signinDid && channel.channelId === channelId;
      });
      if (list.length > 0) {
        this.native.hideLoading();
        this.clickButton = false;
        this.native.toastWarn('CreatenewfeedPage.alreadyExist'); // 需要更改错误提示
        return;
      }
      await this.uploadChannel( nameValue, nameValue, descValue);
    } catch (error) {

      this.native.handleHiveError(error, 'common.createChannelFail');
      this.clickButton = false;
      this.native.hideLoading();
    }

  }

  async uploadChannel(name: string, displayName: string, desc: string) {
    try {
      // 创建channles（用来存储userid下的所有创建的频道info）
      const signinData = await this.dataHelper.getSigninData();
      let userDid = signinData.did
      let userDisplayName = signinData.name;
      let tippingAddress = this.tippingAddress || '';
      const channelId = await this.hiveVaultController.createChannel(name, displayName, desc, this.avatar, tippingAddress)
      await this.hiveVaultController.subscribeChannel(userDid, channelId, userDisplayName);
      this.native.hideLoading();
      if(this.curChannelPublicStatus){
        this.publicChannel(userDid, channelId);
      }else{
        this.native.pop()
      }
    } catch (error) {

      this.native.handleHiveError(error, 'common.createChannelFail');
      this.clickButton = false;
      this.native.hideLoading();

    }
  }

  profileimage() {
    this.native.navigateForward(['/profileimage'], '');
  }

  clickPublicChannel() {
    this.zone.run(() => {
      this.curChannelPublicStatus = !this.curChannelPublicStatus;
    });
  }

  publicChannel(destDid: string, channelId: string) {
    if (!this.curChannelPublicStatus) {
      return;
    }
    this.mintChannel(destDid, channelId);
  }

  async help(event: any) {
    await this.presentPopover(event);
  }

  handleAvatar() {
    let imgUri = "";
    if (this.avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = this.avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('feeds:image:') > -1) {
      imgUri = this.avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('pasar:image:') > -1) {
      imgUri = this.avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else {
      imgUri = this.avatar;
    }
    return imgUri;
  }

  async scanWalletAddress() {
    let scanObj = await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
    let scannedContent = scanData["scannedText"] || "";
    if (scannedContent === '') {
      this.tippingAddress = "";
      return;
    }
    if (scannedContent.indexOf('ethereum:') > -1) {
      this.tippingAddress = scannedContent.replace('ethereum:', '');
    } else if (scannedContent.indexOf('elastos:') > -1) {
      this.tippingAddress = scannedContent.replace('elastos:', '');
    } else {
      this.tippingAddress = scannedContent;
    }
  }

  async presentPopover(e: Event) {

    let des = this.translate.instant('CreatenewfeedPage.des1');
    this.infoPopover = await this.popoverController.create({
      mode: 'ios',
      component: MorenameComponent,
      event: e,
      componentProps: {
        name: des,
      },
    });

    this.infoPopover.onWillDismiss().then(() => {
      this.infoPopover = null;
    });

    return await this.infoPopover.present();
  }

}
