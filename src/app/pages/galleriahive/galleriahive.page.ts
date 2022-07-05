import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger } from 'src/app/services/logger';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { UtilService } from 'src/app/services/utilService';

let TAG: string = 'Galleria-Hive';
@Component({
  selector: 'app-galleriahive',
  templateUrl: './galleriahive.page.html',
  styleUrls: ['./galleriahive.page.scss'],
})
export class GalleriahivePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public authorizationStatus: number = null;
  constructor(
    public titleBarService: TitleBarService,
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private dataHelper: DataHelper,
    private zone: NgZone,
    private feedService: FeedService,
    public theme: ThemeService,
    private hiveVaultController: HiveVaultController
  ) {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.authorizationStatus = 2;
    } else {
      this.authorizationStatus = 0;
    }
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.events.subscribe(FeedsEvent.PublishType.authEssentialSuccess, async () => {
      Logger.log(TAG, "revice authEssentialSuccess event");
      this.zone.run(async () => {
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
      }
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.authEssentialFail);
  }

  openHomePage() {

    // let connect = this.dataHelper.getNetworkStatus();
    // if (connect === FeedsData.ConnState.disconnected) {
    //   this.native.toastWarn('common.connectionError');
    //   return;
    // }
    const syncHiveData = UtilService.generateHiveSyncCompleteObj();
    this.dataHelper.setSyncHiveData(syncHiveData);
    this.dataHelper.saveData("feeds.initHive", "1");
    this.native.setRootRouter(['/tabs/home']);

    // this.dataHelper.loadData("feeds.syncHiveData").
    //   then((syncHiveData: any) => {
    //     if (syncHiveData === null) {
    //       this.dataHelper.saveData("feeds.initHive", "1");
    //       this.events.publish(FeedsEvent.PublishType.initHiveData);
    //       let syncHiveData = { status: 0, describe: "GalleriahivePage.preparingData" }
    //       this.dataHelper.setSyncHiveData(syncHiveData);
    //       this.native.setRootRouter('/tabs/home');
    //     } else {
    //       if (syncHiveData.status === 6) {
    //         this.dataHelper.setSyncHiveData(syncHiveData);
    //         this.dataHelper.saveData("feeds.initHive", "1");
    //         this.native.setRootRouter('/tabs/home');
    //       } else {
    //         let syncHiveData = { status: 0, describe: "GalleriahivePage.preparingData" }
    //         this.dataHelper.setSyncHiveData(syncHiveData);
    //         this.dataHelper.saveData("feeds.initHive", "1");
    //         this.events.publish(FeedsEvent.PublishType.initHiveData);
    //         this.native.setRootRouter('/tabs/home');
    //       }
    //     }
    //   });
  }

  async TryButton() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    await this.doSignin();

  }

  async doSignin() {
    try {
      this.feedService.signIn().then(isSuccess => {
        if (isSuccess) {
          this.authorizationStatus = 0;
          this.events.publish(FeedsEvent.PublishType.signinSuccess);
          return;
        } else {
        }
      }).catch((err) => {
        this.native.toastWarn(err);
      });
    } catch (error) {
    }
  }

}
