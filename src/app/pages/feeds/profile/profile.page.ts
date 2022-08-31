import { Component, OnInit, NgZone, ViewChild, ElementRef } from '@angular/core';
import { IonRefresher, ModalController, PopoverController } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { ThemeService } from 'src/app/services/theme.service';
import { IonInfiniteScroll } from '@ionic/angular';
import { MenuService } from 'src/app/services/MenuService';
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';
import { IntentService } from 'src/app/services/IntentService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from 'src/app/services/StorageService';
import _ from 'lodash';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { UtilService } from 'src/app/services/utilService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger } from 'src/app/services/logger';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { FeedService } from 'src/app/services/FeedService';
import { CommonPageService } from 'src/app/services/common.page.service';
import { FeedsPage } from '../feeds.page';
import { Config } from 'src/app/services/config';

let TAG: string = 'Feeds-profile';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonRefresher, { static: false }) refresher: IonRefresher;

  public channels = []; //myFeeds page

  public collectiblesList: FeedsData.NFTItem[] = []; //NFT列表
  public totalLikeList = [];
  public pageSize: number = 1;
  public pageNumber: number = 5;
  public likeList = []; //like page
  public selectType: string = 'ProfilePage.myFeeds';
  public followers = 0;

  // Sign in data
  public name: string = '';
  public avatar: string = '';
  public description: string = '';

  public hideComment = true;

  // For comment component
  public postId = null;
  public destDid = null;
  public channelId = null;
  public channelAvatar = null;
  public channelName = null;

  public curItem: any = {};

  public clientHeight: number = 0;
  private clientWidth: number = 0;
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  private isLoadimage: any = {};
  private isLoadAvatarImage: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public cacheGetBinaryRequestKey: string = '';
  public cachedMediaType = '';

  public curPostId: string = '';

  public popover: any = '';

  public hideDeletedPosts: boolean = false;

  public hideSharMenuComponent: boolean = false;

  public qrCodeString: string = null;

  public isShowUnfollow: boolean = false;

  public isShowQrcode: boolean = false;

  public isShowTitle: boolean = false;

  public isShowInfo: boolean = false;

  public isPreferences: boolean = false;

  public shareDestDid: string = '';

  public shareChannelId: string = '';

  /**
   * imgPercentageLoading
   */
  public isImgPercentageLoading: any = {};
  public imgPercent: number = 0;
  public imgRotateNum: any = {};
  /**
   * imgloading
   */
  public isImgLoading: any = {};
  public imgloadingStyleObj: any = {};
  public imgDownStatus: any = {};
  public imgDownStatusKey: string = '';
  public imgCurKey: string = '';

  /**
   * videoPercentageLoading
   */
  public isVideoPercentageLoading: any = {};
  public videoPercent: number = 0;
  public videoRotateNum: any = {};
  /**
   * videoloading
   */
  public isVideoLoading: any = {};
  public videoloadingStyleObj: any = {};
  public videoDownStatus: any = {};
  public videoDownStatusKey: string = '';
  public videoCurKey: string = '';

  public roundWidth: number = 40;

  public isAddProfile: boolean = false;

  public likeSum: number = 0;

  public ownNftSum: number = 0;

  public myFeedsSum: number = 0;


  public walletAddress: string = '';
  public walletAddressStr: string = '';
  public onSaleList: any = [];
  public isFinsh: any = [];

  public elaPrice: string = null;

  private notSaleOrderCount = 0;
  private saleOrderCount = 0;

  private refreshSaleOrderFinish = false;
  private refreshNotSaleOrderFinish = false;

  private isRefreshingCollectibles = false;
  private refreshingCollectiblesHelper: FeedsData.NFTItem[] = [];
  public isAutoGet: string = 'unAuto';
  public thumbImageName: string = "profileImg";
  private profileCollectiblesisLoadimage: any = {};
  private myFeedsIsLoadimage: any = {};
  private sortType = FeedsData.SortType.TIME_ORDER_LATEST;
  private collectiblesPageNum: number = 0;

  private likeMap: any = {};
  private likeNumMap: any = {};
  private commentNumMap: any = {};
  private channelNameMap: any = {};
  private isLoadChannelNameMap: any = {};
  public isLoadingLikeMap: any = {};
  private downMyFeedsAvatarMap: any = {};
  public lightThemeType: number = 3;
  private handleDisplayNameMap: any = {};
  private isLoadHandleDisplayNameMap: any = {};
  public subscriptionV3NumMap: any = {};
  private isLoadSubscriptionV3Num: any = {};
  public likeAvatarMap: any = {};
  public myFeedAvatarMap: any = {};
  public postImgMap: any = {};
  private postMap = {};
  public postTime = {};
  private refreshImageSid: any = null;
  private refreshMyFeedsSid: any = null;
  private myFeedsObserver: any = {};
  private myLikeObserver: any = {};
  private channelMap: any = {};
  public userDid: string = "";

  private firstScrollTop = 0;
  public isFullPost: boolean = false;
  public isLoadingLike: boolean = true;
  public isLoadingMyFeeds: boolean = true;
  public hideRepostComment = true;
  public repostChannelList: any = [];

  constructor(
    private elmRef: ElementRef,
    public theme: ThemeService,
    private events: Events,
    private zone: NgZone,
    public menuService: MenuService,
    public native: NativeService,
    public appService: AppService,
    public modalController: ModalController,
    public popupProvider: PopupProvider,
    public popoverController: PopoverController,
    private intentService: IntentService,
    private viewHelper: ViewHelper,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private storageService: StorageService,
    private walletConnectControllerService: WalletConnectControllerService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private dataHelper: DataHelper,
    private nftContractHelperService: NFTContractHelperService,
    private fileHelperService: FileHelperService,
    private postHelperService: PostHelperService,
    private feedsServiceApi: FeedsServiceApi,
    private hiveVaultController: HiveVaultController,
    private feedService: FeedService,
    private feedspage: FeedsPage
  ) {
  }

  ngOnInit() {
  }

  async initMyFeeds(channels?: FeedsData.ChannelV3[]) {
    try {
      let newChannels = channels || null;
      if (newChannels != null) {
        channels = _.uniqWith(newChannels, _.isEqual) || [];
        newChannels = _.sortBy(newChannels, (item: FeedsData.ChannelV3) => {
          return -item.createdAt;
        });
        this.channels = newChannels;
      } else {
        let newSelfChannels = await this.dataHelper.getSelfChannelListV3() || [];
        newSelfChannels = _.sortBy(newSelfChannels, (item: FeedsData.ChannelV3) => {
          return -item.createdAt;
        });
        this.channels = _.uniqWith(newSelfChannels, _.isEqual) || [];
      }
      this.isLoadingMyFeeds = false;
      this.myFeedsSum = this.channels.length;
      this.refreshMyFeedsVisibleareaImageV2(this.channels);
      let followedList = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.OTHER_CHANNEL) || [];
      this.followers = followedList.length;
    } catch (error) {
      this.isLoadingMyFeeds = false;
    }
  }

  initLike() {
    // 赞/收藏
    this.initRefresh();
  }

  async initRefresh() {
    this.totalLikeList = await this.sortLikeList();
    this.likeSum = this.totalLikeList.length;
    let data = UtilService.getPostformatPageData(this.pageSize, this.pageNumber, this.totalLikeList);
    if (data.currentPage === data.totalPage) {
      this.likeList = data.items;
      this.infiniteScroll.disabled = true;
    } else {
      this.likeList = data.items;
      this.infiniteScroll.disabled = false;
    }
    this.isLoadingLike = false;
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isLoadAvatarImage = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.refreshImageV2(this.likeList);
  }

  async refreshLikeList() {
    // if (this.pageSize === 1) {
    //   this.initRefresh();
    //   return;
    // }
    this.totalLikeList = await this.sortLikeList();
    this.likeSum = this.totalLikeList.length;
    if (this.totalLikeList.length === this.likeList.length) {
      this.likeList = this.totalLikeList;
    } else if (this.totalLikeList.length - this.pageNumber * this.pageSize > 0) {
      this.likeList = this.likeList.slice(0, this.pageSize * this.pageNumber);
    } else {
      this.likeList = this.totalLikeList;
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isLoadAvatarImage = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.refreshImageV2(this.likeList);
  }

  async sortLikeList() {
    let likeList = [];
    try {
      let likes: FeedsData.LikeV3[] = await this.dataHelper.getSelfAllLikeV3Data() || [];
      for (let likeIndex = 0; likeIndex < likes.length; likeIndex++) {
        let item = likes[likeIndex];
        if (item.commentId === '0' && item.status === FeedsData.PostCommentStatus.available) {
          let post = await this.dataHelper.getPostV3ById(item.postId) || null;
          if (post != null) {
            likeList.push(post);
          }
        }
      }
    } catch (error) {

    }

    likeList = _.sortBy(likeList, (item: any) => {
      return -item.createdAt;
    });

    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    if (!this.hideDeletedPosts) {
      likeList = _.filter(likeList, (item: any) => {
        return item.status != 1;
      });
    }
    return likeList;
  }

  async addProflieEvent() {
    //this.updateWalletAddress("");
    this.events.subscribe(FeedsEvent.PublishType.clickDisconnectWallet, () => {
      this.walletAddress = '';
      this.walletAddressStr = '';
      this.ownNftSum = 0;
    });
    this.events.subscribe(FeedsEvent.PublishType.nftUpdatePrice, async (nftPrice) => {
      // this.price = nftPrice;
      //await this.getCollectiblesList();
    });
    this.events.subscribe(FeedsEvent.PublishType.nftdisclaimer, () => {

      let accAdress = this.nftContractControllerService.getAccountAddress() || "";
      if (accAdress === "") {
        this.connectWallet();
        return;
      }
      this.native.navigateForward(['mintnft'], {});
    });


    this.events.subscribe(FeedsEvent.PublishType.startLoading, (obj) => {

      let title = obj["title"];
      let des = obj["des"];
      let curNum = obj["curNum"];
      let maxNum = obj["maxNum"];

      let textObj = {
        "isLoading": true,
        "loadingTitle": title,
        "loadingText": des,
        "loadingCurNumber": curNum,
        "loadingMaxNumber": maxNum
      }
      this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);

    });

    this.events.subscribe(FeedsEvent.PublishType.endLoading, (obj) => {
      let textObj = {
        "isLoading": false,
      }
      this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      let type = obj['type'];
      let burnNum = obj["burnNum"] || "0";
      let sellQuantity = obj["sellQuantity"] || "0";
      let assItem = obj['assItem'];
      let createAddr = this.nftContractControllerService.getAccountAddress();
      Logger.log(TAG, 'Update asset item', assItem);
      Logger.log(TAG, 'this.collectiblesList', this.collectiblesList);

      //let saleOrderId = assItem['saleOrderId'];
      let tokenId = assItem['tokenId'];
      switch (type) {
        case 'transfer':
          let transferNum = obj["transferNum"];
          this.handleNftTransfer(tokenId, createAddr, transferNum);
          break;
        case 'burn':
          this.handleNftBurn(tokenId, createAddr, burnNum);
          break;
        case 'created':
          this.handleCreate(tokenId, createAddr, assItem, sellQuantity);
          break;
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.nftCancelOrder, async assetItem => {

      let saleOrderId = assetItem.saleOrderId;
      let sellerAddr = assetItem.sellerAddr;
      let tokenId = assetItem.tokenId;

      let curTokenNum = await this.nftContractControllerService
        .getSticker().balanceOf(tokenId);

      let createAddr = this.nftContractControllerService.getAccountAddress();
      assetItem['fixedAmount'] = null;
      assetItem['moreMenuType'] = 'created';
      let clist = this.nftPersistenceHelper.getCollectiblesList(createAddr);
      this.handleCancelOrder(tokenId, curTokenNum, assetItem, createAddr, saleOrderId, clist, sellerAddr);
    });

    this.events.subscribe(
      FeedsEvent.PublishType.walletAccountChanged,
      (walletAccount) => {
        this.zone.run(async () => {
          this.updateWalletAddress(walletAccount);
          //await this.getOwnNftSum();
          if (walletAccount != '') {
            await this.getCollectiblesList();
          }
        });
      },
    );


    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    this.clientHeight = screen.availHeight;
    this.clientWidth = screen.availWidth;
    this.curItem = {};
    this.changeType(this.selectType);

    this.events.subscribe(FeedsEvent.PublishType.hideDeletedPosts, () => {
      this.zone.run(() => {
        this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
        this.refreshLikeList();
      });
    });


    let signInData = await this.dataHelper.getSigninData();
    let nickname = signInData['nickname'] || '';
    if (nickname != '' && nickname != 'Information not provided') {
      this.name = nickname;
    } else {
      this.name = signInData['name'] || '';
    }
    this.description = signInData['description'] || '';
    // let userDid = signInData['did'] || '';
    this.updateUserAvatar();
    let avatar = this.avatar || null;
    if (avatar === null) {
      this.hiveVaultController.refreshAvatar().then(async () => { await this.updateUserAvatar() }).catch(async () => { await this.updateUserAvatar() });
    }

    this.events.subscribe(FeedsEvent.PublishType.updateLikeList, list => {
      this.zone.run(() => {
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.channelsDataUpdate, () => {
      this.zone.run(() => {
        this.initMyFeeds();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish, (comment: FeedsData.CommentV3) => {
      let postId = comment.postId;
      this.commentNumMap[postId] = this.commentNumMap[postId] + 1;
    });

    this.events.subscribe(FeedsEvent.PublishType.editPostFinish, () => {
      this.zone.run(() => {
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, (deletePostEventData: any) => {
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        try {
          let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(deletePostEventData.postId);
          this.hiveVaultController.deletePost(post).then(async (result: any) => {
            let newList = await this.sortLikeList();
            let deletePostIndex = _.findIndex(newList, (item: any) => {
              return item.postId === result.postId;
            })
            if (deletePostIndex > -1) {
              newList[deletePostIndex].status = 1;
            }
            this.removeLikeObserveList();
            this.refreshLikeList();
            this.native.hideLoading();
          }).catch((err: any) => {
            this.native.hideLoading();
          })
        } catch (error) {
          this.native.hideLoading();
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      // if (this.menuService.postDetail != null) {
      //   this.menuService.hideActionSheet();
      //   this.showMenuMore(this.curItem);
      // }

      this.menuService.hideActionSheet();
      this.showMenuMore(this.curItem);
    });

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.curPostId = '';
      this.pauseAllVideo();
    });

    this.events.subscribe(FeedsEvent.PublishType.tabSendPost, () => {
      this.hideSharMenuComponent = false;
      document.getElementById("feedstab").style.display = "block";
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.pauseAllVideo();
    });

  }

  async ionViewWillEnter() {
    this.theme.setTheme1();//改变状态栏
    this.initTitleBar();
    // this.elaPrice = this.dataHelper.getElaUsdPrice();
    this.events.subscribe(FeedsEvent.PublishType.addProflieEvent, async () => {
      this.theme.setTheme1();//改变状态栏
      // this.elaPrice = this.dataHelper.getElaUsdPrice();
      // if (!this.collectiblesList || this.collectiblesList.length == 0) {
      //   await this.getCollectiblesList();
      // }

      this.addProflieEvent();
      this.isAddProfile = true;
    });

    this.addProflieEvent();
    //this.changeType(this.selectType);
    // if (!this.collectiblesList || this.collectiblesList.length == 0) {
    //   await this.getCollectiblesList();
    // }


    // this.totalLikeList = await this.sortLikeList() || [];
    // this.likeSum = this.totalLikeList.length;
  }

  ionViewDidEnter() {
    let appProfile: HTMLBaseElement = document.querySelector("app-profile") || null;
    if (appProfile != null) {
      appProfile.style.backgroundColor = "#010101";
    }
  }

  ionViewWillLeave() {
    let appProfile: HTMLBaseElement = document.querySelector("app-profile") || null;
    if (appProfile != null) {
      appProfile.removeAttribute("style");
    }
    this.events.unsubscribe(FeedsEvent.PublishType.addProflieEvent);
    this.clearData();
  }

  initTitleBar() {
    let title = this.translate.instant('FeedsPage.tabTitle2');
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  clearAssets() {
    this.removeImages();
    this.removeAllVideo();
    CommonPageService.removeAllAvatar(this.isLoadAvatarImage, 'likeChannelAvatar');
    CommonPageService.removeAllAvatar(this.myFeedsIsLoadimage, 'myFeedsAvatar');
    this.myFeedsIsLoadimage = {};
    this.isLoadimage = {};
    this.isLoadAvatarImage = {};
    this.isLoadVideoiamge = {};
    this.myFeedsIsLoadimage = {};
    this.downMyFeedsAvatarMap = {};
  }

  clearData(isClearAssets: boolean = true) {
    this.clearRefreshMyFeedsSid();
    this.clearRefreshImageSid();
    this.theme.restTheme();
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.isAddProfile = false;
    this.hideSharMenuComponent = false;
    document.getElementById("feedstab").style.display = "block";
    this.events.unsubscribe(FeedsEvent.PublishType.updateLikeList);
    this.events.unsubscribe(FeedsEvent.PublishType.channelsDataUpdate);

    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.tabSendPost);
    this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.walletAccountChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.events.unsubscribe(FeedsEvent.PublishType.nftdisclaimer);

    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdatePrice);
    this.events.unsubscribe(FeedsEvent.PublishType.clickDisconnectWallet);
    this.postImgMap = {};
    this.postTime = {};
    this.clearDownStatus();
    this.native.hideLoading();
    if (isClearAssets) {
      this.clearAssets();
    }

    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.curItem = {};
    this.curPostId = '';
    this.isLoadChannelNameMap = {};
    this.removeMyFeedsObserveList();
    this.removeLikeObserveList();
  }

  clearDownStatus() {
    this.isImgPercentageLoading[this.imgDownStatusKey] = false;
    this.isImgLoading[this.imgDownStatusKey] = false;
    this.imgDownStatus[this.imgDownStatusKey] = '';
    this.imgPercent = 0;
    this.imgRotateNum['transform'] = 'rotate(0deg)';

    this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
    this.isVideoLoading[this.videoDownStatusKey] = false;
    this.videoDownStatus[this.videoDownStatusKey] = '';
    this.videoPercent = 0;
    this.videoRotateNum = 'rotate(0deg)';
  }

  async changeType(type: string) {
    this.pauseAllVideo();
    this.selectType = type;
    this.hideSharMenuComponent = false;
    document.getElementById("feedstab").style.display = "block";
    switch (type) {
      case 'ProfilePage.myFeeds':
        this.closeFullSrceenPost();
        this.removeMyFeedsObserveList();
        this.clearRefreshImageSid();
        this.initMyFeeds();
        break;
      case 'ProfilePage.collectibles':
        this.elaPrice = this.dataHelper.getElaUsdPrice();
        //if (!this.collectiblesList || this.collectiblesList.length == 0)
        await this.getCollectiblesList();
        break;
      case 'ProfilePage.myLikes':
        this.removeLikeObserveList();
        this.clearRefreshMyFeedsSid();
        this.pageSize = 1;
        this.initLike();
        break;
    }

    this.isRefreshingCollectibles = false;
  }

  async doRefresh(event: any) {
    this.hiveVaultController.refreshAvatar().then(async () => { await this.updateUserAvatar() }).catch(async () => { await this.updateUserAvatar() });
    switch (this.selectType) {
      case 'ProfilePage.myFeeds':
        try {

          const did = (await this.dataHelper.getSigninData()).did;
          const selfchannels = await this.hiveVaultController.syncSelfChannel(did);

          for (let index = 0; index < selfchannels.length; index++) {
            const selfchannel = selfchannels[index];
            await this.hiveVaultController.querySubscriptionChannelById(selfchannel.destDid, selfchannel.channelId);
          }
          await this.hiveVaultController.syncSubscribedChannelFromBackup();
          this.isLoadSubscriptionV3Num = {};
          this.isLoadChannelNameMap = {};
          this.removeMyFeedsObserveList();
          await this.initMyFeeds(selfchannels);
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }
        break;
      case 'ProfilePage.collectibles':
        try {
          await this.refreshCollectibles();
          this.refreshCollectiblesVisibleareaImage();
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }

        break;
      case 'ProfilePage.myLikes':
        try {
          await this.hiveVaultController.syncAllLikeData();
          this.removeLikeObserveList();
          this.pageSize = 1;
          this.isLoadHandleDisplayNameMap = {};
          this.likeList = [];
          this.handleDisplayNameMap = {};
          this.postImgMap = {};
          this.initLike();
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }
        break;
    }
  }

  loadData(event: any) {
    switch (this.selectType) {
      case 'ProfilePage.myFeeds':
        event.target.complete();
        break;
      case 'ProfilePage.collectibles':
        this.zone.run(async () => {
          this.collectiblesPageNum++;
          let list = await this.nftContractHelperService.loadCollectiblesData(null, this.collectiblesPageNum, this.sortType);

          list = _.unionWith(this.collectiblesList, list, _.isEqual);
          // this.collectiblesList = this.nftContractHelperService.sortData(list, this.sortType);

          this.refreshCollectiblesVisibleareaImage();
          event.target.complete();
        });
        break;
      case 'ProfilePage.myLikes':
        let sid = setTimeout(() => {
          this.pageSize++;
          let data = UtilService.getPostformatPageData(this.pageSize, this.pageNumber, this.totalLikeList);
          if (data.currentPage === data.totalPage) {
            this.likeList = this.likeList.concat(data.items);
            event.target.disabled = true;
          } else {
            this.likeList = this.likeList.concat(data.items);
          }
          this.refreshImageV2(data.items);
          clearTimeout(sid);
          event.target.complete();
        }, 500);
        break;
    }
  }

  async showMenuMore(item: any) {
    this.pauseAllVideo();
    this.curItem = item;
    switch (item['tabType']) {
      case 'myfeeds':
        this.isShowTitle = true;
        this.isShowInfo = true;
        this.isShowQrcode = true;
        this.isPreferences = true;
        this.isShowUnfollow = false;
        this.channelName = item.channelName;
        this.qrCodeString = await this.getQrCodeString(item);
        this.hideSharMenuComponent = true;
        document.getElementById("feedstab").style.display = "none";
        break;
      case 'myfollow':
        this.isShowTitle = true;
        this.isShowInfo = true;
        this.isShowQrcode = true;
        this.isPreferences = false;
        this.isShowUnfollow = true;
        this.channelName = item.channelName;
        this.qrCodeString = await this.getQrCodeString(item);
        this.hideSharMenuComponent = true;
        break;
      case 'mylike':
        this.qrCodeString = await this.getQrCodeString(item);
        this.userDid = (await this.dataHelper.getSigninData()).did || '';
        this.isShowTitle = false;
        this.isShowInfo = false;
        this.isPreferences = false;
        this.isShowQrcode = false;
        this.isShowUnfollow = true;
        this.hideSharMenuComponent = true;
        document.getElementById("feedstab").style.display = "none";
        break;
    }
  }

  showComment(commentParams: any) {
    this.postId = commentParams.postId;
    this.channelId = commentParams.channelId;
    this.destDid = commentParams.destDid;
    this.channelAvatar = commentParams.channelAvatar;
    this.channelName = commentParams.channelName;
    this.hideComment = false;
  }

  hideComponent(event) {
    this.postId = null;
    this.channelId = null;
    this.destDid = null;
    this.channelAvatar = null;
    this.channelName = null;
    this.hideComment = true;
    document.getElementById("feedstab").style.display = "block";
  }

  ionScroll() {
    // if (this.selectType === 'ProfilePage.myLikes') {
    //   this.setVisibleareaImageV2();
    // } else if (this.selectType === 'ProfilePage.collectibles') {
    //   this.native.throttle(this.setCollectiblesVisibleareaImage(), 200, this, true);
    // } else if (this.selectType === 'ProfilePage.myFeeds') {
    //   this.setMyFeedsVisibleareaImageV2();
    // }
  }

  async handleMyFeedsAvatarV2(destDid: string, channelId: string) {
    let id = destDid + "-" + channelId;
    let isload = this.myFeedsIsLoadimage[id] || '';
    if (isload === "") {
      let arr = id.split("-");
      this.myFeedsIsLoadimage[id] = '11';
      let destDid = arr[0];
      let channelId = arr[1];
      let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      let avatarUri = "";
      if (channel != null) {
        avatarUri = channel.avatar;
      }
      let fileName: string = avatarUri.split("@")[0];
      this.downMyFeedsAvatarMap[fileName] = fileName;
      this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
        this.zone.run(() => {
          let srcData = data || "";
          if (srcData != "") {
            this.myFeedsIsLoadimage[id] = '13';
            this.myFeedAvatarMap[id] = data;
          } else {
            this.myFeedsIsLoadimage[id] = '13';
          }
        });
      }).catch((err) => {
        this.myFeedsIsLoadimage[id] = '';
      });
    }


  }

  setCollectiblesVisibleareaImage() {
    let profileCollectibles = document.getElementById("profileCollectibles") || null;
    if (profileCollectibles === null) {
      return;
    }
    let profileCollectiblesCol = profileCollectibles.getElementsByClassName("profileCollectiblesCol") || null;
    let len = profileCollectiblesCol.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = profileCollectiblesCol[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let arr = id.split("-");
      let fileName = arr[0];
      let kind = arr[1];
      let size = arr[2];
      let thumbImage = document.getElementById(fileName + "-profileImg");
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.profileCollectiblesisLoadimage[fileName] || '';
      try {
        if (
          id != '' &&
          thumbImage.getBoundingClientRect().top >= - Config.rectTop &&
          thumbImage.getBoundingClientRect().bottom <= Config.rectBottom
        ) {
          if (isload === "") {
            //  if (kind == 'gif' && size && parseInt(size, 10) > 10 * 1000 * 1000) {
            //    Logger.log(TAG, 'Work around, Not show');
            //    continue;
            //  }

            let fetchUrl = this.ipfsService.getNFTGetUrl() + fileName;
            this.profileCollectiblesisLoadimage[fileName] = '12';
            this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
              this.zone.run(() => {
                this.profileCollectiblesisLoadimage[fileName] = '13';
                let srcData = data || "";
                if (srcData != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.profileCollectiblesisLoadimage[fileName] === '13') {
                this.profileCollectiblesisLoadimage[fileName] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });
          }
        } else {
          srcStr = thumbImage.getAttribute('src') || './assets/icon/reserve.svg';
          if (
            thumbImage.getBoundingClientRect().top < - Config.rectTop ||
            thumbImage.getBoundingClientRect().bottom > Config.rectBottom &&
            this.profileCollectiblesisLoadimage[fileName] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.profileCollectiblesisLoadimage[fileName] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        if (this.profileCollectiblesisLoadimage[fileName] === '13') {
          this.profileCollectiblesisLoadimage[fileName] = '';
          thumbImage.setAttribute('src', './assets/icon/reserve.svg');
        }
      }
    }

  }

  refreshCollectiblesVisibleareaImage() {
    if (this.selectType === "ProfilePage.collectibles") {
      let sid = setTimeout(() => {
        this.profileCollectiblesisLoadimage = {};
        this.setCollectiblesVisibleareaImage();
        clearTimeout(sid);
      }, 100);
    }
  }

  refreshMyFeedsVisibleareaImageV2(list = []) {
    if (this.selectType === "ProfilePage.myFeeds") {
      if (this.refreshMyFeedsSid != null) {
        return;
      }
      this.refreshMyFeedsSid = setTimeout(() => {
        this.myFeedsIsLoadimage = {};
        this.getMyFeedsObserverList(list);
        this.clearRefreshMyFeedsSid();
      }, 100);
    }
  }

  clearRefreshMyFeedsSid() {
    if (this.refreshMyFeedsSid != null) {
      clearTimeout(this.refreshMyFeedsSid);
      this.refreshMyFeedsSid = null;
    }
  }



  handleId(item: any) {
    let version = item['version'] || "1";
    let thumbnailUri = "";
    let kind = "";
    let size = "";
    if (version === "1") {

      thumbnailUri = item['thumbnail'] || "";
      kind = item["kind"];
      size = item["originAssetSize"];
      if (!size)
        size = '0';
      if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
        thumbnailUri = item['asset'] || "";
      }
    } else if (version === "2") {
      let jsonData = item['data'] || "";
      if (jsonData != "") {
        thumbnailUri = jsonData['thumbnail'] || "";
        kind = jsonData["kind"];
        size = jsonData["size"];
        if (!size)
          size = '0';
        if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
          thumbnailUri = jsonData['image'] || "";
        }
      } else {
        thumbnailUri = "";
      }
    }

    if (thumbnailUri === "") {
      return "";
    }

    if (thumbnailUri.indexOf('feeds:imgage:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:imgage:', '');
    } else if (thumbnailUri.indexOf('feeds:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:image:', '');
    } else if (thumbnailUri.indexOf('pasar:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('pasar:image:', '');
    }
    return thumbnailUri + "-" + kind + "-" + size + "-profile";
  }

  async handlePostImgV2(destDid: string, channelId: string, postId: string) {
    // 13 存在 12不存在 postImgMap
    let id = destDid + "-" + channelId + '-' + postId;
    let isload = this.isLoadimage[id] || '';
    let rpostImage = document.getElementById(id + 'likerow');
    if (isload === '') {
      this.isLoadimage[id] = '11';
      let post = this.postMap[postId] || null;
      if (post === null) {
        post = await this.dataHelper.getPostV3ById(postId) || null;
        this.postMap[postId] = post;
      }
      if (post === null) {
        this.isLoadimage[id] = '13';
        return;
      }
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //缩略图
      let thumbnailKey = elements.thumbnailPath || '';
      //原图
      let imageKey = elements.originMediaPath || '';
      let type = elements.type || '';
      if (thumbnailKey === '' || imageKey === '') {
        this.isLoadimage[id] = '13';
        return;
      }
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileOriginName: string = imageKey.split("@")[0];
      let fileThumbnaiName: string = thumbnailKey.split("@")[0];

      //原图
      this.hiveVaultController.
        getV3Data(destDid, imageKey, fileOriginName, type, "false")
        .then(imagedata => {
          let realImage = imagedata || '';
          if (realImage != '') {
            this.isLoadimage[id] = '13';
            this.postImgMap[id] = realImage;
          } else {
            this.hiveVaultController.
              getV3Data(destDid, thumbnailKey, fileThumbnaiName, type)
              .then((thumbImagedata) => {
                let thumbImage = thumbImagedata || '';
                if (thumbImage != '') {
                  this.isLoadimage[id] = '13';
                  this.postImgMap[id] = thumbImage;
                } else {
                  this.isLoadimage[id] = '12';
                  rpostImage.style.display = 'none';
                }
              }).catch(() => {
                rpostImage.style.display = 'none';
              })
          }
        })
        .catch(reason => {
          this.isLoadimage[id] = '';
          rpostImage.style.display = 'none';
          Logger.error(TAG,
            "Excute 'handlePostImg' in profile page is error , get data error, error msg is ",
            reason
          );
        });
    }
  }

  async handlePostAvatarV2(destDid: string, channelId: string) {
    // 13 存在 12不存在
    let id = destDid + "-" + channelId;
    let isload = this.isLoadAvatarImage[id] || '';
    if (isload === '') {
      this.isLoadAvatarImage[id] = '11';
      let avatarUri = "";
      let key = destDid + "-" + channelId;
      let channel: FeedsData.ChannelV3 = this.channelMap[key] || null;
      if (channel === null) {
        channel = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
        this.channelMap[key] = channel;
      } else {
        channel = this.channelMap[key];
      }
      if (channel != null) {
        avatarUri = channel.avatar;
      }
      let fileName: string = avatarUri.split("@")[0];
      //头像
      this.hiveVaultController.
        getV3Data(destDid, avatarUri, fileName, "0",)
        .then(imagedata => {
          let realImage = imagedata || '';
          if (realImage != '') {
            this.likeAvatarMap[id] = realImage;
            this.isLoadAvatarImage[id] = "13";
          } else {
            this.isLoadAvatarImage[id] = "13";
          }
        })
        .catch(reason => {

          this.isLoadAvatarImage[id] = '';
          Logger.error(TAG,
            "Excute 'handlePostAvatar' in home page is error , get image data error, error msg is ",
            reason
          );
        });
    }
  }

  async handleVideoV2(destDid: string, channelId: string, postId: string) {
    let id = destDid + "-" + channelId + "-" + postId;
    let isloadVideoImg = this.isLoadVideoiamge[id] || '';
    let video: any = document.getElementById(id + 'videolike');
    let source: any = document.getElementById(id + 'sourcelike') || '';
    let downStatus = this.videoDownStatus[id] || '';
    if (id != '' && source != '' && downStatus === '') {
      this.pauseVideo(id);
    }

    if (isloadVideoImg === '') {
      this.isLoadVideoiamge[id] = '11';
      let post = this.postMap[postId] || null;
      if (post === null) {
        post = await this.dataHelper.getPostV3ById(postId) || null;
        this.postMap[postId] = post;
      }
      if (post === null) {
        this.isLoadVideoiamge[id] = '13';
        return;
      }
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];

      //缩略图
      let videoThumbnailKey = elements.thumbnailPath || '';
      if (videoThumbnailKey === '') {
        this.isLoadVideoiamge[id] = '13';
        return;
      }
      //原图
      //let imageKey = elements.originMediaPath;
      let type = elements.type;
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileName: string = videoThumbnailKey.split("@")[0];
      this.hiveVaultController
        .getV3Data(destDid, videoThumbnailKey, fileName, type)
        .then(imagedata => {
          let image = imagedata || '';
          if (image != '') {
            this.isLoadVideoiamge[id] = '13';
            video.setAttribute('poster', image);
            this.setFullScreen(id);
            this.setOverPlay(id, id, post);
          } else {
            this.isLoadVideoiamge[id] = '12';
            //video.style.display = 'none';
            //vgplayer.style.display = 'none';
          }
        })
        .catch(reason => {
          //vgplayer.style.display = 'none';
          this.isLoadVideoiamge[id] = '';
          Logger.error(TAG,
            "Excute 'hanldVideo' in profile page is error , get video data error, error msg is ",
            reason
          );
        });
    }
  }

  refreshImageV2(likeList = []) {
    this.clearRefreshImageSid();
    this.refreshImageSid = setTimeout(() => {
      this.getLikeObserverList(likeList);
      this.clearRefreshImageSid();
    }, 100);
  }

  clearRefreshImageSid() {
    if (this.refreshImageSid != null) {
      clearTimeout(this.refreshImageSid);
      this.refreshImageSid = null;
    }
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'videolike') || '';
    let source: any = document.getElementById(id + 'sourcelike') || '';
    if (videoElement != '' && source != '') {
      if (!videoElement.paused) {
        //判断是否处于暂停状态
        videoElement.pause();
      }
    }
  }

  pauseAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        let downStatus = this.videoDownStatus[id] || '';
        if (downStatus === '') {
          this.pauseVideo(id);
        }
      }
    }
  }

  removeAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        // let videoElement: any = document.getElementById(id + 'videolike') || '';
        // if (videoElement != '') {
        //     videoElement.setAttribute('poster', "./assets/images/loading.png"); // empty source
        // }
        let source: any = document.getElementById(id + 'sourcelike') || '';
        let sourcesrc = '';
        if (source != '') {
          sourcesrc = source.getAttribute('src') || '';
        }
        if (source != '' && sourcesrc != '') {
          source.removeAttribute('src'); // empty source
        }
      }
    }
  }

  setFullScreen(id: string) {
    let vgfullscreen = document.getElementById(id + 'vgfullscreelike');
    vgfullscreen.onclick = async () => {
      this.pauseVideo(id);
      let postImg: string = document
        .getElementById(id + 'videolike')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById(id + 'sourcelike')
        .getAttribute('src');
      await this.native.setVideoFullScreen(postImg, videoSrc);
    };
  }

  removeImages() {
    // let iamgseids = this.isLoadimage;
    // for (let id in iamgseids) {
    //   let value = iamgseids[id] || '';
    //   if (value === '13') {
    //     let imgElement: any = document.getElementById(id + 'postimglike') || '';
    //     if (imgElement != '') {
    //       //imgElement.setAttribute('src', 'assets/images/loading.png');
    //     }
    //   }
    // }
  }

  setOverPlay(id: string, srcId: string, post: FeedsData.PostV3) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaylike') || '';
    let source: any = document.getElementById(id + 'sourcelike') || '';

    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.getVideo(id, srcId, post);
          }
        });
      };
    }
  }

  getVideo(id: string, srcId: string, post: FeedsData.PostV3) {
    let arr = srcId.split('-');
    let destDid = arr[0];
    let channelId: any = arr[1];
    let postId: any = arr[2];

    let videoId = destDid + '-' + channelId + '-' + postId + 'vgplayerlike';
    let videoObj = document.getElementById(videoId);
    let videoWidth = videoObj.clientWidth;
    let videoHeight = videoObj.clientHeight;
    this.videoloadingStyleObj['z-index'] = 999;
    this.videoloadingStyleObj['position'] = 'absolute';
    this.videoloadingStyleObj['left'] =
      (videoWidth - this.roundWidth) / 2 + 'px';
    this.videoloadingStyleObj['top'] =
      (videoHeight - this.roundWidth) / 2 + 'px';
    this.videoCurKey = destDid + '-' + channelId + '-' + postId;
    this.isVideoLoading[this.videoCurKey] = true;

    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let originKey = elements.originMediaPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = originKey.split("@")[0];
    this.hiveVaultController
      .getV3Data(destDid, originKey, fileName, type, "false")
      .then((videoResult: string) => {
        this.zone.run(() => {
          let videodata = videoResult || '';
          if (videodata == '') {

            if (this.isExitDown()) {
              this.isVideoLoading[this.videoDownStatusKey] = false;
              this.isVideoLoading[this.videoCurKey] = false;
              this.pauseVideo(id);
              this.openAlert();
              return;
            }

            this.videoDownStatusKey = destDid + '-' + channelId + '-' + postId;
            this.videoDownStatus[this.videoDownStatusKey] = '1';
            this.isVideoLoading[this.videoDownStatusKey] = true;
            this.isVideoPercentageLoading[this.videoDownStatusKey] = false;

            this.hiveVaultController
              .getV3Data(destDid, originKey, fileName, type)
              .then((downVideoResult: string) => {
                let downVideodata = downVideoResult || '';
                if (downVideodata != '') {
                  this.videoDownStatus[this.videoDownStatusKey] = '';
                  this.isVideoLoading[this.videoCurKey] = false;
                  this.loadVideo(id, downVideodata);
                }
              }).catch((err) => {
                this.videoDownStatus[this.videoDownStatusKey] = '';
                this.isVideoLoading[this.videoCurKey] = false;
                this.isVideoLoading[this.videoDownStatusKey] = false;
                this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
                this.pauseVideo(id);
              });
            return;
          }
          this.videoDownStatus[this.videoDownStatusKey] = '';
          this.isVideoLoading[this.videoCurKey] = false;
          this.loadVideo(id, videodata);
        });
      }).catch((err) => {
        this.videoDownStatus[this.videoDownStatusKey] = '';
        this.isVideoLoading[this.videoCurKey] = false;
      });
  }

  loadVideo(id: string, videodata: string) {
    let source: any = document.getElementById(id + 'sourcelike') || '';
    if (source === '') {
      return;
    }
    source.setAttribute('src', videodata);
    let vgoverlayplay: any = document.getElementById(id + 'vgoverlayplaylike');
    let video: any = document.getElementById(id + 'videolike');
    let vgcontrol: any = document.getElementById(id + 'vgcontrolslike');
    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgoverlayplay.style.display = 'block';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('play', () => {
      vgcontrol.style.display = 'block';
    });

    video.addEventListener('canplay', () => {
      video.play();
    });
    video.load();
  }

  showBigImage(item: any) {
    this.pauseAllVideo();
    this.zone.run(async () => {
      let imagesId =
        item.destDid + '-' + item.channelId + '-' + item.postId + 'postimglike';
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 'px';
      this.imgCurKey = item.nodeId + '-' + item.channelId + '-' + item.postId;
      this.isImgLoading[this.imgCurKey] = true;

      let post = await this.dataHelper.getPostV3ById(item.postId);
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //原图
      let imageKey = elements.originMediaPath;
      let type = elements.type;
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileOriginName: string = imageKey.split("@")[0];
      //原图
      this.hiveVaultController
        .getV3Data(item.destDid, imageKey, fileOriginName, type, "false")
        .then(async realImg => {
          let img = realImg || '';
          if (img != '') {
            this.isImgLoading[this.imgCurKey] = false;
            this.postImgMap[this.imgCurKey] = img;
            this.viewHelper.openViewer(
              this.titleBar,
              realImg,
              'common.image',
              'FeedsPage.tabTitle2',
              this.appService,
            );
          } else {
            this.isImgLoading[this.imgCurKey] = false;
            if (this.isExitDown()) {
              this.openAlert();
              return;
            }
            this.imgDownStatusKey =
              item.destDid + '-' + item.channelId + '-' + item.postId;

            this.imgDownStatusKey = item.destDid + '-' + item.channelId + '-' + item.postId;
            this.imgDownStatus[this.imgDownStatusKey] = '1';
            this.isImgPercentageLoading[this.imgCurKey] = true;
            this.hiveVaultController
              .getV3Data(item.destDid, imageKey, fileOriginName, type)
              .then(async realImg => {
                let img = realImg || '';
                this.isImgPercentageLoading[this.imgCurKey] = false;
                this.isImgLoading[this.imgCurKey] = false;
                this.imgDownStatus[this.imgDownStatusKey] = '';
                if (img != '') {
                  this.postImgMap[this.imgCurKey] = img;
                  this.viewHelper.openViewer(
                    this.titleBar,
                    realImg,
                    'common.image',
                    'FeedsPage.tabTitle2',
                    this.appService,
                  );
                }
              }).catch(() => {
                this.isImgPercentageLoading[this.imgCurKey] = false;
                this.isImgLoading[this.imgCurKey] = false;
                this.imgDownStatus[this.imgDownStatusKey] = '';
              });
          }
        });
    });
  }

  processGetBinaryResult(key: string, value: string) {
    this.native.hideLoading();
    if (key.indexOf('img') > -1) {
      this.imgDownStatus[this.imgDownStatusKey] = '';
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.imgPercent = 0;
      this.imgRotateNum['transform'] = 'rotate(0deg)';
      this.cacheGetBinaryRequestKey = '';
      let arrKey = key.split('-');
      let nodeId = arrKey[0];
      let channelId = arrKey[1];
      let postId = arrKey[2];
      let id = nodeId + "-" + channelId + "-" + postId;
      let postImage = document.getElementById(id + 'postimglike') || null;
      if (postImage != null) {
        postImage.setAttribute('src', value);
      }
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'FeedsPage.tabTitle1',
        this.appService,
      );
    } else if (key.indexOf('video') > -1) {
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.videoPercent = 0;
      this.videoRotateNum['transform'] = 'rotate(0deg)';
      this.curPostId = '';
      let arr = this.cacheGetBinaryRequestKey.split('-');
      let nodeId = arr[0];
      let channelId: any = arr[1];
      let postId: any = arr[2];
      let id = nodeId + '-' + channelId + '-' + postId;
      this.cacheGetBinaryRequestKey = '';
      this.loadVideo(id, value);
    }
  }

  isExitDown() {
    if (
      JSON.stringify(this.videoDownStatus) == '{}' &&
      JSON.stringify(this.imgDownStatus) == '{}'
    ) {
      return false;
    }

    for (let key in this.imgDownStatus) {
      if (this.imgDownStatus[key] != '') {
        return true;
      }
    }

    for (let key in this.videoDownStatus) {
      if (this.videoDownStatus[key] != '') {
        return true;
      }
    }

    return false;
  }

  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      'common.confirmDialog',
      'common.downDes',
      this.cancel,
      './assets/images/tskth.svg',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  profiledetail() {
    this.clearData();
    this.native.navigateForward('/menu/profiledetail', '');
  }

  async hideShareMenu(objParm: any) {
    let buttonType = objParm['buttonType'];
    let destDid = objParm['destDid'];
    let channelId = objParm['channelId'];
    switch (buttonType) {
      case 'unfollow':
        let connectStatus1 = this.dataHelper.getNetworkStatus();
        if (connectStatus1 === FeedsData.ConnState.disconnected) {
          this.native.toastWarn('common.connectionError');
          return;
        }
        // if (this.checkServerStatus(destDid) != 0) {
        //   this.native.toastWarn('common.connectionError1');
        //   return;
        // }
        await this.native.showLoading("common.waitMoment");
        try {
          this.hiveVaultController.unSubscribeChannel(
            destDid, channelId
          ).then(async (result) => {
            let channel: FeedsData.SubscribedChannelV3 = {
              destDid: destDid,
              channelId: channelId
            };
            //await this.hiveVaultController.removePostListByChannel(destDid, channelId);
            this.events.publish(FeedsEvent.PublishType.unfollowFeedsFinish, channel);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          });
        } catch (error) {
          this.native.hideLoading();
        }

        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        document.getElementById("feedstab").style.display = "block";
        break;
      case 'share':
        if (this.selectType === 'ProfilePage.myFeeds') {
          const myDestDid = this.curItem['destDid'];
          const myChannelId = this.curItem['channelId'];
          this.hideSharMenuComponent = false;
          document.getElementById("feedstab").style.display = "block";
          await this.native.showLoading("common.generateSharingLink");
          try {
            let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(myDestDid, myChannelId) || null;
            const sharedLink = await this.intentService.createChannelShareLink(channel);
            const title = this.intentService.createShareChannelTitle(myDestDid, myChannelId, channel) || "";
            this.intentService.share(title, sharedLink);
          } catch (error) {
          }

          this.native.hideLoading();
          document.getElementById("feedstab").style.display = "block";
          return;
        }
        if (this.selectType === 'ProfilePage.myLikes') {
          destDid = this.curItem['destDid'];
          channelId = this.curItem['channelId'];
          let postId = this.curItem['postId'];
          let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(postId) || null;
          let postContent = '';
          if (post != null) {
            postContent = post.content.content || "";
          }

          this.hideSharMenuComponent = false;
          document.getElementById("feedstab").style.display = "block";
          await this.native.showLoading("common.generateSharingLink");
          try {
            //share post
            const sharedLink = await this.intentService.createPostShareLink(post);
            this.intentService.share(this.intentService.createSharePostTitle(post), sharedLink);
          } catch (error) {
          }
          this.native.hideLoading();

          return;
        }
        this.native.toast('common.comingSoon');
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
        this.clearData();
        this.native.navigateForward(['feedspreferences'], {
          queryParams: {
            nodeId: this.shareDestDid,
            feedId: this.shareChannelId,
          },
        });
        this.hideSharMenuComponent = false;
        document.getElementById("feedstab").style.display = "block";
        break;
      case 'cancel':
        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        document.getElementById("feedstab").style.display = "block";
        break;
    }
    let sharemenu: HTMLElement = document.querySelector("app-sharemenu") || null;
    if (sharemenu != null) {
      sharemenu.remove();
    }
  }

  async getQrCodeString(feed: any) {
    let destDid = feed['destDid'];
    this.shareDestDid = destDid;
    let channelId = feed['channelId'] || '';
    this.shareChannelId = channelId;
    let qrcodeString = UtilService.generateFeedsQrCodeString(destDid, channelId);
    return qrcodeString;
  }

  async toPage(eventParm: any) {
    let destDid = eventParm['destDid'];
    let channelId = eventParm['channelId'];
    let postId = eventParm['postId'] || '';
    let page = eventParm['page'];
    this.clearData(true);
    if (postId != '') {
      this.native
        .getNavCtrl()
        .navigateForward([page, destDid, channelId, postId]);
    } else {
      this.native.getNavCtrl().navigateForward([page, destDid, channelId]);
    }
  }

  async clickAvatar(destDid: string, channelId: string) {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId);
    let followStatus = await this.checkFollowStatus(destDid, channelId);
    const displayName = channel.displayName || channel.name;
    let channelDesc = channel.intro;
    let channelSubscribes = 0;
    let feedAvatar = this.feedService.parseChannelAvatar(channel.avatar);
    if (feedAvatar.indexOf("@feeds/data/") > -1) {
      // d30054aa1d08abfb41c7225eb61f18e4@feeds/data/d30054aa1d08abfb41c7225eb61f18e4
      let imgKey = destDid + "-" + channelId;
      feedAvatar = this.myFeedAvatarMap[imgKey];
    }

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
      name: channel.name,
      des: channelDesc,
      followStatus: followStatus,
      channelSubscribes: channelSubscribes,
      updatedTime: channel.updatedAt,
      channelOwner: channel.destDid,
      ownerDid: ownerDid,
      tippingAddress: channel.tipping_address,
      displayName: displayName
    });
    this.clearData(true);
    this.native.navigateForward(['/eidtchannel'], '');
  }

  async checkFollowStatus(destDid: string, channelId: string) {
    let subscribedChannel: FeedsData.SubscribedChannelV3[] = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    if (subscribedChannel.length === 0) {
      return false;
    }

    let channelIndex = _.find(subscribedChannel, (item: FeedsData.SubscribedChannelV3) => {
      return item.destDid === destDid && item.channelId === channelId;
    }) || '';
    if (channelIndex === '') {
      return false;
    }
    return true;
  }

  async createPost() {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.clearData(true);
    const channels = await this.dataHelper.getSelfChannelListV3() || []
    if (channels.length === 0) {
      this.native.navigateForward(['/createnewfeed'], '');
      return;
    }

    this.dataHelper.setSelsectNftImage("");
    this.native.navigateForward(['createnewpost'], '');
  }

  async connectWallet() {
    await this.walletConnectControllerService.connect();
    //this.updateWalletAddress(null);
  }

  copyWalletAddr() {
    this.native
      .copyClipboard(this.walletAddress)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickWalletAddr() {
    this.walletDialog();
  }

  walletDialog() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'common.disconnectWallet',
      this.walletAddress,
      this.cancel,
      this.disconnect,
      './assets/images/tskth.svg',
      'common.disconnect',
    );
  }

  async disconnect(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      await that.walletConnectControllerService.disconnect();
      await that.walletConnectControllerService.destroyWalletConnect();
      await that.nftContractControllerService.init();
      that.walletAddress = '';
      that.walletAddressStr = '';
      that.ownNftSum = 0;
    }
  }

  updateWalletAddress(walletAccount: string) {
    if (!walletAccount)
      this.walletAddress = this.walletConnectControllerService.getAccountAddress();
    else
      this.walletAddress = walletAccount;
    Logger.log(TAG, 'Update WalletAddress', this.walletAddress);
    this.walletAddressStr = UtilService.resolveAddress(this.walletAddress);
    if (this.walletAddress === "") {
      this.ownNftSum = 0;
    }
  }

  subsciptions() {
    this.clearData(true);
    this.native.navigateForward(['subscriptions'], '');
  }

  chanelCollections() {
    let account = this.walletConnectControllerService.getAccountAddress() || null;
    if (account === null) {
      this.walletConnectControllerService.connect();
      return;
    }
    this.clearData();
    this.native.navigateForward(['channelcollections'], '');
  }

  async getOwnNftSum() {
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accAddress === '') {
      this.ownNftSum = 0;
      return;
    }
    try {
      this.notSaleOrderCount = await this.nftContractHelperService.getNotSaleTokenCount(accAddress);
      this.saleOrderCount = await this.nftContractHelperService.getSaleOrderCount(accAddress);
      this.ownNftSum = this.notSaleOrderCount + this.saleOrderCount;
    } catch (error) {
      this.ownNftSum = 0;
    }
  }

  async getCollectiblesList() {
    let accAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    if (accAddress === '') {
      this.collectiblesList = [];
      return;
    }
    let list = this.nftPersistenceHelper.getCollectiblesList(accAddress);
    if (list.length === 0) {
      await this.refreshCollectibles();
      this.refreshCollectiblesVisibleareaImage();
      return;
    }

    // this.collectiblesList = this.nftContractHelperService.sortData(list, this.sortType);
    this.collectiblesList = list;
    this.ownNftSum = this.collectiblesList.length;
    this.refreshCollectiblesVisibleareaImage();
  }



  async processNotOnSaleOrder(accAddress: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.notSaleOrderCount == 0) {
          this.refreshNotSaleOrderFinish = true;
          resolve('SUCCESS');
          return;
        }

        for (let index = 0; index < this.notSaleOrderCount; index++) {
          try {
            const item = await this.nftContractHelperService.getNotSellerCollectiblesFromContract(accAddress, index);
            this.refreshingCollectiblesHelper.push(item);
            this.collectiblesList = this.refreshingCollectiblesHelper;
            this.saveCollectiblesToCache(accAddress);
            // this.collectiblesList.push(item);
          } catch (error) {
            Logger.error(TAG, "Get not sale item error", error);
          }
        }

        this.refreshNotSaleOrderFinish = true;
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  async processOnSaleOrder(accAddress: string) {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.saleOrderCount == 0) {
          this.refreshSaleOrderFinish = true;
          resolve('SUCCESS');
          return;
        }

        for (let index = 0; index < this.saleOrderCount; index++) {
          try {
            const item = await this.nftContractHelperService.getSellerCollectibleFromContract(accAddress, index);
            this.refreshingCollectiblesHelper.push(item);
            this.collectiblesList = this.refreshingCollectiblesHelper;
            this.saveCollectiblesToCache(accAddress);
          } catch (error) {
            Logger.error("Get Sale item error", error);
          }
        }
        this.refreshSaleOrderFinish = true;
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  clickAssetItem(assetitem: any) {
    this.clearData();
    this.dataHelper.setAssetPageAssetItem(assetitem);
    this.native.navigateForward(['assetdetails'], {});
  }

  clickMore(parm: any) {
    let asstItem = parm['assetItem'];
    let type = asstItem['moreMenuType'];
    Logger.log(TAG, 'clickMore parm is', parm);
    switch (type) {
      case 'onSale':
        this.handleOnSale(asstItem);
        break;
      case 'created':
        this.handleCreated(asstItem);
        break;
    }
  }

  handleOnSale(asstItem: any) {
    this.menuService.showOnSaleMenu(asstItem);
  }

  handleCreated(asstItem: any) {
    this.menuService.showCreatedMenu(asstItem);
  }

  clickMint() {
    this.createNft();
  }

  async createNft() {
    let nftFirstdisclaimer = this.dataHelper.getNftFirstdisclaimer() || "";
    if (nftFirstdisclaimer === "") {
      this.viewHelper.showNftdisclaimerPrompt();
      return;
    }
    let accAdress = this.nftContractControllerService.getAccountAddress() || "";
    if (accAdress === "") {
      this.connectWallet();
      return;
    }
    this.clearData();
    this.native.navigateForward(['mintnft'], {});
  }

  getImageBase64(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.crossOrigin = '*';
      img.crossOrigin = "Anonymous";
      img.src = uri;

      img.onload = () => {
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let dataURL = canvas.toDataURL("image/*");
        resolve(dataURL);
      };
    });
  }

  handleImg(imgUri: string) {
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (imgUri.indexOf('feeds:image:') > -1) {
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (imgUri.indexOf('pasar:image:') > -1) {
      imgUri = imgUri.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    return imgUri;
  }

  async handleCreate(tokenId: any, createAddr: any, assItem: any, sellQuantity: any) {
    let quantity = await this.nftContractControllerService
      .getSticker()
      .balanceOf(tokenId);
    let list = this.nftPersistenceHelper.getCollectiblesList(createAddr);
    // let cpList = this.nftPersistenceHelper.getPasarList();
    let cpItem = _.cloneDeep(assItem);
    if (parseInt(quantity) <= 0) {

      let index = _.findIndex(list, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });
      cpItem["curQuantity"] = sellQuantity;
      list.splice(index, 1, cpItem);
      Logger.log(TAG, 'Update list', list);

    } else {

      let index = _.findIndex(list, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });
      let createItem = _.cloneDeep(assItem);
      createItem['moreMenuType'] = "created";
      createItem["fixedAmount"] = null;
      createItem["curQuantity"] = quantity;
      list[index] = createItem;

      cpItem["curQuantity"] = sellQuantity;
      list.push(cpItem);

      Logger.log(TAG, 'Update list', list);
    }

    this.zone.run(() => {
      this.collectiblesList = list;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, list);
      this.refreshCollectiblesVisibleareaImage();
      Logger.log(TAG, 'handleCreate this.collectiblesList', this.collectiblesList);

    });
  }

  async handleCancelOrder(tokenId: any, curTokenNum: any, assetItem: any, createAddr: any, saleOrderId: any, clist: any, sellerAddr: any) {
    //add OwnNftCollectiblesList
    if (parseInt(curTokenNum) === 0) {

      clist = _.filter(clist, item => {
        return item.tokenId != tokenId;
      });

      clist.push(assetItem);
      this.collectiblesList = clist;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);

    } else {

      clist = _.filter(clist, item => {
        return item.saleOrderId != saleOrderId;
      });

      let index = _.findIndex(clist, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });

      assetItem.curQuantity = (parseInt(curTokenNum) + parseInt(assetItem.curQuantity)).toString();
      clist[index] = _.cloneDeep(assetItem);
      this.collectiblesList = clist;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);
    }

    // let pList = this.nftPersistenceHelper.getPasarList();
    // pList = _.filter(pList, item => {
    //   return !(
    //     item.saleOrderId === saleOrderId && item.sellerAddr === sellerAddr
    //   );
    // });
    // this.nftPersistenceHelper.setPasarList(pList);
    this.dataHelper.deletePasarItem(saleOrderId);
  }

  async handleNftBurn(tokenId: any, createAddr: any, burnNum: any) {
    let quantity = await this.nftContractControllerService
      .getSticker()
      .balanceOf(tokenId);
    let bList = this.nftPersistenceHelper.getCollectiblesList(createAddr);

    if (parseInt(quantity) === 0) {

      bList = _.filter(bList, item => {
        return !(item.tokenId === tokenId && item.moreMenuType === "created");
      });

      this.collectiblesList = bList;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);

    } else {

      _.forEach(bList, (item: any) => {
        if (item.tokenId === tokenId && item.moreMenuType === "onSale") {
          item.quantity = (parseInt(item.quantity) - parseInt(burnNum)).toString();
        } else if (item.tokenId === tokenId && item.moreMenuType === "created") {
          item.curQuantity = parseInt(quantity);
          item.quantity = (parseInt(item.quantity) - parseInt(burnNum)).toString();
        }
      });

      // let index = _.findIndex(bList, (item:any) => {
      //   return item.tokenId === tokenId && item.moreMenuType === "created";
      // });

      // bList[index].curQuantity = parseInt(quantity);
      // bList[index].quantity = parseInt(quantity);

      this.collectiblesList = bList;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);
    }
  }

  async handleNftTransfer(tokenId: any, createAddr: any, transferNum: any) {
    let quantity = await this.nftContractControllerService
      .getSticker()
      .balanceOf(tokenId);
    let bList = this.nftPersistenceHelper.getCollectiblesList(createAddr);

    if (parseInt(quantity) === 0) {

      bList = _.filter(bList, item => {
        return !(item.tokenId === tokenId && item.moreMenuType === "created");
      });

      this.collectiblesList = bList;
      this.ownNftSum = this.collectiblesList.length;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);

    } else {

      _.forEach(bList, (item: any) => {
        if (item.tokenId === tokenId && item.moreMenuType === "onSale") {
          item.quantity = (parseInt(item.quantity) - parseInt(transferNum)).toString();
        } else if (item.tokenId === tokenId && item.moreMenuType === "created") {
          item.curQuantity = parseInt(quantity);
          item.quantity = (parseInt(item.quantity) - parseInt(transferNum)).toString();
        }
      });

      this.collectiblesList = bList;
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, bList);
    }
  }

  async refreshCollectibles() {
    // if (this.isRefreshingCollectibles) {
    //   return;
    // }
    // this.isRefreshingCollectibles = true;

    this.collectiblesPageNum = 0;
    // this.collectiblesList = [];
    this.refreshNotSaleOrderFinish = false;
    this.refreshSaleOrderFinish = false;
    this.elaPrice = this.dataHelper.getElaUsdPrice();
    // await this.getOwnNftSum();
    let accAddress = this.nftContractControllerService.getAccountAddress() || '';

    if (accAddress === '') {
      this.isRefreshingCollectibles = false;
      return;
    }

    this.collectiblesList = await this.nftContractHelperService.queryOwnerCollectibles(accAddress);
    this.saveCollectiblesToCache(accAddress);
    this.ownNftSum = this.collectiblesList.length;
    // this.collectiblesList = await this.nftContractHelperService.refreshCollectiblesData(this.sortType);




    // this.refreshingCollectiblesHelper = [];
    // this.processOnSaleOrder(accAddress).then(() => {
    //   return this.processNotOnSaleOrder(accAddress);
    // }).then(() => {
    //   Logger.log(TAG, 'On sale collectiblesList is', this.collectiblesList);
    //   this.refreshCollectiblesVisibleareaImage();
    //   this.isRefreshingCollectibles = false;
    //   this.prepareSaveCollectiblesData(accAddress);
    // });
  }

  saveCollectiblesToCache(createAddress: string) {
    this.nftPersistenceHelper.setCollectiblesMap(createAddress, this.collectiblesList);
    Logger.log(TAG, 'Save CollectiblesList', this.collectiblesList);
  }

  prepareSaveCollectiblesData(address: string) {
    if (this.refreshNotSaleOrderFinish && this.refreshSaleOrderFinish)
      this.saveCollectiblesToCache(address);
  }

  exploreMarketplace() {
    this.native.setRootRouter(['/tabs/home']);
    this.feedspage.home();
  }

  editProfile() {
    this.clearData();
    this.native.navigateForward(['/menu/profiledetail'], {});
  }

  async updateUserAvatar() {
    let avatar = await this.hiveVaultController.getUserAvatar();

    let imgUri = "";
    if (avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (avatar.indexOf('feeds:image:') > -1) {
      imgUri = avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (avatar.indexOf('pasar:image:') > -1) {
      imgUri = avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else {
      imgUri = avatar;
    }

    this.avatar = imgUri;
  }

  removeMyFeedsObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.myFeedsObserver[postGridId] = null;
      }
    }
  }

  getMyFeedsObserverList(myFeedslist = []) {
    for (let index = 0; index < myFeedslist.length; index++) {
      let postItem = myFeedslist[index] || null;
      if (postItem === null) {
        return;
      }
      let postGridId = postItem.destDid + "-" + postItem.channelId + "-myFeeds";
      let exit = this.myFeedsObserver[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.newMyFeedsObserver(postGridId);
    }
  }

  newMyFeedsObserver(postGridId: string) {
    let observer = this.myFeedsObserver[postGridId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      this.myFeedsObserver[postGridId] = new IntersectionObserver(async (changes: any) => {
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
        this.handleMyFeedsAvatarV2(destDid, channelId);
        this.getChannelFollower(destDid, channelId);
        //console.log("======intersectionRatio1========",typeof(changes[0]));
        //console.log("======intersectionRatio2========",Object.getOwnPropertyNames(changes[0]));
      });

      this.myFeedsObserver[postGridId].observe(item);
    }
  }

  getChannelFollower(destDid: string, channelId: string) {
    //关注数
    let follower = this.isLoadSubscriptionV3Num[channelId] || '';
    if (follower === "") {
      try {
        this.isLoadSubscriptionV3Num[channelId] = "11";
        let subscriptionV3Num = this.subscriptionV3NumMap[channelId] || "";
        if (subscriptionV3Num === "") {
          this.subscriptionV3NumMap[channelId] = "...";
        }
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

  removeMyFeedsObserveList() {
    for (let postGridId in this.myFeedsObserver) {
      let observer = this.myFeedsObserver[postGridId] || null;
      this.removeMyFeedsObserver(postGridId, observer)
    }
    this.myFeedsObserver = {};
  }

  getLikeObserverList(likeList = []) {
    for (let index = 0; index < likeList.length; index++) {
      let postItem = likeList[index] || null;
      if (postItem === null) {
        return;
      }
      let postGridId = postItem.destDid + "-" + postItem.channelId + "-" + postItem.postId + "-" + postItem.content.mediaType + '-like';
      let exit = this.myLikeObserver[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.newLikeObserver(postGridId);
    }
  }

  newLikeObserver(postGridId: string) {
    let observer = this.myLikeObserver[postGridId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;

    if (item != null) {
      this.myLikeObserver[postGridId] = new IntersectionObserver(async (changes: any) => {
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
        let postId: string = arr[2];
        let mediaType: string = arr[3];
        await this.getChannelName(destDid, channelId);//获取频道name
        this.getDisplayName(destDid, channelId, destDid);
        this.handlePostAvatarV2(destDid, channelId);
        if (mediaType === '1') {
          this.handlePostImgV2(destDid, channelId, postId);
        }
        if (mediaType === '2') {
          //video
          this.handleVideoV2(destDid, channelId, postId);
        }
        let id = destDid + '-' + channelId + '-' + postId;
        //post like status
        CommonPageService.handlePostLikeStatusData(
          destDid, channelId, postId, this.isInitLikeStatus, this.hiveVaultController,
          this.likeMap, this.isLoadingLikeMap);
        //处理post like number
        CommonPageService.handlePostLikeNumData(
          destDid, channelId, postId, this.hiveVaultController,
          this.likeNumMap, this.isInitLikeNum);
        //处理post comment
        CommonPageService.handlePostCommentData(
          destDid, channelId, postId, this.hiveVaultController,
          this.isInitComment, this.commentNumMap);
        //console.log("======intersectionRatio1========",typeof(changes[0]));
        //console.log("======intersectionRatio2========",Object.getOwnPropertyNames(changes[0]));
      });

      this.myLikeObserver[postGridId].observe(item);
    }
  }

  async getChannelName(destDid: string, channelId: string) {

    let isLoad = this.isLoadChannelNameMap[channelId] || "";
    if (isLoad === "") {
      this.isLoadChannelNameMap[channelId] = "11";
      let channel = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      this.channelMap[channelId] = channel;
    }

    let channelName = this.channelNameMap[channelId] || "";
    if (channelName != "") {
      return channelName;
    }
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
    if (channel === null) {
      return '';
    }
    let key = destDid + "-" + channelId;
    this.channelMap[key] = channel;
    this.channelNameMap[channelId] = channel.displayName || channel.name || '';
    return this.channelNameMap[channelId];
  }

  getDisplayName(destDid: string, channelId: string, userDid: string) {
    //dispalyName
    let displayNameMap = this.isLoadHandleDisplayNameMap[userDid] || '';
    if (displayNameMap === "") {
      this.isLoadHandleDisplayNameMap[userDid] = "11";
      let displayName = this.handleDisplayNameMap[userDid] || "";
      if (displayName === "") {
        let text = userDid.replace('did:elastos:', '');
        this.handleDisplayNameMap[userDid] = UtilService.resolveAddress(text);
      }

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

  removeLikeObserveList() {
    for (let postGridId in this.myLikeObserver) {
      let observer = this.myLikeObserver[postGridId] || null;
      this.removeMyLikeObserver(postGridId, observer)
    }
    this.myLikeObserver = {};
  }

  removeMyLikeObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.myLikeObserver[postGridId] = null;
      }
    }
  }

  postListScroll(event: any) {
    if (this.selectType === "ProfilePage.myLikes") {
      //this.native.throttle(this.handlePostListScroll(event), 200, this, true);
      this.handlePostListScroll(event);
    }
  }

  handlePostListScroll(event: any) {

    if (event.detail.deltaY > 0) {

      if (this.firstScrollTop === 0 && event.detail.scrollTop > 0) {
        this.firstScrollTop = 1;
        this.isFullPost = true;
        this.refresher.disabled = true;
      }
    } else if (event.detail.deltaY < 0) {

      if (this.totalLikeList.length > 4 && this.firstScrollTop > 0 && event.detail.scrollTop <= 0) {
        this.firstScrollTop = 0;
        this.isFullPost = false;
        this.refresher.disabled = false;
      }

    };
  }

  closeFullSrceenPost() {
    if (this.isFullPost) {
      this.firstScrollTop = 0;
      this.isFullPost = false;
      this.refresher.disabled = false;
    }
  }

  showRepost(repostParams: any) {
    console.log("===repostParams===", repostParams);
    let post = repostParams.post;
    this.repost(post);
  }

  async repost(post: FeedsData.PostV3) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }
    let destDid = post.destDid;
    let channelId = post.channelId;
    let postId = post.postId;
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    const channels = await this.dataHelper.getSelfChannelListV3();
    if (channels.length === 0) {
      this.clearData(true);
      this.native.navigateForward(['/createnewfeed'], '');
      return;
    }
    this.repostChannelList = channels;
    let channel = this.dataHelper.getCurrentChannel() || null;
    if (channel === null) {
      channel = await this.dataHelper.getChannelV3ById(channels[0].destDid, channels[0].channelId);
      this.dataHelper.setCurrentChannel(channel);
    }

    this.postId = postId;
    this.channelId = channelId;
    this.destDid = destDid;
    this.hideRepostComment = false;
  }

  hideRepostComponent(event: any) {
    this.postId = "";
    this.channelId = "";
    this.destDid = "";
    this.hideRepostComment = true;
  }

}
