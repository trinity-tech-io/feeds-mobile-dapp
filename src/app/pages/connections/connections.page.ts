import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TwitterService } from 'src/app/services/TwitterService';
import { Events } from 'src/app/services/events.service';
import { Injectable } from '@angular/core';
import { DataHelper } from 'src/app/services/DataHelper';
import { Platform } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
import { TwitterApi } from 'src/app/services/TwitterApi';
import { RedditApi } from 'src/app/services/RedditApi';
import { RedditService } from 'src/app/services/RedditService';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.page.html',
  styleUrls: ['./connections.page.scss'],
})

@Injectable()
export class ConnectionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public hideConnectionMenuComponent: boolean = false;
  // twitter
  public twitterConnectStatus: number = 0;
  public connectTwitter: boolean = false;//menu 是否显示twitter 按钮
  public disconnectTwitter: boolean = false;
  // reddit
  public redditConnectStatus: number = 0;
  public disconnectReddit:boolean = false;
  public connectReddit: boolean = false;
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    public theme: ThemeService,
    private twitterService: TwitterService,
    private events: Events,
    private dataHelper: DataHelper,
    private zone: NgZone,
    private native: NativeService,
    private platform: Platform,
    private redditService: RedditService,
  ) {
    this.addEvents();
  }

  async reloadStatus() {
    let twitterToken = await this.twitterService.checkTwitterIsExpired()
    let redditToken = await this.redditService.checkRedditIsExpired()

    this.zone.run(() => {
      if (twitterToken != false && twitterToken != null) {
        this.hideConnectionMenuComponent = false;
        this.twitterConnectStatus = 1;
      }
      else {
        this.hideConnectionMenuComponent = false
        this.twitterConnectStatus = 0
      }

      if (redditToken != false && redditToken != null) {
        this.hideConnectionMenuComponent = false;
        this.redditConnectStatus = 1;
      }
      else {
        this.hideConnectionMenuComponent = false
        this.redditConnectStatus = 0
      }
    });
  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle();
    this.reloadStatus();
  }

  addEvents() {

    this.events.subscribe(FeedsEvent.PublishType.twitterLoginSuccess, (obj) => {
      this.reloadStatus();
    });

   this.events.subscribe(FeedsEvent.PublishType.twitterLoginFailed, () => {

   });

    this.events.subscribe(FeedsEvent.PublishType.RedditLoginSuccess, (obj) => {
      this.reloadStatus();
    });
    this.events.subscribe(FeedsEvent.PublishType.RedditLoginFailed, () => {

  });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.twitterLoginSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.twitterLoginFailed);

    this.events.unsubscribe(FeedsEvent.PublishType.RedditLoginSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.RedditLoginFailed);
  }

  ionViewDidLeave() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ConnectionsPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  addConnection() {

    if(this.twitterConnectStatus === 0){
      this.connectTwitter = true;
      this.disconnectTwitter = false;
      this.disconnectReddit = false;
    }else{
      this.connectTwitter = false;
    }

    if(this.redditConnectStatus === 0){
       this.connectReddit = true;
       this.disconnectTwitter = false;
       this.disconnectReddit = false;
    }else{
      this.connectReddit = false;
    }

    this.hideConnectionMenuComponent = true;
  }

  removeConnection(connectType:string) {
    switch(connectType){
      case 'twitter':
      this.hideConnectionMenuComponent = true;
      this.connectTwitter = false;
      this.connectReddit = false;
      this.disconnectReddit = false;
      this.disconnectTwitter = true;
      break;
      case 'reddit':
        this.hideConnectionMenuComponent = true;
        this.connectTwitter = false;
        this.connectReddit = false;
        this.disconnectTwitter = false;
        this.disconnectReddit = true;
        break;
    }

  }

  async hideConnectionMenu(data: any) {
    let typeButton: string = data.buttonType;
    switch (typeButton) {
      case "twitter":
        this.hideConnectionMenuComponent = false;
        if (this.platform.is("ios")) {
          this.twitterService.openTwitterLoginPage("ios");
        }
        else {
          this.twitterService.openTwitterLoginPage("android");
        }
        break;
      case "disconnectTwittet":
        await this.native.showLoading("common.waitMoment");
        let signinData = await this.dataHelper.getSigninData() || null
        if (signinData == null || signinData == undefined) {
           this.native.hideLoading();
           this.hideConnectionMenuComponent = false;
          return null
        }
        const userDid = signinData.did || ''
        if(userDid === ''){
          this.native.hideLoading();
          this.hideConnectionMenuComponent = false;
          return null
        }
        const key = userDid + TwitterApi.CLIENT_ID + "TWITTERTOKEN"
        try {
          localStorage.removeItem(key);
          this.twitterConnectStatus = 0;
          this.native.hideLoading();
          this.hideConnectionMenuComponent = false;
        } catch (error) {
          this.native.hideLoading();
        }
        break;
      case 'reddit':
        this.hideConnectionMenuComponent = false;
        if (this.platform.is("ios")) {
          await this.redditService.openRedditLoginPage("ios");
        }
        else {
          await this.redditService.openRedditLoginPage("android");
        }
        break;
      case 'disconnectReddit':
        await this.native.showLoading("common.waitMoment");
        const userData = await this.dataHelper.getSigninData() || null
        if (userData == null || userData == undefined) {
          this.native.hideLoading();
          this.hideConnectionMenuComponent = false;
          return null
        }
        const userDID = userData.did || ''

        if (userDID === '') {
          this.native.hideLoading();
          this.hideConnectionMenuComponent = false;
          return null
        }
        try {
          this.dataHelper.removeRedditToken(userDID)
          this.reloadStatus()
          this.native.hideLoading();
        } catch (error) {
          this.native.hideLoading();
        }
        break;
      case "cancel":
        this.hideConnectionMenuComponent = false;
        break;
    }
  }

}
