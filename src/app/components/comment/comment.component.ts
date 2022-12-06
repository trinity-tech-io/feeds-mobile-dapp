import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { IonTextarea, Platform } from '@ionic/angular';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { Events } from 'src/app/services/events.service';
import { DataHelper } from 'src/app/services/DataHelper';


@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
})
export class CommentComponent implements OnInit {
  @ViewChild('comment', { static: false }) comment: IonTextarea;

  @Input() public channelAvatar = '';
  @Input() public channelName = '';

  @Input() public destDid: string = '';
  @Input() public channelId: string = '';
  @Input() public postId: string = '0';
  @Input() public refcommentId: string = '0';
  @Input() public createrDid: string = '';

  @Output() hideComment: EventEmitter<boolean> = new EventEmitter<boolean>();

  public newComment = '';
  public isAndroid = '';
  public isBorder: boolean = false;
  public isBorderGradient: boolean = false;
  public clickButton: boolean = false;
  public avatar: string = '';
  private setFocusSid: any = null;
  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private platform: Platform,
    private hiveVaultController: HiveVaultController,
    private events: Events,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() {

    if (this.platform.is('ios')) {
      this.isAndroid = "ios";
    } else {
      this.isAndroid = "android";
    }
    this.parseAvatar();
    this.clearSetFocusSid();
    this.setFocusSid = setTimeout(() => {
      this.comment.setFocus();
      this.clearSetFocusSid();
    }, 500);
  }

  clearSetFocusSid() {
    if (this.setFocusSid != null) {
      clearTimeout(this.setFocusSid);
      this.setFocusSid = null;
    }
  }

  ionViewDidEnter() {


  }

  addImg() {
    this.native.toast('common.comingSoon');
  }

  async parseAvatar() {
    let avatarUri = this.channelAvatar;
    if (this.avatar === '') {
      this.avatar = './assets/images/loading.svg';
    }
    try {
      let avatar = await this.handleUserAvatar();
      this.avatar = avatar;
    } catch (error) {
      this.avatar = "./assets/images/did-default-avatar.svg";
    }
  }

  handleUserAvatar(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        this.hiveVaultController.getUserAvatar(this.createrDid).then((userAvatar: string) => {
          userAvatar =  userAvatar || '';
          resolve(userAvatar);
        }).catch((err)=>{
         let userAvatar = './assets/images/did-default-avatar.svg';
         resolve(userAvatar);
        });
      } catch (err) {
        let userAvatar = './assets/images/did-default-avatar.svg';
        resolve(userAvatar);
      }
    });
  }

  sendComment() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let newComment = this.native.iGetInnerText(this.newComment) || '';
    if (newComment === '') {
      this.native.toastWarn('CommentPage.inputComment');
      return false;
    }
    this.clickButton = true;
    this.native
      .showLoading('common.waitMoment')
      .then(() => {
        this.publishComment();
      })
      .catch(() => {
        this.clickButton = false;
        this.native.hideLoading();
      });
  }

  publishComment() {
    try {
      this.hiveVaultController.createComment(
        this.destDid,
        this.channelId,
        this.postId,
        this.refcommentId,
        this.newComment
      ).then((comment: FeedsData.CommentV3) => {
        this.native.hideLoading();
        this.clickButton = false;
        this.hideComponent();
        this.events.publish(FeedsEvent.PublishType.getCommentFinish, comment);
      }).catch((error) => {
        this.native.handleHiveError(error, 'common.createCommentFail');
        this.clickButton = false;
        this.native.hideLoading();
      })
    } catch (error) {
      this.native.handleHiveError(error, 'common.createCommentFail');
      this.clickButton = false;
      this.native.hideLoading();
    }

  }

  hideComponent() {
    this.clearSetFocusSid();
    this.hideComment.emit(true);
  }

  ionBlur() {
    this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
  }
}
