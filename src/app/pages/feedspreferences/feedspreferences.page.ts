import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { HttpService } from '../../services/HttpService';
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
import { Config } from 'src/app/services/config';
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
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;
  public isShowMint: boolean = false;
  private channelInfo: any = null;
  private unPublicDialog: any = null;
  private channelPublicStatus: any = {};
  constructor(
    private translate: TranslateService,
    private events: Events,
    public theme: ThemeService,
    public activeRoute: ActivatedRoute,
    private feedService: FeedService,
    private native: NativeService,
    public httpService: HttpService,
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

  ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.addEvent();
    this.getChannelPublicStatus(this.destDid,this.channelId);
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
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelChannelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
  }

  addEvent() {


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

  async getChannelInfo(channelId: string) {

    try {
      await this.native.showLoading("common.waitMoment");
      let tokenId: string = "0x" + channelId;
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
      'FeedspreferencesPage.des5',
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
    that.handleBurnChannel(that);
  }

  async handleBurnChannel(that: any) {
    that.isLoading = true;
    that.loadingTitle = 'common.waitMoment';
    that.loadingText = 'common.burningNFTSDesc';
    let sId = setTimeout(() => {
      that.nftContractControllerService.getSticker().cancelBurnProcess();
      that.isLoading = false;
      clearTimeout(sId);
      that.popupProvider.showSelfCheckDialog('common.burningNFTSTimeoutDesc');
    }, Config.WAIT_TIME_BURN_NFTS);

    let tokenId = '0x'+this.channelId;

    that.nftContractControllerService.getChannel()
      .burnChannel(tokenId)
      .then(() => {
        that.nftContractControllerService.getChannel().cancelBurnProcess();
        this.zone.run(()=>{
          this.curFeedPublicStatus = false;
        })
        that.isLoading = false;
        clearTimeout(sId);
        that.native.toast("common.burnNFTSSuccess");
      }).catch(() => {
        that.nftContractControllerService.getChannel().cancelBurnProcess();
        that.isLoading = false;
        clearTimeout(sId);
        that.native.toastWarn("common.burnNFTSFailed");
      });
  }

  async getChannelPublicStatus(destDid: string,channelId: string) {
    let channelPublicStatusList = this.dataHelper.getChannelPublicStatusList();
    let key = destDid +'-'+channelId;
    let channelPublicStatus = channelPublicStatusList[key] || '';
    if(channelPublicStatus === '1'){
      this.zone.run(()=>{
        this.curFeedPublicStatus = false;
      });
      return;
    }
    if(channelPublicStatus === '2'){
      this.zone.run(()=>{
        this.curFeedPublicStatus = true;
      });
      return;
    }
    if(channelPublicStatus === ''){
      this.channelInfo = await this.getChannelInfo(this.channelId);
      if(this.channelInfo != null){
         this.zone.run(()=>{
           this.curFeedPublicStatus = true;
           channelPublicStatusList[key] = "2";//已公开
         });
      }else{
        channelPublicStatusList[key] = "1";//未公开
      }
      return;
    }
  }


}
