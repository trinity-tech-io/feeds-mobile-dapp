import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger, LogLevel } from 'src/app/services/logger';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { PopupProvider } from 'src/app/services/popup';
import { GlobalService } from 'src/app/services/global.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { FeedsSqliteHelper } from 'src/app/services/sqlite_helper.service';

@Component({
  selector: 'app-developer',
  templateUrl: './developer.page.html',
  styleUrls: ['./developer.page.scss'],
})
export class DeveloperPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode: boolean = false;
  public openLog: boolean = false;
  public selectedNetwork: any = "MainNet";
  public popover: any = null;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private zone: NgZone,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    public popupProvider: PopupProvider,
    private globalService: GlobalService,
    private ipfsService: IPFSService,
    private feedsSqliteHelper: FeedsSqliteHelper
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.developerMode = this.dataHelper.getDeveloperMode();
    this.selectedNetwork = this.dataHelper.getDevelopNet();
    this.openLog = this.dataHelper.getDevelopLogMode();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('SettingsPage.developer'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  navToConfigureNetwork() {
    //select-net
    this.native.navigateForward(['/select-net'], {})
  }

  toggleLogMode() {
    this.zone.run(() => {
      this.openLog = !this.openLog;
    });
    this.dataHelper.setDevelopLogMode(this.openLog);
    if (this.openLog)
      Logger.setLogLevel(LogLevel.DEBUG);
    else
      Logger.setLogLevel(LogLevel.WARN);
  }

  interfaceTest() {
    this.native.navigateForward(['/hive-interface-test'], {})
  }


  cleanData() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'DeveloperPage.confirmTitle',
      'DeveloperPage.des',
      this.cancel,
      this.confirm,
      '',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async confirm(that: any) {
    if (this.popover != null) {
      await this.popover.dismiss();
      this.popover = null;
    }

    that.deleteAllCollections(that);
  }

  async deleteAllCollections(that: any) {
    await that.native.showLoading("common.waitMoment");
    try {
      let reslut = await that.hiveVaultController.deleteAllCollections();
      if (reslut === "true") {
        await that.dataHelper.removeData("feeds.initHive");
        await that.dataHelper.removeData("feeds.syncHiveData");
        const signinData = await this.dataHelper.getSigninData();
        let userDid = signinData.did
        localStorage.removeItem(userDid + "localScriptVersion");
        await that.feedsSqliteHelper.dropAllData(userDid);
        that.native.hideLoading();
        let req = requestAnimationFrame(()=>{
          that.globalService.restartApp();
          cancelAnimationFrame(req);
          req = null;
        });
      } else {
        that.native.hideLoading();
      }
    } catch (error) {
      that.native.hideLoading();
    }
  }

  toggleDeveloperMode() {
    this.zone.run(() => {
      this.developerMode = !this.developerMode;
    });
    this.dataHelper.setDeveloperMode(this.developerMode);
    this.dataHelper.saveData('feeds.developerMode', this.developerMode);
    if (this.developerMode) {
      this.ipfsService.setTESTMode(true);
    } else {
      this.ipfsService.setTESTMode(false);
    }
  }

}
