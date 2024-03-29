import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { IonTextarea } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from '@ngx-translate/core';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import _ from 'lodash';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { UtilService } from 'src/app/services/utilService';

@Component({
  selector: 'app-editcomment',
  templateUrl: './editcomment.page.html',
  styleUrls: ['./editcomment.page.scss'],
})
export class EditCommentPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('newPostIonTextarea', { static: false })
  newPostIonTextarea: IonTextarea;
  public channelAvatar = '';
  public channelName = '';
  public subscribers: string = '';
  public newComment: string = '';
  public oldNewComment: string = '';
  public destDid: string = '';
  public channelId: string = "";
  public postId: string = "";
  public refcommentId: string = "0";
  public commentId: string = "";
  public imgUrl: string = '';
  public titleKey: string = '';
  public clickButton: boolean = false;
  public isBorderGradient: boolean = false;
  private setFocusSid: any = null;
  private createrDid: string = null;
  private userDid: string = null;
  constructor(
    private native: NativeService,
    private acRoute: ActivatedRoute,
    public theme: ThemeService,
    private translate: TranslateService,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper,
    private hiveVaultController: HiveVaultController,
    private dataHelper: DataHelper
  ) { }

  ngOnInit() {
    this.acRoute.queryParams.subscribe(data => {
      let item = _.cloneDeep(data);
      this.destDid = item.destDid;
      this.channelId = item.channelId;
      this.postId = item.postId;
      this.refcommentId = item.refcommentId;
      this.commentId = item.commentId;
      this.createrDid = item.createrDid;
      let content = item.content || '';
      this.titleKey = item.titleKey;
      this.getContent(content);
    });
    this.clearSetFocusSid();
    this.setFocusSid = setTimeout(() => {
      this.newPostIonTextarea.setFocus();
      this.clearSetFocusSid();
    }, 500);
  }

  clearSetFocusSid() {
    if (this.setFocusSid != null) {
      clearTimeout(this.setFocusSid);
      this.setFocusSid = null;
    }
  }

  async ionViewWillEnter() {
    this.initTitle();
    this.userDid = (await this.dataHelper.getSigninData()).did;
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(this.destDid, this.channelId);
    //this.channelName = channel['displayName'] || channel['name'] || '';
    try {
      this.getDisplayName(this.userDid);
    } catch (error) {

    }
    this.subscribers = channel['subscribers'] || '';
    this.handleChannelAvatar(this.userDid);
  }

  async getDisplayName(userDid: string) {
    let text = userDid.replace('did:elastos:', '');
    this.channelName = UtilService.shortenDid(text);
    this.hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
      const name = userProfile.name || userProfile.resolvedName || userProfile.displayName
      if (name) {
        this.channelName = name;
      }
    }).catch(() => {
    })
  }

  ionViewDidEnter() {
  }

  handleChannelAvatar(userDid: string) {
    if (this.channelAvatar === '') {
      this.channelAvatar = './assets/images/loading.svg';
    }
    try {
      this.hiveVaultController.getUserAvatar(userDid).then((userAvatar: string) => {
        userAvatar = userAvatar || '';
        if (userAvatar != '') {
          this.channelAvatar = userAvatar;
        } else {
          this.channelAvatar = './assets/images/did-default-avatar.svg';
        }
      }).catch((err) => {
        this.channelAvatar == './assets/images/did-default-avatar.svg';
      });
    } catch (err) {
      this.channelAvatar == './assets/images/did-default-avatar.svg';
    }
  }

  ionViewWillLeave() {
    this.clearSetFocusSid();
  }

  newPostTextArea() {
    this.newPostIonTextarea.setFocus();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant(this.titleKey),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  async publishComment() {

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

    if (this.newComment === this.oldNewComment) {
      this.native.toastWarn('EditCommentPage.notModifiedYet');
      return false;
    }

    this.clickButton = true;
    await this.native.showLoading('common.waitMoment');
    this.editComment();
  }

  private async editComment() {
    try {

      const originComment = await this.dataHelper.getCommentV3ById(this.commentId);
      this.hiveVaultController.updateComment(originComment, this.newComment)
        .then(() => {
          let postId: string = originComment.postId;
          let refcommentId: string = originComment.refcommentId;
          let commentList = this.dataHelper.getcachedCommentList(postId, refcommentId) || [];
          let index = _.findIndex(commentList, (item: FeedsData.CommentV3) => {
            return item.destDid === this.destDid &&
              item.channelId === this.channelId &&
              item.postId === this.postId &&
              item.commentId === this.commentId;
          });
          if (index > -1) {
            commentList[index].content = this.newComment;
            commentList[index].status = FeedsData.PostCommentStatus.edited;
          }
          this.native.hideLoading();
          this.clickButton = false;
          this.native.pop();

        }).catch((error) => {
          this.native.handleHiveError(error, 'common.editCommentFail');
          this.clickButton = false;
          this.native.hideLoading();
        })
    } catch (error) {
      this.native.handleHiveError(error, 'common.editCommentFail');
      this.clickButton = false;
      this.native.hideLoading();
    }
  }


  pressName(channelName: string) {
    this.viewHelper.createTip(channelName);
  }

  getContent(content: string) {
    this.newComment = content;
    this.oldNewComment = content;
  }

  addImg() {
    this.native.toast('common.comingSoon');
  }

  ionBlur() {
    this.isBorderGradient = false;
  }

  ionFocus() {
    this.isBorderGradient = true;
  }
}
