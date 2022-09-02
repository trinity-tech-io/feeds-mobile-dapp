import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { FeedService } from '../../../services/FeedService';
import { PopoverController, IonRefresher, IonSearchbar } from '@ionic/angular';
import { NativeService } from '../../../services/NativeService';
import { ThemeService } from '../../../services/theme.service';
import { UtilService } from '../../../services/utilService';
import { PopupProvider } from '../../../services/popup';
import { HttpService } from '../../../services/HttpService';
import { ApiUrl } from '../../../services/ApiUrl';
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
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { FeedsUrl, ScannerCode, ScannerHelper } from 'src/app/services/scanner_helper.service';
import { Logger } from 'src/app/services/logger';
import { FeedsPage } from '../feeds.page';

const TAG: string = 'SearchPage';
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})

export class SearchPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: true }) ionRefresher: IonRefresher;
  @ViewChild('searchbar', { static: false }) searchbar: IonSearchbar;

  public popover: any = '';
  public curAddingItem = {};
  public addingChanneList = [];
  public searchAddingChanneList = [];
  public isSearch: string = '';
  public searchfeedsList = [];
  public discoverSquareList = [];
  public pageNum: number = 1;
  public pageSize: number = 9;
  public totalNum: number = 0;
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
  private pasarGridisLoadimage: any = {};
  private channelCollectionList: any = [];//所有的
  private channelCollectionsAvatarisLoad: any = {};
  public channelCollectionPageList:any = [];
  public searchChannelCollectionPageList: any = [];//搜索使用
  private panelPageSize: number = 10;//一页多少个
  private panelPageNum: number = 1;//页码
  private confirmdialog = null;

  private displayName: string = '';
  private toBeSubscribeddestDid: string = '';
  private toBeSubscribedChannelId: string = '';
  public isBorderGradient: boolean = false;
  public channelAvatarMap:any = {};
  public subscriptionV3NumMap:any = {};
  private searchObserver:any = {};
  private searchIsLoadimage:any = {};
  private chanCollectionSid: any = null;
  private specificPublicChannels = [
    "feeds://v3/did:elastos:iabbGwqUN18F6YxkndmZCiHpRPFsQF1imT/80ae2be9c9ba1a14ce08f457b9ba1411d9c22b60dccbcbbf8c3887919b3d4406"
  ]
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
    private nftContractHelperService: NFTContractHelperService,
    private ipfsService: IPFSService,
    private fileHelperService: FileHelperService,
    private pasarAssistService: PasarAssistService,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController,
    private feedspage: FeedsPage
  ) { }

  ngOnInit() {
    this.scanServiceStyle['right'] = (screen.width * 7.5) / 100 + 5 + 'px';
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
      FeedsEvent.PublishType.subscribeFinish,
      (subscribeFinishData: FeedsEvent.SubscribeFinishData) => {
        this.zone.run(() => {
          // let nodeId = subscribeFinishData.nodeId;
          // let channelId = subscribeFinishData.channelId;
          // this.unfollowedFeed = this.getUnfollowedFeed() || [];
          // this.searchUnfollowedFeed = _.cloneDeep(this.unfollowedFeed);
          // this.addingChanneList =
          //   this.feedService.getToBeAddedFeedsList() || [];
          // this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
          // this.handleSearch();
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
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
  }

  ionViewWillEnter() {
    this.clientHeight = screen.availHeight;
    this.isLoading = true;
    this.events.subscribe(FeedsEvent.PublishType.search, () => {
      this.initTile();
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

  async init() {

      this.channelCollectionPageList = await this.getChannels();
      this.refreshChannelCollectionAvatar(this.channelCollectionPageList);
     // let discoverfeeds = this.dataHelper.getDiscoverfeeds();
    // if (discoverfeeds.length === 0) {
    //   this.pageNum = 1;
    //   await this.native.showLoading('common.waitMoment');
    //   this.initData('', false);
    // } else {
    //   this.channelCollectionPageList = await this.filterChannelCollection();
    //   this.refreshChannelCollectionAvatar();
    //   this.httpAllData = _.cloneDeep(discoverfeeds);
    //   this.discoverSquareList = _.cloneDeep(discoverfeeds);
    //   this.refreshDiscoverSquareFeedAvatar();
    // }
    // this.developerMode = this.feedService.getDeveloperMode();
    // this.unfollowedFeed = this.getUnfollowedFeed();
    // this.discoverSquareList = this.filterdiscoverSquareList(
    //   this.discoverSquareList,
    // );
    this.initSubscribe();
    // this.handleSearch();
  }

  ionViewWillLeave() {
    this.removeObserveList();
    this.removeSubscribe();
    this.curAddingItem = '';
    this.events.unsubscribe(FeedsEvent.PublishType.search);
  }

  subscribe(destDid: string, id: string) {
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    //TODO
    // this.hiveVaultController.subscribeChannel();
  }

  getItems(events: any) {
    // this.isSearch = events.target.value || '';
    // this.scanServiceStyle['z-index'] = -1;
    // if (
    //   (events && events.keyCode === 13) ||
    //   (events.keyCode === 8 && this.isSearch === '')
    // ) {
    //   if (this.checkFeedUrl(this.isSearch)) {
    //     this.scanServiceStyle['z-index'] = 3;
    //     this.addFeedUrl(this.isSearch);
    //     return;
    //   }
    //   if (this.isSearch == '') {
    //     this.scanServiceStyle['z-index'] = 3;
    //     this.ionRefresher.disabled = false;
    //     this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
    //     this.unfollowedFeed = this.getUnfollowedFeed() || [];
    //     let discoverfeeds = this.dataHelper.getDiscoverfeeds() || [];
    //     if (discoverfeeds.length > 0) {
    //       this.discoverSquareList = this.filterdiscoverSquareList(
    //         discoverfeeds,
    //       );
    //     }
    //     this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
    //     this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
    //     return;
    //   }
    //   this.ionRefresher.disabled = true;
    //   this.handleSearch();
    // }
  }

  ionClear() {
    // this.scanServiceStyle['z-index'] = 3;
    // this.isSearch = '';
    // if (this.checkFeedUrl(this.isSearch)) {
    //   this.addFeedUrl(this.isSearch);
    //   return;
    // }
    // if (this.isSearch == '') {
    //   this.ionRefresher.disabled = false;
    //   this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
    //   this.unfollowedFeed = this.getUnfollowedFeed() || [];
    //   let discoverfeeds = this.dataHelper.getDiscoverfeeds() || [];
    //   if (discoverfeeds.length > 0) {
    //     this.discoverSquareList = this.filterdiscoverSquareList(discoverfeeds);
    //   }
    //   this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
    //   this.refreshDiscoverSquareFeedAvatar();
    //   return;
    // }
    // this.ionRefresher.disabled = true;
    // this.handleSearch();
  }
  handleSearch() {
    if (this.isSearch === '') {
      return;
    }
    this.addingChanneList = this.searchAddingChanneList.filter(
      channel =>
        channel.feedName.toLowerCase().indexOf(this.isSearch.toLowerCase()) >
        -1,
    );

    this.channelCollectionPageList = this.searchChannelCollectionPageList.filter(
      (feed: FeedsData.ChannelCollections) => feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1,
    );

    if (this.channelCollectionPageList.length > 0) {
      this.refreshChannelCollectionAvatar();
    }

    this.unfollowedFeed = this.searchUnfollowedFeed.filter(
      feed => feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1,
    );


    this.discoverSquareList = this.searchSquareList.filter(
      feed => feed.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1,
    );
    if (this.discoverSquareList.length > 0) {
      this.refreshDiscoverSquareFeedAvatar();
    }
  }

  async doRefresh(event) {
    try {
    this.channelCollectionPageList = await this.getChannels(event);
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

  handleStatus(item: any) {
    let status = item['status'] || 0;
    let keyString = 'SearchPage.status';
    return keyString + status;
  }

  handeleStatus(addingchannel: any) {
    this.curAddingItem = addingchannel;
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      'SearchPage.des1',
      this.cancel,
      this.confirm1,
      './assets/images/tskth.svg',
    );
  }

  confirm1(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      let nodeId = that.curAddingItem['nodeId'];
      let srcfeedId = that.curAddingItem['feedId'];
      that.feedService.removeTobeAddedFeeds(nodeId, srcfeedId).then(() => {
        that.zone.run(() => {
          that.addingChanneList =
            that.feedService.getToBeAddedFeedsList() || [];
          that.searchAddingChanneList = _.cloneDeep(that.addingChanneList);
          let allChannelCollectionList = that.dataHelper.getPublishedActivePanelList();
          let channelCollectionPageList = _.filter(allChannelCollectionList, feed => {
            let feedNodeId = feed['nodeId'];
            let feedUrl = feed['url'] || feed.entry.url;
            let feedId = feedUrl.split('/')[4];
            return feedNodeId == nodeId && feedId == srcfeedId;
          });
          if (channelCollectionPageList.length > 0) {
            let feed = channelCollectionPageList[0];
            that.channelCollectionPageList.push(feed);
            that.searchChannelCollectionPageList = _.cloneDeep(that.channelCollectionPageList);
            that.refreshChannelCollectionAvatar();
            return;
          }

          let feedlist = _.filter(that.httpAllData, feed => {
            let feedNodeId = feed['nodeId'];
            let feedUrl = feed['url'];
            let feedId = feedUrl.split('/')[4];
            return feedNodeId == nodeId && feedId == srcfeedId;
          });
          if (feedlist.length > 0) {
            let feed = feedlist[0];
            that.discoverSquareList.push(feed);
          }
          that.searchSquareList = _.cloneDeep(that.discoverSquareList);
        });
      });
    }
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      let nodeId = that.curAddingItem['nodeId'];
      let feedId = that.curAddingItem['feedId'];
      let carrierAddress: string = that.curAddingItem['carrierAddress'];
      that.feedService.continueAddFeeds(nodeId, feedId, carrierAddress);
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
      this.native.navigateForward(['/channels', feedsUrl.destDid, feedsUrl.channelId], '');
      this.native.hideLoading();
      this.hiveVaultController.checkSubscriptionStatusFromRemote(feedsUrl.destDid, feedsUrl.channelId);
    } catch (error) {
      this.native.hideLoading();
      this.native.toastWarn("common.subscribeFail");
    }
  }

  loadData(events: any) {
    this.pageNum = this.pageNum + 1;
    this.httpService
      .ajaxGet(
        ApiUrl.listPage +
        '?pageNum=' +
        this.pageNum +
        '&pageSize=' +
        this.pageSize,
        false,
      )
      .then(result => {
        if (result['code'] === 200) {
          this.totalNum = result['data']['total'];
          let arr = result['data']['result'] || [];
          if (arr.length === 0) {
            if (events != '') {
              events.target.complete();
            }
            return;
          }
          this.refreshDiscoverSquareFeedAvatar()
          this.curtotalNum = this.curtotalNum + arr.length;
          this.handleCache(arr);
          let discoverSquareList = this.dataHelper.getDiscoverfeeds();
          this.httpAllData = _.cloneDeep(discoverSquareList);
          this.discoverSquareList = this.filterdiscoverSquareList(
            discoverSquareList,
          );
        }

        if (this.curtotalNum >= this.totalNum) {
          if (events != '') {
            events.target.complete();
          }
          return;
        }
        if (this.curtotalNum < this.totalNum) {
          this.loadData(events);
        }
      })
      .catch(err => { });
  }

  async initData(events: any, isLoading: boolean = true) {
    this.isLoading = true;
    await this.getActivePanelList();
    this.channelCollectionPageList = this.filterChannelCollection();
    this.refreshChannelCollectionAvatar();
    this.httpService
      .ajaxGet(
        ApiUrl.listPage +
        '?pageNum=' +
        this.pageNum +
        '&pageSize=' +
        this.pageSize,
        isLoading,
      )
      .then(result => {
        if (result['code'] === 200) {
          this.isLoading = false;
          this.totalNum = result['data']['total'];
          let discoverSquareList = result['data']['result'] || [];
          this.refreshDiscoverSquareFeedAvatar();
          this.curtotalNum = discoverSquareList.length;
          this.handleCache(discoverSquareList);
          discoverSquareList = this.dataHelper.getDiscoverfeeds();
          this.httpAllData = _.cloneDeep(discoverSquareList);

          this.discoverSquareList = this.filterdiscoverSquareList(
            discoverSquareList,
          );
          this.searchSquareList = _.cloneDeep(this.discoverSquareList);
          if (this.curtotalNum <= this.totalNum) {
            this.loadData(events);
          }
        }
      })
      .catch(err => {
        this.isLoading = false;
        if (events != '') {
          events.target.complete();
        }
      });
  }

  clickItem(feed: any) {
    let isClick = false;
    if (isClick) {
      return;
    }
    isClick = true;
    let feedsUrlHash = feed.feedsUrlHash
    this.getAvatar(feedsUrlHash).then((result) => {
      isClick = false;
      if (result != null) {
        this.removeSubscribe();
        feed.feedsAvatar = result;
        this.native.go('discoverfeedinfo', {
          params: feed,
        });
      }
    }).catch((err) => {
      isClick = false;
    });
  }

  handleShow(feed: any) {
    let feedNodeId = feed['nodeId'];
    let feedUrl = feed['url'];
    let feedId = feedUrl.split('/')[4];
    let followFeed = _.filter(this.followedList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['id'];
    });

    if (followFeed.length > 0) {
      return false;
    }

    let addingFeed = _.filter(this.addingChanneList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['feedId'];
    });

    if (addingFeed.length > 0) {
      return false;
    }

    let channelCollectionPageList = _.filter(this.channelCollectionPageList, (item: FeedsData.ChannelCollections) => {
      let url = item.entry.url;
      let urlArr = url.replace("feeds://", "").split("/");
      let channelId = urlArr[2];
      return feedNodeId == item['nodeId'] && feedId == channelId;
    });

    if (channelCollectionPageList.length > 0) {
      return false;
    }

    let purpose = feed['purpose'] || '';
    if (purpose != '' && !this.developerMode) {
      return false;
    }

    return true;
  }

  filterdiscoverSquareList(discoverSquare: any) {
    this.developerMode = this.feedService.getDeveloperMode();
    this.followedList = this.feedService.getChannelsList() || [];
    this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
    this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
    let discoverSquareList = [];
    discoverSquareList = _.filter(discoverSquare, (feed: any) => {
      return this.handleShow(feed);
    });
    this.searchSquareList = _.cloneDeep(discoverSquareList);
    return discoverSquareList;
  }

  getUnfollowedFeed() {
    let feedList = this.feedService.getChannelsList() || [];
    let unfollowedFeed = _.filter(feedList, feed => {
      return !feed['isSubscribed'];
    });
    this.searchUnfollowedFeed = _.cloneDeep(unfollowedFeed);
    return unfollowedFeed;
  }


  //TODO
  discoverSubscribe(feedInfo: any) {
    let feedUrl = feedInfo['url'];
    let feedsUrlHash = feedInfo['feedsUrlHash'];
    let followers = feedInfo['followers'];
    let feedName = feedInfo['name'];
    let desc = feedInfo['description'];
    let ownerName = feedInfo['ownerName'];
    //let avatar = this.avatarList[feedsUrlHash];
    let isClick = false;
    if (isClick) {
      return;
    }
    isClick = true;
    this.getAvatar(feedsUrlHash).then((result: any) => {
      isClick = false;
      if (result != null) {
        let avatar = result;
        this.feedService
          .addFeed(feedUrl, avatar, followers, feedName, ownerName, desc)
          .then(isSuccess => {
            if (isSuccess) {
              this.zone.run(() => {
              });
            }
          })
          .catch(err => { });
      }
    }).catch((err) => {
      isClick = false;
    });

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

  getAddingFeedOwner(addingchannel) {
    let ownerName = '';
    let feed = addingchannel || '';
    if (feed != '') ownerName = addingchannel['ownerName'];
    if (ownerName == '') return this.translate.instant('common.obtain');
    return '@' + ownerName;
  }

  getAddingFeedDes(addingchannel) {
    let description = '';
    let feed = addingchannel || '';
    if (feed != '') description = addingchannel['feedDes'];
    return description;
  }


  clickAddingchannel(addingchannel: any) {

    let isClick = false;
    if (isClick) {
      return;
    }
    let nodeId = addingchannel["nodeId"];
    let srcFeedId = addingchannel["feedId"];
    let feed = _.find(this.httpAllData, (item) => {
      let feedUrl = item['url'];
      let feedId = feedUrl.split('/')[4];
      return item.nodeId == nodeId && feedId == srcFeedId;
    });
    let feedsUrlHash = feed['feedsUrlHash'];
    isClick = true;
    this.getAvatar(feedsUrlHash).then((result) => {
      isClick = false;
      if (result != null) {
        this.removeSubscribe();
        feed["carrierAddress"] = addingchannel["carrierAddress"];
        feed.feedsAvatar = result;
        this.native.go('discoverfeedinfo', {
          params: feed,
        });
      }
    }).catch((err) => {
      isClick = false;
    });
  }


  ionScroll() {
    this.native.throttle(this.setDiscoverSquareFeedAvatar(), 200, this, true);
    this.native.throttle(this.setChannelCollectionAvatar(), 200, this, true);
  }

  setDiscoverSquareFeedAvatar() {
    let discoverSquareFeed = document.getElementsByClassName("discoverSquareFeed") || [];
    let len = discoverSquareFeed.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = discoverSquareFeed[itemIndex];
      let feedsUrlHash = item.getAttribute("id");
      let thumbImage = document.getElementById(feedsUrlHash + '-avatar');
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.pasarGridisLoadimage[feedsUrlHash] || '';
      try {
        if (
          feedsUrlHash != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            this.pasarGridisLoadimage[feedsUrlHash] = '12';
            let key = feedsUrlHash + "-Channel-avatar";
            this.dataHelper.loadData(key).then((result) => {
              if (result != null) {
                this.zone.run(() => {
                  this.pasarGridisLoadimage[feedsUrlHash] = '13';
                  thumbImage.setAttribute("src", result);
                });
              } else {
                let avatarUrl = ApiUrl.getAvatar + "?feedsUrlHash=" + feedsUrlHash;
                this.httpService.ajaxGet(avatarUrl, false).then((result: any) => {
                  let code = result['code'];
                  if (code === 200) {
                    let data = result['data'];
                    this.zone.run(() => {
                      this.pasarGridisLoadimage[feedsUrlHash] = '13';
                      thumbImage.setAttribute("src", data['feedsAvatar']);
                    });
                    this.dataHelper.saveData(key, data['feedsAvatar']);
                  }
                }).catch((err) => {

                });
              }
            }).catch(err => {

            })

          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.pasarGridisLoadimage[feedsUrlHash] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.pasarGridisLoadimage[feedsUrlHash] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        this.pasarGridisLoadimage[feedsUrlHash] = '';
        thumbImage.setAttribute('src', './assets/icon/reserve.svg');
      }
    }
  }

  refreshDiscoverSquareFeedAvatar() {
    let sid = setTimeout(() => {
      this.pasarGridisLoadimage = {};
      this.setDiscoverSquareFeedAvatar();
      clearTimeout(sid);
    }, 100);
  }

  handleId(feed: any) {
    return feed.feedsUrlHash + "-avatar";
  }

  getAvatar(feedsUrlHash: string) {
    return new Promise((resolve, reject) => {
      let key = feedsUrlHash + "-Channel-avatar";
      this.dataHelper.loadData(key).then((result) => {
        if (result != null) {
          resolve(result);
        } else {
          let avatarUrl = ApiUrl.getAvatar + "?feedsUrlHash=" + feedsUrlHash;
          this.httpService.ajaxGet(avatarUrl, false).then((result: any) => {
            let code = result['code'];
            if (code === 200) {
              let data = result['data'];
              resolve(data['feedsAvatar']);
              this.dataHelper.saveData(key, data['feedsAvatar']);
            } else {
              resolve(null);
            }
          }).catch((err) => {
            reject(null)
          });
        }
      }).catch(err => {
        reject(null)
      })
    });
  }

  async getActivePanelList() {
    this.channelCollectionList = [];
    this.channelCollectionPageList = [];
    try {
      let result = await this.pasarAssistService.
        listGalleriaPanelsFromService(this.panelPageNum, this.panelPageSize);
      let panelsList: any;
      if (result != null) {
        panelsList = result["data"]["result"] || [];
      } else {
        panelsList = [];
      }
      while (result != null && panelsList.length > 0) {
        await this.handlePanels(panelsList);
        this.panelPageNum = this.panelPageNum + 1;
        result = await this.pasarAssistService.
          listGalleriaPanelsFromService(this.panelPageNum, this.panelPageSize);
        if (result != null) {
          panelsList = result["data"]["result"] || [];
        } else {
          panelsList = [];
        }
      }
      this.dataHelper.setPublishedActivePanelList(this.channelCollectionList);
    } catch (error) {
      this.dataHelper.setPublishedActivePanelList(this.channelCollectionList);
    }
  }

  async handlePanels(result: []) {
    for (let index = 0; index < result.length; index++) {
      let channelCollections: FeedsData.ChannelCollections = UtilService.getChannelCollections();
      let item: any = result[index];
      channelCollections.version = item.version;
      channelCollections.panelId = item.panelId;
      channelCollections.userAddr = item.user;
      channelCollections.diaBalance = await this.nftContractControllerService.getDiamond().getDiamondBalance(channelCollections.userAddr);
      channelCollections.type = item.type;
      channelCollections.tokenId = item.tokenId;
      channelCollections.name = item.name;
      channelCollections.description = item.description;
      channelCollections.avatar = item.avatar;
      channelCollections.entry = item.entry;
      channelCollections.ownerDid = item.tokenDid.did;
      let didJsON = await this.feedService.resolveDidObjectForName(channelCollections.ownerDid);
      let didName = didJsON["name"] || "";
      channelCollections.ownerName = didName;
      let url: string = channelCollections.entry.url;
      let urlArr = url.replace("feeds://", "").split("/");
      channelCollections.did = urlArr[0];
      this.channelCollectionList.push(channelCollections);
    }
    this.dataHelper.setPublishedActivePanelList(this.channelCollectionList);
  }



  clickChannelCollection(channelCollections: FeedsData.ChannelV3) {
    this.native.navigateForward(['/channels', channelCollections.destDid, channelCollections.channelId], '');
    this.hiveVaultController.checkSubscriptionStatusFromRemote(channelCollections.destDid, channelCollections.channelId);
  }

  subscribeChannelCollection(channelCollections: FeedsData.ChannelV3) {
    this.native.navigateForward(['/channels', channelCollections.destDid, channelCollections.channelId], '');
    this.hiveVaultController.checkSubscriptionStatusFromRemote(channelCollections.destDid, channelCollections.channelId);
  }


  handleCollectionImgId(channelCollections: FeedsData.ChannelCollections) {
    let channelAvatar = channelCollections.avatar.image;
    let tokenId: string = channelCollections.tokenId;
    let channelCollectionAvatarId = "";
    let channelAvatarUri = "";
    if (channelAvatar.indexOf('feeds:imgage:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:imgage:', '');
      channelCollectionAvatarId = channelAvatarUri;
    } else if (channelAvatar.indexOf('feeds:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:image:', '');
    } else if (channelAvatar.indexOf('pasar:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('pasar:image:', '');
    }
    channelCollectionAvatarId = "serachPage-avatar-" + channelAvatarUri + "-" + tokenId;
    return channelCollectionAvatarId;
  }

  setChannelCollectionAvatar() {
    let discoverSquareFeed = document.getElementsByClassName("channelCollectionFeeds") || [];
    let len = discoverSquareFeed.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = discoverSquareFeed[itemIndex];
      let arr = item.getAttribute("id").split("-");
      let avatarUri = arr[1];
      let kind = arr[2];
      let tokenId: string = arr[3];
      let thumbImage = document.getElementById('serachPage-avatar-' + avatarUri + "-" + tokenId);
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.channelCollectionsAvatarisLoad[tokenId] || '';
      try {
        if (
          avatarUri != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().bottom <= this.clientHeight
        ) {
          if (isload === "") {
            this.channelCollectionsAvatarisLoad[tokenId] = '12';
            let fetchUrl = this.ipfsService.getNFTGetUrl() + avatarUri;
            this.fileHelperService.getNFTData(fetchUrl, avatarUri, kind).then((data) => {
              this.zone.run(() => {
                this.channelCollectionsAvatarisLoad[tokenId] = '13';
                let dataSrc = data || "";
                if (dataSrc != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.channelCollectionsAvatarisLoad[tokenId] === '13') {
                this.channelCollectionsAvatarisLoad[tokenId] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });

          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.channelCollectionsAvatarisLoad[tokenId] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.channelCollectionsAvatarisLoad[tokenId] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        this.channelCollectionsAvatarisLoad[tokenId] = '';
        thumbImage.setAttribute('src', './assets/icon/reserve.svg');
      }
    }
  }

  refreshChannelCollectionAvatar(list = []) {
     this.clearChanCollectionSid();
     this.chanCollectionSid = setTimeout(() => {
      this.channelCollectionsAvatarisLoad = {};
      this.getSearchObserverList(list);
      this.clearChanCollectionSid();
    }, 100);
  }

  clearChanCollectionSid() {
     if(this.chanCollectionSid != null){
      clearTimeout(this.chanCollectionSid);
      this.chanCollectionSid = null;
     }
  }

  async filterChannelCollection() {
    let publishedActivePanelList = this.dataHelper.getPublishedActivePanelList();
    let channelCollectionList = _.cloneDeep(publishedActivePanelList);
    let ownerDid = (await this.dataHelper.getSigninData()).did;
    let channelCollectionPageList = [];
    channelCollectionPageList = _.filter(channelCollectionList, (item: FeedsData.ChannelCollections) => {
      return item.ownerDid != ownerDid;
    });
    this.followedList = this.feedService.getChannelsList() || [];
    this.addingChanneList = this.feedService.getToBeAddedFeedsList() || [];
    this.searchAddingChanneList = _.cloneDeep(this.addingChanneList);
    channelCollectionPageList = _.filter(channelCollectionPageList, (feed: any) => {
      return this.handleChannelShow(feed);
    });
    let newChannelCollectionPageList = _.orderBy(channelCollectionPageList, ['diaBalance'], ['desc']);
    this.searchChannelCollectionPageList = _.cloneDeep(newChannelCollectionPageList);
    return newChannelCollectionPageList;
  }

  handleChannelShow(feed: any) {
    let feedNodeId = feed['nodeId'];
    let feedUrl = feed['url'] || feed.entry.url;
    let feedId = feedUrl.split('/')[4];
    let followFeed = _.filter(this.followedList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['id'];
    });

    if (followFeed.length > 0) {
      return false;
    }
    let addingFeed = _.filter(this.addingChanneList, (item: any) => {
      return feedNodeId == item['nodeId'] && feedId == item['feedId'];
    });

    if (addingFeed.length > 0) {
      return false;
    }

    return true;
  }

  ionBlur() {
   this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
  }

  removeSearchObserver(postGridId: string, observer: any){
    let item = document.getElementById(postGridId) || null;
    if(item != null){
      if( observer != null ){
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.searchObserver[postGridId] = null;
      }
    }
  }

  getSearchObserverList(follingList = []){

    for(let index = 0; index < follingList.length; index++){
      let postItem =  follingList[index] || null;
      if(postItem === null){
        return;
      }
      let postGridId = postItem.destDid+"-"+postItem.channelId+'-search';
      console.log("===== postGridId====="+index, postGridId);
      let exit = this.searchObserver[postGridId] || null;
      if(exit != null){
         continue;
      }
      this.newSearchObserver(postGridId);
    }
  }

  newSearchObserver(postGridId: string) {
    let observer = this.searchObserver[postGridId] || null;
    if(observer != null){
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if(item != null ){
    this.searchObserver[postGridId] = new IntersectionObserver(async (changes:any)=>{
    let container = changes[0].target;
    let newId = container.getAttribute("id");

    let intersectionRatio = changes[0].intersectionRatio;

    if(intersectionRatio === 0){
      //console.log("======newId leave========", newId);
      return;
    }
    let arr =  newId.split("-");
    let destDid: string = arr[0];
    let channelId: string = arr[1];
    this.handleSearchAvatarV2(destDid,channelId);
    this.getChannelFollower(destDid,channelId);
    });

    this.searchObserver[postGridId].observe(item);
    }
  }

  getChannelFollower(destDid: string,channelId: string) {
     //关注数
     let follower = this.subscriptionV3NumMap[channelId] || '';
     if (follower === "") {
       try {
         this.subscriptionV3NumMap[channelId] = "...";
         this.dataHelper.getSubscriptionV3NumByChannelId(
           destDid, channelId).
           then((result) => {
             result = result || 0;
             if (result == 0) {
               this.hiveVaultController.querySubscriptionChannelById(destDid, channelId).then(() => {
                 this.zone.run(async () => {
                   this.subscriptionV3NumMap[channelId] = await this.dataHelper.getSubscriptionV3NumByChannelId(destDid, channelId);
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
    for(let postGridId in this.searchObserver){
        let observer = this.searchObserver[postGridId] || null;
        this.removeSearchObserver(postGridId, observer)
    }
    this.searchObserver = {};
  }

  async handleSearchAvatarV2(destDid: string,channelId: string) {
    let id = destDid+"-"+channelId;
    let isload = this.searchIsLoadimage[id] || '';
    if (isload === "") {
      let arr = id.split("-");
      this.searchIsLoadimage[id] = '11';
      let destDid = arr[0];
      let channelId = arr[1];
      let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      let avatarUri = "";
      if (channel != null) {
        avatarUri = channel.avatar;
      }
      let fileName: string = avatarUri.split("@")[0];
      this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
        this.zone.run(() => {
          let srcData = data || "";
          if (srcData != "") {
            this.searchIsLoadimage[id] = '13';
            this.channelAvatarMap[id] = srcData;
          } else {
            this.searchIsLoadimage[id] = '13';
          }
        });
      }).catch((err) => {
        this.searchIsLoadimage[id] = '';
      });
    }
  }

  async getChannels(event=null) {
    try {
     let channelCollectionPageList = [];
     let channelsCount = this.specificPublicChannels.length;
     console.log("====channelsCount=====",channelsCount);
     for(let channelIndex = 0; channelIndex < channelsCount; channelIndex++){
       let channelUrl = this.specificPublicChannels[channelIndex];
       const scanResult = ScannerHelper.parseScannerResult(channelUrl);
       const feedsUrl = scanResult.feedsUrl;
       console.log("=====feedsUrl======",feedsUrl);
       console.log("=====feedsUrl======",feedsUrl.destDid);
       console.log("=====feedsUrl======",feedsUrl.channelId);
       try {
         const channelInfo = await this.hiveVaultController.getChannelInfoById(feedsUrl.destDid, feedsUrl.channelId);
         console.log("=====channelInfo======",channelInfo);
         channelCollectionPageList.push(channelInfo);
       } catch (error) {
        this.isLoading = false;
       }
     }
     this.isLoading = false;
     if(event != null){
      event.target.complete();
    }
     return channelCollectionPageList;
    } catch (error) {
      if(event != null){
        event.target.complete();
      }
      this.isLoading = false;
    }

   }
}