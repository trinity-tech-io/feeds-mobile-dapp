import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';

@Component({
  selector: 'app-apppreferences',
  templateUrl: './apppreferences.page.html',
  styleUrls: ['./apppreferences.page.scss'],
})
export class ApppreferencesPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public pasarListGrid: boolean = false;
  public isShowAdult: boolean = true;
  public hideDeletedPosts: boolean = false;
  public hideDeletedComments: boolean = false;
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private zone: NgZone,
    private dataHelper: DataHelper,
    public theme: ThemeService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.pasarListGrid = this.dataHelper.getPasarListGrid();
    this.dataHelper.setOriginalPasarListGrid(this.pasarListGrid);
    this.isShowAdult = this.dataHelper.getAdultStatus();
    this.dataHelper.changeOriginalAdultStatus(this.isShowAdult);
    this.hideDeletedPosts = this.dataHelper.getHideDeletedPostsStatus();
    this.dataHelper.setOriginalHideDeletedPosts(this.hideDeletedPosts);
    this.hideDeletedComments = this.dataHelper.getHideDeletedComments();
  }

  ionViewWillLeave() {

  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ApppreferencesPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  setDarkMode() {
    // this.zone.run(() => {
    //   this.theme.darkMode = !this.theme.darkMode;
    //   this.theme.setTheme(this.theme.darkMode);
    // });
  }

  setPasarListGrid() {
    this.zone.run(() => {
      this.pasarListGrid = !this.pasarListGrid;
    });
    this.dataHelper.setPasarListGrid(this.pasarListGrid);
    this.dataHelper.saveData('feeds.pasarListGrid', this.pasarListGrid);
  }

  toggleHideAdult() {
    this.zone.run(() => {
      this.isShowAdult = !this.isShowAdult;
    });
    this.dataHelper.changeAdultStatus(this.isShowAdult);
    this.dataHelper.saveData('feeds.hideAdult', this.isShowAdult);
  }

  toggleHideDeletedPosts() {

    this.zone.run(() => {
      this.hideDeletedPosts = !this.hideDeletedPosts;
    });
    this.dataHelper.setHideDeletedPostStatus(this.hideDeletedPosts);
    this.dataHelper.saveData('feeds.hideDeletedPosts', this.hideDeletedPosts);
  }

  toggleHideDeletedComments() {
    this.zone.run(() => {
      this.hideDeletedComments = !this.hideDeletedComments;
    });
    this.dataHelper.setHideDeletedComments(this.hideDeletedComments);
    this.dataHelper.saveData(
      'feeds.hideDeletedComments',
      this.hideDeletedComments,
    );
  }

}
