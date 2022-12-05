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
import { ActivatedRoute, Router } from '@angular/router';
const TAG: string = 'SubscriptionsPage';
@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
})
export class SubscriptionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: true }) ionRefresher: IonRefresher;
  private isLoadSubscriptionV3Num: any = {};
  public isBorderGradient: boolean = false;

  //For inner logic
  private currentPageIndex: number = 1;
  private pageStep: number = 10;
  private itemObserver: { [key: string]: IntersectionObserver } = {};//key =>  targetDid + "-" + channelId + '-' + pageType;
  private totalChannelList: FeedsData.ChannelV3[] = [];
  private searchedChannelList: FeedsData.ChannelV3[] = [];
  public loadedChannelList: FeedsData.ChannelV3[] = [];

  private followingIsLoadimage: any = {};
  private refreshFollowingImageSid: any = null;

  //For UI - list item
  public channelAvatarMap: { [key: string]: string } = {};//key => targetDid + "-" + channelId;
  public subscriberNumberMap: { [channelId: string]: number } = {};
  public pageType: string = '';
  public userDid: string = '';
  public isLoading: boolean = true;

  //For UI - menu
  public channelName: string = null;
  public isSubscribed: boolean = false;
  public isShowQrcode: boolean = false;
  public isShowTitle: boolean = false;
  public isShowInfo: boolean = false;
  public isPreferences: boolean = false;
  public curItem: any = {};
  public qrCodeString: string = null;
  public isHideShareMenuComponent: boolean = false;

  //For UI - other setting
  public scanServiceStyle = { right: '' };
  public subscriptionV3NumMap: any = {};
  public followAvatarMap: any = {};
  private searchFollowingList: any = [];
  private follingObserver: any = {};
  public pageSize = 1;
  public pageNumber = 10;
  public totalSubscribedChannelList: any = [];
  public totalNum: number = 0;
  public channelPublicStatusList: any = {};
  public shareDestDid: string = '';
  public shareChannelId: string = '';

  //For UI - search ?
  public isSearch: string = '';

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
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public theme: ThemeService
  ) { }

  ngOnInit() {
    //this.scanServiceStyle['right'] = (screen.width * 7.5) / 100 + 5 + 'px';
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.userDid = params.userDid;
      this.pageType = params.pageType;
    });
  }

  ionViewWillEnter() {
    this.initTitle();
    this.addEvents();
    let url: string = this.router.url;
    this.pageType = url.replace("/", '');
    this.initData().then((data) => {
    }).catch((error) => {
    }).finally(() => {
      this.isLoading = false;
    });
  }

  addEvents() {
  }

  removeEvents() {
  }

  initTitle() {
    this.titleBarService.setTitle(this.titleBar, this.translate.instant('ProfilePage.following'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  ionViewWillLeave() {
    this.clearRefreshFollowingImageSid();
    this.followingIsLoadimage = {};
    this.isHideShareMenuComponent = false;
    this.removeEvents();
    this.removeObserveList();
    this.native.handleTabsEvents();
  }

  async showMenuMore(item: any) {
    this.curItem = item;
    this.isShowTitle = true;
    if (this.userDid === item.destDid) {
      this.isShowInfo = true;
    } else {
      this.isShowInfo = false;
    }
    this.isShowQrcode = true;
    this.isPreferences = false;
    this.isSubscribed = true;
    this.channelName = item.channelName;
    this.qrCodeString = await this.getQrCodeString(item);
    this.isHideShareMenuComponent = true;
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

  async initChannelListUI(channelList: FeedsData.ChannelV3[]) {
    this.currentPageIndex = 1;
    this.totalChannelList = channelList;
    const pageData = this.pagingData();
    this.loadedChannelList = pageData;

    this.refreshFollowingVisibleareaImageV2(pageData);
  }

  pagingData(): FeedsData.ChannelV3[] {
    const pageData = UtilService.getPageData(this.currentPageIndex, this.pageStep, this.totalChannelList);//TOBE CHECK
    return pageData.items;
  }

  async doRefresh(event: any) {
    try {
      this.dataHelper.setChannelPublicStatusList({});
      this.initData();
      event.target.complete();
    } catch (err) {
      event.target.complete();
    }
  }

  initData(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.hiveVaultController.getChannelListFromOwner(this.userDid, FeedsData.SubscribedChannelType.OTHER_CHANNEL, (localChannelList: FeedsData.ChannelV3[]) => {
      }).then((channelList: FeedsData.ChannelV3[]) => {
        this.initUIData(channelList);
        resolve();
      }).catch((error) => {
        reject(error);
      });
    })
  }

  initUIData(channelList: FeedsData.ChannelV3[]) {
    this.removeObserveList();
    this.isLoadSubscriptionV3Num = {};
    this.initChannelListUI(channelList);
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

            let newfollowingList = _.filter(this.loadedChannelList, (item) => {
              return item.channelId != channelId;
            });
            this.loadedChannelList = _.cloneDeep(newfollowingList);
            this.searchedChannelList = _.cloneDeep(newfollowingList);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          });
        } catch (err) {
          this.native.hideLoading();
        }

        this.qrCodeString = null;
        this.isHideShareMenuComponent = false;
        break;
      case 'share':
        let content = this.getQrCodeString(this.curItem);
        this.isHideShareMenuComponent = false;
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
        this.isHideShareMenuComponent = false;
        break;
      case 'cancel':
        this.qrCodeString = null;
        this.isHideShareMenuComponent = false;
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
  }

  async handleChannelAvatar(destDid: string, channelId: string) {
    let id = destDid + "-" + channelId;
    let isload = this.followingIsLoadimage[id] || '';
    if (isload === "") {
      let arr = id.split("-");
      this.followingIsLoadimage[id] = '11';
      let destDid = arr[0];
      let channelId = arr[1];
      let followAvatar = this.channelAvatarMap[id] || '';
      if (followAvatar === '') {
        this.channelAvatarMap[id] = './assets/images/loading.svg';
      }
      let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      let avatarUri = "";
      if (channel != null) {
        avatarUri = channel.avatar;
      }else {
        this.channelAvatarMap[id] = './assets/images/profile-0.svg';
      }
      let fileName: string = avatarUri.split("@")[0];
      this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
        this.zone.run(() => {
          let srcData = data || "";
          if (srcData != "") {
            this.followingIsLoadimage[id] = '13';
            this.channelAvatarMap[id] = srcData;
          } else {
            if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
              this.channelAvatarMap[id] = './assets/images/profile-0.svg';
            }
            this.followingIsLoadimage[id] = '13';
          }
        });
      }).catch((err) => {
        if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
          this.channelAvatarMap[id] = './assets/images/profile-0.svg';
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
      this.getItemObserverList(list);
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
      const channel = await this.hiveVaultController.getChannelV3ByIdFromRemote(feedsUrl.destDid, feedsUrl.channelId);
      if (!channel) {
        await this.hiveVaultController.getChannelV3ByIdFromRemote(feedsUrl.destDid, feedsUrl.channelId);
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
      this.loadedChannelList = _.cloneDeep(this.searchedChannelList);
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
        this.loadedChannelList = _.cloneDeep(this.searchedChannelList);
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

    this.loadedChannelList = _.filter(this.searchedChannelList, (item) => {
      return item.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1
    });
  }

  ionBlur() {
    this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
  }

  removeItemObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.itemObserver[postGridId] = null;
      }
    }
  }

  getItemObserverList(channelList: FeedsData.ChannelV3[] = []) {
    for (let index = 0; index < channelList.length; index++) {
      let postItem = channelList[index] || null;
      if (postItem === null) {
        return;
      }
      let postGridId = postItem.destDid + "-" + postItem.channelId + '-' + this.pageType;
      let exit = this.itemObserver[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.initItemObserver(postGridId);
    }
  }

  initItemObserver(postGridId: string) {
    let observer = this.itemObserver[postGridId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if (item != null && !this.itemObserver[postGridId]) {
      this.itemObserver[postGridId] = new IntersectionObserver(async (changes: any) => {
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
        this.handleChannelAvatar(destDid, channelId);
        this.initSubscriberNumData(destDid, channelId);
        try {
          this.getChannelPublicStatus(destDid, channelId);
        } catch (error) {

        }
      });

      this.itemObserver[postGridId].observe(item);
    }
  }

  initSubscriberNumData(destDid: string, channelId: string) {
    //关注数
    let follower = this.isLoadSubscriptionV3Num[channelId] || '';
    if (follower === "") {
      try {
        //TODO TOBE improve
        this.subscriberNumberMap[channelId] = 0;
        this.dataHelper.getDistinctSubscriptionV3NumByChannelId(destDid, channelId).then((result) => {
          result = result || 0;
          if (result == 0) {
            this.hiveVaultController.querySubscriptionChannelById(destDid, channelId).then(() => {
              this.zone.run(async () => {
                this.subscriberNumberMap[channelId] = await this.dataHelper.getDistinctSubscriptionV3NumByChannelId(destDid, channelId);
              });
            })
          }
          this.subscriberNumberMap[channelId] = result;
        }).catch(() => {
          this.subscriberNumberMap[channelId] = 0;
        });
      } catch (error) {
      }
    }
  }

  removeObserveList() {
    for (let postGridId in this.itemObserver) {
      let observer = this.itemObserver[postGridId] || null;
      this.removeItemObserver(postGridId, observer)
    }
    this.itemObserver = {};
  }

  loadData(event: any) {
    let sId = setTimeout(async () => {
      if (this.loadedChannelList.length === this.totalChannelList.length) {//currentChannelNum totalNum
        event.target.complete();
        clearTimeout(sId);
        return;
      }
      this.currentPageIndex++;

      const newLoadedList = this.pagingData();
      this.loadedChannelList = this.loadedChannelList.concat(newLoadedList);
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
