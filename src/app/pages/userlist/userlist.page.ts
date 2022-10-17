import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { Params, ActivatedRoute } from '@angular/router';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { UtilService } from 'src/app/services/utilService';

@Component({ selector: 'app-userlist', templateUrl: './userlist.page.html', styleUrls: ['./userlist.page.scss'], })
export class UserlistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public pageItemMap: { [userDid: string]: PageItem } = {};
  public totalUserDidList: string[] = [];
  public usersDidList: string[] = [];
  public pageSize = 1;
  public pageNumber = 10;
  private userAvatarSid: NodeJS.Timer = null;
  private userObserver: any = {};
  private isLoadUsers: any = {};
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    private dataHelper: DataHelper,
    private native: NativeService,
    public theme: ThemeService,
    private hiveVaultController: HiveVaultController
  ) { }

  ionViewWillEnter() {
    this.initTitle();
    this.initData();
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
    this.totalUserDidList = userList;
    let pageData = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalUserDidList);
    this.usersDidList = pageData.items;
    this.syncRemoteUserProfile(this.usersDidList);
    this.removeObserveList();
    this.initUserObserVerList(this.usersDidList);
  }

  clickItem(userItem: string) {
    this.native.toast(userItem);
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params: Params) => {
    });
  }

  setUserNameAndAvatarUI(userProfile: FeedsData.UserProfile) {
    const name = userProfile.name || userProfile.resolvedName || userProfile.displayName;
    const avatarUrl = userProfile.avatar || userProfile.resolvedAvatar;
    this.setUserNameUI(userProfile.did, name);
    this.setAvatarUI(userProfile.did, avatarUrl);
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
      let fileName: string = userDid.replace('did:elastos:', '');
      this.hiveVaultController.getV3HiveUrlData(userDid, avatarUrl, fileName)
        .then((image) => {
          this.setUserAvatar(userDid, image);
        }).catch((err) => {
           this.setUserAvatar(userDid);
        })
    }else{
      this.setUserAvatar(userDid);
    }
  }

  setUserAvatar(userDid: string, avatar = './assets/images/default-contact.svg') {
    if (!this.pageItemMap[userDid])
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
    this.pageItemMap[userDid].avatar = avatar;
  }

  setUserName(userDid: string, userName: string = 'common.unknown') {
    if (!this.pageItemMap[userDid])
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
    this.pageItemMap[userDid].name = userName;
  }

  generatePageItem(userDid: string): PageItem {
    return { did: userDid, name: '', avatar: '', description: '' }
  }

  initUserObserVerList(userDidList = []) {
    this.clearUserAvatarSid();
    this.userAvatarSid = setTimeout(() => {
      this.getUserObserverList(userDidList);
      this.clearUserAvatarSid();
    }, 100);
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
        if(isLoad === ''){
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
      this.pageItemMap[userDid].name = UtilService.shortenAddress(simpleDid);
      this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
        this.setUserNameAndAvatarUI(userProfile);
      });
    }
  }

  clearUserAvatarSid() {
    if (this.userAvatarSid != null) {
      clearTimeout(this.userAvatarSid);
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
    // refresh total data todo
    let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalUserDidList);
    this.usersDidList = data.items;
    this.syncRemoteUserProfile(this.usersDidList);
    this.removeObserveList();
    this.isLoadUsers = {};
    this.initUserObserVerList(this.usersDidList);
  }

  loadData(event: any) {
    let sId = setTimeout(() => {
      if (this.usersDidList.length === this.totalUserDidList.length) {
        event.target.complete();
        clearTimeout(sId);
        return;
      }
      this.pageSize++;
      let data = UtilService.getPageData(this.pageSize, this.pageNumber, this.totalUserDidList);
      const newLoadedList = data.items
      this.usersDidList = this.usersDidList.concat(newLoadedList);
      this.syncRemoteUserProfile(newLoadedList);

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

  private syncDidDocumentProfileFromList(usersDidList: string[]) {
    for (let index = 0; index < usersDidList.length; index++) {
      const userdid: string = usersDidList[index];
      this.hiveVaultController.syncUserProfileFromDidDocument(userdid).then((userProfile: FeedsData.UserProfile) => {
        this.setUserNameAndAvatarUI(userProfile);
      });
    }
  }

  syncRemoteUserProfile(userDidList: string[]) {
    this.syncDidDocumentProfileFromList(userDidList);
  }

  clickSubscription(userDid: string) {
  }
}

type PageItem = {
  did: string,
  name: string,
  avatar: string,
  description: string
}