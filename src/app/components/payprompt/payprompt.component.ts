import { Component, OnInit, NgZone } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { Events } from '../../services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { Config } from 'src/app/services/config';

@Component({
  selector: 'app-payprompt',
  templateUrl: './payprompt.component.html',
  styleUrls: ['./payprompt.component.scss'],
})
export class PaypromptComponent implements OnInit {
  public elaAddress: string = '';
  public amount: any = '';
  public memo: string = '';
  public defalutMemo: string = 'like the post';
  public title: string = '';
  public disableMemo: boolean = true;
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
    this.memo = this.defalutMemo = this.navParams.get('defalutMemo') || "like the post";
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
      './assets/images/finish.svg',
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
      "loadingText": 'common.makeTipping',
      "loadingCurNumber": '1',
      "loadingMaxNumber": '1'
    }
    this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
    this.tippingChannelSid = setTimeout(() => {
      this.nftContractControllerService.getChannelTippingContractService().cancelTippingProcess();
      textObj.isLoading = false;
      this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
      this.clearTippingChannelSid();
      this.popupProvider.showSelfCheckDialog('common.burningNFTSTimeoutDesc');
    }, Config.WAIT_TIME_BURN_NFTS);

    let channelId = '0x'+this.channelId;
    let postId = '0x'+this.postId;
    let tippingAmount = this.nftContractControllerService.transToWei(
      this.amount.toString(),
    );
    let walletAdress: string = this.nftContractControllerService.getAccountAddress() || '';

    this.nftContractControllerService.getChannelTippingContractService()
      .makeTipping(channelId, postId, '0x0000000000000000000000000000000000000000',tippingAmount,this.memo,walletAdress)
      .then(() => {
        this.nftContractControllerService.getChannelTippingContractService().cancelTippingProcess();
        this.native.toast("common.tippingSucess");
        textObj.isLoading = false;
        this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
        this.clearTippingChannelSid();
      }).catch(() => {
        textObj.isLoading = false;
        this.events.publish(FeedsEvent.PublishType.nftLoadingUpdateText, textObj);
        this.clearTippingChannelSid();
        this.native.toastWarn("commont.tippingFailed");
      });
  }

  clearTippingChannelSid(){
    if(this.tippingChannelSid != null){
        clearTimeout(this.tippingChannelSid);
        this.tippingChannelSid = null;
    }
  }
}
