import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Config } from 'src/app/services/config';
import { PopupProvider } from 'src/app/services/popup';
import { GlobalService } from 'src/app/services/global.service';
import { ApiUrl } from 'src/app/services/ApiUrl';

@Component({
  selector: 'app-elastosapiprovider',
  templateUrl: './elastosapiprovider.page.html',
  styleUrls: ['./elastosapiprovider.page.scss'],
})
export class ElastosapiproviderPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public popover: any = null;
  public curApiProviderName = 'elastos.io';
  public apiProviders: any = [
    {
      key: 'elastosio',
      name: Config.ELASTOS_API,
      description: this.translate.instant('SettingsPage.elastos-io-des'),
    },
    {
      key: 'ttechcn',
      name: Config.TRINITY_API,
      description: this.translate.instant('SettingsPage.trinity-tech-cn-des'),
    },
  ];

  public availableIpfsNetworkTemplates: any = [
    {
      key: 'https://ipfs0.trinity-feeds.app/',
      name: 'ipfs0.trinity-feeds.app',
      description:'SettingsPage.ipfs0-provider-des',
    },
    {
      key: 'https://ipfs1.trinity-feeds.app/',
      name: 'ipfs1.trinity-feeds.app',
      description:'SettingsPage.ipfs1-provider-des',
    },
    {
      key: 'https://ipfs2.trinity-feeds.app/',
      name: 'ipfs2.trinity-feeds.app',
      description:'SettingsPage.ipfs2-provider-des',
    }
  ];

  public selectedIpfsNetwork: string = '';

  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    public theme: ThemeService,
    private feedsService: FeedService,
    private dataHelper: DataHelper,
    public popupProvider: PopupProvider,
    private globalService: GlobalService
  ) {}

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.curApiProviderName = this.dataHelper.getApiProvider();
    this.selectedIpfsNetwork = localStorage.getItem("selectedIpfsNetwork");
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('SettingsPage.elastosapiprovider'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  useProvider(provider: any) {
    if (this.curApiProviderName != provider.name) {
      this.curApiProviderName = provider.name;
      this.dataHelper.setApiProvider(this.curApiProviderName);
      Config.changeApi(this.curApiProviderName);
      this.feedsService.setEidURL(Config.EID_RPC);

      this.globalService.changeNet(this.dataHelper.getDevelopNet());
      this.openAlert();
    }
  }

  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      'common.restartApp',
      'common.restartAppDescForProvider',
      this.confirm,
      'tskth.svg',
      'common.ok',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.feedsService.resetConnectionStatus();
      that.feedsService.destroyCarrier();
      that.globalService.restartApp();
    }
  }

  selectIpfs(selectedIpfsNetwork: any) {
    this.selectedIpfsNetwork = selectedIpfsNetwork.key;
    localStorage.setItem("selectedIpfsNetwork",this.selectedIpfsNetwork);
    ApiUrl.setIpfs(selectedIpfsNetwork.key)
    this.globalService.refreshBaseNFTIPSFUrl();
  }
}
