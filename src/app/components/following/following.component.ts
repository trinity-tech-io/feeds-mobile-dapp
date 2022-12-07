import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { UtilService } from '../../services/utilService';
import { ViewHelper } from '../../services/viewhelper.service';
import { DataHelper } from '../../services/DataHelper';

@Component({
  selector: 'app-following',
  templateUrl: './following.component.html',
  styleUrls: ['./following.component.scss'],
})
export class FollowingComponent implements OnInit {
  @Output() fromChild = new EventEmitter();
  @Input() followingList: any = [];
  @Input() subscriptionV3NumMap: any = {};
  @Input() channelAvatarMap: any = {};
  @Input() channelPublicStatusList: any = {};
  @Input() pageType: string = "";
  @Input() userDid: string = "";
  @Output() toFollowPage = new EventEmitter();
  @Output() exploreFeeds = new EventEmitter();
  public showThreeDotMenu: boolean = true;
  constructor(
    public theme: ThemeService,
    private viewHelper: ViewHelper,
    private native: NativeService,
    private dataHelper: DataHelper,
  ) { }

  ngOnInit() {
    this.checkIfShowMenu();
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  navTo(destDid: string, channelId: string) {
    this.toFollowPage.emit({
      destDid: destDid,
      channelId: channelId,
      page: '/channels',
    });
  }

  checkUnreadNumber(destDid: string, channelId: string): number {
    // let nodeChannelId = this.feedService.getChannelId(destDid, channelId);
    // return this.feedService.getUnreadNumber(nodeChannelId);
    return 0;
  }

  read(destDid: string, channelId: string) {
    // let nodeChannelId = this.feedService.getChannelId(nodeId, channelId);
    // this.feedService.readChannel(nodeChannelId);
    return 0;
  }

  menuMore(channel: FeedsData.ChannelV3) {
    let channelName = channel.displayName || channel.name || '';
    this.fromChild.emit({
      destDid: channel.destDid,
      channelId: channel.channelId,
      channelName: channelName,
      postId: 0,
      tabType: 'myfollow',
    });
  }

  pressName(channelName: string) {
    let name = channelName || '';
    if (name != '' && name.length > 15) {
      this.viewHelper.createTip(name);
    }
  }

  clickExploreFeeds() {
    this.exploreFeeds.emit();
  }

  async checkIfShowMenu() {
    const userDid = (await this.dataHelper.getSigninData()).did
    if (this.userDid == userDid) {
      this.showThreeDotMenu = true;
    } else {
      this.showThreeDotMenu = false;
    }
  }
}
