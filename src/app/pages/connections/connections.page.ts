import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
@Component({
  selector: 'app-connections',
  templateUrl: './connections.page.html',
  styleUrls: ['./connections.page.scss'],
})
export class ConnectionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public hideConnectionMenuComponent: boolean = false;
  public twitterConnectStatus:number = 0;
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    public theme: ThemeService
  ) { }

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
      this.twitterConnectStatus = 1;
      this.hideConnectionMenuComponent = false;
      break;
    case "cancel":
      this.hideConnectionMenuComponent = false;
      break;
   }
  }

}
