import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from '@ionic/angular';
import { FeedService, Avatar } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';
import { ThemeService } from '../../../../services/theme.service';
import { AppService } from '../../../../services/AppService';
import { StorageService } from '../../../../services/StorageService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PopoverController } from '@ionic/angular';
import { IntentService } from 'src/app/services/IntentService';
import { IPFSService } from 'src/app/services/ipfs.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { CameraService } from 'src/app/services/CameraService';
import { HiveService } from 'src/app/services/HiveService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

let TAG: string = 'Profiledetail';
type ProfileDetail = {
  type: string;
  details: string;
};

@Component({
  selector: 'app-profiledetail',
  templateUrl: './profiledetail.page.html',
  styleUrls: ['./profiledetail.page.scss'],
})
export class ProfiledetailPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode: boolean = false;
  public avatar: string = '';
  public userName = '';
  public userDescription = '';
  public did = '';
  public gender = '';
  public telephone = '';
  public email = '';
  public location = '';
  public profileDetails: ProfileDetail[] = [];

  public isShowPublisherAccount: boolean = false;
  public isShowQrcode: boolean = true;
  public serverStatus: number = 1;
  public clientNumber: number = 0;
  public serverDetails: any[] = [];
  public isPress: boolean = false;
  public didString: string = '';
  public serverName: string = '';
  public owner: string = '';
  public introduction: string = null;
  public feedsUrl: string = null;
  public elaAddress: string = '';
  public actionSheet: any = null;
  public walletAddress: string = null;
  public lightThemeType: number = 3;
  private userDid: string = '';
  public hidePictureMenuComponent: boolean = false;
  public isSupportGif: boolean = false;
  public isProfileSame: boolean = false;

  constructor(
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    private translate: TranslateService,
    public theme: ThemeService,
    private events: Events,
    private appService: AppService,
    private platform: Platform,
    private storageService: StorageService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private nftContractControllerService: NFTContractControllerService,
    private popoverController: PopoverController,
    private intentService: IntentService,
    private ipfsService: IPFSService,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper,
    private camera: CameraService,
    private hiveService: HiveService,
    private hiveVaultController: HiveVaultController
  ) { }

  ngOnInit() { }

  collectData() {
    this.profileDetails = [];
    this.profileDetails.push({
      type: 'ProfiledetailPage.name',
      details: this.userName,
    });

    this.profileDetails.push({
      type: 'ProfiledetailPage.description',
      details: this.userDescription,
    });

    this.profileDetails.push({
      type: 'ProfiledetailPage.did',
      details: this.did,
    });

    if (
      this.telephone != '还未设置' &&
      this.telephone != 'Not set yet' &&
      this.telephone != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.telephone',
        details: this.telephone,
      });
    }

    if (
      this.email != '还未设置' &&
      this.email != 'Not set yet' &&
      this.email != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.email',
        details: this.email,
      });
    }

    if (
      this.location != '还未设置' &&
      this.location != 'Not set yet' &&
      this.location != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.location',
        details: this.location,
      });
    }
  }

  async ionViewWillEnter() {
    document.body.addEventListener('touchmove', this.preventDefault, { passive: false });

    this.theme.setTheme1();
    this.walletAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.events.subscribe(FeedsEvent.PublishType.editProfileInfoRightMenu, () => {
      this.clickEditProfileInfo();
    });

    let signInData = await this.dataHelper.getSigninData();
    let nickname = signInData['nickname'] || '';
    if (nickname != '' && nickname != 'Information not provided') {
      this.userName = nickname;
    } else {
      this.userName = signInData['name'] || '';
    }
    this.userDescription = signInData['description'] || '';
    this.userDid = signInData['did'];
    this.did = this.feedService.rmDIDPrefix(signInData['did'] || '');
    this.telephone = signInData['telephone'] || '';
    this.email = signInData['email'] || '';
    this.location = signInData['location'] || '';
    this.collectData();
    try {
      // let croppedImage = this.dataHelper.getClipProfileIamge();
      // if (croppedImage != '') {
      //   this.avatar = croppedImage;
      //   await this.saveAvatar();
      // } else {
      this.avatar = await this.hiveVaultController.getUserAvatar();
      // }
    } catch (error) {

    }
    this.handleImages()

  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfiledetailPage.profileDetails'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);

    if (!this.theme.darkMode) {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "editProfileInfoRightMenu", "assets/icon/edit.ico");
    } else {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "editProfileInfoRightMenu", "assets/icon/dark/edit.ico");
    }
  }

  ionViewWillUnload() { }

  async ionViewWillLeave() {
    document.body.removeEventListener("touchmove", this.preventDefault, false);
    this.theme.restTheme();
    this.events.unsubscribe(FeedsEvent.PublishType.editProfileInfoRightMenu);
    this.native.handleTabsEvents();
  }

  handleImages() {
    let imgUri = "";
    if (this.avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = this.avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('feeds:image:') > -1) {
      imgUri = this.avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('pasar:image:') > -1) {
      imgUri = this.avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else {
      imgUri = this.avatar;
    }
    return imgUri;
  }

  copytext(text: any) {
    let textdata = text || '';
    if (textdata != '') {
      this.native
        .copyClipboard(text)
        .then(() => {
          this.native.toast_trans('common.textcopied');
        })
        .catch(() => { });
    }
  }


  menuMore(feedsUrl: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    //@Deprecated
    this.intentService.share('', feedsUrl);
  }

  // editProfile() {
  //   this.editImage();
  // }

  syncProfileToHive() {
    this.native.toast('' + this.isProfileSame);
  }


  async editImage() {
    this.hidePictureMenuComponent = true;
  }

  openNft(that: any) {
    that.native.navigateForward(['nftavatarlist'], '');
  }

  openGallery(data: any) {
    this.hidePictureMenuComponent = false;
    let fileBase64 = data["fileBase64"] || "";
    if (fileBase64 != "") {
      this.native.navigateForward(['editimage'], '');
      this.dataHelper.setClipProfileIamge(fileBase64);
    }
  }

  openCamera() {
    this.camera.openCamera(
      30,
      0,
      1,
      (imageUrl: any) => {
        this.hidePictureMenuComponent = false;
        let imgBase64 = imageUrl || "";
        if (imgBase64 != "") {
          this.native.navigateForward(['editimage'], '');
          this.dataHelper.setClipProfileIamge(imgBase64);
        }
      },
      err => { },
    );
  }

  hidePictureMenu(data: any) {
    let buttonType = data['buttonType'];
    switch (buttonType) {
      case 'photolibary':
        this.hidePictureMenuComponent = false;
        break;
      case 'cancel':
        this.hidePictureMenuComponent = false;
        break;
    }
  }

  preventDefault(e: any) { e.preventDefault(); };

  clickEditProfileInfo() {
    this.native.navigateForward(['/editprofileinfo'], { queryParams: { "userDid": this.userDid } });
  }

}
