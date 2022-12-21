import { Component, OnInit, NgZone } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { Events } from '../../services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { Config } from 'src/app/services/config';
import { Logger } from 'src/app/services/logger';
const TAG: string = 'PaypromptComponent';
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
  selector: 'app-payprompt',
  templateUrl: './payprompt.component.html',
  styleUrls: ['./payprompt.component.scss'],
})
export class PaypromptComponent implements OnInit {
  public elaAddress: string = '';
  public amount: any = '';
  public memo: string = '';
  public defalutMemo: string = '';
  public title: string = '';
  public disableMemo: boolean = false;
  public isAdvancedSetting: boolean = false;
  public destDid: string = '';
  public channelId: string = null;
  public channelAvatar: string = '';
  public channelName: string = '';
  private confirmdialog: any = null;
  private tippingChannelSid: NodeJS.Timer = null;
  private postId: string = '';
  constructor(
    private native: NativeService,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private popover: PopoverController,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private nftContractControllerService: NFTContractControllerService,
    private events: Events,
    private ipfsService: IPFSService,
    public theme: ThemeService,
    public zone: NgZone,
  ) { }

  async ngOnInit() {
    this.destDid = this.navParams.get('destDid') || '';
    this.channelId = this.navParams.get('channelId') || '';
    this.postId = this.navParams.get('postId') || '';
    let channel: FeedsData.ChannelV3 =
    await this.dataHelper.getChannelV3ById(this.destDid, this.channelId) || null;
    if (channel != null) {
      this.channelName = channel.name || '';
      let channelAvatarUri = channel['avatar'] || '';
      if (channelAvatarUri != '') {
        this.handleChannelAvatar(channelAvatarUri);
      }
    }
    this.amount = this.navParams.get('amount') || "";
    this.elaAddress = this.navParams.get('elaAddress');
    this.memo = this.defalutMemo = this.navParams.get('defalutMemo') || "";
    this.title = this.navParams.get('title');

    if (this.defalutMemo != '') {
      this.isAdvancedSetting = true;
    }
  }

  ionViewDidEnter() {

    document.querySelector("ion-backdrop").onclick = async () => {

      let amount = this.amount || "";
      if (amount != "") {
        return;
      }
      let memo = this.memo || "";
      if (memo != "") {
        return;
      }
      if (this.popover != null) {
        await this.popover.dismiss();
      }
    }

  }

  async cancel() {

    let amount = this.amount || "";
    let memo = this.memo || "";

    if (amount != "" || memo != "") {
      //关闭当前对话框
      if (this.popover != null) {
        await this.popover.dismiss();
      }
      await this.showEditedContentPrompt();
      return;
    }

    if (this.popover != null) {
      await this.popover.dismiss();
    }

  }

  async confirm() {
    let count = this.amount;
    if (!this.number(count)) {
      this.native.toastWarn('common.amountError');
      return;
    }

    if (count <= 0) {
      this.native.toastWarn('common.amountError');
      return;
    }

    if (this.memo == '') this.memo = this.defalutMemo;
    if (this.popover != null) {
      await this.popover.dismiss();
      this.popover = null;
      this.handleTipping();
    }
  }

  number(text) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  advancedSettings() {
    this.isAdvancedSetting = !this.isAdvancedSetting;
  }

  async showEditedContentPrompt() {
    this.confirmdialog = await this.popupProvider.showConfirmdialog(
      this,
      'common.confirmDialog',
      'common.editedContentDes',
      this.cancelButton,
      this.okButton,
      './assets/images/finish.gif',
      'common.editedContentDes1',
      "common.editedContentDes2"
    );
  }

  async cancelButton(that: any) {
    if (that.confirmdialog != null) {
      await that.confirmdialog.dismiss();
      that.confirmdialog = null;
      that.events.publish(FeedsEvent.PublishType.openPayPrompt, {
        destDid: that.destDid,
        channelId: that.channelId,
        elaAddress: that.elaAddress,
        amount: that.amount,
        memo: that.memo
      });
    }
  }

  async okButton(that: any) {
    if (that.confirmdialog != null) {
      await that.confirmdialog.dismiss();
      that.confirmdialog = null;
    }
  }

  handleChannelAvatar(channelAvatarUri: string) {
    let fileName: string = channelAvatarUri.split("@")[0];
    this.hiveVaultController.getV3Data(this.destDid, channelAvatarUri, fileName, "0")
      .then((result) => {
        this.channelAvatar = result;
      }).catch((err) => {
      })
  }

