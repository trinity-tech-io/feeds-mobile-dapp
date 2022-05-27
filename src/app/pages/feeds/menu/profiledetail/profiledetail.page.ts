import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ActionSheetController } from '@ionic/angular';
import { FeedService, Avatar } from '../../../../services/FeedService';
import { NativeService } from '../../../../services/NativeService';
import { ThemeService } from '../../../../services/theme.service';
import { CarrierService } from '../../../../services/CarrierService';
import { AppService } from '../../../../services/AppService';
import { StorageService } from '../../../../services/StorageService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { PopoverController } from '@ionic/angular';
import { IntentService } from 'src/app/services/IntentService';
import { IPFSService } from 'src/app/services/ipfs.service';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';

type ProfileDetail = {
  type: string;
  details: string;
};

@Component({
  selector: 'app-profiledetail',
  templateUrl: './profiledetail.page.html',
  styleUrls: ['./profiledetail.page.scss'],
})
export class ProfiledetailPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public developerMode: boolean = false;
  public avatar: string = '';
  public name = '';
  public description = '';
  public did = '';
  public gender = '';
  public telephone = '';
  public email = '';
  public location = '';
  public profileDetails: ProfileDetail[] = [];

  public isShowPublisherAccount: boolean = false;
  public isShowQrcode: boolean = true;
  public serverStatus: number = 1;
  public clientNumber: number = 0;
  public serverDetails: any[] = [];
  public isPress: boolean = false;
  public didString: string = '';
  public serverName: string = '';
  public owner: string = '';
  public introduction: string = null;
  public feedsUrl: string = null;
  public elaAddress: string = '';
  public actionSheet: any = null;
  public walletAddress: string = null;
  public lightThemeType: number = 3;
  constructor(
    private actionSheetController: ActionSheetController,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService,
    private translate: TranslateService,
    public theme: ThemeService,
    private events: Events,
    private carrierService: CarrierService,
    private appService: AppService,
    private platform: Platform,
    private storageService: StorageService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private nftContractControllerService: NFTContractControllerService,
    private popoverController: PopoverController,
    private intentService: IntentService,
    private ipfsService: IPFSService,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() { }

  collectData() {
    this.profileDetails = [];
    this.profileDetails.push({
      type: 'ProfiledetailPage.name',
      details: this.name,
    });

    this.profileDetails.push({
      type: 'ProfiledetailPage.did',
      details: this.did,
    });

    if (this.developerMode) {
      let carrierUserId = this.carrierService.getNodeId();
      this.profileDetails.push({
        type: 'NodeId',
        details: carrierUserId,
      });
    }

    if (
      this.telephone != '还未设置' &&
      this.telephone != 'Not set yet' &&
      this.telephone != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.telephone',
        details: this.telephone,
      });
    }

    if (
      this.email != '还未设置' &&
      this.email != 'Not set yet' &&
      this.email != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.email',
        details: this.email,
      });
    }

    if (
      this.location != '还未设置' &&
      this.location != 'Not set yet' &&
      this.location != ''
    ) {
      this.profileDetails.push({
        type: 'ProfiledetailPage.location',
        details: this.location,
      });
    }
  }

  async ionViewWillEnter() {
    this.theme.setTheme1();
    this.walletAddress =
      this.nftContractControllerService.getAccountAddress() || '';
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();

    let signInData = await this.dataHelper.getSigninData();
    this.name = signInData['nickname'] || signInData['name'] || '';
    this.description = signInData['description'] || '';
    this.did = this.feedService.rmDIDPrefix(signInData['did'] || '');
    this.telephone = signInData['telephone'] || '';
    this.email = signInData['email'] || '';
    this.location = signInData['location'] || '';
    this.avatar = await this.feedService.getUserAvatar(this.did);
    this.handleImages()
    this.collectData();
  }

  ionViewDidEnter() { }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfiledetailPage.profileDetails'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  ionViewWillUnload() { }

  ionViewWillLeave() {
    this.native.handleTabsEvents();
    this.theme.restTheme();
  }

  handleImages() {
    let imgUri = "";
    if (this.avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = this.avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('feeds:image:') > -1) {
      imgUri = this.avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (this.avatar.indexOf('pasar:image:') > -1) {
      imgUri = this.avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else {
      imgUri = this.avatar;
    }
    return imgUri;
  }

  copytext(text: any) {
    let textdata = text || '';
    if (textdata != '') {
      this.native
        .copyClipboard(text)
        .then(() => {
          this.native.toast_trans('common.textcopied');
        })
        .catch(() => { });
    }
  }


  menuMore(feedsUrl: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    //@Deprecated
    this.intentService.share('', feedsUrl);
  }

  editProfile() {
    this.native.navigateForward(['editprofileimage'], {});
  }

}
