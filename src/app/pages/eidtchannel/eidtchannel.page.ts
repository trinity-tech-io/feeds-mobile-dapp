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
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { Config } from 'src/app/services/config';
import { Logger } from 'src/app/services/logger';
import { IPFSService } from 'src/app/services/ipfs.service';
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
  private channelContratctInfo:any = null;

  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;
  private realFile: string = null;
  public thumbnail: string = '';

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
    this.channelOwner = channelInfo['channelOwner'] || '';
    this.channelSubscribes = channelInfo['channelSubscribes'] || '';
    //this.tippingAddress = await this.getChannelTipAddress();
    this.oldTippingAddress = this.tippingAddress;
    this.followStatus = channelInfo['followStatus'] || false;
    this.oldChannelAvatar = this.dataHelper.getProfileIamge();
    this.channelContratctInfo = await this.getChannelContratctInfo(this.channelId);
    if(this.channelContratctInfo != null){
      let walletAddress = this.walletConnectControllerService.getAccountAddress() || "";
      if(walletAddress === ""){
        this.walletConnectControllerService.connect();
      }
    }
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

    if(this.channelContratctInfo != null){
      let walletAddress = this.walletConnectControllerService.getAccountAddress() || "";
      if(walletAddress === ""){
        this.walletConnectControllerService.connect();
        return;
      }
    }

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
        this.native.hideLoading();

        this.handleUpdateChannel();

        //this.native.pop();
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

  async getChannelContratctInfo(channelId: string) {

    try {
      await this.native.showLoading("common.waitMoment");
      let tokenId: string = "0x" + channelId;
      tokenId = UtilService.hex2dec(tokenId);
      let tokenInfo = await this.nftContractControllerService.getChannel().channelInfo(tokenId);
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

  async handleUpdateChannel() {

    // this.isLoading = true;
    // this.loadingTitle = 'common.waitMoment';
    // this.loadingText = 'EidtchannelPage.updateChannelDesc';

    let sId = setTimeout(() => {
      this.nftContractControllerService.getChannel().cancelUpdateChanneProcess();
      this.isLoading = false;
      clearTimeout(sId);
      this.popupProvider.showSelfCheckDialog('EidtchannelPage.updateChannelTimeoutDesc');
    }, Config.WAIT_TIME_BURN_NFTS);

    this.loadingCurNumber = "1";
    this.loadingMaxNumber = "2";

    this.loadingText = "common.uploadingData"
    this.isLoading = true;

    let tokenId = '0x'+this.channelId;
    let receiptAddr = this.channelContratctInfo[3];

    this.uploadData()
    .then(async (result) => {
      Logger.log(TAG, 'Upload Result', result);
      this.loadingCurNumber = "1";
      this.loadingText = "common.uploadDataSuccess";

      let tokenUri = result.jsonHash;
      this.loadingCurNumber = "2";
      this.loadingText = "EidtchannelPage.updateChannelDesc";
      return this.updateChannelContract(tokenId, tokenUri, receiptAddr);
    }).then(()=>{
      this.nftContractControllerService.getChannel().cancelUpdateChanneProcess();
      this.zone.run(()=>{
        //this.curFeedPublicStatus = false;
      });
      this.isLoading = false;
      clearTimeout(sId);
      this.native.toast("EidtchannelPage.updateChannelSuccess");
      this.native.pop();
    }).catch(()=>{
      this.nftContractControllerService.getChannel().cancelUpdateChanneProcess();
      this.isLoading = false;
      clearTimeout(sId);
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
      this.realFile = await this.handleIpfsChannelAvatar();
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
      let ownerAddr = this.walletConnectControllerService.getAccountAddress() || "";
      let ipfsJSON = {
        "version": "2",
        "type": "FeedsChannel",
        "name": this.channelName,
        "description": this.channelDes,
        "creator": {
            "did": ownerAddr
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
