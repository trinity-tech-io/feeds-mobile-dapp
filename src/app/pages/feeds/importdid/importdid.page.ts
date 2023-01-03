/*
 * @Author: liaihong
 * @Date: 2022-12-20 16:58:49
 * @LastEditors: liaihong 
 * @LastEditTime: 2022-12-29 17:10:24
 * @FilePath: /feeds-mobile-dapp-2/src/app/pages/feeds/importdid/importdid.page.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Component, OnInit, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { PopupProvider } from 'src/app/services/popup';
import { IonInput, ModalController, Platform } from '@ionic/angular';
import { MnemonicPassCheckComponent } from 'src/app/pages/feeds/mnemonicPassCheckComponent/mnemonicpasscheck.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { ThemeService } from 'src/app/services/theme.service';
import { Events } from 'src/app/services/events.service';
import { IdentityService } from 'src/app/pages/feeds/importdid/identity.service';

@Component({
  selector: 'app-importdid',
  templateUrl: './importdid.page.html',
  styleUrls: ['./importdid.page.scss'],
})
export class ImportdidPage implements OnInit {

  public mnemonic: string = '';
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;

  constructor(
    private native: NativeService,
    public popupProvider: PopupProvider,
    private modalCtrl: ModalController,
    private titleBarService: TitleBarService,
    public theme: ThemeService,
    private events: Events,
    private identityService: IdentityService,
  ) {
  }

  ngOnInit() {

  }

  ionViewWillEnter() {
    this.initTitle();

    this.events.subscribe(FeedsEvent.PublishType.startScan, () => {
      this.confirm();
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.startScan);
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      "你好火锅",
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);

    if (!this.theme.darkMode) {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "startScan", "assets/icon/edit.ico");
    } else {
      this.titleBarService.setTitleBarMoreMemu(this.titleBar, "startScan", "assets/icon/dark/edit.ico");
    }
  }

  async confirm() {
    let scanObj = await this.popupProvider.scan() || {};
    let scanData = scanObj["data"] || {};
    this.mnemonic = scanData["scannedText"] || "";
    console.log("mnemonic ============================= ", this.mnemonic)
    const pass = ""
    // const result = await this.identityService.startImportingMnemonic(mnemonic, pass)
    console.log("this.identityService ============================= ", this.identityService)
    const isValid = this.identityService.isMnemonicValid(this.mnemonic)
    console.log("结束 isMnemonicValid ===================== ", isValid)
    if (isValid) {
      this.native.navigateForward(['/prepare-didpage'], '')
    }
  }

  async promptPassPhrase() {
    let modal = await this.modalCtrl.create({
      component: MnemonicPassCheckComponent,
      componentProps: {
      },
      cssClass: 'didsessions-mnemonicpasscheck-component',
    });
    modal.onDidDismiss().then((params) => {
      this.native.navigateForward(['/prepare-didpage'], '');
    });
    await modal.present();
  }

  async jump() {
    this.native.navigateForward(['/prepare-didpage'], '');
  }

  async open() {
    this.promptPassPhrase()
  }

}
