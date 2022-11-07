import { Component } from '@angular/core';
import { Platform, PopoverController, MenuController, ModalController, ActionSheetController } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { FeedService, Avatar } from './services/FeedService';
import { AppService } from './services/AppService';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { UtilService } from 'src/app/services/utilService';
import { StorageService } from './services/StorageService';
import { PopupProvider } from 'src/app/services/popup';
import { Events } from 'src/app/services/events.service';
import { LocalIdentityConnector, persistenceService } from '@elastosfoundation/elastos-connector-localidentity-cordova';
import { EssentialsConnector } from '@elastosfoundation/essentials-connector-cordova';
import { connectivity } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { GlobalService } from 'src/app/services/global.service';
import { Config } from './services/config';
import { Logger, LogLevel } from './services/logger';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IntentService } from './services/IntentService';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from './services/ApiUrl';
import { IPFSService } from 'src/app/services/ipfs.service';
import { ViewHelper } from './services/viewhelper.service';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
// import { FeedsSqliteHelper } from 'src/app/services/sqlite_helper.service';
import { TwitterService } from 'src/app/services/TwitterService';
import { MorenameComponent } from './components/morename/morename.component';

let TAG: string = 'app-component';
@Component({
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: ['app.scss'],
})
export class MyApp {
  private backButtoncount: number = 0;
  public name: string = '';
  public avatar: string = '';
  public wName: string = '';
  public popover: any = null;
  public sService: any = null;
  public userDid: string = '';
  private localIdentityConnector = new LocalIdentityConnector();
  private essentialsConnector = new EssentialsConnector();
  public walletAddress: string = '';
  public walletAddressStr: string = '';

  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = null;
  public loadingCurNumber: string = null;
  public loadingMaxNumber: string = null;
  public userDidDisplay: string = '';
  private isReady: boolean = false;
  private receivedIntentList: IntentPlugin.ReceivedIntent[] = [];
  constructor(
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private events: Events,
    private platform: Platform,
    private statusBar: StatusBar,
    private feedService: FeedService,
    private appService: AppService,
    public theme: ThemeService,
    public native: NativeService,
    public storageService: StorageService,
    public popupProvider: PopupProvider,
    private popoverController: PopoverController,
    private menuController: MenuController,
    private walletConnectControllerService: WalletConnectControllerService,
    private dataHelper: DataHelper,
    private globalService: GlobalService,
    private nftContractControllerService: NFTContractControllerService,
    private intentService: IntentService,
    private httpService: HttpService,
    private ipfsService: IPFSService,
    private viewHelper: ViewHelper,
    private keyboard: Keyboard,
    private hiveVaultController: HiveVaultController,
    private twitterService: TwitterService,
  ) {
    this.initializeApp();
    this.initProfileData();

    this.events.subscribe(FeedsEvent.PublishType.openRightMenuForSWM, () => {
      document.body.addEventListener('touchmove', this.preventDefault, { passive: false });
      this.getAvatar();
      let avatar = this.avatar || null;
      if (avatar === null) {
        this.hiveVaultController.refreshAvatar().then(async () => { await this.getAvatar(); }).catch(async () => { await this.getAvatar(); });
      }
      this.initProfileData();
    })

    this.events.subscribe(FeedsEvent.PublishType.walletConnectedRefreshPage, (walletAccount) => {
      this.updateWalletAddress(walletAccount);
    });

    this.events.subscribe(FeedsEvent.PublishType.nftLoadingUpdateText, (textObj: any) => {
      this.isLoading = textObj.isLoading;
      if (this.isLoading) {
        this.loadingTitle = textObj.loadingTitle;
        this.loadingText = textObj.loadingText;
        this.loadingCurNumber = textObj.loadingCurNumber || null;
        this.loadingMaxNumber = textObj.loadingMaxNumber || null;
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.openPayPrompt, (obj) => {
      let nodeId: string = obj.nodeId;
      let channelId: string = obj.channelId;
      let elaAddress: string = obj.elaAddress;
      let amount: string = obj.amount;
      let memo: string = obj.memo;
      this.viewHelper.showPayPrompt(nodeId, channelId, elaAddress, amount, memo);
    });

    this.twitterService.checkTwitterIsExpired()
  }

  initializeApp() {
    this.platform.ready()
      .then(() => {
        // // 测试twitter 记得删除
        // const userDid = (await this.dataHelper.getSigninData()).did
        // this.dataHelper.removeTwitterToken(userDid)
        return this.dataHelper.loadApiProvider();
      }).then(() => {
        this.appService.initTranslateConfig();
        return this.initSql();
      })
      .then(async (api) => {
        Config.changeApi(api);
        this.feedService.initDidManager();
        //for ios
        if (this.isIOSPlatform()) {
          this.statusBar.backgroundColorByHexString('#f8f8ff');
          this.statusBar.overlaysWebView(false);
        }

        this.theme.getTheme();
        // Must do it in ios, otherwise the titlebar and status bar will overlap.

        this.statusBar.show();

        this.platform.backButton.subscribeWithPriority(99999, async () => {
          this.backButtoncount++;
          if (this.backButtoncount === 2) {
            this.backButtoncount = 0;

            //ess登陆框
            let sveltekqf8ju = document.getElementsByClassName("svelte-kqf8ju") || [];
            if (sveltekqf8ju.length > 0) {
              sveltekqf8ju[0].click();
              return;
            }

            //nft loading
            let nftloading: HTMLElement = document.querySelector("app-nftloading") || null;
            if (nftloading != null) {
              return;
            }

            if (this.keyboard.isVisible) {
              this.keyboard.hide();
              return;
            }

            //评论框
            let comment: HTMLElement = document.querySelector("app-comment") || null;
            if (comment != null) {
              let commentMask: HTMLElement = document.getElementById("commentMask") || null;
              if (commentMask != null) {
                commentMask.click();
              }
              return;
            }
            //频道选择框 app-switchfeed
            let switchfeed: HTMLElement = document.querySelector("app-switchfeed") || null;
            if (switchfeed != null) {
              let switchfeedMask: HTMLElement = document.getElementById("switchfeedMask") || null;
              if (switchfeedMask != null) {
                switchfeedMask.click();
              }
              return;
            }

            //分享菜单了 app-picturemenu
            let picturemenu: HTMLElement = document.querySelector("app-picturemenu") || null;
            if (picturemenu != null) {
              let picturemenuMask: HTMLElement = document.getElementById("picturemenuMask") || null;
              if (picturemenuMask != null) {
                picturemenuMask.click();
                picturemenu.remove();
              }
              return;
            }


            //分享菜单了 app-sharemenu
            let connnectionmenu: HTMLElement = document.querySelector("app-connectionmenu") || null;
            if (connnectionmenu != null) {
              let connnectionmenuMask: HTMLElement = document.getElementById("connectionMask") || null;
              if (connnectionmenuMask != null) {
                connnectionmenuMask.click();
                connnectionmenu.remove();
              }
              return;
            }

            //分享菜单了 app-sharemenu
            let sharemenu: HTMLElement = document.querySelector("app-sharemenu") || null;
            if (sharemenu != null) {
              let sharemenuMask: HTMLElement = document.getElementById("sharemenuMask") || null;
              if (sharemenuMask != null) {
                sharemenuMask.click();
                sharemenu.remove();
              }
              return;
            }

            const menu = await this.menuController.getOpen();
            if (menu) {
              await this.menuController.close();
              return;
            }

            const actionSheet = await this.actionSheetController.getTop();
            if (actionSheet) {
              await this.actionSheetController.dismiss();
              return;
            }
            const popover = await this.popoverController.getTop();
            if (popover) {
              await this.popoverController.dismiss();
              return;
            }
            const modal = await this.modalController.getTop();
            if (modal) {
              await modal.dismiss();
              return;
            }
            this.appService.handleBack();
          }
        });

        this.initSetting();
        this.initNftFirstdisclaimer();
        this.initChannelPublicStatusList();
        this.initCurrentChannel();
        this.initSpecificChannelCollectionPageList();
        this.initCollectibleSetting();
        this.initFeedsSortType();
        this.initHideAdult();
        this.initFeedsContractInfoList();
        this.native.addNetworkListener(
          () => {
            this.dataHelper.setNetworkStatus(FeedsData.ConnState.disconnected);
          },
          () => {
            this.dataHelper.setNetworkStatus(FeedsData.ConnState.connected);
          },
        );
        this.initPages();
        this.initConnector();
        this.initIpfs();
        this.initAssist();
        await this.initUserDidUri();
      }).then(async () => {
        this.intentService.addIntentListener(
          (intent: IntentPlugin.ReceivedIntent) => {
            this.intentService.onMessageReceived(intent);
            if (this.isReady) {
              this.intentService.dispatchIntent(intent);
            } else {
              this.receivedIntentList.push(intent);
            }

          },
        );
      }).then(async () => {

      }).catch(() => { });
  }

  initSql(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const signinData = await this.dataHelper.getSigninData()
        if (signinData) {
          await this.native.showLoading('common.waitMoment');
          try {
            await this.dataHelper.restoreSqlData(signinData.did)
            this.native.hideLoading();
          } catch (error) {
            this.native.hideLoading();
          }
        }
        this.hiveVaultController.refreshAvatar().catch(() => { });
        this.hiveVaultController.initRegisterScript(false).catch((error) => { console.log("initRegisterScript error === ", error) })
        resolve('FINISH');
      } catch (error) {
      }
    })
  }

  initConnector() {
    // if (this.isIOSPlatform()) {
    connectivity.registerConnector(this.localIdentityConnector);
    // }
    // connectivity.registerConnector(this.localIdentityConnector);
    // To let users use Essentials for his operations:
    connectivity.registerConnector(this.essentialsConnector);
    connectivity.setApplicationDID(Config.APPLICATION_DID);
  }

  initSpecificChannelCollectionPageList() {
    this.dataHelper
      .loadData('feedsNetWork:specificChannelCollectionPageList')
      .then(channelCollectionPageList => {
        if (channelCollectionPageList === null) {
          this.dataHelper.setChannelCollectionPageList([]);
          return;
        }
        this.dataHelper.setChannelCollectionPageList(channelCollectionPageList);
      })
      .catch(err => { });
  }

  initCurrentChannel() {
    this.dataHelper
      .loadData('feeds.currentChannel')
      .then(currentChannel => {
        if (currentChannel === null) {
          this.dataHelper.setCurrentChannel(null);
          return;
        }
        this.dataHelper.setCurrentChannel(JSON.parse(currentChannel));
      })
      .catch(err => { });
  }

  initChannelPublicStatusList() {
    this.dataHelper
      .loadData('feeds.channelPublicStatus.list')
      .then(channelPublicStatusList => {
        if (channelPublicStatusList === null) {
          this.dataHelper.setChannelPublicStatusList({});
          return;
        }
        this.dataHelper.setChannelPublicStatusList(channelPublicStatusList);
      })
      .catch(err => {

      });
  }

  initSetting() {

    this.dataHelper.loadDevelopLogMode().then((isOpenLog: boolean) => {
      if (isOpenLog)
        Logger.setLogLevel(LogLevel.DEBUG);
      else
        Logger.setLogLevel(LogLevel.WARN);
    });
    this.dataHelper.loadDevelopNet().then((net: string) => {
      this.globalService.changeNet(net);
    });

    this.dataHelper
      .loadData('feeds.developerMode')
      .then(status => {
        if (status === null) {
          this.dataHelper.setDeveloperMode(false);
          return;
        }
        this.dataHelper.setDeveloperMode(status);
      })
      .catch(err => { });

    this.dataHelper
      .loadData('feeds.hideDeletedPosts')
      .then(status => {
        if (status === null) {
          this.dataHelper.setHideDeletedPosts(false);
          return;
        }
        this.dataHelper.setHideDeletedPosts(status);
      })
      .catch(err => { });

    this.dataHelper
      .loadData('feeds.hideDeletedComments')
      .then(status => {
        if (status === null) {
          this.dataHelper.setHideDeletedComments(false);
          return;
        }
        this.dataHelper.setHideDeletedComments(status);
      })
      .catch(err => { });

    this.dataHelper
      .loadData("feeds.pasarListGrid")
      .then((pasarListGrid) => {
        if (pasarListGrid === null) {
          this.dataHelper.setPasarListGrid(false);
          return;
        }
        this.dataHelper.setPasarListGrid(pasarListGrid);
      })
      .catch(err => { });
  }

  initPages() {
    this.appService.initTranslateConfig();
    this.appService.init();

    this.appService.initializeApp().then(() => {
      this.isReady = true;
      this.receivedIntentList.forEach((intent: IntentPlugin.ReceivedIntent) => {
        this.intentService.dispatchIntent(intent);
      });
    });
  }

  initIpfs() {
    // let ipfsBaseUrl = localStorage.getItem("selectedIpfsNetwork") || ''
    // if (ipfsBaseUrl === '') {
    //   ipfsBaseUrl = Config.defaultIPFSApi();
    //   localStorage.setItem("selectedIpfsNetwork", ipfsBaseUrl);
    // }

    ApiUrl.setIpfs(Config.IPFS_SERVER);
    this.globalService.refreshBaseNFTIPSFUrl();
  }

  initAssist() {
    // let assistBaseUrl = localStorage.getItem("selectedAssistPasarNetwork") || '';
    // if(assistBaseUrl === ""){
    //   assistBaseUrl = Config.defaultAssistApi();
    //   localStorage.setItem("selectedAssistPasarNetwork",assistBaseUrl);
    // }
    ApiUrl.setAssist(Config.ASSIST_SERVER);
    this.globalService.refreshBaseAssistUrl();
  }

  initUserDidUri() {
    return this.dataHelper.loadUserDidUriMap();
  }

  about() {
    this.native.navigateForward('/menu/about', '');
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async confirm(that: any) {
    if (this.popover != null) {
      await this.popover.dismiss();
    }
    try {
      await that.dataHelper.removeData("feeds.initHive");
    } catch (error) {

    }
    that.clearData();
    that.disconnectWallet();
  }

  async removeTwitterToken() {
    let signinData = await this.dataHelper.getSigninData() || null
    if (signinData == null || signinData == undefined) {
      return null
    }
    const userDid = signinData.did || ''
    if (userDid === '') {
      return null
    }
    this.dataHelper.removeTwitterToken(userDid);
  }


  async removeRedditToken() {
    let signinData = await this.dataHelper.getSigninData() || null
    if (signinData == null || signinData == undefined) {
      return null
    }
    const userDid = signinData.did || ''
    if (userDid === '') {
      return null
    }
    this.dataHelper.removeRedditToken(userDid);
  }

  async confirmDeleteAccount(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }

    await that.native.showLoading('common.waitMoment');

    try {
      await that.hiveVaultController.deleteAllPost();
    } catch (error) {
    } finally {
      const activeConnector = connectivity.getActiveConnector();
      if (activeConnector.name == 'local-identity') {
        connectivity.unregisterConnector('local-identity');
        persistenceService.reset();
      } else {
        connectivity.unregisterConnector('essentials');
      }
      await that.dataHelper.removeData("feeds.initHive");

      that.native.hideLoading();
      that.removeTwitterToken();
      that.removeRedditToken();
      that.clearData();
      that.disconnectWallet();
    }
  }

  async disconnectWallet() {
    try {
      await this.walletConnectControllerService.disconnect();
    } catch (error) {

    }
    await this.walletConnectControllerService.destroyWalletConnect();
    this.nftContractControllerService.init();
  }

  clearData() {
    this.feedService.signOut()
      .then(() => {
        this.events.publish(FeedsEvent.PublishType.clearHomeEvent);
        this.dataHelper.setChannelPublicStatusList({});
        this.dataHelper.setChannelCollectionPageList([]);
        this.dataHelper.setChannelContractInfoList({});
        this.dataHelper.saveData("feeds.contractInfo.list", {});
        this.globalService.restartApp();
      })
      .catch(err => {
        //TODO
      });
  }

  async showSignoutDialog() {
    this.popover = await this.popupProvider.ionicConfirm(
      this,
      'ConfirmdialogComponent.signoutTitle',
      'ConfirmdialogComponent.signoutMessage',
      this.cancel,
      this.confirm,
      './assets/images/signOutDialog.svg',
      'common.yes'
    );
  }

  initProfileData() {
    this.feedService.initSignInDataAsync(
      signInData => {
        if (signInData == null || signInData == undefined) return;
        let nickname = signInData['nickname'] || '';
        if (nickname != '' && nickname != 'Information not provided') {
          this.wName = nickname;
        } else {
          this.wName = signInData['name'] || '';
        }
        this.userDid = signInData.did || "";
        this.userDidDisplay = UtilService.userDidDisplay(this.userDid);
        this.name = UtilService.moreNanme(this.wName, 15);
      },
      error => { },
    );
  }

  async getAvatar() {
    let avatar = await this.hiveVaultController.getUserAvatar();
    let imgUri = "";
    if (avatar.indexOf('feeds:imgage:') > -1) {
      imgUri = avatar.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (avatar.indexOf('feeds:image:') > -1) {
      imgUri = avatar.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    } else if (avatar.indexOf('pasar:image:') > -1) {
      imgUri = avatar.replace('pasar:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    else {
      imgUri = avatar;
    }
    this.avatar = imgUri;
  }

  settings() {
    this.native.navigateForward('settings', '');
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    this.events.unsubscribe(FeedsEvent.PublishType.walletConnectedRefreshPage);
    this.events.unsubscribe(FeedsEvent.PublishType.nftLoadingUpdateText);
    this.events.unsubscribe(FeedsEvent.PublishType.openPayPrompt);
    this.events.unsubscribe(FeedsEvent.PublishType.walletConnectedRefreshPage);
  }

  async profiledetail() {
    await this.menuController.close();
    this.native.navigateForward(['/menu/profiledetail'], {});
  }

  public isIOSPlatform(): boolean {
    if (this.platform.is('ios')) {
      return true;
    }
    return false;
  }

  initCollectibleSetting() {
    this.dataHelper
      .loadData('feeds.collectible.setting')
      .then(collectibleSetting => {
        if (collectibleSetting === null) {
          this.dataHelper.setCollectibleStatus({});
          return;
        }
        this.dataHelper.setCollectibleStatus(JSON.parse(collectibleSetting));
      })
      .catch(() => { });
  }


  async initFeedsSortType() {
    try {
      await this.dataHelper.loadFeedsSortType();
    } catch (error) {
    }
  }

  async connectWallet() {
    await this.walletConnectControllerService.connect();
    this.updateWalletAddress(null);
  }

  updateWalletAddress(walletAccount: string) {
    if (!walletAccount)
      this.walletAddress = this.walletConnectControllerService.getAccountAddress();
    else
      this.walletAddress = walletAccount;
    this.walletAddressStr = UtilService.shortenAddress(this.walletAddress);
  }

  copyText(text: string) {
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickWalletAddr() {
    this.walletDialog();
  }

  walletDialog() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'common.disconnectWallet',
      this.walletAddress,
      this.cancel,
      this.disconnect,
      './assets/images/tskth.svg',
      'common.disconnect',
    );
  }

  async disconnect(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      try {
        await that.walletConnectControllerService.disconnect();
      } catch (error) {

      }
      await that.walletConnectControllerService.destroyWalletConnect();
      await that.nftContractControllerService.init();
      that.walletAddress = '';
      that.walletAddressStr = '';
      that.events.publish(FeedsEvent.PublishType.clickDisconnectWallet);
    }
  }

  setElaUsdPrice(caceElaPrice: any) {
    this.httpService.getElaPrice().then((elaPrice: any) => {
      if (elaPrice != null) {
        this.dataHelper.setElaUsdPrice(elaPrice);
        this.dataHelper.saveData("feeds:elaPrice", elaPrice);
      }
    }).catch(() => {
      if (caceElaPrice != "") {
        this.dataHelper.setElaUsdPrice(caceElaPrice);
        this.dataHelper.saveData("feeds:elaPrice", caceElaPrice);
      }
    });
  }

  initNftFirstdisclaimer() {
    this.dataHelper
      .loadData("feeds:nftFirstdisclaimer")
      .then((nftFirstdisclaimer: any) => {
        if (nftFirstdisclaimer === null) {
          this.dataHelper.setNftFirstdisclaimer("");
        } else {
          this.dataHelper.setNftFirstdisclaimer(nftFirstdisclaimer);
        }
      }).catch(() => {

      })
  }

  initHideAdult() {
    this.dataHelper.loadData('feeds.hideAdult').then((isShowAdult) => {
      if (isShowAdult === null) {
        this.dataHelper.changeAdultStatus(true);
        return;
      }
      this.dataHelper.changeAdultStatus(isShowAdult);
    }).catch((err) => {

    });
  }

  initFeedsContractInfoList() {
    this.dataHelper.loadData('feeds.contractInfo.list').then((feedsContractInfoList) => {
      if (feedsContractInfoList === null) {
        this.dataHelper.setChannelContractInfoList({});
        return;
      }
      this.dataHelper.setChannelContractInfoList(feedsContractInfoList);
    }).catch((err) => {

    });
  }

  ajaxGetWhiteList(isLoading: boolean) {
    this.httpService.ajaxGet(ApiUrl.getWhiteList, isLoading).then((result: any) => {
      if (result.code === 200) {
        const whiteListData = result.data || [];
        this.dataHelper.setWhiteListData(whiteListData);
        this.dataHelper.saveData("feeds.WhiteList", whiteListData);
      }
    }).catch((err) => {

    });
  }

  // initSql(userDid: string): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       if (userDid === "") {
  //         return;
  //       }

  //       await this.sqliteHelper.createTables(userDid);
  //       resolve('FINISH');
  //     } catch (error) {
  //       Logger.error(TAG, 'Init sql error', error);
  //       reject(error);
  //     }
  //   })
  // }



  async closeMenu() {
    await this.menuController.close();
  }

  privacyPolicy() {
    this.native.openUrl('https://trinity-tech.io/privacy_policy.html');
  }

  termsOfService() {
    this.native.openUrl('https://trinity-feeds.app/disclaimer');
  }

  async deleteAccount() {
    this.popover = await this.popupProvider.ionicConfirm(
      this,
      'ConfirmdialogComponent.deleteAccountTitle',
      'ConfirmdialogComponent.deleteAccountMessage',
      this.cancel,
      this.confirmDeleteAccount,
      './assets/images/signOutDialog.svg',
      'common.yes'
    );
  }
  menuClose() {
    this.theme.restTheme();
    document.body.removeEventListener("touchmove", this.preventDefault, false);
  }

  preventDefault(e: any) { e.preventDefault(); };

}
