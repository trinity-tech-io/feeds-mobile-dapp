import { Component,  OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { DataHelper } from 'src/app/services/DataHelper';
import { Params, ActivatedRoute } from '@angular/router';
import { DIDHelperService } from 'src/app/services/did_helper.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { UtilService } from 'src/app/services/utilService';

@Component({
  selector: 'app-userlist',
  templateUrl: './userlist.page.html',
  styleUrls: ['./userlist.page.scss'],
})
export class UserlistPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public userAvatarMap: { [userDid: string]: string } = {};
  public userNameMap: { [userDid: string]: string } = {};
  private userAvatarisLoad: { [userDid: string]: string } = {};
  private userNameisLoad: { [userDid: string]: string } = {};
  private channelId = '';
  public totalData: any = [];
  public subscriptionList:any = [];
  public pageSize = 1;
  public pageNumber = 10;
  private userAvatarSid: NodeJS.Timer = null;
  private userObserver: any= {};
  constructor(
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    private dataHelper: DataHelper,
    private native: NativeService,
    public theme: ThemeService,
    private didHelper: DIDHelperService,
    private hiveVaultController: HiveVaultController
  ) { }

  ionViewWillEnter() {
    this.initTitle();
    this.getUserList();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('UserListPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  ionViewWillLeave() {
  }

  async getUserList() {
    this.pageSize = 1;
    this.totalData = await this.dataHelper.getSubscriptionV3DataByChannelId(this.channelId);
    let data = UtilService.getPostformatPageData(this.pageSize,this.pageNumber,this.totalData);
    if(data.currentPage === data.totalPage){
      this.subscriptionList = data.items
    }else{
      this.subscriptionList = data.items;
    }
    this.removeObserveList();
    this.userAvatarisLoad = {};
    this.userNameisLoad = {};
    this.refreshUserAvatar(this.subscriptionList);
  }

  clickItem(userItem: string) {
    this.native.toast(userItem);
  }

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe((params: Params) => {
      this.channelId = params.channelId;
    });
  }

  resolveData(userDid: string) {
    this.didHelper.resolveNameAndAvatarFromDidDocument(userDid).then((result: { name: string, avatar: string }) => {
      if (result.name) {
        this.setUserName(userDid, result.name);
      }else{
       this.userNameMap[userDid] = "common.unknown";
      }

      const avatarUrl = result.avatar;
      if (avatarUrl) {
        let fileName: string = userDid.replace('did:elastos:', '');
        this.hiveVaultController.getV3HiveUrlData(userDid, avatarUrl, fileName)
          .then((image) => {
            this.setUserAvatar(userDid, image);
          }).catch((err) => {
            this.userAvatarMap[userDid] = './assets/images/default-contact.svg';
          })
      }else{
        this.userAvatarMap[userDid] = './assets/images/default-contact.svg';
      }
    }).catch((err)=>{
      this.userNameMap[userDid] = "common.unknown";
      this.userAvatarMap[userDid] = './assets/images/default-contact.svg';
    });
  }

  setUserAvatar(userDid: string, avatar = './assets/images/default-contact.svg') {
    this.userAvatarMap[userDid] = avatar;
  }

  setUserName(userDid: string, userName: string) {
    this.userNameMap[userDid] = userName;
  }

  clickSubscription(subscription:any) {

  }

  refreshUserAvatar(list = []) {
    this.clearUserAvatarSid();
    this.userAvatarSid = setTimeout(() => {
     this.getUserObserverList(list);
     this.clearUserAvatarSid();
   }, 100);
 }


 getUserObserverList(follingList = []){

  for(let index = 0; index < follingList.length; index++){
    let item =  follingList[index] || null;
    if(item === null){
      return;
    }
    let postGridId = item.userDid+'-userList';
    let exit = this.userObserver[postGridId] || null;
    if(exit != null){
       continue;
    }
    this.newUserObserver(postGridId);
  }
}

newUserObserver(postGridId: string) {
  let observer = this.userObserver[postGridId] || null;
  if(observer != null){
    return;
  }
  let item = document.getElementById(postGridId) || null;
  if(item != null ){
  this.userObserver[postGridId] = new IntersectionObserver(async (changes:any)=>{
  let container = changes[0].target;
  let newId = container.getAttribute("id");

  let intersectionRatio = changes[0].intersectionRatio;

  if(intersectionRatio === 0){
    //console.log("======newId leave========", newId);
    return;
  }
  let arr =  newId.split("-");
  let userDid: string = arr[0];
  await this.handleUserAvatar(userDid);
  });

  this.userObserver[postGridId].observe(item);
  }
}

getDisplayName(userDid: string) {
  let isLoad = this.userNameisLoad[userDid] || '';
  if(isLoad === "") {
    this.userNameisLoad[userDid] = "11";
    let text = userDid.replace('did:elastos:', '');
    this.userNameMap[userDid] = UtilService.resolveAddress(text);
   }
}

 clearUserAvatarSid() {
  if(this.userAvatarSid != null){
   clearTimeout(this.userAvatarSid);
   this.userAvatarSid  = null;
  }
}
async handleUserAvatar(userDid: string) {

  let isload = this.userAvatarisLoad[userDid] || '';
  if (isload === "") {
     this.userAvatarisLoad[userDid] = '11';
     this.getDisplayName(userDid);
     this.resolveData(userDid);
  }
 }

 removeObserveList() {
  for(let postGridId in  this.userObserver){
      let observer =  this.userObserver[postGridId] || null;
      this.removeUserObserver(postGridId, observer)
  }
  this.userObserver = {};
 }

 removeUserObserver(postGridId: string, observer: any){
  let item = document.getElementById(postGridId) || null;
  if(item != null){
    if( observer != null ){
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
    this.totalData = await this.dataHelper.getSubscriptionV3DataByChannelId(this.channelId);
    let data = UtilService.getPostformatPageData(this.pageSize,this.pageNumber,this.totalData);
    if(data.currentPage === data.totalPage){
      this.subscriptionList = data.items
    }else{
      this.subscriptionList = data.items;
    }
    this.removeObserveList();
    this.userAvatarisLoad = {};
    this.userNameisLoad = {};
    this.refreshUserAvatar(this.subscriptionList);
 }

 loadData(event: any) {
  let sId = setTimeout(() => {
    if(this.subscriptionList.length === this.totalData.length){
      event.target.complete();
      clearTimeout(sId);
      return;
    }
    this.pageSize++;
    let data = UtilService.getPostformatPageData(this.pageSize, this.pageNumber, this.totalData);
    if (data.currentPage === data.totalPage) {
      this.subscriptionList = this.subscriptionList.concat(data.items);
    } else {
      this.subscriptionList = this.subscriptionList.concat(data.items);
    }
    this.refreshUserAvatar(data.items);
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
}
