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
    if(this.channelAvatar === ""){
      this.isBorder = true;
      this.avatar = "./assets/images/default-contact.svg";
    }else{
      this.isBorder = false;
      this.parseAvatar();
    }

    this.clearSetFocusSid();
    this.setFocusSid = setTimeout(() => {
      this.comment.setFocus();
      this.clearSetFocusSid();
    },500);
  }

  clearSetFocusSid() {
    if(this.setFocusSid != null ){
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
    this.avatar = "./assets/images/default-contact.svg";
    try {
      let avatar = await this.handleChannelAvatar(avatarUri,this.destDid);
      this.avatar = avatar;
    } catch (error) {

    }
  }

  handleChannelAvatar(channelAvatarUri: string,destDid: string): Promise<string>{
    return new Promise(async (resolve, reject) => {
      try {
        let fileName:string = channelAvatarUri.split("@")[0];
        this.hiveVaultController.getV3Data(destDid,channelAvatarUri,fileName,"0")
        .then((result)=>{
           let channelAvatar = result || '';
           resolve(channelAvatar);
        }).catch((err)=>{
          resolve('./assets/images/default-contact.svg');
        })
      }catch(err){
        resolve('./assets/images/default-contact.svg');
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
      ).then((comment: FeedsData.CommentV3)=>{
        this.native.hideLoading();
        this.clickButton = false;
        this.hideComponent();
        this.events.publish(FeedsEvent.PublishType.getCommentFinish,comment);
      }).catch((error)=>{
        this.native.handleHiveError(error,'common.createCommentFail');
        this.clickButton = false;
        this.native.hideLoading();
      })
    } catch (error) {
      this.native.handleHiveError(error,'common.createCommentFail');
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
