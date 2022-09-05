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
import { Keyboard } from '@ionic-native/keyboard/ngx';

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
  private channelCollectionList: any = [];//所有的
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
  private handleDisplayNameMap: any = {};
  private channelCollectionsAvatarisLoad: any = {};
  /**
   * 1. feeds netWork
   * 2. chenrong
   * 3. asralf
   * 4. BEB domains
   * 5. EverlastingOS
   * 6. MButcho
   * 7. stiartsly
   * 8. Sash
   */
  private specificPublicChannels = [
    "feeds://v3/did:elastos:iUiJQ5FFTeaUwG77PdihuASGSqQSqP7uWL/8e8fb3cdfe9dba6ab68c04f452e913d9e66974186e81297a8a40a1e669cda725",
    "feeds://v3/did:elastos:iabbGwqUN18F6YxkndmZCiHpRPFsQF1imT/80ae2be9c9ba1a14ce08f457b9ba1411d9c22b60dccbcbbf8c3887919b3d4406",
    "feeds://v3/did:elastos:icZdMxZe6U1Exs6TFsKTzj2pY2JLznPhjC/b6a9ee31c53d9087f3940d6b8db7c86f8fddad06633bcd0c2669d86feab781a8",
    "feeds://v3/did:elastos:iYvskJWD2tB98aFeBwAfcCAJosv6uKbjsG/64768de77141e425c8a64e272bbc3fc31bfc6fa1744dfa9934714d6b3d03c1a6",
    "feeds://v3/did:elastos:iV3RrXcQEmAqg1HyhDW8BgcaW2WUwmuQLC/dad840a91b6b1cd67a01acffcc5c74dbdf192d6a13b1e39b6d8afe952d2ef825",
    "feeds://v3/did:elastos:iZM2HZhHnzWKbQWBcbvLk1nFa4EqUEJzrr/ab82eea90e5c20a095af93cf63e7c09a8776f834024954d3b208fa8ca058b98c",
    "feeds://v3/did:elastos:inSeTvmVDj6to7dHSZgkRZuUJYc9yHJChN/d33a4b026b175886212f728fea3333658fa1c821e99e0782b073752c0bccd7d8",
    "feeds://v3/did:elastos:ik9HwavTJhdo2ufc1K7Gz7pLF4yraaVcCR/e72e416508852f63fc0a8badd508f7ddc63c0d9a0d006cd33a57ff9699484f36",
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
    private feedspage: FeedsPage,
    private keyboard: Keyboard
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

  async filterChannelCollectionPageList(channelCollectionPageList = []){
    let channelList = [];
    let subscribedChannel = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    for(let index = 0;index < channelCollectionPageList.length; index++){
        let channel: FeedsData.ChannelV3 = channelCollectionPageList[index];
        let channelIndex = _.findIndex(subscribedChannel,(item)=>{
          return item.destDid === channel.destDid && item.channelId ===  channel.channelId;
     });
     if(channelIndex > -1){
        continue;
     }
     channelList.push(channel);
    }

    return channelList;
  }

  async init() {
      let channelCollectionPageList =  this.dataHelper.getChannelCollectionPageList() || [];
      if(channelCollectionPageList.length === 0){
        this.channelCollectionPageList = await this.getChannels();
        this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
        this.dataHelper.setChannelCollectionPageList(this.channelCollectionPageList);
      }else{
       this.channelCollectionPageList = await this.filterChannelCollectionPageList(channelCollectionPageList);
       this.searchChannelCollectionPageList = _.cloneDeep(this.channelCollectionPageList);
       this.isLoading = false;
       this.dataHelper.setChannelCollectionPageList(this.channelCollectionPageList);
      }
      this.refreshChannelCollectionAvatar(this.channelCollectionPageList);
      this.initSubscribe();
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
      (channel: FeedsData.ChannelV3) => channel.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1,
    );

    if (this.channelCollectionPageList.length > 0) {
      this.refreshChannelCollectionAvatar(this.channelCollectionPageList);
    }

  }

  async doRefresh(event) {
    try {
    this.channelCollectionPageList = await this.getChannels(event);
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



  clickChannelCollection(channelCollections: FeedsData.ChannelV3) {
    this.native.navigateForward(['/channels', channelCollections.destDid, channelCollections.channelId], '');
    this.hiveVaultController.checkSubscriptionStatusFromRemote(channelCollections.destDid, channelCollections.channelId);
  }

  subscribeChannelCollection(channelCollections: FeedsData.ChannelV3) {
    this.native.navigateForward(['/channels', channelCollections.destDid, channelCollections.channelId], '');
    this.hiveVaultController.checkSubscriptionStatusFromRemote(channelCollections.destDid, channelCollections.channelId);
  }


  refreshChannelCollectionAvatar(list = []) {
     this.clearChanCollectionSid();
     this.chanCollectionSid = setTimeout(() => {
      this.channelCollectionsAvatarisLoad = {};
      this.handleDisplayNameMap = {};
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
    this.getDisplayName(destDid,channelId,destDid);
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
     let subscribedChannel = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
     let channelsCount = this.specificPublicChannels.length;
     for(let channelIndex = 0; channelIndex < channelsCount; channelIndex++){
       let channelUrl = this.specificPublicChannels[channelIndex];
       const scanResult = ScannerHelper.parseScannerResult(channelUrl);
       const feedsUrl = scanResult.feedsUrl;
       let index = _.findIndex(subscribedChannel,(item)=>{
            return item.destDid === feedsUrl.destDid && item.channelId ===  feedsUrl.channelId;
       });
       if(index > -1){
          continue;
       }
       try {
         const channelInfo = await this.hiveVaultController.getChannelInfoById(feedsUrl.destDid, feedsUrl.channelId);
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

  getDisplayName(destDid: string,channelId: string, userDid: string) {
    let displayNameMap = this.handleDisplayNameMap[userDid] || '';
    if (displayNameMap === "") {
      let text = destDid.replace('did:elastos:', '');
      this.handleDisplayNameMap[userDid] = UtilService.resolveAddress(text);
      try {
        this.hiveVaultController.getDisplayName(destDid, channelId, userDid).
          then((result: string) => {
            let name = result || "";
            if (name != "") {
              this.handleDisplayNameMap[userDid] = name;
            }
          }).catch(() => {
          });
      } catch (error) {

      }
    }
   }
}