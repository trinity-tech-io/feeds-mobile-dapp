import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { Params, ActivatedRoute } from '@angular/router';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { UtilService } from 'src/app/services/utilService';
import { Events } from 'src/app/services/events.service';

@Component({ selector: 'app-userlist', templateUrl: './userlist.page.html', styleUrls: ['./userlist.page.scss'], })
export class UserlistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public pageItemMap: { [userDid: string]: PageItem } = {};
  public totalUsersDidList: string[] = [];
  public usersDidList: string[] = [];
  public pageSize = 1;
  public pageNumber = 15;
  private userAvatarSid: any = null;
  private userObserver: any = {};
  private isLoadUsers: any = {};
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    private dataHelper: DataHelper,
    private native: NativeService,
    public theme: ThemeService,
    private hiveVaultController: HiveVaultController,
    private events: Events,
    private zone: NgZone,
  ) {
  }
  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params: Params) => {
    });
    this.addEvents();
    this.initData();
  }
  ngOnDestroy() {
    this.removeEvents();
  }

  ionViewDidLoad() {
  }

  ionViewWillUnload() {
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  ionViewWillLeave() {
  }

  addEvents() {
    this.events.subscribe(FeedsEvent.PublishType.refreshUserProfile, () => {
      this.zone.run(() => {
        if (!this.usersDidList || this.usersDidList.length == 0) {
          this.initData();
        } else {
          this.refreshPageItem(this.usersDidList);
        }
      });
    });
  }

  removeEvents() {
    this.events.unsubscribe(FeedsEvent.PublishType.refreshUserProfile);
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('UserlistPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  async initData() {
    this.pageSize = 1;
    const userList = this.dataHelper.getUserDidList();
    this.totalUsersDidList = userList;
    let pageData = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalUsersDidList);
    this.usersDidList = pageData.items;
    // this.syncRemoteUserProfile(this.usersDidList);
    this.refreshPageItem(this.usersDidList);
  }

  clickItem(userItem: string) {
    this.native.toast(userItem);
  }

  setUserNameAndAvatarUI(userProfile: FeedsData.UserProfile) {
    const name = userProfile.name || userProfile.resolvedName || userProfile.displayName;
    const avatarUrl = userProfile.avatar || userProfile.resolvedAvatar;
    const description = userProfile.bio || userProfile.resolvedBio || '';
    const credentials = userProfile.credentials || '';

    this.setUserNameUI(userProfile.did, name);
    this.setAvatarUI(userProfile.did, avatarUrl);
    this.setUserDescription(userProfile.did, description);
    this.setCredentialUI(userProfile.did, credentials);
  }

  setUserNameUI(userDid: string, name: string) {
    if (name) {
      this.setUserName(userDid, name);
    } else {
      this.setUserName(userDid);
    }
  }

  setAvatarUI(userDid: string, avatarUrl: string) {
    if (avatarUrl) {
      this.hiveVaultController.getV3HiveUrlData(avatarUrl)
        .then((image) => {
          if (!image || image == 'null') {
            this.setUserAvatar(userDid);
          } else {
            this.setUserAvatar(userDid, image);
          }
        }).catch((err) => {
          this.setUserAvatar(userDid);
        })
    } else {
      this.setUserAvatar(userDid);
    }
  }

  setCredentialUI(userDid: string, credentials: string) {
    if (!credentials) {
      this.setCredentials(userDid, false);
    } else {
      this.setCredentials(userDid, true);
    }
  }

  setUserAvatar(userDid: string, avatar = './assets/images/did-default-avatar.svg') {
    if (!this.pageItemMap[userDid])
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
    this.pageItemMap[userDid].avatar = avatar;
  }

  setUserName(userDid: string, userName: string = 'common.unknown') {
    if (!this.pageItemMap[userDid])
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
    this.pageItemMap[userDid].name = userName;
  }

  setUserDescription(userDid: string, userDescription: string = '') {
    if (!this.pageItemMap[userDid])
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
    this.pageItemMap[userDid].description = userDescription
  }

  setCredentials(userDid: string, isShowKycIcon: boolean = false) {
    if (!this.pageItemMap[userDid])
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
    this.pageItemMap[userDid].isShowKycIcon = isShowKycIcon;
  }

  generatePageItem(userDid: string): PageItem {
    return { did: userDid, name: '', avatar: '', description: '', isShowKycIcon: false };
  }

  initUserObserVerList(userDidList = []) {
    this.clearUserAvatarSid();
    this.userAvatarSid = requestAnimationFrame(() => {
      this.getUserObserverList(userDidList);
      this.clearUserAvatarSid();
    });
  }

  getUserObserverList(userDidList = []) {
    for (let index = 0; index < userDidList.length; index++) {
      let userDid = userDidList[index] || null;
      if (userDid === null) {
        return;
      }
      let observerId = userDid + '-userList';
      let exit = this.userObserver[observerId] || null;
      if (exit != null) {
        continue;
      }

      this.newUserObserver(observerId);
    }
  }

  newUserObserver(observerId: string) {
    let observer = this.userObserver[observerId] || null;
    if (observer != null) {
      return;
    }
    let item = document.getElementById(observerId) || null;
    if (item != null) {
      this.userObserver[observerId] = new IntersectionObserver(async (changes: any) => {
        let container = changes[0].target;
        let newId = container.getAttribute("id");
        let intersectionRatio = changes[0].intersectionRatio;
        if (intersectionRatio === 0) {
          return;
        }
        let arr = newId.split("-");
        let userDid: string = arr[0];
        let isLoad = this.isLoadUsers[userDid] || ''
        if (isLoad === '') {
          this.isLoadUsers[userDid] = "loaded"
          this.setPageItemData(userDid);
        }
      });
      this.userObserver[observerId].observe(item);
    }
  }

  setPageItemData(userDid: string) {
    let pageItem = this.pageItemMap[userDid] || '';
    if (!pageItem) {
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
      let simpleDid = userDid.replace('did:elastos:', '');
      this.pageItemMap[userDid].name = UtilService.shortenDid(simpleDid);
      let avatar = this.pageItemMap[userDid].avatar || '';
      if (avatar === '') {
        this.pageItemMap[userDid].avatar = './assets/images/loading.svg';
      }
      this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
        this.setUserNameAndAvatarUI(userProfile);
      }).catch(err => {
        this.setUserAvatar(userDid);
      });
    }
  }

  clearUserAvatarSid() {
    if (this.userAvatarSid != null) {
      cancelAnimationFrame(this.userAvatarSid);
      this.userAvatarSid = null;
    }
  }

  removeObserveList() {
    for (let postGridId in this.userObserver) {
      let observer = this.userObserver[postGridId] || null;
      this.removeUserObserver(postGridId, observer)
    }
    this.userObserver = {};
  }

  removeUserObserver(postGridId: string, observer: any) {
    let item = document.getElementById(postGridId) || null;
    if (item != null) {
      if (observer != null) {
        observer.unobserve(item);//解除观察器
        observer.disconnect();  // 关闭观察器
        this.userObserver[postGridId] = null;
      }
    }
  }

  doRefresh(event: any) {
    let sId = setTimeout(() => {
      try {
        this.handleRefesh();
      } catch (error) {
      }
      event.target.complete();
      clearTimeout(sId);
    }, 200)
  }

  async handleRefesh() {
    this.pageSize = 1;
    this.usersDidList = this.pageData();

    this.refreshProfileFromRemote(this.totalUsersDidList, this.usersDidList);
    // this.refreshPageItem(this.usersDidList);
  }

  pageData(): string[] {
    let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalUsersDidList);
    return data.items;
  }

  refreshProfileFromRemote(totalUsersDidList: string[], loadedUsersDidList: string[]) {
    this.refreshUserProfileFromList(totalUsersDidList).then(() => {
      this.refreshPageItem(loadedUsersDidList);
    }).catch((error) => {
      this.refreshPageItem(loadedUsersDidList);
    });
  }

  refreshPageItem(loadedUserDidList: string[]) {
    this.removeObserveList();
    this.isLoadUsers = {};
    this.pageItemMap = {};
    this.initUserObserVerList(loadedUserDidList);
  }

  loadData(event: any) {
    let sId = setTimeout(() => {
      if (this.usersDidList.length === this.totalUsersDidList.length) {
        event.target.complete();
        clearTimeout(sId);
        return;
      }
      this.pageSize++;
      let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalUsersDidList);
      const newLoadedList = data.items
      this.usersDidList = this.usersDidList.concat(newLoadedList);
      // this.syncRemoteUserProfile(newLoadedList);

      this.initUserObserVerList(data.items);
      event.target.complete();
      clearTimeout(sId);
    }, 500);
  }

  copyText(text: string) {
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  private refreshUserProfileFromList(usersDidList: string[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let promiseArray = [];
      for (let index = 0; index < usersDidList.length; index++) {
        const userdid: string = usersDidList[index];
        const promise = this.hiveVaultController.refreshUserProfile(userdid);
        promiseArray.push(promise);
      }

      Promise.allSettled(promiseArray).then(() => {
        resolve('FINISH')
      }).catch((error) => {
        reject(error);
      })
    });
  }

  clickSubscription(userDid: string) {
    userDid = userDid || '';
    if (userDid != '') {
      this.native.navigateForward(['/userprofile'], { queryParams: { 'userDid': userDid } });
    }
  }
}

type PageItem = {
  did: string,
  name: string,
  avatar: string,
  description: string,
  isShowKycIcon: boolean
}