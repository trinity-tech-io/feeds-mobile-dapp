import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import { NavController, ModalController, Platform, IonTextarea, PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import SparkMD5 from 'spark-md5';
import PictureLineIcon from '@iconify/icons-clarity/picture-line';
import CameraIcon from '@iconify/icons-clarity/camera-line';
import VideoGalleryIcon from '@iconify/icons-clarity/video-gallery-line';
import VideoCameraIcon from '@iconify/icons-clarity/video-camera-line';

import { Events } from 'src/app/services/events.service';
import { FeedService } from '../../../services/FeedService';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from '../../../services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { AppService } from '../../../services/AppService';
import { UtilService } from '../../../services/utilService';
import { StorageService } from '../../../services/StorageService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Logger } from 'src/app/services/logger';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service'
import { TwitterService } from 'src/app/services/TwitterService';
import { MorenameComponent } from 'src/app/components/morename/morename.component';
import { RedditService } from 'src/app/services/RedditService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { PopupProvider } from 'src/app/services/popup';

let TAG: string = 'Feeds-createpost';

@Component({
  selector: 'app-createnewpost',
  templateUrl: './createnewpost.page.html',
  styleUrls: ['./createnewpost.page.scss'],
})
export class CreatenewpostPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('newPostIonTextarea', { static: false })
  newPostIonTextarea: IonTextarea;
  photoIcon = PictureLineIcon
  cameraIcon = CameraIcon
  videoIcon = VideoGalleryIcon
  videoCameraIcon = VideoCameraIcon
  public isLoading: boolean = false;
  public loadingTitle: string = "common.waitMoment";
  public loadingText: string = "common.uploading";
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;
  public channelAvatar = '';
  public channelName = '';
  public subscribers: string = '';
  public newPost: string = '';
  public imgUrl: string = '';
  public destDid: string = '';
  public channelId: string = '';
  //public channelId: string = "";

  public posterImg: any = '';
  public flieUri: string = '';
  public uploadProgress: number = 0;
  public videotype: string = 'video/mp4';
  public transcode: number = 0;
  public duration: any = 0;

  public totalProgress: number = 0;

  public channelList = [];
  public hideSwitchFeed: boolean = false;
  private isPublishing: boolean = false;
  // 视频data
  private videoData: FeedsData.videoData = null;
  private isUpdateHomePage: boolean = false;
  public isBorderGradient: boolean = false;
  public isPostTwitter: boolean = false;
  public curTextNum: number = 0;
  public extraNumber: number = 0;
  private infoPopover: any = null;
  public isPostReddit: boolean = false;
  public channelPublicStatusList: any = {};
  private setFocusSid: any = null;
  private socialLoginDialog: any = null;
  public accept: string = "image/png, image/jpeg, image/jpg, image/gif";
  constructor(
    private popoverController: PopoverController,
    private platform: Platform,
    private events: Events,
    private native: NativeService,
    private navCtrl: NavController,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    public videoEditor: VideoEditor,
    public appService: AppService,
    public el: ElementRef,
    public modalController: ModalController,
    private storageService: StorageService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private dataHelper: DataHelper,

    private postHelperService: PostHelperService,
    private hiveVaultController: HiveVaultController,
    private twitterService: TwitterService,
    private redditService: RedditService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    public popupProvider: PopupProvider,
  ) { }

  ngOnInit() {
    this.clearSetFocusSid();
    this.setFocusSid = setTimeout(() => {
      this.newPostIonTextarea.setFocus();
      this.clearSetFocusSid();
    },500);

  }

  clearSetFocusSid() {
    if(this.setFocusSid != null){
      clearTimeout(this.setFocusSid);
      this.setFocusSid = null;
    }
  }

  async checkBoxClick(event) {
    const userDid = (await this.dataHelper.getSigninData()).did
    if (event.detail.checked === true) {
      this.twitterService.checkTwitterIsExpiredWithToast().then(async (result) => {
        if (result === null) {
          this.isPostTwitter = false;
          localStorage.setItem(userDid + "isSyncToTwitter", "false");
        }
        else {
          this.isPostTwitter = event.detail.checked
          localStorage.setItem(userDid + "isSyncToTwitter", event.detail.checked)
        }
      })
    } else {
      this.isPostTwitter = event.detail.checked
      localStorage.setItem(userDid + "isSyncToTwitter", event.detail.checked);
    }

  }

  newPostTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  async initFeed() {
    let currentChannel: FeedsData.ChannelV3 = this.dataHelper.getCurrentChannel();

    if (currentChannel == null) {
      const selfChannelList = await this.dataHelper.getSelfChannelListV3();
      currentChannel = await this.dataHelper.getChannelV3ById(selfChannelList[0].destDid, selfChannelList[0].channelId);
      this.dataHelper.setCurrentChannel(currentChannel);
      this.storageService.set('feeds.currentChannel', JSON.stringify(currentChannel));
    }
    this.destDid = currentChannel.destDid;
    this.channelId = currentChannel.channelId;
    this.channelName = currentChannel['displayName'] || currentChannel['name'] || '';
    this.subscribers = currentChannel['subscribers'] || '';
    let channelAvatarUri = currentChannel['avatar'] || '';
    if (channelAvatarUri != '') {
      let destDid: string = currentChannel.destDid;
      this.handleChannelAvatar(channelAvatarUri, destDid);
    }

    try {
      this.getChannelPublicStatus(currentChannel.destDid, currentChannel.channelId);
    } catch (error) {

    }
  }

  handleChannelAvatar(channelAvatarUri: string, destDid: string) {
    if(this.channelAvatar === ''){
      this.channelAvatar = './assets/images/loading.svg';
    }
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        result = result || '';
        if(result != ''){
          this.channelAvatar = result;
        }else{
          if(this.channelAvatar === './assets/images/loading.svg'){
            this.channelAvatar = "./assets/images/profile-0.svg";
          }
        }
      }).catch((err) => {
        if(this.channelAvatar === './assets/images/loading.svg'){
          this.channelAvatar = "./assets/images/profile-0.svg";
        }
      })
  }

  async ionViewWillEnter() {

    this.imgUrl = this.dataHelper.getSelsectNftImage();
    this.dataHelper.setSelsectNftImage(this.imgUrl);
    this.channelList = await this.dataHelper.getSelfChannelListV3() || [];
    this.initTitle();

    this.initFeed();
    this.twitterService.checkTwitterIsExpired().then(async (result) => {
      if (result != null) {
        this.isPostTwitter = true
        const userDid = (await this.dataHelper.getSigninData()).did
        localStorage.setItem(userDid + "isSyncToTwitter", "true");
      } else {
        this.isPostTwitter = false
        const userDid = (await this.dataHelper.getSigninData()).did
        localStorage.setItem(userDid + "isSyncToTwitter", "false");
      }
    })

    try {
      this.redditService.checkRedditIsExpired().then(async (token) => {
        if (token === null) {
          const userDid = (await this.dataHelper.getSigninData()).did;
          this.isPostReddit = false;
          localStorage.setItem(userDid + "isSyncToReddit", "false")
          return;
        }
        const userDid = (await this.dataHelper.getSigninData()).did;
        const isSubscribeElastos = this.dataHelper.getRedditIsSubscribeElastos(userDid);
        if (isSubscribeElastos === false) {
          try {
            let isSubscribe = await this.redditService.subreddits();
            if (isSubscribe) {
              this.isPostReddit = true;
              localStorage.setItem(userDid + "isSyncToReddit", "true")
            } else {
              this.isPostReddit = false;
              localStorage.setItem(userDid + "isSyncToReddit", "false")
            }
          } catch (error) {
            this.isPostReddit = false;
            localStorage.setItem(userDid + "isSyncToReddit", "false")
          }
          return;
        }

        this.isPostReddit = true;
        localStorage.setItem(userDid + "isSyncToReddit", "true")
      });
    }
    catch (error) {
      // TODO:
    }

  }

  ionViewWillLeave() {
    this.clearSetFocusSid();
    this.socialLoginDialogCancel(this);
    this.isLoading = false;
    this.hideSwitchFeed = false;
    this.imgUrl = '';
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.removeVideo();

    if (this.isUpdateHomePage) {
      this.native.handleTabsEvents("update");
    } else {
      this.native.handleTabsEvents();
    }

  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('CreatenewpostPage.addingPost'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  async post() {
    this.zone.run(async () => {
      let newPost = this.native.iGetInnerText(this.newPost);

      let connect = this.dataHelper.getNetworkStatus();
      if (connect === FeedsData.ConnState.disconnected) {
        this.native.toastWarn('common.connectionError');
        return;
      }

      if (newPost === '' && this.imgUrl === '' && this.flieUri === '') {
        this.native.toastWarn('CreatenewpostPage.tipMsg');
        return false;
      }
      if (this.posterImg != '' && this.flieUri === '') {
        this.native.toastWarn('CreatenewpostPage.tipMsg2');
        return false;
      }
      if (!this.isPublishing) {
        this.isPublishing = true;
        //show dialog
        this.isLoading = true;
        try {
          await this.sendPost();
          this.isLoading = false;
          //dismiss dialog
          this.backHome();
        } catch (error) {
          const emsg = "{\"detail\":\"You are not allowed to create a Tweet with duplicate content.\",\"type\":\"about:blank\",\"title\":\"Forbidden\",\"status\":403}"

          if (error.status === 403 && emsg != error.error && this.isPostTwitter) {
            this.native.toastWarn("common.twitterError401");
            this.isLoading = false;
            this.isPublishing = false;
            return;
          }

          if (error.status === 401 && this.isPostTwitter) {
            this.native.toastWarn("common.twitterError401");
            this.isLoading = false;
            this.isPublishing = false;
            return;
          }

          if (error.status === -3) {

            if (this.isPostTwitter) {
              this.native.toastWarn("common.twitterError3");
            }

            this.isLoading = false;
            this.isPublishing = false;
            return;
          }



          if (error.status === -1) {
            this.native.toastWarn("common.connectionError");
            this.isLoading = false;
            this.isPublishing = false;
            return;
          }

          if (error.status === -4) {
            if (this.isPostTwitter) {
              this.native.toastWarn("common.twitterError");
            }
            if (this.isPostReddit) {
              this.native.toastWarn("common.redditError");
            }
            this.isLoading = false;
            this.isPublishing = false;
            return;
          }

          if (error.status === -2) {
            if (this.isPostReddit) {
              this.native.toastWarn("common.redditError");
            }
            this.isLoading = false;
            this.isPublishing = false;
            return;
          }

          if (emsg === error.error && this.isPostTwitter) {
            this.native.toastWarn("common.duplicate")
            this.isLoading = false;
            this.isPublishing = false;
            return;
          }

          this.native.handleHiveError(error, 'common.sendFail');
          this.isLoading = false;
          this.isPublishing = false;
        }
      }
    });
  }

  async sendPost() {
    const device = UtilService.getDeviceType(this.platform);
    await this.hiveVaultController.publishPost(this.channelId, this.newPost, [this.imgUrl], this.videoData, device, '')
  }

  addImg(type: number) {
    this.camera.openCamera(
      30,
      0,
      type,
      (imageUrl: any) => {
        this.zone.run(() => {
          this.imgUrl = imageUrl;
          this.dataHelper.setSelsectNftImage(imageUrl);
        });
      },
      (err: any) => {
        Logger.error(TAG, 'Add img err', err);
        let imgUrl = this.imgUrl || '';
        if (imgUrl === "") {
          this.native.toast_trans('common.noImageSelected');
        }
      },
    );
  }

  showBigImage(content: any) {
    this.viewHelper.openViewer(
      this.titleBar,
      content,
      'common.image',
      'CreatenewpostPage.addingPost',
      this.appService,
    );
  }

  pressName(channelName: string) {
    this.viewHelper.createTip(channelName);
  }

  async videocam() {
    this.removeVideo();
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    let videoData = null;

    try {
      videoData = await this.postHelperService.recordAVideo((progress: number) => {
        this.zone.run(() => {
          this.totalProgress = progress;
        });
      });
    } catch (error) {
      Logger.error(TAG, "recordAVideo error", error);
    }
    this.handleVideoData(videoData);
  }

  /**
   * 1.Get video from camera
   * 2.Get video duration
   * 3.Check video duration
   * 4.Create video thumbnail
   * 5.Transcode video
   * 6.Creat video obj
   */
  async selectvideo() {
    this.removeVideo();
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    let path = "";
    try {
      const videoData = await this.postHelperService.selectvideo((progress: number) => {
        this.zone.run(() => {
          this.totalProgress = progress;
        });
      });
      this.handleVideoData(videoData);
    } catch (err) {

    }
  }

  handleVideoData(videoData: FeedsData.videoData) {
    if (!videoData) {
      this.flieUri = '';
      this.posterImg = '';
      this.imgUrl = '';
      this.transcode = 0;
      this.uploadProgress = 0;
      this.totalProgress = 0;
      this.videoData = null;
      return;
    }

    if (videoData.duration === null) {
      this.flieUri = '';
      this.posterImg = '';
      this.imgUrl = '';
      this.transcode = 0;
      this.uploadProgress = 0;
      this.totalProgress = 0;
      this.videoData = null;
      this.native.toast(this.translate.instant('common.filevideodes'));
      return;
    }
    this.transcode = 100;
    this.totalProgress = this.transcode;

    this.posterImg = videoData.thumbnail;
    this.flieUri = videoData.video;

    let sid = setTimeout(() => {
      this.setFullScreen();
      let video: any = document.getElementById('videocreatepost') || '';
      if (video != '') {
        video.setAttribute('poster', this.posterImg);
      }
      this.setOverPlay(this.flieUri);
      clearTimeout(sid);
    }, 10);

    this.videoData = videoData;
  }

  removeVideo() {
    this.totalProgress = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.posterImg = '';
    this.flieUri = '';
    this.videoData = null;
    let video: any = document.getElementById('videocreatepost') || '';
    if (video != '') {
      video.removeAttribute('poster');
    }
    let source: any = document.getElementById('sourcecreatepost') || '';
    if (source != '') {
      source.removeAttribute('src'); // empty source
    }

    if (video != '') {
      let sid = setTimeout(() => {
        video.load();
        clearTimeout(sid);
      }, 10);
    }
  }

  setFullScreen() {
    let vgfullscreen: any =
      document.getElementById('vgfullscreecreatepost') || '';
    if (vgfullscreen === '') {
      return;
    }
    vgfullscreen.onclick = async () => {
      this.pauseVideo();
      let postImg: string = document
        .getElementById('videocreatepost')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById('sourcecreatepost')
        .getAttribute('src');
      await this.native.setVideoFullScreen(postImg, videoSrc);
    };
  }

  setOverPlay(fileUri: string) {
    let vgoverlayplay: any =
      document.getElementById('vgoverlayplaycreatepost') || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let source: any = document.getElementById('sourcecreatepost') || '';
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.loadVideo(fileUri);
          }
        });
      };
    }
  }

  loadVideo(videoData: string) {
    let video: any = document.getElementById('videocreatepost') || '';
    let source: any = document.getElementById('sourcecreatepost') || '';
    if (source != '') {
      source.setAttribute('src', videoData);
    }
    let vgbuffering: any = document.getElementById('vgbufferingcreatepost');
    let vgoverlayplay: any = document.getElementById('vgoverlayplaycreatepost');
    let vgcontrol: any = document.getElementById('vgcontrolscreatepost');

    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('play', () => {
      vgcontrol.style.display = 'block';
    });

    video.addEventListener('canplay', () => {
      vgbuffering.style.display = 'none';
      video.play();
    });

    video.load();
  }

  pauseVideo() {
    if (this.flieUri === '') {
      return;
    }
    let video: any = document.getElementById('videocreatepost') || '';
    let source: any = document.getElementById('sourcecreatepost') || '';

    if (video != '' && source != '' && !video.paused) {
      //判断是否处于暂停状态
      video.pause(); //停止播放
    }
  }

  clickFeedAvatar() {
    if (this.channelList.length > 1) {
      this.hideSwitchFeed = true;
    }
  }

  hideComponent(channel: any) {

    if (channel === null) {
      this.hideSwitchFeed = false;
      return;
    }

    this.channelName = channel['name'] || '';
    this.subscribers = channel['subscribers'] || '';
    this.channelAvatar = this.feedService.parseChannelAvatar(channel['avatar']);

    this.dataHelper.setCurrentChannel(channel);
    this.storageService.set('feeds.currentChannel', JSON.stringify(channel));
    this.initFeed();
    this.hideSwitchFeed = false;
  }

  moreName(name: string) {
    return UtilService.moreNanme(name, 15);
  }

  backHome() {
    this.navCtrl.pop().then(() => {
      this.newPost = '';
      this.imgUrl = '';
      this.posterImg = '';
      this.flieUri = '';
      this.isPublishing = false;
      this.isUpdateHomePage = true;
    });
  }

  createNft() {
    this.native.navigateForward(['mintnft'], {});
  }

  openNft(that: any) {
    that.native.navigateForward(['profilenftimage'], { queryParams: { type: 'postImages' } });
  }

  clickNFT() {
    this.openNft(this);
  }


  openCamera() {
    this.camera.openCamera(
      30,
      0,
      1,
      (imageUrl: any) => {
        this.zone.run(() => {
          this.imgUrl = imageUrl;
          this.dataHelper.setSelsectNftImage(imageUrl);
        });
      },
      (err: any) => {
        //Logger.error(TAG, 'Add img err', err);
        let imgUrl = this.imgUrl || '';
        if (imgUrl === "") {
          this.imgUrl = "";
        }
      },
    );
  }

  removeImg() {
    this.imgUrl = "";
    this.dataHelper.setSelsectNftImage("");
  }

  ionBlur() {
    this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
  }

  inputTextarea() {
    this.curTextNum = this.getTwitterText();
    this.extraNumber = 261 - this.curTextNum; //
  }

  getTwitterText() {
    let size = UtilService.getSize(this.newPost);
    return size;
  }

  async twitterInfo(event: any) {
    let e = event || window.event; //兼容IE8
    let target = e.target || e.srcElement; //判断目标事件
    if (target.tagName.toLowerCase() == 'span' || target.tagName.toLowerCase() == 'img') {
      event.stopPropagation();
      if (this.infoPopover === null) {
        this.infoPopover = "1";
        await this.presentPopover(e);
      }
    }
  }

  async presentPopover(e: Event) {

    let des = this.translate.instant('CreatenewpostPage.twitterDes1');
    this.infoPopover = await this.popoverController.create({
      mode: 'ios',
      component: MorenameComponent,
      event: e,
      componentProps: {
        name: des,
      },
    });

    this.infoPopover.onWillDismiss().then(() => {
      this.infoPopover = null;
    });

    return await this.infoPopover.present();
  }

  async clickTwitter() {

    const userDid = (await this.dataHelper.getSigninData()).did
    if (this.isPostTwitter) {
      this.isPostTwitter = false;
      localStorage.setItem(userDid + "isSyncToTwitter", "false");
    } else {
      const token = await this.twitterService.checkTwitterIsExpired();
      if (token === null) {
        await this.showSocialLoginDialog('twitter');
        return;
      }
      this.isPostTwitter = true;
      localStorage.setItem(userDid + "isSyncToTwitter", "true")
    }
  }

  async clickReddit() {
    // this.isPostReddit = !this.isPostReddit;
    const userDid = (await this.dataHelper.getSigninData()).did
    if (this.isPostReddit) {
      this.isPostReddit = false;
      localStorage.setItem(userDid + "isSyncToReddit", "false");
    } else {
      const token = await this.redditService.checkRedditIsExpired();
      if (token === null) {
        this.isPostReddit = false;
        localStorage.setItem(userDid + "isSyncToReddit", "false");
        await this.showSocialLoginDialog('reddit');
        return;
      }
      const isSubscribeElastos = this.dataHelper.getRedditIsSubscribeElastos(userDid);
      if (isSubscribeElastos === false) {
        this.isPostReddit = false;
        localStorage.setItem(userDid + "isSyncToReddit", "false")
        this.native.toastWarn("common.SubscribeElastosCommunity");
        return;
      }
      this.isPostReddit = true;
      localStorage.setItem(userDid + "isSyncToReddit", "true")
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

  async showSocialLoginDialog(socialType: string) {
    let des = "";
    if(socialType === "twitter"){
       des = "common.twitterNotLogin";
    }else if(socialType === "reddit"){
       des = "common.RedditNotLogin";
    }
    this.socialLoginDialog = await this.popupProvider.ionicConfirm(
      this,
      'ConnectionsPage.addConnection',
      des,
      this.socialLoginDialogCancel,
      this.socialLoginDialogConfirm,
      './assets/images/postAdd.svg',
      'common.yes'
    );
  }

  async socialLoginDialogCancel(that: any){
    if (that.socialLoginDialog != null) {
      await that.socialLoginDialog.dismiss();
      that.socialLoginDialog = null;
    }
  }

  async socialLoginDialogConfirm(that: any){
    if (that.socialLoginDialog != null) {
      await that.socialLoginDialog.dismiss();
      that.socialLoginDialog = null;
    }
    that.native.navigateForward(['/connections'],{});
  }

  handelFile(event: any) {
    event.target.value = null;
    document.getElementById("mintfile1").onchange = async (event) => {
        this.onChange(event);
    };
  }

  async onChange(event: any) {
    let realFile = event.target.files[0];
    this.createImagePreview(realFile, event);
  }

  async createImagePreview(file: any, inputEvent?: any) {
    await this.native.showLoading("common.waitMoment");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async event => {
      try {
          let assetBase64 = event.target.result.toString();
          this.native.hideLoading();
          this.imgUrl = assetBase64;
          this.dataHelper.setSelsectNftImage(assetBase64);
        }catch (error) {
          this.imgUrl = '';
          this.dataHelper.setSelsectNftImage('');
          this.native.hideLoading();
      }
    }
  }

}
