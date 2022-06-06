import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NavController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../../services/theme.service';
import { MenuService } from 'src/app/services/MenuService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { IPFSService } from 'src/app/services/ipfs.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { CameraService } from '../../../services/CameraService';
import { Logger } from 'src/app/services/logger';
import { FileHelperService } from 'src/app/services/FileHelperService';
let TAG: string = 'feeds-profileimage';
import { File } from '@ionic-native/file/ngx';
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
  public pictureMenu: any = null;
  constructor(
    private native: NativeService,
    private navCtrl: NavController,
    private events: Events,
    private zone: NgZone,
    private translate: TranslateService,
    public theme: ThemeService,
    private dataHelper: DataHelper,
    private menuService: MenuService,
    private titleBarService: TitleBarService,
    private ipfsService: IPFSService,
    private camera: CameraService,
    private file: File,
    private fileHelperService: FileHelperService
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.initTitle();
    this.select = this.dataHelper.getSelsectIndex();
    let clipProfileIamge = this.dataHelper.getClipProfileIamge();
    if (clipProfileIamge != '') {
      this.select = 0;
      this.selectedAvatar = clipProfileIamge;
      this.dataHelper.setClipProfileIamge('');
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
      }else if(this.selectedAvatar.indexOf('feeds:image:') > -1){
        imgUri = this.selectedAvatar.replace('feeds:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }else if(this.selectedAvatar.indexOf('pasar:image:') > -1){
        imgUri = this.selectedAvatar.replace('pasar:image:', '');
        imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
      }else{
        imgUri = this.selectedAvatar;
      }
      this.uploadedAvatar = imgUri;
    }

  }

  ionViewWillLeave() {
    if (this.pictureMenu != null) {
      this.menuService.hideActionSheet();
    }
    this.native.handleTabsEvents()
  }

  ionViewDidEnter() {}

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
    this.pictureMenu = this.menuService.showPictureMenu(
      this,
      this.openCamera,
      this.openGallery,
      this.openNft,
    );
  }

  openNft(that: any) {
    that.native.navigateForward(['nftavatarlist'], '');
  }

  openGallery(that: any) {

    try {
      that.handleImgUri(0, that).then(async (imagePath: string) => {
        let pathObj = that.handleImgUrlPath(imagePath);
        let fileName = pathObj['fileName'];
        let filePath = pathObj['filepath'];
        return that.getFlieObj(fileName, filePath, that);

      }).then(async (fileBase64: string) => {
        if(fileBase64.indexOf("gif") > -1 ){
          //  that.select = 0;
          //  that.selectedAvatar =  fileBase64;
          //  that.uploadedAvatar = fileBase64;
          that.native.toastWarn("ProfileimagePage.avatarEorr");
        }else{
          that.native.navigateForward(['editimage'], '');
          that.dataHelper.setClipProfileIamge(fileBase64);
        }
      });
    } catch (error) {

    }

  }

  openCamera(that: any) {
    that.camera.openCamera(
      30,
      0,
      1,
      (imageUrl: any) => {
        that.native.navigateForward(['editimage'], '');
        that.dataHelper.setClipProfileIamge(imageUrl);
      },
      err => {},
    );
  }

  handleImgUri(type: number, that: any): Promise<any> {
    return new Promise((resolve, reject) => {
      that.camera.openCamera(
        100,
        1,
        type,
        (imgPath: any) => {
          resolve(imgPath);
        },
        (err: any) => {
          Logger.error(TAG, 'Add img err', err);
          let imgUrl = that.imgUrl || '';
          if (!imgUrl) {
            this.native.toast_trans('common.noImageSelected');
            reject(err);
            return;
          }
        }
      );
    });
  }

  getFlieObj(fileName: string, filepath: string, that: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const base64Result = await that.fileHelperService.getUserFileBase64Data(filepath, fileName);
        if (!base64Result) {
          const error = 'Get File object is null';
          Logger.error(TAG, 'Get File object error', error)
          reject(error);
        }
        resolve(base64Result);
      } catch (error) {
        Logger.error(TAG, 'Get File object error', error)
        reject(error);
      }
    });
  }

  handleImgUrlPath(fileUri: string) {
    let pathObj = {};
    fileUri = fileUri.replace('/storage/emulated/0/', '/sdcard/');
    let path = fileUri.split('?')[0];
    let lastIndex = path.lastIndexOf('/');
    pathObj['fileName'] = path.substring(lastIndex + 1, fileUri.length);
    pathObj['filepath'] = path.substring(0, lastIndex);
    pathObj['filepath'] = pathObj['filepath'].startsWith('file://')
      ? pathObj['filepath']
      : `file://${pathObj['filepath']}`;

    return pathObj;
  }
}