  async handleTipping() {
    let textObj = {
     "isLoading": true,
     "loadingTitle": 'common.waitMoment',
     "loadingText": 'common.uploadingData',
     "loadingCurNumber": '1',
     "loadingMaxNumber": '2'
   }
   this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
   this.tippingChannelSid = setTimeout(() => {
     this.nftContractControllerService.getChannelTippingContractService().cancelTippingProcess();
     textObj.isLoading = false;
     this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
     this.clearTippingChannelSid();
     this.popupProvider.showSelfCheckDialog('common.tipPostTimeoutDesc');
   }, Config.WAIT_TIME_BURN_NFTS);

   let channelId = '0x'+this.channelId;
   let postId = '0x'+this.postId;
   let tippingAmount = this.nftContractControllerService.transToWei(
     this.amount.toString(),
   );
   let walletAdress: string = this.nftContractControllerService.getAccountAddress() || '';
   this.uploadData()
   .then(async (result) => {
     Logger.log(TAG, 'Upload Result', result);
     textObj.loadingCurNumber = "1";
     textObj.loadingText = "common.uploadDataSuccess";
     this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
     let senderUri = result.jsonHash;
     textObj.loadingCurNumber = "2";
     textObj.loadingText = "common.makeTipping";
     this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
     return this.nftContractControllerService.getChannelTippingContractService()
     .makeTipping(channelId, postId, '0x0000000000000000000000000000000000000000',tippingAmount,senderUri,this.memo,walletAdress);
   }).then(async () => {
       this.nftContractControllerService.getChannelTippingContractService().cancelTippingProcess();
       this.native.toast("common.tippingSucess");

       let postTipCountMap= this.dataHelper.getPostTipCountMap() || {};
       let postTipCount = postTipCountMap[this.postId] || 0;
       let newPostTipCount =  parseInt(postTipCount) + 1;
       postTipCountMap[this.postId] = newPostTipCount;
       this.dataHelper.setPostTipCountMap(postTipCountMap);


       let signInData = await this.dataHelper.getSigninData();
       let did = signInData.did || '';
       let name = signInData.name || '';
       let description = signInData.description || '';

       let item: postTipItem = {
        channelId: this.channelId,
        postId: this.channelId,
        paidFrom: '',
        paidTo: '',
        paidToken: '',
        amount: this.amount,
        senderUri: '',
        memo: '',
        did: did,
        version: '1',
        name: name,
        description: description
       };

      let postTipListMap = this.dataHelper.getPostTipListMap() || {};
      let list =  postTipListMap[this.postId] || [];
       list.unshift(item);
       postTipListMap[this.postId] = list;
       this.dataHelper.setPostTipListMap(postTipListMap);

       this.events.publish(FeedsEvent.PublishType.updatePostTipCount,{postId:this.postId,postTipCount:newPostTipCount});
       textObj.isLoading = false;
       this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
       this.clearTippingChannelSid();
     }).catch(() => {
       textObj.isLoading = false;
       this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
       this.clearTippingChannelSid();
       this.native.toastWarn("common.tippingFailed");
     });
 }

  clearTippingChannelSid(){
    if(this.tippingChannelSid != null){
        clearTimeout(this.tippingChannelSid);
        this.tippingChannelSid = null;
    }
  }

  sendIpfsJSON(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let signInData = await this.dataHelper.getSigninData();
      let did = signInData.did || '';
      let name = signInData.name || '';
      let description = signInData.description || '';
      if( description === '暂无个人简介和兴趣爱好信息' || description === 'Add Description'){
        description = '';
      }
      let ipfsJSON = {
        "version": "1",
        "did": did,
        "name": name,
        "description": description
      }
      let formData = new FormData();
      formData.append('', JSON.stringify(ipfsJSON));
      Logger.log(TAG, 'Send json, formdata length is', formData.getAll('').length);
      this.ipfsService
        .nftPost(formData)
        .then(result => {
          //{"Name":"blob","Hash":"QmaxWgjheueDc1XW2bzDPQ6qnGi9UKNf23EBQSUAu4GHGF","Size":"17797"};
          Logger.log(TAG, 'Json data is', JSON.stringify(result));
          let hash = result['Hash'] || null;
          if (hash != null) {
            let jsonHash = 'feeds:json:' + hash;
            resolve(jsonHash);
          }
        })
        .catch(err => {
          Logger.error(TAG, 'Send Json data error', err);
          reject('upload json error');
        });
    });
  }

  uploadData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.sendIpfsJSON().then((jsonHash) => {
          resolve({ jsonHash: jsonHash });
        })
        .catch((error) => {
          reject('upload file error');
        });
    });
  }

}
