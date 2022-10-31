import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NavController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../services/theme.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { IPFSService } from 'src/app/services/ipfs.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { CameraService } from '../../../services/CameraService';
let TAG: string = 'feeds-profileimage';
@Component({
  selector: 'app-profileimage',
  templateUrl: './profileimage.page.html',
  styleUrls: ['./profileimage.page.scss'],
})
export class ProfileimagePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;

  public uploadedAvatar: string = null;

  public select = 1;
  public selectedAvatar: string = null;

  public avatars = [
    {
      index: 1,
      image: 'assets/images/profile-1.svg',
    },
    {
      index: 2,
      image: 'assets/images/profile-2.svg',
    },
    {
      index: 3,
      image: 'assets/images/profile-3.svg',
    },
    {
      index: 4,
      image: 'assets/images/profile-4.svg',
    },
    {
      index: 5,
      image: 'assets/images/profile-5.svg',
    },
    {
      index: 6,
      image: 'assets/images/profile-6.svg',
    },
    {
      index: 7,
      image: 'assets/images/profile-7.svg',
    },
    {
      index: 8,
      image: 'assets/images/profile-8.svg',
    },
    {
      index: 9,
      image: 'assets/images/profile-9.svg',
    },
  ];
  public hidePictureMenuComponent: boolean = false;
  public isSupportGif: boolean = false;
  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private translate: TranslateService,
    public theme: ThemeService,
    private dataHelper: DataHelper,
    private titleBarService: TitleBarService,
    private ipfsService: IPFSService,
    private camera: CameraService,
  ) { }

  ngOnInit() { }

  ionViewWillEnter() {
    this.initTitle();
    this.select = this.dataHelper.getSelsectIndex();
    let clipProfileIamge = this.dataHelper.getClipImage();
    if (clipProfileIamge != '') {
      this.select = 0;
      this.selectedAvatar = clipProfileIamge;
      this.dataHelper.setClipImage('');
    } else {
      this.selectedAvatar =
        this.dataHelper.getProfileIamge() || 'assets/images/profile-1.svg';
    }
    // Check if an uploaded avatar exists. If so, select it and have it displayed
    if (this.selectedAvatar.indexOf('data:image') === -1 &&
      this.selectedAvatar.indexOf('feeds:imgage:') === -1 &&
      this.selectedAvatar.indexOf('feeds:image:') === -1 &&
      this.selectedAvatar.indexOf('pasar:image:') === -1
    ) {
      this.uploadedAvatar = null;
    } else {
      let imgUri = "";
      if (this.selectedAvatar.indexOf('feeds:imgage:') > -1) {
        imgUri = this.selectedAvatar.replace('feeds:imgage:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      } else if (this.selectedAvatar.indexOf('feeds:image:') > -1) {
        imgUri = this.selectedAvatar.replace('feeds:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      } else if (this.selectedAvatar.indexOf('pasar:image:') > -1) {
        imgUri = this.selectedAvatar.replace('pasar:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      } else {
        imgUri = this.selectedAvatar;
      }
      this.uploadedAvatar = imgUri;
    }

  }

  ionViewWillLeave() {
    this.native.handleTabsEvents()
  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfileimagePage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  selectIndex(index: number, avatar?: string) {
    if (index === 0) {
      this.select = 0;
      // If uploaded avatar exists and is selected, use it. Otherwise open camera
      avatar ? (this.selectedAvatar = avatar) : this.addPic();
    } else {
      this.select = index;
      this.selectedAvatar = 'img://' + avatar;
    }
  }

  confirm() {
    if (!this.selectedAvatar) {
      // Usually this is avoided by using a default avatar if one isn't selected
      this.native.toast_trans('common.noImageSelected');
      return false;
    } else {
      // Set selected index and selected avatar
      this.dataHelper.setSelsectIndex(this.select);
      this.dataHelper.setProfileIamge(this.selectedAvatar);
      this.navCtrl.pop();
    }
  }

  addPic() {
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
      this.dataHelper.setClipImage(fileBase64);
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
          this.dataHelper.setClipImage(imgBase64);
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


}
