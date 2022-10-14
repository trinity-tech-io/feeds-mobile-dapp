import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { HttpService } from '../../services/HttpService';
import { UtilService } from '../../services/utilService';
import { PopupProvider } from '../../services/popup';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger } from 'src/app/services/logger';
import { Config } from 'src/app/services/config';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
let TAG: string = 'Feeds-feedspreferences';
@Component({
  selector: 'app-feedspreferences',
  templateUrl: './feedspreferences.page.html',
  styleUrls: ['./feedspreferences.page.scss'],
})
export class FeedspreferencesPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public destDid: string = '';
  public channelId: string = "";
  public feedPublicStatus = {};
  public curFeedPublicStatus: boolean = false;

  public curCollectibleStatus: boolean = false;

  public collectibleStatus = {};
  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;
  public isShowMint: boolean = false;
  private channelInfo: any = null;
  private unPublicDialog: any = null;
  private burnChannelSid: NodeJS.Timer = null;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    public activeRoute: ActivatedRoute,
    private native: NativeService,
    public httpService: HttpService,
    public popupProvider: PopupProvider,
    private zone: NgZone,
    private titleBarService: TitleBarService,
    private nftContractControllerService: NFTContractControllerService,
    private dataHelper: DataHelper,
    private walletConnectControllerService: WalletConnectControllerService
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
    this.initTitle();
    this.getChannelPublicStatus(this.destDid,this.channelId);
  }

  ionViewWillLeave() {
    this.cancelUnPublicDialog(this);
    this.native.handleTabsEvents()
  }

  async newToggle() {

     let accountAddress = this.nftContractControllerService.getAccountAddress() || "";
     if (accountAddress === '') {
        //this.native.toastWarn('common.connectWallet');
        this.walletConnectControllerService.connect();
        return;
     }

     let channelPublicStatusList = this.dataHelper.getChannelPublicStatusList();
     let key = this.destDid+"-"+this.channelId;
     let channelPublicStatus = channelPublicStatusList[key] || "";
     if(channelPublicStatus === '2'){
       this.showUnPublicDialog();
       return;
     }
    this.mintChannel();
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
      'FeedspreferencesPage.des5',
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
    that.handleBurnChannel(that);
  }
  clearBurnChannelSid(){
    if(this.burnChannelSid != null){
        clearTimeout(this.burnChannelSid);
        this.burnChannelSid = null;
    }
  }
  async handleBurnChannel(that: any) {
    that.isLoading = true;
    that.loadingTitle = 'common.waitMoment';
    that.loadingText = 'FeedspreferencesPage.burningNFTSDesc';
    that.burnChannelSid = setTimeout(() => {
      that.nftContractControllerService.getChannel().cancelBurnProcess();
      that.isLoading = false;
      that.clearBurnChannelSid();
      that.popupProvider.showSelfCheckDialog('FeedspreferencesPage.burningNFTSTimeoutDesc');
    }, Config.WAIT_TIME_BURN_NFTS);

    let tokenId = '0x'+that.channelId;

    that.nftContractControllerService.getChannel()
      .burnChannel(tokenId)
      .then(() => {
        that.nftContractControllerService.getChannel().cancelBurnProcess();
        that.zone.run(()=>{
          that.curFeedPublicStatus = false;
        })
        that.isLoading = false;
        that.clearBurnChannelSid();
        that.handleCache(that);
      }).catch(() => {
        that.nftContractControllerService.getChannel().cancelBurnProcess();
        that.isLoading = false;
        that.clearBurnChannelSid();
        that.native.toastWarn("FeedspreferencesPage.burnNFTSFailed");
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

  handleCache(that:any){
    let channelCollectionPageList = that.dataHelper.getChannelCollectionPageList() || [];
    let channelIndex =_.findIndex(channelCollectionPageList,(channel: FeedsData.ChannelV3)=>{
          return that.destDid === channel.destDid && that.channelId === channel.channelId;
    })
    if(channelIndex > -1 ){
      channelCollectionPageList.splice(channelIndex,1);
      that.dataHelper.setChannelCollectionPageList(channelCollectionPageList)
    }

   let channelContractInfoList = that.dataHelper.getChannelContractInfoList() || {};
   let channelContractInfo = channelContractInfoList[that.channelId] || "";
   if(channelContractInfo != ""){
      delete channelContractInfoList[this.channelId];
      that.dataHelper.setChannelContractInfoList(channelContractInfoList);
      that.dataHelper.saveData("feeds.contractInfo.list",channelContractInfoList);
   }
    that.native.toast("FeedspreferencesPage.burnNFTSSuccess");
    let channelPublicStatusList = that.dataHelper.getChannelPublicStatusList();
    let key = that.destDid +'-'+that.channelId;
    channelPublicStatusList[key] = "1";
    that.dataHelper.setChannelPublicStatusList(channelPublicStatusList);
  }


}
