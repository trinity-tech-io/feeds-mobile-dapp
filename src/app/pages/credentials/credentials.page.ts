import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NativeService } from 'src/app/services/NativeService';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { DIDHelperService } from 'src/app/services/did_helper.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { Events } from 'src/app/services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';

@Component({
  selector: 'app-credentials',
  templateUrl: './credentials.page.html',
  styleUrls: ['./credentials.page.scss'],
})
export class CredentialsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public isKycmePublic: boolean = false;
  private userDid: string = '';
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private zone: NgZone,
    private standardAuthService: StandardAuthService,
    private didHelperService: DIDHelperService,
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper,
    private events: Events
  ) { }

  ngOnInit() {
    this.initData();
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('app.credentials'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  async initData() {
    this.userDid = (await this.dataHelper.getSigninData()).did;
    if (this.userDid) {
      this.hiveVaultController.getUserProfile(this.userDid).then((profile: FeedsData.UserProfile) => {
        if (!profile.credentials) {
          this.isKycmePublic = false;
        } else {
          this.isKycmePublic = true;
        }
      });
    } else {
    }
  }

  toggleKycmeStatus() {
    this.zone.run(() => {
      this.isKycmePublic = !this.isKycmePublic;
      if (this.isKycmePublic) {
        this.standardAuthService.requestKYCCredentials().then(async (result) => {
          if (!result) {
            this.isKycmePublic = false;
            return;
          } else {
            this.isKycmePublic = true;
            this.updateCredential('newCredential');
          }

          console.log('result is', result);
        }).catch((error) => {
          console.log('result error', error);
        });
      } else {
        this.isKycmePublic = false;
        this.updateCredential('');
      }

    });
  }

  updateCredential(newCredential: string) {
    this.hiveVaultController.getUserProfile(this.userDid).then((userProfile: FeedsData.UserProfile) => {
      this.hiveVaultController.updateUserProfile(userProfile.did, userProfile.name, userProfile.bio, userProfile.avatar, newCredential).then(() => {
        this.events.publish(FeedsEvent.PublishType.kycCredentialChanged, userProfile.did);
      }).catch((error) => {
      });
    }).catch((error) => {
    })
  }
}
