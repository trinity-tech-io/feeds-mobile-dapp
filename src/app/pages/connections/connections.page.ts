import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TwitterService } from 'src/app/services/TwitterService';
import { Events } from 'src/app/services/events.service';
import { Injectable } from '@angular/core';
import { DataHelper } from 'src/app/services/DataHelper';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.page.html',
  styleUrls: ['./connections.page.scss'],
})

@Injectable()
export class ConnectionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public hideConnectionMenuComponent: boolean = false;
  // public testToken: boolean = false;
  public twitterConnectStatus: number = 0;
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    public theme: ThemeService,
    private twitterService: TwitterService,
    private events: Events,
    private dataHelper: DataHelper,
    private zone: NgZone,

  ) {

    let that = this;
    this.events.subscribe(FeedsEvent.PublishType.twitterLoginSuccess, (obj) => {
      that.reloadStatus();
    });

    this.events.subscribe(FeedsEvent.PublishType.twitterLoginFailed, () => {

    });
  }

  async reloadStatus() {
    const userDid = (await this.dataHelper.getSigninData()).did
    let token = await this.twitterService.checkTwitterIsExpired()
    this.zone.run(() => {
      if (token != false && token != null) {
        this.hideConnectionMenuComponent = false
        this.twitterConnectStatus = 1
      }
      else {
        this.hideConnectionMenuComponent = false
        this.twitterConnectStatus = 0
      }
    });
  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle()
    this.reloadStatus()
  }
  ionViewWillLeave() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ConnectionsPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  addConnection() {
    this.hideConnectionMenuComponent = true;
  }

  hideConnectionMenu(data: any) {
    let typeButton: string = data.buttonType;
    switch (typeButton) {
      case "twitter":
        this.hideConnectionMenuComponent = false;

        this.twitterService.openTwitterLoginPage();
        break;
      case "cancel":
        this.hideConnectionMenuComponent = false;
        break;
    }
  }

}
