import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { ThemeService } from '../../services/theme.service';
import { UtilService } from '../../services/utilService';
import { PopupProvider } from '../../services/popup';
import { ViewHelper } from '../../services/viewhelper.service';
import { DataHelper } from 'src/app/services/DataHelper';

@Component({
  selector: 'app-myfeeds',
  templateUrl: './myfeeds.component.html',
  styleUrls: ['./myfeeds.component.scss'],
})
export class MyfeedsComponent implements OnInit {
  @Output() fromChild = new EventEmitter();
  @Input() pageName: string = '';
  @Input() isOwner: boolean = true;
  @Input() channels: any = [];
  @Input() isLoadingMyFeeds: boolean = true;
  @Input() followers= 0;
  @Input() subscriptionV3NumMap: any = {};
  @Input() channelAvatarMap:any = {};
  @Input() channelPublicStatusList = {};
  @Output() toFeedPage = new EventEmitter();
  @Output() subsciptions = new EventEmitter();
  @Output() chanelCollections = new EventEmitter();
  public popover: any = '';
  public avatarList:any = '';
  constructor(
    private dataHelper: DataHelper,
    public theme: ThemeService,
    private native: NativeService,
    private viewHelper: ViewHelper,
    public popupProvider: PopupProvider,
    private feedService: FeedService
  ) {}

  ngOnInit() {
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  createNewFeed() { // 创建频道
    this.checkDid();
  }

  navTo(destDid: string, channelId: number) {
    this.toFeedPage.emit({
      destDid: destDid,
      channelId: channelId,
      page: '/channels',
    });
  }

  menuMore(destDid: string, channelId: number, channelName: string) {
    this.fromChild.emit({
      destDid: destDid,
      channelId: channelId,
      channelName: channelName,
      postId: 0,
      tabType: 'myfeeds',
    });
  }

  pressName(channelName: string) {
    let name = channelName || '';
    if (name != '' && name.length > 15) {
      this.viewHelper.createTip(name);
    }
  }

  checkDid() {
    this.dataHelper.setProfileIamge('assets/images/profile-0.svg');
    this.dataHelper.setSelsectIndex(1);

    this.native.navigateForward(['/createnewfeed'], '');
  }

  exploreFeeds() {
    this.native.setRootRouter(['/tabs/search']);
    this.feedService.setCurTab('search');
  }

  clickFollowing() {
    this.subsciptions.emit();
  }

  clickChanelCollections() {
    this.chanelCollections.emit();
  }
}
