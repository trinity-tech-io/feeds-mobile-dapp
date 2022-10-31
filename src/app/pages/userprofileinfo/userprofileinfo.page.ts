import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { FeedService } from 'src/app/services/FeedService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
let TAG: string = 'Userprofileinfo';
type ProfileDetail = {
  type: string;
  details: string;
};
@Component({
  selector: 'app-userprofileinfo',
  templateUrl: './userprofileinfo.page.html',
  styleUrls: ['./userprofileinfo.page.scss'],
})
export class UserprofileinfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public lightThemeType: number = 3;
  public userName = '';
  public userDescription = '';
  public did = '';
  public gender = '';
  public telephone = '';
  public email = '';
  public location = '';
  private userDid: string = '';
  public avatar: string = '';
  public profileDetails: ProfileDetail[] = [];

  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private feedService: FeedService,
    private native: NativeService,
    private ipfsService: IPFSService,
    private activatedRoute: ActivatedRoute,
    public theme: ThemeService,
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((queryParams: any) => {
      this.userDid = queryParams.userDid || '';
    });
  }

  async ionViewWillEnter() {
    document.body.addEventListener('touchmove', this.preventDefault, { passive: false });

    this.theme.setTheme1();
    this.initTitle();

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

  async ionViewWillLeave() {
    document.body.removeEventListener("touchmove", this.preventDefault, false);
    this.theme.restTheme();
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

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('UserprofileinfoPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  preventDefault(e: any) { e.preventDefault(); };

}
