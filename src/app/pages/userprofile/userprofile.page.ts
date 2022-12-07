import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonInfiniteScroll, IonRefresher, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import _ from 'lodash';
import { UtilService } from 'src/app/services/utilService';
import SparkMD5 from 'spark-md5';
import { Logger } from 'src/app/services/logger';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { Events } from 'src/app/services/events.service';
import { CommonPageService } from 'src/app/services/common.page.service';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { AppService } from 'src/app/services/AppService';
import { IntentService } from 'src/app/services/IntentService';
import { FeedService } from 'src/app/services/FeedService';
let TAG: string = 'User-profile';
@Component({
  selector: 'app-userprofile',
  templateUrl: './userprofile.page.html',
  styleUrls: ['./userprofile.page.scss'],
})
export class UserprofilePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: false }) refresher: IonRefresher;
  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;
  private firstScrollTop = 0;
  public lightThemeType: number = 3;
  public userDid: string = '';
  public isFullPost: boolean = false;
  public selectType: string = 'ProfilePage.myFeeds';
  public pageSize: number = 1;
  public pageNumber: number = 5;
  // Sign in data
  public name: string = '';
  public avatar: string = '';
  public description: string = '';
  public hideComment = true;


  public hideSharMenuComponent: boolean = false;

  private refreshMyFeedsSid: any = null;
  private myFeedsObserver: any = {};
  private refreshImageSid: any = null;

  public channels = []; //myFeeds page
  public isLoadingMyFeeds: boolean = true;
  public myFeedsSum: number = 0;
  public followers = 0;
  private isLoadChannelNameMap: any = {};
  private myFeedsIsLoadimage: any = {};
  public myFeedAvatarMap: any = {};
  public subscriptionV3NumMap: any = {};
  private isLoadSubscriptionV3Num: any = {};
  private channelPublicStatusList: any = {};
  public pageName: string = 'userprofile';

  public walletAddress: string = '';
  public walletAddressStr: string = '';
  public popover: any = '';

  /*like*/
  public hideDeletedPosts: boolean = false;
  public likeSum: number = 0;
  private likeMap: any = {};
  private likeNumMap: any = {};
  private commentNumMap: any = {};
  private myLikeObserver: any = {};
  public totalLikeList = [];
  public likeList = []; //like page
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  private isLoadimage: any = {};
  private isLoadAvatarImage: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};
  public curItem: any = {};

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
  public isLoadingLikeMap: any = {};
  private handleDisplayNameMap: any = {};
  private isLoadHandleDisplayNameMap: any = {};
  private channelNameMap: any = {};
  private channelMap: any = {};
  public postImgMap: any = {};
  private postMap = {};
  public postTime = {};
  public roundWidth: number = 40;
  public likeAvatarMap: any = {};
  public isLoadingLike: boolean = true;

  /** share */
  public qrCodeString: string = null;

  public isShowUnfollow: boolean = false;

  public isShowQrcode: boolean = false;

  public isShowTitle: boolean = false;

  public isShowInfo: boolean = false;

  public isPreferences: boolean = false;

  public shareDestDid: string = '';

  public shareChannelId: string = '';

  // For comment component
  public postId = null;
  public destDid = null;
  public channelId = null;
  public channelAvatar = null;
  public channelName = null;

  private userOwnedchannels: FeedsData.ChannelV3[] = [];
  public createrDid: string = '';
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper,
    private ipfsService: IPFSService,
    private zone: NgZone,
    private nftContractControllerService: NFTContractControllerService,
    private walletConnectControllerService: WalletConnectControllerService,
    private events: Events,
    private popoverController: PopoverController,
    private viewHelper: ViewHelper,
    private intentService: IntentService,
    private feedService: FeedService,
    public native: NativeService,
    public theme: ThemeService,
    public popupProvider: PopupProvider,
    public appService: AppService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((queryParams: any) => {
      this.userDid = queryParams.userDid || '';
    });
  }

  async ionViewWillEnter() {
    this.theme.setTheme1();//改变状态栏
    this.initTitle();
    this.initUserProfile(this.userDid);
    this.changeType(this.selectType);
    this.hideDeletedPosts = this.dataHelper.getHideDeletedPostsStatus();

    this.addEvents();
  }

  addEvents() {

    this.events.subscribe(
      FeedsEvent.PublishType.walletAccountChanged,
      (walletAccount) => {
        this.zone.run(async () => {
          this.updateWalletAddress(walletAccount);
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.clickDisconnectWallet, () => {
      this.walletAddress = '';
      this.walletAddressStr = '';
    });

    this.events.subscribe(FeedsEvent.PublishType.hideDeletedPosts, () => {
      this.zone.run(() => {
        this.hideDeletedPosts = this.dataHelper.getHideDeletedPostsStatus();
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateLikeList, list => {
      this.zone.run(() => {
        this.refreshLikeList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.channelsDataUpdate, () => {
      this.zone.run(() => {
        // this.initUserOwnedChannels();
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

  }

  removeEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.channelsDataUpdate);
    this.events.unsubscribe(FeedsEvent.PublishType.updateLikeList);
    this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
    this.events.unsubscribe(FeedsEvent.PublishType.walletAccountChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.clickDisconnectWallet);
  }

  ionViewDidEnter() {
    let appProfile: HTMLBaseElement = document.querySelector("app-userprofile") || null;
    if (appProfile != null) {
      appProfile.style.backgroundColor = "#010101";
    }
  }

  ionViewWillLeave() {
    let userprofile: HTMLBaseElement = document.querySelector("app-userprofile") || null;
    if (userprofile != null) {
      userprofile.removeAttribute("style");
    }
    this.theme.restTheme();
    this.clearData();
    this.removeEvent();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('UserprofilePage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  postListScroll(event: any) {
    if (this.selectType === "ProfilePage.myLikes") {
      //this.handlePostListScroll(event);
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

  async doRefresh(event: any) {
    switch (this.selectType) {
      case 'ProfilePage.myFeeds':
        try {
          const userOwnedchannels = await this.hiveVaultController.queryUserOwnedChannels(this.userDid);
          await this.initUserOwnedChannels(userOwnedchannels);
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }
        break;
      case 'ProfilePage.myLikes':
        try {
          // await this.hiveVaultController.syncAllLikeData();
          // this.removeLikeObserveList();
          // this.pageSize = 1;
          // this.isLoadHandleDisplayNameMap = {};
          // this.likeList = [];
          // this.handleDisplayNameMap = {};
          // this.postImgMap = {};
          // this.initLike();
          event.target.complete();
        } catch (error) {
          event.target.complete();
        }
        break;
    }
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

  editProfile() {
    this.native.navigateForward(['/userprofileinfo'], { queryParams: { 'userDid': this.userDid } });
  }

  initUserProfile(userDid: string) {
    this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
      this.setProfileUI(userProfile);
    });
  }

  async changeType(type: string) {
    this.pauseAllVideo();
    this.selectType = type;
    this.hideSharMenuComponent = false;
    switch (type) {
      case 'ProfilePage.myFeeds':
        this.closeFullSrceenPost();
        this.removeMyFeedsObserveList();
        this.clearRefreshImageSid();
        try {
          if (!this.userOwnedchannels || this.userOwnedchannels.length == 0)
            this.userOwnedchannels = await this.hiveVaultController.queryUserOwnedChannels(this.userDid);
          await this.initUserOwnedChannels(this.userOwnedchannels);
        } catch (error) {
          this.isLoadingMyFeeds = false;
        }

        break;
      case 'ProfilePage.myLikes':
        // this.removeLikeObserveList();
        // this.clearRefreshMyFeedsSid();
        // this.pageSize = 1;
        // this.initLike();
        break;
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

  closeFullSrceenPost() {
    if (this.isFullPost) {
      this.firstScrollTop = 0;
      this.isFullPost = false;
      this.refresher.disabled = false;
    }
  }

  removeMyFeedsObserveList() {
    for (let postGridId in this.myFeedsObserver) {
      let observer = this.myFeedsObserver[postGridId] || null;
      this.removeMyFeedsObserver(postGridId, observer)
    }
    this.myFeedsObserver = {};
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

  refreshMyFeedsVisibleareaImageV2(list = []) {
    if (this.selectType === "ProfilePage.myFeeds") {
      if (this.refreshMyFeedsSid != null) {
        return;
      }
      this.refreshMyFeedsSid = requestAnimationFrame(() => {
        this.myFeedsIsLoadimage = {};
        this.getMyFeedsObserverList(list);
        this.clearRefreshMyFeedsSid();
      });
    }
  }


  clearRefreshImageSid() {
    if (this.refreshImageSid != null) {
      cancelAnimationFrame(this.refreshImageSid);
      this.refreshImageSid = null;
    }
  }

  clearRefreshMyFeedsSid() {
    if (this.refreshMyFeedsSid != null) {
      cancelAnimationFrame(this.refreshMyFeedsSid);
      this.refreshMyFeedsSid = null;
    }
  }

  async initUserOwnedChannels(channels: FeedsData.ChannelV3[]) {
    try {
      let newChannels = channels || null;
      if (newChannels != null) {
        channels = _.uniqWith(newChannels, _.isEqual) || [];
        newChannels = _.sortBy(newChannels, (item: FeedsData.ChannelV3) => {
          return -item.createdAt;
        });
        this.channels = newChannels;
      }
      this.isLoadingMyFeeds = false;
      this.myFeedsSum = this.channels.length;
      this.refreshMyFeedsVisibleareaImageV2(this.channels);
      this.hiveVaultController.querySubscribedChannelsByOwner(this.userDid, FeedsData.SubscribedChannelType.OTHER_CHANNEL,
        (localCachedSubscribedChannelList: FeedsData.SubscribedChannelV3[]) => {
          this.followers = localCachedSubscribedChannelList.length;
        }, true).then((subscribedChannels: FeedsData.SubscribedChannelV3[]) => {
          this.followers = subscribedChannels.length;
        }).catch((error) => {
        });
    } catch (error) {
      this.isLoadingMyFeeds = false;
    }
  }

  getMyFeedsObserverList(myFeedslist = []) {
    for (let index = 0; index < myFeedslist.length; index++) {
      let postItem = myFeedslist[index] || null;
      if (postItem === null) {
        return;
      }
      let postGridId = postItem.destDid + "-" + postItem.channelId + "-myFeeds-" + this.pageName;
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
        this.getChannelPublicStatus(destDid, channelId);
        //console.log("======intersectionRatio1========",typeof(changes[0]));
        //console.log("======intersectionRatio2========",Object.getOwnPropertyNames(changes[0]));
      });

      this.myFeedsObserver[postGridId].observe(item);
    }
  }

  async handleMyFeedsAvatarV2(destDid: string, channelId: string) {
    let id = destDid + "-" + channelId;
    let isload = this.myFeedsIsLoadimage[id] || '';
    if (isload === "") {
      let arr = id.split("-");
      this.myFeedsIsLoadimage[id] = '11';
      let myFeedAvatar = this.myFeedAvatarMap[id] || '';
      if (myFeedAvatar === '') {
        this.myFeedAvatarMap[id] = './assets/images/loading.svg';
      }
      let destDid = arr[0];
      let channelId = arr[1];
      let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      let avatarUri = "";
      if (channel != null) {
        avatarUri = channel.avatar;
        let fileName: string = avatarUri.split("@")[0];
        this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
          this.zone.run(() => {
            let srcData = data || "";
            if (srcData != "") {
              this.myFeedsIsLoadimage[id] = '13';
              this.myFeedAvatarMap[id] = data;
            } else {
              if (this.myFeedAvatarMap[id] === './assets/images/loading.svg') {
                this.myFeedAvatarMap[id] = "./assets/images/profile-0.svg";
              }
              this.myFeedsIsLoadimage[id] = '13';
            }
          });
        }).catch((err) => {
          if (this.myFeedAvatarMap[id] === './assets/images/loading.svg') {
            this.myFeedAvatarMap[id] = "./assets/images/profile-0.svg";
          }
        });
      } else {
        if (this.myFeedAvatarMap[id] === './assets/images/loading.svg') {
          this.myFeedAvatarMap[id] = "./assets/images/profile-0.svg";
        }
      }
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

  subsciptions() {
    this.native.navigateForward(['/userSubscriptions'], { queryParams: { "userDid": this.userDid, "pageType": 'userSubscriptions' } });
  }

  async toPage(eventParm: any) {
    let destDid = eventParm['destDid'];
    let channelId = eventParm['channelId'];
    let postId = eventParm['postId'] || '';
    let page = eventParm['page'];
    if (postId != '') {
      this.native
        .getNavCtrl()
        .navigateForward([page, destDid, channelId, postId]);
    } else {
      this.native.getNavCtrl().navigateForward([page, destDid, channelId]);
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
        this.isShowTitle = false;
        this.isShowInfo = false;
        this.isPreferences = false;
        this.isShowQrcode = false;
        this.isShowUnfollow = true;
        this.hideSharMenuComponent = true;
        break;
    }
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

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async disconnect(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      try {
        await that.walletConnectControllerService.disconnect();
      } catch (error) {

      }
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
    this.walletAddressStr = UtilService.shortenAddress(this.walletAddress);
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
    this.hideSharMenuComponent = false;
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
    this.isLoadChannelNameMap = {};
    this.removeMyFeedsObserveList();
    this.removeLikeObserveList();
  }

  loadData(event: any) {
    switch (this.selectType) {
      case 'ProfilePage.myFeeds':
        event.target.complete();
        break;
      case 'ProfilePage.myLikes':
        let sid = setTimeout(() => {
          this.pageSize++;
          let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalLikeList);
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

    this.hideDeletedPosts = this.dataHelper.getHideDeletedPostsStatus();
    if (!this.hideDeletedPosts) {
      likeList = _.filter(likeList, (item: any) => {
        return item.status != 1;
      });
    }
    return likeList;
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

  refreshImageV2(likeList = []) {
    this.clearRefreshImageSid();
    this.refreshImageSid = requestAnimationFrame(() => {
      this.getLikeObserverList(likeList);
      this.clearRefreshImageSid();
    });
  }

  getLikeObserverList(likeList = []) {
    for (let index = 0; index < likeList.length; index++) {
      let postItem = likeList[index] || null;
      if (postItem === null) {
        return;
      }
      let postGridId = postItem.destDid + "-" + postItem.channelId + "-" + postItem.postId + "-" + postItem.content.mediaType + '-like-' + this.pageName;
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
        this.handleDisplayNameMap[userDid] = UtilService.shortenAddress(text);
      }

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
      let channelAvatar = this.likeAvatarMap[id] || '';
      if (channelAvatar === '') {
        this.likeAvatarMap[id] = './assets/images/loading.svg';
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
            if (this.likeAvatarMap[id] === './assets/images/loading.svg') {
              this.likeAvatarMap[id] = './assets/images/profile-0.svg';
            }
            this.isLoadAvatarImage[id] = "13";
          }
        })
        .catch(reason => {
          if (this.likeAvatarMap[id] === './assets/images/loading.svg') {
            this.likeAvatarMap[id] = './assets/images/profile-0.svg';
          }
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
              'UserprofilePage.title',
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
                    'UserprofilePage.title',
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

  initLike() {
    // 赞/收藏
    this.initRefresh();
  }

  async initRefresh() {
    this.totalLikeList = await this.sortLikeList();
    this.likeSum = this.totalLikeList.length;
    let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalLikeList);
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
            this.events.publish(FeedsEvent.PublishType.unfollowFeedsFinish);
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
            destDid: this.shareDestDid,
            channelId: this.shareChannelId,
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
    return this.dataHelper.checkSubscribedStatus(destDid, channelId);
  }


  hideComponent(event) {
    this.postId = null;
    this.channelId = null;
    this.destDid = null;
    this.channelAvatar = null;
    this.channelName = null;
    this.hideComment = true;
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

  clearAssets() {
    this.removeAllVideo();
    CommonPageService.removeAllAvatar(this.isLoadAvatarImage, 'likeChannelAvatar');
    CommonPageService.removeAllAvatar(this.myFeedsIsLoadimage, 'myFeedsAvatar');
    this.myFeedsIsLoadimage = {};
    this.isLoadimage = {};
    this.isLoadAvatarImage = {};
    this.isLoadVideoiamge = {};
    this.myFeedsIsLoadimage = {};
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

  setProfileUI(userProfile: FeedsData.UserProfile) {
    const name = userProfile.name || userProfile.resolvedName || userProfile.displayName;
    const avatarUrl = userProfile.avatar || userProfile.resolvedAvatar;
    this.setUserNameUI(userProfile.did, name);
    this.setAvatarUI(userProfile.did, avatarUrl);
  }

  setUserNameUI(userDid: string, name: string) {
    if (name) {
      this.setUserName(userDid, name);
    } else {
      this.setUserName(userDid);
    }
  }

  setAvatarUI(userDid: string, avatarUrl: string) {
    if (avatarUrl) {
      this.hiveVaultController.getV3HiveUrlData(avatarUrl)
        .then((image) => {
          this.setUserAvatar(userDid, image);
        }).catch((err) => {
          this.setUserAvatar(userDid);
        })
    } else {
      this.setUserAvatar(userDid);
    }
  }

  setUserAvatar(userDid: string, avatar = './assets/images/did-default-avatar.svg') {
    this.avatar = avatar;
  }

  setUserName(userDid: string, userName: string = 'common.unknown') {
    this.name = userName;
  }

  showComment(commentParams) {
    this.postId = commentParams.postId;
    this.channelId = commentParams.channelId;
    this.destDid = commentParams.destDid;
    this.createrDid = commentParams.destDid;
    this.channelAvatar = commentParams.channelAvatar;
    this.channelName = commentParams.channelName;
    this.hideComment = false;
  }
}
