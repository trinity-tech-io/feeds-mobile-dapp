import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { UtilService } from 'src/app/services/utilService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { Logger } from 'src/app/services/logger';
import { Config } from 'src/app/services/config';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';
import { Params, ActivatedRoute } from '@angular/router';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

const SUCCESS = 'success';
const SKIP = 'SKIP';
const TAG: string = 'GalleriachannelPage';
@Component({
  selector: 'app-galleriachannel',
  templateUrl: './galleriachannel.page.html',
  styleUrls: ['./galleriachannel.page.scss'],
})
export class GalleriachannelPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private transDataChannel: FeedsData.TransDataChannel =
    FeedsData.TransDataChannel.MESSAGE;
  public nftName: string = '';
  public nftDescription: string = '';
  /**single  multiple*/
  public nftRoyalties: string = '';
  public nftQuantity: string = '1';

  public fileName: string = '';
  public thumbnail: string = '';
  public popover: any;
  public isLoading: boolean = false;
  public loadingTitle: string = "common.waitMoment";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  public maxAvatarSize: number = 5 * 1024 * 1024;
  private destDid: string = null;
  private channelId: string = null;
  public channel: FeedsData.ChannelV3 = null;
  public channelAvatar: string = null;
  private avatarObj: any = {};
  private tippingAddress: any = {};
  private channelAvatarUri: string = null;
  private tokenUri: string = null;
  private channelEntry: string = null;
  private receiptAddr: string = null;
  private ownerAddr: string = null;
  private mintSid: NodeJS.Timer = null;
  constructor(
    private translate: TranslateService,
    private event: Events,
    private native: NativeService,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService,
    private walletConnectControllerService: WalletConnectControllerService,
    private popupProvider: PopupProvider,
    private activatedRoute: ActivatedRoute,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController
  ) { }

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.destDid = params.destDid;
      this.channelId = params.channelId;
    });
  }

  async ionViewWillEnter() {
    this.initTile();
    this.addEvent();
    if (this.walletConnectControllerService.getAccountAddress() == '')
    this.walletConnectControllerService.connect();
    this.channel = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    this.nftName = this.channel.name || '';
    this.nftDescription = this.channel.intro || '';

    this.channelAvatarUri = this.channel.avatar || '';
    if(this.channelAvatarUri != ''){
      this.handleChannelAvatar(this.channelAvatarUri);
    }
  }

  ionViewWillLeave() {
    this.clearMintSid();
    this.removeEvent();
    this.native.handleTabsEvents()
  }

  ionViewDidLeave() {
    Logger.log(TAG, 'Leave page');
    this.nftContractControllerService
      .getSticker()
      .cancelMintProcess();
    this.nftContractControllerService
      .getSticker()
      .cancelSetApprovedProcess();
    this.nftContractControllerService
      .getPasar()
      .cancelCreateOrderProcess();
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('GalleriachannelPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  addEvent() {
    this.event.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTile();
    });
  }

  removeEvent() {
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
  }

  async mint() {
    if (!this.checkParms()) {
      // show params error
      return;
    }

    await this.doMint();
  }

  clearMintSid() {
    if(this.mintSid != null){
      clearTimeout(this.mintSid);
      this.mintSid = null;
    }
  }

  async doMint() {
    //Start loading
    this.clearMintSid();
    this.mintSid = setTimeout(() => {
      this.isLoading = false;
      this.nftContractControllerService
        .getChannel()
        .cancelMintProcess();
      this.showSelfCheckDialog();
      clearTimeout(this.mintSid);
      this.mintSid = null;
    }, Config.WAIT_TIME_MINT);

    this.loadingCurNumber = "1";
    this.loadingMaxNumber = "2";

    this.isLoading = true;
    let tokenId = this.getTokenId();
    this.channelEntry = UtilService.generateFeedsQrCodeString(this.destDid,this.channelId);
    this.tokenUri = this.channelEntry;
    this.ownerAddr = this.nftContractControllerService.getAccountAddress();
    this.receiptAddr = this.ownerAddr;
    this.loadingCurNumber = "1";
    this.loadingText = "GalleriachannelPage.mintingData";
    this.mintContract(tokenId,this.tokenUri,this.channelEntry,this.receiptAddr,'0x0000000000000000000000000000000000000000','0')
      .then(mintResult => {
          this.loadingCurNumber = "2";
          this.loadingText = "GalleriachannelPage.checkingCollectibleResult";
          this.isLoading = false;
          let channelPublicStatusList = this.dataHelper.getChannelPublicStatusList();
          let key = this.destDid +'-'+this.channelId;
          channelPublicStatusList[key] = "2";
          this.dataHelper.setChannelPublicStatusList(channelPublicStatusList);
          this.showSuccessDialog();
          this.clearMintSid();
      })
      .catch(error => {
        this.clearMintSid();
        this.nftContractControllerService
          .getChannel()
          .cancelMintProcess();

        //this.native.hideLoading();
        this.isLoading = false;
        if (error == 'EstimateGasError') {
          this.native.toast_trans('common.publishSameDataFailed');
          return;
        }
        this.native.toast_trans('GalleriachannelPage.publicGallericaFailed');
      });
  }

  checkParms() {
    let accountAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accountAddress === '') {
      this.native.toastWarn('common.connectWallet');
      return;
    }
    if (this.nftName === '') {
      this.native.toastWarn('MintnftPage.nftNamePlaceholder');
      return false;
    }
    if (this.nftDescription === '') {
      this.native.toastWarn('MintnftPage.nftDescriptionPlaceholder');
      return false;
    }

    return true;
  }

  mintContract(
    tokenId: string,
    tokenUri: string,
    channelEntry: string,
    receiptAddr: string,
    quoteToken: string,
    mintFee: string
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const MINT_ERROR = 'Mint process error';
      let result = '';
      try {
        result = await this.nftContractControllerService
          .getChannel()
          .mint(tokenId, tokenUri, channelEntry, receiptAddr, quoteToken, mintFee);
      } catch (error) {
        reject(error);
        return;
      }

      result = result || '';
      if (result === '') {
        reject(MINT_ERROR);
        return;
      }

      resolve(SUCCESS);
    });
  }

  number(text: any) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  showSuccessDialog() {

    let des = "GalleriachannelPage.mintSuccessDesc";
    this.popover = this.popupProvider.showalertdialog(
      this,
      'GalleriachannelPage.mintSuccess',
      des,
      this.bindingCompleted,
      'finish.svg',
      'common.ok',
    );

  }

  showSelfCheckDialog() {
    //TimeOut
    this.openAlert();
  }


  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      'common.timeout',
      'common.mintTimeoutDesc',
      this.confirm,
      'tskth.svg',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }

  bindingCompleted(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }

  getTokenId() {
    let tokenId = "0x" + this.channelId;
    return tokenId;
  }

  handleChannelAvatar(channelAvatarUri: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        this.channelAvatar = result;
      }).catch((err) => {
      })
  }

}
