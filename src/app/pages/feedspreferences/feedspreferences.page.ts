import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { HttpService } from '../../services/HttpService';
import { ApiUrl } from '../../services/ApiUrl';
import { StorageService } from '../../services/StorageService';
import { UtilService } from '../../services/utilService';
import { PopupProvider } from '../../services/popup';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { MenuService } from 'src/app/services/MenuService';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { Logger } from 'src/app/services/logger';
let TAG: string = 'Feeds-feedspreferences';
@Component({
  selector: 'app-feedspreferences',
  templateUrl: './feedspreferences.page.html',
  styleUrls: ['./feedspreferences.page.scss'],
})
export class FeedspreferencesPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public hideDeletedPosts: boolean = true;
  public destDid: string = '';
  public channelId: string = "";
  public feedPublicStatus = {};
  public curFeedPublicStatus: boolean = false;
  public popover: any = null;
  public developerMode: boolean = false;
  public isShowQrcode: boolean = true;

  public isFirst: boolean = false;

  public curCollectibleStatus: boolean = false;

  public collectibleStatus = {};

  private channelCollections: FeedsData.ChannelCollections = null;
  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  public isShowMint: boolean = false;
  private channelInfo: any = null;
  private unPublicDialog: any = null
  constructor(
    private translate: TranslateService,
    private events: Events,
    public theme: ThemeService,
    public activeRoute: ActivatedRoute,
    private feedService: FeedService,
    private native: NativeService,
    public httpService: HttpService,
    private storageService: StorageService,
    public popupProvider: PopupProvider,
    private popoverController: PopoverController,
    private zone: NgZone,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private dataHelper: DataHelper,
    private nftContractHelperService: NFTContractHelperService,
    private ipfsService: IPFSService,
    private menuService: MenuService,
    private pasarAssistService: PasarAssistService,
    private feedsServiceApi: FeedsServiceApi,
  ) { }

  ngOnInit() {
    this.activeRoute.queryParams.subscribe((params: Params) => {
      this.destDid = params.destDid;
      this.channelId = params.channelId;
    });
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('FeedspreferencesPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  async ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.addEvent();
    this.channelInfo = await this.getChannelInfo();
    if(this.channelInfo != null){
       this.zone.run(()=>{
         this.curFeedPublicStatus = true;
       });
    }
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.clearEvent();
    this.native.handleTabsEvents()
  }

  clearEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelChannelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
  }

  addEvent() {
    this.events.subscribe(FeedsEvent.PublishType.startLoading, (obj) => {
      let title = obj["title"];
      let des = obj["des"];
      let curNum = obj["curNum"];
      let maxNum = obj["maxNum"];
      this.loadingTitle = title;
      this.loadingText = des;
      this.loadingCurNumber = curNum;
      this.loadingMaxNumber = maxNum;
      this.isLoading = true;
    });

    this.events.subscribe(FeedsEvent.PublishType.endLoading, (obj) => {
      this.isLoading = false;
    });

    this.events.subscribe(FeedsEvent.PublishType.nftCancelChannelOrder, (channelCollections: FeedsData.ChannelCollections) => {
      this.zone.run(() => {
        this.curFeedPublicStatus = false;
        this.isShowMint = false;
        let publishedActivePanelList = this.dataHelper.getPublishedActivePanelList() || [];
        if (publishedActivePanelList.length === 0) {
          return;
        }
        let tokenId = channelCollections.tokenId;
        let itemIndex = _.findIndex(publishedActivePanelList, (item: any) => {
          return item.tokenId === tokenId;
        });
        this.channelCollections = null;
        publishedActivePanelList.splice(itemIndex, 1);
        this.dataHelper.setPublishedActivePanelList(publishedActivePanelList);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      let type = obj["type"] || "";
      if (type === "burn") {
        this.zone.run(() => {
          this.curFeedPublicStatus = false;
          this.isShowMint = false;
        });
        return;
      }
      this.zone.run(() => {
        this.curFeedPublicStatus = true;
        this.isShowMint = false;
        let newItem = _.cloneDeep(obj["assItem"]);
        newItem["panelId"] = obj["panelId"];
        this.channelCollections = newItem;
        let publishedActivePanelList = this.dataHelper.getPublishedActivePanelList() || [];
        publishedActivePanelList.push(newItem);
        this.dataHelper.setPublishedActivePanelList(publishedActivePanelList);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitle();
    });
  }

  unPublicFeeds() {
    let server = this.feedsServiceApi.getServerbyNodeId(this.destDid) || null;
    if (server === null) {
      return;
    }
    let feed = this.feedService.getChannelFromId(this.destDid, this.channelId);
    let feedsUrl = server.feedsUrl + '/' + feed['id'];
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    this.httpService
      .ajaxGet(ApiUrl.remove + '?feedsUrlHash=' + feedsUrlHash)
      .then(result => {
        if (result['code'] === 200) {
          this.zone.run(() => {
            this.curFeedPublicStatus = false;
            this.isFirst = true;
          });
          this.feedPublicStatus = _.omit(this.feedPublicStatus, [feedsUrlHash]);
          this.feedService.setFeedPublicStatus(this.feedPublicStatus);
          this.storageService.set(
            'feeds.feedPublicStatus',
            JSON.stringify(this.feedPublicStatus),
          );
        }
      });
  }

  publicFeeds(buttonType: string) {
    let server = this.feedsServiceApi.getServerbyNodeId(this.destDid) || null;
    if (server === null) {
      return;
    }
    let feed = this.feedService.getChannelFromId(this.destDid, this.channelId);
    let feedsUrl = server.feedsUrl + '/' + feed['id'];
    let channelAvatar = this.feedService.parseChannelAvatar(feed['avatar']);
    let feedsUrlHash = UtilService.SHA256(feedsUrl);
    let obj = {
      did: server['did'],
      name: feed['name'],
      description: feed['introduction'],
      url: feedsUrl,
      feedsUrlHash: feedsUrlHash,
      feedsAvatar: channelAvatar,
      followers: feed['subscribers'],
      ownerName: feed['owner_name'],
      nodeId: this.destDid,
      ownerDid: feed['owner_did'],
    };

    if (this.developerMode && buttonType === 'confirm') {
      obj['purpose'] = '1';
    }

    this.httpService.ajaxPost(ApiUrl.register, obj).then(result => {
      if (result['code'] === 200) {
        this.zone.run(() => {
          this.isFirst = true;
          this.curFeedPublicStatus = true;
        });
        this.feedPublicStatus[feedsUrlHash] = '1';
        this.feedService.setFeedPublicStatus(this.feedPublicStatus);
        this.storageService.set(
          'feeds.feedPublicStatus',
          JSON.stringify(this.feedPublicStatus)
        );
      }
    });
  }

  developerModeConfirm() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      'ServerInfoPage.des1',
      this.cancel,
      this.confirm,
      './assets/images/tskth.svg',
      'ServerInfoPage.des2',
      'ServerInfoPage.des3',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.publicFeeds('cancel');
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.publicFeeds('confirm');
  }

  async newToggle() {
     await this.native.showLoading("common.waitMoment");
     let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
     if (accountAddress === '') {
        this.native.hideLoading();
        this.native.toastWarn('common.connectWallet');
        return;
     }

    if( this.channelInfo === null ){
      this.native.hideLoading();
      this.mintChannel();
       return;
    }
    this.native.hideLoading();
    this.showUnPublicDialog();

  }

  setCollectible() {
    this.zone.run(() => {
      this.curCollectibleStatus = !this.curCollectibleStatus;
      // let key = this.nodeId + '_' + this.feedId;
      // this.collectibleStatus[key] = this.curCollectibleStatus;
      // this.dataHelper.setCollectibleStatus(this.collectibleStatus);
      // this.storageService.set(
      //   'feeds.collectible.setting',
      //   JSON.stringify(this.collectibleStatus),
      // );
    });
  }

  mintChannel() {
    this.native.navigateForward(['/galleriachannel'], { queryParams: { "destDid": this.destDid, "channelId": this.channelId } });
  }

  async getChannelInfo() {

    try {
      await this.native.showLoading("common.waitMoment");
      let tokenId: string = "0x" + this.channelId;
      Logger.log(TAG,"tokenId:",tokenId);
      tokenId = UtilService.hex2dec(tokenId);
      Logger.log(TAG,"tokenIdHex2dec:",tokenId);
      let tokenInfo = await this.nftContractControllerService.getChannel().channelInfo(tokenId);
      Logger.log(TAG,"tokenInfo:",tokenInfo);
      if (tokenInfo[0] != '0') {
        this.native.hideLoading();
        return tokenInfo;
      }
      this.native.hideLoading();
      return null;
    } catch (error) {
      this.native.hideLoading();
      return null;
    }

  }

  async showUnPublicDialog() {
    this.unPublicDialog = await this.popupProvider.ionicConfirm(
      this,
      'FeedspreferencesPage.des3',
      'FeedspreferencesPage.des4',
      this.cancelUnPublicDialog,
      this.confirmUnPublicDialog,
      './assets/images/tskth.svg',
      'FeedspreferencesPage.des2',
      'FeedspreferencesPage.des6',
    );
  }

  cancelUnPublicDialog(that: any) {
    if (that.unPublicDialog != null) {
        that.unPublicDialog.dismiss();
        that.unPublicDialog = null;
    }
  }

  confirmUnPublicDialog(that: any) {
    if (that.unPublicDialog != null) {
      that.unPublicDialog.dismiss();
      that.unPublicDialog = null;
    }
  }


}
