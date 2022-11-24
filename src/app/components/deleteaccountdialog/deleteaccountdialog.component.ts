import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { DataHelper } from 'src/app/services/DataHelper';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-deleteaccountdialog',
  templateUrl: './deleteaccountdialog.component.html',
  styleUrls: ['./deleteaccountdialog.component.scss'],
})
export class DeleteaccountdialogComponent implements OnInit {
  public title: string = '';
  public message: string = '';
  public okText: string = '';
  public cancelText: string = '';
  public cancel: any;
  public confirm: any;
  public that: any;
  public imgPath: string = '';
  public userName: string = '';
  public originUserName: string = '';
  constructor(
    public theme: ThemeService,
    private navParams: NavParams,
    private dataHelper: DataHelper) {
    this.that = this.navParams.get('that');
    this.title = this.navParams.get('title') || 'common.confirmDialog';
    this.message = this.navParams.get('message');
    this.okText = this.navParams.get('okText');

    this.cancelText = this.navParams.get('cancelText');

    console.log("test"+this.cancelText);

    this.cancel = this.navParams.get('cancelFunction');
    this.confirm = this.navParams.get('okFunction');
    this.imgPath =
      this.navParams.get('imgageName') || './assets/images/tskth.svg';
  }

  async ngOnInit() {
    this.originUserName = (await this.dataHelper.getSigninData()).name || '';
  }
}

