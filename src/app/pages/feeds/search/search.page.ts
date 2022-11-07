import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FeedService } from '../../../services/FeedService';
import { PopoverController, IonRefresher, IonSearchbar, IonInfiniteScroll } from '@ionic/angular';
import { NativeService } from '../../../services/NativeService';
import { ThemeService } from '../../../services/theme.service';
import { UtilService } from '../../../services/utilService';
import { PopupProvider } from '../../../services/popup';
import { HttpService } from '../../../services/HttpService';
import { StorageService } from '../../../services/StorageService';
import { IntentService } from '../../../services/IntentService';
import { Events } from 'src/app/services/events.service';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { ScannerCode, ScannerHelper } from 'src/app/services/scanner_helper.service';
import { Logger } from 'src/app/services/logger';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { MenuService } from 'src/app/services/MenuService';

const TAG: string = 'SearchPage';
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})

export class SearchPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: true }) ionRefresher: IonRefresher;
  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;
  @ViewChild('searchbar', { static: false }) searchbar: IonSearchbar;

  public popover: any = '';
  public curAddingItem = {};
  public addingChanneList = [];
  public searchAddingChanneList = [];
  public isSearch: string = '';
  public searchfeedsList = [];
  public discoverSquareList = [];
  public pageNum: number = 1;
  public isLoading: boolean = true;
  public developerMode: boolean = false;
  public searchSquareList = [];
  public followedList = [];
  public httpAllData = [];
  public unfollowedFeed = [];
  public searchUnfollowedFeed = [];
  public scanServiceStyle = { right: '' };
  public curtotalNum: number = 0;
  private clientHeight: number = 0;
  public channelCollectionPageList: any = [];
  public searchChannelCollectionPageList: any = [];//搜索使用
  private confirmdialog = null;
  public isBorderGradient: boolean = false;
  public channelAvatarMap: any = {};
  public subscriptionV3NumMap: any = {};
  private searchObserver: any = {};
  private searchIsLoadimage: any = {};
  private chanCollectionSid: any = null;
  private handleDisplayNameMap: any = {};
  private displayNameIsLoadMap: any = {};
  public subscribedChannelMap: any = {};
  private totalNum: number = 0;
  private startIndex: number = 0;
  private endIndex: number = 0;
  private pageSize: number = 9;
  constructor(
    private nftContractControllerService: NFTContractControllerService,
    private feedService: FeedService,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    public theme: ThemeService,
    private popoverController: PopoverController,
    private popupProvider: PopupProvider,
    private httpService: HttpService,
    private intentService: IntentService,
    public storageService: StorageService,
    private translate: TranslateService,
    private viewHelper: ViewHelper,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService,
    private hiveVaultController: HiveVaultController,
    private keyboard: Keyboard,
    private menuService: MenuService,
  ) { }

  ngOnInit() {
    let maxPageSize = (screen.height - 92) / 70;
    let pageSizeInt = parseInt((maxPageSize).toString());
    if (maxPageSize > pageSizeInt) {
      this.pageSize = pageSizeInt + 1;
    } else {
      this.pageSize = pageSizeInt;
    }
  }

  initTile() {
    let title = this.translate.instant('FeedsPage.tabTitle4');
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  initSubscribe() {
    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTile();
    });

    this.events.subscribe(
      FeedsEvent.PublishType.unsubscribeFinish,
      (result: { destDid: string, channelId: string }) => {
        this.zone.run(() => {
          let channelId = result.channelId;
          this.subscribedChannelMap[channelId] = undefined;
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.subscribeFinish,
      (subscribeFinishData: FeedsEvent.SubscribeFinishData) => {
        this.zone.run(() => {
        });
      },
    );

  }

  removeSubscribe() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = '';
    }
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
  }

  ionViewWillEnter() {
    this.clientHeight = screen.availHeight;
    this.isLoading = true;
    this.events.subscribe(FeedsEvent.PublishType.search, () => {
      this.initTile();
      this.removeObserveList();
      this.init();
    });
    this.initTile();
    this.init();
  }

  initTitleBar() {
    let title = this.translate.instant('SearchPage.title');
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  async filterChannelCollectionPageList(channelCollectionPageList = []) {
    let channelList = [];
    //let subscribedChannel = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    for (let index = 0; index < channelCollectionPageList.length; index++) {
      let channel: FeedsData.ChannelV3 = channelCollectionPageList[index];
      // let channelIndex = _.findIndex(subscribedChannel, (item) => {
      //   return item.destDid === channel.destDid && item.channelId === channel.channelId;
      // });
      // if (channelIndex > -1) {
      //   continue;
      // }
      channelList.push(channel);
    }

    return channelList;
  }

  async init() {
    try {
      let subscribedChannel = await this.dataHelper.getSelfSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
      this.subscribedChannelMap = _.keyBy(subscribedChannel, (item: FeedsData.ChannelV3) => {
        return item.channelId;
      });
    } catch (error) {

    }
    let channelCollectionPageList = this.dataHelper.getChannelCollectionPageList() || [];
    if (channelCollectionPageList.length === 0) {
      try {
        this.totalNum = await this.nftContractControllerService.getChannel().totalSupply();
      } catch (error) {

      }
      this.handleRefresherInfinite(true);
      try {
        this.channelCollectionPageList = await this.getChannelsV2();
        this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
        this.dataHelper.setChannelCollectionPageList(this.channelCollectionPageList);
        this.handleRefresherInfinite(false);
      } catch (error) {
        this.handleRefresherInfinite(false);
      }
    } else {
      this.handleRefresherInfinite(true);
      try {
        this.channelCollectionPageList = await this.filterChannelCollectionPageList(channelCollectionPageList);
        this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
        this.isLoading = false;
        this.handleRefresherInfinite(false);
        this.dataHelper.setChannelCollectionPageList(this.channelCollectionPageList);
      } catch (error) {
        this.handleRefresherInfinite(false);
      }
    }
    this.refreshChannelCollectionAvatar(this.channelCollectionPageList);
    this.initSubscribe();
  }

  ionViewWillLeave() {
    this.removeObserveList();
    this.removeSubscribe();
    this.displayNameIsLoadMap = {};
    this.searchIsLoadimage = {};
    this.events.unsubscribe(FeedsEvent.PublishType.search);
    try {
      this.ionRefresher.complete();
    } catch (error) {

    }
    try {
      this.infiniteScroll.complete();
    } catch (error) {

    }
  }

  async subscribe(destDid: string, channelId: string, event: any) {
    event.stopPropagation();
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    await this.native.showLoading('common.waitMoment');
    try {
      await this.hiveVaultController.subscribeChannel(destDid, channelId);
      await this.hiveVaultController.syncPostFromChannel(destDid, channelId);
      await this.hiveVaultController.syncCommentFromChannel(destDid, channelId);
      await this.hiveVaultController.syncLikeDataFromChannel(destDid, channelId);

      let channelIndex = _.findIndex(this.channelCollectionPageList, (item: FeedsData.ChannelV3) => {
        return item.channelId === channelId && item.destDid === destDid;
      });

      if (channelIndex > -1) {
        this.subscribedChannelMap[channelId] = this.channelCollectionPageList[channelIndex];
      }
      this.native.hideLoading();
    } catch (error) {
      this.native.hideLoading();
    }

    //TODO
    // this.hiveVaultController.subscribeChannel();
  }

  getItems(events: any) {
    this.isSearch = events.target.value || '';
    this.scanServiceStyle['z-index'] = -1;
    if (
      (events && events.keyCode === 13) ||
      (events.keyCode === 8 && this.isSearch === '')
    ) {
      this.keyboard.hide();
      if (this.isSearch == '') {
        this.scanServiceStyle['z-index'] = 3;
        this.ionRefresher.disabled = false;
        this.channelCollectionPageList = _.cloneDeep(this.searchChannelCollectionPageList);
        return;
      }
      this.ionRefresher.disabled = true;
      this.handleSearch();
    }
  }

  ionClear() {
    this.scanServiceStyle['z-index'] = 3;
    this.isSearch = '';
    if (this.isSearch == '') {
      this.ionRefresher.disabled = false;
      this.channelCollectionPageList = _.cloneDeep(this.searchChannelCollectionPageList);
      if (this.channelCollectionPageList.length > 0) {
        this.refreshChannelCollectionAvatar(this.channelCollectionPageList);
      }
      return;
    }
    this.ionRefresher.disabled = true;
    this.handleSearch();
  }
  handleSearch() {
    if (this.isSearch === '') {
      return;
    }

    this.channelCollectionPageList = this.searchChannelCollectionPageList.filter(
      (channel: FeedsData.ChannelV3) => {
        let channelName = channel.displayName || channel.name || '';
        if (channelName != '') {
          return channelName.toLocaleLowerCase().indexOf(this.isSearch.toLocaleLowerCase()) > -1;
        }
      }
    );
    if (this.channelCollectionPageList.length > 0) {
      this.removeObserveList();
      this.refreshChannelCollectionAvatar(this.channelCollectionPageList);
    }

  }

  async doRefresh(event) {
    try {
      this.totalNum = await this.nftContractControllerService.getChannel().totalSupply();
      this.channelCollectionPageList = await this.getChannelsV2(event);
      this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
      this.dataHelper.setChannelCollectionPageList(this.channelCollectionPageList);
      this.removeObserveList();
      this.refreshChannelCollectionAvatar(this.channelCollectionPageList);
    } catch (error) {
      event.target.complete();
    }
  }

  navTo(destDid: string, channelId: string) {
    this.removeSubscribe();
    this.native.navigateForward(['/channels', destDid, channelId], '');
  }

  parseChannelAvatar(avatar: string): string {
    return this.feedService.parseChannelAvatar(avatar);
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  pressName(channelName: string) {
    let name = channelName || '';
    if (name != '' && name.length > 15) {
      this.viewHelper.createTip(name);
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
      this.native.navigateForward(['/channels', feedsUrl.destDid, feedsUrl.channelId], '');
      this.native.hideLoading();
      this.hiveVaultController.checkSubscriptionStatusFromRemote(feedsUrl.destDid, feedsUrl.channelId);
    } catch (error) {
      this.native.hideLoading();
      this.native.toastWarn("common.subscribeFail");
    }
  }

  checkFeedUrl(feedUrl: string): boolean {
    if (feedUrl == null || feedUrl == undefined || feedUrl == '') {
      return false;
    }
    if (
      feedUrl.length < 54 ||
      !feedUrl.startsWith('feeds://') ||
      !feedUrl.indexOf('did:elastos:')
    ) {
      return false;
    }

    let splitStr = feedUrl.split('/');
    if (splitStr.length != 5 || splitStr[4] == '') {
      return false;
    }
    return true;
  }

  addFeedUrl(result: string) {
    this.feedService.addFeed(result, '', 0, '', '', '').then(isSuccess => {
      if (isSuccess) {
        this.zone.run(() => {
          this.searchbar.value = '';
          this.isSearch = '';
          this.init();
        });
      }
    });
  }

  handleCache(addArr: any) {
    let discoverfeeds = this.dataHelper.getDiscoverfeeds() || [];
    _.each(addArr, (feed: any) => {
      if (this.isExitFeed(discoverfeeds, feed) === '') {
        discoverfeeds.push(feed);
      }
    });
    this.dataHelper.setDiscoverfeeds(discoverfeeds);
    this.storageService.set(
      'feed:discoverfeeds',
      JSON.stringify(discoverfeeds),
    );
  }

  isExitFeed(discoverfeeds: any, feed: any) {
    return _.find(discoverfeeds, feed) || '';
  }

  getChannelOwner(nodeId: string, channelId: string) {
    let channel = this.feedService.getChannelFromId(nodeId, channelId) || {};
    let ownerName: string = channel['owner_name'] || '';
    if (ownerName === '') {
      return 'common.obtain';
    }
    return '@' + ownerName;
  }

  getChannelDes(nodeId: string, channelId: string) {
    let channel = this.feedService.getChannelFromId(nodeId, channelId) || {};
    let channelDes: string = channel['introduction'] || '';
    if (channelDes === '') {
      return '';
    }
    return channelDes;
  }

  ionScroll() {
  }



  clickChannelCollection(channelCollections: any) {
    if (channelCollections.channelSource === 'hive') {
      this.native.navigateForward(['/channels', channelCollections.destDid, channelCollections.channelId], '');
      this.hiveVaultController.checkSubscriptionStatusFromRemote(channelCollections.destDid, channelCollections.channelId);
    }
  }

  subscribeChannelCollection(channelCollections: any) {
    this.native.navigateForward(['/channels', channelCollections.destDid, channelCollections.channelId], '');
    this.hiveVaultController.checkSubscriptionStatusFromRemote(channelCollections.destDid, channelCollections.channelId);
  }


  refreshChannelCollectionAvatar(list = []) {
    this.clearChanCollectionSid();
    this.chanCollectionSid = requestAnimationFrame(() => {
      this.searchIsLoadimage = {};
      this.displayNameIsLoadMap = {};
      this.getSearchObserverList(list);
      this.clearChanCollectionSid();
    });
  }

  clearChanCollectionSid() {
    if (this.chanCollectionSid != null) {
      cancelAnimationFrame(this.chanCollectionSid);
      this.chanCollectionSid = null;
    }
  }

  ionBlur() {
    this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
  }

  removeSearchObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.searchObserver[postGridId] = null;
      }
    }
  }

  getSearchObserverList(follingList = []) {

    for (let index = 0; index < follingList.length; index++) {
      let postItem = follingList[index] || null;
      if (postItem === null) {
        return;
      }
      let postGridId = postItem.destDid + "-" + postItem.channelId + "-" + postItem.channelSource + '-search';
      let exit = this.searchObserver[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.newSearchObserver(postGridId);
    }
  }

  newSearchObserver(postGridId: string) {
    let observer = this.searchObserver[postGridId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      this.searchObserver[postGridId] = new IntersectionObserver(async (changes: any) => {
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
        let channelSource: string = arr[2];
        this.getDisplayName(destDid, channelId, destDid);
        this.handleSearchAvatarV2(destDid, channelId, channelSource);
      });

      this.searchObserver[postGridId].observe(item);
    }
  }

  removeObserveList() {
    for (let postGridId in this.searchObserver) {
      let observer = this.searchObserver[postGridId] || null;
      this.removeSearchObserver(postGridId, observer)
    }
    this.searchObserver = {};
  }

  async handleSearchAvatarV2(destDid: string, channelId: string, channelSource: string) {
    let id = destDid + "-" + channelId;
    let isload = this.searchIsLoadimage[id] || '';
    if (isload === "") {
      let arr = id.split("-");
      this.searchIsLoadimage[id] = '11';
      let destDid = arr[0];
      let channelId = arr[1];
      if (channelSource === "ipfs") {
        let nenChannel = _.find(this.channelCollectionPageList, (item) => {
          return item.channelId === channelId;
        }) || null;
        if (nenChannel != null) {
          if (nenChannel.avatar === '') {
            this.channelAvatarMap[id] = './assets/images/profile-0.svg';
          } else {
            let channelAvatar = this.channelAvatarMap[id] || '';
            if (channelAvatar === '') {
              this.channelAvatarMap[id] = './assets/images/loading.svg';
            }
            let avatarUri = nenChannel.avatar.replace('feeds:image:', '');
            UtilService.downloadFileFromUrl(this.ipfsService.getNFTGetUrl() + avatarUri)
              .then(async (avatar) => {
                let srcData = avatar || "";
                this.zone.run(async () => {
                  if (srcData != "") {
                    if (avatar.type === "text/plain") {
                      if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
                        this.channelAvatarMap[id] = './assets/images/profile-0.svg'
                      }
                      this.searchIsLoadimage[id] = '13';
                    } else {
                      srcData = await UtilService.blobToDataURL(avatar);
                      this.channelAvatarMap[id] = srcData;
                    }
                  } else {
                    if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
                      this.channelAvatarMap[id] = './assets/images/profile-0.svg'
                    }
                    this.searchIsLoadimage[id] = '13';
                  }
                });
              }).catch(() => {
                if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
                  this.channelAvatarMap[id] = './assets/images/profile-0.svg'
                }
              });
          }

        } else {
          //if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
          this.channelAvatarMap[id] = './assets/images/profile-0.svg';
          //}
        }

      } else {
        let channelAvatar = this.channelAvatarMap[id] || '';
        if (channelAvatar === '') {
          this.channelAvatarMap[id] = './assets/images/loading.svg';
        }
        let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
        let avatarUri = "";
        if (channel != null) {
          avatarUri = channel.avatar;
          let fileName: string = avatarUri.split("@")[0];
          this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
            this.zone.run(() => {
              let srcData = data || "";
              if (srcData != "") {
                this.searchIsLoadimage[id] = '13';
                this.channelAvatarMap[id] = srcData;
              } else {
                if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
                  this.channelAvatarMap[id] === './assets/images/profile-0.svg';
                }
                this.searchIsLoadimage[id] = '13';
              }
            });
          }).catch((err) => {
            if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
              this.channelAvatarMap[id] === './assets/images/profile-0.svg';
            }
          });
        } else {
          if (this.channelAvatarMap[id] === './assets/images/loading.svg') {
            this.channelAvatarMap[id] === './assets/images/profile-0.svg';
          }
        }
      }
    }
  }

  getDisplayName(destDid: string, channelId: string, userDid: string) {
    let displayNameMap = this.displayNameIsLoadMap[userDid] || '';
    if (displayNameMap === "") {
      this.displayNameIsLoadMap[userDid] = "11";
      let text = destDid.replace('did:elastos:', '');
      this.handleDisplayNameMap[userDid] = UtilService.shortenDid(text);
      this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
        const name = userProfile.name || userProfile.resolvedName || userProfile.displayName
        if (name) {
          this.handleDisplayNameMap[userDid] = name;
        }
      }).catch(() => {
      });
      // try {
      //   this.hiveVaultController.getDisplayName(destDid, channelId, userDid).
      //     then((result: string) => {
      //       let name = result || "";
      //       if (name != "") {
      //         this.handleDisplayNameMap[userDid] = name;
      //       }
      //     }).catch(() => {
      //     });
      // } catch (error) {
      // }
    }
  }

  async getChannelsV2(event = null) {
    try {
      let channelCollectionPageList = [];
      if (this.totalNum <= this.pageSize) {
        this.endIndex = this.totalNum - 1;
        this.startIndex = 0;
      } else {
        this.endIndex = this.totalNum - 1;
        this.startIndex = this.totalNum - this.pageSize;
      }
      for (let channelIndex = this.endIndex; channelIndex >= this.startIndex; channelIndex--) {
        let channel = [];
        try {
          channel = await this.nftContractControllerService.getChannel().channelByIndex(channelIndex);
        } catch (error) {
          continue;
        }
        let channelEntry = channel[2];
        const scanResult = ScannerHelper.parseScannerResult(channelEntry);
        const feedsUrl = scanResult.feedsUrl;
        try {
          let channelInfo: any = await this.hiveVaultController.getChannelV3ByIdFromRemote(feedsUrl.destDid, feedsUrl.channelId) || null;
          if (channelInfo != null) {
            channelInfo.channelSource = "hive";
            channelCollectionPageList.push(channelInfo);
          } else {
            let newChannelInfo = {
              "destDid": feedsUrl.destDid,
              "channelId": feedsUrl.channelId,
              "name": "",
              "intro": "",
              "avatar": "",
              "type": "public",
              "tipping_address": "",
              "displayName": "",
              "channelSource": 'ipfs'
            }
            let tokenURI = channel[1];
            newChannelInfo.tipping_address = channel[3];
            let uri = tokenURI.replace('feeds:json:', '');
            try {
              let result: any = await this.ipfsService
                .nftGet(this.ipfsService.getNFTGetUrl() + uri);
              newChannelInfo.intro = result.description || '';
              newChannelInfo.displayName = result.data.cname || '';
              newChannelInfo.avatar = result.data.avatar || '';
            } catch (error) {
              newChannelInfo.intro = '';
              newChannelInfo.displayName = '';
              newChannelInfo.avatar = '';
            }
            channelCollectionPageList.push(newChannelInfo);
            if (this.startIndex > 0) {
              this.startIndex = this.startIndex - 1;
            }
          }
        } catch (error) {
          let newChannelInfo = {
            "destDid": feedsUrl.destDid,
            "channelId": feedsUrl.channelId,
            "name": "",
            "intro": "",
            "avatar": "",
            "type": "public",
            "tipping_address": "",
            "displayName": "",
            "channelSource": 'ipfs'
          }
          let tokenURI = channel[1];
          newChannelInfo.tipping_address = channel[3];
          let uri = tokenURI.replace('feeds:json:', '');
          try {
            let result: any = await this.ipfsService
              .nftGet(this.ipfsService.getNFTGetUrl() + uri);
            newChannelInfo.intro = result.description || '';
            newChannelInfo.displayName = result.data.cname || '';
            newChannelInfo.avatar = result.data.avatar || '';
          } catch (error) {
            newChannelInfo.intro = '';
            newChannelInfo.displayName = '';
            newChannelInfo.avatar = '';
          }
          channelCollectionPageList.push(newChannelInfo);
          if (this.startIndex > 0) {
            this.startIndex = this.startIndex - 1;
          }
        }
      }
      this.isLoading = false;
      if (event != null) {
        event.target.complete();
      }
      return channelCollectionPageList;
    } catch (error) {
      if (event != null) {
        event.target.complete();
      }
      this.isLoading = false;
    }
  }

  async loadData(event: any) {
    try {
      if (this.startIndex === 0) {
        if (event != null) {
          event.target.complete();
        }
        return;
      }
      let channelCollectionPageList = [];
      this.endIndex = this.startIndex - 1;
      if (this.startIndex - this.pageSize < 0) {
        this.startIndex = 0;
      } else {
        this.startIndex = this.startIndex - this.pageSize;
      }

      for (let channelIndex = this.endIndex; channelIndex >= this.startIndex; channelIndex--) {
        let channel = [];
        try {
          channel = await this.nftContractControllerService.getChannel().channelByIndex(channelIndex);
        } catch (error) {
          continue;
        }
        let tokenURI = channel[2];
        const scanResult = ScannerHelper.parseScannerResult(tokenURI);
        const feedsUrl = scanResult.feedsUrl;
        try {
          let channelInfo: any = await this.hiveVaultController.getChannelV3ByIdFromRemote(feedsUrl.destDid, feedsUrl.channelId) || null;
          if (channelInfo != null) {
            channelInfo.channelSource = "hive";
            channelCollectionPageList.push(channelInfo);
          } else {
            let newChannelInfo = {
              "destDid": feedsUrl.destDid,
              "channelId": feedsUrl.channelId,
              "name": "",
              "intro": "",
              "avatar": "",
              "type": "public",
              "tipping_address": "",
              "displayName": "",
              "channelSource": 'ipfs'
            }
            let tokenURI = channel[1];
            newChannelInfo.tipping_address = channel[3];
            let uri = tokenURI.replace('feeds:json:', '');
            try {
              let result: any = await this.ipfsService
                .nftGet(this.ipfsService.getNFTGetUrl() + uri);
              newChannelInfo.intro = result.description || '';
              newChannelInfo.displayName = result.data.cname || '';
              newChannelInfo.avatar = result.data.avatar || '';
            } catch (error) {
              newChannelInfo.intro = '';
              newChannelInfo.displayName = '';
              newChannelInfo.avatar = '';
            }
            channelCollectionPageList.push(newChannelInfo);
          }
        } catch (error) {
          this.isLoading = false;
        }


      }
      this.channelCollectionPageList = this.channelCollectionPageList.concat(channelCollectionPageList);
      this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
      this.dataHelper.setChannelCollectionPageList(this.channelCollectionPageList);
      this.refreshChannelCollectionAvatar(channelCollectionPageList);
      event.target.complete();
    } catch (error) {
      event.target.complete();
    }


  }

  async unsubscribe(destDid: string, channelId: string, event: any) {
    event.stopPropagation();
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    try {
      const userDid = (await this.dataHelper.getSigninData()).did || '';

      if (destDid != userDid) {
        this.menuService.showChannelMenu(destDid, channelId, userDid);
      } else {
        this.native.toast_trans('common.unableUnsubscribe');
      }
    } catch (error) {
    }
  }

  handleRefresherInfinite(isOpen: boolean) {
    this.ionRefresher.disabled = isOpen;
    this.infiniteScroll.disabled = isOpen;
  }

}
