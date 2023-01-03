/*
 * @Author: liaihong 
 * @Date: 2022-10-14 14:59:51
 * @LastEditors: liaihong 
 * @LastEditTime: 2022-12-22 22:51:04
 * @FilePath: /feeds-mobile-dapp-2/src/app/pages/feeds/mnemonicPassCheckComponent/mnemonicpasscheck.component.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Component, OnInit, ViewChild } from '@angular/core';
import { IonInput, ModalController } from '@ionic/angular';
import { NativeService } from 'src/app/services/NativeService';
// import { Injectable, NgZone } from '@angular/core';

@Component({
  selector: 'mnemonicpasscheck',
  templateUrl: './mnemonicpasscheck.component.html',
  styleUrls: ['./mnemonicpasscheck.component.scss'],
})
export class MnemonicPassCheckComponent implements OnInit {
  @ViewChild('pwd', { static: false }) pwd: IonInput;

  public askedIfHasPassphrase: boolean = false;
  public password: string = "";
  public passwordConfirmation: string = "";

  constructor(
    public modalCtrl: ModalController,
    public native: NativeService,
  ) {
  }

  ngOnInit() {

  }

  ionViewDidEnter() {
  }

  passwordsMatch() {
    return this.password == this.passwordConfirmation;
  }

  setDelayedFocus(element) {
    setTimeout(() => {
      element.setFocus();
    }, 1000);
  }

  /**
   * User said he has a passphrase. So we want to ask him which one.
   */
  hasPassphrase() {
    this.askedIfHasPassphrase = true;

    this.modalCtrl.dismiss({
      password: this.password
    });

    // setTimeout(() => {
    //   this.pwd.setFocus();
    // }, 500);
  }

  noPassphrase() {

    this.modalCtrl.dismiss({
      password: this.password
    });
  }

  /**
   * Move text input focus to the given item
   */
  moveFocus(element, event: KeyboardEvent) {
    if (event.keyCode == 13) {  // Return
      element.setFocus();
    }
  }

  canSave() {
    return this.password != "" && this.passwordsMatch();
  }

  submit() {
    if (!this.canSave())
      return;

    this.modalCtrl.dismiss({
      password: this.password
    });
  }
}
