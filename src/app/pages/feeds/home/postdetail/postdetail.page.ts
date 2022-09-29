import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
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
  public repostNum: number = 0;

  public captainCommentList: any = [];

  public destDid: string = '';
  public channelId: string = "0";
  public postId: string = "";
  public pageSize: number = 1;
  public pageNumber: number = 5;
  public totalData: any = [];

  public popover: any;

  public styleObj: any = { width: '' };
  public dstyleObj: any = { width: '' };

  public hideComment = true;

  public videoPoster: string = '';
  public posterImg: string = '';
  public videoObj: string = '';
  public videoisShow: boolean = false;

  public cacheGetBinaryRequestKey = '';
  public cachedMediaType = '';

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
  public post: FeedsData.PostV3 = null;
  private channelAvatarUri: string = null;
  public isLike: boolean = false;
  public likedCommentMap: any = {};
  public likedCommentNum: any = {};
  public commentNum: any = {};
  private isInitLikeNum: any = {};
  private isInitLikeStatus: any = {};
  private isInitComment: any = {};
  private postCommentList: FeedsData.CommentV3[] = [];
  private isInitUserNameMap: any = {};
  private userNameMap: any = {};
  private isloadingLikeMap: any = {};
  private isLoadingLike = false;
  public channelOwnerName: string = '';
  public replyCommentsMap: { [refcommentId: string]: FeedsData.CommentV3[] } = {};
  public ownerDid: string = "";
  public updatedTimeStr: string = "";
  private commentTime: any = {};
  private captainObserverList: any = {};
  private replyObserverList: any = {};
  private observerList: any = {};
  public hannelNameMap: any = {};
  private channelMap: any = {};
  private isLoadAvatarImage: any = {};
  public channelAvatarMap: any = {};
  private refreshImageSid: any = null;
  private isLoadimage: any = {};
  public postImgMap: any = {};
  private postMap: any = {};
  private isLoadVideoiamge: any = {};
  private posterImgMap: any = {};
  public hideRepostComment = true;
  public repostChannelList: any = [];
  public rePost: any = null;
  public repostUpdatedTimeStr: string = "";
  private refreshRepostImageSid: any = null;

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
  ) { }


  async initData(isInit: boolean) {
    let channel: FeedsData.ChannelV3 =
      await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    this.channelOwner = channel.destDid || '';
    this.channelOwnerName = this.indexText(channel.destDid);
    this.channelWName = channel['displayName'] || channel['name'] || '';
    this.channelName = channel['displayName'] || channel['name'] || "";
    this.hannelNameMap[this.channelId] = this.channelName;
    this.userNameMap[this.channelOwner] = this.channelName;
    let channelAvatarUri = channel['avatar'] || '';
    if (channelAvatarUri != '') {
      this.channelAvatarUri = channelAvatarUri;
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
    this.initRepostData();
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

  async initRefresh() {
    this.pageSize = 1;
    this.totalData = await this.sortCommentList();
    let data = UtilService.getPostformatPageData(this.pageSize, this.pageNumber, this.totalData);
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
    let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(this.postId);
    this.post = post;
    this.updatedTime = post.updatedAt;
    this.updatedTimeStr = this.handleUpdateDate(this.updatedTime);
    this.refreshImageV2(post);
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

  ionViewWillEnter() {
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

  ionViewWillLeave() {
    this.commentTime = {};
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }
    this.removeObserveList();
    this.clearPageMap();
    this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
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
  }

  clearPageMap() {
    this.channelMap = {};
    this.channelAvatarMap = {};
    this.hannelNameMap = {};
    this.isLoadAvatarImage = {};
    this.isLoadimage = {};
    this.postMap = {};
    this.postImgMap = {};
    this.isLoadVideoiamge = {};
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
    this.hideComment = true;
    // this.postImage = '';
    this.isFullContent = {};
    this.isOwnComment = {};
    if (this.rePost != null) {
      this.clearVideo(this.rePost);
    } else {
      this.clearVideo(this.post);
    }
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
      return UtilService.resolveAddress(text);
    }
  }

  showComment(comment: FeedsData.CommentV3) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (comment === null) {
      this.refcommentId = '0';
      this.commentName = this.channelName;
      this.commentAvatar = this.channelAvatarUri;
    } else {
      this.refcommentId = comment.commentId;
      this.commentName = this.userNameMap[comment.createrDid];
      if (this.destDid === comment.createrDid) {
        this.commentAvatar = this.channelAvatarUri;
      } else {
        this.commentAvatar = '';
      }
    }

    if (this.rePost != null) {
      this.pauseVideo(this.rePost);
    } else {
      this.pauseVideo(this.post);
    }
    this.hideComment = false;
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

    if (this.isLike) {
      try {
        this.isLoadingLike = true;
        this.isLike = false;
        if (this.likesNum > 0) {
          this.likesNum = this.likesNum - 1;
        }
        this.hiveVaultController.removeLike(
          this.destDid, this.channelId, this.postId, '0').
          then(() => {
            //update cached
            this.dataHelper.cacheLikeStatus(this.postId, '0', false);
            let likedNum = this.dataHelper.getCachedLikeNum(this.postId, '0') || 0;
            if (likedNum > 0) {
              likedNum = likedNum - 1;
            }
            this.dataHelper.cacheLikeNum(this.postId, '0', likedNum);
            this.isLoadingLike = false;
          }).catch(err => {
            this.isLoadingLike = false;
            this.likesNum = this.likesNum + 1;
          });
      } catch (error) {
        this.isLoadingLike = false;
        this.isLike = true;
        this.likesNum = this.likesNum + 1;

      }
      return;
    }

    try {
      this.isLoadingLike = true;
      this.isLike = true;
      this.likesNum = this.likesNum + 1;
      this.hiveVaultController.like(
        this.destDid, this.channelId, this.postId, '0').
        then(() => {
          //update cached
          this.dataHelper.cacheLikeStatus(this.postId, '0', true);
          let likedNum = this.dataHelper.getCachedLikeNum(this.postId, '0') || 0;
          likedNum = likedNum + 1;
          this.dataHelper.cacheLikeNum(this.postId, '0', likedNum);
          this.isLoadingLike = false;
        }).catch((err) => {
          this.isLoadingLike = false;
          if (this.likesNum > 0) {
            this.likesNum = this.likesNum - 1;
          }
        });
    } catch (err) {
      this.isLoadingLike = false;
      this.isLike = false;
      if (this.likesNum > 0) {
        this.likesNum = this.likesNum - 1;
      }
    }

  }

  likeComment(comment: FeedsData.CommentV3) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    CommonPageService.
      likeComment(comment, this.likedCommentMap,
        this.isloadingLikeMap, this.likedCommentNum,
        this.hiveVaultController,
        this.dataHelper);
  }

  handleUpdateDate(updatedTime: number) {
    if (updatedTime === 0) {
      return;
    }
    let updateDate = new Date(updatedTime);
    return UtilService.dateFormat(updateDate, 'yyyy-MM-dd HH:mm:ss');
  }

  async menuMore(post: FeedsData.PostV3) {
    let isMine = await this.checkChannelIsMine();
    this.pauseVideo(post);
    const needUnpinPost = await this.dataHelper.queryChannelPinPostData(this.channelId);

    if (isMine === 1 && post.status != 1) {
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
    this.postImage = './assets/icon/reserve.svg';//set Reserve Image
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
      await this.hiveVaultController.queryPostByPostId(this.destDid, this.channelId, this.postId, true);
      await this.hiveVaultController.syncCommentFromPost(this.destDid, this.channelId, this.postId);
      await this.hiveVaultController.syncLikeDataFromChannel(this.destDid, this.channelId);
      this.removeReplyCommentObserverList();
      this.removeCaptainCommentObserverList();
      this.removeObserveList();
      this.clearPageMap();
      this.initData(true);
      this.hiveVaultController.queryRepostById(this.destDid, this.channelId, this.postId, 0, UtilService.getCurrentTimeNum()).then((reportedRepostList: FeedsData.ReportedRepost[]) => {
        this.repostNum = reportedRepostList.length;
      });
      event.target.complete();
    } catch (error) {
      event.target.complete();
    }
  }

  loadData(event: any) {

    let sid = setTimeout(() => {
      this.pageSize++;
      let data = UtilService.getPostformatPageData(this.pageSize, this.pageNumber, this.totalData);
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
              this.setFullScreen(id);
              this.setOverPlay(id);
              clearTimeout(sid);
            }, 10);
          });
        } else {
          this.videoisShow = false;
        }
      })
      .catch(err => { });
  }

  getVideo(id: string) {
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
                this.loadVideo(downVideoData, id);
              }).catch((err) => {
                this.videoDownStatus = '';
                this.isVideoPercentageLoading = false;
                this.isVideoLoading = false;
              });
            return;
          }
          this.videoObj = videoData;
          this.loadVideo(videoData, id);
        });
      }).catch((err) => {
        this.videoDownStatus = '';
        this.isVideoPercentageLoading = false;
        this.isVideoLoading = false;
      });
  }

  loadVideo(videodata: any, id: string) {
    this.isVideoLoading = false;
    this.isVideoPercentageLoading = false;
    this.videoDownStatus = '';
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

  pauseVideo(post: FeedsData.PostV3) {
    let id = post.destDid + '-' + post.channelId + '-' + post.postId;
    if (post.status != 1 && post.content.mediaType === 2) {
      let video: any = document.getElementById(id + 'postdetailvideo') || '';
      let source: any = document.getElementById(id + 'postdetailsource') || '';
      if (video != '' && source != '' && !video.paused) {
        //判断是否处于暂停状态
        video.pause(); //停止播放
      }
    }
  }

  clearVideo(post: FeedsData.PostV3) {
    if (post.status != 1 && post.content.mediaType === 2) {

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

  setFullScreen(id: string) {
    let vgfullscreen: any =
      document.getElementById(id + 'vgfullscreenpostdetail') || '';
    if (vgfullscreen != '') {
      vgfullscreen.onclick = async () => {
        if (this.rePost != null) {
          this.pauseVideo(this.rePost);
        } else {
          this.pauseVideo(this.post);
        }
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


  setOverPlay(id: string) {
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

          this.getVideo(id);
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
    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    let tippingAddress = '';
    if (tippingAddress != null) {
      tippingAddress = channel.tipping_address || '';
    }
    if (tippingAddress == "") {
      this.native.toast('common.noElaAddress');
      return;
    }
    if (this.rePost != null) {
      this.pauseVideo(this.rePost);
    } else {
      this.pauseVideo(this.post);
    }
    this.viewHelper.showPayPrompt(this.destDid, this.channelId, tippingAddress);
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

  refreshLikeAndCommentV2(list = []) {
    let sid = setTimeout(() => {
      this.isInitComment = {};
      this.isInitLikeNum = {};
      this.isInitLikeStatus = {};
      this.getCaptainCommentObserveList(list);
      clearTimeout(sid);
    }, 100);
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
        this.handleLikeAndCommentV2(destDid, channelId, postId, commentId, createrDid);
      });
      this.captainObserverList[postGridId].observe(item);
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
      });
      this.replyObserverList[postGridId].observe(item);
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

  newSectionObserver(postItem: any, elementsName: string) {

    let postGridId = postItem.destDid + "-" + postItem.channelId + "-" + postItem.postId + "-" + postItem.content.mediaType + '-' + elementsName;
    let observer = this.observerList[postGridId] || null;

    if (observer != null) {
      return;
    }
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (elementsName === "postdetail") {
        this.observerList[postGridId] = new IntersectionObserver(async (changes: any) => {
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
          if (mediaType === '3' || mediaType == '4') {
            //获取repost
            try {
              let post: FeedsData.PostV3 = await this.dataHelper.getPostV3ById(this.postId) || null;
              const repostUrl = post.content.mediaData[0].repostUrl;
              const feedsUrlObj = UtilService.decodeFeedsUrl(repostUrl);
              let loadedRepost: FeedsData.PostV3 = await this.dataHelper.getCachedPostV3ById(feedsUrlObj.postId) || null;//TODO replace with load repost later
              if (!loadedRepost) {
                loadedRepost = await this.hiveVaultController.queryPostByPostId(feedsUrlObj.targetDid, feedsUrlObj.channelId, feedsUrlObj.postId, false);
              }
              this.rePost = loadedRepost;
              let updatedTime = loadedRepost.updatedAt || 0;
              this.repostUpdatedTimeStr = this.handleUpdateDate(updatedTime);
              this.refreshRepostImageV2(this.rePost)
            } catch (error) {

            }

          }

          await this.getChannelName(destDid, channelId, null);//获取频道name
          this.handlePostAvatarV2(destDid, channelId, postId);//获取头像
          if (mediaType === '1') {
            this.handlePostImgV2(destDid, channelId, postId);
          }

          if (mediaType === '2') {
            //video
            this.handleVideoV2(destDid, channelId, postId);
          }

          //post like status
          this.getLikeStatus(postId, '0');
          this.getPostLikeNum(postId, '0');

        });
        this.observerList[postGridId].observe(item);
        return;
      }
      if (elementsName === "postdetail-repost") {
        this.observerList[postGridId] = new IntersectionObserver(async (changes: any) => {
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

          await this.getChannelName(destDid, channelId, null);//获取频道name
          this.handlePostAvatarV2(destDid, channelId, postId);//获取头像
          if (mediaType === '1') {
            this.handlePostImgV2(destDid, channelId, postId);
          }

          if (mediaType === '2') {
            //video
            this.handleVideoV2(destDid, channelId, postId);
          }

        });
        this.observerList[postGridId].observe(item);
        return;
      }
    }
  }

  async getChannelName(destDid: string, channelId: string, inputChannel: FeedsData.ChannelV3) {
    let channelName = this.hannelNameMap[channelId] || "";
    if (channelName != "") {
      return channelName;
    }
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || inputChannel || null;
    if (channel === null) {
      return '';
    }
    let key = destDid + "-" + channelId;
    this.channelMap[key] = channel;
    this.hannelNameMap[channelId] = channel.displayName || channel.name;
    return this.hannelNameMap[channelId];
  }


  async handlePostAvatarV2(destDid: string, channelId: string, postId: string) {
    // 13 存在 12不存在
    let id = destDid + "-" + channelId;
    let isload = this.isLoadAvatarImage[id] || '';

    if (isload === '') {
      this.isLoadAvatarImage[id] = '11';
      let key = destDid + "-" + channelId;
      let channel: FeedsData.ChannelV3 = this.channelMap[key] || null;
      if (channel === null) {
        channel = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
        this.channelMap[key] = channel;
      } else {
        channel = this.channelMap[key];
      }
      let avatarUri = "";
      if (channel === null) {
        return;
      }
      avatarUri = channel.avatar || "";
      if (avatarUri === "") {
        return;
      }
      let fileName: string = avatarUri.split("@")[0];
      //头像
      this.hiveVaultController.
        getV3Data(destDid, avatarUri, fileName, "0")
        .then(imagedata => {
          let realImage = imagedata || '';
          if (realImage != '') {
            this.channelAvatarMap[id] = realImage;
            this.isLoadAvatarImage[id] = "13";
          } else {
            this.isLoadAvatarImage[id] = "13";
          }
        })
        .catch(reason => {
          // this.downPostAvatarMap[fileName] = "";
          // for (let key in this.avatarImageMap) {
          //   let uri = this.avatarImageMap[key] || "";
          //   if (uri === avatarUri && this.isLoadAvatarImage[key] === "11") {
          //     this.isLoadAvatarImage[key] = '13';
          //     delete this.avatarImageMap[key];
          //   }

          // }
          this.isLoadAvatarImage[id] = '';

          Logger.error(TAG,
            "Excute 'handlePostAvatarV2' in home page is error , get image data error, error msg is ",
            reason
          );
        });
    }
  }

  refreshImageV2(post = null) {
    this.clearRefreshImageSid();
    this.refreshImageSid = setTimeout(() => {
      this.newSectionObserver(post, "postdetail");
      this.clearRefreshImageSid();
    }, 100);
    //this.newSectionObserver();
  }

  refreshRepostImageV2(post = null) {
    this.clearRefreshRepostImageV2();
    this.refreshRepostImageSid = setTimeout(() => {
      this.newSectionObserver(post, "postdetail-repost");
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

  clearRefreshImageSid() {
    if (this.refreshImageSid != null) {
      clearTimeout(this.refreshImageSid);
      this.refreshImageSid = null;
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

  async handlePostImgV2(destDid: string, channelId: string, postId: string) {
    // 13 存在 12不存在
    let id = destDid + '-' + channelId + '-' + postId;
    let isload = this.isLoadimage[id] || '';
    let rpostimg = document.getElementById(id + 'rpostimg');
    //let postImage = document.getElementById(id + 'postimg');
    try {
      if (isload === '') {
        this.isLoadimage[id] = '11';
        let post = this.postMap[postId] || null;
        if (post === null) {
          post = await this.dataHelper.getPostV3ById(postId) || null;
          this.postMap[postId] = post;
        }
        if (post === null) {
          this.isLoadimage[id] = 13;
          return;
        }
        console.log('post ====>', post.content);
        console.log('content ====>', post.content);
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
              //postImage.setAttribute('src', realImage);
              this.postImgMap[id] = realImage;
              rpostimg.style.display = 'block';
            } else {
              this.hiveVaultController.
                getV3Data(destDid, thumbnailKey, fileThumbnaiName, type).
                then((thumbImagedata) => {
                  let thumbImage = thumbImagedata || "";
                  if (thumbImage != '') {
                    this.isLoadimage[id] = '13';
                    this.postImgMap[id] = thumbImagedata;
                    rpostimg.style.display = 'block';
                  } else {
                    this.isLoadimage[id] = '12';
                    rpostimg.style.display = 'block';
                  }
                }).catch(() => {
                  rpostimg.style.display = 'none';
                })
            }
          })
          .catch(reason => {
            rpostimg.style.display = 'none';
            Logger.error(TAG,
              "Excute 'handlePostImg' in home page is error , get image data error, error msg is ",
              reason
            );
          });
      }
    } catch (error) {
      this.isLoadimage[id] = '';
      this.postImgMap[id] = '';
    }
  }

  async handleVideoV2(destDid: string, channelId: string, postId: string) {
    let id = destDid + '-' + channelId + '-' + postId;
    let isloadVideoImg = this.isLoadVideoiamge[id] || '';
    let source: any = document.getElementById(id + 'postdetailsource') || '';
    let downStatus = this.videoDownStatus[id] || '';
    if (id != '' && source != '' && downStatus === '') {
      if (this.rePost != null) {
        this.pauseVideo(this.rePost);
      } else {
        this.pauseVideo(this.post);
      }
    }
    try {

      if (isloadVideoImg === '') {
        this.isLoadVideoiamge[id] = '11';
        let post = this.postMap[postId] || null;

        if (post === null) {
          post = await this.dataHelper.getPostV3ById(postId) || null;
          this.postMap[postId] = post;
        }
        if (post === null) {
          this.isLoadVideoiamge[id] = '13';
        }

        let mediaDatas = post.content.mediaData;
        const elements = mediaDatas[0];

        //缩略图
        let videoThumbnailKey = elements.thumbnailPath || '';
        if (videoThumbnailKey === '') {
          this.isLoadimage[id] = '13';
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
              //video.setAttribute('poster', image);
              this.posterImgMap[id] = image;
              let video: any = document.getElementById(id + 'postdetailvideo') || '';
              if (video != '') {
                video.style.display = "block";
                //video.
                this.setFullScreen(id);
                this.setOverPlay(id);
              }

            } else {
              this.isLoadVideoiamge[id] = '13';
              //vgplayer.style.display = 'none';
            }
          })
          .catch(reason => {
            //vgplayer.style.display = 'none';
            this.isLoadVideoiamge[id] = '';
            Logger.error(TAG,
              "Excute 'hanldVideo' in home page is error , get image data error, error msg is ",
              reason
            );
          });
      }
    } catch (error) {
      console.log("=============video10");
      this.isLoadVideoiamge[id] = '';
    }
  }

  async repost(post: FeedsData.PostV3) {

    let connectStatus = this.dataHelper.getNetworkStatus();
    if (connectStatus === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }
    this.pauseVideo(post);
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

    this.postId = post.postId;
    this.channelId = post.channelId;
    this.destDid = post.destDid;
    this.hideRepostComment = false;
  }

  hideRepostComponent(event: any) {
    this.postId = "";
    this.channelId = "";
    this.destDid = "";
    this.hideRepostComment = true;
  }

  initRepostData() {
    this.dataHelper.getReportedRePostNumById(this.postId).then((num: number) => {
      this.repostNum = num;
    });
  }
}

