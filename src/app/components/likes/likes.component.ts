import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Platform } from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { UtilService } from '../../services/utilService';
import { NativeService } from '../../services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from '../../services/AppService';
import { ViewHelper } from '../../services/viewhelper.service';
import { FeedsServiceApi } from '../../services/api_feedsservice.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { Events } from 'src/app/services/events.service';
import _ from 'lodash';
import { CommonPageService } from 'src/app/services/common.page.service';
import { FeedsPage } from 'src/app/pages/feeds/feeds.page';

@Component({
  selector: 'app-likes',
  templateUrl: './likes.component.html',
  styleUrls: ['./likes.component.scss'],
})
export class LikesComponent implements OnInit {
  @Input() likeList: any = [];
  @Input() isLoadVideoiamge: any = {};

  @Input() isImgLoading: any = {};
  @Input() isImgPercentageLoading: any = {};
  @Input() imgloadingStyleObj: any = {};
  @Input() imgPercent: number = 0;
  @Input() imgRotateNum: any = {};

  @Input() isVideoPercentageLoading: any = {};
  @Input() videoPercent: number = 0;
  @Input() videoRotateNum: any = {};
  @Input() isVideoLoading: any = {};
  @Input() videoloadingStyleObj: any = {};

  @Input() hideDeletedPosts: boolean = false;
  @Input() likeMap: any = {};
  @Input() likeNumMap: any = {};
  @Input() commentNumMap: any = {};
  @Input() channelNameMap: any = {};
  @Input() isLoadingLikeMap: any = {};
  @Input() handleDisplayNameMap: any = {};
  @Input() channelAvatarMap: any = {};
  @Input() postImgMap: any = {};
  @Input() postTime: any = {};
  @Input() isLoadingLike: boolean = true;

  @Output() fromChild = new EventEmitter();
  @Output() commentParams = new EventEmitter();
  @Output() clickImage = new EventEmitter();
  @Output() toPage = new EventEmitter();
  public styleObj: any = { width: '' };
  public maxTextSize = 240;
  public isPress: boolean = false;
  public isAndroid: boolean = true;

  constructor(
    private platform: Platform,
    public theme: ThemeService,
    private translate: TranslateService,
    private native: NativeService,
    private viewHelper: ViewHelper,
    public appService: AppService,
    private feedsServiceApi: FeedsServiceApi,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private events: Events,
    private feedspage: FeedsPage
  ) { }

  ngOnInit() {
    if (this.platform.is('ios')) {
      this.isAndroid = true;
    }
    this.styleObj.width = screen.width - 105 + 'px';
  }


  async getChannelName(destDid: string, channelId: string) {
    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
    if (channel === null) {
      return "";
    }
    const channelName = channel.displayName || channel.name || '';
    return channelName;
  }

  like(destDid: string, channelId: string, postId: string) {
    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    CommonPageService.likePost(
      destDid,
      channelId,
      postId,
      this.isLoadingLikeMap,
      this.likeMap,
      this.likeNumMap,
      this.hiveVaultController,
      this.dataHelper).then(() => {
        this.events.publish(FeedsEvent.PublishType.updateLikeList);
      });
  }

  getContentText(content: string): string {
    return this.feedsServiceApi.parsePostContentText(content);
  }

  getContentShortText(post: any): string {
    let content = post.content.content;
    let text = this.feedsServiceApi.parsePostContentText(content) || '';
    return text.substring(0, 180) + '...';
  }

  getPostContentTextSize(content: string) {
    let text = this.feedsServiceApi.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
  }

  navTo(destDid: string, channelId: string, postId: string) {
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.toPage.emit({
      destDid: destDid,
      channelId: channelId,
      page: '/channels',
    });
  }

