import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import { ModalController, IonTextarea, Platform } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { AppService } from 'src/app/services/AppService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import _ from 'lodash';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { UtilService } from 'src/app/services/utilService';
import SparkMD5 from 'spark-md5';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
let TAG: string = 'Feeds-editpost';
@Component({
  selector: 'app-editpost',
  templateUrl: './editpost.page.html',
  styleUrls: ['./editpost.page.scss'],
})
export class EditPostPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('newPostIonTextarea', { static: false })
  newPostIonTextarea: IonTextarea;
  public channelAvatar = '';
  public channelName = '';
  public subscribers: string = '';
  public editContent: string = '';
  public unEditContent: string = '';
  public imgUrl: string = '';
  public destDid: string = '';
  public channelId: string = '';
  public postId: string = '';

  public posterImg: any = '';
  public flieUri: string = '';
  public uploadProgress: number = 0;
  public videotype: string = 'video/mp4';
  public transcode: number = 0;

  public cachedMediaType = '';
  public duration: any = 0;

  public totalProgress: number = 0;
  public isShowVideo: boolean = false;
  public isBorderGradient: boolean = false;
  private postData: FeedsData.PostV3 = null;
  public mediaType: FeedsData.MediaType;
  private originPostData: FeedsData.PostV3 = null;
  private isUpdateTab: boolean = false;
  public clickButton: boolean = false;
  public channelPublicStatusList: any = {};
  private setFocusSid: any = null;
  constructor(
    private events: Events,
    private native: NativeService,
    private acRoute: ActivatedRoute,
    private zone: NgZone,
    public theme: ThemeService,
    private translate: TranslateService,
    public modalController: ModalController,
    public videoEditor: VideoEditor,
    public appService: AppService,
    public el: ElementRef,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private platform: Platform,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService
  ) { }

  ngOnInit() {
    this.acRoute.queryParams.subscribe(data => {
      let item = _.cloneDeep(data);
      this.destDid = item['destDid'] || '';
      this.channelId = item['channelId'] || '';
      this.postId = item['postId'] || '';
    });
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

  ionViewWillEnter() {
    this.initTitle();
    this.initData();
  }

  ionViewWillLeave() {
    this.clearSetFocusSid();
    this.imgUrl = '';
    this.clickButton = false;
    this.native.hideLoading();
    this.removeVideo();
    if (this.isUpdateTab) {
      this.events.publish(FeedsEvent.PublishType.editPostFinish);
    }
  }

  removeVideo() {
    this.isShowVideo = false;
    this.totalProgress = 0;
    this.uploadProgress = 0;
    this.totalProgress = 0;
    this.posterImg = '';
    this.flieUri = '';
    let id = this.destDid + this.channelId + this.postId;
    let video: any = document.getElementById(id + 'videoeditpost') || '';
    if (video != '') {
      video.removeAttribute('poster');
    }
    let source: any = document.getElementById(id + 'sourceeditpost') || '';
    if (source != '') {
      source.removeAttribute('poster');
    }

    if (video != '') {
      let sid = setTimeout(() => {
        video.load();
        clearTimeout(sid);
      }, 10);
    }
  }

  clickTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  pauseVideo() {
    if (this.posterImg != '') {
      let id = this.destDid + this.channelId + this.postId;
      let video: any = document.getElementById(id + 'videoeditpost') || '';
      let source: any = document.getElementById(id + 'sourceeditpost') || '';
      if (video != '' && source != '' && !video.paused) {
        //判断是否处于暂停状态
        video.pause(); //停止播放
      }
    }
  }

  ionViewDidEnter() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('EditPostPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  async clickEidtPost() {

    let editContent = this.native.iGetInnerText(this.editContent);
    let unEditContent = this.native.iGetInnerText(this.unEditContent);
    if (editContent === '') {
      this.native.toastWarn('CreatenewpostPage.tipMsg');
      return false;
    }

    if (unEditContent === editContent) {
      this.native.toastWarn('common.nochanges');
      return false;
    }

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return false;
    }

    await this.native.showLoading('common.waitMoment');
    this.clickButton = true;
    this.updatePost();

  }
  //todo
  showBigImage(content: any) {
    this.viewHelper.openViewer(
      this.titleBar,
      content,
      'common.image',
      'EditPostPage.title',
      this.appService,
    );
  }

  getImage(post: FeedsData.PostV3) {
    this.imgUrl = './assets/icon/reserve.svg';//set Reserve Image
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let thumbnailKey = elements.thumbnailPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = thumbnailKey.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, thumbnailKey, fileName, type)
      .then((cacheResult) => {
        let thumbImage = cacheResult || "";
        if (thumbImage != "") {
          this.imgUrl = thumbImage;
        }
      }).catch(() => {
      })
  }


  async initData() {
    let channel: any = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId);
    this.channelName = channel['displayName'] || channel['name'] || '';
    this.subscribers = channel['subscribers'] || '';
    let channelAvatarUri = channel['avatar'] || '';
    if (channelAvatarUri != '') {
      this.handleChannelAvatar(channelAvatarUri);
    }
    let post: any = await this.dataHelper.getPostV3ById(this.postId);
    this.postData = post;
    this.originPostData = _.cloneDeep(this.postData);
    this.mediaType = post.content.mediaType;

    if (this.mediaType === FeedsData.MediaType.containsImg) {
      this.isShowVideo = false;
      this.getImage(post);
    }

    if (this.mediaType === FeedsData.MediaType.containsVideo) {
      this.isShowVideo = true;
      this.duration = post.content.mediaData[0].duration;
      this.initVideo(post);
    }

    this.unEditContent = this.postData.content.content || '';
    this.editContent = this.postData.content.content || '';

    try {
      this.getChannelPublicStatus(this.destDid,this.channelId);
    } catch (error) {

    }

  }

  handleChannelAvatar(channelAvatarUri: string) {
    if(this.channelAvatar === ''){
      this.channelAvatar = './assets/images/loading.svg';
    }
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, channelAvatarUri, fileName, "0")
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


  initVideo(post: FeedsData.PostV3) {
    this.posterImg = './assets/icon/reserve.svg';//set Reserve Image
    let mediaDatas = post.content.mediaData;
    const elements = mediaDatas[0];
    let thumbnailKey = elements.thumbnailPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = thumbnailKey.split("@")[0];

    this.hiveVaultController
      .getV3Data(this.destDid, thumbnailKey, fileName, type)
      .then((idata: string) => {
        let imgageData: string = idata || '';
        if (imgageData != '') {
          this.zone.run(() => {
            this.isShowVideo = true;
            this.posterImg = imgageData;
            let id = this.destDid + this.channelId + this.postId;
            let sid = setTimeout(() => {
              let video: any = document.getElementById(id + 'videoeditpost') || '';
              if (video != '') {
                video.setAttribute('poster', imgageData);
              }
              this.setFullScreen(id);
              this.setOverPlay(id);
              clearTimeout(sid);
            }, 10);
          });
        }
      });
  }

  setFullScreen(id: string) {
    let vgfullscreen: any =
      document.getElementById(id + 'vgfullscreeneditpost') || '';
    if (vgfullscreen != '') {
      vgfullscreen.onclick = async () => {
        this.pauseVideo();
        let postImg: string = document
          .getElementById(id + 'videoeditpost')
          .getAttribute('poster');
        let videoSrc: string = document
          .getElementById(id + 'sourceeditpost')
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
      document.getElementById(id + 'vgoverlayplayeditpost') || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let source: any =
            document.getElementById(id + 'sourceeditpost') || '';
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.getVideo();
          }
        });
      };
    }
  }

  getVideo() {

    let mediaDatas = this.postData.content.mediaData;
    const elements = mediaDatas[0];
    let originKey = elements.originMediaPath;
    let type = elements.type;
    //bf54ddadf517be3f1fd1ab264a24e86e@feeds/data/bf54ddadf517be3f1fd1ab264a24e86e
    let fileName: string = originKey.split("@")[0];

    this.hiveVaultController
      .getV3Data(this.destDid, originKey, fileName, type)
      .then((videodata: string) => {
        this.zone.run(() => {
          let videoData = videodata || '';
          this.flieUri = videoData;
          this.loadVideo(videoData);
        });
      });
  }

  loadVideo(videoData: string) {
    let id = this.destDid + this.channelId + this.postId;
    let source: any = document.getElementById(id + 'sourceeditpost') || '';
    source.setAttribute('src', videoData);
    let vgbuffering: any = document.getElementById(id + 'vgbufferingeditpost');
    let vgoverlayplay: any = document.getElementById(
      id + 'vgoverlayplayeditpost',
    );
    let vgcontrol: any = document.getElementById(id + 'vgcontrolseditpost');
    let video: any = document.getElementById(id + 'videoeditpost') || '';

    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgbuffering.style.display = 'none';
      vgoverlayplay.style.display = 'block';
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

  updatePost() {
    let content = _.cloneDeep(this.postData.content);
    content.content = this.editContent;
    const updateAt = UtilService.getCurrentTimeNum();
    const pinStatus = FeedsData.PinStatus.NOTPINNED;//TODO
    const device = UtilService.getDeviceType(this.platform);
    this.hiveVaultController.updatePost(this.originPostData, content, pinStatus, updateAt, "public", '',
      FeedsData.PostCommentStatus.edited, '', '', device).then((result) => {
        this.zone.run(async () => {
          this.isUpdateTab = true;
          this.clickButton = false;
          this.native.hideLoading();
          this.native.pop();
        });
      }).catch((error) => {
        this.native.handleHiveError(error, 'common.editPostFail');
        this.clickButton = false;
        this.pauseVideo();
        this.native.hideLoading();
      });
  }

  ionBlur() {
    this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
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
      tokenId = UtilService.hex2dec(tokenId);
      let tokenInfo = await this.nftContractControllerService.getChannel().channelInfo(tokenId);
      if (tokenInfo[0] != '0') {
        return tokenInfo;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

