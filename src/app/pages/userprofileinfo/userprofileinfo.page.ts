import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
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
  public userDid: string = '';
  public avatar: string = '';
  public profileDetails: ProfileDetail[] = [];

  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private hiveVaultController: HiveVaultController,
    private native: NativeService,
    private activatedRoute: ActivatedRoute,
    public theme: ThemeService,
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((queryParams: any) => {
      this.userDid = queryParams.userDid || '';
    });
  }

  initProfile(userDid: string) {
    this.hiveVaultController.getUserProfilePageItem(userDid).then(async (pageItem: { name: string, description: string, avatarHiveUrl: string }) => {
      this.userName = pageItem.name || ' ';
      this.userDescription = pageItem.description || '';
      this.avatar = await this.hiveVaultController.getUserAvatarFromHiveUrl(pageItem.avatarHiveUrl);
      this.collectData();
    }).catch(() => {
    });
  }

  async ionViewWillEnter() {
    document.body.addEventListener('touchmove', this.preventDefault, { passive: false });
    this.theme.setTheme1();
    this.initTitle();
    this.initProfile(this.userDid);
    this.collectData();
  }

  async ionViewWillLeave() {
    document.body.removeEventListener("touchmove", this.preventDefault, false);
    this.theme.restTheme();
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
   console.log("=========",this.userDescription);
   let description = this.userDescription || '';
   if(description === ''){
      description = this.translate.instant('DIDdata.NoDescription');
   }
   console.log("=========",description);

    this.profileDetails.push({
      type: 'ProfiledetailPage.description',
      details: description,
    });

    this.profileDetails.push({
      type: 'ProfiledetailPage.did',
      details: this.userDid,
    });
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
