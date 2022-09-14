import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { Params, ActivatedRoute } from '@angular/router';
import { DIDHelperService } from 'src/app/services/did_helper.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.page.html',
  styleUrls: ['./userlist.page.scss'],
})
export class UserlistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  // public userList: string[] = [];//did list
  public userAvatarMap: { [userDid: string]: string } = {};
  public userNameMap: { [userDid: string]: string } = {};
  public userDidList = [];
  private channelId = '';
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    // private HttpService: HttpService,
    private zone: NgZone,
    private dataHelper: DataHelper,
    private native: NativeService,
    public theme: ThemeService,
    private didHelper: DIDHelperService,
    private hiveVaultController: HiveVaultController
  ) { }

  ionViewWillEnter() {
    this.initTitle();
    this.getWhiteList();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('UserListPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewWillLeave() {
  }

  getWhiteList() {
  }

  // doRefresh(event: any) {
  // }

  clickItem(userItem: string) {
    this.native.toast(userItem);
  }

  ngOnInit() {
    this.userDidList = [];
    this.userAvatarMap = {};
    this.userNameMap = {};
    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.channelId = params.channelId;
      this.zone.run(async () => {
        const subscriptionList = await this.dataHelper.getSubscriptionV3DataByChannelId(this.channelId);
        for (let index = 0; index < subscriptionList.length; index++) {
          const element = subscriptionList[index];
          const userDid = element.userDid;
          const userDisplayName = element.displayName;
          this.resolveData(userDid);
          this.userDidList.push(userDid);
          this.setUserAvatar(userDid);
          this.setUserName(userDid, userDisplayName);
        }
      });
    });
  }

  resolveData(userDid: string) {
    this.didHelper.resolveNameAndAvatarFromDidDocument(userDid).then((result: { name: string, avatar: string }) => {
      if (result.name) {
        this.setUserName(userDid, result.name);
      }

      const avatarUrl = result.avatar;
      if (avatarUrl) {
        let fileName: string = userDid.replace('did:elastos:', '');
        this.hiveVaultController.getV3HiveUrlData(userDid, avatarUrl, fileName)
          .then((image) => {
            this.setUserAvatar(userDid, image);
          }).catch((err) => {
          })
      }
    });
  }

  setUserAvatar(userDid: string, avatar = './assets/images/default-contact.svg') {
    this.userAvatarMap[userDid] = avatar;
  }

  setUserName(userDid: string, userName: string) {
    this.userNameMap[userDid] = userName;
  }
}
