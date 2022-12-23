import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import ChatBubbleIcon from '@iconify/icons-clarity/chat-bubble-line';
import { IonTextarea, ModalController, Platform } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { UtilService } from 'src/app/services/utilService';
import { IonInfiniteScroll, PopoverController } from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { CommonPageService } from 'src/app/services/common.page.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import SparkMD5 from 'spark-md5';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
let TAG: string = 'Feeds-postview';
@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;
  public postImage: string = 'assets/images/loading.png';
  public avatar: string = '';
  chatIcon = ChatBubbleIcon

  public channelAvatar: string = '';
  public channelName: string = '';
  public commentAvatar: string = '';
  public commentName: string = '';
  public channelWName: string = '';
  public channelOwner: string = '';
  public channelWOwner: string = '';
  public postContent: string = null;
  public updatedTime: number = 0;
  public likesNum: number = 0;
  public commentsNum: number = 0;

  public captainCommentList: any = [];

  public destDid: string = '';
  public channelId: string = "0";
  public postId: string = "";
  public pageSize: number = 1;
  public pageNumber: number = 5;
  public totalData: any = [];

  public popover: any;

  public postStatus: number = 0;
  public styleObj: any = { width: '' };
  public dstyleObj: any = { width: '' };

  public hideComment = true;

  public videoPoster: string = '';
  public posterImg: string = '';
  public videoObj: string = '';
  public videoisShow: boolean = false;

  public cacheGetBinaryRequestKey = '';
  public cachedMediaType = '';

  public mediaType: FeedsData.MediaType;

  public hideDeletedComments: boolean = false;

  public maxTextSize = 240;

  public isFullContent = {};

  public isOwnComment = {};

  public userNameList: any = {};

  public isPress: boolean = false;
  public roundWidth: number = 40;
  /**
   * imgPercentageLoading
   */
  public isImgPercentageLoading: boolean = false;
  public imgPercent: number = 0;
  public imgRotateNum: any = {};
  /**
   * imgloading
   */
  public isImgLoading: boolean = false;
  public imgloadingStyleObj: any = {};
  public imgDownStatus: string = '';

  /**
   * videoPercentageLoading
   */
  public isVideoPercentageLoading: boolean = false;
  public videoPercent: number = 0;
  public videoRotateNum: any = {};
  /**
   * videoloading
   */
  public isVideoLoading: boolean = false;
  public videoloadingStyleObj: any = {};
  public videoDownStatus: string = '';

  public isAndroid: boolean = true;

  public refcommentId: string = '0';

  public commentId: string = '';

  public curComment: any = {};
  private maxCount: number = 0;
  private post: FeedsData.PostV3 = null;
  private channelAvatarUri: string = null;
  public isLike: boolean = false;
  public likedCommentMap: any = {};
  public likedCommentNum: any = {};
  public commentNum: any = {};
  private clientHeight: number = 0;
  private clientWidth: number = 0;
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  private postCommentList: FeedsData.CommentV3[] = [];
  private isInitUserNameMap: any = {};
  public userNameMap: any = {};
  public userAvatarMap: { [userDid: string]: string } = {};
  private isloadingLikeMap: any = {};
  private isLoadingLike = false;
  public channelOwnerName: string = '';
  public replyCommentsMap: { [refcommentId: string]: FeedsData.CommentV3[] } = {};
  public ownerDid: string = "";
  public updatedTimeStr: string = "";
  private commentTime: any = {};
  private captainObserverList: any = {};
  private replyObserverList: any = {};
  public isSubscribed: boolean = false;
  private refreshLikeAndCommentSid: any = null;
  public channelPublicStatusList: any = {};
  public createrDid: string = '';
  private isClickDashang: boolean = true;
  /**post tip count*/
  public postTipCountMap: any = {};
  private isLoadingPostTipCountMap: any = {};
  private postTipAdressMap: any = {};
  constructor(
    private platform: Platform,
    private popoverController: PopoverController,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    public theme: ThemeService,
    private translate: TranslateService,
    public menuService: MenuService,
    public appService: AppService,
    public modalController: ModalController,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private walletConnectControllerService: WalletConnectControllerService
  ) { }


  async initData(isInit: boolean) {

    if(this.channelAvatar === ''){
      this.channelAvatar = './assets/images/loading.svg'
    }

    try {
      this.getDisplayName(this.destDid, this.channelId, this.destDid);
    } catch (error) {

    }
    let userDid = (await this.dataHelper.getSigninData()).did;
    try {
      this.getDisplayName(userDid, this.channelId, userDid);
    } catch (error) {

    }
    let channel: FeedsData.ChannelV3 =
      await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;

    this.isSubscribed = await this.checkFollowStatus(this.destDid, this.channelId);
    if (!channel) {
      channel = await this.hiveVaultController.getChannelV3ByIdFromRemote(this.destDid, this.channelId);
    }

    this.channelOwner = channel.destDid || '';
    this.channelOwnerName = this.indexText(channel.destDid);
    this.channelWName = channel['displayName'] || channel['name'] || '';
    this.channelName = channel['displayName'] || channel['name'] || '';
    let channelAvatarUri = channel['avatar'] || '';
    if (channelAvatarUri != '') {
      this.channelAvatarUri = channelAvatarUri;
      this.handleChannelAvatar(channelAvatarUri);
    }
    this.initPostContent();
    if (isInit) {
      this.initRefresh();
    } else {
      this.refreshCommentList();
    }

    this.hideDeletedComments = this.dataHelper.getHideDeletedComments();
    this.replyCommentsMap = await this.hiveVaultController.getReplyCommentListMap(this.postId, this.hideDeletedComments);
    this.initRelyCommentExtradata();
    try {
      this.getChannelPublicStatus(this.destDid, this.channelId);
    } catch (error) {

    }
  }

  async initRelyCommentExtradata() {
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    for (let key in this.replyCommentsMap) {
      let commentList: FeedsData.CommentV3[] = this.replyCommentsMap[key] || [];
      this.checkRelyCommentIsMine(commentList, ownerDid);
      this.getReplyCommentObserverList(commentList);
    }
  }

  checkRelyCommentIsMine(commentList: FeedsData.CommentV3[], ownerDid: string) {
    _.forEach(commentList, (item: FeedsData.CommentV3) => {
      this.checkCommentIsMine(item, ownerDid);
    });
  }

  handleChannelAvatar(channelAvatarUri: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        result = result || '';
        if (result != '') {
          this.channelAvatar = result;
        } else {
          if (this.channelAvatar === './assets/images/loading.svg') {
            this.channelAvatar = "./assets/images/profile-0.svg";
          }
        }
      }).catch((err) => {
        if (this.channelAvatar === './assets/images/loading.svg') {
          this.channelAvatar = "./assets/images/profile-0.svg";
        }
      })
  }

  async initRefresh() {
    this.pageSize = 1;
    this.totalData = await this.sortCommentList();
    let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalData);
    if (data.currentPage === data.totalPage) {
      this.captainCommentList = data.items
      this.infiniteScroll.disabled = true;
    } else {
      this.captainCommentList = data.items;
      this.infiniteScroll.disabled = false;
    }
    this.initOwnCommentObj();
    this.refreshLikeAndCommentV2(this.captainCommentList);
    //this.totalData = this.sortCommentList();
  }

  async initOwnCommentObj() {
    let captainCommentList = _.cloneDeep(this.captainCommentList);
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    _.each(captainCommentList, (item: FeedsData.CommentV3) => {
      let key = item.commentId;
      this.userNameList[key] = item.destDid;
      this.checkCommentIsMine(item, ownerDid);
    });


    this.getChannelTippingAddress(this.channelId, false).then((postTipAdress: string) => {
      this.postTipAdressMap[this.channelId] = postTipAdress;
      if(this.isAndroid){
        this.getPostTipCount(this.channelId, this.postId);
      }
    }).catch((err) => {
      this.postTipAdressMap[this.channelId] = '';
    });

    //this.captainCommentList = _.cloneDeep(captainCommentList);
  }

  async refreshCommentList() {
    this.totalData = await this.sortCommentList();
    if (this.totalData.length === this.captainCommentList.length) {
      this.captainCommentList = this.totalData;
    } else if (
      this.pageSize != 1 &&
      this.totalData.length - this.pageNumber * this.pageSize > 0
    ) {
      this.captainCommentList = this.totalData.slice(
        0,
        this.pageSize * this.pageNumber,
      );
    } else {
      this.captainCommentList = this.totalData;
    }
    this.initOwnCommentObj();
    this.refreshLikeAndCommentV2(this.captainCommentList);
  }

  async sortCommentList() {
    let captainCommentList = [];
    try {
      captainCommentList =
        await this.hiveVaultController.getCommentList(
          this.postId,
          '0'
        ) || [];
      this.postCommentList = _.cloneDeep(captainCommentList);
    } catch (error) {

    }
    let post: any = await this.dataHelper.getPostV3ById(this.postId) || null;
    this.getCommentsNum(post);
    captainCommentList = this.postCommentList;
    captainCommentList = _.filter(captainCommentList, (item: FeedsData.CommentV3) => {
      return item.refcommentId === '0';
    });

    captainCommentList = _.sortBy(captainCommentList, (item: FeedsData.CommentV3) => {
      return -Number(item.createdAt);
    });

    this.hideDeletedComments = this.dataHelper.getHideDeletedComments();
    if (!this.hideDeletedComments) {
      captainCommentList = _.filter(captainCommentList, (item: any) => {
        return item.status != 1;
      });
    }

    this.maxCount = captainCommentList.length;
    return captainCommentList;
  }

  ngOnInit() {
    this.acRoute.params.subscribe(data => {
      this.destDid = data.destDid;
      this.channelId = data.channelId;
      this.postId = data.postId;
    });
  }

  async initPostContent() {
    try {
      let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(this.postId);
      if (!post) {
        post = await this.hiveVaultController.queryPublicPostById(this.destDid, this.channelId, this.postId);
      }
      this.post = post;

      if (!this.post) {
        //TODO
      }
      this.postStatus = post.status || 0;
      this.mediaType = post.content.mediaType;
      this.postContent = post.content.content;
      this.updatedTime = post.updatedAt;
      this.updatedTimeStr = this.handleUpdateDate(this.updatedTime);
      if (this.mediaType === FeedsData.MediaType.containsImg) {
        this.getImage(post);
      }
      if (this.mediaType === FeedsData.MediaType.containsVideo) {
        this.getVideoPoster(post);
      }

      // like status
      this.getLikeStatus(post.postId, '0');
      this.getPostLikeNum(post.postId, '0');
    } catch (error) {
      //TODO
    }
  }

  getLikeStatus(postId: string, commentId: string) {
    try {
      this.isLoadingLike = true;
      this.hiveVaultController.getLikeStatus(postId, commentId).then((status) => {
        this.isLike = status;
        this.isLoadingLike = false;
      }).catch((err) => {
        this.isLoadingLike = false;
      });
      this.isLoadingLike = false;
    } catch (err) {
      this.isLoadingLike = false;
    }
  }

  initial() {
    this.clientHeight = screen.availHeight;
    this.clientWidth = screen.availWidth;
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }

    this.hideDeletedComments = this.dataHelper.getHideDeletedComments();
    this.initTitle();
    this.styleObj.width = screen.width - 55 + 'px';
    this.dstyleObj.width = screen.width - 105 + 'px';
    this.initData(true);

    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish, (comment: FeedsData.CommentV3) => {
      this.zone.run(() => {
        Logger.log(TAG, 'Received commentDataUpdate event');
        this.pageSize = 1;
        this.initData(true);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updatePostTipCount, (item: any) => {
      let postId = item.postId;
      this.postTipCountMap[postId] = item.postTipCount;
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, (deletePostEventData: FeedsData.PostV3) => {
      Logger.log(TAG, 'Received deletePostFinish event');
      this.zone.run(async () => {
        await this.native.showLoading('common.waitMoment');
        try {
          let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(deletePostEventData.postId);
          this.hiveVaultController.deletePost(post).then(async (result: any) => {
            await this.initData(true);
            this.native.hideLoading();
            this.events.publish(FeedsEvent.PublishType.updateTab);
          }).catch((err: any) => {
            this.native.hideLoading();
          })
        } catch (error) {
          this.native.hideLoading();
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.deleteCommentFinish, async (comment: FeedsData.CommentV3) => {
      Logger.log(TAG, 'Received deleteCommentFinish event');
      await this.native.showLoading('common.waitMoment');
      try {
        this.hiveVaultController
          .deleteComment(comment)
          .then(async (newComment: FeedsData.CommentV3) => {
            let postId = comment.postId;
            let refcommentId = comment.refcommentId;
            let cachedCommentList = this.dataHelper.getcachedCommentList(postId, refcommentId) || [];

            let index = _.findIndex(cachedCommentList, (item: FeedsData.CommentV3) => {
              return item.destDid === newComment.destDid &&
                item.channelId === newComment.channelId &&
                item.postId === newComment.postId &&
                item.commentId === newComment.commentId;
            });
            if (index > -1) {
              cachedCommentList[index] = newComment;
            }
            this.pageSize = 1;
            await this.initData(false);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          })
      } catch (error) {
        this.native.hideLoading();
      }

    });

    this.events.subscribe(FeedsEvent.PublishType.pinPostFinish, async (pinPostFinishData) => {
      if (!pinPostFinishData) {
        return;
      }
      const originPostId = pinPostFinishData.originPostId || null;
      if (originPostId) {
        this.post.pinStatus = FeedsData.PinStatus.PINNED;
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.unpinPostFinish, async (needUnpinPostId) => {
      if (!needUnpinPostId) {
        return;
      }
      this.post.pinStatus = FeedsData.PinStatus.NOTPINNED;
    });
  }

  ionViewWillEnter() {
    //this.zone.run(() => {
    //const initTimmer = setTimeout(() => {
    this.initial();
    //clearTimeout(initTimmer);
    //}, 300);
    //});
  }

  ionViewWillLeave() {
    this.commentTime = {};
    this.hideComment = true;
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.updatePostTipCount);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deleteCommentFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.pinPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.unpinPostFinish);
    this.removeCaptainCommentObserverList();
    this.removeReplyCommentObserverList();
    this.native.handleTabsEvents();
    this.isInitLikeNum = {};
    this.isInitComment = {};
    this.isInitLikeStatus = {};
    this.isLoadingPostTipCountMap = {};
  }

  ionViewDidLeave() {
    this.menuService.hideActionSheet();
    if (this.popover != null) {
      this.popover.dismiss();
    }

    this.imgDownStatus = '';
    this.isImgPercentageLoading = false;
    this.isImgLoading = false;
    this.isVideoPercentageLoading = false;
    this.isVideoLoading = false;
    this.videoDownStatus = '';
    this.isFullContent = {};
    this.isOwnComment = {};
    this.clearVideo();
  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('PostdetailPage.postview'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  getContentText(content: string): string {
    return this.feedsServiceApi.parsePostContentText(content);
  }

  getContentImg(content: any): string {
    return this.feedsServiceApi.parsePostContentImg(content);
  }

  indexText(text: string): string {
    text = text || "";
    if (text != '') {
      text = text.replace('did:elastos:', '');
      return UtilService.shortenDid(text);
    }
  }

  showComment(comment: FeedsData.CommentV3) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.hideComment) {
      this.hideComment = false;
    } else {
      //  let comment1:any =  document.getElementById("newComment") || null;
      //  if(comment1 != null){
      //     comment1.setFocus();
      //  }
    }

    if (comment === null) {
      this.refcommentId = '0';
      this.createrDid = this.destDid;
      this.commentName = this.userNameMap[this.createrDid];
      this.commentAvatar = this.channelAvatarUri;
    } else {
      this.refcommentId = comment.commentId;
      this.commentName = this.userNameMap[comment.createrDid];
      if (this.destDid === comment.createrDid) {
        this.commentAvatar = this.channelAvatarUri;
        this.createrDid = comment.createrDid;
      } else {
        this.commentAvatar = '';
        this.createrDid = comment.createrDid;
      }
    }



    this.pauseVideo();
  }

  like() {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.isLoadingLike) {
      return;
    }

    this.isLoadingLike = true;
    if (this.isLike) {
      this.hiveVaultController.removeLike(this.destDid, this.channelId, this.postId, '0')
        .then(() => {
          this.isLike = false;
          if (this.likesNum > 0) {
            this.likesNum = this.likesNum - 1;
          }
          //update cached
          this.dataHelper.cacheLikeStatus(this.postId, '0', false);
          let likedNum = this.dataHelper.getCachedLikeNum(this.postId, '0') || 0;
          if (likedNum > 0) {
            likedNum = likedNum - 1;
          }
          this.dataHelper.cacheLikeNum(this.postId, '0', likedNum);
          this.isLoadingLike = false;
        })
        .catch(err => {
          this.isLoadingLike = false;
        });
      return;
    } else {
      this.hiveVaultController.like(this.destDid, this.channelId, this.postId, '0')
        .then(() => {
          this.isLike = true;
          this.likesNum = this.likesNum + 1;
          //update cached
          this.dataHelper.cacheLikeStatus(this.postId, '0', true);
          let likedNum = this.dataHelper.getCachedLikeNum(this.postId, '0') || 0;
          likedNum = likedNum + 1;
          this.dataHelper.cacheLikeNum(this.postId, '0', likedNum);
          this.isLoadingLike = false;
        })
        .catch((err) => {
          this.isLoadingLike = false;
        });
    }
  }

  likeComment(comment: FeedsData.CommentV3) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    CommonPageService.likeComment(
      comment,
      this.likedCommentMap,
      this.isloadingLikeMap,
      this.likedCommentNum,
      this.hiveVaultController,
      this.dataHelper
    );
  }

  handleUpdateDate(updatedTime: number) {
    if (updatedTime === 0) {
      return;
    }
    let updateDate = new Date(updatedTime);
    return UtilService.dateFormat(updateDate, 'yyyy-MM-dd HH:mm:ss');
  }

  async menuMore() {
    let isMine = await this.checkChannelIsMine();
    this.pauseVideo();
    const needUnpinPost = await this.dataHelper.queryChannelPinPostData(this.channelId);
    if (isMine === 1 && this.postStatus != 1) {
      this.menuService.showPostDetailMenu(
        this.post,
        this.channelName,
        needUnpinPost
      );
    } else {
      this.menuService.showShareMenu(
        this.destDid,
        this.channelId,
        this.channelName,
        this.postId,
        this.post
      );
    }
  }

  showBigImage(destDid: string, channelId: string, postId: string) {
    this.zone.run(async () => {

      if (this.imgDownStatus != '') {
        return;
      }
      let imagesId = UtilService.gethtmlId(
        'postdetail',
        'img',
        destDid,
        channelId,
        postId,
      );
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 8 + 'px';
      this.isImgLoading = true;

      let post = await this.dataHelper.getPostV3ById(postId);
      let mediaDatas = post.content.mediaData;
      const elements = mediaDatas[0];
      //原图
      let imageKey = elements.originMediaPath;
      let type = elements.type;
      //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
      let fileOriginName: string = imageKey.split("@")[0];
      //原图
      try {
        this.hiveVaultController
          .getV3Data(destDid, imageKey, fileOriginName, type, "false")
          .then(realImg => {
            let img = realImg || '';
            this.isImgLoading = false;
            if (img != '') {
              this.viewHelper.openViewer(
                this.titleBar,
                realImg,
                'common.image',
                'PostdetailPage.postview',
                this.appService,
              );
            } else {
              this.imgDownStatus = '1'; //session down
              this.isImgLoading = false;
              this.isImgPercentageLoading = true;

              this.hiveVaultController
                .getV3Data(destDid, imageKey, fileOriginName, type)
                .then(async realImg => {
                  let img = realImg || '';
                  this.imgDownStatus = '';
                  this.isImgPercentageLoading = false;
                  if (img != '') {
                    this.viewHelper.openViewer(
                      this.titleBar,
                      realImg,
                      'common.image',
                      'PostdetailPage.postview',
                      this.appService,
                    );
                  }
                }).catch(() => {
                  this.imgDownStatus = '';
                  this.isImgLoading = false;
                });

            }
          }).catch(() => {
            this.imgDownStatus = '';
            this.isImgLoading = false;
          });
      } catch (error) {
        this.imgDownStatus = '';
        this.isImgLoading = false;
      }
    });
  }

  getImage(post: FeedsData.PostV3) {
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    //原图
    let imageKey = elements.originMediaPath;
    let fileOriginName: string = imageKey.split("@")[0];

    let thumbnailKey = elements.thumbnailPath;

    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = thumbnailKey.split("@")[0];

    this.hiveVaultController
      .getV3Data(this.destDid, imageKey, fileOriginName, type, "false")
      .then(async realImg => {
        let img = realImg || '';
        if (img != '') {
          this.postImage = img;
        } else {
          this.hiveVaultController.getV3Data(this.destDid, thumbnailKey, fileName, type)
            .then((cacheResult) => {
              let thumbImage = cacheResult || "";
              if (thumbImage != "") {
                this.postImage = thumbImage;
              }
            }).catch(() => {
            })
        }
      }).catch((err) => {

      })
  }

  async doRefresh(event: any) {
    //this.postImage = "";
    try {
      this.dataHelper.cleanCachedComment();
      this.dataHelper.cleanCacheLikeNum();
      this.dataHelper.cleanCachedLikeStatus();
      await this.hiveVaultController.queryPostByPostIdFromRemote(this.destDid, this.channelId, this.postId);
      await this.hiveVaultController.syncCommentFromPost(this.destDid, this.channelId, this.postId);
      await this.hiveVaultController.syncLikeDataFromChannel(this.destDid, this.channelId);
      this.removeReplyCommentObserverList();
      this.removeCaptainCommentObserverList();
      this.dataHelper.setChannelPublicStatusList({});
      this.isInitUserNameMap = {};
      this.isLoadingPostTipCountMap = {};
      this.initData(true);
      event.target.complete();
    } catch (error) {
      event.target.complete();
    }
  }

  loadData(event: any) {
    let sid = setTimeout(() => {
      this.pageSize++;
      let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalData);
      if (data.currentPage === data.totalPage) {
        this.captainCommentList = this.captainCommentList.concat(data.items);
        event.target.disabled = true;
      } else {
        this.captainCommentList = this.captainCommentList.concat(data.items);
      }
      this.initOwnCommentObj();
      this.refreshLikeAndCommentV2(data.items);
      clearTimeout(sid);
      event.target.complete();
    }, 500);

  }

  pressName() {
    if (this.channelWName != '' && this.channelWName.length > 15) {
      this.viewHelper.createTip(this.channelWName);
    }
  }

  pressOwnerName() {
    if (this.channelWOwner != '' && this.channelWOwner.length > 40) {
      this.viewHelper.createTip(this.channelWOwner);
    }
  }

  userName(userName: string) {
    let name = userName || '';

    if (name != '') {
      this.viewHelper.createTip(name);
    }
  }

  async openEditTool(comment: any) {
    this.curComment = comment;
    this.menuService.showCommentDetailMenu(comment);
  }

  async openReplyTool(comment: any) {
    this.curComment = comment;
    this.menuService.showReplyDetailMenu(comment);
  }


  handleCommentStatus() {
    let status = '(edit)';
    return status;
  }

  async checkChannelIsMine() {

    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    if (this.destDid != ownerDid) {
      return 0;
    }
    return 1;
  }

  navTo(destDid: string, channelId: string) {
    this.native.navigateForward(['/channels', destDid, channelId], '');
  }

  checkCommentIsMine(comment: FeedsData.CommentV3, ownerDid: string) {
    let commentId = comment.commentId;
    let destDid = comment.createrDid;
    if (destDid != ownerDid) {
      this.isOwnComment[commentId] = false;
      return false;
    }
    this.isOwnComment[commentId] = true;
  }

  hideComponent(event) {
    this.hideComment = true;
  }

  getVideoPoster(post: FeedsData.PostV3) {
    this.videoisShow = true;
    this.postImage = './assets/icon/reserve.svg';//set Reserve Image
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let thumbnailKey = elements.thumbnailPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = thumbnailKey.split("@")[0];
    this.hiveVaultController
      .getV3Data(this.destDid, thumbnailKey, fileName, type)
      .then(imagedata => {
        let image = imagedata || '';
        if (image != '') {
          this.zone.run(() => {
            this.posterImg = imagedata;
            let id = this.destDid + this.channelId + this.postId;
            let sid = setTimeout(() => {
              let video: any =
                document.getElementById(id + 'postdetailvideo') || '';
              if (video != '') {
                video.setAttribute('poster', this.posterImg);
              }
              this.setFullScreen();
              this.setOverPlay();
              clearTimeout(sid);
            }, 10);
          });
        } else {
          this.videoisShow = false;
        }
      })
      .catch(err => { });
  }

  getVideo() {
    let videoId = UtilService.gethtmlId(
      'postdetail',
      'video',
      this.destDid,
      this.channelId,
      this.postId,
    );
    let videoObj = document.getElementById(videoId);
    let videoWidth = videoObj.clientWidth;
    let videoHeight = videoObj.clientHeight;
    this.videoloadingStyleObj['z-index'] = 999;
    this.videoloadingStyleObj['position'] = 'absolute';
    this.videoloadingStyleObj['left'] =
      (videoWidth - this.roundWidth) / 2 + 'px';
    this.videoloadingStyleObj['top'] =
      (videoHeight - this.roundWidth) / 2 + 'px';
    this.isVideoLoading = true;

    let mediaDatas = this.post.content.mediaData;
    const elements = mediaDatas[0];
    let originKey = elements.originMediaPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = originKey.split("@")[0];

    this.hiveVaultController
      .getV3Data(this.destDid, originKey, fileName, type, "false")
      .then((videodata: string) => {
        this.zone.run(() => {
          let videoData = videodata || '';
          if (videoData === '') {
            this.videoDownStatus = '1';
            this.isVideoLoading = true;
            this.isVideoPercentageLoading = false;
            this.hiveVaultController.getV3Data(this.destDid, originKey, fileName, type)
              .then((downVideodata) => {
                let downVideoData = downVideodata || '';
                this.videoObj = downVideoData;
                this.loadVideo(downVideoData);
              }).catch((err) => {
                this.videoDownStatus = '';
                this.isVideoPercentageLoading = false;
                this.isVideoLoading = false;
              });
            return;
          }
          this.videoObj = videoData;
          this.loadVideo(videoData);
        });
      }).catch((err) => {
        this.videoDownStatus = '';
        this.isVideoPercentageLoading = false;
        this.isVideoLoading = false;
      });
  }

  loadVideo(videodata: any) {
    this.isVideoLoading = false;
    this.isVideoPercentageLoading = false;
    this.videoDownStatus = '';
    let id = this.destDid + this.channelId + this.postId;
    let source: any = document.getElementById(id + 'postdetailsource') || '';
    source.setAttribute('src', videodata);
    let video: any = document.getElementById(id + 'postdetailvideo') || '';
    let vgoverlayplay: any = document.getElementById(
      id + 'vgoverlayplaypostdetail',
    );
    let vgcontrol: any = document.getElementById(id + 'vgcontrolspostdetail');
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

  pauseVideo() {
    if (this.postStatus != 1 && this.mediaType === 2) {
      let id = this.destDid + this.channelId + this.postId;
      let video: any = document.getElementById(id + 'postdetailvideo') || '';
      let source: any = document.getElementById(id + 'postdetailsource') || '';
      if (video != '' && source != '' && !video.paused) {
        //判断是否处于暂停状态
        video.pause(); //停止播放
      }
    }
  }

  clearVideo() {
    if (this.postStatus != 1 && this.mediaType === 2) {

      let id = this.destDid + this.channelId + this.postId;
      let video: any = document.getElementById(id + 'postdetailvideo') || '';
      if (video != '') {
        let source: any = document.getElementById(id + 'postdetailsource') || '';
        if (source != '') {
          source.removeAttribute('src'); // empty source
        }

        this.posterImg = '';
        this.videoObj = '';
      }
    }
  }

  setFullScreen() {
    let id = this.destDid + this.channelId + this.postId;
    let vgfullscreen: any =
      document.getElementById(id + 'vgfullscreenpostdetail') || '';
    if (vgfullscreen != '') {
      vgfullscreen.onclick = async () => {
        this.pauseVideo();
        let postImg: string = document
          .getElementById(id + 'postdetailvideo')
          .getAttribute('poster');
        let videoSrc: string = document
          .getElementById(id + 'postdetailsource')
          .getAttribute('src');
        await this.native.setVideoFullScreen(
          postImg,
          videoSrc,
        );
      };
    }
  }


  setOverPlay() {
    let id = this.destDid + this.channelId + this.postId;
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplaypostdetail') || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {

          let source: any =
            document.getElementById(id + 'postdetailsource') || '';
          if (source === '') {
            return;
          }
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc != '') return;

          this.getVideo();
        });
      };
    }
  }

  getPostContentTextSize(content: string) {
    let size = UtilService.getSize(content);
    return size;
  }

  handleCommentContent(text: string) {
    return text.substring(0, 180);
  }

  showFullContent(commentId: string) {
    this.isFullContent[commentId] = true;
  }

  hideFullContent(commentId: string) {
    this.isFullContent[commentId] = false;
  }

  pressContent(postContent: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    let text = postContent || "";
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickUrl(event: any) {
    event = event || '';
    if (event != '') {
      let e = event || window.event; //兼容IE8
      let target = e.target || e.srcElement; //判断目标事件
      if (target.tagName.toLowerCase() == 'span') {
        if (this.isPress) {
          this.isPress = false;
          return;
        }
        let url = target.textContent || target.innerText;
        let reg = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;
        var urlExp = new RegExp(reg);
        if (urlExp.test(url) === true) {
          this.native.clickUrl(url, event);
        } else {//
          this.handlePostText(url, event);
        }
      }
    }
  }

  handleDisplayTime(commentId: string, createTime: number) {
    let newCommentTime = this.commentTime[commentId] || null;
    if (newCommentTime != null) {
      return newCommentTime;
    }
    let obj = UtilService.handleDisplayTime(createTime);
    if (obj.type === 's') {
      this.commentTime[commentId] = this.translate.instant('common.just');
      return this.commentTime[commentId];
    }
    if (obj.type === 'm') {
      if (obj.content === 1) {
        this.commentTime[commentId] = obj.content + this.translate.instant('HomePage.oneminuteAgo');
        return this.commentTime[commentId];
      }
      this.commentTime[commentId] = obj.content + this.translate.instant('HomePage.minutesAgo');
      return this.commentTime[commentId];
    }
    if (obj.type === 'h') {
      if (obj.content === 1) {
        this.commentTime[commentId] = obj.content + this.translate.instant('HomePage.onehourAgo');
        return this.commentTime[commentId];
      }
      this.commentTime[commentId] = obj.content + this.translate.instant('HomePage.hoursAgo');
      return this.commentTime[commentId];
    }

    if (obj.type === 'day') {
      if (obj.content === 1) {
        this.commentTime[commentId] = this.translate.instant('common.yesterday');
        return this.commentTime[commentId];
      }
      this.commentTime[commentId] = obj.content + this.translate.instant('HomePage.daysAgo');

      return this.commentTime[commentId];
    }
    this.commentTime[commentId] = obj.content;
    return this.commentTime[commentId];
  }

  async clickDashang() {
    if (!this.isClickDashang) {
      return;
    }
    this.isClickDashang = false;
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      this.isClickDashang = true;
      return;
    }

    let tippingAddress = '';
    try {
      let channelTippingAddress = await this.getChannelTippingAddress(this.channelId) || null;
      if (channelTippingAddress === null) {
        tippingAddress = '';
      } else {
        tippingAddress = channelTippingAddress;
      }
    } catch (error) {
      tippingAddress = '';
      this.isClickDashang = true;
    }

    if (tippingAddress == '') {
      this.native.toastWarn('common.noElaAddress');
      this.isClickDashang = true;
      return;
    }

    if (tippingAddress != '') {
      let walletAdress: string = this.nftContractControllerService.getAccountAddress() || '';
      if (walletAdress === "") {
        this.isClickDashang = true;
        await this.walletConnectControllerService.connect();
        return;
      }
    }

    this.pauseVideo();
    await this.viewHelper.showPayPrompt(this.destDid, this.channelId, tippingAddress, this.postId);
    this.isClickDashang = true;
  }

  clickComment(comment: FeedsData.CommentV3, event?: any) {
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
        } else {//
          this.handlePostText(url, event);
        }
        return;
      }
    }
    // let commentId: string = comment.commentId;
    // let createrDid: string = comment.createrDid;
    // this.native.navigateForward(['commentlist'], {
    //   queryParams: {
    //     destDid: this.destDid,
    //     channelId: this.channelId,
    //     postId: this.postId,
    //     commentId: commentId,
    //     createrDid: createrDid
    //   },
    // });
  }

  retry(destDid: string, channelId: string, postId: string) {
  }

  getPostLikeNum(postId: string, commentId: string) {
    try {
      this.hiveVaultController.getLikeNum(
        postId, commentId
      ).then((result) => {
        let listNum = result || 0;
        this.likesNum = listNum;
      }).catch((err) => {
        this.likesNum = 0;
      });
    } catch (err) {
      this.likesNum = 0;
    }
  }

  getCommentsNum(post: FeedsData.PostV3) {
    let commentPostList = _.filter(this.postCommentList, (item) => {
      return item.channelId === post.channelId && item.postId === post.postId && item.refcommentId === "0";
    }) || [];
    this.commentsNum = commentPostList.length;
  }

  async getPostComments(post: FeedsData.PostV3) {

    try {
      this.hiveVaultController.getCommentList(
        post.channelId, post.postId
      ).then((result) => {
        this.postCommentList = _.cloneDeep(result);
        this.getCommentsNum(post);
      });
    } catch (error) {

    }
  }

  ionScroll() {

  }

  clearRefreshFollowingImageSid() {
    if (this.refreshLikeAndCommentSid != null) {
      cancelAnimationFrame(this.refreshLikeAndCommentSid);
      this.refreshLikeAndCommentSid = null;
    }
  }

  refreshLikeAndCommentV2(list = []) {
    if (this.refreshLikeAndCommentSid != null) {
      return;
    }
    this.refreshLikeAndCommentSid = requestAnimationFrame(() => {
      this.isInitComment = {};
      this.isInitLikeNum = {};
      this.isInitLikeStatus = {};
      this.getCaptainCommentObserveList(list);
      this.clearRefreshFollowingImageSid();
    });
  }


  async handleLikeAndCommentV2(destDid: string, channelId: string, postId: string, commentId: string, userDid: string) {
    let ownerDid = this.ownerDid || "";
    if (ownerDid === "") {
      ownerDid = (await this.dataHelper.getSigninData()).did;
      this.ownerDid = ownerDid;
    }

    let id = destDid + '-' + channelId + '-' + postId + '-' + commentId + "-" + userDid;
    //处理Name
    CommonPageService.handleDisplayUserName(
      id, this.isInitUserNameMap,
      this.userNameMap, this.hiveVaultController,
      ownerDid,
      this.channelName
    );
    //处理commnet like status
    CommonPageService.
      handleCommentLikeStatus(
        id, this.hiveVaultController,
        this.isInitLikeStatus, this.isloadingLikeMap,
        this.likedCommentMap);
    //处理commnet like num
    CommonPageService.handleCommentLikeNum(
      id, this.hiveVaultController,
      this.isInitLikeNum, this.likedCommentNum);
    //处理post comment
    CommonPageService.handleCommentNum(
      id, this.hiveVaultController,
      this.isInitComment, this.commentNum
    )

  }

  async handleUserNameV2(destDid: string, channelId: string, postId: string, commentId: string, userDid: string) {

    let ownerDid = this.ownerDid || "";
    if (ownerDid === "") {
      ownerDid = (await this.dataHelper.getSigninData()).did;
      this.ownerDid = ownerDid;
    }

    let id = destDid + '-' + channelId + '-' + postId + '-' + commentId + "-" + userDid;
    CommonPageService.handleDisplayUserName(
      id, this.isInitUserNameMap,
      this.userNameMap, this.hiveVaultController,
      ownerDid,
      this.userNameMap[userDid]
    );
  }

  handlePostText(url: string, event: any) {
    event.stopPropagation();
  }

  getCaptainCommentObserveList(commentList = []) {
    for (let index = 0; index < commentList.length; index++) {
      let commentItem = commentList[index];
      let postGridId = commentItem.destDid + "-" + commentItem.channelId + "-"
        + commentItem.postId + "-" + commentItem.commentId + "-" + commentItem.createrDid + '-captainComment';
      let exit = this.captainObserverList[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.newCaptainCommentObserver(postGridId);
    }
  }

  newCaptainCommentObserver(postGridId: string) {
    let observer = this.captainObserverList[postGridId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (!this.captainObserverList[postGridId]) {
        this.captainObserverList[postGridId] = new IntersectionObserver(async (changes: any) => {
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
          let commentId: string = arr[3];
          let createrDid: string = arr[4];
          // try {
          //   this.getDisplayName(destDid, this.channelId, destDid);
          // } catch (error) {

          // }
          this.handleLikeAndCommentV2(destDid, channelId, postId, commentId, createrDid);
          this.getUserAvatar(createrDid);
        });
        this.captainObserverList[postGridId].observe(item);
      }
    }
  }

  removeCaptainCommentObserverList() {
    for (let postGridId in this.captainObserverList) {
      let observer = this.captainObserverList[postGridId] || null;
      this.removeCaptainCommentObserver(postGridId, observer)
    }
    this.captainObserverList = {};
  }

  removeCaptainCommentObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.captainObserverList[postGridId] = null;
      }
    }
  }

  getReplyCommentObserverList(replyCommentList = []) {
    for (let index = 0; index < replyCommentList.length; index++) {
      let commentItem = replyCommentList[index];
      let postGridId = commentItem.destDid + "-" + commentItem.channelId + "-"
        + commentItem.postId + "-" + commentItem.commentId + "-" + commentItem.createrDid + '-replyComment';
      let exit = this.replyObserverList[postGridId] || null;
      if (exit != null) {
        continue;
      }
      this.newReplyCommentObserver(postGridId);
    }
  }

  newReplyCommentObserver(postGridId: string) {
    let observer = this.replyObserverList[postGridId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (!this.replyObserverList[postGridId]) {
        this.replyObserverList[postGridId] = new IntersectionObserver(async (changes: any) => {
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
          let commentId: string = arr[3];
          let createrDid: string = arr[4];
          this, this.handleUserNameV2(destDid, channelId, postId, commentId, createrDid);
          this.getUserAvatar(createrDid);
        });
        this.replyObserverList[postGridId].observe(item);
      }
    }
  }

  removeReplyCommentObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.replyObserverList[postGridId] = null;
      }
    }
  }

  removeReplyCommentObserverList() {
    for (let postGridId in this.replyObserverList) {
      let observer = this.replyObserverList[postGridId] || null;
      this.removeReplyCommentObserver(postGridId, observer)
    }
    this.replyObserverList = {};
  }

  checkFollowStatus(destDid: string, channelId: string): Promise<boolean> {
    return this.dataHelper.checkSubscribedStatus(destDid, channelId);
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

  getDisplayName(destDid: string, channelId: string, userDid: string) {
    let displayNameMap = this.isInitUserNameMap[userDid] || '';
    if (displayNameMap === "") {
      this.isInitUserNameMap[userDid] = "11";
      let displayName = this.userNameMap[userDid] || "";
      if (displayName === "") {
        let text = destDid.replace('did:elastos:', '');
        this.userNameMap[userDid] = UtilService.shortenDid(text);
      }
      this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
        const name = userProfile.name || userProfile.resolvedName || userProfile.displayName
        if (name) {
          this.userNameMap[userDid] = name;
          this.showComment(null);
        }
      }).catch(() => {
        this.showComment(null);
      })
    }else{
      this.showComment(null);
    }
  }

  getUserAvatar(userDid: string) {
    if (!this.userAvatarMap) {
      this.userAvatarMap = {};
    }
    if (!this.userAvatarMap[userDid]) {
      this.userAvatarMap[userDid] = './assets/images/loading.svg';
      this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
        if (!userProfile) {
          this.userAvatarMap[userDid] = './assets/images/did-default-avatar.svg';
          return;
        }
        const avatarUrl = userProfile.avatar || userProfile.resolvedAvatar;
        if (!avatarUrl) {
          this.userAvatarMap[userDid] = './assets/images/did-default-avatar.svg';
          return;
        }
        this.hiveVaultController.getV3HiveUrlData(avatarUrl)
          .then((image) => {
            if (!image || image == 'null') {
              this.userAvatarMap[userDid] = './assets/images/did-default-avatar.svg';
              return;
            } else {
              this.userAvatarMap[userDid] = image;
              return;
            }
          }).catch((err) => {
            this.userAvatarMap[userDid] = './assets/images/did-default-avatar.svg';
            return;
          })
      })
    }
    return;
  }

  getUserAvatarUI(userDid: string) {
    if (!this.userAvatarMap[userDid]) {
      this.getUserAvatar(userDid);
    }
    return this.userAvatarMap[userDid];
  }

  openUserProfile(userDid: string) {
    this.native.navigateForward(['/userprofile'], { queryParams: { 'userDid': userDid } });
  }

  async getChannelTippingAddress(channelId: string, isLoad: boolean = true) {
    try {
      let channelTippingAddressMap = this.dataHelper.getChannelTippingAddressMap() || {};
      let channelTippingAddress = channelTippingAddressMap[channelId] || '';
      if (channelTippingAddress != '') {
        return channelTippingAddress;
      }
      let tokenId: string = "0x" + channelId;
      Logger.log(TAG, "tokenId:", tokenId);
      tokenId = UtilService.hex2dec(tokenId);
      Logger.log(TAG, "tokenIdHex2dec:", tokenId);
      if (isLoad) {
        await this.native.showLoading("common.waitMoment");
      }
      let tokenInfo = await this.nftContractControllerService.getChannel().channelInfo(tokenId);
      Logger.log(TAG, "tokenInfo:", tokenInfo);
      if (tokenInfo[0] != '0') {
        if (isLoad) {
          this.native.hideLoading();
        }
        channelTippingAddressMap[channelId] = tokenInfo[3];
        this.dataHelper.setChannelTippingAddressMap(channelTippingAddressMap);
        return channelTippingAddressMap[channelId];
      }
      if (isLoad) {
        this.native.hideLoading();
      }
      return null;
    } catch (error) {
      if (isLoad) {
        this.native.hideLoading();
      }
      return null;
    }
  }

  getPostTipCount(channelId: string, postId: string) {
    let isLoad = this.isLoadingPostTipCountMap[postId] || "";
    if (isLoad === "") {
      this.isLoadingPostTipCountMap[postId] = "loading";
      let postTipCountMap = this.dataHelper.getPostTipCountMap() || {};
      let postTipCount = postTipCountMap[postId] || '';
      if (postTipCount === '') {
        this.nftContractControllerService
          .getChannelTippingContractService()
          .getPosTippingCount(channelId, postId).then((postTipCont: any) => {
            this.postTipCountMap[postId] = postTipCont;
            postTipCountMap[postId] = postTipCont;
            this.dataHelper.setPostTipCountMap(postTipCountMap);
          }).catch((err) => {
            let postTipCount = postTipCountMap[postId] || '';
            if(postTipCount === ''){
              this.postTipCountMap[postId] = 0;
              postTipCountMap[postId] = 0;
            }
            this.dataHelper.setPostTipCountMap(postTipCountMap);
          });
      } else {
        this.postTipCountMap[postId] = postTipCount;
      }
    }
  }

  clickDashangList(channelId: string, postId: string) {
    this.native.navigateForward(['/posttiplist'], { queryParams: { "channelId": channelId, "postId": postId } });
  }

}

