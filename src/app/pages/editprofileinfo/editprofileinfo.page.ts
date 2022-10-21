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
  private userDid: string = '';
  public userName: string = '';
  public userDes: string = '';
  public userTelephone = '';
  public userEmail = '';
  public avatar: string = '';
  public hidePictureMenuComponent: boolean = false;
  public isSupportGif: boolean = false;
  public lightThemeType: number = 3;
  public clickButton: boolean = false;

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
      this.userDid= params.userDid;
    });
  }

  ionViewWillEnter() {
   this.theme.setTheme1();
   this.initTitle();
   this.initProfileInfo();
  }

  async initProfileInfo() {
    try {
      let croppedImage = this.dataHelper.getClipProfileIamge();
      if (croppedImage != '') {
        this.avatar = croppedImage;
        await this.saveAvatar();
      } else {
        this.avatar = await this.hiveVaultController.getUserAvatar();
      }
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

  async saveAvatar() {
    await this.native.showLoading('common.waitMoment');
    try {
      await this.hiveService.uploadScriptWithString("custome", this.avatar)
      this.native.hideLoading()
      this.dataHelper.saveUserAvatar(this.userDid, this.avatar);
      this.dataHelper.setClipProfileIamge("");
    } catch (error) {
      this.avatar = await this.hiveVaultController.getUserAvatar();
      this.dataHelper.setClipProfileIamge("");
      this.native.hideLoading();
      this.native.toast('common.saveFailed');
    }
  }

  clickEditProfile() {
    if(this.checkParams()){

    }
  }

  checkParams(){

    if(this.userName === ''){
      this.native.toastWarn('EditprofileinfoPage.inputName');
      return false;
    }

    if(this.userDes === ''){
      this.native.toastWarn('EditprofileinfoPage.inputDes');
      return false;
    }

    if(this.userTelephone === ''){
      this.native.toastWarn('EditprofileinfoPage.inputTelephone');
      return false;
    }

    if(this.userEmail === ''){
      this.native.toastWarn('EditprofileinfoPage.inputEmail');
      return false;
    }

    return true;
  }

}
