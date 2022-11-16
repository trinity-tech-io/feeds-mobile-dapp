import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
@Component({
  selector: 'app-alertdialog',
  templateUrl: './alertdialog.component.html',
  styleUrls: ['./alertdialog.component.scss'],
})
export class AlertdialogComponent implements OnInit {
  public title: string = '';
  public message: string = '';
  public okText: string = '';
  public confirm: any;
  public imgageName: string = '';
  public imgagePath: string = '';
  public imgageDarkPath: string = '';
  public that: any;
  public isShowHeight: boolean = false;
  constructor(public theme: ThemeService, private navParams: NavParams) {
    this.that = this.navParams.get('that');
    this.title =  this.navParams.get('title');
    this.message = this.navParams.get('message');
    this.okText = this.navParams.get('okText');
    this.confirm = this.navParams.get('okFunction');
    this.imgageName = this.navParams.get('imgageName');
    this.imgagePath = '/assets/images/' + this.imgageName;
    this.imgageDarkPath = '/assets/images/darkmode/' + this.imgageName;
    if(this.imgageName === 'finish.gif'){
        this.isShowHeight = true;
    }
  }

  ngOnInit() {}
}
