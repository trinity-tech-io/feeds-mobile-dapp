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
import { IPFSService } from 'src/app/services/ipfs.service';
import { FeedService } from 'src/app/services/FeedService';
import SparkMD5 from 'spark-md5';
import { IntentService } from 'src/app/services/IntentService';

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
  private avatar: string = "";
  private channelAvatarUri: string = null;
  private tokenUri: string = null;
  private channelEntry: string = null;
  private receiptAddr: string = null;
  private ownerAddr: string = null;
  private mintSid: NodeJS.Timer = null;
  public tippingAddress: string = "";
  private realFile: string = null;
  private displayName: string = "";
  private signature: string = "";
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
    private hiveVaultController: HiveVaultController,
    private ipfsService: IPFSService,
    private feedService: FeedService,
    private intentService: IntentService
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
    this.tippingAddress = this.walletConnectControllerService.getAccountAddress() || "";
    if (this.tippingAddress == ''){
        this.walletConnectControllerService.connect().then(()=>{
          this.tippingAddress = this.walletConnectControllerService.getAccountAddress();
        });
    }
    this.channel = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    this.nftName = this.channel.name || '';
    this.nftDescription = this.channel.intro || '';
    this.displayName = this.channel.displayName || this.channel.name || '';
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
      .getChannel()
      .cancelMintProcess();
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

   this.channelEntry = UtilService.generateFeedsQrCodeString(this.destDid,this.channelId);
   let signData = {data:this.channelEntry};
   let signResult = await this.intentService.didsign(signData);
   if(signResult === null){
    this.native.toastWarn("GalleriachannelPage.signatureError")
       return;
   }
  let data = signResult['result'] || null;
  if(data === null){
    this.native.toastWarn("GalleriachannelPage.signatureError")
    return;
  }

  let signature = data['signature'] || null;
  if(signature === null){
    this.native.toastWarn("GalleriachannelPage.signatureError")
    return;
  }
  let iss = data["iss"] || null;
  if(iss != this.destDid ){
    this.native.toastWarn("GalleriachannelPage.signatureError1")
    return;
  }
  this.signature = signature;
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
    this.loadingMaxNumber = "3";

    this.loadingText = "common.uploadingData"
    this.isLoading = true;
    let tokenId = this.getTokenId();
    this.channelEntry = UtilService.generateFeedsQrCodeString(this.destDid,this.channelId);
    this.ownerAddr = this.nftContractControllerService.getAccountAddress();
    let tippingAddress = this.tippingAddress || '';
    if(tippingAddress === ""){
      this.receiptAddr = this.ownerAddr;
    }else{
      this.receiptAddr = tippingAddress;
    }

    this.uploadData()
    .then(async (result) => {
      Logger.log(TAG, 'Upload Result', result);
      this.loadingCurNumber = "1";
      this.loadingText = "common.uploadDataSuccess";

      this.tokenUri = result.jsonHash;
      this.loadingCurNumber = "2";
      this.loadingText = "GalleriachannelPage.mintingData";
      return this.mintContract(tokenId,this.tokenUri,this.channelEntry,this.receiptAddr)

    }).then(mintResult => {
          this.loadingCurNumber = "3";
          this.loadingText = "GalleriachannelPage.checkingCollectibleResult";
          this.isLoading = false;
          let channelPublicStatusList = this.dataHelper.getChannelPublicStatusList();
          let key = this.destDid +'-'+this.channelId;
          channelPublicStatusList[key] = "2";
          this.dataHelper.setChannelPublicStatusList(channelPublicStatusList);
          let channelCollectionPageList = this.dataHelper.getChannelCollectionPageList() || [];
          let channelIndex =_.findIndex(channelCollectionPageList,(channel: FeedsData.ChannelV3)=>{
                return this.destDid === channel.destDid && this.channelId === channel.channelId;
          })
          if(channelIndex === -1 ){
            let newChannel:any = this.channel;
            newChannel.channelSource = "hive";
            channelCollectionPageList.unshift(newChannel);
            this.dataHelper.setChannelCollectionPageList(channelCollectionPageList)
          }
          // add channelContracts Info Cache
          let channelContratctInfo: FeedsData.ChannelContractInfo = {
            description: '',
            cname: '',
            avatar: '',
            receiptAddr: '',
            tokenId: '',
            tokenUri: '',
            channelEntry: '',
            ownerAddr: '',
            signature: ''
          };
          channelContratctInfo.description = this.nftDescription;
          channelContratctInfo.cname = this.displayName;
          channelContratctInfo.receiptAddr = this.receiptAddr;
          channelContratctInfo.channelEntry = this.channelEntry;
          channelContratctInfo.ownerAddr = this.ownerAddr;
          channelContratctInfo.tokenUri = this.tokenUri;
          channelContratctInfo.tokenId = this.getTokenId();
          channelContratctInfo.signature = this.signature;
          let hash = SparkMD5.hash(this.realFile);
          channelContratctInfo.avatar = hash;
          let channelContractInfoList = this.dataHelper.getChannelContractInfoList() || {};
          channelContractInfoList[this.channelId] = channelContratctInfo;
          this.dataHelper.setChannelContractInfoList(channelContractInfoList);
          this.dataHelper.saveData("feeds.contractInfo.list",channelContractInfoList);
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
          this.native.toastWarn('GalleriachannelPage.publishSameDataFailed');
          return;
        }
        this.native.toastWarn('GalleriachannelPage.publicGallericaFailed');
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

    let tippingAddress = this.tippingAddress || "";
    if(tippingAddress === ""){
      this.native.toastWarn('CreatenewfeedPage.tippingAddressDes');
      return false;
    }
    if(tippingAddress != ""){
      let isVailAddress = this.nftContractControllerService.isAddress(tippingAddress);
      if(!isVailAddress){
        this.native.toastWarn("common.addressinvalid");
        return false;
      }
    }

    return true;
  }

  mintContract(
    tokenId: string,
    tokenUri: string,
    channelEntry: string,
    receiptAddr: string
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const MINT_ERROR = 'Mint process error';
      let result = '';
      try {
        result = await this.nftContractControllerService
          .getChannel()
          .mint(tokenId, tokenUri, channelEntry, receiptAddr);
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

  async confirm(that: any) {
    if (this.popover != null) {
      try {
        await this.popover.dismiss();
        this.popover = null;
        that.native.pop();
      } catch (error) {

      }
    }
  }

  async bindingCompleted(that: any) {
    if (this.popover != null) {
      try {
        await this.popover.dismiss();
        this.popover = null;
        that.native.pop();
      } catch (error) {

      }
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

  async scanWalletAddress() {
    let scanObj = await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
    let scannedContent = scanData["scannedText"] || "";
    if (scannedContent === '') {
      this.tippingAddress = "";
      return;
    }
    let tippingAddress = "";
    if (scannedContent.indexOf('ethereum:') > -1) {
        tippingAddress = scannedContent.replace('ethereum:', '');
    } else if (scannedContent.indexOf('elastos:') > -1) {
      tippingAddress = scannedContent.replace('elastos:', '');
    } else {
      tippingAddress = scannedContent;
    }

    if(tippingAddress != ""){
     let isVailAddress = this.nftContractControllerService.isAddress(tippingAddress);
     if(isVailAddress){
       this.tippingAddress = tippingAddress;
     }else{
       this.native.toastWarn("common.addressinvalid");
     }
    }
  }

  uploadData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.realFile = await this.handleIpfsChannelAvatar();
      if (this.realFile == null) {
        reject('upload file error');
        return;
      }
      this.sendIpfsImage(this.realFile).then((realFileObj: any) => {
        this.avatar = realFileObj["cid"];
        return this.sendIpfsJSON();
        }).then((jsonHash) => {
          resolve({ jsonHash: jsonHash });
        })
        .catch((error) => {
          reject('upload file error');
        });
    });
  }

  sendIpfsImage(file: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let blob = UtilService.dataURLtoBlob(file);
      let formData = new FormData();
      formData.append('', blob);
      Logger.log(TAG, 'Send img, formdata length is', formData.getAll('').length);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          let hash = result['Hash'] || null;
          if (!hash) {
            reject("Upload Image error, hash is null")
            return;
          }
          let kind = blob.type.replace("image/", "");
          let size = blob.size;
          let cid = 'feeds:image:' + hash;
          resolve({ "cid": cid, "size": size, "kind": kind });
        })
        .catch(err => {
          reject('Upload image error, error is ' + JSON.stringify(err));
        });
    });
  }

  sendIpfsJSON(): Promise<string> {
    return new Promise(async (resolve, reject) => {

      let ipfsJSON = {
        "version": "2",
        "type": "FeedsChannel",
        "name": this.nftName,
        "description": this.nftDescription,
        "creator": {
            "did": this.destDid
        },
        "data": {
            "cname": this.displayName,//channel displayName
            "avatar": this.avatar,//feeds:image:QmUVpumZzH9ECm43nyrQ14wwYHDWf3aRMDmGmHxkM1ufEJ
            "banner": "",
            "ownerDid": this.destDid,
            "channelEntry": this.channelEntry,
            "signature": this.signature
        }
        }

      let formData = new FormData();
      formData.append('', JSON.stringify(ipfsJSON));
      Logger.log(TAG, 'Send json, formdata length is', formData.getAll('').length);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
          Logger.log(TAG, 'Json data is', JSON.stringify(result));
          let hash = result['Hash'] || null;
          if (hash != null) {
            let jsonHash = 'feeds:json:' + hash;
            resolve(jsonHash);
          }
        })
        .catch(err => {
          Logger.error(TAG, 'Send Json data error', err);
          reject('upload json error');
        });
    });
  }

  async handleIpfsChannelAvatar() {

    let channelAvatar: string = this.feedService.parseChannelAvatar(this.channelAvatar);
    if (channelAvatar.startsWith("data:image")) {
      return channelAvatar;
    }

    if (channelAvatar.startsWith("assets/images/profile")) {
      let fileName = channelAvatar.replace("assets/images/", "");
      let avatarBase64 = UtilService.getDefaultAvatar(fileName);
      return avatarBase64;
    }

    if (channelAvatar.startsWith("https://")) {
      let avatar = await UtilService.downloadFileFromUrl(channelAvatar);
      let avatarBase64 = await UtilService.blobToDataURL(avatar);
      return avatarBase64;
    }
  }


}
