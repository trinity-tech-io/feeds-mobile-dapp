import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { UtilService } from 'src/app/services/utilService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { PopupProvider } from 'src/app/services/popup';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { StorageService } from 'src/app/services/StorageService';

@Component({
  selector: 'app-eidtchannel',
  templateUrl: './eidtchannel.page.html',
  styleUrls: ['./eidtchannel.page.scss'],
})
export class EidtchannelPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public destDid: string = '';
  public channelId: string = '';
  public channelName: string = '';
  public displayName: string = '';
  public channelDes: string = '';
  public channelAvatar = '';
  public avatar = '';
  public oldChannelInfo: any = {};
  public oldChannelAvatar: string = '';
  public isPublic: string = '';
  public tippingAddress: string = '';
  private oldTippingAddress: string = '';
  private channelOwner: string = "";
  private channelSubscribes: number = null;
  private followStatus: boolean = false;
  private isClickConfirm: boolean = false;
  private channelCollections: FeedsData.ChannelCollections = null;
  private popover: any = null;
  public lightThemeType: number = 3;
  public clickButton: boolean = false;
  constructor(
    private feedService: FeedService,
    public activatedRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private zone: NgZone,
    private httpService: HttpService,
    private popoverController: PopoverController,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    private nftContractControllerService: NFTContractControllerService,
    private pasarAssistService: PasarAssistService,
    private popupProvider: PopupProvider,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController,
    private storageService: StorageService
  ) { }

  async ngOnInit() {
    let item = this.dataHelper.getChannelInfo();
    this.oldChannelInfo = item;
    let channelInfo = _.cloneDeep(item);
    this.destDid = channelInfo['destDid'] || '';
    this.channelId = channelInfo['channelId'] || '';
    this.channelName = channelInfo['name'] || '';
    this.displayName = channelInfo['displayName'] || this.channelName;
    this.channelDes = channelInfo['des'] || '';
    this.channelOwner = channelInfo['channelOwner'] || '';
    this.channelSubscribes = channelInfo['channelSubscribes'] || '';
    this.tippingAddress = await this.getChannelTipAddress();
    this.oldTippingAddress = this.tippingAddress;
    this.followStatus = channelInfo['followStatus'] || false;
    this.oldChannelAvatar = this.dataHelper.getProfileIamge();
  }

  async getChannelTipAddress() {

    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    let tippingAddress = '';
    if (channel != null) {
      tippingAddress = channel.tipping_address || '';
      if (tippingAddress != '') {
        if (tippingAddress.indexOf("type") > -1) {
          let tippingObj = JSON.parse(tippingAddress);
          tippingAddress = tippingObj[0].address;
        }
      }
    }
    return tippingAddress;
  }

  ionViewWillEnter() {
    this.theme.setTheme1();
    this.initTitle();
    this.channelAvatar = this.dataHelper.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('EidtchannelPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  ionViewDidEnter() { }

  ionViewWillLeave() {
    this.clickButton = false;
    this.theme.restTheme();
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
    }
    if (!this.isClickConfirm) {
      this.dataHelper.setProfileIamge(this.oldChannelAvatar);
    }
    this.native.handleTabsEvents();
  }

  profileimage() {
    this.native.navigateForward(['/profileimage'], '');
  }

  cancel() {
    this.isClickConfirm = false;
    this.native.pop();
  }

  async confirm() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // await this.native.showLoading('common.waitMoment', isDismiss => { })
    // await this.getPublicStatus();
    // this.native.hideLoading();
    // if (this.isPublic === "1") {
    //   this.open("EidtchannelPage.des", "EidtchannelPage.des1")
    //   return;
    // }
    // if (this.isPublic === "2") {
    //   this.open("EidtchannelPage.des", "EidtchannelPage.des2")
    //   return;
    // }
    // if (this.isPublic === "3") {
    //   this.open("EidtchannelPage.des", "EidtchannelPage.des3")
    //   return;
    // }
    this.isClickConfirm = false;
    if (this.checkparms() && this.isPublic === "") {
      const signinDid = (await this.dataHelper.getSigninData()).did;
      this.clickButton = true;
      await this.native.showLoading('common.waitMoment');
      try {

        const selfchannels = await this.hiveVaultController.getSelfChannel() || [];
        let nameValue = this.native.iGetInnerText(this.displayName);
        const list = _.filter(selfchannels, (channel: FeedsData.ChannelV3) => {
          return channel.destDid === signinDid && channel.channelId != this.channelId && channel.displayName === nameValue;
        }) || [];
        if (list.length > 0) {
          this.native.hideLoading();
          this.native.toastWarn('CreatenewfeedPage.alreadyExist'); // 需要更改错误提示
          this.isClickConfirm = true;
          this.clickButton = false;
          return false;
        }
        this.editChannelInfo();
      } catch (error) {
        this.native.handleHiveError(error, 'common.editChannelFail');
        this.native.hideLoading();
        this.clickButton = false;
        this.isClickConfirm = true;
      }
    }
  }

  editChannelInfo() {
    try {
      this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
      let tippingAddress = this.tippingAddress || '';
      this.hiveVaultController.updateChannel(
        this.channelId,
        this.displayName,
        this.channelDes,
        this.avatar,
        tippingAddress,
        "public",
        '',
        '',
      ).then((result:  FeedsData.ChannelV3 ) => {
        let channelInfo = this.dataHelper.getChannelInfo();
        let tippingAddress = this.tippingAddress || '';
        channelInfo["name"] = this.channelName;
        channelInfo['displayName'] = this.displayName;
        channelInfo["des"] = this.channelDes;
        channelInfo["tippingAddress"] = tippingAddress;
        this.dataHelper.setChannelInfo(channelInfo);

        let currentChannel: FeedsData.ChannelV3 = this.dataHelper.getCurrentChannel() || null;

        if(currentChannel != null && currentChannel.destDid === this.destDid && currentChannel.channelId === this.channelId){
          currentChannel.displayName = this.displayName;
          currentChannel.intro = this.channelDes;
             result = result || null;
             if(result != null){
              currentChannel.avatar = result.avatar;
             }
             this.dataHelper.setCurrentChannel(currentChannel);
             this.storageService.set('feeds.currentChannel', JSON.stringify(currentChannel));
        }

        this.isClickConfirm = true;
        this.clickButton = false;
        this.native.hideLoading();
        this.native.pop();
      }).catch((error) => {
        this.native.handleHiveError(error, 'common.editChannelFail');
        this.native.hideLoading();
        this.clickButton = false;
        this.isClickConfirm = false;
      })
    } catch (error) {
      this.native.handleHiveError(error, 'common.editChannelFail');
      this.native.hideLoading();
      this.clickButton = false;
      this.isClickConfirm = false;
    }

  }

  checkparms() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return false;
    }

    let nameValue = this.displayName || '';
    nameValue = this.native.iGetInnerText(nameValue);
    if (nameValue === '') {
      this.native.toastWarn('CreatenewfeedPage.inputDisplayName');
      return false;
    }

    if (this.displayName.length > 32) {
      this.native.toastWarn('CreatenewfeedPage.tipMsgLength2');
      return false;
    }

    let checkRes = this.feedService.checkValueValid(this.displayName);
    if (checkRes) {
      this.native.toastWarn('CreatenewfeedPage.displaynameContainInvalidChars');
      return false;
    }

    let descValue = this.channelDes || '';
    descValue = this.native.iGetInnerText(descValue);

    if (descValue === '') {
      this.native.toastWarn('CreatenewfeedPage.inputFeedDesc');
      return false;
    }

    if (this.channelDes.length > 128) {
      this.native.toastWarn('CreatenewfeedPage.tipMsgLength');
      return;
    }

    if (this.channelAvatar === '') {
      this.native.toastWarn('CreatenewfeedPage.des');
      return false;
    }

    if (
      this.oldChannelInfo['displayName'] === this.displayName &&
      this.oldChannelInfo['des'] === this.channelDes &&
      this.tippingAddress === this.oldTippingAddress &&
      this.oldChannelAvatar === this.channelAvatar
    ) {
      this.native.toastWarn('common.nochanges');
      return false;
    }


    return true;
  }

  updatePublicData() {
    if (this.isPublic === '') {
      return;
    }
    let serverInfo = this.feedsServiceApi.getServerbyNodeId(this.destDid);
    let feedsUrl = serverInfo['feedsUrl'] + '/' + this.channelId;
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      feedsUrlHash: feedsUrlHash,
      name: this.displayName,
      description: this.channelDes,
      feedsAvatar: this.avatar,
      followers: this.oldChannelInfo['subscribers'],
    };
    this.httpService.ajaxPost(ApiUrl.update, obj, false).then(result => {
      if (result['code'] === 200) {
      }
    });
  }

  async getPublicStatus() {
    this.channelCollections = await this.getChannelCollectionsStatus() || null;
    if (this.channelCollections != null) {
      this.zone.run(() => {
        this.isPublic = '2';
      });
      return;
    }

    let serverInfo = this.feedsServiceApi.getServerbyNodeId(this.destDid);
    let feedsUrl = serverInfo['feedsUrl'] + '/' + this.channelId;
    let tokenInfo = await this.isExitStrick(feedsUrl);
    if (tokenInfo != null) {
      this.isPublic = '3';
      return;
    }
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    try {
      let result = await this.httpService
        .ajaxGet(ApiUrl.get + '?feedsUrlHash=' + feedsUrlHash, false) || null;
      if (result === null) {
        this.isPublic = '';
        return;
      }
      if (result['code'] === 200) {
        let resultData = result['data'] || '';
        if (resultData != '') {
          this.isPublic = '1';
        } else {
          this.isPublic = '';
        }
      }
    } catch (error) {

    }
  }

  async getChannelCollectionsStatus() {
    try {
      let server = this.feedsServiceApi.getServerbyNodeId(this.destDid) || null;
      if (server === null) {
        return;
      }
      let feedsUrl = server.feedsUrl + '/' + this.channelId;
      let feedsUrlHash = UtilService.SHA256(feedsUrl);
      let tokenId: string = "0x" + feedsUrlHash;
      tokenId = UtilService.hex2dec(tokenId);
      let list = this.dataHelper.getPublishedActivePanelList() || [];
      let fitleItem = _.find(list, (item) => {
        return item.tokenId === tokenId;
      }) || null;
      if (fitleItem != null) {
        return fitleItem;
      }
      let result = await this.pasarAssistService.getPanel(tokenId);
      if (result != null) {
        let tokenInfo = result["data"] || "";
        if (tokenInfo === "") {
          return null;
        }
        tokenInfo = await this.handlePanels(result["data"]);
        let panelList = this.dataHelper.getPublishedActivePanelList() || [];
        panelList.push(tokenInfo);
        this.dataHelper.setPublishedActivePanelList(panelList);
        return tokenInfo;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async isExitStrick(feedsUrl: string) {

    try {
      let tokenId: string = "0x" + UtilService.SHA256(feedsUrl);
      tokenId = UtilService.hex2dec(tokenId);
      //let tokenInfo = await this.pasarAssistService.searchStickers(tokenId);
      let tokenInfo = await this.nftContractControllerService.getSticker().tokenInfo(tokenId);
      if (tokenInfo[0] != '0' && tokenInfo[2] != '0') {
        return tokenInfo;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async handlePanels(item: any) {
    let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections();
    channelCollections.version = item.version;
    channelCollections.panelId = item.panelId;
    channelCollections.userAddr = item.user;
    //channelCollections.diaBalance = await this.nftContractControllerService.getDiamond().getDiamondBalance(channelCollections.userAddr);
    channelCollections.diaBalance = "0";
    channelCollections.type = item.type;
    channelCollections.tokenId = item.tokenId;
    channelCollections.name = item.name;
    channelCollections.description = item.description;
    channelCollections.avatar = item.avatar;
    channelCollections.entry = item.entry;
    channelCollections.ownerDid = item.tokenDid.did;
    channelCollections.ownerName = (await this.dataHelper.getSigninData()).name;
    return channelCollections;
  }

  open(des1: string, des2: string) {
    this.popover = this.popupProvider.showalertdialog(
      this,
      des1,
      des2,
      this.ok,
      'finish.svg',
      'common.ok',
    );
  }

  ok(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
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
}
