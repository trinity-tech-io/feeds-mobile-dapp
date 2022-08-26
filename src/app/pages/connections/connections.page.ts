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
  ) {
    this.addEvents();
  }

  async reloadStatus() {
    let token = await this.twitterService.checkTwitterIsExpired()
    this.zone.run(() => {
      if (token != false && token != null) {
        this.hideConnectionMenuComponent = false;
        this.twitterConnectStatus = 1;
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
    this.initTitle();
    this.reloadStatus();
  }

  addEvents() {

    this.events.subscribe(FeedsEvent.PublishType.twitterLoginSuccess, (obj) => {
      this.reloadStatus();
    });

   this.events.subscribe(FeedsEvent.PublishType.twitterLoginFailed, () => {

   });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.twitterLoginSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.twitterLoginFailed);
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
        console.log("=====reddit====");
        this.redditConnectStatus = 1;
        this.hideConnectionMenuComponent = false;

        break;
      case 'disconnectReddit':
        this.redditConnectStatus = 0;
        this.hideConnectionMenuComponent = false;
        console.log("=====disconnectReddit====");
        break;
      case "cancel":
        this.hideConnectionMenuComponent = false;
        break;
    }
  }

}
