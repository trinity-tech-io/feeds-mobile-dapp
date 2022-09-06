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
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { UtilService } from 'src/app/services/utilService';

@Component({
  selector: 'app-repost',
  templateUrl: './repost.component.html',
  styleUrls: ['./repost.component.scss'],
})

export class RepostComponent implements OnInit {
  @ViewChild('comment', { static: false }) comment: IonTextarea;
  @Input() public repostChannelList: any = [];
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
  public repostChannel: FeedsData.ChannelV3 = null;
  public channelName: string = '';
  public channelAvatar = '';
  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private platform: Platform,
    private hiveVaultController: HiveVaultController,
    private events: Events,
    private dataHelper: DataHelper,
    private keyboard: Keyboard,
  ) { }

  async ngOnInit() {
    console.log("=========", this.repostChannelList);
    if (this.platform.is('ios')) {
      this.isAndroid = "ios";
    } else {
      this.isAndroid = "android";
    }

    let channel: FeedsData.ChannelV3 = this.dataHelper.getCurrentChannel() || null;
    this.repostChannel = channel;
    this.channelAvatar = channel.avatar || '';
    if (this.channelAvatar === "") {
      this.isBorder = true;
      this.channelAvatar = "./assets/images/default-contact.svg";
    } else {
      this.isBorder = false;
      this.parseAvatar();
    }

    let timer = setTimeout(() => {
      this.comment.setFocus();
      clearTimeout(timer);
      timer = null;
    }, 500);
  }

  ionViewDidEnter() {


  }

  addImg() {
    this.native.toast('common.comingSoon');
  }

  async parseAvatar() {
    let avatarUri = this.channelAvatar;
    this.channelAvatar = "./assets/icon/reserve.svg";
    let avatar = await this.handleChannelAvatar(avatarUri, this.destDid);
    this.channelAvatar = avatar;
  }

  handleChannelAvatar(channelAvatarUri: string, destDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let fileName: string = channelAvatarUri.split("@")[0];
        this.hiveVaultController.getV3Data(destDid, channelAvatarUri, fileName, "0")
          .then((result) => {
            let channelAvatar = result || '';
            resolve(channelAvatar);
          }).catch((err) => {
            resolve('');
          })
      } catch (err) {
        resolve('');
      }
    });

  }

  sendRepost() {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // let newComment = this.native.iGetInnerText(this.newComment) || '';
    // if (newComment === '') {
    //   this.native.toastWarn('CommentPage.inputComment');
    //   return false;
    // }

    this.clickButton = true;
    this.native
      .showLoading('common.waitMoment')
      .then(async () => {
        console.log("click========", this.repostChannel);
        let postText = this.native.iGetInnerText(this.newComment) || '';


        const repostUrl = UtilService.generateFeedsPostLink(this.destDid, this.channelId, this.postId);
        const tag: string = '';
        await this.hiveVaultController.repost(this.destDid, this.channelId, postText, repostUrl, tag);

        this.native.hideLoading();
        this.clickButton = false;
        this.hideComponent();
      })
      .catch(() => {
        this.clickButton = false;
        this.native.hideLoading();
      });
  }

  hideComponent() {
    this.hideComment.emit(true);
  }

  ionBlur() {
    this.isBorderGradient = false;
    if (this.keyboard.isVisible) {
      // console.log("===========test");
      // this.keyboard.show();
      return;
    }
  }

  ionFocus() {
    this.isBorderGradient = true;
  }

  handleSelect(event: any) {
    let channel = event.detail.value;
    this.channelAvatar = channel.avatar || '';
    if (this.channelAvatar === "") {
      this.isBorder = true;
      this.channelAvatar = "./assets/images/default-contact.svg";
    } else {
      this.isBorder = false;
      this.parseAvatar();
    }
  }

  compareWith(o1: FeedsData.ChannelV3, o2: FeedsData.ChannelV3) {
    return o1 && o2 ? o1.channelId === o2.channelId : o1 === o2;
  }

}
