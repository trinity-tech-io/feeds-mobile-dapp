import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TwitterService } from 'src/app/services/TwitterService';
import { Events } from 'src/app/services/events.service';
import { Injectable } from '@angular/core';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.page.html',
  styleUrls: ['./connections.page.scss'],
})

@Injectable()
export class ConnectionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public hideConnectionMenuComponent: boolean = false;
  public twitterConnectStatus:number = 0;
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    public theme: ThemeService,
    private twitterService: TwitterService,
    private events: Events,

  ) {

    this.events.subscribe(FeedsEvent.PublishType.signinSuccess, async (obj) => {
    });

    this.events.subscribe(FeedsEvent.PublishType.twitterLoginSuccess, (obj) => {
      this.reloadStatus();
    });

    this.events.subscribe(FeedsEvent.PublishType.twitterLoginFailed, () => {

    });
  }

  reloadStatus() {
    this.twitterConnectStatus = 1;
  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle();
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
       // this.hideConnectionMenuComponent = false;
       this.twitterService.openTwitterLoginPage();
      break;
    case "cancel":
      this.hideConnectionMenuComponent = false;
      break;
   }
  }

}
