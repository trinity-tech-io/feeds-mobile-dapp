import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { PopupProvider } from '../../services/popup';
import { StorageService } from '../../services/StorageService';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { LanguageService } from 'src/app/services/language.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode: boolean = false;
  public popover: any = null;
  constructor(
    private languageService: LanguageService,
    private events: Events,
    private native: NativeService,
    private translate: TranslateService,
    public theme: ThemeService,
    public popupProvider: PopupProvider,
    public storageService: StorageService,
    private popoverController: PopoverController,
    private zone: NgZone,
    private titleBarService: TitleBarService,
    private ipfsService: IPFSService,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('app.settings'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  ionViewWillEnter() {
    //this.loadAssistShowName();
    this.initTitle();
  }

  ionViewDidEnter() { }

  ionViewWillLeave() {

    if (this.popover != null) {
      this.popoverController.dismiss();
    }
   let hideDeletedPosts =  this.dataHelper.getHideDeletedPosts();
   let originalHideDeletedPosts =  this.dataHelper.getOriginalHideDeletedPosts();


    if(originalHideDeletedPosts != hideDeletedPosts){
      this.events.publish(FeedsEvent.PublishType.hideDeletedPosts);
      this.dataHelper.setOriginalHideDeletedPosts(hideDeletedPosts);
    }

    let originalAdultStatus = this.dataHelper.getOriginalAdultStatus();
    let adultStatus = this.dataHelper.getAdultStatus();

    if (originalAdultStatus != adultStatus) {
      this.events.publish(FeedsEvent.PublishType.hideAdult);
      this.dataHelper.changeOriginalAdultStatus(adultStatus);
      return;
    }

    let originalPasarListGrid  = this.dataHelper.getOriginalPasarListGrid();
    let pasarListGrid = this.dataHelper.getPasarListGrid();
    if (originalPasarListGrid != pasarListGrid) {
      this.events.publish(FeedsEvent.PublishType.pasarListGrid);
      this.dataHelper.setOriginalPasarListGrid(pasarListGrid);
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

  cleanData() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'SearchPage.confirmTitle',
      'SettingsPage.des',
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

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }

    that.removeData();
  }

  removeData() {

    this.storageService
      .clearAll()
      .then(() => {
        localStorage.clear();
        this.titleBarService.hideRight(this.titleBar);
        this.native.setRootRouter('disclaimer');
        this.native.toast('SettingsPage.des1');
      })
      .catch(err => { });
  }

  navToSelectLanguage() {
    this.native.getNavCtrl().navigateForward(['/language']);
  }

  navElastosApiProvider() {
    this.native.getNavCtrl().navigateForward(['/elastosapiprovider']);
  }

  navDeveloper() {
    this.native.getNavCtrl().navigateForward(['/developer']);
  }

  navDataStorage() {
    this.native.getNavCtrl().navigateForward(['/datastorage']);
  }

  navMigrationData() {
    this.native.getNavCtrl().navigateForward(['/migrationdata']);
  }

  navAssistPasarProvider() {
    this.native.getNavCtrl().navigateForward(['/assistpasar']);
  }

  navAppPreferences() {
    this.native.navigateForward(['/apppreferences'],{});
  }

  navConnections() {
    this.native.navigateForward(['/connections'],{});
  }
}
