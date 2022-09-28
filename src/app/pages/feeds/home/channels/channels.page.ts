import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { IonRefresher, ModalController, Platform } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { MenuService } from 'src/app/services/MenuService';
import { TranslateService } from '@ngx-translate/core';
import { PopoverController, IonInfiniteScroll, IonContent, } from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { PopupProvider } from 'src/app/services/popup';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';

import _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { CommonPageService } from 'src/app/services/common.page.service';
import { MorenameComponent } from 'src/app/components/morename/morename.component';

let TAG: string = 'Feeds-feeds';
@Component({
  selector: 'app-channels',
  templateUrl: './channels.page.html',
  styleUrls: ['./channels.page.scss'],
})
export class ChannelsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonContent, { static: true }) content: IonContent;
  @ViewChild(IonInfiniteScroll, { static: true }) infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonRefresher, { static: false }) refresher: IonRefresher;
  public images = {};
  public isShowPrompt: boolean = false;
  public popover: any;
  public channelAvatar: string = '';
  public channelAvatarUri: string = '';
  public channelName: string = '';
  public channelOriginName: string = '';
  public updatedTime: number = 0;
  public channelOwner: string = '';
  public channelDesc: string = '';
  public channelSubscribes: number = 0;
  public displayName: string = '';
  public postList: FeedsData.PostV3[] = [];

  public channelId: string = "0";

  public followStatus: boolean = false;
  public pageSize = 1;
  public pageNumber: number = 4;
  public totalData: any = [];

  public styleObj: any = { width: '' };

  public hideComment = true;

  // For comment component
  public postId = null;

  private clientHeight: number = 0;
  private clientWidth: number = 0;
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  public isLoadimage: any = {};
  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public cacheGetBinaryRequestKey: string = '';
  public cachedMediaType = '';

  public maxTextSize = 240;

  public hideDeletedPosts: boolean = false;

  public isPress: boolean = false;

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
  public isAndroid: boolean = true;

  public isMine: number = null;

  public nftAssetList: any = [];

  private destDid = '';
  private tippingAddress: string = "";

  private likeMap: any = {};
  private likeNumMap: any = {};
  private commentNumMap: any = {};
  private isLoadingLikeMap: any = {};
  public lightThemeType: number = 3;
  public postImgMap: any = {};
  public posterImgMap: any = {};
  private postMap = {};
  private curPostId: string = "";
  private isRefresh: boolean = false;
  private postTime: any = {};
  private refreshImageSid: any = null;
  public clickButton: boolean = false;
  private observerList: any = {};
  public pinnedPostMap: any = {};
  private isLoadPinnedPost: any = {};
  private currentPinPost: FeedsData.PostV3 = null;
  private firstScrollTop = 0;
  public isFullPost: boolean = false;
  private infoPopover: any = null;

  public hideRepostComment = true;
  public repostChannelList: any = [];

  public rePostMap: any = {};
  private refreshRepostImageSid = null;

  public repostNumMap: { [postId: string]: number } = {};
  constructor(
    private platform: Platform,
    private popoverController: PopoverController,
    private zone: NgZone,
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private menuService: MenuService,
    public appService: AppService,
    public modalController: ModalController,
    public popupProvider: PopupProvider,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController
  ) { }

  async subscribe() {

    if (this.clickButton) {
      return;
    }

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.clickButton = true;
    await this.native.showLoading('common.waitMoment');
    try {
      await this.hiveVaultController.subscribeChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncPostFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncCommentFromChannel(this.destDid, this.channelId);
      await this.hiveVaultController.syncLikeDataFromChannel(this.destDid, this.channelId);
      this.initRefresh();
      this.followStatus = true;
      this.clickButton = false;
      this.native.hideLoading();
    } catch (error) {
      this.clickButton = false;
      this.followStatus = false;
      this.native.hideLoading();
    }
  }

  tip() {
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }

    this.pauseAllVideo();
    this.viewHelper.showPayPrompt(this.destDid, this.channelId, this.tippingAddress);
  }

  async unsubscribe() {
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    try {
      const userDid = (await this.dataHelper.getSigninData()).did || '';

      if (this.destDid != userDid) {
        this.menuService.showChannelMenu(this.destDid, this.channelId, userDid);
      } else {
        this.native.toast_trans('common.unableUnsubscribe');
      }
      //this.followStatus = false;
    } catch (error) {
      //TODO show unsubscribe error ui
    }
  }

  ngOnInit() {
    this.acRoute.params.subscribe(data => {
      this.destDid = data.destDid;
      this.channelId = data.channelId;
    });
  }

  async init() {
    await this.initChannelData();
    await this.initRefresh();
  }

  async filterDeletedPostList(postList: FeedsData.PostV3[]) {
    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    let sortedData = postList;
    if (!this.hideDeletedPosts) {
      sortedData = _.filter(postList, (item: FeedsData.PostV3) => {
        return item.status != 1;
      });
    }
    return sortedData;
  }

  sortPostList(postList: FeedsData.PostV3[]) {
    // let sortList = _.sortBy(postList, (item: FeedsData.PostV3) => {
    //   return -item.createdAt;
    // });
    // return sortList;
    let sortList = _.orderBy(postList, ['pinStatus', 'createdAt'], ['desc', 'desc']);
    return sortList;
  }

  findCurrentPinPost(postList: FeedsData.PostV3[]) {
    let pinPostList = _.filter(postList, (item: FeedsData.PostV3) => {
      return item.pinStatus == FeedsData.PinStatus.PINNED;
    });
    return pinPostList;
  }

  // includePinPost(postList: FeedsData.PostV3[]): FeedsData.PostV3 {
  //   const pinPostList = _.find(postList, (item: FeedsData.PostV3) => {
  //     return item.pinStatus == FeedsData.PinStatus.PINNED
  //   });
  //   return pinPostList;
  // }

  // processPinPost(postList: FeedsData.PostV3[], pinPost: FeedsData.PostV3) {
  //   const index = postList.indexOf(pinPost);


  //   const list = _.sortBy(postList, (item: FeedsData.PostV3) => {
  //     return item.pinStatus;
  //     // return -item.createdAt;
  //   });
  //   return list;
  // }

  async initRefresh() {
    let posts = [];
    if (this.followStatus) {
      posts = await this.dataHelper.getPostListV3FromChannel(this.destDid, this.channelId);
    } else {
      const selfDid = (await this.dataHelper.getSigninData()).did || '';
      if (selfDid && this.destDid == selfDid) {
        posts = await this.hiveVaultController.getSelfPostsByChannel(this.channelId);
      } else {
        posts = await this.hiveVaultController.queryRemoteChannelPostWithTime(this.destDid, this.channelId, UtilService.getCurrentTimeNum());
      }
    }
    let tmpPostList = await this.filterDeletedPostList(posts);
    this.totalData = this.sortPostList(tmpPostList);
    const pinPostList = this.findCurrentPinPost(this.totalData);
    this.currentPinPost = pinPostList[0];

    if (this.postList.length > 0 && !this.isRefresh) {
      if (this.curPostId != '') {
        let newPost: any = _.find(this.totalData, (item: FeedsData.PostV3) => {
          return item.postId === this.curPostId;
        }) || null;
        if (newPost === null) {
          return;
        }
        let postIndex = _.findIndex(this.postList, (item: FeedsData.PostV3) => {
          return item.postId === this.curPostId;
        });
        if (postIndex > -1) {
          this.postList.splice(postIndex, 1, newPost);
        }
        this.curPostId = '';
      }
      this.isLoadimage = {};
      this.isLoadVideoiamge = {};
      this.isInitLikeNum = {};
      this.isInitLikeStatus = {};
      this.isInitComment = {};
      this.refreshImageV2(this.postList);
      return;
    }
    this.isRefresh = false;
    this.pageSize = 1;
    let data = UtilService.getPostformatPageData(this.pageSize, this.pageNumber, this.totalData);
    if (data.currentPage === data.totalPage) {
      this.postList = data.items;
    } else {
      this.postList = data.items;
    }

    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.removeObserveList();
    this.refreshImageV2(this.postList);
    // if (this.totalData.length - this.pageNumber > 0) {
    //   this.postList = this.totalData.slice(0, this.pageNumber);
    //   this.startIndex++;

    //   this.isLoadimage = {};
    //   this.isLoadVideoiamge = {};
    //   this.isInitLikeNum = {};
    //   this.isInitLikeStatus = {};
    //   this.isInitComment = {};
    //   this.refreshImageV2();
    // } else {
    //   this.postList = this.totalData;
    //   this.isLoadimage = {};
    //   this.isLoadVideoiamge = {};
    //   this.isInitLikeNum = {};
    //   this.isInitLikeStatus = {};
    //   this.isInitComment = {};
    //   this.refreshImageV2();
    // }
  }

  async refreshChannelList() {
    //after delete post refresh
    if (this.pageSize === 1) {
      await this.initRefresh();
      return;
    }
    let postList = await this.dataHelper.getPostListV3FromChannel(this.destDid, this.channelId);
    this.totalData = await this.filterDeletedPostList(postList);
    if (this.totalData.length === this.postList.length) {
      this.postList = this.totalData;
    } else if (this.totalData.length - this.pageNumber * this.pageSize > 0) {
      this.postList = this.totalData.slice(
        0,
        this.pageSize * this.pageNumber,
      );
    } else {
      this.postList = this.totalData;
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.refreshImageV2(this.postList);
  }

  async initChannelData() {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    await this.checkFollowStatus(this.destDid, this.channelId);
    if (channel == null || channel == undefined) return;
    this.channelName = channel.displayName || channel.name;
    this.channelOriginName = channel.name;
    this.updatedTime = channel.updatedAt || 0;
    this.channelOwner = "";

    let text = this.destDid.replace('did:elastos:', '');
    this.channelOwner = UtilService.resolveAddress(text);
    try {
      this.hiveVaultController.getDisplayName(this.destDid, this.channelId, this.destDid).
        then((result: string) => {
          let name = result || "";
          if (name != "") {
            this.channelOwner = name;
          }
        }).catch(() => {
        });
    } catch (error) {

    }
    this.channelDesc = channel.intro;
    this.channelSubscribes = await this.dataHelper.getSubscriptionV3NumByChannelId(channel.destDid, channel.channelId);
    if (this.channelSubscribes == 0) {
      try {
        this.hiveVaultController.querySubscriptionChannelById(this.destDid, this.channelId).then(() => {
          this.zone.run(async () => {
            this.channelSubscribes = await this.dataHelper.getSubscriptionV3NumByChannelId(channel.destDid, channel.channelId);
          });
        })
      } catch (error) {

      }
    }
    this.tippingAddress = channel.tipping_address || '';
    let channelAvatarUri = channel.avatar || '';
    this.channelAvatarUri = channelAvatarUri;
    this.displayName = channel.displayName;
    this.handleChannelAvatar(channelAvatarUri);

    this.initRepostData();
  }

  handleChannelAvatar(channelAvatarUri: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        this.channelAvatar = result;
      }).catch((err) => {
      })
  }

  async ionViewWillEnter() {
    this.isRefresh = false;
    this.theme.setTheme1();
    this.isMine = await this.checkChannelIsMine();
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }

    this.hideDeletedPosts = this.dataHelper.getHideDeletedPosts();
    this.clientHeight = screen.availHeight;
    this.clientWidth = screen.availWidth;
    this.styleObj.width = screen.width - 105 + 'px';
    this.initTitle();
    this.init();

    this.events.subscribe(
      FeedsEvent.PublishType.unsubscribeFinish,
      () => {
        this.zone.run(() => {
          this.followStatus = false;
          this.initRefresh();
          // this.doRefresh();
          // this.native.setRootRouter(['/tabs/home']);
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish, (comment: FeedsData.CommentV3) => {
      let postId = comment.postId;
      this.commentNumMap[postId] = this.commentNumMap[postId] + 1;
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, (deletePostEventData: any) => {
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        try {
          let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(deletePostEventData.postId);
          this.hiveVaultController.deletePost(post).then(async (result: any) => {
            let newList = await this.dataHelper.getPostListV3FromChannel(this.destDid, this.channelId);
            let deletePostIndex = _.findIndex(newList, (item: any) => {
              return item.postId === result.postId;
            })
            if (deletePostIndex > -1) {
              newList[deletePostIndex].status = 1;
            }
            this.removeObserveList();
            await this.refreshChannelList();
            this.native.hideLoading();
          }).catch((err: any) => {
            this.native.hideLoading();
          })
        } catch (error) {
          this.native.hideLoading();
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.channelRightMenu, () => {
      this.clickAvatar();
    });

    this.events.subscribe(FeedsEvent.PublishType.pinPostFinish, async () => {
      this.isRefresh = true;
      this.initRefresh();
    });

    this.events.subscribe(FeedsEvent.PublishType.unpinPostFinish, async () => {
      this.isRefresh = true;
      this.initRefresh();
    })
  }

  ionViewWillLeave() {
    this.clearRefreshImageSid();
    this.theme.restTheme();
    this.clickButton = false;
    let appChannels: HTMLBaseElement = document.querySelector("app-channels") || null;
    if (appChannels != null) {
      appChannels.removeAttribute("style");
    }
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.isImgPercentageLoading[this.imgDownStatusKey] = false;
    this.isImgLoading[this.imgDownStatusKey] = false;
    this.imgDownStatus[this.imgDownStatusKey] = '';
    this.imgPercent = 0;
    this.imgRotateNum['transform'] = 'rotate(0deg)';

    this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
    this.isVideoLoading[this.videoDownStatusKey] = false;
    this.videoDownStatus[this.videoDownStatusKey] = '';
    this.videoPercent = 0;
    this.videoRotateNum['transform'] = 'rotate(0deg)';

    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.channelRightMenu);

    this.events.unsubscribe(FeedsEvent.PublishType.pinPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.unpinPostFinish);
    this.removeImages();
    this.removeAllVideo();
    this.postTime = {};
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.isInitLikeNum = {};
    this.isInitLikeStatus = {};
    this.isInitComment = {};
    this.postMap = {};
    this.pinnedPostMap = {};
    this.isLoadPinnedPost = {};
    this.removeObserveList();
    this.native.hideLoading();
    this.native.handleTabsEvents();
  }

  ionViewDidEnter() {
    let appChannels: HTMLBaseElement = document.querySelector("app-channels") || null;
    if (appChannels != null) {
      appChannels.style.backgroundColor = "#010101";
    }
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ChannelsPage.feeds'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    if (!this.theme.darkMode) {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelRightMenu", "assets/icon/info.ico");
    } else {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "channelRightMenu", "assets/icon/dark/info.ico");
    }
  }

  like(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    CommonPageService.likePost(
      destDid,
      channelId,
      postId,
      this.isLoadingLikeMap,
      this.likeMap,
      this.likeNumMap,
      this.hiveVaultController,
      this.dataHelper);
  }

  getContentText(content: string): string {
    return this.feedsServiceApi.parsePostContentText(content);
  }

  getContentShortText(post: any): string {
    let content = post.content.content;
    let text = this.feedsServiceApi.parsePostContentText(content) || '';
    return text.substring(0, 180) + '...';
  }

  getContentImg(content: any): string {
    return this.feedsServiceApi.parsePostContentImg(content);
  }

  getPostContentTextSize(content: string) {
    let text = this.feedsServiceApi.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
  }

  navToPostDetail(
    destDid: string,
    channelId: string,
    postId: string,
    event?: any,
  ) {
    if (!this.followStatus) {
      // this.native.toast_trans('subscribe first');
      return;
    }


    if (this.isPress) {
      this.isPress = false;
      return;
    }
    event = event || '';
    if (event != '') {
      let e = event || window.event; //兼容IE8
      let target = e.target || e.srcElement; //判断目标事件
      if (target.tagName.toLowerCase() == 'span') {
        let url = target.textContent || target.innerText;
        let reg = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;
        var urlExp = new RegExp(reg);
        if (urlExp.test(url) === true) {
          this.native.clickUrl(url, event);
        } else {//handle#
          this.pauseVideo(destDid + '-' + channelId + '-' + postId);
          this.curPostId = postId;
          this.native
            .getNavCtrl()
            .navigateForward(['/postdetail', destDid, channelId, postId]);
          this.handlePostText(url, event);
        }
        return;
      }
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.curPostId = postId;
    this.native
      .getNavCtrl()
      .navigateForward(['/postdetail', destDid, channelId, postId]);
  }

  async checkFollowStatus(destDid: string, channelId: string) {
    let subscribedChannel: FeedsData.SubscribedChannelV3[] = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    if (subscribedChannel.length === 0) {
      this.followStatus = false;
      return;
    }

    let channelIndex = _.find(subscribedChannel, (item: FeedsData.SubscribedChannelV3) => {
      return item.destDid === destDid && item.channelId === channelId;
    }) || '';
    if (channelIndex === '') {
      this.followStatus = false;
      return;
    }
    this.followStatus = true;
  }
  handleDisplayTime(postId: string, createTime: number) {
    let newPostTime = this.postTime[postId] || null;
    if (newPostTime != null) {
      return this.postTime[postId];
    }
    let obj = UtilService.handleDisplayTime(createTime);
    if (obj.type === 's') {
      this.postTime[postId] = this.translate.instant('common.just');
      return this.postTime[postId];
    }
    if (obj.type === 'm') {
      if (obj.content === 1) {
        this.postTime[postId] = obj.content + this.translate.instant('HomePage.oneminuteAgo');
        return this.postTime[postId];
      }
      this.postTime[postId] = obj.content + this.translate.instant('HomePage.minutesAgo');
      return this.postTime[postId];
    }
    if (obj.type === 'h') {
      if (obj.content === 1) {
        this.postTime[postId] = obj.content + this.translate.instant('HomePage.onehourAgo');
        return this.postTime[postId];
      }
      this.postTime[postId] = obj.content + this.translate.instant('HomePage.hoursAgo');
      return this.postTime[postId];
    }

    if (obj.type === 'day') {
      if (obj.content === 1) {
        this.postTime[postId] = this.translate.instant('common.yesterday');
        return this.postTime[postId];
      }
      this.postTime[postId] = obj.content + this.translate.instant('HomePage.daysAgo');

      return this.postTime[postId];
    }
    this.postTime[postId] = obj.content;
    return this.postTime[postId];
  }

  async menuMore(post: FeedsData.PostV3) {
    this.pauseAllVideo();
    let isMine = await this.checkChannelIsMine();
    this.curPostId = post.postId;

    this.menuService.showChannelItemMenu(post, this.channelName, isMine === 1 && post.status != FeedsData.PostCommentStatus.deleted, this.currentPinPost);
  }

  async doRefresh(event: any) {
    try {
      const syncChannelInfoPromise = this.hiveVaultController.getChannelInfoById(this.destDid, this.channelId);
      const syncSubscriptionPromise = this.hiveVaultController.querySubscriptionChannelById(this.destDid, this.channelId);

      this.hiveVaultController.queryAllRepostByChannelId(this.destDid, this.channelId).then(() => {
        this.initRepostData();
      });
      if (this.followStatus) {
        this.dataHelper.cleanCachedComment();
        this.dataHelper.cleanCacheLikeNum();
        this.dataHelper.cleanCachedLikeStatus();

        const syncPostsPromise = this.hiveVaultController.syncPostFromChannel(this.destDid, this.channelId);
        const syncCommentsPromise = this.hiveVaultController.syncCommentFromChannel(this.destDid, this.channelId);
        const syncLikesPromise = this.hiveVaultController.syncLikeDataFromChannel(this.destDid, this.channelId);

        await Promise.allSettled([
          syncChannelInfoPromise,
          syncSubscriptionPromise,
          syncPostsPromise,
          syncCommentsPromise,
          syncLikesPromise
        ])
      } else {
        await Promise.allSettled([
          syncChannelInfoPromise,
          syncSubscriptionPromise
        ]);
      }

      this.images = {};
      this.pageSize = 1;
      this.postMap = {};
      this.pinnedPostMap = {};
      this.isLoadPinnedPost = {};
      this.isRefresh = true;
      event.target.disabled = false;
      this.removeObserveList();
      this.init();
      event.target.complete();
    } catch (error) {
      event.target.complete();
    }
  }

  loadData(event: any) {
    let sId = setTimeout(() => {
      if (this.postList.length === this.totalData.length) {
        event.target.complete();
        clearTimeout(sId);
        return;
      }
      this.pageSize++;
      let data = UtilService.getPostformatPageData(this.pageSize, this.pageNumber, this.totalData);
      if (data.currentPage === data.totalPage) {
        this.postList = this.postList.concat(data.items);
      } else {
        this.postList = this.postList.concat(data.items);
      }
      this.refreshImageV2(data.items);
      event.target.complete();
      clearTimeout(sId);
    }, 500);
  }

  async checkChannelIsMine() {

    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    if (this.destDid != ownerDid) {
      return 0;
    }
    return 1;
  }

  scrollToTop(int) {
    let sid = setTimeout(() => {
      this.content.scrollToTop(1);
      clearTimeout(sid);
    }, int);
  }

  showComment(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // if (this.checkServerStatus(destDid) != 0) {
    //   this.native.toastWarn('common.connectionError1');
    //   return;
    // }

    // let post = this.feedService.getPostFromId(destDid, channelId, postId);
    // if (!this.feedService.checkPostIsAvalible(post)) return;

    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.postId = postId;
    this.hideComment = false;
  }

  hideComponent(event: any) {
    this.postId = null;
    this.hideComment = true;
  }


  async handlePostImgV2(destDid: string, channelId: string, postId: string) {
    // 13 存在 12不存在
    let id = destDid + '-' + channelId + '-' + postId;
    let isload = this.isLoadimage[id] || '';
    let rpostImage = document.getElementById(id + 'channelrow');
    if (isload === '') {
      this.isLoadimage[id] = '11';

      let posts = _.filter(this.postList, (post: FeedsData.PostV3) => {
        return destDid == post.destDid && postId == post.postId;
      })

      const post: FeedsData.PostV3 = posts[0] || null;

      if (post === null) {
        this.isLoadimage[id] = '13';
        rpostImage.style.display = 'none';
        return;
      }
      // let post = await this.dataHelper.getPostV3ById(destDid, postId);
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //缩略图
      let thumbnailKey = elements.thumbnailPath || '';
      //原图
      let imageKey = elements.originMediaPath || '';
      let type = elements.type || '';
      if (thumbnailKey === '' || imageKey === '') {
        this.isLoadimage[id] = '13';
        rpostImage.style.display = 'none';
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
              getV3Data(destDid, thumbnailKey, fileThumbnaiName, type).
              then((thumbImagedata) => {
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
    }
  }

  async handleVideoV2(destDid: string, channelId: string, postId: string) {
    let id = destDid + '-' + channelId + '-' + postId;
    let isloadVideoImg = this.isLoadVideoiamge[id] || '';
    let source: any = document.getElementById(id + 'sourcechannel');
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
            this.posterImgMap[id] = image;
            let video: any = document.getElementById(id + 'videochannel') || '';
            video.style.display = "block";
            this.setFullScreen(id);
            this.setOverPlay(id, id, post);
          } else {
            this.isLoadVideoiamge[id] = '12';
            //vgplayer.style.display = 'none';
          }
        })
        .catch(reason => {
          //vgplayer.style.display = 'none';
          Logger.error(TAG,
            "Excute 'hanldVideo' in feeds page is error , get video data error, error msg is",
            reason
          );
        });
    }
  }

  refreshImageV2(postList = []) {
    this.clearRefreshImageSid();
    this.refreshImageSid = setTimeout(() => {
      this.getObserveList(postList);
      this.clearRefreshImageSid();
    }, 100);
  }

  clearRefreshImageSid() {
    if (this.refreshImageSid != null) {
      clearTimeout(this.refreshImageSid);
      this.refreshImageSid = null;
    }
  }

  showBigImage(destDid: string, channelId: string, postId: string) {
    this.pauseAllVideo();
    this.zone.run(async () => {
      let imagesId = destDid + '-' + channelId + '-' + postId + 'postimgchannel';
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 'px';
      this.imgCurKey = destDid + '-' + channelId + '-' + postId;
      this.isImgLoading[this.imgCurKey] = true;

      let post = await this.dataHelper.getPostV3ById(postId);
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //原图
      let imageKey = elements.originMediaPath;
      let type = elements.type;
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileOriginName: string = imageKey.split("@")[0];
      //原图
      this.hiveVaultController
        .getV3Data(destDid, imageKey, fileOriginName, type, "false")
        .then(async realImg => {
          let img = realImg || '';
          if (img != '') {
            this.isImgLoading[this.imgCurKey] = false;
            this.postImgMap[this.imgCurKey] = img;
            this.viewHelper.openViewer(
              this.titleBar,
              realImg,
              'common.image',
              'ChannelsPage.feeds',
              this.appService,
              true
            );
          } else {
            this.isImgLoading[this.imgCurKey] = false;
            if (this.isExitDown()) {
              this.openAlert();
              return;
            }

            this.imgDownStatusKey = destDid + '-' + channelId + '-' + postId;
            this.imgDownStatus[this.imgDownStatusKey] = '1';
            this.isImgPercentageLoading[this.imgCurKey] = true;
            this.hiveVaultController
              .getV3Data(destDid, imageKey, fileOriginName, type)
              .then(async realImg => {
                let img = realImg || '';
                this.imgDownStatus[this.imgDownStatusKey] = '';
                this.isImgPercentageLoading[this.imgCurKey] = false;
                if (img != '') {
                  this.postImgMap[this.imgCurKey] = img;
                  this.viewHelper.openViewer(
                    this.titleBar,
                    realImg,
                    'common.image',
                    'ChannelsPage.feeds',
                    this.appService,
                    true
                  );
                }
              }).catch(() => {
                this.isImgLoading[this.imgCurKey] = false;
                this.imgDownStatus[this.imgDownStatusKey] = '';
                this.isImgPercentageLoading[this.imgCurKey] = false;
              });
          }
        });
    });
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'videochannel') || '';
    let source: any = document.getElementById(id + 'sourcechannel') || '';
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
        let videochannel: any = document.getElementById(id + 'videochannel') || '';
        videochannel.style.display = "none";
        let vgoverlayplaychannel: any = document.getElementById(id + 'vgoverlayplaychannel') || '';
        vgoverlayplaychannel.style.display = "none";
        let source: any = document.getElementById(id + 'sourcechannel') || '';
        let sourcesrc = source.getAttribute('src') || '';
        if (source != '' && sourcesrc != '') {
          source.setAttribute('src', ""); // empty source
        }
      }
    }
  }

  setFullScreen(id: string) {
    let vgfullscreen = document.getElementById(id + 'vgfullscreenchannel');
    vgfullscreen.onclick = async () => {
      this.pauseVideo(id);
      let postImg: string = document
        .getElementById(id + 'videochannel')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById(id + 'sourcechannel')
        .getAttribute('src');
      await this.native.setVideoFullScreen(postImg, videoSrc);
    };
  }


  removeImages() {
    // let iamgseids = this.isLoadimage;
    // for (let id in iamgseids) {
    //   let value = iamgseids[id] || '';
    //   if (value === '13') {
    //     let imgElement: any =
    //       document.getElementById(id + 'postimgchannel') || '';
    //     if (imgElement != '') {
    //         imgElement.setAttribute('src', '')
    //     }
    //   }
    // }
  }

  setOverPlay(id: string, srcId: string, post: FeedsData.PostV3) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaychannel') || '';
    vgoverlayplay.style.display = "block";

    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let source: any = document.getElementById(id + 'sourcechannel') || '';
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

    let videoId = destDid + '-' + channelId + '-' + postId + 'vgplayerchannel';
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
              this.isVideoLoading[this.videoCurKey] = false;
              this.isVideoLoading[this.videoDownStatusKey] = false;
              this.pauseVideo(id);
              this.openAlert();
              return;
            }

            this.videoDownStatusKey = destDid + '-' + channelId + '-' + postId;
            this.videoDownStatus[this.videoDownStatusKey] = '1';
            this.isVideoLoading[this.videoDownStatusKey] = true;
            this.isVideoPercentageLoading[this.videoDownStatusKey] = false;

            this.hiveVaultController
              .getV3Data(this.destDid, originKey, fileName, type)
              .then((downVideoResult: string) => {
                let downVideodata = downVideoResult || '';
                if (downVideodata != '') {
                  this.videoDownStatus[this.videoDownStatusKey] = '';
                  this.isVideoLoading[this.videoCurKey] = false;
                  this.zone.run(() => {
                    this.loadVideo(id, downVideodata);
                  })
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
    let source: any = document.getElementById(id + 'sourcechannel') || '';
    if (source === '') {
      return;
    }
    source.setAttribute('src', videodata);
    let vgoverlayplay: any = document.getElementById(
      id + 'vgoverlayplaychannel',
    );
    let video: any = document.getElementById(id + 'videochannel');
    let vgcontrol: any = document.getElementById(id + 'vgcontrolschannel');
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

  handleTotal(post: any) {
    let videoThumbKey = post.content['videoThumbKey'] || '';
    let duration = 29;
    if (videoThumbKey != '') {
      duration = videoThumbKey['duration'] || 0;
    }
    return UtilService.timeFilter(duration);
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
      let destDid = arrKey[0];
      let channelId = arrKey[1];
      let postId = arrKey[2];
      let id = destDid + "-" + channelId + "-" + postId;
      let postImage = document.getElementById(id + 'postimgchannel') || null;
      if (postImage != null) {
        postImage.setAttribute('src', value);
      }
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'ChannelsPage.feeds',
        this.appService,
        true
      );
    } else if (key.indexOf('video') > -1) {
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.videoPercent = 0;
      this.videoRotateNum['transform'] = 'rotate(0deg)';
      let arr = this.cacheGetBinaryRequestKey.split('-');
      let destDid = arr[0];
      let channelId: any = arr[1];
      let postId: any = arr[2];
      let id = destDid + '-' + channelId + '-' + postId;
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
      'tskth.svg',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async clickAvatar() {
    if (this.channelAvatar.indexOf('data:image') > -1 ||
      this.channelAvatar.startsWith('https:')) {
      this.dataHelper.setSelsectIndex(0);
      this.dataHelper.setProfileIamge(this.channelAvatar);
    } else if (this.channelAvatar.indexOf('assets/images') > -1) {
      let index = this.channelAvatar.substring(
        this.channelAvatar.length - 5,
        this.channelAvatar.length - 4,
      );
      this.dataHelper.setSelsectIndex(index);
      this.dataHelper.setProfileIamge(this.channelAvatar);
    }
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    this.dataHelper.setChannelInfo({
      destDid: this.destDid,
      channelId: this.channelId,
      name: this.channelOriginName,
      des: this.channelDesc,
      followStatus: this.followStatus,
      channelSubscribes: this.channelSubscribes,
      updatedTime: this.updatedTime,
      channelOwner: this.channelOwner,
      ownerDid: ownerDid,
      tippingAddress: this.tippingAddress,
      displayName: this.displayName
    });
    this.curPostId = '';
    this.native.navigateForward(['/feedinfo'], '');
  }

  pressContent(postContent: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    let text = this.feedsServiceApi.parsePostContentText(postContent);
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickDashang(destDid: string, channelId: string, postId: string) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.viewHelper.showPayPrompt(destDid, channelId, this.tippingAddress);
  }

  retry(destDid: string, channelId: string, postId: string) {
  }

  handlePostText(url: string, event: any) {
    event.stopPropagation();
  }

  getObserveList(postList = []) {
    for (let index = 0; index < postList.length; index++) {
      let postItem = postList[index];
      let postGridId = postItem.destDid + "-" + postItem.channelId + "-" + postItem.postId + "-" + postItem.content.mediaType + '-channel';
      let exit = this.observerList[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.newSectionObserver(postItem, "channel");
    }
  }

  removeObserveList() {
    for (let postGridId in this.observerList) {
      let observer = this.observerList[postGridId] || null;
      this.removeSectionObserver(postGridId, observer)
    }
    this.observerList = {};
  }

  removeSectionObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.observerList[postGridId] = null;
      }
    }
  }

  newSectionObserver(postItem: any, elementsName: string) {

    let postGridId = postItem.destDid + "-" + postItem.channelId + "-" + postItem.postId + "-" + postItem.content.mediaType + '-' + elementsName;
    let observer = this.observerList[postGridId] || null;
    if (observer != null) {
      return;
    }

    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (elementsName === "channel") {
        this.observerList[postGridId] = new IntersectionObserver(async (changes: any) => {
          let container = changes[0].target;
          let newId = container.getAttribute("id");
          let intersectionRatio = changes[0].intersectionRatio;

          if (intersectionRatio === 0) {
            return;
          }

          let arr = newId.split("-");
          let destDid: string = arr[0];
          let channelId: string = arr[1];
          let postId: string = arr[2];
          let mediaType: string = arr[3];
          if (mediaType === '3' || mediaType === '4') {
            //获取repost
            let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(postId) || null;
            const repostUrl = post.content.mediaData[0].repostUrl;
            const feedsUrlObj = UtilService.decodeFeedsUrl(repostUrl);
            let loadedRepost: FeedsData.PostV3 = await this.dataHelper.getCachedPostV3ById(feedsUrlObj.postId) || null;//TODO replace with load repost later
            if (!loadedRepost) {
              loadedRepost = await this.hiveVaultController.queryPostByPostId(feedsUrlObj.targetDid, feedsUrlObj.channelId, feedsUrlObj.postId, false);
            }
            this.rePostMap[postId] = _.cloneDeep(loadedRepost);
            //this.rePostMap[postId] = _.cloneDeep(post);
            this.refreshRepostImageV2(this.rePostMap[postId]);
          }
          this.handlePinnedPost(destDid, channelId, postId);
          if (mediaType === '1') {
            this.handlePostImgV2(destDid, channelId, postId);
          }
          if (mediaType === '2') {
            //video
            this.handleVideoV2(destDid, channelId, postId);
          }

          //post like status
          let id = destDid + '-' + channelId + '-' + postId;
          CommonPageService.handlePostLikeStatusData(
            destDid, channelId, postId, this.isInitLikeStatus, this.hiveVaultController,
            this.likeMap, this.isLoadingLikeMap)
          //处理post like number
          CommonPageService.handlePostLikeNumData(
            destDid, channelId, postId, this.hiveVaultController,
            this.likeNumMap, this.isInitLikeNum);
          //处理post comment
          CommonPageService.handlePostCommentData(
            destDid, channelId, postId, this.hiveVaultController,
            this.isInitComment, this.commentNumMap);
        });

        this.observerList[postGridId].observe(item);
      }

      if (elementsName === "channel-repost") {
        this.observerList[postGridId] = new IntersectionObserver(async (changes: any) => {
          let container = changes[0].target;
          let newId = container.getAttribute("id");
          let intersectionRatio = changes[0].intersectionRatio;

          if (intersectionRatio === 0) {
            return;
          }

          let arr = newId.split("-");
          let destDid: string = arr[0];
          let channelId: string = arr[1];
          let postId: string = arr[2];
          let mediaType: string = arr[3];
          this.handlePinnedPost(destDid, channelId, postId);
          if (mediaType === '1') {
            this.handlePostImgV2(destDid, channelId, postId);
          }
          if (mediaType === '2') {
            //video
            this.handleVideoV2(destDid, channelId, postId);
          }
        });

        this.observerList[postGridId].observe(item);
      }

    }
  }

  handlePinnedPost(destDid: string, channelId: string, postId: string) {
    let key = destDid + '-' + channelId + '-' + postId;
    let isLoad = this.isLoadPinnedPost[key] || "";
    if (isLoad === "") {
      let pinnedPost = this.pinnedPostMap[key] || '';
      if (pinnedPost === '') {
        this.pinnedPostMap[key] = "1";
      }
    }
  }

  postListScroll(event: any) {
    this.handlePostListScroll(event);
  }

  handlePostListScroll(event: any) {

    if (event.detail.deltaY > 0) {

      if (this.firstScrollTop === 0 && event.detail.scrollTop > 0) {
        this.firstScrollTop = 1;
        this.isFullPost = true;
        this.refresher.disabled = true;
      }
    } else if (event.detail.deltaY < 0) {
      if (this.totalData.length > 4 && this.firstScrollTop > 0 && event.detail.scrollTop <= 0) {
        this.firstScrollTop = 0;
        this.isFullPost = false;
        this.refresher.disabled = false;
      }

    };
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


  async presentPopover(e: Event) {

    this.infoPopover = await this.popoverController.create({
      mode: 'ios',
      component: MorenameComponent,
      event: e,
      componentProps: {
        name: this.channelDesc,
      },
    });

    this.infoPopover.onWillDismiss().then(() => {
      this.infoPopover = null;
    });

    return await this.infoPopover.present();
  }

  closeFullSrceenPost() {
    if (this.isFullPost) {
      this.firstScrollTop = 0;
      this.isFullPost = false;
      this.refresher.disabled = false;
    }
  }

  refreshRepostImageV2(post = null) {
    this.clearRefreshRepostImageV2();
    this.refreshRepostImageSid = setTimeout(() => {
      this.newSectionObserver(post, "channel-repost");
      this.clearRefreshRepostImageV2();
    }, 100);
    //this.newSectionObserver();
  }

  clearRefreshRepostImageV2() {
    if (this.refreshRepostImageSid != null) {
      clearTimeout(this.refreshRepostImageSid);
      this.refreshRepostImageSid = null;
    }
  }

  initRepostData() {
    for (let index = 0; index < this.postList.length; index++) {
      const post = this.postList[index];

      this.dataHelper.getReportedRePostNumById(this.postId).then((count: number) => {
        this.repostNumMap[post.postId] = count;
      });
    }
  }
}
