import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopoverController } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from 'src/app/services/NativeService';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { UtilService } from 'src/app/services/utilService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { DataHelper } from 'src/app/services/DataHelper';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { StorageService } from 'src/app/services/StorageService';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { Config } from 'src/app/services/config';
import { Logger } from 'src/app/services/logger';
import { IPFSService } from 'src/app/services/ipfs.service';
import SparkMD5 from 'spark-md5';
const TAG: string = 'EidtchannelPage';
const SUCCESS = 'success';
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
  private avatarCid = '';
  public oldChannelInfo: any = {};
  public oldChannelAvatar: string = '';
  public tippingAddress: string = '';
  private oldTippingAddress: string = '';
  private isClickConfirm: boolean = false;
  public lightThemeType: number = 3;
  public clickButton: boolean = false;
  private channelContratctInfo:any = null;
  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;
  private realFile: string = null;
  private avatarHash: string = "";
  public isShowTippingAddress: boolean = false;
  public isShowUpdateContratct: boolean = false;
  constructor(
    private feedService: FeedService,
    public activatedRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private native: NativeService,
    private zone: NgZone,
    private popoverController: PopoverController,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    private nftContractControllerService: NFTContractControllerService,
    private popupProvider: PopupProvider,
    private hiveVaultController: HiveVaultController,
    private storageService: StorageService,
    private walletConnectControllerService: WalletConnectControllerService,
    private ipfsService: IPFSService,
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
    this.oldChannelAvatar = this.dataHelper.getProfileIamge();
    let avatarBase64 =  await this.handleIpfsChannelAvatar(this.oldChannelAvatar);
    this.avatarHash =  SparkMD5.hash(avatarBase64);
    let channelContractInfoList = this.dataHelper.getChannelContractInfoList() || {};
    this.channelContratctInfo = channelContractInfoList[this.channelId] || null;

    if(this.channelContratctInfo === null){
      this.channelContratctInfo = await this.getChannelContratctInfo(this.channelId) || null;
    }

    if(this.channelContratctInfo === "unPublic"){
      channelContractInfoList[this.channelId] = this.channelContratctInfo;
      this.dataHelper.setChannelContractInfoList(channelContractInfoList);
      this.dataHelper.saveData("feeds.contractInfo.list",channelContractInfoList);
      return;
    }

    if(this.channelContratctInfo != null && this.channelContratctInfo != "unPublic"){
      channelContractInfoList[this.channelId] = this.channelContratctInfo;
      this.dataHelper.setChannelContractInfoList(channelContractInfoList);
      this.dataHelper.saveData("feeds.contractInfo.list",channelContractInfoList);
      this.tippingAddress =  this.channelContratctInfo.receiptAddr;
      this.oldTippingAddress = this.tippingAddress;
      this.isShowTippingAddress = true;
      if(this.channelContratctInfo.cname != this.displayName ||
         this.channelContratctInfo.avatar != this.avatarHash ||
         this.channelContratctInfo.description != this.channelDes ){
         this.isShowUpdateContratct = true;
      }else{
        this.isShowUpdateContratct = false;
      }
      let walletAddress = this.walletConnectControllerService.getAccountAddress() || "";
      if(walletAddress === ""){
        this.walletConnectControllerService.connect();
      }
    }
  }

  async ionViewWillEnter() {
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
    if (!this.isClickConfirm) {
      this.dataHelper.setProfileIamge(this.oldChannelAvatar);
    }
    this.native.handleTabsEvents();
  }

  profileimage() {
    if(this.isShowUpdateContratct){
        return;
    }
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

    if(this.channelContratctInfo != null && this.channelContratctInfo != "unPublic" ){

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

      let walletAddress = this.walletConnectControllerService.getAccountAddress() || "";
      if(walletAddress === ""){
        this.walletConnectControllerService.connect();
        return;
      }
    }

    this.isClickConfirm = false;
    if (this.checkparms()) {
      const signinDid = (await this.dataHelper.getSigninData()).did;
      this.clickButton = true;

      this.loadingCurNumber = "1";
      if(this.channelContratctInfo != null && this.channelContratctInfo != "unPublic"){
        this.loadingMaxNumber = "3";
      }else{
        this.loadingMaxNumber = "1";
      }
      this.loadingText = "EidtchannelPage.updateChannelDesc1";
      this.isLoading = true;

      try {
        const selfchannels = await this.hiveVaultController.getSelfChannel() || [];
        let nameValue = this.native.iGetInnerText(this.displayName);
        const list = _.filter(selfchannels, (channel: FeedsData.ChannelV3) => {
          return channel.destDid === signinDid && channel.channelId != this.channelId && channel.displayName === nameValue;
        }) || [];
        if (list.length > 0) {
          this.isLoading = false;
          this.native.toastWarn('CreatenewfeedPage.alreadyExist'); // 需要更改错误提示
          this.isClickConfirm = true;
          this.clickButton = false;
          return false;
        }
        this.editChannelInfo();
      } catch (error) {
        this.native.handleHiveError(error, 'common.editChannelFail');
        this.isLoading = false;
        this.clickButton = false;
        this.isClickConfirm = true;
      }
    }
  }

  editChannelInfo() {
    try {
      this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
      this.hiveVaultController.updateChannel(
        this.channelId,
        this.displayName,
        this.channelDes,
        this.avatar,
        '',
        "public",
        '',
        '',
      ).then((result: FeedsData.ChannelV3) => {
        let channelInfo = this.dataHelper.getChannelInfo();
        let tippingAddress = this.tippingAddress || '';
        channelInfo["name"] = this.channelName;
        channelInfo['displayName'] = this.displayName;
        channelInfo["des"] = this.channelDes;
        channelInfo["tippingAddress"] = tippingAddress;
        this.dataHelper.setChannelInfo(channelInfo);

        let currentChannel: FeedsData.ChannelV3 = this.dataHelper.getCurrentChannel() || null;

        if (currentChannel != null && currentChannel.destDid === this.destDid && currentChannel.channelId === this.channelId) {
          currentChannel.displayName = this.displayName;
          currentChannel.intro = this.channelDes;
          result = result || null;
          if (result != null) {
            currentChannel.avatar = result.avatar;
          }
          this.dataHelper.setCurrentChannel(currentChannel);
          this.storageService.set('feeds.currentChannel', JSON.stringify(currentChannel));
        }

        //更新explore feeds cace

        let channelCollectionPageList = this.dataHelper.getChannelCollectionPageList() || [];

        let channelIndex = _.findIndex(channelCollectionPageList,(item: FeedsData.ChannelV3)=>{
                  return item.channelId === this.channelId;
        });

        if(channelIndex > -1){
          channelCollectionPageList[channelIndex].displayName = this.displayName;
          channelCollectionPageList[channelIndex].intro = this.channelDes;
          channelCollectionPageList[channelIndex].avatar = result.avatar;
        }

        this.isClickConfirm = true;
        this.clickButton = false;
        if(this.channelContratctInfo != null && this.channelContratctInfo != "unPublic"){
          this.handleUpdateChannel();
        }else{
         this.isLoading = false;
         this.native.pop();
        }
      }).catch((error) => {
        this.native.handleHiveError(error, 'common.editChannelFail');
        this.isLoading = false;
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

  async getChannelContratctInfo(channelId: string) {
    try {
      await this.native.showLoading("common.waitMoment");
      let tokenId: string = "0x" + channelId;
      tokenId = UtilService.hex2dec(tokenId);
      let tokenInfo = await this.nftContractControllerService.getChannel().channelInfo(tokenId);
      if (tokenInfo[0] != '0') {
         let channelContratctInfo: FeedsData.ChannelContractInfo = {
           description: '',
           cname: '',
           avatar: '',
           receiptAddr: '',
           tokenId: '',
           tokenUri: '',
           channelEntry: '',
           ownerAddr: ''
         };
        channelContratctInfo.tokenId = tokenInfo[0];
        channelContratctInfo.tokenUri = tokenInfo[1];
        channelContratctInfo.channelEntry = tokenInfo[2];
        channelContratctInfo.receiptAddr = tokenInfo[3];
        channelContratctInfo.ownerAddr = tokenInfo[4];
        let uri = tokenInfo[1].replace('feeds:json:', '');
        let result:any = await this.ipfsService
          .nftGet(this.ipfsService.getNFTGetUrl() + uri);
        channelContratctInfo.description = result.description;
        channelContratctInfo.cname = result.data.cname;
        let avatarUri = result.data.avatar.replace('feeds:image:', '');
        let avatar = await UtilService.downloadFileFromUrl(this.ipfsService.getNFTGetUrl()+avatarUri);
        let avatarBase64 = await UtilService.blobToDataURL(avatar);
        const hash = SparkMD5.hash(avatarBase64);
        channelContratctInfo.avatar = hash;
        this.native.hideLoading();
        return channelContratctInfo;
      }
      this.native.hideLoading();
      return "unPublic";
    } catch (error) {
      this.native.hideLoading();
      return null;
    }
  }

  async handleUpdateChannel() {

    let sId = setTimeout(() => {
      this.nftContractControllerService.getChannel().cancelUpdateChanneProcess();
      this.isLoading = false;
      clearTimeout(sId);
      this.popupProvider.showSelfCheckDialog('EidtchannelPage.updateChannelTimeoutDesc');
    }, Config.WAIT_TIME_BURN_NFTS);
    if(this.isShowUpdateContratct){
      this.loadingCurNumber = "1";
      this.loadingText = "common.uploadingData";
      this.loadingMaxNumber = "2";
      this.isLoading = true;
    }else{
      this.loadingCurNumber = "2";
      this.loadingText = "common.uploadingData";
    }


    let tokenId = '0x'+this.channelId;
    let receiptAddr = this.tippingAddress || '';
    this.uploadData()
    .then(async (result) => {
      Logger.log(TAG, 'Upload Result', result);
      if(this.isShowUpdateContratct){
        this.loadingCurNumber = "1";
        this.loadingText = "common.uploadDataSuccess";
      }else{
        this.loadingCurNumber = "2";
        this.loadingText = "common.uploadDataSuccess";
      }
      let tokenUri = result.jsonHash;
      if(this.isShowUpdateContratct){
        this.loadingCurNumber = "2";
        this.loadingText = "EidtchannelPage.updateChannelDesc";
      }else{
        this.loadingCurNumber = "3";
        this.loadingText = "EidtchannelPage.updateChannelDesc";
      }
      return this.updateChannelContract(tokenId, tokenUri, receiptAddr);
    }).then(async ()=>{
      this.nftContractControllerService.getChannel().cancelUpdateChanneProcess();

      //add channel Contratct cace
      this.channelContratctInfo.description = this.channelDes;
      this.channelContratctInfo.cname = this.displayName;
      this.channelContratctInfo.receiptAddr = this.tippingAddress;
      let avatarBase64 =  await this.handleIpfsChannelAvatar(this.channelAvatar);
      let avatarHash =  SparkMD5.hash(avatarBase64);
      this.channelContratctInfo.avatar = avatarHash;
      let channelContractInfoList = this.dataHelper.getChannelContractInfoList() || {};
      channelContractInfoList[this.channelId] = this.channelContratctInfo;
      this.dataHelper.setChannelContractInfoList(channelContractInfoList);
      this.dataHelper.saveData("feeds.contractInfo.list",channelContractInfoList);
      this.isLoading = false;
      clearTimeout(sId);
      this.native.pop();
    }).catch(()=>{
      this.nftContractControllerService.getChannel().cancelUpdateChanneProcess();
      this.isLoading = false;
      clearTimeout(sId);
      this.isShowUpdateContratct = true;
      this.native.toastWarn("EidtchannelPage.updateChannelFailed");
    });
  }


  updateChannelContract(
    tokenId: string,
    tokenUri: string,
    receiptAddr: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const MINT_ERROR = 'update process error';
      let result = '';
      try {
        result = await this.nftContractControllerService
          .getChannel()
          .updateChannel(tokenId,tokenUri,receiptAddr);
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

  uploadData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.realFile = await this.handleIpfsChannelAvatar(this.channelAvatar);
      if (this.realFile == null) {
        reject('upload file error');
        return;
      }
      this.sendIpfsImage(this.realFile).then((realFileObj: any) => {
        this.avatarCid = realFileObj["cid"];
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
        "name": this.channelName,
        "description": this.channelDes,
        "creator": {
            "did": this.destDid
        },
        "data": {
            "cname": this.displayName,//channel displayName
            "avatar": this.avatarCid,//feeds:image:QmUVpumZzH9ECm43nyrQ14wwYHDWf3aRMDmGmHxkM1ufEJ
            "banner": "",
            "ownerDid": this.destDid,
            "channelEntry": UtilService.generateFeedsQrCodeString(this.destDid,this.channelId),
            "signature": ""
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

  async handleIpfsChannelAvatar(avatar: string) {

    let channelAvatar: string = this.feedService.parseChannelAvatar(avatar);
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

  updateContratct() {
    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.channelContratctInfo != null && this.channelContratctInfo != "unPublic"){

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

      let walletAddress = this.walletConnectControllerService.getAccountAddress() || "";
      if(walletAddress === ""){
        this.walletConnectControllerService.connect();
        return;
      }
    }
    this.isClickConfirm = false;
    this.clickButton = true;
    this.handleUpdateChannel();
  }
}
