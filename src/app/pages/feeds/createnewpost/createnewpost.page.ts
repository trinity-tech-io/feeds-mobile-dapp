import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import { NavController, ModalController, Platform, IonTextarea, } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService } from '../../../services/FeedService';
import { NativeService } from '../../../services/NativeService';
import { CameraService } from '../../../services/CameraService';
import { ThemeService } from '../../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { AppService } from '../../../services/AppService';
import { UtilService } from '../../../services/utilService';
import { StorageService } from '../../../services/StorageService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Logger } from 'src/app/services/logger';
import { IPFSService } from 'src/app/services/ipfs.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service'

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
  public nodeId: string = '';
  public channelIdV3: string = '';
  public channelId: string = "0";

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
  public hidePictureMenuComponent: boolean = false;
  public isSupportGif: boolean = true;
  public isBorderGradient: boolean = false;
  constructor(
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
    private ipfsService: IPFSService,
    private dataHelper: DataHelper,

    private postHelperService: PostHelperService,
    private feedsServiceApi: FeedsServiceApi,
    // private hiveService: HiveService,
    // private hiveVaultApi: HiveVaultApi,
    private hiveVaultController: HiveVaultController

  ) { }

  ngOnInit() {
    let sid = setTimeout(() => {
      this.newPostIonTextarea.setFocus();
      clearTimeout(sid);
    }, 500);
  }

  newPostTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  async initFeed() {
    let currentFeed: FeedsData.ChannelV3 = this.dataHelper.getCurrentChannel();

    if (currentFeed == null) {
      const selfChannelList = await this.dataHelper.getSelfChannelListV3();
      currentFeed = await this.dataHelper.getChannelV3ById(selfChannelList[0].destDid, selfChannelList[0].channelId);
      this.dataHelper.setCurrentChannel(currentFeed);
    }

    this.channelIdV3 = currentFeed.channelId;
    this.channelName = currentFeed['name'] || '';
    this.subscribers = currentFeed['subscribers'] || '';
    let channelAvatarUri = currentFeed['avatar'] || '';
    if (channelAvatarUri != '') {
      let destDid: string = currentFeed.destDid;
      this.handleChannelAvatar(channelAvatarUri, destDid);
    }
  }

  handleChannelAvatar(channelAvatarUri: string, destDid: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        this.channelAvatar = result;
      }).catch((err) => {
      })
  }

  async ionViewWillEnter() {
    this.imgUrl = this.dataHelper.getSelsectNftImage();
    this.dataHelper.setSelsectNftImage(this.imgUrl);
    this.channelList = await this.dataHelper.getSelfChannelListV3() || [];
    this.initTitle();

    this.initFeed();

  }

  ionViewWillLeave() {

    this.isLoading = false;
    this.hideSwitchFeed = false;
    this.imgUrl = '';
    this.transcode = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.removeVideo();

    if (this.isUpdateHomePage) {
      this.native.handleTabsEvents("update");
    }else{
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

  post() {
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
          if(error["code"] != 507){
            this.native.toastWarn('common.sendFail'); // 需要更改错误提示
          }
          this.isLoading = false;
          this.isPublishing = false;
        }
      }
    });
  }

  async sendPost() {
    await this.hiveVaultController.publishPost(this.channelIdV3, this.newPost, [this.imgUrl], this.videoData, '')
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
      Logger.error(TAG,"recordAVideo error",error);
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
    try{
      const videoData = await this.postHelperService.selectvideo((progress: number) => {
        this.zone.run(() => {
          this.totalProgress = progress;
        });
      });
      this.handleVideoData(videoData);
    }catch(err){

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

    if(videoData.duration === null){
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
      video.setAttribute('poster', this.posterImg);
      this.setOverPlay(this.flieUri);
      clearTimeout(sid);
    }, 0);

    this.videoData = videoData;
  }

  removeVideo() {
    this.totalProgress = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.posterImg = '';
    this.flieUri = '';
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
    source.setAttribute('src', videoData);
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

    if (video !='' && source != '' && !video.paused) {
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

  clickImageMenu() {
     this.hidePictureMenuComponent = true;
  }

  openNft(that: any) {
    that.native.navigateForward(['profilenftimage'], { queryParams: { type: 'postImages' } });
  }

  clickNFT(){
   this.openNft(this);
  }


  openCamera() {
    this.camera.openCamera(
      30,
      0,
      1,
      (imageUrl: any) => {
        this.zone.run(() => {
          this.hidePictureMenuComponent = false;
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

  hidePictureMenu(data: any) {
    let buttonType = data['buttonType'];
    switch(buttonType) {
      case 'photolibary':
        this.hidePictureMenuComponent = false;
        break;
      case 'cancel':
        this.hidePictureMenuComponent = false;
        break;
    }
  }

  openGallery(data: any) {
    this.hidePictureMenuComponent = false;
    let fileBase64  = data["fileBase64"] || "";
    this.imgUrl = fileBase64;
    this.dataHelper.setSelsectNftImage(fileBase64);
  }

  ionBlur() {
    this.isBorderGradient = false;
   }

   ionFocus() {
     this.isBorderGradient = true;
   }
}
