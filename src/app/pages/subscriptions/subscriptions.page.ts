import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { IntentService } from 'src/app/services/IntentService';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import _ from 'lodash';
import { ThemeService } from 'src/app/services/theme.service';
import { Logger } from 'src/app/services/logger';
import { PopupProvider } from 'src/app/services/popup';
import { ScannerCode, ScannerHelper } from 'src/app/services/scanner_helper.service';
import { IonRefresher } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { UtilService } from 'src/app/services/utilService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import SparkMD5 from 'spark-md5';
const TAG: string = 'SubscriptionsPage';
@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
})
export class SubscriptionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: true }) ionRefresher: IonRefresher;
  public followingList: any = [];
  public isShowUnfollow: boolean = false;
  public isShowQrcode: boolean = false;
  public isShowTitle: boolean = false;
  public isShowInfo: boolean = false;
  public isPreferences: boolean = false;
  public shareDestDid: string = '';
  public shareChannelId: string = '';
  public curItem: any = {};
  public qrCodeString: string = null;
  public channelName: string = null;
  public hideSharMenuComponent: boolean = false;
  private followingIsLoadimage: any = {};
  public isSearch: string = '';
  public scanServiceStyle = { right: '' };
  public subscriptionV3NumMap: any = {};
  private isLoadSubscriptionV3Num: any = {};
  public followAvatarMap: any = {};
  public isBorderGradient: boolean = false;
  private searchFollowingList: any = [];
  private refreshFollowingImageSid: any = null;
  private follingObserver: any = {};
  public userDid: string = "";
  public isLoading: boolean = true;
  public pageSize = 1;
  public pageNumber = 10;
  public totalSubscribedChannelList: any = [];
  public totalNum: number = 0;
  public channelPublicStatusList: any = {};
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    private events: Events,
    private feedService: FeedService,
    private zone: NgZone,
    private native: NativeService,
    private intentService: IntentService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private popupProvider: PopupProvider,
    private keyboard: Keyboard,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    public theme: ThemeService
  ) { }

  ngOnInit() {
    //this.scanServiceStyle['right'] = (screen.width * 7.5) / 100 + 5 + 'px';
  }

  ionViewWillEnter() {
    this.initTitle();
    this.addEvents();
    this.initFollowing();
  }

  addEvents() {

  }

  removeEvents() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfilePage.following'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  ionViewWillLeave() {
    this.clearRefreshFollowingImageSid();
    this.followingIsLoadimage = {};
    this.hideSharMenuComponent = false;
    this.removeEvents();
    this.removeObserveList();
    this.native.handleTabsEvents();
  }

  async showMenuMore(item: any) {
    this.curItem = item;
    this.isShowTitle = true;
    let ownerDid = (await this.dataHelper.getSigninData()).did;
    if (ownerDid === item.destDid) {
      this.isShowInfo = true;
    } else {
      this.isShowInfo = false;
    }
    this.userDid = ownerDid;
    this.isShowQrcode = true;
    this.isPreferences = false;
    this.isShowUnfollow = true;
    this.channelName = item.channelName;
    this.qrCodeString = await this.getQrCodeString(item);
    this.hideSharMenuComponent = true;
  }

  async toPage(eventParm: any) {
    let destDid = eventParm['destDid'];
    let channelId = eventParm['channelId'];
    let page = eventParm['page'];

    try {
      await this.native.showLoading('common.waitMoment');
      this.native.hideLoading();
      this.native.getNavCtrl().navigateForward([page, destDid, channelId]);
    } catch (error) {
      this.native.hideLoading();
    }
  }


  async initFollowing() {
    try {
      this.pageSize = 1;
      this.totalSubscribedChannelList = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.OTHER_CHANNEL);
      let pageData = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalSubscribedChannelList);
      let subscribedChannel = pageData.items;
      this.totalNum = subscribedChannel.length;
      this.followingList = await this.getFollowedChannelList(subscribedChannel);
      this.searchFollowingList = _.cloneDeep(this.followingList);
      this.isLoading = false;
      this.refreshFollowingVisibleareaImageV2(this.followingList);
    } catch (error) {
      this.isLoading = false;
    }

  }

  async getFollowedChannelList(subscribedChannel: FeedsData.BackupSubscribedChannelV3[]) {
    let list = [];
    for (let item of subscribedChannel) {
      let destDid = item.destDid;
      let channelId = item.channelId;
      let channel: any = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;

      if (channel != null) {
        list.push(channel);
      }
    }

    list = _.sortBy(list, (item: any) => {
      return -item.createdAt;
    });
    return list;
  }

  async doRefresh(event: any) {
    try {
      let subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
      let promiseList: Promise<any>[] = [];
      for (let index = 0; index < subscribedChannels.length; index++) {
        const subscribedChannel = subscribedChannels[index];
        const querySubscriptionPromise = this.hiveVaultController.querySubscriptionChannelById(subscribedChannel.destDid, subscribedChannel.channelId).then(() => { }).catch(() => { });
        promiseList.push(querySubscriptionPromise);
      }

      const syncSCPromise = this.hiveVaultController.syncSubscribedChannelFromBackup().then(() => { }).catch(() => { });
      promiseList.push(syncSCPromise);

      const syncChannelInfoPromise = this.hiveVaultController.syncAllChannelInfo().then(() => { }).catch(() => { });
      promiseList.push(syncChannelInfoPromise);

      await Promise.allSettled(promiseList)

      this.removeObserveList();
      this.isLoadSubscriptionV3Num = {};
      this.dataHelper.setChannelPublicStatusList({});
      this.totalNum = 0;
      this.initFollowing();
      event.target.complete();
    } catch (err) {
      event.target.complete();
    }
  }

  async getQrCodeString(channel: any) {
    let destDid = channel['destDid'];
    this.shareDestDid = destDid;
    let channelId = channel['channelId'] || '';
    this.shareChannelId = channelId;
    return UtilService.generateFeedsQrCodeString(destDid, channelId);
  }

  async hideShareMenu(objParm: any) {
    let buttonType = objParm['buttonType'];
    let destDid = objParm['destDid'];
    let channelId = objParm['channelId'];
    switch (buttonType) {
      case 'unfollow':
        let connect = this.dataHelper.getNetworkStatus();
        if (connect === FeedsData.ConnState.disconnected) {
          this.native.toastWarn('common.connectionError');
          return;
        }

        await this.native.showLoading("common.waitMoment");
        try {
          this.hiveVaultController.unSubscribeChannel(
            destDid, channelId
          ).then(async (result) => {

            let newfollowingList = _.filter(this.followingList, (item) => {
              return item.channelId != channelId;
            });
            this.followingList = _.cloneDeep(newfollowingList);
            this.searchFollowingList = _.cloneDeep(newfollowingList);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          });
        } catch (err) {
          this.native.hideLoading();
        }

        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
      case 'share':
        let content = this.getQrCodeString(this.curItem);
        this.hideSharMenuComponent = false;
        //share channel
        await this.native.showLoading("common.generateSharingLink");
        try {
          let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
          const sharedLink = await this.intentService.createChannelShareLink(channel);
          this.intentService.share(this.intentService.createShareChannelTitle(destDid, channelId, channel), sharedLink);
        } catch (error) {
        }
        this.native.hideLoading();
        break;
      case 'info':
        this.clickAvatar(destDid, channelId);
        break;
      case 'preferences':
        let connectStatus = this.dataHelper.getNetworkStatus();
        if (connectStatus === FeedsData.ConnState.disconnected) {
          this.native.toastWarn('common.connectionError');
          return;
        }

        this.native.navigateForward(['feedspreferences'], {
          queryParams: {
            nodeId: this.shareDestDid,
            feedId: this.shareChannelId,
          },
        });
        this.hideSharMenuComponent = false;
        break;
      case 'cancel':
        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
    }
    let sharemenu: HTMLElement = document.querySelector("app-sharemenu") || null;
    if (sharemenu != null) {
      sharemenu.remove();
    }
  }

  async clickAvatar(destDid: string, channelId: string) {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId);
    let followStatus = this.checkFollowStatus(destDid, channelId);
    let channelName = channel.displayName || channel.name;
    let channelDesc = channel.intro;
    let channelSubscribes = 0;
    let feedAvatar = this.feedService.parseChannelAvatar(channel.avatar);
    if (feedAvatar.indexOf('data:image') > -1 ||
      feedAvatar.startsWith("https:")) {
      this.dataHelper.setSelsectIndex(0);
      this.dataHelper.setProfileIamge(feedAvatar);
    } else if (feedAvatar.indexOf('assets/images') > -1) {
      let index = feedAvatar.substring(
        feedAvatar.length - 5,
        feedAvatar.length - 4,
      );
      this.dataHelper.setSelsectIndex(index);
      this.dataHelper.setProfileIamge(feedAvatar);
    }
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    this.dataHelper.setChannelInfo({
      destDid: destDid,
      channelId: channelId,
      name: channelName,
      des: channelDesc,
      followStatus: followStatus,
      channelSubscribes: channelSubscribes,
      updatedTime: channel.updatedAt,
      channelOwner: channel.destDid,
      ownerDid: ownerDid,
      tippingAddress: channel.tipping_address,
      displayName: channel.displayName
    });
    this.native.navigateForward(['/feedinfo'], '');
  }

  async checkFollowStatus(destDid: string, channelId: string) {
    return this.dataHelper.checkSubscribedStatus(destDid, channelId);
  }

  ionScroll() {
    //this.setFollowingVisibleareaImageV2();
  }

  async handleFollingAvatarV2(destDid: string, channelId: string) {
    let id = destDid + "-" + channelId;
    let isload = this.followingIsLoadimage[id] || '';
    if (isload === "") {
      let arr = id.split("-");
      this.followingIsLoadimage[id] = '11';
      let destDid = arr[0];
      let channelId = arr[1];
      let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      let avatarUri = "";
      if (channel != null) {
        avatarUri = channel.avatar;
      }
      let followAvatar = this.followAvatarMap[id] || '';
      if (followAvatar === '') {
        this.followAvatarMap[id] = './assets/images/loading.svg';
      }
      let fileName: string = avatarUri.split("@")[0];
      this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
        this.zone.run(() => {
          let srcData = data || "";
          if (srcData != "") {
            this.followingIsLoadimage[id] = '13';
            this.followAvatarMap[id] = srcData;
          } else {
            if (this.followAvatarMap[id] === './assets/images/loading.svg') {
              this.followAvatarMap[id] = './assets/images/profile-0.svg';
            }
            this.followingIsLoadimage[id] = '13';
          }
        });
      }).catch((err) => {
        if (this.followAvatarMap[id] === './assets/images/loading.svg') {
          this.followAvatarMap[id] = './assets/images/profile-0.svg';
        }
      });
    }
  }

  refreshFollowingVisibleareaImageV2(list = []) {
    if (this.refreshFollowingImageSid != null) {
      return;
    }
    this.refreshFollowingImageSid = requestAnimationFrame(() => {
      this.followingIsLoadimage = {};
      this.getFollingObserverList(list);
      this.clearRefreshFollowingImageSid();
    });
  }

  clearRefreshFollowingImageSid() {
    if (this.refreshFollowingImageSid != null) {
      cancelAnimationFrame(this.refreshFollowingImageSid);
      this.refreshFollowingImageSid = null;
    }
  }

  async scanService() {
    let scanObj = await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
    let scannedContent = scanData["scannedText"] || "";
    if (scannedContent === "") {
      return;
    }
    Logger.log(TAG, 'Scan content is', scannedContent);
    const scanResult = ScannerHelper.parseScannerResult(scannedContent);
    Logger.log(TAG, 'Parse scan result is', scanResult);

    if (!scanResult || !scanResult.feedsUrl || scanResult.code == ScannerCode.INVALID_FORMAT) {
      this.native.toastWarn('AddServerPage.tipMsg');
      return;
    }
    const feedsUrl = scanResult.feedsUrl;

    await this.native.showLoading("common.waitMoment");
    try {
      const channel = await this.hiveVaultController.getChannelInfoById(feedsUrl.destDid, feedsUrl.channelId);
      if (!channel) {
        await this.hiveVaultController.getChannelInfoById(feedsUrl.destDid, feedsUrl.channelId);
      }
      this.native.hideLoading();
      this.native.navigateForward(['/channels', feedsUrl.destDid, feedsUrl.channelId], '');
      this.hiveVaultController.checkSubscriptionStatusFromRemote(feedsUrl.destDid, feedsUrl.channelId);
    } catch (error) {
      this.native.hideLoading();
      this.native.toastWarn("common.subscribeFail");
    }
  }

  ionClear() {
    this.isSearch = '';
    if (this.isSearch == '') {
      this.ionRefresher.disabled = false;
      this.followingList = _.cloneDeep(this.searchFollowingList);
      return;
    }
    this.ionRefresher.disabled = true;
    this.handleSearch();
  }

  getItems(events: any) {
    this.isSearch = events.target.value || '';
    if (
      (events && events.keyCode === 13) ||
      (events.keyCode === 8 && this.isSearch === '')
    ) {
      this.keyboard.hide();
      if (this.isSearch == '') {
        this.ionRefresher.disabled = false;
        this.followingList = _.cloneDeep(this.searchFollowingList);
        return;
      }
      this.ionRefresher.disabled = true;
      this.handleSearch();
    }
  }

  exploreFeeds() {
    this.feedService.setCurTab("search");
    this.native.setRootRouter(['/tabs/search']);
  }

  handleSearch() {
    if (this.isSearch === '') {
      return;
    }

    this.followingList = _.filter(this.searchFollowingList, (item) => {
      return item.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1
    });
  }

  ionBlur() {
    this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
  }

  removeFollingObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.follingObserver[postGridId] = null;
      }
    }
  }

  getFollingObserverList(follingList = []) {

    for (let index = 0; index < follingList.length; index++) {
      let postItem = follingList[index] || null;
      if (postItem === null) {
        return;
      }
      let postGridId = postItem.destDid + "-" + postItem.channelId + '-subscriptions';
      let exit = this.follingObserver[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.newFollingObserver(postGridId);
    }
  }

  newFollingObserver(postGridId: string) {
    let observer = this.follingObserver[postGridId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      this.follingObserver[postGridId] = new IntersectionObserver(async (changes: any) => {
        let container = changes[0].target;
        let newId = container.getAttribute("id");

        let intersectionRatio = changes[0].intersectionRatio;

        if (intersectionRatio === 0) {
          //console.log("======newId leave========", newId);
          return;
        }
        let arr = newId.split("-");
        let destDid: string = arr[0];
        let channelId: string = arr[1];
        this.handleFollingAvatarV2(destDid, channelId);
        this.getChannelFollower(destDid, channelId);
        try {
          this.getChannelPublicStatus(destDid, channelId);
        } catch (error) {

        }
      });

      this.follingObserver[postGridId].observe(item);
    }
  }

  getChannelFollower(destDid: string, channelId: string) {
    //关注数
    let follower = this.isLoadSubscriptionV3Num[channelId] || '';
    if (follower === "") {
      try {
        let subscriptionV3Num = this.subscriptionV3NumMap[channelId] || "";
        if (subscriptionV3Num === "") {
          this.subscriptionV3NumMap[channelId] = "...";
        }
        this.dataHelper.getDistinctSubscriptionV3NumByChannelId(
          destDid, channelId).
          then((result) => {
            result = result || 0;
            if (result == 0) {
              this.hiveVaultController.querySubscriptionChannelById(destDid, channelId).then(() => {
                this.zone.run(async () => {
                  this.subscriptionV3NumMap[channelId] = await this.dataHelper.getDistinctSubscriptionV3NumByChannelId(destDid, channelId);
                });
              })
            }
            this.subscriptionV3NumMap[channelId] = result;

          }).catch(() => {
            this.subscriptionV3NumMap[channelId] = 0;
          });
      } catch (error) {
      }
    }
  }

  removeObserveList() {
    for (let postGridId in this.follingObserver) {
      let observer = this.follingObserver[postGridId] || null;
      this.removeFollingObserver(postGridId, observer)
    }
    this.follingObserver = {};
  }

  loadData(event: any) {
    let sId = setTimeout(async () => {
      if (this.totalNum === this.totalSubscribedChannelList.length) {
        event.target.complete();
        clearTimeout(sId);
        return;
      }
      this.pageSize++;
      let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalSubscribedChannelList);
      let subscribedChannel = data.items;
      this.totalNum = this.totalNum + subscribedChannel.length;
      let newLoadedList = await this.getFollowedChannelList(subscribedChannel);
      this.followingList = this.followingList.concat(newLoadedList);
      this.refreshFollowingVisibleareaImageV2(newLoadedList);
      event.target.complete();
      clearTimeout(sId);
    }, 500);
  }

  getChannelPublicStatus(destDid: string, channelId: string) {
    this.channelPublicStatusList = this.dataHelper.getChannelPublicStatusList();
    let key = destDid + '-' + channelId;
    let channelPublicStatus = this.channelPublicStatusList[key] || '';
    if (channelPublicStatus === '') {
      this.getChannelInfo(channelId).then((channelInfo) => {
        if (channelInfo != null) {
          this.channelPublicStatusList[key] = "2";//已公开
          this.dataHelper.setChannelPublicStatusList(this.channelPublicStatusList);
          //add channel contract cache
          this.addChannelNftCache(channelInfo, channelId);

        } else {
          this.channelPublicStatusList[key] = "1";//未公开
          this.dataHelper.setChannelPublicStatusList(this.channelPublicStatusList);
          //add channel contract cache
          this.addChannelNftCache(null, channelId);
        }
      }).catch((err) => {

      });

    }
  }

  async addChannelNftCache(channelInfo: any, channelId: string) {
    if (channelInfo === null) {
      let channelContractInfoList = this.dataHelper.getChannelContractInfoList() || {};
      channelContractInfoList[channelId] = "unPublic";
      this.dataHelper.setChannelContractInfoList(channelContractInfoList);
      this.dataHelper.saveData("feeds.contractInfo.list", channelContractInfoList);
      return;
    }
    let channelNft: FeedsData.ChannelContractInfo = {
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
    channelNft.tokenId = channelInfo[0];
    channelNft.tokenUri = channelInfo[1];
    channelNft.channelEntry = channelInfo[2];
    channelNft.receiptAddr = channelInfo[3];
    channelNft.ownerAddr = channelInfo[4];
    let uri = channelInfo[1].replace('feeds:json:', '');
    let result: any = await this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + uri);
    channelNft.description = result.description;
    channelNft.cname = result.data.cname;
    channelNft.signature = result.data.signature;
    let avatarUri = result.data.avatar.replace('feeds:image:', '');
    let avatar = await UtilService.downloadFileFromUrl(this.ipfsService.getNFTGetUrl() + avatarUri);
    let avatarBase64 = await UtilService.blobToDataURL(avatar);
    let hash = SparkMD5.hash(avatarBase64);
    channelNft.avatar = hash;
    let channelContractInfoList = this.dataHelper.getChannelContractInfoList() || {};
    channelContractInfoList[channelId] = channelNft;
    this.dataHelper.setChannelContractInfoList(channelContractInfoList);
    this.dataHelper.saveData("feeds.contractInfo.list", channelContractInfoList);
  }

  async getChannelInfo(channelId: string) {

    try {
      let tokenId: string = "0x" + channelId;
      Logger.log(TAG, "tokenId:", tokenId);
      tokenId = UtilService.hex2dec(tokenId);
      Logger.log(TAG, "tokenIdHex2dec:", tokenId);
      let tokenInfo = await this.nftContractControllerService.getChannel().channelInfo(tokenId);
      Logger.log(TAG, "tokenInfo:", tokenInfo);
      if (tokenInfo[0] != '0') {
        return tokenInfo;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

}
