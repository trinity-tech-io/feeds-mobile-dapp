import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { CameraService } from 'src/app/services/CameraService';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveService } from 'src/app/services/HiveService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';

@Component({
  selector: 'app-editprofileinfo',
  templateUrl: './editprofileinfo.page.html',
  styleUrls: ['./editprofileinfo.page.scss'],
})
export class EditprofileinfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public userDid: string = '';
  public userName: string = '';
  public userDes: string = '';
  public userTelephone = '';
  public userEmail = '';
  public avatar: string = '';
  public hidePictureMenuComponent: boolean = false;
  public isSupportGif: boolean = false;
  public lightThemeType: number = 3;
  public clickButton: boolean = false;

  private originUserName: string = '';
  private originUserDes: string = '';
  private originUserAvatar: string = '';

  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    private native: NativeService,
    private camera: CameraService,
    private ipfsService: IPFSService,
    private hiveVaultController: HiveVaultController,
    private hiveService: HiveService,
    private activatedRoute: ActivatedRoute,
    public theme: ThemeService,
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params: any) => {
      this.userDid = params.userDid;
    });
    this.initProfileInfo();
  }

  ionViewWillEnter() {
    this.theme.setTheme1();
    this.initTitle();
    this.onAvatarDataChangedListener();
  }

  async onAvatarDataChangedListener() {
    try {
      let croppedImage = this.dataHelper.getClipProfileIamge();
      if (croppedImage != '') {
        this.avatar = croppedImage;
      } else {
        this.avatar = await this.hiveVaultController.getUserAvatar();
      }
    } catch (error) {
    }
    this.handleImages()
  }

  async initProfileInfo() {
    try {
      this.dataHelper.setClipProfileIamge("");

      let signInData = await this.dataHelper.getSigninData();
      let nickname = signInData['nickname'] || '';
      if (nickname != '' && nickname != 'Information not provided') {
        this.userName = nickname;
      } else {
        this.userName = signInData['name'] || '';
      }
      this.userDes = signInData['description'] || '';
      this.userDid = signInData['did'];
      let croppedImage = this.dataHelper.getClipProfileIamge();
      if (croppedImage != '') {
        this.avatar = croppedImage;
      } else {
        this.avatar = await this.hiveVaultController.getUserAvatar();
      }
      this.originUserName = this.userName;
      this.originUserDes = this.userDes;
      this.originUserAvatar = this.avatar;
    } catch (error) {

    }
    this.handleImages()
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

  ionViewWillLeave() {
    this.theme.restTheme();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('EditprofileinfoPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  editProfile() {
    this.editImage();
  }

  async editImage() {
    this.hidePictureMenuComponent = true;
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

  saveAvatar(avatar: string) {
    try {
      this.dataHelper.saveUserAvatar(this.userDid, this.avatar);
      this.dataHelper.setClipProfileIamge("");
    } catch (error) {
      this.native.toast('common.saveFailed');
      throw new Error(error);
    }
  }

  async updateProfile() {
    if (this.checkParams()) {
      await this.native.showLoading('common.waitMoment');
      try {
        // await this.hiveVaultController.updateUserProfile(this.userDid, this.userName, this.userDes, this.avatar);
        this.saveAvatar(this.avatar);
      } catch (error) {
      } finally {
        this.native.hideLoading()
      }
    } else {
      this.native.toastWarn('EditprofileinfoPage.notChange');
    }
  }

  checkParams() {
    let isChanged = false;
    if (this.userName != this.originUserName) {
      isChanged = true;
    }
    if (this.userDes != this.originUserDes) {
      isChanged = true;
    }

    if (this.avatar != this.originUserAvatar) {
      isChanged = true;
    }

    return isChanged;
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
