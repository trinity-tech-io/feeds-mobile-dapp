import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { IonSlides, LoadingController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { AppService } from '../../services/AppService';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import {
  connectivity,
  DID,
} from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { localization } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { LanguageService } from 'src/app/services/language.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logger';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { UtilService } from 'src/app/services/utilService';
const TAG: string = 'SigninPage';
@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('slide', { static: false }) slides: IonSlides;

  public signedIn: boolean = false;
  public did: string = '';
  public userName: string = '';
  public emailAddress: string = '';
  public lightThemeType: number = 2;
  public isShowLearnMore: boolean = false;
  //hive Auth
  public authorizationStatus: number = null;
  private sid: any = null;
  constructor(
    private native: NativeService,
    private feedService: FeedService,
    public loadingController: LoadingController,
    public theme: ThemeService,
    public appService: AppService,
    private titleBarService: TitleBarService,
    private languageService: LanguageService,
    private dataHelper: DataHelper,
    private events: Events,
    private zone: NgZone,
    private hiveVaultController: HiveVaultController,
    private platform: Platform
  ) { }

  ngOnInit() { }

  init() { }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      null
    );
    this.titleBarService.setTitleBarBlankButton(this.titleBar);
  }

  ionViewWillEnter() {

    localization.setLanguage(this.languageService.getCurLang());
    this.initTile();
    let isLearnMore = localStorage.getItem('org.elastos.dapp.feeds.isLearnMore') || '';
    if (isLearnMore === '') {
      this.isShowLearnMore = true;
    } else {
      this.isShowLearnMore = false;
    }
    this.addEvents();
    this.authorizationStatus = this.dataHelper.getHiveAuthStatus();
    if (this.authorizationStatus === 0) {

      this.dataHelper.getSigninData().then((signinData) => {
        if (!signinData || !signinData.did) {
          //retry signin
          this.authorizationStatus = 3;
          Logger.log(TAG, 'Retry signin');
          return;
        }
        this.handleHiveAuth(signinData.did, false);
      });
    }
  }

  addEvents() {
    this.events.subscribe(FeedsEvent.PublishType.authEssentialSuccess, async () => {
      Logger.log(TAG, "revice authEssentialSuccess event");
      this.zone.runOutsideAngular(async () => {
        this.authorizationStatus = 1;
        this.hiveVaultController.refreshHomeData(null);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.authEssentialFail, (data: any) => {
      switch (data.type) {
        case 0:
          this.authorizationStatus = 3;
          break;
        case 1:
          this.authorizationStatus = 2;
          break;
        case 11:
          this.authorizationStatus = 11;
          break;
      }
    });
  }

  removeEvents() {
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialFail);
  }

  ionViewDidEnter() { }

  ionViewWillLeave() {
    this.removeEvents();
  }

  async elastosEssentials() {
    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.navigateForward(['/importdid'], '');

    // connectivity.setActiveConnector('essentials').then(async () => {
    //   await this.doSignin(false);
    // }).catch((err) => {

    // });
  }

  async doSignin(forceCreate: boolean) {
    try {
      this.feedService.signIn().then(did => {
        if (did) {
          //此处切换成galleriahive 页面
          //this.native.setRootRouter('galleriahive');
          this.handleHiveAuth(did, forceCreate);
          return;
        } else {
        }
      }).catch((err) => {
        this.authorizationStatus = null;
        if (err != "common.didSigninError1") {
          this.native.toastWarn(err);
        }
      });
    } catch (error) {
      this.authorizationStatus = null;
    }
  }


  skip() {
    localStorage.setItem('org.elastos.dapp.feeds.isLearnMore', '11');
    this.isShowLearnMore = false;
  }

  learnMore() {
    this.isShowLearnMore = true;
  }


  privacyPolicy() {
    this.native.openUrl('https://trinity-tech.io/privacy_policy.html');
  }

  termsOfService() {
    this.native.openUrl('https://trinity-feeds.app/disclaimer');
  }

  openHomePage() {
    const syncHiveData = UtilService.generateHiveSyncCompleteObj();
    this.dataHelper.setSyncHiveData(syncHiveData);
    this.dataHelper.saveData("feeds.initHive", "1");
    this.native.setRootRouter(['/tabs/home']);
    this.hiveVaultController.syncSelfProfileWithRemote();
  }

  async TryButton() {
    await this.doSignin(true);
  }

  handleHiveAuth(userDid: string, forceCreate: boolean) {
    this.authorizationStatus = 0;
    if (this.sid === null) {
      this.sid = setTimeout(() => {
        this.hiveVaultController.prepareHive(userDid, forceCreate).catch((error) => {
          //if (error.getInternalCode() == 1) this.authorizationStatus = 11;
        });
        clearTimeout(this.sid);
        this.sid = null;
      }, 600)
    }
  }

  public isIOSPlatform(): boolean {
    if (this.platform.is('ios')) {
      return true;
    }
    return false;
  }

  guest() {
    // connectivity.setActiveConnector('local-identity').then(async () => {
    //   await this.doSignin(false);
    // }).catch((err) => {
    // });
  }
}
