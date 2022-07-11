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
  public twitterConnectStatus:number = 0;
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    public theme: ThemeService,
    private twitterService: TwitterService,
    private events: Events,
    private dataHelper: DataHelper,
    private zone: NgZone,

  ) {

    this.events.subscribe(FeedsEvent.PublishType.signinSuccess, async (obj) => {
    });

    let that = this;
    this.events.subscribe(FeedsEvent.PublishType.twitterLoginSuccess, (obj) => {
      console.log("twitterLoginSuccess >>>>>>>>>>> ")
      that.reloadStatus();
    });

    this.events.subscribe(FeedsEvent.PublishType.twitterLoginFailed, () => {

    });
  }

  async reloadStatus() {
    console.log("reloadStatus >>>>>>>>>>>>>>>>>>>>> ")
    const userDid = (await this.dataHelper.getSigninData()).did
    let token = this.dataHelper.getTwitterAccessToken(userDid)
    console.log("reloadStatus token >>>>>>>>>>>>>>>>>>>>> ", token)
    this.zone.run(() => {
      if (token != false && token != null) {
        console.log("reloadStatus  1 >>>>>>>>>>>>>>>>>>>>> ")
        this.hideConnectionMenuComponent = false
        this.twitterConnectStatus = 1
      }
      else {
        console.log("reloadStatus  2 >>>>>>>>>>>>>>>>>>>>> ")
        this.hideConnectionMenuComponent = false
        this.twitterConnectStatus = 0
      }
    });
  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle()
    let that = this;
    this.twitterService.checkTwitterIsExpired().then(async (data) => {
      console.log("ionViewWillEnter >>>>>>>>>>>>>>>>>> ")
      that.reloadStatus()
    }).catch(() => {

    })
  }
  ionViewWillLeave() {
    console.log("ionViewWillLeave  Leave >>>>>>>>>>>>>>>>>> ")
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

  hideConnectionMenu(data: any){
   let typeButton: string = data.buttonType;
   switch(typeButton){
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
