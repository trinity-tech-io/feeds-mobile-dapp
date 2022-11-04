import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { UtilService } from 'src/app/services/utilService';
type postTipItem = {
  channelId : string,
  postId: string,
  paidFrom: string,
  paidTo: string,
  paidToken : string,
  amount: string,
  senderUri: string,
  memo: string,
  did: string,
  version: string,
  name: string,
  description: string
};
@Component({
  selector: 'app-posttiplist',
  templateUrl: './posttiplist.page.html',
  styleUrls: ['./posttiplist.page.scss'],
})
export class PosttiplistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public pageItemMap: { [userDid: string]: PageItem } = {};
  public channelId: string = '';
  public postId: string = '';
  private maxCount: number = 0;
  private startIndex: number = 0;
  public  postTipList: postTipItem[]  = [];
  private userAvatarSid: NodeJS.Timer = null;
  private userObserver: any = {};
  private isLoadUsers: any = {};
  public  isLoading: boolean = true;
  constructor(
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      this.channelId = params.channelId;
      this.postId = params.postId;
      try {
       this.maxCount = await this.nftContractControllerService.getChannelTippingContractService().getPosTippingCount(this.channelId, this.postId);
      } catch (error) {

      }
    });
  }

  async ionViewWillEnter() {
    this.initTitle();
    let postTipListMap = this.dataHelper.getPostTipListMap() || {};
    await this.getPostTipList(postTipListMap);
    this.isLoading = false;
    this.removeObserveList();
    this.initUserObserVerList(this.postTipList);
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('PosttiplistPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  clearUserAvatarSid() {
    if (this.userAvatarSid != null) {
      clearTimeout(this.userAvatarSid);
      this.userAvatarSid = null;
    }
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
      let postTipItem = userDidList[index] || null;
      if (postTipItem === null) {
         continue;
      }
      let userDid = postTipItem.did;
      let observerId = userDid + '-userList-tip';
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

  setPageItemData(userDid: string) {
    let pageItem = this.pageItemMap[userDid] || '';
    if (!pageItem) {
      this.pageItemMap[userDid] = this.generatePageItem(userDid);
      let simpleDid = userDid.replace('did:elastos:', '');
      this.pageItemMap[userDid].name = UtilService.shortenAddress(simpleDid);
      this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
        this.setUserNameAndAvatarUI(userProfile);
      }).catch(err=>{
        this.setUserAvatar(userDid);
      });
    }
  }

  generatePageItem(userDid: string): PageItem {
    return { did: userDid, name: '', avatar: '', description: '' }
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

  ionViewWillLeave() {

  }

  async getPostTipList(postTipListMap: any) {
      try {
      let postTipList = postTipListMap[this.postId] || '';
      if(postTipList === ''){
        let list =  await this.nftContractControllerService
        .getChannelTippingContractService()
        .getPosTippingList(this.channelId, this.postId,this.startIndex,this.maxCount);
        this.postTipList = await this.handleList(list);
        postTipListMap[this.postId] = this.postTipList;
        this.dataHelper.setPostTipListMap(postTipListMap);
      }else {
        this.postTipList = postTipList;
      }

      } catch (error) {
      }
  }

async handleList(list:[]) {
  let arr = [];
  for(let index=0;index<list.length;index++){
      let info = list[index];
      let item: postTipItem = {
        channelId: '',
        postId: '',
        paidFrom: '',
        paidTo: '',
        paidToken: '',
        amount: '',
        senderUri: '',
        memo: '',
        did: '',
        version: '',
        name: '',
        description: ''
      };
      item.channelId = info[0];
      item.postId = info[1];
      item.paidFrom = info[2];
      item.paidTo = info[3];
      item.paidToken = info[4];
      item.amount = this.nftContractControllerService.transFromWei(info[5]);
      item.senderUri = info[6];
      item.memo = info[7];
      try {
        let uri = item.senderUri.replace('feeds:json:', '');
        let result:any = await this.ipfsService
          .nftGet(this.ipfsService.getNFTGetUrl() + uri);
        item.did = result.did;
        item.version = result.version || '1';
        item.name = result.name;
        item.description = result.description;
        arr.push(item);
      } catch (error) {

      }
  }

  return arr.reverse();
}

clickSubscription(userDid: string){

}

doRefresh(event: any) {
  let sId = setTimeout(async () => {
    try {
      await this.getPostTipList({});
      this.removeObserveList();
      this.isLoadUsers = {};
      this.initUserObserVerList(this.postTipList);
    } catch (error) {
    }
    event.target.complete();
    clearTimeout(sId);
  }, 200)
}

}

type PageItem = {
  did: string,
  name: string,
  avatar: string,
  description: string
}