  navToPostDetail(
    destDid: string,
    channelId: string,
    postId: string,
    event?: any,
  ) {
    if (this.isPress) {
      this.isPress = false;
      return;
    }
    event = event || '';
    if (event != '') {
      let e = event || window.event; //兼容IE8
      let target = e.target || e.srcElement; //判断目标事件
      if (target.tagName.toLowerCase() == 'span') {
        let url = target.textContent || target.innerText;
        let reg=/(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;
        var urlExp = new RegExp(reg);
        if(urlExp.test(url) === true){
          this.native.clickUrl(url, event);
        }else{//handle #
          this.pauseVideo(destDid + '-' + channelId + '-' + postId);
          this.toPage.emit({
            destDid: destDid,
            channelId: channelId,
            postId: postId,
            page: '/postdetail',
          });
          this.handlePostText(url, event);
        }
        return;
      }
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.toPage.emit({
      destDid: destDid,
      channelId: channelId,
      postId: postId,
      page: '/postdetail',
    });
  }

  async parseAvatar(destDid: string, channelId: string): Promise<string> {

    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;

    if (channel === null) return './assets/icon/reserve.svg';
    return channel.avatar;
  }

  handleDisplayTime(postId: string, createTime: number) {
    let newPostTime = this.postTime[postId] || null;
    if (newPostTime != null) {
      return this.postTime[postId];
    }
    let obj = UtilService.handleDisplayTime(createTime);
    if (obj.type === 's') {
      this.postTime[postId] = this.translate.instant('common.just');
      return this.postTime[postId];
    }
    if (obj.type === 'm') {
      if (obj.content === 1) {
        this.postTime[postId] = obj.content + this.translate.instant('HomePage.oneminuteAgo');
        return this.postTime[postId];
      }
      this.postTime[postId] = obj.content + this.translate.instant('HomePage.minutesAgo');
      return this.postTime[postId];
    }
    if (obj.type === 'h') {
      if (obj.content === 1) {
        this.postTime[postId] = obj.content + this.translate.instant('HomePage.onehourAgo');
        return this.postTime[postId];
      }
      this.postTime[postId] = obj.content + this.translate.instant('HomePage.hoursAgo');
      return this.postTime[postId];
    }

    if (obj.type === 'day') {
      if (obj.content === 1) {
        this.postTime[postId] = this.translate.instant('common.yesterday');
        return this.postTime[postId];
      }
      this.postTime[postId] = obj.content + this.translate.instant('HomePage.daysAgo');

      return this.postTime[postId];
    }
    this.postTime[postId] = obj.content;
    return this.postTime[postId];
  }

  async menuMore(destDid: string, channelId: string, postId: string) {
    let channelName = await this.getChannelName(destDid, channelId) || '';
    this.fromChild.emit({
      destDid: destDid,
      channelId: channelId,
      channelName: channelName,
      postId: postId,
      tabType: 'mylike',
    });
  }

  async pressName(destDid: string, channelId: string) {
    let name = await this.getChannelName(destDid, channelId);
    if (name != '') {
      if (name != '' && name.length > 15) {
        this.viewHelper.createTip(name);
      }
    }
  }

  pressOwerName(destDid: string, channelId: string) {

  }

  async showComment(destDid: string, channelId: string, postId: string) {

    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    // if (this.checkServerStatus(destDid) != 0) {
    //   this.native.toastWarn('common.connectionError1');
    //   return;
    // }
    let channelName = await this.getChannelName(destDid, channelId);
    this.commentParams.emit({
      destDid: destDid,
      channelId: channelId,
      postId: postId,
      channelAvatar: await this.parseAvatar(destDid, channelId),
      channelName: channelName,
    });
  }

  showBigImage(destDid: string, channelId: number, postId: number) {
    this.clickImage.emit({
      destDid: destDid,
      channelId: channelId,
      postId: postId,
      tabType: 'mylike',
    });
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'videolike') || '';
    let source: any = document.getElementById(id + 'sourcelike') || '';
    if (videoElement != '' && source != '') {
      videoElement.pause();
    }
  }

  pauseAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        this.pauseVideo(id);
      }
    }
  }

  handleTotal(post: any) {
    let videoThumbKey = post.content['videoThumbKey'] || '';
    let duration = 29;
    if (videoThumbKey != '') {
      duration = videoThumbKey['duration'] || 0;
    }
    return UtilService.timeFilter(duration);
  }

  pressContent(postContent: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }
    let text = this.feedsServiceApi.parsePostContentText(postContent);
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  async clickDashang(destDid: string, channelId: string, postId: string) {
    let connect = this.dataHelper.getNetworkStatus();
    if (connect === FeedsData.ConnState.disconnected) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(destDid, channelId) || null;
    let tippingAddress = '';
    if (tippingAddress != null) {
      tippingAddress = channel.tipping_address || '';
    }
    if (tippingAddress == '') {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(destDid + '-' + channelId + '-' + postId);
    this.viewHelper.showPayPrompt(destDid, channelId, tippingAddress);
  }

  handleName(post: FeedsData.PostV3) {
    let channelId: string = post.channelId;
    let name = this.channelNameMap[channelId] || '';
    if (name != '') {
      return name;
    }
  }

  timeline() {
    this.native.setRootRouter(['/tabs/home']);
    this.feedspage.home();
  }

  exploreFeeds() {
    this.native.setRootRouter(['/tabs/search']);
    this.feedspage.search();
  }

  handlePostText(url: string, event: any) {
      event.stopPropagation();
  }
}
