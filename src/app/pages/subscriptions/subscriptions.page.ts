import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { IntentService } from 'src/app/services/IntentService';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import _ from 'lodash';
import { Config } from 'src/app/services/config';
import { ThemeService } from 'src/app/services/theme.service';
import { Logger } from 'src/app/services/logger';
import { PopupProvider } from 'src/app/services/popup';
import { ScannerCode, ScannerHelper } from 'src/app/services/scanner_helper.service';
import { IonRefresher } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
const TAG: string = 'SubscriptionsPage';
@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
})
export class SubscriptionsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonRefresher, { static: true }) ionRefresher: IonRefresher;
  public followingList: any = [];
  public isShowUnfollow: boolean = false;
  public isShowQrcode: boolean = false;
  public isShowTitle: boolean = false;
  public isShowInfo: boolean = false;
  public isPreferences: boolean = false;
  public shareDestDid: string = '';
  public shareChannelId: string = '';
  public curItem: any = {};
  public qrCodeString: string = null;
  public channelName: string = null;
  public hideSharMenuComponent: boolean = false;
  private followingIsLoadimage: any = {};
  private followingAvatarImageMap: any = {};
  private downFollowingAvatarMap: any = {};
  public isSearch: string = '';
  public scanServiceStyle = { right: '' };
  public subscriptionV3NumMap: any = {};
  public followAvatarMap: any = {};
  private searchFollowingList: any = [];
  constructor(
    private titleBarService: TitleBarService,
    private translate: TranslateService,
    private events: Events,
    private feedService: FeedService,
    private zone: NgZone,
    private native: NativeService,
    private intentService: IntentService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private popupProvider: PopupProvider,
    private keyboard: Keyboard,
    public theme: ThemeService
  ) { }

  ngOnInit() {
    this.scanServiceStyle['right'] = (screen.width * 7.5) / 100 + 5 + 'px';
  }

  ionViewWillEnter() {
    this.initTitle();
    this.addEvents();
    this.initFollowing();
  }

  addEvents() {

  }

  removeEvents() {
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('ProfilePage.following'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  ionViewWillLeave() {
    this.followingIsLoadimage = {};
    this.followingAvatarImageMap = {};
    this.downFollowingAvatarMap = {};
    this.hideSharMenuComponent = false;
    this.removeEvents();
    this.native.handleTabsEvents();
  }

  async showMenuMore(item: any) {
    this.curItem = item;
    this.isShowTitle = true;
    let ownerDid = (await this.dataHelper.getSigninData()).did;
    if (ownerDid === item.destDid) {
      this.isShowInfo = true;
    } else {
      this.isShowInfo = false;
    }
    this.isShowQrcode = true;
    this.isPreferences = false;
    this.isShowUnfollow = true;
    this.channelName = item.channelName;
    this.qrCodeString = await this.getQrCodeString(item);
    this.hideSharMenuComponent = true;
  }

  async toPage(eventParm: any) {
    let destDid = eventParm['destDid'];
    let channelId = eventParm['channelId'];
    let page = eventParm['page'];

    try {
      await this.native.showLoading('common.waitMoment');
      this.native.hideLoading();
      this.native.getNavCtrl().navigateForward([page, destDid, channelId]);
    } catch (error) {
      this.native.hideLoading();
    }
  }


  async initFollowing() {
    let subscribedChannel = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.OTHER_CHANNEL);
    this.followingList = await this.getFollowedChannelList(subscribedChannel);
    this.searchFollowingList = _.cloneDeep(this.followingList);
    this.refreshFollowingVisibleareaImage();
  }

  async getFollowedChannelList(subscribedChannel: FeedsData.SubscribedChannelV3[]) {
    let list = [];
    for (let item of subscribedChannel) {
      let destDid = item.destDid;
      let channelId = item.channelId;
      let channel: any = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
      if (channel != null) {
        list.push(channel);
      }
    }

    list = _.sortBy(list, (item: any) => {
      return -item.createdAt;
    });
    return list;
  }

  async doRefresh(event: any) {
    try {
      let subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
      for (let index = 0; index < subscribedChannels.length; index++) {
        const subscribedChannel = subscribedChannels[index];
        await this.hiveVaultController.querySubscriptionChannelById(subscribedChannel.destDid, subscribedChannel.channelId);
      }
      await this.hiveVaultController.syncSubscribedChannelFromBackup();
      await this.hiveVaultController.syncAllChannelInfo();
      this.initFollowing();
      event.target.complete();
    } catch (err) {
      event.target.complete();
    }
  }

  async getQrCodeString(channel: any) {
    let destDid = channel['destDid'];
    this.shareDestDid = destDid;
    let channelId = channel['channelId'] || '';
    this.shareChannelId = channelId;
    let name = channel['channelName'] || '';
    let ownerDid = (await this.dataHelper.getSigninData()).did;
    return "feeds://v3/" + destDid + "/" + channelId + '/' + encodeURIComponent(name);
  }

  async hideShareMenu(objParm: any) {
    let buttonType = objParm['buttonType'];
    let destDid = objParm['destDid'];
    let channelId = objParm['channelId'];
    switch (buttonType) {
      case 'unfollow':
        let connect = this.dataHelper.getNetworkStatus();
        if (connect === FeedsData.ConnState.disconnected) {
          this.native.toastWarn('common.connectionError');
          return;
        }

        await this.native.showLoading("common.waitMoment");
        try {
          this.hiveVaultController.unSubscribeChannel(
            destDid, channelId
          ).then(async (result) => {

            let newfollowingList = _.filter(this.followingList, (item) => {
              return item.destDid != destDid && item.channelId != channelId;
            });
            this.followingList = _.cloneDeep(newfollowingList);
            this.searchFollowingList = _.cloneDeep(newfollowingList);
            this.native.hideLoading();
          }).catch(() => {
            this.native.hideLoading();
          });
        } catch (err) {
          this.native.hideLoading();
        }

        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
      case 'share':
        let content = this.getQrCodeString(this.curItem);
        this.hideSharMenuComponent = false;
        //share channel
        await this.native.showLoading("common.generateSharingLink");
        try {
          let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
          const sharedLink = await this.intentService.createChannelShareLink(channel);
          this.intentService.share(this.intentService.createShareChannelTitle(destDid, channelId, channel), sharedLink);
        } catch (error) {
        }
        this.native.hideLoading();
        break;
      case 'info':
        this.clickAvatar(destDid, channelId);
        break;
      case 'preferences':
        let connectStatus = this.dataHelper.getNetworkStatus();
        if (connectStatus === FeedsData.ConnState.disconnected) {
          this.native.toastWarn('common.connectionError');
          return;
        }

        this.native.navigateForward(['feedspreferences'], {
          queryParams: {
            nodeId: this.shareDestDid,
            feedId: this.shareChannelId,
          },
        });
        this.hideSharMenuComponent = false;
        break;
      case 'cancel':
        this.qrCodeString = null;
        this.hideSharMenuComponent = false;
        break;
    }
    let sharemenu: HTMLElement = document.querySelector("app-sharemenu") || null;
    if (sharemenu != null) {
      sharemenu.remove();
    }
  }

  async clickAvatar(destDid: string, channelId: string) {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId);
    let followStatus = this.checkFollowStatus(destDid, channelId);
    let channelName = channel.name;
    let channelDesc = channel.intro;
    let channelSubscribes = 0;
    let feedAvatar = this.feedService.parseChannelAvatar(channel.avatar);
    if (feedAvatar.indexOf('data:image') > -1 ||
      feedAvatar.startsWith("https:")) {
      this.dataHelper.setSelsectIndex(0);
      this.dataHelper.setProfileIamge(feedAvatar);
    } else if (feedAvatar.indexOf('assets/images') > -1) {
      let index = feedAvatar.substring(
        feedAvatar.length - 5,
        feedAvatar.length - 4,
      );
      this.dataHelper.setSelsectIndex(index);
      this.dataHelper.setProfileIamge(feedAvatar);
    }
    let ownerDid: string = (await this.dataHelper.getSigninData()).did;
    this.dataHelper.setChannelInfo({
      destDid: destDid,
      channelId: channelId,
      name: channelName,
      des: channelDesc,
      followStatus: followStatus,
      channelSubscribes: channelSubscribes,
      updatedTime: channel.updatedAt,
      channelOwner: channel.destDid,
      ownerDid: ownerDid,
      tippingAddress: channel.tipping_address
    });
    this.native.navigateForward(['/feedinfo'], '');
  }

  async checkFollowStatus(destDid: string, channelId: string) {
    let subscribedChannel: FeedsData.SubscribedChannelV3[] = await this.dataHelper.getSubscribedChannelV3List(FeedsData.SubscribedChannelType.ALL_CHANNEL);
    if (subscribedChannel.length === 0) {
      return false;
    }

    let channelIndex = _.find(subscribedChannel, (item: FeedsData.SubscribedChannelV3) => {
      return item.destDid === destDid && item.channelId === channelId;
    }) || '';
    if (channelIndex === '') {
      return false;
    }
    return true;
  }

  ionScroll() {
    this.native.throttle(this.setFollowingVisibleareaImage(), 200, this, true);
  }

  async setFollowingVisibleareaImage() {
    let ionRowFollowing = document.getElementsByClassName("ionRowFollowing") || null;
    let len = ionRowFollowing.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = ionRowFollowing[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let followingAvatarKuang = document.getElementById(id + "-followingAvatarKuang");
      let isload = this.followingIsLoadimage[id] || '';
      try {
        if (
          id != '' &&
          followingAvatarKuang.getBoundingClientRect().top >= - Config.rectTop &&
          followingAvatarKuang.getBoundingClientRect().bottom <= Config.rectBottom
        ) {
          if (isload === "") {
            let arr = id.split("-");
            this.followingIsLoadimage[id] = '11';
            let destDid = arr[0];
            let channelId = arr[1];
            let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
            let avatarUri = "";
            if (channel != null) {
              avatarUri = channel.avatar;
              //关注数
              let follower = this.subscriptionV3NumMap[channelId] || '';
              if (follower === "") {
                try {
                  this.subscriptionV3NumMap[channelId] = "...";
                  this.dataHelper.getSubscriptionV3NumByChannelId(
                    channel.destDid, channel.channelId).
                    then((result) => {
                      result = result || 0;
                      this.subscriptionV3NumMap[channelId] = result;

                    }).catch(() => {
                      this.subscriptionV3NumMap[channelId] = 0;

                    });
                } catch (error) {
                }
              }
            }
            let fileName: string = avatarUri.split("@")[0];
            this.followingAvatarImageMap[id] = avatarUri;//存储相同头像的channel的Map
            let isDown = this.downFollowingAvatarMap[fileName] || "";
            if (isDown != '') {
              continue;
            }
            this.downFollowingAvatarMap[fileName] = fileName;
            this.hiveVaultController.getV3Data(destDid, avatarUri, fileName, "0").then((data) => {
              this.zone.run(() => {
                this.downFollowingAvatarMap[fileName] = '';
                let srcData = data || "";
                if (srcData != "") {
                  for (let key in this.followingAvatarImageMap) {
                    let uri = this.followingAvatarImageMap[key] || "";
                    if (uri === avatarUri && this.followingIsLoadimage[key] === '11') {
                      this.followingIsLoadimage[key] = '13';
                      this.followAvatarMap[key] = srcData;
                      delete this.followingAvatarImageMap[key];
                    }
                  }
                } else {
                  for (let key in this.followingAvatarImageMap) {
                    let uri = this.followingAvatarImageMap[key] || "";
                    if (uri === avatarUri && this.followingIsLoadimage[key] === '11') {
                      this.followingIsLoadimage[key] = '13';
                      delete this.followingAvatarImageMap[key];
                    }
                  }
                }
              });
            }).catch((err) => {
              this.downFollowingAvatarMap[fileName] = '';
              for (let key in this.followingAvatarImageMap) {
                let uri = this.followingAvatarImageMap[key] || "";
                if (uri === avatarUri && this.followingIsLoadimage[key] === '11') {
                  this.followingIsLoadimage[key] = '13';
                  delete this.followingAvatarImageMap[key];
                }
              }
            });
          }
        } else {
          let srcStr = this.followAvatarMap[id] || "./assets/icon/reserve.svg";
          if (
            followingAvatarKuang.getBoundingClientRect().top < - Config.rectTop ||
            followingAvatarKuang.getBoundingClientRect().bottom > Config.rectBottom &&
            this.followingIsLoadimage[id] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.followAvatarMap[id] = null;
            this.followingIsLoadimage[id] = '';
            delete this.followingAvatarImageMap[id];
          }
        }
      } catch (error) {
        this.followingIsLoadimage[id] = '';
        delete this.followingAvatarImageMap[id];
      }

    }
  }

  refreshFollowingVisibleareaImage() {
    let sid = setTimeout(() => {
      this.followingIsLoadimage = {};
      this.followingAvatarImageMap = {};
      this.downFollowingAvatarMap = {};
      this.setFollowingVisibleareaImage();
      clearTimeout(sid);
    }, 100);

  }

  async scanService() {
    let scanObj = await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
    let scannedContent = scanData["scannedText"] || "";
    if (scannedContent === "") {
      return;
    }
    Logger.log(TAG, 'Scan content is', scannedContent);
    const scanResult = ScannerHelper.parseScannerResult(scannedContent);
    Logger.log(TAG, 'Parse scan result is', scanResult);

    if (!scanResult || !scanResult.feedsUrl || scanResult.code == ScannerCode.INVALID_FORMAT) {
      this.native.toastWarn('AddServerPage.tipMsg');
      return;
    }
    const feedsUrl = scanResult.feedsUrl;
    try {
      await this.native.showLoading("common.waitMoment");
      try {
        await this.hiveVaultController.getChannelInfoById(feedsUrl.destDid, feedsUrl.channelId);
      } catch (error) {
      }

      try {
        this.hiveVaultController.checkSubscriptionStatusFromRemote(feedsUrl.destDid, feedsUrl.channelId);
      } catch (error) {
      }

      this.native.hideLoading();
      this.native.navigateForward(['/channels', feedsUrl.destDid, feedsUrl.channelId], '');
    } catch (error) {
      this.native.hideLoading();
      this.native.toast("common.subscribeFail");
    }

  }

  ionClear() {
    this.isSearch = '';
    if (this.isSearch == '') {
      this.ionRefresher.disabled = false;
      this.followingList = _.cloneDeep(this.searchFollowingList);
      return;
    }
    this.ionRefresher.disabled = true;
    this.handleSearch();
  }

  getItems(events: any) {
    this.isSearch = events.target.value || '';
    if (
      (events && events.keyCode === 13) ||
      (events.keyCode === 8 && this.isSearch === '')
    ) {
      this.keyboard.hide();
      if (this.isSearch == '') {
        this.ionRefresher.disabled = false;
        this.followingList = _.cloneDeep(this.searchFollowingList);
        return;
      }
      this.ionRefresher.disabled = true;
      this.handleSearch();
    }
  }

  exploreFeeds() {
    this.feedService.setCurTab("search");
    this.native.setRootRouter(['/tabs/search']);
  }

  handleSearch() {
    if (this.isSearch === '') {
      return;
    }

    this.followingList = _.filter(this.searchFollowingList, (item) => {
      return item.name.toLowerCase().indexOf(this.isSearch.toLowerCase()) > -1
    });
  }

}
