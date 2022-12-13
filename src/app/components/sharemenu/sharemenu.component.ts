import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PopupProvider } from 'src/app/services/popup';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sharemenu',
  templateUrl: './sharemenu.component.html',
  styleUrls: ['./sharemenu.component.scss'],
})
export class SharemenuComponent implements OnInit {
  @Input() destDid: string = '';
  @Input() channelId: string = '';
  @Input() isShowTitle: boolean = false;
  @Input() isShowQrcode: boolean = false;
  @Input() isShowUnfollow: boolean = false;
  @Input() isShowInfo: boolean = false;
  @Input() isPreferences: boolean = false;
  @Input() channelName: string = null;
  @Input() qrCodeString: string = null;
  @Input() channelPublicStatusList: any = {};
  @Input() userDid: string = '';
  @Output() hideShareMenu = new EventEmitter();
  private unsubscribeDialog: any = null;
  constructor(
    public theme: ThemeService,
    public popupProvider: PopupProvider,
    ) {}

  ngOnInit() {
  }

  async clickItem(buttonType: string) {
    if(buttonType === 'unfollow'){
        await this.showUnsubscribeDialog();
    }else{
      this.hideShareMenu.emit({
        buttonType: buttonType,
        destDid: this.destDid,
        channelId: this.channelId,
      });
    }
  }

  async showUnsubscribeDialog() {
    this.unsubscribeDialog = await this.popupProvider.ionicConfirm(
      this,
      'common.unsubscribeChannel',
      'common.unsubscribeChannelDes',
      this.unsubscribeDialogCancel,
      this.unsubscribeDialogConfirm,
      './assets/images/unsubscribeChannel.svg',
      'common.yes',
      null,
      this.channelName
    );
  }

  async unsubscribeDialogCancel(that: any){
    if (that.unsubscribeDialog != null) {
      await that.unsubscribeDialog.dismiss();
      that.unsubscribeDialog = null;
    }
  }

  async unsubscribeDialogConfirm(that: any){
    if (that.unsubscribeDialog != null) {
      await that.unsubscribeDialog.dismiss();
      that.unsubscribeDialog = null;
    }

    that.hideShareMenu.emit({
      buttonType: 'unfollow',
      destDid: that.destDid,
      channelId: that.channelId,
    });

  }

}
