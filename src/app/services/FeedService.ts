import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { StorageService } from 'src/app/services/StorageService';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from 'src/app/services/NativeService';
import { SerializeDataService } from 'src/app/services/SerializeDataService';
import { JWTMessageService } from 'src/app/services/JWTMessageService';
import { ConnectionService } from 'src/app/services/ConnectionService';
import { FormatInfoService } from 'src/app/services/FormatInfoService';
import { SessionService } from 'src/app/services/SessionService';
import { PopupProvider } from 'src/app/services/popup';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { AddFeedService } from 'src/app/services/AddFeedService';
import { IntentService } from 'src/app/services/IntentService';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';

import { PasarAssistService } from 'src/app/services/pasar_assist.service';
import { UserDIDService } from 'src/app/services/userdid.service';
import { PostHelperService } from 'src/app/services/post_helper.service';

import _ from 'lodash';
import { DataHelper } from './DataHelper';

import { Config } from './config';
import { Logger } from './logger';
import { IPFSService } from './ipfs.service';
import { HiveService } from 'src/app/services/HiveService';
import { FeedsServiceApi } from 'src/app/services/api_feedsservice.service';
import { UtilService } from './utilService';
import { FeedsUtil } from './feeds_util.service';
import { DIDHelperService } from 'src/app/services/did_helper.service';

const TAG: string = 'Feeds-service';
declare let didManager: DIDPlugin.DIDManager;

let bindingServerCache: FeedsData.Server;
let cacheBindingAddress: string = '';


let expDay = 10;
let eventBus: Events = null;

export class DidData {
  constructor(
    public did: string,
    public carrierAddress: string,
    public serviceId: string,
  ) { }
}

export class SignInData {
  constructor(
    public did: string,
    public name: string,
    public avatar: Avatar,
    public email: string,
    public telephone: string,
    public location: string,
    public nickname: string,
    public description: string,
    public expiresTS: number,
  ) { }
}

export class Avatar {
  contentType: string;
  data: string;
  type?: string;
}

@Injectable()
export class FeedService {
  private whiteListData: FeedsData.WhiteItem[] = [];
  private nftFirstdisclaimer: string = "";
  public elaUsdPrice: string = "";
  public selsectNftImage: string = "";
  private pasarListGrid: boolean = false;
  private collectibleStatus: any = {};
  public bindPublisherAccountType: string = '';
  public discoverfeeds: any = [];
  public currentFeed: any = null;
  public feedPublicStatus: any = {};
  public developerMode: boolean = false;
  public hideDeletedPosts: boolean = false;
  public hideDeletedComments: boolean = false;
  public hideOfflineFeeds: boolean = true;
  public currentLang: string = '';
  public curtab: string = 'home';
  public channelInfo: any = {};
  private nonce = '';
  private realm = '';
  private serviceNonce = '';
  private serviceRealm = '';
  private profileIamge = 'assets/images/profile-1.svg';
  private clipProfileIamge = '';
  private selsectIndex = 1;
  private carrierStatus: FeedsData.ConnState = FeedsData.ConnState.disconnected;
  private networkStatus: FeedsData.ConnState = FeedsData.ConnState.connected;

  private lastConnectionStatus = FeedsData.ConnState.disconnected;
  private isLogging: { [nodeId: string]: boolean } = {};
  private signinChallengeTimeout: NodeJS.Timer;
  private isSavingChannel: boolean = false;
  private lastMultiLikesAndCommentsCountUpdateMapCache: {
    [key: string]: FeedsData.LikesAndCommentsCountUpdateTime;
  };

  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private alertPopover: HTMLIonPopoverElement = null;

  public constructor(
    private serializeDataService: SerializeDataService,
    private jwtMessageService: JWTMessageService,
    private platform: Platform,
    private events: Events,
    private jsonRPCService: JsonRPCService,
    // private carrierService: CarrierService,
    private native: NativeService,
    private translate: TranslateService,
    private storeService: StorageService,
    private connectionService: ConnectionService,
    private formatInfoService: FormatInfoService,
    private sessionService: SessionService,
    private popupProvider: PopupProvider,
    private standardAuth: StandardAuthService,
    private addFeedService: AddFeedService,
    private dataHelper: DataHelper,
    private intentService: IntentService, //public  theme:ThemeService
    private ipfsService: IPFSService,
    private nftContractHelperService: NFTContractHelperService,
    private pasarAssistService: PasarAssistService,
    private userDIDService: UserDIDService,
    private hiveService: HiveService,
    private postHelperService: PostHelperService,
    private feedsServiceApi: FeedsServiceApi,
    private feedsUtil: FeedsUtil,
    private didHelperService: DIDHelperService
  ) {
    eventBus = events;
    this.init();
  }

  init() {
    this.initCallback();
  }

  initDidManager() {
    didManager.initDidStore('anything', null);
    this.setEidURL(Config.EID_RPC);
    Logger.log(TAG, 'Eid RPC is', Config.EID_RPC);
  }

  getNetworkStatus(): FeedsData.ConnState {
    return this.networkStatus;
  }

  getCarrierStatus(): FeedsData.ConnState {
    return this.carrierStatus;
  }

  public setSelsectIndex(index: any) {
    this.selsectIndex = index;
  }

  public getSelsectIndex() {
    return this.selsectIndex;
  }

  // public setProfileIamge(url: string) {
  //   this.profileIamge = url;
  // }

  // public getProfileIamge() {
  //   return this.profileIamge;
  // }

  // public setClipProfileIamge(clipProfileIamge: string) {
  //   return (this.clipProfileIamge = clipProfileIamge);
  // }

  // public getClipProfileIamge() {
  //   return this.clipProfileIamge;
  // }

  loadPostData() {
    return this.dataHelper.loadPostMap();
  }

  loadChannelData() {
    return this.dataHelper.loadChannelsMap();
  }

  loadCredential() {
    return this.dataHelper.loadLocalCredential();
  }

  loadLastPostUpdate() {
    return this.dataHelper.loadLastPostUpdateMap();
  }

  loadServersStatus() {
    return this.dataHelper.loadServersStatus();
  }

  loadServerStatistics() {
    return this.dataHelper.loadServerStatisticsMap();
  }

  loadServers() {
    return this.dataHelper.loadServerMap();
  }

  loadComments() {
    return this.dataHelper.loadCommentsMap();
  }

  loadUnreadMap() {
    return this.dataHelper.loadUnreadMap();
  }

  loadLikeMap() {
    return this.dataHelper.loadLikeMap();
  }

  loadAccessTokenMap() {
    return this.dataHelper.loadAccessTokenMap();
  }

  loadBindingServer() {
    return this.dataHelper.loadBindingServer();
  }

  loadNotificationList() {
    return this.dataHelper.loadNotificationList();
  }

  loadLikeCommentMap() {
    return this.dataHelper.loadCommentsMap();
  }

  loadLastCommentUpdateMap() {
    return this.dataHelper.loadLastCommentUpdateMap();
  }

  loadLastSubscribedFeedUpdateMap() {
    return this.dataHelper.loadLastSubscribedFeedsUpdateMap();
  }

  loadLastMultiLikesAndCommentsCountUpdateMap() {
    return this.dataHelper.loadLastMultiLikesAndCommentsCountUpdateMap();
  }

  loadSyncCommentStatusMap() {
    return this.dataHelper.loadSyncCommentStatusMap();
  }

  loadSyncPostStatusMap() {
    return this.dataHelper.loadSyncPostStatusMap();
  }

  loadServerVersions() {
    return this.dataHelper.loadServerVersion();
  }

  loadTempIdData() {
    return this.dataHelper.loadTempIdData();
  }

  loadTempData() {
    return this.dataHelper.loadTempData();
  }

  loadPasarItemList() {
    return this.dataHelper.loadPasarItemList();
  }

  loadDidMapper() {
    return this.dataHelper.loadDidMapper();
  }

  async loadData() {
    await Promise.all([
      this.loadTempIdData(),
      this.loadTempData(),
      this.loadServerVersions(),
      this.loadPostData(),
      this.loadChannelData(),
      this.loadCredential(),
      this.loadLastPostUpdate(),
      this.loadServersStatus(),
      this.loadServerStatistics(),
      this.loadServers(),
      this.loadComments(),
      this.loadUnreadMap(),
      this.loadLikeMap(),
      this.loadAccessTokenMap(),
      this.loadBindingServer(),
      this.loadNotificationList(),
      this.loadLikeCommentMap(),
      this.loadLastCommentUpdateMap(),
      this.loadLastSubscribedFeedUpdateMap(),
      this.loadSyncCommentStatusMap(),
      this.loadSyncPostStatusMap(),
      this.loadLastMultiLikesAndCommentsCountUpdateMap(),
      this.loadPasarItemList(),
      this.loadDidMapper()
    ]);
  }

  initCallback() {
    this.networkstatusChangedCallback();
    this.carrierReadyCallback();
    this.friendAddCallback();
    this.friendConnectionCallback();
    this.friendMessageCallback();
    this.connectionChangedCallback();
    this.onReceivedStreamStateChanged();
    this.onReceivedSetBinaryFinish();
    this.onReceivedSessionErrorCallback();
  }

  getConnectionStatus(): FeedsData.ConnState {
    return this.dataHelper.getConnectionStatus();
  }

  getServerList(): FeedsData.Server[] {
    return this.dataHelper.getServerList();
  }

  getOtherServerList(): FeedsData.Server[] {
    return this.dataHelper.getOtherServerList();
  }

  getCreationServerList(): FeedsData.Server[] {
    let list: FeedsData.Server[] = [];
    let bindServer = this.dataHelper.getBindingServer();
    if (bindServer != null && bindServer != undefined) list.push(bindServer);
    return list;
  }

  getServerStatusFromId(nodeId: string): number {
    return this.dataHelper.getServerStatusStatus(nodeId);
  }

  getServerStatisticsNumber(nodeId: string): number {
    return this.dataHelper.getServerStatisticsNumber(nodeId);
  }

  getMyChannelList() {
    let bindingServer = this.getBindingServer();
    if (bindingServer == null || bindingServer == undefined) return [];
    return this.dataHelper.getMyChannelList(bindingServer.nodeId);
  }

  getUnreadNumber(nodeChannelId: string): number {
    return this.dataHelper.getUnreadNumber(nodeChannelId);
  }

  readChannel(nodeChannelId: string) {
    this.dataHelper.readMsg(nodeChannelId);
  }

  getChannelsList(): FeedsData.Channels[] {
    return this.dataHelper.getChannelsList();
  }

  getFollowedChannelList(): FeedsData.Channels[] {
    let list = this.dataHelper.getSubscribedFeedsList();
    let sortArr = [];

    sortArr = _.sortBy(list, (item: any) => {
      return -Number(item.last_update);
    });

    return sortArr;
  }

  getChannelsListFromNodeId(nodeId: string): FeedsData.Channels[] {
    return this.dataHelper.getChannelsListFromNodeId(nodeId);
  }

  getAllChannelDetails(nodeId: string) {
    let list = this.getChannelsList();
    for (let index = 0; index < list.length; index++) {
      let channel = list[index];
      if (nodeId == channel.nodeId)
        this.feedsServiceApi.getChannelDetail(channel.nodeId, channel.id);
    }
  }

  createTopic(nodeId: string, channel: string, desc: string, avatar: any) {
    this.feedsServiceApi.createChannel(nodeId, channel, desc, avatar);
  }

  carrierReadyCallback() {
    this.events.subscribe(FeedsEvent.PublishType.carrierReady, () => {
      this.restoreRelation();
    });

    // if need readd feeds , open this code
    // let list = this.addFeedService.getToBeAddedFeedsList();
    // for (let index = 0; index < list.length; index++) {
    //   const tobeAddedFeeds = list[index];
    //   this.addFeed(tobeAddedFeeds.feedUrl, tobeAddedFeeds.avatar, tobeAddedFeeds.follower, tobeAddedFeeds.feedName);
    // }
  }

  restoreRelation() {
    this.storeService.get('SelfAddress').then(address => {
      let realAddress = address;
      // let newAddress = this.carrierService.getAddress();

      // if (realAddress != newAddress) {
      //   this.storeService.set('SelfAddress', newAddress);
      //   let serverList = this.getServerList();
      //   for (let index = 0; index < serverList.length; index++) {
      //     let carrierAddress = serverList[index].carrierAddress || '';
      //     this.carrierService.addFriend(
      //       carrierAddress,
      //       'hi',
      //       () => { },
      //       err => { },
      //     );
      //   }
      // }
    });
  }

  friendConnectionCallback() {
    this.events.subscribe(
      FeedsEvent.PublishType.carrierFriendConnection,
      ret => {
        let friendId = ret.friendId;
        let friendStatus = ret.status;
        Logger.log(TAG, 'Friend is', friendId, ' connection changed to ', friendStatus);
        let friendConnectionChangedData: FeedsEvent.FriendConnectionChangedData = {
          nodeId: friendId,
          connectionStatus: friendStatus,
        };
        eventBus.publish(
          FeedsEvent.PublishType.friendConnectionChanged,
          friendConnectionChangedData,
        );

        if (
          this.connectionService.friendConnectionMap == null ||
          this.connectionService.friendConnectionMap == undefined
        )
          this.connectionService.friendConnectionMap = {};

        this.connectionService.friendConnectionMap[friendId] = friendStatus;

        let serverStatus = this.dataHelper.generateServerStatus(
          friendId,
          '',
          friendStatus,
        );
        this.dataHelper.updateServerStatus(friendId, serverStatus);

        if (friendStatus == FeedsData.ConnState.connected)
          this.getServerVersion(friendId);
      },
    );
  }

  doFriendConnection(friendId: string) {
    let accessToken = this.dataHelper.getAccessToken(friendId) || null;
    if (this.feedsServiceApi.checkExp(accessToken)) {
      Logger.log(TAG, 'Prepare signin server, access token expired, server nodeId is ', friendId);
      this.feedsServiceApi.signinChallengeRequest(friendId, true);
    } else {
      Logger.log(TAG, 'Prepare connect, nodeId is ', friendId, ' access token is ', accessToken);
      this.prepare(friendId);
    }

    eventBus.publish(FeedsEvent.PublishType.serverConnectionChanged);
  }

  friendAddCallback() {
    this.events.subscribe(FeedsEvent.PublishType.carrierFriendAdded, msg => {
      let status: FeedsData.ConnState = msg.friendInfo.status;
      let nodeId = msg.friendInfo.userInfo.userId;
      if (this.dataHelper.isBindingServer(nodeId)) return;

      let server = this.feedsServiceApi.getServerbyNodeId(nodeId);
      if (server != null && server != undefined)
        this.resolveServer(server, status);
    });
  }

  resolveServer(server: FeedsData.Server, status: FeedsData.ConnState) {
    let serverStatistic = this.dataHelper.generateEmptyStatistics(server.did);
    this.dataHelper.updateServerStatistics(server.nodeId, serverStatistic);
    this.dataHelper.updateServer(server.nodeId, server);
    eventBus.publish(
      FeedsEvent.PublishType.updateServerList,
      this.getServerList(),
    );
  }

  connectionChangedCallback() {
    this.events.subscribe(
      FeedsEvent.PublishType.carrierConnectionChanged,
      status => {
        this.carrierStatus = status;
        this.processConnetionStatus();
      },
    );
  }

  networkstatusChangedCallback() {
    this.events.subscribe(
      FeedsEvent.PublishType.networkStatusChanged,
      status => {
        this.networkStatus = status;
        this.processConnetionStatus();
      },
    );
  }

  processConnetionStatus() {
    let networkStatus: number = this.getNetworkStatus();
    let carrierStatus: number = this.getCarrierStatus();
    if (
      networkStatus == FeedsData.ConnState.connected &&
      carrierStatus == FeedsData.ConnState.connected
    ) {
      this.dataHelper.setConnectionStatus(FeedsData.ConnState.connected);
    } else if (
      networkStatus == FeedsData.ConnState.disconnected ||
      carrierStatus == FeedsData.ConnState.disconnected
    ) {
      this.dataHelper.setConnectionStatus(FeedsData.ConnState.disconnected);
    }
    let connectionStatus = this.dataHelper.getConnectionStatus();

    if (this.lastConnectionStatus != connectionStatus) {
      this.lastConnectionStatus = connectionStatus;
      eventBus.publish(
        FeedsEvent.PublishType.connectionChanged,
        connectionStatus,
      );
    }
  }

  handleError(nodeId: string, error: any) {
    //eventBus.publish(FeedsEvent.PublishType.rpcResponseError);
    if (typeof error == 'string')
      this.native.toastWarn(
        this.formatInfoService.formatErrorMsg(nodeId, error),
      );
    else {
      this.processGeneralError(nodeId, error.code);
      return;
    }
  }

  handleResult(
    method: string,
    nodeId: string,
    result: any,
    request: any,
    error: any,
  ) {
    let requestParams = request.requestParams;
    switch (method) {
      // 在这里存到了本地
      case FeedsData.MethodType.create_channel:
        this.handleCreateChannelResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.publish_post:
        this.handlePublishPostResult(
          nodeId,
          result,
          requestParams,
          error,
          request.memo,
        );
        break;
      case FeedsData.MethodType.post_comment:
        this.handlePostCommentResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.post_like:
        this.handlePostLikeResult(nodeId, request, error);
        break;
      case FeedsData.MethodType.post_unlike:
        this.handlePostUnLikeResult(nodeId, request, error);
        break;
      case FeedsData.MethodType.get_my_channels:
        this.handleGetMyChannelsResult(nodeId, result, error);
        break;
      case FeedsData.MethodType.get_channels:
        this.handleGetChannelsResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.get_channel_detail:
        this.handleGetChannelDetailResult(nodeId, result, error);
        break;
      case FeedsData.MethodType.get_subscribed_channels:
        this.handleGetSubscribedChannelsResult(
          nodeId,
          result,
          requestParams,
          error,
        );
        break;
      case FeedsData.MethodType.get_posts:
        this.handleGetPostsResult(nodeId, result, request, error);
        break;
      case FeedsData.MethodType.get_comments:
        this.handleGetCommentsResult(nodeId, result, request, error);
        break;
      case FeedsData.MethodType.get_statistics:
        this.handleGetStatisticsResult(nodeId, result, error);
        break;
      case FeedsData.MethodType.subscribe_channel:
        this.handleSubscribeChannelResult(nodeId, result, requestParams, error);
        break;
      case FeedsData.MethodType.unsubscribe_channel:
        this.handleUnsubscribeChannelResult(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.declare_post:
        this.handleDeclarePostResult(
          nodeId,
          result,
          requestParams,
          error,
          request.memo,
        );
        break;

      case FeedsData.MethodType.notify_post:
        this.handleNotifyPostResult(
          nodeId,
          result,
          requestParams,
          error,
          request.memo,
        );
        break;

      case 'update_feedinfo':
        this.handleEditFeedInfo(nodeId, requestParams, error);
        break;
      case FeedsData.MethodType.enable_notification:
        this.handleEnableNotificationResult(nodeId, error);
        break;
      case 'issue_credential':
        this.handleIssueCredentialResponse(nodeId, result, error);
        break;
      case 'signin_confirm_challenge':
        this.handleSigninConfirm(nodeId, result, error);
        break;

      case FeedsData.MethodType.editPost:
        this.handleEditPost(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.deletePost:
        this.handleDeletePost(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.editComment:
        this.handleEditComment(nodeId, requestParams, error);
        break;
      case FeedsData.MethodType.deleteComment:
        this.handleDeleteComment(nodeId, requestParams, error);
        break;

      case FeedsData.MethodType.getServerVersion:
        this.handleGetServerVersion(nodeId, result, error);
        break;

      case FeedsData.MethodType.updateCredential:
        this.handleUpdateCredentialResponse(
          nodeId,
          result,
          requestParams,
          error,
        );
        break;

      case FeedsData.MethodType.setBinary:
        this.handleSetBinaryResponse(
          nodeId,
          result,
          requestParams,
          error,
          request.memo,
        );
        break;

      case FeedsData.MethodType.getBinary:
        this.handleGetBinaryResponse(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.standard_did_auth:
        this.handleStandardDidAuthResponse(
          nodeId,
          result,
          requestParams,
          error,
        );
        break;

      case FeedsData.MethodType.get_multi_comments:
        this.handleGetMultiComments(nodeId, result, requestParams, error);
        break;

      case FeedsData.MethodType.get_multi_subscribers_count:
        this.handleGetMultiSubscribesCount(
          nodeId,
          result,
          requestParams,
          error,
        );
        break;

      case FeedsData.MethodType.get_multi_likes_and_comments_count:
        this.handleGetMultiLikesAndCommentsCount(
          nodeId,
          result,
          requestParams,
          error,
        );
        break;
      default:
        break;
    }
  }

  friendMessageCallback() {
    this.events.subscribe(FeedsEvent.PublishType.jrpcReceiveMessage, result => {
      console.log("FeedsEvent.PublishType.jrpcReceiveMessage")
      switch (result.type) {
        case -1:
          alert(result.error.code + ':' + result.error.message);
          break;
        case 1:
          this.handleNotification(result.nodeId, result.method, result.params); //TODO
          break;
        case 0:
          if (result.request.memo.callbackMethod == FeedsData.CallbackMethod.SyncFeedsServiceData) {
            eventBus.publish(FeedsEvent.PublishType.migrateDataToHive, result);
          } else {
            this.handleResult(
              result.method,
              result.nodeId,
              result.result,
              result.request,
              result.error,
            );
          }
          break;
      }
    });
  }

  checkDIDValidity() { }

  parseDid(feedUrl: string): DidData {
    let startIndex = feedUrl.indexOf('did:elastos:');
    if (!feedUrl.startsWith('feeds://') || startIndex == -1) {
      return null;
    }

    let hashPos = feedUrl.indexOf('#');
    let backSlashPos = feedUrl.lastIndexOf('/');

    // feeds://did:elastos:ixxxxxxx/1234carrieraddress5678
    if (hashPos == -1 && backSlashPos > 7) {
      let carrierAddress = this.getCarrierAddress(
        feedUrl,
        backSlashPos + 1,
        feedUrl.length,
      );
      let did = this.getDid(feedUrl, startIndex, backSlashPos);
      return new DidData(did, carrierAddress, null);
    }

    // feeds://did:elastos:ixxxxxxx
    if (hashPos == -1) {
      let did = this.getDid(feedUrl, startIndex, feedUrl.length);
      return new DidData(did, null, null);
    }

    //feeds://did:elastos:ixxxxxxx#serviceid/carrieraddress
    if (backSlashPos > 7) {
      let did = this.getDid(feedUrl, startIndex, hashPos);
      // let serviceId = this.getServiceId(feedUrl, hashPos+1, backSlashPos);
      let serviceId = this.getServiceId(feedUrl, startIndex, backSlashPos);
      let carrierAddress = this.getCarrierAddress(
        feedUrl,
        backSlashPos + 1,
        feedUrl.length,
      );
      return new DidData(did, carrierAddress, serviceId);
    }

    // feeds://did:elastos:ixxxxxxx#serviceid
    let did = this.getDid(feedUrl, startIndex, hashPos);
    let serviceId = this.getServiceId(feedUrl, startIndex, feedUrl.length);
    return new DidData(did, null, serviceId);
  }

  getCarrierAddress(feedUrl: string, start: number, end: number): string {
    return 'carrier://' + feedUrl.substring(start, end);
  }

  getDid(feedUrl: string, start: number, end: number): string {
    return feedUrl.substring(start, end);
  }

  getServiceId(feedUrl: string, start: number, end: number): string {
    return feedUrl.substring(start, end);
  }

  async createPresentation(
    nonce,
    realm,
    onSuccess: (presentation: any) => void,
    onError?: (err: any) => void,
  ) {
    try {
      let presentation = await this.intentService.credaccessWithoutParams();
      if (presentation) {
        onSuccess(presentation);
        return;
      }
      let error = 'Create presentation error';
      Logger.error(TAG, error, presentation);
      onError(error);
    } catch (error) {
      Logger.error(TAG, error);
      onError(error);
    }
  }

  checkSignInServerStatus(nodeId: string): boolean {
    let accessToken = this.dataHelper.getAccessToken(nodeId);
    return this.feedsServiceApi.checkExp(accessToken);
  }

  getFeedNameById(nodeId: string, channelId: string): string {
    let feedName = this.translate.instant('common.unknown');
    let channel = this.getChannelFromId(nodeId, channelId);
    if (channel != undefined) {
      feedName = channel.name;
    }

    return feedName;
  }

  saveSignInRAWData(jsonStr: string) {
    this.storeService.set(FeedsData.PersistenceKey.signInRawData, jsonStr);
  }

  saveSignInData(did: string, name: string, avatar: Avatar, email: string, telephone: string,
    location: string, nickname: string, description: string,): Promise<SignInData> {
    return new Promise((resolve, reject) => {
      const signinData = this.generateSignInData(did, name, avatar, email, telephone,
        location, nickname, description);
      this.dataHelper.setLocalSignInData(signinData);

      this.checkSignInDataChange(this.dataHelper.getLocalSignInData())
        .then(async isChange => {
          if (isChange) {
            Logger.log(TAG, 'Signin data is changed, did is', did);
            await this.cleanAllData();
            await this.storeService.set(
              FeedsData.PersistenceKey.signInData,
              this.dataHelper.getLocalSignInData(),
            );
            await this.storeService.set(
              FeedsData.PersistenceKey.lastSignInData,
              this.dataHelper.getLocalSignInData(),
            );
            resolve(this.dataHelper.getLocalSignInData());
          } else {
            await this.storeService.set(
              FeedsData.PersistenceKey.signInData,
              this.dataHelper.getLocalSignInData(),
            );
            await this.storeService.set(
              FeedsData.PersistenceKey.lastSignInData,
              this.dataHelper.getLocalSignInData(),
            );
            resolve(this.dataHelper.getLocalSignInData());
          }
        })
        .catch(reason => {
          reject(reason);
        });
    });
  }

  generateSignInData(
    did: string,
    name: string,
    avatar: Avatar,
    email: string,
    telephone: string,
    location: string,
    nickname: string,
    description: string,
  ) {
    return new SignInData(
      did,
      name,
      avatar,
      email,
      telephone,
      location,
      nickname,
      description,
      UtilService.getCurrentTimeNum() + this.getDaysTS(expDay),
    );
  }

  saveSignInData2(signInData: SignInData) {
    this.dataHelper.setLocalSignInData(signInData);
    this.storeService.set(FeedsData.PersistenceKey.signInData, signInData);
  }

  getSignInData(): SignInData {
    return this.dataHelper.getLocalSignInData();
  }

  checkSignInDataChange(signInData: SignInData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.storeService.get(FeedsData.PersistenceKey.lastSignInData).then(
        lastSignInData => {
          if (lastSignInData == null || lastSignInData == undefined) {
            resolve(true);
            return;
          }

          if (signInData.did != lastSignInData.did) {
            resolve(true);
            return;
          }
          if (signInData.name != lastSignInData.name) {
            resolve(true);
            return;
          }
          if (
            JSON.stringify(signInData.avatar) !=
            JSON.stringify(lastSignInData.avatar)
          ) {
            resolve(true);
            return;
          }
          if (signInData.email != lastSignInData.email) {
            resolve(true);
            return;
          }
          if (signInData.telephone != lastSignInData.telephone) {
            resolve(true);
            return;
          }
          if (signInData.location != lastSignInData.location) {
            resolve(true);
            return;
          }
          if (signInData.nickname != lastSignInData.nickname) {
            resolve(true);
            return;
          }
          if (signInData.description != lastSignInData.description) {
            resolve(true);
            return;
          }

          resolve(false);
        },
        reason => {
          reject(reason);
        },
      );
    });
  }

  initSignInDataAsync(
    onSuccess: (signInData: SignInData) => void,
    onError?: (errorData: any) => void,
  ) {
    const localSignInData = this.dataHelper.getLocalSignInData();
    if (localSignInData != null || localSignInData != undefined) {
      onSuccess(localSignInData);
      return;
    }

    this.storeService
      .get(FeedsData.PersistenceKey.signInData)
      .then(signinData => {
        this.dataHelper.setLocalSignInData(signinData);
        onSuccess(signinData);
      })
      .catch(error => {
        onError(error);
      });
  }

  getDaysTS(days: number): number {
    return days * 24 * 60 * 60 * 1000;
  }

  updateSignInDataExpTime(signInData: SignInData) {
    signInData.expiresTS = UtilService.getCurrentTimeNum() + this.getDaysTS(expDay);
    this.saveSignInData2(signInData);
  }

  updateSignInDataExpTimeTo(signInData: SignInData, timestamp: number) {
    signInData.expiresTS = timestamp;
    this.saveSignInData2(signInData);
  }

  //// get data from persistence
  getLocalSubscribedChannels() { }

  getLocalChannelsMap() { }

  getLocalMyChannelsMap() { }

  getLocalUnreadMap() { }

  getPostMap() { }

  sortChannels(
    start: number,
    map: {},
    localList: FeedsData.Channels[],
  ): FeedsData.Channels[] {
    let list: FeedsData.Channels[] = [];
    if (map == null || map == undefined) map = {};

    let keys: string[] = Object.keys(map);
    for (const index in keys) {
      if (map[keys[index]] == null || map[keys[index]] == undefined) continue;
      list.push(map[keys[index]]);
    }

    list.sort((a, b) => Number(b.last_update) - Number(a.last_update));
    let end: number;
    if (list.length > start + 10) {
      end = start + 10;
    } else {
      end = list.length;
    }
    for (let index = start; index < end; index++) localList.push(list[index]);
    return localList;
  }

  getServerVersion(nodeId: string) {
    this.connectionService.getServerVersion(
      this.feedsServiceApi.getServerNameByNodeId(nodeId),
      nodeId,
    );
  }

  handleEditPost(nodeId: string, request: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }
  }

  handleDeletePost(nodeId: string, request: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.channel_id;
    let postId = request.id;

    let mPostId = this.getPostId(nodeId, channelId, postId);
    this.dataHelper.deletePost(mPostId);

    this.removeMediaData(nodeId, channelId, postId, 0);

    eventBus.publish(FeedsEvent.PublishType.deletePostFinish);
  }

  handleEditComment(nodeId: string, request: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }
  }

  handleDeleteComment(nodeId: string, request: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.channel_id;
    let postId = request.post_id;
    let commentId = request.id;

    let comment = this.dataHelper.getComment(
      nodeId,
      channelId,
      postId,
      commentId,
    );
    comment.status = FeedsData.PostCommentStatus.deleted;
    this.dataHelper.updateComment(
      nodeId,
      channelId,
      postId,
      commentId,
      comment,
    );

    eventBus.publish(FeedsEvent.PublishType.deleteCommentFinish);
  }

  handleGetServerVersion(nodeId: string, result: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.afterFriendConnection(nodeId);
      return;
    }
    let version = result.version;
    let versionCode = result.version_code || 1;
    let serverVersion = this.dataHelper.generateServerVersion(
      nodeId,
      version,
      versionCode,
    );
    this.dataHelper.updateServerVersion(nodeId, serverVersion);
    this.afterFriendConnection(nodeId);
  }

  ////handle push
  handleNewPostNotification(nodeId: string, params: any) {
    let channel_id: string = params.channel_id;
    let id: string = params.id;
    let contentBin: any = params.content;
    let created_at: number = params.created_at;
    let updateAt: number = params.updated_at || created_at;

    //TODO 2.0
    let thumbnails: any = params.thumbnails;
    Logger.log(TAG, 'Receive result from new_post, thumbnails is ', thumbnails);

    //TODO 2.0
    let hashId: string = params.hash_id;
    Logger.log(TAG, 'Receive result from new_post, hashId is ', hashId);

    //TODO 2.0
    let proof: string = params.proof;
    Logger.log(TAG, 'Receive result from new_post, proof is ', proof);

    //TODO 2.0
    let originPostUrl: string = params.origin_post_url;
    Logger.log(TAG, 'Receive result from new_post, originPostUrl is ', originPostUrl);

    let contentStr = this.serializeDataService.decodeData(contentBin);

    let content = this.feedsServiceApi.parseContent(nodeId, channel_id, id, 0, contentStr);

    let key = this.getPostId(nodeId, channel_id, id);
    let post = this.dataHelper.generatePost(
      nodeId,
      channel_id,
      id,
      content,
      0,
      0,
      created_at * 1000,
      updateAt,
      FeedsData.PostCommentStatus.available,
    );
    this.dataHelper.updatePost(key, post);
    this.dataHelper.receiveNewPost();

    let nodeChannelId = this.getChannelId(nodeId, channel_id);
    this.updateLastPostUpdate(nodeChannelId, nodeId, channel_id, updateAt);

    if (!this.checkChannelIsMine(nodeId, channel_id))
      this.dataHelper.receivedUnread(nodeChannelId);
    eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
  }

  async handleNewCommentNotification(nodeId: string, params: any) {
    let channelId: string = params.channel_id;
    let postId: string = params.post_id;
    let commentId: number = params.id;
    let referCommentId: number = params.comment_id;
    let contentBin: any = params.content;
    let userName: any = params.user_name;
    let createdAt: number = params.created_at || 0;
    let updatedAt: number = params.updated_at || createdAt;
    let status: FeedsData.PostCommentStatus =
      params.status || FeedsData.PostCommentStatus.available;
    let userDid: string = params.user_did || '';

    //TODO 2.0
    let thumbnails: any = params.thumbnails;
    Logger.log(TAG, 'Receive result from new_comment RPC,thumbnails is ', thumbnails);

    //TODO 2.0
    let hash_id: any = params.hash_id;
    Logger.log(TAG, 'Receive result from new_comment RPC,hash_id is ', hash_id);

    //TODO 2.0
    let proof: any = params.proof;
    Logger.log(TAG, 'Receive result from new_comment RPC,proof is ', proof);

    await this.processNewComment(
      nodeId,
      channelId,
      postId,
      commentId,
      referCommentId,
      userName,
      0,
      createdAt,
      updatedAt,
      status,
      userDid,
      contentBin,
    );

    let ncpId = this.getPostId(nodeId, channelId, postId);
    let originPost = this.dataHelper.getPost(ncpId);
    if (originPost == null || originPost == undefined) {
      originPost = this.dataHelper.generatePost(
        nodeId,
        channelId,
        postId,
        '',
        1,
        0,
        createdAt,
        updatedAt,
        FeedsData.PostCommentStatus.available,
      );
    } else {
      originPost.comments = originPost.comments + 1;
    }
    this.dataHelper.updatePost(ncpId, originPost);
    eventBus.publish(FeedsEvent.PublishType.postDataUpdate);

    this.updateLastCommentUpdate(ncpId, nodeId, channelId, postId, updatedAt);

    let lastCommentUpdateKey = this.getPostId(nodeId, channelId, "0");
    this.updateLastCommentUpdate(
      lastCommentUpdateKey,
      nodeId,
      channelId,
      "0",
      updatedAt,
    );
  }

  processNewComment(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    referCommentId: number,
    userName: string,
    likes: number,
    createdAt: number,
    updatedAt: number,
    status: FeedsData.PostCommentStatus,
    userDid: string,
    contentBin: any,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let content = this.serializeDataService.decodeData(contentBin);

      this.updateCommentMap(
        nodeId,
        channelId,
        postId,
        commentId,
        referCommentId,
        userName,
        likes,
        createdAt,
        updatedAt,
        status,
        userDid,
        content,
      );

      let ncpId = this.getPostId(nodeId, channelId, postId);
      this.updateLastCommentUpdate(ncpId, nodeId, channelId, postId, updatedAt);

      let ncId = this.getPostId(nodeId, channelId, "0");
      this.updateLastCommentUpdate(ncpId, nodeId, channelId, "0", updatedAt);

      eventBus.publish(FeedsEvent.PublishType.commentDataUpdate);

      // this.generateNotification(
      //   nodeId,
      //   channelId,
      //   postId,
      //   commentId,
      //   userName,
      //   FeedsData.Behavior.comment,
      //   this.translate.instant('NotificationPage.commentPost'),
      // );

      resolve();
    });
  }

  updateCommentMap(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    referCommentId: number,
    userName: string,
    likes: number,
    createdAt: number,
    updatedAt: number,
    status: FeedsData.PostCommentStatus,
    userDid: string,
    content: any,
  ) {
    if (
      updatedAt > createdAt &&
      status == FeedsData.PostCommentStatus.available
    )
      status = FeedsData.PostCommentStatus.edited;

    let comment: FeedsData.Comment = {
      nodeId: nodeId,
      channel_id: channelId,
      post_id: postId,
      id: commentId,
      comment_id: referCommentId,
      user_name: userName,
      content: content,
      likes: likes,
      created_at: createdAt * 1000,
      updated_at: updatedAt,
      status: status,
      user_did: userDid,
    };

    this.dataHelper.updateComment(
      nodeId,
      channelId,
      postId,
      commentId,
      comment,
    );
  }

  handleNewLikesNotification(nodeId: string, params: any) {
    let comment_id: number = params.comment_id;
    let channel_id: string = params.channel_id;
    let post_id: string = params.post_id;
    let totalCount: number = params.total_count;
    let user_name: string = params.user_name;

    //TODO 2.0
    let proof: string = params.proof;
    Logger.log(TAG, 'Receive result from new_like, proof is ', proof);

    if (comment_id == 0) {
      let key = this.getPostId(nodeId, channel_id, post_id);
      let originPost = this.dataHelper.getPost(key);
      if (originPost == null || originPost == undefined) {
        //TODO
      }
      try {
        originPost.likes = totalCount;
      } catch (error) { }
      this.dataHelper.updatePost(key, originPost);

      eventBus.publish(
        FeedsEvent.PublishType.updateLikeList,
        this.getLikeList(),
      );
      eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
    } else {
      let originComment = this.dataHelper.getComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      originComment.likes = totalCount;
      this.dataHelper.updateComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
        originComment,
      );
      eventBus.publish(FeedsEvent.PublishType.commentDataUpdate);
    }

    let behaviorText: string = '';
    let behavior: FeedsData.Behavior;
    if (comment_id == 0) {
      behavior = FeedsData.Behavior.likedPost;
      behaviorText = this.translate.instant('NotificationPage.likedPost');
    } else {
      behavior = FeedsData.Behavior.likedComment;
      behaviorText = this.translate.instant('NotificationPage.likedComment');
    }

    // this.generateNotification(
    //   nodeId,
    //   channel_id,
    //   post_id,
    //   comment_id,
    //   user_name,
    //   behavior,
    //   behaviorText,
    // );
  }

  handleNewSubscriptionNotification(nodeId: string, params: any) {
    let channel_id = params.channel_id;
    let user_name = params.user_name;
    let user_did = params.user_did;

    // this.generateNotification(
    //   nodeId,
    //   channel_id,
    //   "0",
    //   0,
    //   user_name,
    //   FeedsData.Behavior.follow,
    //   this.translate.instant('NotificationPage.followedFeed'),
    // );
  }

  handleNewFeedInfoUpdateNotification(nodeId: string, params: any) {
    let channelId = params.id || 0;
    let name = params.name || '';
    let desc = params.introduction || '';
    let avatarBin = params.avatar || '';
    let last_update = params.last_update || '';
    let subscribers = params.subscribers || 0;
    let avatar = this.serializeDataService.decodeData(avatarBin) || '';

    let nodeChannelId = this.getChannelId(nodeId, channelId) || '';
    let originChannel = this.dataHelper.getChannel(nodeChannelId);

    //TODO 2.0
    let tipMethods: string = params.tip_methods;
    Logger.log(TAG, 'Receive result from feedinfo_update, tipMethods is ', tipMethods);

    //TODO 2.0
    let proof: string = params.proof;
    Logger.log(TAG, 'Receive result from feedinfo_update, proof is ', proof);

    //TODO 2.0
    let status: number = params.status || 0;
    Logger.log(TAG, 'Receive result from feedinfo_update, status is ', status);

    let channel_id = "0"
    let created_at = 0
    let updated_at = 0
    // let name = ""
    let introduction = desc
    // let avatar = ""
    let memo = ""
    let type = ""

    if (originChannel == null) {
      let channel: FeedsData.Channels = {
        channel_id: channel_id,
        created_at: created_at,
        updated_at: updated_at,
        name: name,
        introduction: introduction,
        avatar: avatar,
        memo: memo,
        type: type,

        nodeId: nodeId,
        id: channelId,
        // name: name,
        // introduction: desc,
        owner_name: '',
        owner_did: '',
        subscribers: 0,
        last_update: last_update,
        last_post: '',
        // avatar: '',
        isSubscribed: true,

        // status      :   0,  //Added 2.0
        // iid         :   "", //Added 2.0
        // tip_methods :   "", //Added 2.0
        // memo        :   "", //Added 2.0
      };
      console.log("handleNewFeedInfoUpdateNotification");

      this.dataHelper.updateChannel(nodeChannelId, channel);
      // this.hiveService.insertOne(channel)
      eventBus.publish(
        FeedsEvent.PublishType.editFeedInfoFinish,
        nodeChannelId,
      );
      return;
    }

    const originChannelForHive = originChannel
    if (name != '') originChannel.name = name;
    if (desc != '') originChannel.introduction = desc;
    if (avatarBin != '') originChannel.avatar = avatar;
    if (last_update != '') originChannel.last_update = last_update;
    if (subscribers != 0) originChannel.subscribers = subscribers;
    console.log("handleNewFeedInfoUpdateNotification11111");

    this.dataHelper.updateChannel(nodeChannelId, originChannel);
    // this.hiveService.updateOne(originChannelForHive, originChannel)
    eventBus.publish(FeedsEvent.PublishType.editFeedInfoFinish, nodeChannelId);
  }

  handleNewPostUpdate(nodeId: string, params: any) {
    let channelId: string = params.channel_id;
    let postId: string = params.id;
    let status: FeedsData.PostCommentStatus =
      params.status || FeedsData.PostCommentStatus.available;
    let contentBin: any = params.content;
    let comments: number = params.comments || 0;
    let likes: number = params.likes || 0;
    let createdAt: number = params.created_at || 0;
    let updatedAt: number = params.updated_at || createdAt;

    //TODO 2.0
    let thumbnails: any = params.thumbnails;
    Logger.log(TAG, 'Receive result from post_update, thumbnails is ', thumbnails);

    //TODO 2.0
    let hashId: string = params.hash_id;
    Logger.log(TAG, 'Receive result from post_update, hash_id is ', hashId);

    //TODO 2.0
    let proof: string = params.proof;
    Logger.log(TAG, 'Receive result from post_update, proof is ', proof);

    //TODO 2.0
    let originPostUrl: string = params.origin_post_url;
    Logger.log(TAG, 'Receive result from post_update, thumbnails is ', originPostUrl);

    if (
      updatedAt > createdAt &&
      status == FeedsData.PostCommentStatus.available
    )
      status = FeedsData.PostCommentStatus.edited;

    let contentStr = this.serializeDataService.decodeData(contentBin);
    let content = this.feedsServiceApi.parseContent(nodeId, channelId, postId, 0, contentStr);

    let key = this.getPostId(nodeId, channelId, postId);

    let post = {
      nodeId: nodeId,
      channel_id: channelId,
      id: postId,
      content: content,
      comments: comments,
      likes: likes,
      created_at: createdAt * 1000,
      updated_at: updatedAt,
      post_status: status,
    };
    this.dataHelper.updatePost(key, post);

    eventBus.publish(FeedsEvent.PublishType.editPostFinish);
    eventBus.publish(FeedsEvent.PublishType.editPostSuccess);
  }

  handleNewCommentUpdate(nodeId: string, params: any) {
    let channelId = params.channel_id;
    let postId = params.post_id;
    let commentId = params.id;
    let status = params.status || FeedsData.PostCommentStatus.available;
    let commentById = params.comment_id || 0;
    let userName = params.user_name;
    let contentBin = params.content;
    let likes = params.likes;
    let createdAt = params.created_at;
    let updatedAt = params.updated_at || createdAt;
    let userDid = params.user_did || '';

    //TODO 2.0
    let thumbnails = params.thumbnails;
    Logger.log(TAG, 'Receive result from subscribe_channel, thumbnails is ', thumbnails);

    //TODO 2.0
    let hash_id = params.hash_id;
    Logger.log(TAG, 'Receive result from subscribe_channel, hash_id is ', hash_id);

    //TODO 2.0
    let proof = params.proof;
    Logger.log(TAG, 'Receive result from subscribe_channel, proof is ', proof);

    if (
      updatedAt > createdAt &&
      status == FeedsData.PostCommentStatus.available
    )
      status = FeedsData.PostCommentStatus.edited;

    let content = this.serializeDataService.decodeData(contentBin);

    let comment: FeedsData.Comment = {
      nodeId: nodeId,
      channel_id: channelId,
      post_id: postId,
      id: commentId,
      comment_id: commentById | 0,
      user_name: userName,
      content: content,
      likes: likes,
      created_at: createdAt * 1000,
      updated_at: updatedAt,
      status: status,
      user_did: userDid,
    };
    this.dataHelper.updateComment(
      nodeId,
      channelId,
      postId,
      commentId,
      comment,
    );
    eventBus.publish(FeedsEvent.PublishType.editCommentFinish);
  }

  handleNotification(nodeId: string, method: string, params: any) {
    switch (method) {
      case FeedsData.MethodType.newPostNotification:
        this.handleNewPostNotification(nodeId, params);
        break;
      case FeedsData.MethodType.newCommentNotification:
        this.handleNewCommentNotification(nodeId, params);
        break;
      case FeedsData.MethodType.newLikesNotification:
        this.handleNewLikesNotification(nodeId, params);
        break;
      case FeedsData.MethodType.newSubscriptionNotification:
        this.handleNewSubscriptionNotification(nodeId, params);
        break;
      case FeedsData.MethodType.feedInfoUpdateNotification:
        this.handleNewFeedInfoUpdateNotification(nodeId, params);
        break;
      case FeedsData.MethodType.postUpdateNotification:
        this.handleNewPostUpdate(nodeId, params);
        break;
      case FeedsData.MethodType.commentUpdateNotification:
        this.handleNewCommentUpdate(nodeId, params);
        break;
    }
  }

  ////handle response
  handleCreateChannelResult(
    nodeId: string,
    result: any,
    request: any,
    error: any,
  ) {
    let channel_id = result.channel_id;
    let created_at = request.created_at;
    let updated_at = request.updated_at;
    let name = request.name;
    let introduction = request.introduction;
    let avatar = request.avatar;
    let memo = request.memo;
    let type = request.type;

    let channelId = result.id;
    let channelName = request.name;
    let channelIntro = request.introduction;
    let owner_name = this.getSignInData().name;
    let owner_did = this.getSignInData().did;
    let avatarBin = request.avatar;

    if (error != null && error != undefined && error.code == -1) {
      this.handleError(
        nodeId,
        this.translate.instant('CreatenewfeedPage.alreadyExist'),
      );
      return;
    }

    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    // let avatar = this.serializeDataService.decodeData(avatarBin);

    let channel: FeedsData.Channels = {
      channel_id: channel_id,
      created_at: created_at,
      updated_at: updated_at,
      name: name,
      introduction: introduction,
      avatar: avatar,
      memo: memo,
      type: type,

      nodeId: nodeId,
      id: channelId,
      // name: channelName,
      // introduction: channelIntro,
      owner_name: owner_name,
      owner_did: owner_did,
      subscribers: 0,
      last_update: UtilService.getCurrentTimeNum(),
      last_post: '',
      // avatar: avatar,
      isSubscribed: false,
    };

    let nodeChannelId = this.getChannelId(nodeId, channelId);
    console.log("handleCreateChannelResult");

    this.dataHelper.updateChannel(nodeChannelId, channel);
    // this.hiveService.insertOne(channel)

    let createTopicSuccessData: FeedsEvent.CreateTopicSuccessData = {
      nodeId: nodeId,
      channelId: channelId,
    };
    eventBus.publish(
      FeedsEvent.PublishType.createTopicSuccess,
      createTopicSuccessData,
    );
    eventBus.publish(FeedsEvent.PublishType.channelsDataUpdate);

    this.feedsServiceApi.subscribeChannel(nodeId, channelId);
  }

  handlePublishPostResult(
    nodeId: string,
    result: any,
    request: any,
    error: any,
    memo: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let tempId = "0";
    if (memo != null && memo != undefined) tempId = memo.tempId.toString();
    this.processPublishPostSuccess(
      nodeId,
      request.channel_id,
      result.id,
      request.content,
      tempId,
    );
  }

  processPublishPostSuccess(
    nodeId: string,
    channelId: string,
    postId: string,
    contentBin: any,
    tempId: string,
  ) {
    let contentStr = this.serializeDataService.decodeData(contentBin);
    let content = this.feedsServiceApi.parseContent(nodeId, channelId, postId, 0, contentStr);

    let post: FeedsData.Post = {
      nodeId: nodeId,
      channel_id: channelId,
      id: postId,
      content: content,
      comments: 0,
      likes: 0,
      created_at: UtilService.getCurrentTimeNum(),
      updated_at: UtilService.getCurrentTimeNum(),
      post_status: FeedsData.PostCommentStatus.available,
    };

    let key = this.getPostId(nodeId, channelId, postId);
    this.dataHelper.updatePost(key, post);

    this.dataHelper.deleteTempIdData(tempId);

    let tempKey = this.getPostId(nodeId, channelId, tempId);
    this.dataHelper.deletePostDeeply(tempKey);
    this.dataHelper.deleteTempData(tempKey);

    eventBus.publish(FeedsEvent.PublishType.updateTab, true);
    eventBus.publish(FeedsEvent.PublishType.postEventSuccess);
    eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
    eventBus.publish(FeedsEvent.PublishType.publishPostSuccess, postId);
    eventBus.publish(FeedsEvent.PublishType.publishPostFinish);
  }

  handleDeclarePostResult(
    nodeId: string,
    result: any,
    request: any,
    error: any,
    memo: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let tempId = memo.tempId;

    let tempDataKey = this.getPostId(nodeId, request.channel_id, tempId);
    let tempData = this.dataHelper.getTempData(tempDataKey);
    tempData.postId = result.id;
    tempData.status = FeedsData.SendingStatus.needPushData;

    this.dataHelper.updateTempData(tempDataKey, tempData);
    this.sendMediaData(nodeId, request.channel_id, tempId);
  }

  cachePost(
    destDid: string,
    channelId: string,
    postId: string,
    contentBin: any,
    tempId: number,
  ) {
    let contentStr = this.serializeDataService.decodeData(contentBin);
    let content = this.feedsServiceApi.parseContent(destDid, channelId, postId, 0, contentStr);

    let post: FeedsData.Post = {
      nodeId: destDid,
      channel_id: channelId,
      id: postId,
      content: content,
      comments: 0,
      likes: 0,
      created_at: UtilService.getCurrentTimeNum(),
      updated_at: UtilService.getCurrentTimeNum(),
      post_status: FeedsData.PostCommentStatus.available,
    };

    let declarePostData: FeedsEvent.DeclarePostData = {
      nodeId: destDid,
      channelId: channelId,
      postId: postId,
      tempId: tempId,
    };
    eventBus.publish(
      FeedsEvent.PublishType.declarePostSuccess,
      declarePostData,
    );
  }

  handleNotifyPostResult(
    nodeId: string,
    result: any,
    request: any,
    error: any,
    memo: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let tempId = memo.tempId;
    let channelId = request.channel_id;
    let postId = request.post_id;

    let key = this.getPostId(nodeId, channelId, postId);
    let post = this.dataHelper.getPost(key);

    this.dataHelper.deleteTempIdData(tempId);
    let tempKey = this.getPostId(nodeId, channelId, tempId);
    this.dataHelper.deletePostDeeply(tempKey);
    this.dataHelper.deleteTempData(tempKey);

    this.dataHelper.updatePost(key, post);

    eventBus.publish(FeedsEvent.PublishType.notifyPostSuccess);

    eventBus.publish(FeedsEvent.PublishType.updateTab, true);
  }

  handlePostCommentResult(
    nodeId: string,
    result: any,
    request: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    //eventBus.publish(FeedsEvent.PublishType.rpcRequestSuccess);
  }

  handlePostLikeResult(nodeId: string, request: any, error: any) {
    let channel_id: string = request.requestParams.channel_id;
    let post_id: string = request.requestParams.post_id;
    let comment_id: number = request.requestParams.comment_id;

    if (
      error != null &&
      error != undefined &&
      error.code != undefined &&
      error.code != -4
    ) {
      this.doPostLikeError(nodeId, channel_id, post_id, comment_id);
      this.handleError(nodeId, error);
      return;
    }

    let key = this.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0) {
      let likesObj = this.dataHelper.generateLikes(
        nodeId,
        channel_id,
        post_id,
        0,
      );
      this.dataHelper.updateLikes(key, likesObj);
      eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
    } else {
      let commentKey = this.getLikeCommentId(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      let likedComment = this.dataHelper.generatedLikedComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      this.dataHelper.updateLikedComment(commentKey, likedComment);
      eventBus.publish(FeedsEvent.PublishType.commentDataUpdate);
    }
    let originPost = this.dataHelper.getPost(key);
    this.dataHelper.updatePost(key, originPost);
  }

  handlePostUnLikeResult(nodeId: string, request: any, error: any) {
    let channel_id: string = request.requestParams.channel_id;
    let post_id: string = request.requestParams.post_id;
    let comment_id: number = request.requestParams.comment_id;
    if (
      error != null &&
      error != undefined &&
      error.code != undefined &&
      error.code != -4
    ) {
      this.doPostUnLikeError(nodeId, channel_id, post_id, comment_id);
      this.handleError(nodeId, error);
      return;
    }
    let key = this.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0) {
      this.dataHelper.deleteLikes(key);
      eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
    } else {
      let commentKey = this.getLikeCommentId(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      this.dataHelper.deleteLikedComment(commentKey);
      eventBus.publish(FeedsEvent.PublishType.commentDataUpdate);
    }
    let originPost = this.dataHelper.getPost(key);
    this.dataHelper.updatePost(key, originPost);
  }

  // 处理我自己的频道结果
  handleGetMyChannelsResult(nodeId: string, responseResult: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let result = responseResult.channels;
    for (let index = 0; index < result.length; index++) {
      let id: string = result[index].id;
      let name: string = result[index].name;
      let introduction: string = result[index].introduction;
      let subscribers: number = result[index].subscribers;
      let avatarBin: any = result[index].avatar;

      let avatar = this.serializeDataService.decodeData(avatarBin);

      let nodeChannelId = this.getChannelId(nodeId, id);

      let channel_id = "0"
      let created_at = 0
      let updated_at = 0
      // let name = ""
      // let introduction = ""
      // let avatar = ""
      let memo = ""
      let type = ""

      let originChannel = this.dataHelper.getChannel(nodeChannelId);
      if (originChannel == null) {
        let channel = {
          channel_id: channel_id,
          created_at: created_at,
          updated_at: updated_at,
          name: name,
          introduction: introduction,
          avatar: avatar,
          memo: memo,
          type: type,

          nodeId: nodeId,
          id: id,
          // name: name,
          // introduction: introduction,
          owner_name: this.getSignInData().name,
          owner_did: this.getSignInData().did,
          subscribers: subscribers,
          last_update: UtilService.getCurrentTimeNum(),
          last_post: '',
          // avatar: avatar,
          isSubscribed: false,
        };
        console.log("+++++++ handleGetMyChannelsResult");
        this.dataHelper.updateChannel(nodeChannelId, channel);
        // this.hiveService.insertOne(channel)
      }

      this.syncPost(nodeId, id);
      this.syncComment(nodeId, id);
    }

    eventBus.publish(FeedsEvent.PublishType.myChannelsDataUpdate);
  }

  handleGetChannelsResult(
    nodeId: string,
    responseResult: any,
    request: any,
    error: any,
  ) {
    let result = responseResult.channels;

    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    for (let index = 0; index < result.length; index++) {
      let id = result[index].id;

      let nodeChannelId = this.getChannelId(nodeId, id);

      let originChannel = this.dataHelper.getChannel(nodeChannelId);

      let avatarBin = result[index].avatar;
      let avatar = this.serializeDataService.decodeData(avatarBin);
      let update = result[index].last_update;

      //TODO 2.0
      let tipMethods = result[index].tip_methods;
      Logger.log(TAG, 'Receive result from get_channels RPC,tipMethods is ', tipMethods);
      //TODO 2.0
      let proof = result[index].proof;
      Logger.log(TAG, 'Receive result from get_channels RPC,proof is ', proof);
      //TODO 2.0
      let status = result[index].status;
      Logger.log(TAG, 'Receive result from get_channels RPC,status is ', status);

      let channel_id = '0'
      let created_at = 0
      let updated_at = 0
      let name = result[index].name
      let introduction = result[index].introduction
      // let avatar = avatar
      let memo = ""
      let type = ""

      let originChannelForHive = originChannel
      if (originChannel == null) {
        originChannel = {
          channel_id: channel_id,
          created_at: created_at,
          updated_at: updated_at,
          name: name,
          introduction: introduction,
          avatar: avatar,
          memo: memo,
          type: type,

          nodeId: nodeId,
          id: id,
          // name: result[index].name,
          // introduction: result[index].introduction,
          owner_name: result[index].owner_name,
          owner_did: result[index].owner_did,
          subscribers: result[index].subscribers,
          last_update: update * 1000,
          last_post: '',
          // avatar: avatar,
          isSubscribed: false,
        };
        originChannelForHive = originChannel
      } else {
        originChannel.name = result[index].name;
        originChannel.avatar = avatar;

        originChannel.introduction = result[index].introduction;
        originChannel.owner_name = result[index].owner_name;
        originChannel.owner_did = result[index].owner_did;
        originChannel.subscribers = result[index].subscribers;
        originChannel.last_update = result[index].last_update * 1000;
      }
      console.log("+++++++ handleGetChannelsResult");
      this.dataHelper.updateChannel(nodeChannelId, originChannel);
      // this.hiveService.updateOne(originChannelForHive, originChannel)
    }
  }

  handleGetChannelDetailResult(nodeId: string, result: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let id = result.id;
    let name = result.name;
    let introduction = result.introduction;
    let owner_name = result.owner_name;
    let owner_did = result.owner_did;
    let subscribers = result.subscribers;
    let last_update = result.last_update;

    let avatarBin = result.avatar;
    let avatar = this.serializeDataService.decodeData(avatarBin);

    let nodeChannelId = this.getChannelId(nodeId, id);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);
    const originChannelForHive = originChannel
    originChannel.avatar = avatar;
    originChannel.introduction = introduction;
    originChannel.last_update = last_update;
    originChannel.name = name;
    originChannel.owner_name = owner_name;
    originChannel.owner_did = owner_did;
    originChannel.subscribers = subscribers;
    console.log("+++++++ handleGetChannelDetailResult");
    this.dataHelper.updateChannel(nodeChannelId, originChannel);
    // this.hiveService.updateOne(originChannelForHive, originChannel)
  }

  async handleGetSubscribedChannelsResult(
    nodeId: string,
    responseResult: any,
    request: any,
    error: any,
  ) {
    let isAddFeeds = false;
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    if (responseResult == '') {
      return;
    }

    let result = responseResult.channels || [];
    for (let index = 0; index < result.length; index++) {
      let channelId = result[index].id;
      let name = result[index].name;
      let introduction = result[index].introduction;
      let owner_name = result[index].owner_name;
      let owner_did = result[index].owner_did;
      let subscribers = result[index].subscribers;
      let last_update = result[index].last_update;
      let avatarBin = result[index].avatar;

      //TODO 2.0
      let create_at = result[index].create_at;
      Logger.log(TAG, 'Receive result from get_subscribed_channels RPC,create_at is ', create_at);

      //TODO 2.0
      let subscribed_time = result[index].subscribed_time;
      Logger.log(TAG, 'Receive result from get_subscribed_channels RPC,subscribed_time is ', subscribed_time);

      //TODO 2.0
      let proof = result[index].proof;
      Logger.log(TAG, 'Receive result from get_subscribed_channels RPC,proof is ', proof);

      let avatar = this.serializeDataService.decodeData(avatarBin);
      let nodeChannelId = this.getChannelId(nodeId, channelId);
      let originChannel = this.dataHelper.getChannel(nodeChannelId);

      let channel_id = '0'
      let created_at = 0
      let updated_at = 0
      // let introduction = ""
      // let   avatar: avatar,
      let memo = ""
      let type = ""
      let originChannelForHive = originChannel
      if (originChannel == null) {
        originChannel = {
          channel_id: channel_id,
          created_at: created_at,
          updated_at: updated_at,
          name: name,
          introduction: introduction,
          avatar: avatar,
          memo: memo,
          type: type,

          nodeId: nodeId,
          id: channelId,
          // name: name,
          // introduction: introduction,
          owner_name: owner_name,
          owner_did: owner_did,
          subscribers: subscribers,
          last_update: last_update * 1000,
          last_post: '',
          // avatar: avatar,
          isSubscribed: true,
        };
        originChannelForHive = originChannel
      } else {
        originChannel.isSubscribed = true;
      }
      console.log("+++++++ handleGetSubscribedChannelsResult");
      this.dataHelper.updateChannel(nodeChannelId, originChannel);
      // this.hiveService.updateOne(originChannelForHive, originChannel)

      if (request.max_count == 1) {
        isAddFeeds = true;
        await this.processTobeAddedFeedsFinish(nodeId, channelId);
        let subscribeFinishData: FeedsEvent.SubscribeFinishData = {
          nodeId: nodeId,
          channelId: channelId,
        };
        eventBus.publish(
          FeedsEvent.PublishType.subscribeFinish,
          subscribeFinishData,
        );
        this.native.toast(
          this.formatInfoService.formatFollowSuccessMsg(
            this.getFeedNameById(nodeId, channelId),
          ),
        );

        this.syncPost(nodeId, channelId);
        this.syncComment(nodeId, channelId);
      } else {
        this.updateLastSubscribedFeedsUpdate(nodeId, last_update);
      }
    }

    if (!isAddFeeds)
      eventBus.publish(FeedsEvent.PublishType.refreshSubscribedChannels);
  }

  handleGetPostsResult(
    nodeId: string,
    responseResult: any,
    request: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let result = responseResult.posts;
    let requestAction: number =
      request.memo.action || FeedsData.RequestAction.defaultAction;

    for (let index = 0; index < result.length; index++) {
      let channel_id = result[index].channel_id;
      let id = result[index].id;
      let contentBin = result[index].content;
      let comments = result[index].comments;
      let likes = result[index].likes;
      let createAt = result[index].created_at || 0;
      let contentStr = this.serializeDataService.decodeData(contentBin);
      let content = this.feedsServiceApi.parseContent(nodeId, channel_id, id, 0, contentStr);

      let updatedAt = result[index].updated_at || createAt;
      let status =
        result[index].status || FeedsData.PostCommentStatus.available;

      //TODO 2.0
      let thumbnails = result[index].thumbnails;
      Logger.log(TAG, 'Receive result from get_post RPC,thumbnails is ', thumbnails);

      //TODO 2.0
      let hash_id = result[index].hash_id;
      Logger.log(TAG, 'Receive result from get_post RPC,hash_id is ', hash_id);

      //TODO 2.0
      let proof = result[index].proof;
      Logger.log(TAG, 'Receive result from get_post RPC,proof is ', proof);

      //TODO 2.0
      let origin_post_url = result[index].origin_post_url;
      Logger.log(TAG, 'Receive result from get_post RPC,origin_post_url is ', origin_post_url);

      if (
        updatedAt > createAt &&
        status == FeedsData.PostCommentStatus.available
      )
        status = FeedsData.PostCommentStatus.edited;

      let key = this.getPostId(nodeId, channel_id, id);

      let post = {
        nodeId: nodeId,
        channel_id: channel_id,
        id: id,
        content: content,
        comments: comments,
        likes: likes,
        created_at: createAt * 1000,
        updated_at: updatedAt,
        post_status: status,
      };

      if (!this.checkSyncPostStatus(nodeId, channel_id)) {
        this.generateSyncPostStatus(nodeId, channel_id, false, updatedAt);
      }

      if (this.dataHelper.isExistPost(key)) {
        let nodeChannelId = this.getChannelId(nodeId, channel_id);
        if (!this.checkChannelIsMine(nodeId, channel_id))
          this.dataHelper.receivedUnread(nodeChannelId);
      }

      this.dataHelper.updatePost(key, post);


      if (requestAction == FeedsData.RequestAction.defaultAction) {
        let key = this.getChannelId(nodeId, channel_id);
        this.updateLastPostUpdate(key, nodeId, channel_id, updatedAt);
        this.dataHelper.receiveNewPost();
      }

      if (this.feedsServiceApi.getServerVersionCodeByNodeId(nodeId) < Config.newCommentVersion) {
        this.syncCommentOld(nodeId, channel_id, id);
      }
    }

    let reqFeedsId = request.requestParams.channel_id;
    if (result.length == 0) {
      this.generateSyncPostStatus(nodeId, reqFeedsId, true, 0);
    }

    if (!this.checkSyncPostStatus(nodeId, reqFeedsId)) {
      this.updatePostWithTime(
        nodeId,
        reqFeedsId,
        this.getSyncPostLastUpdate(nodeId, reqFeedsId) - 1,
        0,
        1,
      );
    }

    if (requestAction == FeedsData.RequestAction.refreshPostDetail) {
      eventBus.publish(FeedsEvent.PublishType.refreshPostDetail);
      return;
    }

    if (requestAction == FeedsData.RequestAction.defaultAction) {
      eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
      return;
    }
  }

  async handleGetCommentsResult(
    nodeId: string,
    responseResult: any,
    requestParams: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let result = responseResult.comments;
    for (let index = 0; index < result.length; index++) {
      let channelId = result[index].channel_id;
      let postId = result[index].post_id;
      let commentId = result[index].id;
      let referCommentId = result[index].comment_id;
      let contentBin = result[index].content;
      let likes = result[index].likes;
      let createdAt = result[index].created_at;
      let userName = result[index].user_name;
      let updatedAt = result[index].updated_at;
      let status = result[index].status;
      let userDid = result[index].user_did;

      //TODO 2.0
      let thumbnails = result[index].thumbnails;
      Logger.log(TAG, 'Receive result from get_comment RPC,thumbnails is ', thumbnails);

      //TODO 2.0
      let hash_id = result[index].hash_id;
      Logger.log(TAG, 'Receive result from get_comment RPC,hash_id is ', hash_id);

      //TODO 2.0
      let proof = result[index].proof;
      Logger.log(TAG, 'Receive result from get_comment RPC,proof is ', proof);

      await this.processNewComment(
        nodeId,
        channelId,
        postId,
        commentId,
        referCommentId,
        userName,
        likes,
        createdAt,
        updatedAt,
        status,
        userDid,
        contentBin,
      );

      if (!this.checkSyncCommentStatus(nodeId, channelId, postId)) {
        this.generateSyncCommentStatus(
          nodeId,
          channelId,
          postId,
          false,
          updatedAt,
        );
      }

      let lastCommentUpdateKey = this.getPostId(nodeId, channelId, postId);
      this.updateLastCommentUpdate(
        lastCommentUpdateKey,
        nodeId,
        channelId,
        postId,
        updatedAt,
      );
    }

    let reqFeedsId = requestParams.requestParams.channel_id;
    let reqPostId = requestParams.requestParams.post_id;

    if (result.length == 0) {
      this.generateSyncCommentStatus(nodeId, reqFeedsId, reqPostId, true, 0);
    }
    if (!this.checkSyncCommentStatus(nodeId, reqFeedsId, "0")) {
      this.updateCommentsWithTime(
        nodeId,
        reqFeedsId,
        reqPostId,
        this.getSyncCommentLastUpdate(nodeId, reqFeedsId, "0") - 1,
        0,
        2,
      );
    }

    let reqParams = requestParams.requestParams;
    let getCommentData: FeedsEvent.getCommentData = {
      nodeId: nodeId,
      channelId: reqParams.channel_id,
      postId: reqParams.post_id,
    };
    eventBus.publish(FeedsEvent.PublishType.getCommentFinish, getCommentData);
  }

  handleGetStatisticsResult(nodeId: string, result: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let userDID = result.did || '';
    let connectingClients = result.connecting_clients || 0;
    let totalClients = result.total_clients || 0;

    let serverStatistics: FeedsData.ServerStatistics = this.dataHelper.generateServerStatistics(
      userDID,
      connectingClients,
      totalClients,
    );
    this.dataHelper.updateServerStatistics(nodeId, serverStatistics);
    eventBus.publish(FeedsEvent.PublishType.serverStatisticsChanged);
  }

  handleSubscribeChannelResult(
    nodeId: string,
    result: any,
    request: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code == -4) {
      this.feedsServiceApi.getSubscribedChannels(
        nodeId,
        Communication.field.id,
        request.id,
        request.id,
        1,
      );
      return;
    }

    if (error != null && error != undefined && error.code != undefined) {
      this.doSubscribeChannelError(nodeId, request.id);
      this.handleError(nodeId, error);
      return;
    }

    Logger.log(TAG, 'Receive result from subscribe_channel, result is ', result);

    //TODO 2.0
    let channelId = result.id;
    Logger.log(TAG, 'Receive result from subscribe_channel, channelId is ', channelId);

    //TODO 2.0
    let name = result.name;
    Logger.log(TAG, 'Receive result from subscribe_channel, name is ', name);

    //TODO 2.0
    let introduction = result.introduction;
    Logger.log(TAG, 'Receive result from subscribe_channel, introduction is ', introduction);

    //TODO 2.0
    let owner_name = result.owner_name;
    Logger.log(TAG, 'Receive result from subscribe_channel, owner_name is ', owner_name);

    //TODO 2.0
    let owner_did = result.owner_did;
    Logger.log(TAG, 'Receive result from subscribe_channel, owner_did is ', owner_did);

    //TODO 2.0
    let subscribers = result.subscribers;
    Logger.log(TAG, 'Receive result from subscribe_channel, subscribers is ', subscribers);

    //TODO 2.0
    let last_update = result.last_update;
    Logger.log(TAG, 'Receive result from subscribe_channel, last_update is ', last_update);

    //TODO 2.0
    let avatar = result.avatar;
    Logger.log(TAG, 'Receive result from subscribe_channel, avatar is ', avatar);

    //TODO 2.0
    let tip_methods = result.tip_methods;
    Logger.log(TAG, 'Receive result from subscribe_channel, tip_methods is ', tip_methods);

    //TODO 2.0
    let proof = result.proof;
    Logger.log(TAG, 'Receive result from subscribe_channel, proof is ', proof);

    //TODO 2.0
    let status = result.status;
    Logger.log(TAG, 'Receive result from subscribe_channel, status is ', status);

    this.feedsServiceApi.getSubscribedChannels(
      nodeId,
      Communication.field.id,
      request.id,
      request.id,
      1,
    );
  }

  handleUnsubscribeChannelResult(nodeId: string, request: any, error: any) {
    let nodeChannelId = this.getChannelId(nodeId, request.id);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);
    const originChannelForHive = originChannel
    if (error != null && error != undefined && error.code == -4) {
      if (nodeChannelId != null) {
        originChannel.isSubscribed = false;
        console.log("+++++++ handleUnsubscribeChannelResult");
        this.dataHelper.updateChannel(nodeChannelId, originChannel);
        // this.hiveService.updateOne(originChannelForHive, originChannel)
      }
      let unsubscribeData: FeedsEvent.unsubscribeData = {
        nodeId: nodeId,
        channelId: request.id,
        channelName: originChannel.name,
      };
      eventBus.publish(
        FeedsEvent.PublishType.unsubscribeFinish,
        unsubscribeData,
      );
      return;
    }

    if (error != null && error != undefined && error.code != undefined) {
      this.doUnsubscribeChannelError(nodeId, request.id);
      this.handleError(nodeId, error);
      return;
    }

    if (nodeChannelId != null) {
      originChannel.isSubscribed = false;
      console.log("+++++++ handleUnsubscribeChannelResult");
      this.dataHelper.updateChannel(nodeChannelId, originChannel);
      // this.hiveService.updateOne(originChannelForHive, originChannel)
    }
    this.deletePostFromChannel(nodeId, request.id);

    this.native.toast(
      this.formatInfoService.formatUnFollowSuccessMsg(
        this.getFeedNameById(nodeId, request.id),
      ),
    );
    eventBus.publish(FeedsEvent.PublishType.unfollowFeedsFinish);
  }

  handleEditFeedInfo(nodeId: string, request: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let channelId = request.id || 0;
    let name = request.name || '';
    let desc = request.introduction || '';
    let avatarBin = request.avatar || '';

    let avatar = this.serializeDataService.decodeData(avatarBin) || '';

    let nodeChannelId = this.getChannelId(nodeId, channelId) || '';
    let originChannel = this.dataHelper.getChannel(nodeChannelId);
    const originChannelForHive = originChannel
    if (name != '') originChannel.name = name;
    if (desc != '') originChannel.introduction = desc;
    if (avatarBin != '') originChannel.avatar = avatar;
    console.log("+++++++ handleEditFeedInfo");
    this.dataHelper.updateChannel(nodeChannelId, originChannel);
    // this.hiveService.updateOne(originChannelForHive, originChannel)
    eventBus.publish(FeedsEvent.PublishType.editFeedInfoFinish, nodeChannelId);
  }

  handleEnableNotificationResult(nodeId: string, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    this.updateData(nodeId);
  }

  doSubscribeChannelError(nodeId: string, channelId: string) {
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);

    const originChannelForHive = originChannel
    originChannel.isSubscribed = false;

    let subscribeNum = originChannel.subscribers;
    if (subscribeNum > 0) originChannel.subscribers = subscribeNum - 1;
    console.log("+++++++ doSubscribeChannelError");
    this.dataHelper.updateChannel(nodeChannelId, originChannel);
    // this.hiveService.updateOne(originChannelForHive, originChannel)
    let subscribeFinishData: FeedsEvent.SubscribeFinishData = {
      nodeId: nodeId,
      channelId: channelId,
    };
    eventBus.publish(
      FeedsEvent.PublishType.subscribeFinish,
      subscribeFinishData,
    );
  }

  doUnsubscribeChannelError(nodeId: string, channelId: string) {
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);

    const originChannelForHive = originChannel
    originChannel.isSubscribed = true;
    let subscribeNum = originChannel.subscribers;
    originChannel.subscribers = subscribeNum + 1;
    console.log("+++++++ doUnsubscribeChannelError");
    this.dataHelper.updateChannel(nodeChannelId, originChannel);
    // this.hiveService.updateOne(originChannelForHive, originChannel)
    let unsubscribeData: FeedsEvent.unsubscribeData = {
      nodeId: nodeId,
      channelId: channelId,
      channelName: originChannel.name,
    };
    eventBus.publish(FeedsEvent.PublishType.unsubscribeFinish, unsubscribeData);
  }

  doPostLikeError(
    nodeId: string,
    channel_id: string,
    post_id: string,
    comment_id: number,
  ) {
    let key = this.getPostId(nodeId, channel_id, post_id);
    if (comment_id == 0) {
      this.dataHelper.deleteLikes(key);
      let originPost = this.dataHelper.getPost(key);
      let likeNum = originPost.likes;
      if (likeNum > 0) {
        originPost.likes = likeNum - 1;
        this.dataHelper.updatePost(key, originPost);
      }

      eventBus.publish(
        FeedsEvent.PublishType.updateLikeList,
        this.getLikeList(),
      );
      eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
    } else {
      let commentKey = this.getLikeCommentId(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      this.dataHelper.deleteLikedComment(commentKey);

      let originComment = this.dataHelper.getComment(
        nodeId,
        channel_id,
        post_id,
        comment_id,
      );
      let likeNum = originComment.likes;
      if (likeNum > 0) {
        originComment.likes = likeNum - 1;
        this.dataHelper.updateComment(
          nodeId,
          channel_id,
          post_id,
          comment_id,
          originComment,
        );
      }
      eventBus.publish(FeedsEvent.PublishType.commentDataUpdate);
    }
  }



  doPostUnLikeError(
    destDid: string,
    channel_id: string,
    post_id: string,
    comment_id: number,
  ) {
    let key = this.getPostId(destDid, channel_id, post_id);

    if (comment_id == 0) {
      let originPost = this.dataHelper.getPost(key);
      originPost.likes = originPost.likes + 1;
      this.dataHelper.updatePost(key, originPost);

      let likesObj = this.dataHelper.generateLikes(
        destDid,
        channel_id,
        post_id,
        0,
      );
      this.dataHelper.updateLikes(key, likesObj);

      eventBus.publish(
        FeedsEvent.PublishType.updateLikeList,
        this.getLikeList(),
      );
      eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
    } else {
      let originComment = this.dataHelper.getComment(
        destDid,
        channel_id,
        post_id,
        comment_id,
      );
      originComment.likes = originComment.likes + 1;
      this.dataHelper.updateComment(
        destDid,
        channel_id,
        post_id,
        comment_id,
        originComment,
      );

      let commentKey = this.getLikeCommentId(
        destDid,
        channel_id,
        post_id,
        comment_id,
      );
      let likedComment = this.dataHelper.generatedLikedComment(
        destDid,
        channel_id,
        post_id,
        comment_id,
      );
      this.dataHelper.updateLikedComment(commentKey, likedComment);
      eventBus.publish(FeedsEvent.PublishType.commentDataUpdate);
    }
  }

  saveServer(
    name: string,
    owner: string,
    introduction: string,
    did: string,
    carrierAddress: string,
    serverUrl: string,
    nodeId: string,
  ) {
    if (nodeId != null && nodeId != undefined) {
      let server = this.generateServer(
        name,
        owner,
        introduction,
        did,
        carrierAddress,
        serverUrl,
        nodeId,
      );
      this.resolveServer(server, null);
      return;
    }

    // this.carrierService.getIdFromAddress(carrierAddress, nodeId => {
    //   let server = this.generateServer(
    //     name,
    //     owner,
    //     introduction,
    //     did,
    //     carrierAddress,
    //     serverUrl,
    //     nodeId,
    //   );
    //   this.resolveServer(server, null);
    // });
  }

  generateServer(
    name: string,
    owner: string,
    introduction: string,
    did: string,
    carrierAddress: string,
    feedsUrl: string,
    nodeId: string,
  ): FeedsData.Server {
    return {
      name: name,
      owner: owner,
      introduction: introduction,
      did: did,
      carrierAddress: carrierAddress,
      nodeId: nodeId,
      feedsUrl: feedsUrl,
      elaAddress: '',
    };
  }
  insertFakeData() {
    this.storeService.remove(FeedsData.PersistenceKey.myChannelsMap);
  }

  getChannelFromId(nodeId: string, id: string): FeedsData.Channels {
    let nodeChannelId = this.getChannelId(nodeId, id);
    console.log("getChannelFromId " + nodeChannelId);
    return this.dataHelper.getChannel(id.toString());
  }

  async getChannelFromIdV3(destDid: string, channelId: string): Promise<FeedsData.ChannelV3> {
    // let nodeChannelId = this.getChannelId(nodeId, id);
    // console.log("getChannelFromId " + nodeChannelId);
    let channel = await this.dataHelper.getChannelV3ById(destDid, channelId);
    return channel;
  }

  getPostFromId(
    destDid: string,
    channelId: string,
    postId: string,
  ): FeedsData.Post {
    let key = this.getPostId(destDid, channelId, postId);
    return this.dataHelper.getPost(key);
  }

  getCommentFromId(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): FeedsData.Comment {
    return this.dataHelper.getComment(destDid, channelId, postId, commentId);
  }

  getCommentList(
    nodeId: string,
    channelId: string,
    postId: string,
  ): FeedsData.Comment[] {
    return this.dataHelper.getCommentList(nodeId, channelId, postId);
  }

  getCaptainCommentList(
    nodeId: string,
    feedId: string,
    postId: string,
  ): FeedsData.Comment[] {
    return this.dataHelper.getCaptainCommentList(nodeId, feedId, postId);
  }

  getReplayCommentList(
    nodeId: string,
    feedId: string,
    postId: string,
    commentId: number,
  ): FeedsData.Comment[] {
    return this.dataHelper.getReplayCommentList(
      nodeId,
      feedId,
      postId,
      commentId,
    );
  }

  async getPostList(): Promise<FeedsData.PostV3[]> {
    return await this.dataHelper.getPostV3List();
  }

  getChannelId(destDid: string, channelId: string) {
    return this.getKey(destDid, channelId, "0", 0);
  }

  getPostId(nodeId: string, channelId: string, postId: string): string {
    return this.getKey(nodeId, channelId, postId, 0);
  }

  getCommentId(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): string {
    return this.getKey(destDid, channelId, postId, commentId);
  }

  getLikeCommentId(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): string {
    return this.getKey(destDid, channelId, postId, commentId);
  }

  getPostListFromChannel(nodeId: string, channelId: string) {
    return this.dataHelper.getPostListFromChannel(nodeId, channelId);
  }

  getLikeList(): FeedsData.Post[] {
    return this.dataHelper.getLikedPostList();
  }

  updatePostWithTime(
    nodeId: string,
    channelId: string,
    upper_bound: number,
    lower_bound: number,
    maxCount: number,
  ) {
    this.feedsServiceApi.getPost(
      nodeId,
      channelId,
      Communication.field.last_update,
      upper_bound,
      lower_bound,
      maxCount,
      '',
    );
  }

  updateFeedsByFeedId(nodeId: string, feedId: number) {
    this.feedsServiceApi.getChannels(nodeId, Communication.field.id, feedId, feedId, 1);
  }

  updateMultiCommentsWithTime(
    nodeId: string,
    feedsId: string,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
  ) {
    this.feedsServiceApi.getMultiComments(
      nodeId,
      feedsId,
      "0",
      Communication.field.last_update,
      upper_bound,
      lower_bound,
      max_counts,
    );
  }

  updateCommentsWithTime(
    nodeId: string,
    channelId: string,
    postId: string,
    upper_bound: number,
    lower_bound: number,
    max_counts: number,
  ) {
    this.feedsServiceApi.getComments(
      nodeId,
      channelId,
      postId,
      Communication.field.last_update,
      upper_bound,
      lower_bound,
      max_counts,
      false,
    );
  }

  updatePost(nodeId: string, feedsId: string) {
    let nodeChannelId = this.getChannelId(nodeId, feedsId);
    let lastPostTime = this.dataHelper.getLastPostUpdateTime(nodeChannelId);
    this.updatePostWithTime(nodeId, feedsId, 0, lastPostTime, 0);
  }

  updatePostWithId(nodeId: string, feedsId: string, from: number, to: number) {
    this.feedsServiceApi.getPost(nodeId, feedsId, Communication.field.id, to, from, 1, '');
  }

  updatePostFromId(nodeId: string, feedsId: string) {
    let to = this.checkLoadPostId(nodeId, feedsId);
    if (to > 1) this.updatePostWithId(nodeId, feedsId, to, 0);
  }

  checkLoadPostId(nodeId: string, feedsId: string): number {
    let feedsList = this.getPostListFromChannel(nodeId, feedsId);
    let id = parseInt(feedsList[feedsList.length - 1].id);
    return id;
  }

  updateSubscribedFeed() {
    //TODO
    // let subscribedFeedsMap = this.dataHelper.getSubscribedChannelsMap();
    // let keys: string[] = Object.keys(subscribedFeedsMap) || [];
    // for (let index = 0; index < keys.length; index++) {
    //   const feed = subscribedFeedsMap[keys[index]];
    //   if (feed == null || feed == undefined)
    //     continue;
    //   if (serversStatus[feed.nodeId].status == FeedsData.ConnState.disconnected)
    //     continue;
    //   this.updateFeedsByFeedId(feed.nodeId, feed.id);
    // }
  }

  updateSubscribedFeedsWithTime(nodeId: string) {
    let lastSubscribedFeedsTime: number = 0;
    lastSubscribedFeedsTime = this.dataHelper.getLastSubscribedFeedsUpdateTime(
      nodeId,
    );
    this.feedsServiceApi.getSubscribedChannels(
      nodeId,
      Communication.field.last_update,
      0,
      lastSubscribedFeedsTime,
      0,
    );
  }

  updateMultiComment(nodeId: string, feedsId: string) {
    let ncpId = this.getPostId(nodeId, feedsId, "0");
    let lastCommentTime = this.dataHelper.getLastCommentUpdateTime(ncpId);
    this.updateMultiCommentsWithTime(nodeId, feedsId, 0, lastCommentTime, 0);
  }

  updateComment(nodeId: string, channelId: string, postId: string) {
    let ncpId = this.getPostId(nodeId, channelId, postId);
    let lastCommentTime = this.dataHelper.getLastCommentUpdateTime(ncpId);
    this.updateCommentsWithTime(
      nodeId,
      channelId,
      postId,
      0,
      lastCommentTime,
      0,
    );
  }

  getSubscribedChannelsFromNodeId(nodeId: string): FeedsData.Channels[] {
    let feedList = this.dataHelper.getChannelsListFromNodeId(nodeId);
    let list: FeedsData.Channels[] = [];
    for (let index = 0; index < feedList.length; index++) {
      const feed = feedList[index];
      if (feed == null || feed == undefined) continue;
      if (feed.isSubscribed) list.push(feed);
    }
    return list;
  }

  checkFeedsIsSubscribed(nodeId: string, feedId: string): boolean {
    let nodeChannelId = this.getChannelId(nodeId, feedId);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);
    if (originChannel == null) return false;

    return originChannel.isSubscribed;
  }

  getChannelsMap() {
    return this.dataHelper.getChannelsMap();
  }

  deletePostFromChannel(nodeId: string, channelId: number) {
    // let keys: string[] = Object.keys(postMap);
    // for (const index in keys) {
    //   if (postMap[keys[index]] == null || postMap[keys[index]] == undefined)
    //     continue;
    //   if (postMap[keys[index]].nodeId == nodeId && postMap[keys[index]].channel_id == channelId)
    //     postMap[keys[index]] = undefined;
    // }
    // this.storeService.set(FeedsData.PersistenceKey.postMap,postMap);
    // eventBus.publish(PublishType.postDataUpdate);

    // let nodeChannelId = nodeId+channelId;
    // if (lastPostUpdateMap[nodeChannelId] != null && lastPostUpdateMap[nodeChannelId] != undefined){
    //   lastPostUpdateMap[nodeChannelId].time = null
    //   this.storeService.set(FeedsData.PersistenceKey.lastPostUpdateMap,lastPostUpdateMap);
    // }

    eventBus.publish(FeedsEvent.PublishType.postDataUpdate);
  }

  indexText(text: string, limit: number, indexLength: number): string {
    if (text == undefined) return '';
    if (text.length < limit) return text;

    let half = indexLength / 2;
    return (
      text.slice(0, half) +
      '...' +
      text.slice(text.length - half + 1, text.length)
    );
  }

  async publishDid(
    payload: string,
    onSuccess?: (ret: any) => void,
    onError?: (err: any) => void,
  ) {
    try {
      let result = await this.intentService.didtransaction(payload);
      if (result) {
        onSuccess(result);
        return;
      }

      let error = 'Publish did error, response is ' + JSON.stringify(result);
      Logger.error(TAG, error);
      onError(error);
    } catch (error) {
      Logger.error(TAG, error);
      onError(error);
    }
  }

  setSigninTimeout(nodeId: string) {
    this.isLogging[nodeId] = true;
    clearTimeout(this.signinChallengeTimeout);

    this.signinChallengeTimeout = setTimeout(() => {
      this.clearSigninTimeout(nodeId);
    }, 30000);
  }

  clearSigninTimeout(nodeId: string) {
    this.isLogging[nodeId] = false;
    clearTimeout(this.signinChallengeTimeout);
  }

  handleSigninConfirm(nodeId: string, result: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.clearSigninTimeout(nodeId);
      this.handleError(nodeId, error);
      return;
    }

    let accessToken = this.dataHelper.generateAccessToken(
      result.access_token,
      false,
    );
    this.dataHelper.updateAccessToken(nodeId, accessToken);

    this.prepare(nodeId);
    this.restoreData(nodeId);

    eventBus.publish(FeedsEvent.PublishType.login_finish, nodeId);
    this.clearSigninTimeout(nodeId);
  }

  startDeclareOwner(nodeId: string, carrierAddress: string, nonce: string) {
    if (!this.connectionService.checkServerConnection(nodeId)) return;
    this.declareOwnerRequest(nodeId, carrierAddress, nonce);
  }

  declareOwnerRequest(nodeId: string, carrierAddress: string, nonce: string) {
    this.connectionService.declareOwnerRequest(
      this.feedsServiceApi.getServerNameByNodeId(nodeId),
      nodeId,
      nonce,
      this.getSignInData().did,
    );
    cacheBindingAddress = carrierAddress;
  }

  importDidRequest(
    nodeId: string,
    mnemonic: string,
    passphrase: string,
    index: number,
  ) {
    this.connectionService.importDidRequest(
      this.feedsServiceApi.getServerNameByNodeId(nodeId),
      nodeId,
      mnemonic,
      passphrase,
      index,
    );
  }

  createDidRequest(nodeId: string) {
    this.connectionService.createDidRequest(
      this.feedsServiceApi.getServerNameByNodeId(nodeId),
      nodeId,
    );
  }

  issueCredentialRequest(nodeId: string, credential: string) {
    this.connectionService.issueCredentialRequest(
      this.feedsServiceApi.getServerNameByNodeId(nodeId),
      nodeId,
      credential,
    );
  }

  handleIssueCredentialResponse(nodeId: string, result: any, error: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }
    this.finishBinding(nodeId);
  }

  handleUpdateCredentialResponse(
    nodeId: string,
    result: any,
    requestParams: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }

    let cachedServer = this.dataHelper.getCachedUpdateServer(nodeId);
    if (cachedServer != null && cachedServer != undefined) {
      this.dataHelper.updateServerWithoutSave(nodeId, cachedServer);
    }

    eventBus.publish(FeedsEvent.PublishType.updateCredentialFinish);
    this.feedsServiceApi.signinChallengeRequest(nodeId, true);
  }

  handleSetBinaryResponse(nodeId, result, requestParams, error, memo: any) {
    if (error != null && error != undefined && error.code != undefined) {
      this.handleError(nodeId, error);
      return;
    }
    let tempId = memo.tempId;
    let feedId = memo.feedId;
    let postId = memo.postId;
    let commentId = memo.commentId;
    let setBinaryFinishData: FeedsEvent.setBinaryFinishData = {
      nodeId: nodeId,
      feedId: feedId,
      postId: postId,
      commentId: commentId,
      tempId: tempId,
    };
  }

  handleGetBinaryResponse(nodeId, result, requestParams, error) {
    if (error != null && error != undefined && error.code != undefined) {
      this.translateBinaryError(nodeId, error.code);
      this.handleError(nodeId, error);
      return;
    }
    let key = result.key;
    let contentBin = result.content;

    let value = this.serializeDataService.decodeData(contentBin);
    this.storeService.set(key, value).then(() => {
      let getBinaryData: FeedsEvent.GetBinaryData = {
        nodeId: nodeId,
        key: key,
        value: value,
      };
    });
  }

  handleStandardDidAuthResponse(nodeId, result, requestParams, error) {
    this.handleSigninConfirm(nodeId, result, error);
  }

  async handleGetMultiComments(
    nodeId: string,
    responseResult: any,
    requestParams: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      // this.handleError(nodeId, error);
      return;
    }
    let result = responseResult.comments;
    for (let index = 0; index < result.length; index++) {
      let channelId = result[index].channel_id;
      let postId = result[index].post_id;
      let commentId = result[index].comment_id;
      let referCommentId = result[index].refer_comment_id;
      let contentBin = result[index].content;
      let likes = result[index].likes;
      let createdAt = result[index].created_at;
      let userName = result[index].user_name;
      let updatedAt = result[index].updated_at;
      let status = result[index].status;
      let userDid = result[index].user_did;

      //TODO 2.0
      let thumbnails = result[index].thumbnails;
      Logger.log(TAG, 'Receive result from get_multi_comments RPC,thumbnails is ', thumbnails);

      //TODO 2.0
      let hash_id = result[index].hash_id;
      Logger.log(TAG, 'Receive result from get_multi_comments RPC,hash_id is ', hash_id);

      //TODO 2.0
      let proof = result[index].proof;
      Logger.log(TAG, 'Receive result from get_multi_comments RPC,proof is ', proof);

      await this.processNewComment(
        nodeId,
        channelId,
        postId,
        commentId,
        referCommentId,
        userName,
        likes,
        createdAt,
        updatedAt,
        status,
        userDid,
        contentBin,
      );

      // if(this.checkChannelIsMine(nodeId,channelId)){
      let lastCommentUpdateKey = this.getPostId(nodeId, channelId, "0");
      this.updateLastCommentUpdate(
        lastCommentUpdateKey,
        nodeId,
        channelId,
        "0",
        updatedAt,
      );
      // }

      if (!this.checkSyncCommentStatus(nodeId, channelId, "0")) {
        this.generateSyncCommentStatus(nodeId, channelId, "0", false, updatedAt);
      }
    }

    let reqFeedsId = requestParams.channel_id;
    if (result.length == 0) {
      this.generateSyncCommentStatus(nodeId, reqFeedsId, "0", true, 0);
    }
    if (!this.checkSyncCommentStatus(nodeId, reqFeedsId, "0")) {
      this.updateMultiCommentsWithTime(
        nodeId,
        reqFeedsId,
        this.getSyncCommentLastUpdate(nodeId, reqFeedsId, "0") - 1,
        0,
        2,
      );
    }
  }

  handleGetMultiSubscribesCount(
    nodeId: string,
    responseResult: any,
    requestParams: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      return;
    }
    console.log("handleGetMultiSubscribesCount")

    let result = responseResult.channels;
    for (let index = 0; index < result.length; index++) {
      let channelId = result[index].channel_id;
      let subscribesCount = result[index].subscribers_count;
      this.updateLocalSubscribesCount(nodeId, channelId, subscribesCount);
    }
  }

  // 更新每个频道的订阅人数
  updateLocalSubscribesCount(
    nodeId: string,
    channelId: string,
    subscribesCount: number,
  ) {
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    let originChannel = this.dataHelper.getChannel(nodeChannelId);
    const originChannelForHive = originChannel
    if (originChannel == null) return;

    originChannel.subscribers = subscribesCount;
    this.dataHelper.updateChannel(nodeChannelId, originChannel);
    // this.hiveService.updateOne(originChannelForHive, originChannel)
  }

  async handleGetMultiLikesAndCommentsCount(
    nodeId: string,
    responseResult: any,
    requestParams: any,
    error: any,
  ) {
    if (error != null && error != undefined && error.code != undefined) {
      return;
    }

    this.dataHelper.updateLastMultiLikesAndCommentsCountUpdate(
      nodeId,
      this.lastMultiLikesAndCommentsCountUpdateMapCache[nodeId],
    );
    let result = responseResult.posts;
    for (let index = 0; index < result.length; index++) {
      let channelId = result[index].channel_id;
      let postId = result[index].post_id;
      let commentsCount = result[index].comments_count;
      let likesCount = result[index].likes_count;

      this.checkLikesAndCommentsCount(
        nodeId,
        channelId,
        postId,
        likesCount,
        commentsCount,
      );
    }
  }

  checkLikesAndCommentsCount(
    nodeId: string,
    channelId: string,
    postId: string,
    likesCount: number,
    commentsCount: number,
  ) {
    let key = this.getPostId(nodeId, channelId, postId);
    let originPost = this.dataHelper.getPost(key);
    if (originPost == null || originPost == undefined) return;
    let isChanged = false;
    if (originPost.likes != likesCount) {
      originPost.likes = likesCount;
      isChanged = true;
    }

    if (originPost.comments != commentsCount) {
      originPost.comments = commentsCount;
      isChanged = true;
    }

    if (isChanged) this.dataHelper.updatePost(key, originPost);
  }

  finishBinding(nodeId: string) {
    this.dataHelper.updateBindingServer(bindingServerCache);
    let bindingServer = this.dataHelper.getBindingServer();
    this.addServer(
      bindingServer.carrierAddress,
      'Feeds/0.1',
      bindingServer.name,
      bindingServer.owner,
      bindingServer.introduction,
      bindingServer.did,
      bindingServer.feedsUrl,
      () => { },
      error => { },
    );
    eventBus.publish(FeedsEvent.PublishType.issue_credential);
    eventBus.publish(FeedsEvent.PublishType.bindServerFinish, bindingServer);
    this.feedsServiceApi.signinChallengeRequest(nodeId, true);
  }



  prepare(friendId: string) {
    this.feedsServiceApi.getStatistics(friendId);
    this.feedsServiceApi.enableNotification(friendId);
    // this.updateData(friendId);
    // if (!this.addFeedService.checkIsTobeAddedFeeds(friendId, 0)){
    //   this.updateData(friendId);
    // }
  }

  updateCommentData(nodeId: string, feedsId: string) {
    if (this.feedsServiceApi.getServerVersionCodeByNodeId(nodeId) < Config.newCommentVersion) {
      let postList = this.getPostListFromChannel(nodeId, feedsId);
      for (let postIndex = 0; postIndex < postList.length; postIndex++) {
        let post: FeedsData.Post = postList[postIndex];
        let postId: string = post.id;
        this.updateComment(nodeId, feedsId, postId);
      }
    }
  }

  syncMultiComment(nodeId: string, feedsId: string) {
    if (!this.checkSyncCommentStatus(nodeId, feedsId, "0")) {
      let lastUpdate = this.getSyncCommentLastUpdate(nodeId, feedsId, "0") - 1;
      if (lastUpdate < 0) lastUpdate = 0;
      this.updateMultiCommentsWithTime(nodeId, feedsId, lastUpdate, 0, 2);
    } else {
      this.updateMultiComment(nodeId, feedsId);
    }
  }
  syncCommentOld(nodeId: string, feedsId: string, postId: string) {
    if (!this.checkSyncCommentStatus(nodeId, feedsId, postId)) {
      let lastUpdate =
        this.getSyncCommentLastUpdate(nodeId, feedsId, postId) - 1;
      if (lastUpdate < 0) lastUpdate = 0;
      this.updateCommentsWithTime(nodeId, feedsId, postId, lastUpdate, 0, 2);
    } else {
      this.updateComment(nodeId, feedsId, postId);
    }
  }

  syncComment(nodeId: string, feedsId: string) {
    if (this.feedsServiceApi.getServerVersionCodeByNodeId(nodeId) >= Config.newCommentVersion) {
      this.syncMultiComment(nodeId, feedsId);
    } else {
      let postList = this.getPostListFromChannel(nodeId, feedsId);
      for (let postIndex = 0; postIndex < postList.length; postIndex++) {
        const post: FeedsData.Post = postList[postIndex];
        let postId: string = post.id;
        this.syncCommentOld(nodeId, feedsId, postId);
      }
    }
  }

  syncPost(nodeId: string, feedsId: string) {
    if (!this.checkSyncPostStatus(nodeId, feedsId)) {
      let lastUpdate = this.getSyncPostLastUpdate(nodeId, feedsId) - 1;
      if (lastUpdate < 0) lastUpdate = 0;
      this.updatePostWithTime(nodeId, feedsId, lastUpdate, 0, 1);
    } else {
      this.updatePost(nodeId, feedsId);
    }
  }

  // 更新profile 频道数目
  async updateData(friendId: string) {
    console.log("+++++++updateData");
    let toBeAddedFeeds: FeedsData.ToBeAddedFeed[] = this.addFeedService.getToBeAddedFeedsInfoByNodeId(
      friendId,
    );
    for (let index = 0; index < toBeAddedFeeds.length; index++) {
      let toBeAddedFeed = toBeAddedFeeds[index];
      this.feedsServiceApi.subscribeChannel(toBeAddedFeed.nodeId, toBeAddedFeed.feedId);
    }

    if (this.dataHelper.isBindingServer(friendId)) {
      if (this.getMyChannelList().length == 0)
        this.feedsServiceApi.getMyChannels(friendId, Communication.field.last_update, 0, 0, 0);
    }

    let list = this.getSubscribedChannelsFromNodeId(friendId);

    if (list.length > 0) {
      this.updateSubscribedFeedsWithTime(friendId);
      for (let index = 0; index < list.length; index++) {
        const feeds: FeedsData.Channels = list[index];
        let feedsId = feeds.id;
        this.syncPost(friendId, feedsId);
        this.syncComment(friendId, feedsId);
      }
    }

    if (
      this.feedsServiceApi.getServerVersionCodeByNodeId(friendId) >= Config.newMultiPropCountVersion
    ) {
      this.feedsServiceApi.getMultiSubscribersCount(friendId, 0);
      this.updateMultiLikesAndCommentsCount(friendId);
    }

    this.republishPost(friendId);
  }

  updateMultiLikesAndCommentsCount(nodeId: string) {
    let updateTime = this.dataHelper.getLastMultiLikesAndCommentsCountUpdateTime(
      nodeId,
    );

    if (
      this.lastMultiLikesAndCommentsCountUpdateMapCache == null ||
      this.lastMultiLikesAndCommentsCountUpdateMapCache == undefined
    ) {
      this.lastMultiLikesAndCommentsCountUpdateMapCache = {};
    }
    this.lastMultiLikesAndCommentsCountUpdateMapCache[nodeId] = {
      nodeId: nodeId,
      time: UtilService.getCurrentTimeNum(),
    };
    this.feedsServiceApi.getMultiLikesAndCommentsCount(
      nodeId,
      0,
      0,
      Communication.field.last_update,
      0,
      updateTime,
      0,
    );
  }

  // saveCredential(credential: string) {
  //   this.dataHelper.updateLocalCredential(credential);
  // }

  // getLocalCredential() {
  //   return this.dataHelper.getLocalCredential();
  // }

  removeAllData() {
    this.storeService.remove(FeedsData.PersistenceKey.signInData);
    this.storeService.remove(FeedsData.PersistenceKey.signInRawData);
    this.storeService.remove(FeedsData.PersistenceKey.subscribedChannelsMap);
    this.storeService.remove(FeedsData.PersistenceKey.channelsMap);
    this.storeService.remove(FeedsData.PersistenceKey.myChannelsMap);
    this.storeService.remove(FeedsData.PersistenceKey.unreadMap);
    this.storeService.remove(FeedsData.PersistenceKey.postMap);
    this.storeService.remove(FeedsData.PersistenceKey.lastPostUpdateMap);
    this.storeService.remove(FeedsData.PersistenceKey.commentsMap);
    this.storeService.remove(FeedsData.PersistenceKey.serverStatisticsMap);
    this.storeService.remove(FeedsData.PersistenceKey.serversStatus);
    this.storeService.remove(FeedsData.PersistenceKey.subscribeStatusMap);
    this.storeService.remove(FeedsData.PersistenceKey.likeMap);
    this.storeService.remove(FeedsData.PersistenceKey.accessTokenMap);

    this.storeService.remove(FeedsData.PersistenceKey.credential);
    this.storeService.remove(FeedsData.PersistenceKey.bindingServer);
    this.storeService.remove(FeedsData.PersistenceKey.serverMap);

    this.storeService.remove(FeedsData.PersistenceKey.notificationList);
    this.storeService.remove(FeedsData.PersistenceKey.likeCommentMap);
  }

  async removeSigninData() {
    this.dataHelper.setLocalSignInData(null);
    await this.storeService.remove(FeedsData.PersistenceKey.signInData);
  }

  getBindingServer(): FeedsData.Server {
    return this.dataHelper.getBindingServer();
  }

  addServer(
    carrierAddress: string,
    friendRequest: string,
    name: string,
    owner: string,
    introduction: string,
    did: string,
    feedsUrl: string,
    onSuccess: () => void,
    onError?: (err: string) => void,
  ) {
    // isBindServer = false;
    this.checkIsAlreadyFriends(carrierAddress, isFriend => {
      if (isFriend) {
        this.native.toast_trans('AddServerPage.serverAlreadyAdded');
        onSuccess();
      } else {
        // this.carrierService.isValidAddress(
        //   carrierAddress,
        //   isValid => {
        //     if (!isValid) {
        //       this.native.toast_trans('common.addressinvalid');
        //       onError('Address invalid');
        //       return;
        //     }

        //     // this.carrierService.addFriend(
        //     //   carrierAddress,
        //     //   friendRequest,
        //     //   () => {
        //     //     this.saveServer(
        //     //       name,
        //     //       owner,
        //     //       introduction,
        //     //       did,
        //     //       carrierAddress,
        //     //       feedsUrl,
        //     //       null,
        //     //     );
        //     //   },
        //     //   err => {
        //     //     this.alertError('Add server error: ' + err);
        //     //   },
        //     // );
        //   },
        //   (error: string) => {
        //     this.alertError('Address error: ' + error);
        //   },
        // );
      }
    });
  }

  alertError(error: string) {
    alert(error);
  }

  getLikeFromId(key: string): FeedsData.Likes {
    return this.dataHelper.getLikes(key);
  }

  getLikedCommentFromId(
    nodeChannelPostCommentId: string,
  ): FeedsData.LikedComment {
    return this.dataHelper.getLikedComment(nodeChannelPostCommentId);
  }

  checkMyLike(destDid: string, channelId: string, postId: string): boolean {
    let key = this.getKey(destDid, channelId, postId, 0);
    if (this.getLikeFromId(key) == null || this.getLikeFromId(key) == undefined)
      return false;
    return true;
  }

  checkLikedComment(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): boolean {
    let key = this.getKey(destDid, channelId, postId, commentId);
    if (
      this.getLikedCommentFromId(key) == null ||
      this.getLikedCommentFromId(key) == undefined
    )
      return false;
    return true;
  }

  parseChannelAvatar(avatar: string): string {
    if (avatar == null || avatar == undefined) return '';
    if (avatar.startsWith('img://')) {
      let newAvatar = avatar.replace('img://', '');
      return newAvatar;
    } else if (avatar.startsWith('feeds:image:')) {
      let newAvatar = avatar.replace('feeds:image:', '');
      newAvatar = this.ipfsService.getNFTGetUrl() + newAvatar;
      return newAvatar;
    }
    else if (avatar.startsWith('feeds:imgage:')) {
      let newAvatar = avatar.replace('feeds:imgage:', '');
      newAvatar = this.ipfsService.getNFTGetUrl() + newAvatar;
      return newAvatar;
    } else if (avatar.startsWith('pasar:image:')) {
      let newAvatar = avatar.replace('pasar:image:', '');
      newAvatar = this.ipfsService.getNFTGetUrl() + newAvatar;
      return newAvatar;
    }
    return avatar;
  }

  deleteFeedSource(nodeId: string): Promise<any> {
    return this.removeFeedSource(nodeId).then(() => {
      this.removeNotification();
      this.removeBindingServer();
    });
  }

  removeFeedSource(nodeId: string): Promise<any> {
    let channelList = this.getChannelsListFromNodeId(nodeId) || [];
    for (
      let channelIndex = 0;
      channelIndex < channelList.length;
      channelIndex++
    ) {
      const channel = channelList[channelIndex];
      let channelId = channel.id;
      let postList = this.getPostListFromChannel(nodeId, channelId);
      for (let postIndex = 0; postIndex < postList.length; postIndex++) {
        const post = postList[postIndex];
        let postId = post.id;
        this.removeLikeById(nodeId, channelId, postId);
        this.removePostById(nodeId, channelId, postId);
        this.removeCommentById(nodeId, channelId, postId);
        this.removeLastCommentUpdate(nodeId, channelId, postId);
      }
      this.removeChannelById(nodeId, channelId);
      this.removeUnreadStatueById(nodeId, channelId);
      this.removeLastPostUpdate(nodeId, channelId);
    }

    // await this.removeLastFeedUpdate(nodeId);
    this.removeServerStatisticById(nodeId);
    this.removeServerStatusById(nodeId);
    this.removeServerById(nodeId);
    this.removeAccessTokenById(nodeId);
    this.removeServerFriendsById(
      nodeId,
      () => {
        eventBus.publish(FeedsEvent.PublishType.removeFeedSourceFinish);
        eventBus.publish(FeedsEvent.PublishType.refreshPage);
      },
      error => {
        eventBus.publish(FeedsEvent.PublishType.removeFeedSourceFinish);
        eventBus.publish(FeedsEvent.PublishType.refreshPage);
      },
    );

    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }

  removeLastPostUpdate(nodeId: string, channelId: string) {
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    this.dataHelper.deleteLastPostUpdate(nodeChannelId);
  }

  removeLastCommentUpdate(nodeId: string, channelId: string, postId: string) {
    let ncpId = this.getPostId(nodeId, channelId, postId);
    this.dataHelper.deleteLastComment(ncpId);
  }

  removeLikeById(nodeId: string, channelId: string, postId: string) {
    let key = this.getKey(nodeId, channelId, postId, 0);
    this.dataHelper.deleteLikes(key);
  }

  removeCommentById(nodeId: string, channelId: string, postId: string) {
    this.dataHelper.deleteCommentFromPost(nodeId, channelId, postId);
  }

  removePostById(nodeId: string, channelId: string, postId: string) {
    let key = this.getPostId(nodeId, channelId, postId);
    this.dataHelper.deletePost(key);
  }

  removeChannelById(nodeId: string, channelId: string) {
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    this.dataHelper.deleteChannel(nodeChannelId);
  }

  removeUnreadStatueById(nodeId: string, channelId: string) {
    let nodeChannelId = this.getChannelId(nodeId, channelId);
    this.dataHelper.deleteUnread(nodeChannelId);
  }

  removeServerStatisticById(nodeId: string) {
    this.dataHelper.deleteServerStatistics(nodeId);
  }

  removeServerStatusById(nodeId: string) {
    this.dataHelper.deleteServerStatus(nodeId);
  }

  removeServerById(nodeId: string) {
    this.dataHelper.deleteServer(nodeId);
  }

  removeServerFriendsById(
    nodeId: string,
    onSuccess: () => void,
    onError: (error) => void,
  ) {
    // this.carrierService.isFriends(nodeId, isFriend => {
    //   if (isFriend) {
    //     this.carrierService.removeFriend(
    //       nodeId,
    //       () => {
    //         onSuccess();
    //       },
    //       error => {
    //         onError(error);
    //       },
    //     );
    //   } else {
    //     onSuccess();
    //   }
    // });
  }

  removeAllServerFriends() {
    let list = this.dataHelper.getServerList();
    for (let index = 0; index < list.length; index++) {
      const server = list[index];
      // this.carrierService.removeFriend(
      //   server.nodeId,
      //   () => { },
      //   err => {
      //     Logger.error(TAG, 'Remove Friend error, error msg is', err);
      //   },
      // );
    }
  }

  removeBindServer() { }

  removeAccessTokenById(nodeId: string) {
    this.dataHelper.deleteAccessToken(nodeId);
  }

  removeAllAccessToken(): Promise<any> {
    return this.storeService.remove(FeedsData.PersistenceKey.accessTokenMap);
  }

  removeNotification() {
    this.dataHelper.deleteAllNotification();
  }

  removeBindingServer() {
    this.dataHelper.deleteBindingServer();
  }

  getNotificationList(): FeedsData.Notification[] {
    return this.dataHelper.getNotificationList();
  }

  setNotificationReadStatus(
    notification: FeedsData.Notification,
    readStatus: number,
  ) {
    if (notification == undefined) return;

    this.dataHelper.deleteNotification(notification);
    notification.readStatus = readStatus;
    this.dataHelper.appendNotification(notification);
  }

  deleteNotification(notification: FeedsData.Notification): Promise<any> {
    return new Promise((resolve, reject) => {
      this.dataHelper.deleteNotification(notification);
      eventBus.publish(FeedsEvent.PublishType.UpdateNotification);
      resolve(null);
    });
  }

  restoreData(nodeId: string) {
    if (!this.checkIsTobeAddedFeeds(nodeId, 0)) {
      this.feedsServiceApi.getSubscribedChannels(
        nodeId,
        Communication.field.last_update,
        0,
        0,
        0,
      );
    }

    if (this.dataHelper.isBindingServer(nodeId)) {
      this.feedsServiceApi.getMyChannels(nodeId, Communication.field.last_update, 0, 0, 0);
    }
  }

  parseBindServerUrl(content: string): FeedsData.BindURLData {
    if (content.startsWith('feeds_raw://')) {
      let tmpString = content.replace('feeds_raw://', '');
      let tmp: string[] = tmpString.split('/');

      if (tmp.length == 3) {
        return {
          did: tmp[0],
          carrierAddress: tmp[1],
          nonce: tmp[2],
        };
      } else if (tmp.length == 2) {
        return {
          did: '',
          carrierAddress: tmp[0],
          nonce: tmp[1],
        };
      }
    } else if (content.startsWith('feeds://')) {
      let tmpString = content.replace('feeds://', '');
      let tmp: string[] = tmpString.split('/');
      return {
        did: tmp[0],
        carrierAddress: tmp[1],
        nonce: '0',
      };
    }
  }

  checkChannelIsMine(nodeId: string, channelId: string): boolean {
    let channel = this.getChannelFromId(nodeId, channelId);
    if (
      channel == null ||
      channel == undefined ||
      channel.owner_did != this.getSignInData().did
    )
      return false;
    return true;
  }

  checkCommentIsMine(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): boolean {
    let comment = this.dataHelper.getComment(
      destDid,
      channelId,
      postId,
      commentId,
    );
    if (comment == undefined) return false;

    let did = comment.user_did || '';
    if (did == this.getSignInData().did) return true;

    return false;
  }

  checkIsAlreadyFriends(
    carrierAddress: string,
    onSuccess: (isFriends: boolean) => void,
  ) {
    // this.carrierService.getIdFromAddress(carrierAddress, userId => {
    //   if (this.dataHelper.isContainsServer(userId)) {
    //     onSuccess(true);
    //     return;
    //   }
    //   onSuccess(false);
    //   return;
    // });
  }

  async pay(
    receiver: string,
    amount: number,
    memo: string,
    onSuccess: (res: any) => void,
    onError: (err: any) => void,
  ) {
    try {
      let result = await this.intentService.pay(receiver, amount, memo);
      if (result) {
        onSuccess(result);
        return;
      }

      let error = 'Pay error, response is ' + JSON.stringify(result);
      Logger.log(TAG, error);
      onError(error);
    } catch (error) {
      Logger.log(TAG, error);
      onError(error);
    }
  }

  processGeneralError(nodeId: string, errorCode: number) {
    let errorMessage = this.translate.instant('Common.unknownError');
    switch (errorCode) {
      case -1:
        errorMessage = this.translate.instant('ErrorInfo.alreadyExists');
        break;
      case -2:
        errorMessage = this.translate.instant('ErrorInfo.notExists');
        break;
      case -3:
        errorMessage = this.translate.instant(
          'StartbindingPage.linkServerError',
        );
        break;
      case -4:
        errorMessage = this.translate.instant('ErrorInfo.wrongState');
        break;
      case -5:
        let originAccessToken = this.dataHelper.getAccessToken(nodeId);
        originAccessToken.isExpire = true;
        this.dataHelper.updateAccessToken(nodeId, originAccessToken);
        this.feedsServiceApi.signinChallengeRequest(nodeId, true);
        return;
      case -6:
        errorMessage = this.translate.instant('ErrorInfo.internalError');
        break;
      case -7:
        errorMessage = this.translate.instant('ErrorInfo.invalidParam');
        break;
      case -8:
        errorMessage = this.translate.instant(
          'ErrorInfo.invalidChallengeResponse',
        );
        break;
      case -9:
        errorMessage = this.translate.instant(
          'ErrorInfo.invalidVerifiableCredential',
        );
        break;
      case -10:
        // errorMessage = this.translate.instant("ErrorInfo.unsupportedRequests");
        this.native.toastWarn(
          this.translate.instant('common.theFeedSource') +
          ' #' +
          this.feedsServiceApi.getServerNameByNodeId(nodeId) +
          this.translate.instant('ErrorInfo.needUpdateServerVersion'),
        );
        return;
      case -12:
        this.native.toastWarn('CreatenewfeedPage.feedMaxNumber');
        return;
      default:
        errorMessage = this.translateBinaryError(nodeId, errorCode);
        return;
    }
    this.native.toastWarn(
      this.formatInfoService.formatErrorMsg(
        this.feedsServiceApi.getServerNameByNodeId(nodeId),
        errorMessage,
      ),
    );
  }

  refreshPostById(nodeId: string, channelId: string, postId: string) {
    let memo = {
      action: FeedsData.RequestAction.refreshPostDetail,
    };
    this.feedsServiceApi.getPost(
      nodeId,
      channelId,
      Communication.field.id,
      Number(postId),
      Number(postId),
      0,
      memo,
    );
  }

  // setChannelInfo(obj: any) {
  //   this.channelInfo = obj;
  // }

  // getChannelInfo() {
  //   return this.channelInfo || {};
  // }

  setCurTab(curtab: string) {
    this.curtab = curtab;
  }

  getCurTab() {
    return this.curtab;
  }

  // updateVersionData() {
  //   let updateCode =
  //     localStorage.getItem('org.elastos.dapp.feeds.update') || '0';
  //   if (Number(updateCode) < 8) {
  //     this.updatePostKey();
  //     this.updateSubscribedChannelsKey();
  //     this.updateChannelsKey();
  //     this.updateMyChannelsKey();
  //     this.updateLikeCommentKey();
  //     this.updateLikeKey();
  //     this.updatePostUpdateKey();
  //     this.updateLastCommentUpdateKey();
  //     this.updateAllContentData();
  //     localStorage.setItem('org.elastos.dapp.feeds.update', '8');
  //   }
  // }

  close() {
    //TODO
    // appManager.close();
  }

  async promptpublishdid() {
    try {
      let result = await this.intentService.promptpublishdid();
      if (result) {
        // success
        return;
      }

      Logger.error(TAG, 'Prompt publish did error, response is ', result);
      this.native.toastdanger('common.promptPublishDidError');
    } catch (error) {
      this.native.toastdanger('common.promptPublishDidError');
    }
  }

  checkDIDDocument(did: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.checkDIDOnSideChain(
        did,
        isOnSideChain => {
          resolve(isOnSideChain);
        },
        err => {
          this.native.toastdanger('common.resolveDidDocumentError');
          reject(err);
        },
      );
    });
  }

  checkDIDOnSideChain(
    did: string,
    onSuccess: (isOnSideChain: boolean) => void,
    onError?: (err: any) => void,
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const didDocument = this.didHelperService.resolveDidDocument(did);
        if (didDocument == null) {
          onSuccess(false);
        } else {
          onSuccess(true);
        }
      } catch (error) {
        Logger.error(TAG, 'DidManager resolve error,', error);
        onError(error);
      }
    });
  }

  destroyCarrier() {
    //this.carrierService.destroyCarrier();
  }

  resetConnectionStatus() {
    this.connectionService.resetConnectionStatus();
    this.resetServerConnectionStatus();
    this.dataHelper.setConnectionStatus(FeedsData.ConnState.disconnected);
    this.lastConnectionStatus = FeedsData.ConnState.disconnected;
  }

  resetServerConnectionStatus() {
    this.dataHelper.resetServerConnectionStatus();
  }

  rmDIDPrefix(did: string): string {
    let result = did;
    let isStartWith = did.startsWith('did:elastos:');
    if (isStartWith) result = did.substring(12, did.length);

    return result;
  }

  setBinary(
    nodeId: string,
    key: string,
    value: any,
    mediaType: string,
    feedId: string,
    postId: string,
    commentId: number,
    memo: FeedsData.SessionMemoData,
  ) {
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    let requestData = this.sessionService.buildSetBinaryRequest(
      accessToken,
      key,
    );
    this.storeService.set(key, value);
    this.transportData(nodeId, key, requestData, mediaType, memo, value);
  }

  getBinary(nodeId: string, key: string, mediaType: string) {
    let accessToken: FeedsData.AccessToken =
      this.dataHelper.getAccessToken(nodeId) || null;
    let requestData = this.sessionService.buildGetBinaryRequest(
      accessToken,
      key,
    );
    let memo = null;
    this.transportData(nodeId, key, requestData, mediaType, memo);
  }

  transportData(
    nodeId: string,
    key: string,
    request: any,
    mediaType: string,
    memo: FeedsData.SessionMemoData,
    value: any = '',
  ) {
    let requestData = this.serializeDataService.encodeData(request);

    if (value != '') {
      let valueData = this.serializeDataService.encodeData(value);
      this.sessionService.addHeader(
        nodeId,
        requestData.length,
        valueData.length,
        request,
        mediaType,
        request.method,
        key,
        memo,
      );
      this.sessionService.streamAddData(nodeId, requestData, memo);
      this.transportValueData(nodeId, valueData, memo);
    } else {
      this.sessionService.addHeader(
        nodeId,
        requestData.length,
        0,
        request,
        mediaType,
        request.method,
        key,
        memo,
      );
      this.sessionService.streamAddData(nodeId, requestData, memo);
    }
  }

  transportValueData(
    nodeId: string,
    valueData: Uint8Array,
    memo: FeedsData.SessionMemoData,
  ) {
    let step = 2048;
    let currentSlice = 0;
    let sumSlice = 0;

    sumSlice = valueData.length / step;

    let transDataInter = setInterval(() => {
      if (currentSlice >= sumSlice) {
        this.sessionService.streamAddData(
          nodeId,
          valueData.subarray(currentSlice * step, valueData.length),
          memo,
        );
        clearInterval(transDataInter);
        return;
      }

      let sentData = valueData.subarray(
        currentSlice * step,
        (currentSlice + 1) * step,
      );
      this.sessionService.streamAddData(nodeId, sentData, memo);
      currentSlice++;
    }, 1);
  }

  createOfflineError() {
    let response = {
      code: FeedsData.SessionError.OFFLINE,
      message: 'serverOffline',
    };
    return response;
  }

  restoreSession(nodeId: string, memo: FeedsData.SessionMemoData): boolean {
    if (this.getServerStatusFromId(nodeId) == 1) {
      let streamErrorData: FeedsEvent.StreamErrorData = {
        nodeId: nodeId,
        error: this.createOfflineError(),
      };
      return false;
    }

    let state = this.sessionService.getSessionState(nodeId);

    switch (state) {
      case 0:
      case 1:
      case 2:
      case 3:
        return false;
      case 4:
        return true;
      case 5:
      case 6:
      case 7:
      case -1:
        // this.sessionService.createSession(
        //   nodeId,
        //   memo,
        //   (session, stream) => { },
        // );
        return false;
    }
  }

  closeSession(nodeId: string): Promise<string> {
    return this.sessionService.sessionClose(nodeId);
  }

  getTextKey(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
  ) {
    this.getKey(nodeId, channelId, postId, commentId) + '-text-' + index;
  }

  getImageKey(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
  ) {
    return this.getKey(nodeId, channelId, postId, commentId) + '-img-' + index;
  }

  getImageThumbnailKey(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
  ) {
    return (
      this.getKey(nodeId, channelId, postId, commentId) +
      '-img-thumbnail-' +
      index
    );
  }

  getVideoKey(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
  ) {
    return (
      this.getKey(nodeId, channelId, postId, commentId) + '-video-' + index
    );
  }

  getVideoThumbKey(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
  ) {
    return (
      this.getKey(nodeId, channelId, postId, commentId) +
      '-video-thumbnail-' +
      index
    );
  }

  getKey(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): string {
    return this.dataHelper.getKey(nodeId, channelId, postId, commentId);
  }

  sendData(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
    videoData: any,
    imgData: any,
    tempId: string,
  ) {
    let memo: FeedsData.SessionMemoData = {
      feedId: channelId,
      postId: postId,
      commentId: commentId,
      tempId: tempId,
    };
    if (this.restoreSession(nodeId, memo)) {
      if (videoData != '') {
        let key = this.getVideoKey(nodeId, channelId, postId, commentId, index);
        this.setBinary(
          nodeId,
          key,
          videoData,
          'video',
          channelId,
          postId,
          commentId,
          memo,
        );
      } else if (imgData != '') {
        let key = this.getImageKey(nodeId, channelId, postId, commentId, index);
        this.setBinary(
          nodeId,
          key,
          imgData,
          'img',
          channelId,
          postId,
          commentId,
          memo,
        );
      }
    }
  }

  sendDataFromMsg(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
    videoData: any,
    imgData: any,
    tempId: string,
  ) {
    if (videoData != '') {
      let key = this.getVideoKey(nodeId, channelId, postId, commentId, index);
      this.feedsServiceApi.setBinaryFromMsg(
        nodeId,
        key,
        videoData,
        channelId,
        postId,
        commentId,
        tempId,
      );
    } else if (imgData != '') {
      let key = this.getImageKey(nodeId, channelId, postId, commentId, index);
      this.feedsServiceApi.setBinaryFromMsg(
        nodeId,
        key,
        imgData,
        channelId,
        postId,
        commentId,
        tempId,
      );
    }
  }

  createContent(
    text: string,
    imageThumb: FeedsData.ImgThumb[],
    videoThumb: FeedsData.VideoThumb,
  ): string {
    // {"videoThumbnail":"","imageThumbnail":[{"index":0,"imgThumb":""}]}
    // {"text":"123"}
    // {"text":"123","imageThumbnail":[{"index":0,"imgThumb":"data:image/jpeg;base64,/9j/4}]}
    // {"text":"123","videoThumbnail":"data:image/png;base64,iVB=="}
    let content = {};
    content['version'] = '1.0';
    // content["type"]="";

    if (text != '') {
      content['text'] = text;
      // content["type"] = content["type"]+"text/";
    }

    if (imageThumb != null && imageThumb.length > 0) {
      content['imageThumbnail'] = imageThumb;
      // content["type"] = content["type"]+"img/";
      // content["imgTotalNum"] = imageThumb.length;
    }

    if (
      videoThumb != null &&
      videoThumb != undefined &&
      JSON.stringify(videoThumb) != '{}'
    ) {
      content['videoThumbnail'] = videoThumb;
      // content["type"] = content["type"]+"video/";
    }

    let contentStr = JSON.stringify(content);
    return contentStr;
  }

  getContentFromId(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): FeedsData.Content {
    if (commentId == 0) {
      let post = this.getPostFromId(nodeId, channelId, postId);
      if (post == undefined) {
        return undefined;
      }
      return post.content;
    } else {
      // TODO
      return undefined;
    }
  }

  getImgThumbsKeyFromId(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): FeedsData.ImageThumbKey[] {
    let content = this.getContentFromId(nodeId, channelId, postId, commentId);
    if (content == undefined || content.imgThumbKeys == undefined)
      return undefined;

    return content.imgThumbKeys;
  }

  getImgThumbKeyFromId(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
  ): FeedsData.ImageThumbKey {
    let imgThumbKeys = this.getImgThumbsKeyFromId(nodeId, channelId, postId, commentId,);
    if (!imgThumbKeys || imgThumbKeys.length == 0 || imgThumbKeys[index] == undefined)
      return undefined;

    return imgThumbKeys[index];
  }

  getImgThumbKeyStrFromId(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
  ): string {
    let mImgThumbKey: any =
      this.getImgThumbKeyFromId(nodeId, channelId, postId, commentId, index) ||
      '';

    if (mImgThumbKey === '') {
      return '';
    }

    return mImgThumbKey.imgThumbKey;
  }

  getVideoThumbKeyFromId(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): FeedsData.VideoThumbKey {
    let content = this.getContentFromId(nodeId, channelId, postId, commentId);
    if (content == undefined) return undefined;

    return content.videoThumbKey;
  }

  getVideoThumbStrFromId(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): string {
    let mVideoThumbKey = this.getVideoThumbKeyFromId(
      nodeId,
      channelId,
      postId,
      commentId,
    );
    if (mVideoThumbKey == undefined) return undefined;

    return mVideoThumbKey.videoThumbKey;
  }

  getVideoDurationFromId(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): number {
    let mVideoThumbKey = this.getVideoThumbKeyFromId(
      nodeId,
      channelId,
      postId,
      commentId,
    );
    if (mVideoThumbKey == undefined) return undefined;

    return mVideoThumbKey.duration;
  }

  getContentVersion(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ): string {
    let content = this.getContentFromId(nodeId, channelId, postId, commentId);

    if (content == undefined || content.imgThumbKeys == undefined)
      return undefined;

    return content.version;
  }

  getContentDataSize(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
    mediaType: FeedsData.MediaType,
  ): number {
    switch (mediaType) {
      case FeedsData.MediaType.noMeida:
        return 0;
      case FeedsData.MediaType.containsImg:
        let imgThumbKey: FeedsData.ImageThumbKey = this.getImgThumbKeyFromId(
          nodeId,
          channelId,
          postId,
          commentId,
          index,
        );
        if (imgThumbKey == undefined) return 0;
        else return imgThumbKey.imgSize;
      case FeedsData.MediaType.containsVideo:
        let videoThumbKey: FeedsData.VideoThumbKey = this.getVideoThumbKeyFromId(
          nodeId,
          channelId,
          postId,
          commentId,
        );
        if (videoThumbKey == undefined) return 0;
        else return videoThumbKey.videoSize;
    }
  }

  setData(key: string, value: any): Promise<any> {
    return this.storeService.set(key, value);
  }

  getData(key: string): Promise<any> {
    return this.storeService.get(key);
  }

  setDeveloperMode(status: boolean) {
    return (this.developerMode = status);
  }

  getDeveloperMode() {
    return this.developerMode;
  }

  setHideDeletedPosts(status: boolean) {
    this.hideDeletedPosts = status;
  }

  getHideDeletedPosts() {
    return this.hideDeletedPosts;
  }

  setHideDeletedComments(status: boolean) {
    this.hideDeletedComments = status;
  }

  getHideDeletedComments() {
    return this.hideDeletedComments;
  }

  setHideOfflineFeeds(status: boolean) {
    this.hideOfflineFeeds = status;
  }

  getHideOfflineFeeds() {
    return this.hideOfflineFeeds;
  }

  removeMediaData(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
  ) {
    let imgThumbs = this.getImgThumbsKeyFromId(
      nodeId,
      channelId,
      postId,
      commentId,
    );
    if (imgThumbs != null && imgThumbs != undefined) {
      for (let index = 0; index < imgThumbs.length; index++) {
        this.storeService.remove(imgThumbs[index].imgThumbKey);
        let imgKey = this.getImageKey(
          nodeId,
          channelId,
          postId,
          commentId,
          imgThumbs[index].index,
        );
        this.storeService.remove(imgKey);
      }
    }

    let videoThumb = this.getVideoThumbKeyFromId(
      nodeId,
      channelId,
      postId,
      commentId,
    );
    if (videoThumb != null && videoThumb != undefined) {
      this.storeService.remove(videoThumb.videoThumbKey);
      let videoKey = this.getVideoKey(nodeId, channelId, postId, commentId, 0);
      this.storeService.remove(videoKey);
    }
  }

  updateLastPostUpdate(
    key: string,
    nodeId: string,
    channelId: string,
    updatedAt: number,
  ) {
    let lastPostUpdate = this.dataHelper.getLastPostUpdate(key);
    if (lastPostUpdate == null || lastPostUpdate == undefined) {
      lastPostUpdate = this.dataHelper.generateLastPostUpdate(
        nodeId,
        channelId,
        updatedAt + 1,
      );
    } else {
      let oldTime = lastPostUpdate.time || 0;
      if (oldTime > updatedAt) {
        return;
      }
      lastPostUpdate.time = updatedAt + 1;
    }
    this.dataHelper.updateLastPostUpdate(key, lastPostUpdate);
  }

  updateLastSubscribedFeedsUpdate(nodeId: string, updatedAt: number) {
    let lastSubscribedFeedUpdate = this.dataHelper.getLastSubscribedFeedsUpdate(
      nodeId,
    );
    if (
      lastSubscribedFeedUpdate == null ||
      lastSubscribedFeedUpdate == undefined
    ) {
      lastSubscribedFeedUpdate = {
        nodeId: nodeId,
        time: updatedAt + 1,
      };
    } else {
      let oldTime =
        this.dataHelper.getLastSubscribedFeedsUpdateTime(nodeId) || 0;
      if (oldTime > updatedAt) {
        return;
      }
      lastSubscribedFeedUpdate.time = updatedAt + 1;
    }
    this.dataHelper.updateLastSubscribedFeedsUpdate(
      nodeId,
      lastSubscribedFeedUpdate,
    );
  }

  updateLastCommentUpdate(
    key: string,
    nodeId: string,
    channelId: string,
    postId: string,
    updatedAt: number,
  ) {
    let lastCommentUpdate = this.dataHelper.getLastCommentUpdate(key);
    if (lastCommentUpdate == null || lastCommentUpdate == undefined) {
      lastCommentUpdate = this.dataHelper.generateLastCommentUpdate(
        nodeId,
        channelId,
        postId,
        updatedAt + 1,
      );
    } else {
      let oldTime = this.dataHelper.getLastCommentUpdateTime(key) || 0;
      if (oldTime > updatedAt) {
        return;
      }
      lastCommentUpdate.time = updatedAt + 1;
    }
    this.dataHelper.updateLastComment(key, lastCommentUpdate);
  }

  handleSessionError(nodeId: string, error: any) {
    // eventBus.publish("sessionResponse:error",nodeId, error);
    this.translateBinaryError(nodeId, error.code);
    this.closeSession(nodeId);
    Logger.log(TAG, 'Session error :: nodeId : ', nodeId, ' errorCode: ', error.code, ' errorMessage:', error.message);
  }

  createVideoContent(
    postText: string,
    videoThumb: any,
    durition: number,
    videoSize: number,
  ): string {
    let videoThumbs: FeedsData.VideoThumb = {
      videoThumb: videoThumb,
      duration: durition,
      videoSize: videoSize,
    };
    return this.createContent(postText, null, videoThumbs);
  }

  createOneImgContent(
    postText: string,
    imageThumb: any,
    imageSize: number,
  ): string {
    let imgThumbs: FeedsData.ImgThumb[] = [];
    let imgThumb: FeedsData.ImgThumb = {
      index: 0,
      imgThumb: imageThumb,
      imgSize: imageSize,
    };
    imgThumbs.push(imgThumb);

    return this.createContent(postText, imgThumbs, null);
  }

  processGetBinary(
    nodeId: string,
    channelId: string,
    postId: string,
    commentId: number,
    index: number,
    mediaType: FeedsData.MediaType,
    key: string,
    onSuccess: (transDataChannel: FeedsData.TransDataChannel) => void,
    onError: (err: string) => void,
  ) {
    if (this.getServerStatusFromId(nodeId) == 1) {
      // this.native.toast(this.formatInfoService.formatOfflineMsg(this.getServerNameByNodeId(nodeId)));
      onError(nodeId + 'offline');
      return;
    }

    let size = this.getContentDataSize(
      nodeId,
      channelId,
      postId,
      commentId,
      index,
      mediaType,
    );
    if (size > this.throwMsgTransDataLimit) {
      if (!this.sessionService.checkSessionIsBusy()) {
        this.restoreSession(nodeId, null);
        onSuccess(FeedsData.TransDataChannel.SESSION);
      } else {
        onError('');
      }
      return;
    }

    this.feedsServiceApi.getBinaryFromMsg(nodeId, key);
    onSuccess(FeedsData.TransDataChannel.MESSAGE);
    return;
  }

  translateBinaryError(nodeId: string, errorCode: number) {
    let errorMsg = this.translate.instant('ErrorInfo.UnknownError');
    switch (errorCode) {
      case FeedsData.SessionError.UnknownError:
        errorMsg = this.translate.instant('ErrorInfo.UnknownError');
        break;
      case FeedsData.SessionError.UnimplementedError:
        errorMsg = this.translate.instant('ErrorInfo.UnimplementedError');
        break;
      case FeedsData.SessionError.NotFoundError:
        errorMsg = this.translate.instant('ErrorInfo.NotFoundError');
        break;
      case FeedsData.SessionError.InvalidArgument:
        errorMsg = this.translate.instant('ErrorInfo.InvalidArgument');
        break;
      case FeedsData.SessionError.PointerReleasedError:
        errorMsg = this.translate.instant('ErrorInfo.PointerReleasedError');
        break;
      case FeedsData.SessionError.DevUUIDError:
        errorMsg = this.translate.instant('ErrorInfo.DevUUIDError');
        break;
      case FeedsData.SessionError.FileNotExistsError:
        errorMsg = this.translate.instant('ErrorInfo.FileNotExistsError');
        break;
      case FeedsData.SessionError.CreateDirectoryError:
        errorMsg = this.translate.instant('ErrorInfo.CreateDirectoryError');
        break;
      case FeedsData.SessionError.SizeOverflowError:
        errorMsg = this.translate.instant('ErrorInfo.SizeOverflowError');
        break;
      case FeedsData.SessionError.StdSystemError:
        errorMsg = this.translate.instant('ErrorInfo.StdSystemError');
        break;
      case FeedsData.SessionError.OutOfMemoryError:
        errorMsg = this.translate.instant('ErrorInfo.OutOfMemoryError');
        break;
      case FeedsData.SessionError.DidNotReady:
        errorMsg = this.translate.instant('ErrorInfo.DidNotReady');
        break;
      case FeedsData.SessionError.InvalidAccessToken:
        errorMsg = this.translate.instant('ErrorInfo.InvalidAccessToken');
        break;
      case FeedsData.SessionError.NotAuthorizedError:
        errorMsg = this.translate.instant('ErrorInfo.NotAuthorizedError');
        break;
      case FeedsData.SessionError.CarrierSessionInitFailed:
        errorMsg = this.translate.instant('ErrorInfo.CarrierSessionInitFailed');
        break;
      case FeedsData.SessionError.CarrierSessionConnectFailed:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionConnectFailed',
        );
        break;
      case FeedsData.SessionError.CarrierSessionCreateFailed:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionCreateFailed',
        );
        break;
      case FeedsData.SessionError.CarrierSessionAddStreamFailed:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionAddStreamFailed',
        );
        break;
      case FeedsData.SessionError.CarrierSessionTimeoutError:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionTimeoutError',
        );
        break;
      case FeedsData.SessionError.CarrierSessionReplyFailed:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionReplyFailed',
        );
        break;
      case FeedsData.SessionError.CarrierSessionStartFailed:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionStartFailed',
        );
        break;
      case FeedsData.SessionError.CarrierSessionBadStatus:
        errorMsg = this.translate.instant('ErrorInfo.CarrierSessionBadStatus');
        break;
      case FeedsData.SessionError.CarrierSessionDataNotEnough:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionDataNotEnough',
        );
        break;
      case FeedsData.SessionError.CarrierSessionUnsuppertedVersion:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionUnsuppertedVersion',
        );
        break;
      case FeedsData.SessionError.CarrierSessionReleasedError:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionReleasedError',
        );
        break;
      case FeedsData.SessionError.CarrierSessionSendFailed:
        errorMsg = this.translate.instant('ErrorInfo.CarrierSessionSendFailed');
        break;
      case FeedsData.SessionError.CarrierSessionErrorExists:
        errorMsg = this.translate.instant(
          'ErrorInfo.CarrierSessionErrorExists',
        );
        break;
      case FeedsData.SessionError.MassDataUnknownReqFailed:
        errorMsg = this.translate.instant('ErrorInfo.MassDataUnknownReqFailed');
        break;
      case FeedsData.SessionError.MassDataUnmarshalReqFailed:
        errorMsg = this.translate.instant(
          'ErrorInfo.MassDataUnmarshalReqFailed',
        );
        break;
      case FeedsData.SessionError.MassDataMarshalRespFailed:
        errorMsg = this.translate.instant(
          'ErrorInfo.MassDataMarshalRespFailed',
        );
        break;
      case FeedsData.SessionError.MassDataUnsupportedVersion:
        errorMsg = this.translate.instant(
          'ErrorInfo.MassDataUnsupportedVersion',
        );
        break;
      case FeedsData.SessionError.MassDataUnsupportedAlgo:
        errorMsg = this.translate.instant('ErrorInfo.MassDataUnsupportedAlgo');
        break;
      case FeedsData.SessionError.STREAM_STATE_DEACTIVATED:
        errorMsg = this.translate.instant('ErrorInfo.STREAM_STATE_DEACTIVATED');
        break;
      case FeedsData.SessionError.STREAM_STATE_CLOSED:
        errorMsg = this.translate.instant('ErrorInfo.STREAM_STATE_CLOSED');
        break;
      case FeedsData.SessionError.STREAM_STATE_ERROR:
        errorMsg = this.translate.instant('ErrorInfo.STREAM_STATE_ERROR');
        break;
      case FeedsData.SessionError.WRITE_DATA_ERROR:
        errorMsg = this.translate.instant('ErrorInfo.WRITE_DATA_ERROR');
        break;
      case FeedsData.SessionError.SESSION_CREATE_TIMEOUT:
        errorMsg = this.translate.instant('ErrorInfo.SESSION_CREATE_TIMEOUT');
        break;
      case FeedsData.SessionError.SESSION_NEW_SESSION_ERROR:
        errorMsg = this.translate.instant(
          'ErrorInfo.SESSION_NEW_SESSION_ERROR',
        );
        break;
      case FeedsData.SessionError.SESSION_ADD_STREAM_ERROR:
        errorMsg = this.translate.instant('ErrorInfo.SESSION_ADD_STREAM_ERROR');
        break;
      case FeedsData.SessionError.SESSION_REQUEST_ERROR:
        errorMsg = this.translate.instant('ErrorInfo.SESSION_REQUEST_ERROR');
        break;
      case FeedsData.SessionError.SESSION_START_ERROR:
        errorMsg = this.translate.instant('ErrorInfo.SESSION_START_ERROR');
        break;
    }
    this.native.toastWarn(
      this.formatInfoService.formatErrorMsg(
        this.feedsServiceApi.getServerNameByNodeId(nodeId),
        errorMsg,
      ),
    );
  }

  checkBindingServerVersion(quit: any): boolean {
    let bindingServer = this.dataHelper.getBindingServer();
    Logger.log(TAG, 'Binded server is ', bindingServer);
    if (bindingServer == null || bindingServer == undefined) return;

    let serverVersion = this.dataHelper.getServerVersion(bindingServer.nodeId);
    if (serverVersion == null || serverVersion == undefined) return;

    let serverVersionName = this.getServerVersionByNodeId(bindingServer.nodeId);
    let currentVC = this.feedsServiceApi.getServerVersionCodeByNodeId(bindingServer.nodeId);
    // let currentVC = this.serverVersions[bindingServer.nodeId].versionCode;
    if (serverVersionName == '' || currentVC < Config.versionCode) {
      this.popupProvider
        .ionicAlert(this, '', 'common.mustUpdate', quit, 'tskth.svg')
        .then(popover => {
          this.alertPopover = popover;
        });
      return false;
    }
    return true;
  }

  hideAlertPopover() {
    if (this.alertPopover != null && this.alertPopover != undefined) {
      this.alertPopover.dismiss();
    }
  }

  getServerVersionByNodeId(nodeId: string): string {
    return this.dataHelper.getServerVersionName(nodeId);
  }

  afterFriendConnection(friendId: string) {
    let server = this.dataHelper.getServer(friendId) || null;
    if (server != null) this.doFriendConnection(friendId);
  }

  addFeed(
    feedUrl: string,
    avatar: string,
    follower: number,
    feedName: string,
    ownerName: string,
    feedDes: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let decodeResult: FeedsData.FeedUrl = this.addFeedService.decodeFeedUrl(
        feedUrl,
      );
      let nodeId = await this.addFeedService.getNodeIdFromAddress(
        decodeResult.carrierAddress,
      );

      let feeds = this.getChannelFromId(nodeId, decodeResult.feedId) || null;
      let isFriend = await this.addFeedService.checkIsFriends(nodeId);
      if (isFriend && feeds != null && feeds.isSubscribed) {
        this.native.toast('common.channelAlreadyAdded');
        resolve('success');
        return;
      }

      this.addFeedService
        .addFeed(
          decodeResult,
          nodeId,
          avatar,
          follower,
          feedName,
          ownerName,
          feedDes,
        )
        .then((toBeAddedFeed: FeedsData.ToBeAddedFeed) => {
          if (toBeAddedFeed.friendState == FeedsData.FriendState.IS_FRIEND) {
            Logger.log(TAG, 'The service is already a friend, nodeId is ', nodeId);
            let isSubscribed = this.checkFeedsIsSubscribed(
              toBeAddedFeed.nodeId,
              toBeAddedFeed.feedId,
            );
            if (!isSubscribed) {
              this.feedsServiceApi.subscribeChannel(toBeAddedFeed.nodeId, toBeAddedFeed.feedId);
            }

            this.saveServer(
              toBeAddedFeed.feedName,
              toBeAddedFeed.did,
              'Unknow',
              toBeAddedFeed.did,
              toBeAddedFeed.carrierAddress,
              toBeAddedFeed.serverUrl,
              toBeAddedFeed.nodeId,
            );
            resolve('success');
            return;
          }

          this.saveServer(
            'Unknow',
            toBeAddedFeed.did,
            'Unknow',
            toBeAddedFeed.did,
            toBeAddedFeed.carrierAddress,
            toBeAddedFeed.serverUrl,
            toBeAddedFeed.nodeId,
          );
          resolve('success');
        })
        .catch(reason => {
          Logger.error(TAG, 'AddFeed error, ', reason);
          reject('fail');
        });
    });
  }

  getToBeAddedFeedsList(): FeedsData.ToBeAddedFeed[] {
    return this.addFeedService.getToBeAddedFeedsList();
  }

  checkIsTobeAddedFeeds(nodeId: string, feedsId: number): boolean {
    return this.addFeedService.checkIsTobeAddedFeeds(nodeId, feedsId);
  }

  setFeedPublicStatus(feedPublicStatus: any) {
    this.feedPublicStatus = feedPublicStatus;
  }

  getFeedPublicStatus() {
    return this.feedPublicStatus;
  }

  async processTobeAddedFeedsFinish(nodeId: string, feedsId: number) {
    // if (this.checkIsTobeAddedFeeds(nodeId, feedsId)){
    //   eventBus.publish(FeedsEvent.PublishType.addFeedFinish, nodeId, feedsId);
    // }
    await this.addFeedService.processTobeAddedFeedsFinish(nodeId, feedsId);
  }

  removeTobeAddedFeeds(nodeId: string, feedId: number): Promise<void> {
    return this.addFeedService.removeTobeAddedFeedStatusByNodeFeedId(
      nodeId,
      feedId,
    );
  }

  continueAddFeeds(nodeId: string, feedId: number, carrierAddress: string) {
    this.addFeedService.addFriends(nodeId, carrierAddress);
  }

  checkValueValid(value: string): boolean {
    let regEx = new RegExp(
      "[`~!@#$%^&*()+=|{}':;',\\[\\]<>/?~！@#￥%……&*（）——+|{}【】《》‘；：”“’。，、？]",
    );
    return regEx.test(value);
  }

  signOut(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let isSuccess: boolean = false;
      this.storeService
        .remove('signInData')
        .then(async () => {
          //this.resetConnectionStatus();
          //this.destroyCarrier();
          await this.dataHelper.removeData("feeds.currentChannel");
          isSuccess = true;
          resolve(isSuccess);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  signIn(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let res = await this.credaccess();
      if (!res) {
        Logger.error(TAG, 'SignIn error, credaccess result is ', res);
        reject('common.didSigninError1');
        return;
      }

      let did = await this.decodeSignInData(res);
      if (!did) {
        Logger.log(TAG, 'Use didManager VerifiablePresentationBuilder error, did result is ', did);
        reject('common.didSigninError2');
        return;
      }
      resolve(did);
      // this.carrierService.init(did);
    });
  }

  decodeSignInData(result: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Start decode signin data', JSON.stringify(result));

        const decodeResult = this.didHelperService.decodeSignInData(JSON.stringify(result));
        if (decodeResult) {
          await this.saveSignInData(decodeResult.did, decodeResult.name, null, decodeResult.email,
            decodeResult.telephone, decodeResult.nation, decodeResult.nickname, decodeResult.description);
          resolve(decodeResult.did);
        } else {
          resolve(null);
        }
      } catch (error) {
        Logger.error(TAG, 'Decode signin data error', error);
        resolve(null);
      }
    });
  }

  credaccess(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let response = await this.standardAuth.getCredentials();
        Logger.log(TAG, 'Cred access response', response);
        // let response = await this.intentService.credaccessWithParams();
        if (response) {
          resolve(response);
          return;
        }
        Logger.error(TAG, 'Credaccess error, response is', response);
        resolve(null);
      } catch (error) {
        Logger.error(TAG, error);
        resolve(null);
      }
    });
  }

  async cleanAllData() {
    await this.addFeedService.cleanTobeAddedFeedMap();
    await this.storeService.clearAll();
    this.cleanCacheData();
  }

  cleanCacheData() {
    this.dataHelper.initChannelsMap();
    this.dataHelper.initUnreadMap();
    this.dataHelper.initServerStatisticMap();
    this.dataHelper.initCommentsMap();
    this.dataHelper.initServersConnectionStatus();
    this.dataHelper.initLikeMap();
    this.dataHelper.initLikedCommentMap();
    this.dataHelper.initLastPostUpdateMap();

    this.dataHelper.initBindingServer();
    bindingServerCache = null;
    this.dataHelper.initServerMap();
    this.dataHelper.initAccessTokenMap();
    this.dataHelper.initNotificationList();
    cacheBindingAddress = '';
    this.dataHelper.initLocalCredential();

    this.feedPublicStatus = {};

    this.channelInfo = {};
    this.dataHelper.initPostMap();

    this.curtab = 'home';
    this.nonce = '';
    this.realm = '';
    this.serviceNonce = '';
    this.serviceRealm = '';
    this.profileIamge = 'assets/images/profile-1.svg';
    this.clipProfileIamge = '';
    this.selsectIndex = 1;

    this.isLogging = {};
    this.signinChallengeTimeout = null;
    this.isSavingChannel = false;
    // this.isDeclearing = false;
    // this.declareOwnerTimeout = null;
    // this.declareOwnerInterval = null;
    // this.isDeclareFinish = false;

    this.dataHelper.initLastSubscribedFeedsUpdateMap();
    this.dataHelper.initLastCommentUpdateMap();
    this.dataHelper.initLastMultiLikesAndCommentsCountUpdateMap();
    this.lastMultiLikesAndCommentsCountUpdateMapCache = {};

    this.alertPopover = null;
    this.dataHelper.initServerVersion();
  }

  getToBeAddedFeedsInfoByNodeFeedId(nodeId: string, feedId: number) {
    return this.addFeedService.getToBeAddedFeedsInfoByNodeFeedId(
      nodeId,
      feedId,
    );
  }

  getSyncPostLastUpdate(nodeId: string, feedsId: string): number {
    let ncId = this.getChannelId(nodeId, feedsId);
    return this.dataHelper.getSyncPostStatusLastUpdateTime(ncId);
  }

  generateSyncPostStatus(
    nodeId: string,
    feedsId: string,
    isSyncFinish: boolean,
    lastUpdate: number,
  ) {
    let ncId = this.getChannelId(nodeId, feedsId);
    let syncPostStatus = this.dataHelper.generateSyncPostStatus(
      nodeId,
      feedsId,
      isSyncFinish,
      lastUpdate,
    );
    this.dataHelper.updateSyncPostStatus(ncId, syncPostStatus);
  }

  checkSyncPostStatus(nodeId: string, feedsId: string): boolean {
    let ncId = this.getChannelId(nodeId, feedsId);
    return this.dataHelper.isSyncPostFinish(ncId);
  }

  getSyncCommentLastUpdate(
    nodeId: string,
    feedsId: string,
    postId: string,
  ): number {
    let ncpId = this.getPostId(nodeId, feedsId, postId);
    return this.dataHelper.getSyncCommentLastUpdateTime(ncpId);
  }

  generateSyncCommentStatus(
    nodeId: string,
    feedsId: string,
    postId: string,
    isSyncFinish: boolean,
    lastUpdate: number,
  ) {
    let ncpId = this.getPostId(nodeId, feedsId, postId);
    let syncCommentStatus = this.dataHelper.generateSyncCommentStatus(
      nodeId,
      feedsId,
      postId,
      isSyncFinish,
      lastUpdate,
    );
    this.dataHelper.updateSyncCommentStatus(ncpId, syncCommentStatus);
  }

  checkSyncCommentStatus(
    nodeId: string,
    feedsId: string,
    postId: string,
  ): boolean {
    let ncpId = this.getPostId(nodeId, feedsId, postId);
    return this.dataHelper.isSyncCommnetFinish(ncpId);
  }

  getCurrentChannel() {
    return this.currentFeed;
  }

  setCurrentChannel(currentFeed: any) {
    this.currentFeed = currentFeed;
  }

  getDiscoverfeeds() {
    return this.discoverfeeds;
  }

  setDiscoverfeeds(discoverfeeds: any) {
    return (this.discoverfeeds = discoverfeeds);
  }



  generateTempPostId() {
    return this.dataHelper.generateLastTempIdData();
  }

  deleteTempPostId(id: string) {
    this.dataHelper.deleteTempIdData(id);
  }

  listTempData(nodeId: string) {
    this.dataHelper.listTempData(nodeId);
  }

  onReceivedStreamStateChanged() {
    eventBus.subscribe(
      FeedsEvent.PublishType.innerStreamStateChanged,
      (streamStateChangedData: FeedsEvent.StreamStateChangedData) => {
        let nodeId = streamStateChangedData.nodeId;
        let state = streamStateChangedData.streamState;
        if (state != FeedsData.StreamState.CONNECTED) return;
        this.sendPostDataWithSession(nodeId);
      },
    );
  }

  sendMediaData(nodeId: string, feedId: string, tempId: string) {
    let key = this.getPostId(nodeId, feedId, tempId);
    let tempData = this.dataHelper.getTempData(key);
    let transDataChannel = tempData.transDataChannel;
    let postId = tempData.postId;
    let videoData = tempData.videoData;
    let imageData = tempData.imageData;

    if (transDataChannel == FeedsData.TransDataChannel.MESSAGE) {
      this.sendDataFromMsg(
        nodeId,
        feedId,
        postId,
        0,
        0,
        videoData,
        imageData,
        tempId,
      );
      return;
    }

    let sessionState = this.sessionService.getSessionState(nodeId);
    if (sessionState != FeedsData.StreamState.CONNECTED) return;

    let isBusy = this.sessionService.checkSessionIsBusy();
    if (!isBusy)
      this.sendData(nodeId, feedId, postId, 0, 0, videoData, imageData, tempId);
  }

  sendPostDataWithSession(nodeId: string) {
    let list = this.dataHelper.listTempData(nodeId);
    for (let index = 0; index < list.length; index++) {
      const tempData = list[index];
      if (tempData == null || tempData == undefined) continue;
      if (
        tempData.status == FeedsData.SendingStatus.needPushData &&
        tempData.transDataChannel == FeedsData.TransDataChannel.SESSION
      ) {
        this.sendData(
          tempData.nodeId,
          tempData.feedId,
          tempData.postId,
          0,
          0,
          tempData.videoData,
          tempData.imageData,
          tempData.tempPostId,
        );
        return;
      }
    }
  }

  sendPostDataWithMsg(nodeId: string) {
    let list = this.dataHelper.listTempData(nodeId);
    for (let index = 0; index < list.length; index++) {
      const tempData = list[index];
      if (tempData == null || tempData == undefined) continue;
      if (
        tempData.status == FeedsData.SendingStatus.needPushData &&
        tempData.transDataChannel == FeedsData.TransDataChannel.MESSAGE
      ) {
        this.sendDataFromMsg(
          tempData.nodeId,
          tempData.feedId,
          tempData.postId,
          0,
          0,
          tempData.videoData,
          tempData.imageData,
          tempData.tempPostId,
        );
        return;
      }
    }
  }

  onReceivedSetBinaryFinish() {

    this.events.subscribe(
      FeedsEvent.PublishType.innerStreamSetBinaryFinish,
      async (setBinaryData: FeedsEvent.setBinaryFinishData) => {
        let nodeId = setBinaryData.nodeId;
        let feedId = setBinaryData.feedId;
        let tempId = setBinaryData.tempId;
        this.setBinaryFinish(nodeId, feedId, tempId);
        await this.closeSession(nodeId);
        this.sendPostDataWithSession(nodeId);
      },
    );
  }

  onReceivedSessionErrorCallback() {
    this.events.subscribe(
      FeedsEvent.PublishType.innerStreamError,
      (innerStreamErrorData: FeedsEvent.InnerStreamErrorData) => {
        let nodeId = innerStreamErrorData.nodeId;
        let error = innerStreamErrorData.error;
        let memo: FeedsData.SessionMemoData = innerStreamErrorData.memo;

        if (memo == null || memo == undefined) return;
        let feedId = memo.feedId || "0";
        let tempId = memo.tempId || "0";

        let tempKey = this.getPostId(nodeId, feedId, tempId);
        let post: FeedsData.Post = this.dataHelper.getPost(tempKey);
        if (post == null || post == undefined) return;

        post.post_status = FeedsData.PostCommentStatus.error;
        this.dataHelper.updatePost(tempKey, post);
      },
    );
  }

  setBinaryFinish(nodeId: string, feedId: string, tempId: string) {
    let key = this.getPostId(nodeId, feedId, tempId);
    let tempData = this.dataHelper.getTempData(key);
    if (tempData == null || tempData == undefined) return;
    tempData.status = FeedsData.SendingStatus.needNotifyPost;
    this.dataHelper.updateTempData(key, tempData);
    this.feedsServiceApi.notifyPost(
      tempData.nodeId,
      tempData.feedId,
      tempData.postId,
      tempData.tempPostId,
    );
  }

  republishOnePost(nodeId: string, feedId: string, tempId: string) {
    let key = this.getPostId(nodeId, feedId, tempId);
    let tempData = this.dataHelper.getTempData(key);
    this.processRepublishPost(tempData);
  }

  republishPost(nodeId: string) {
    let list: FeedsData.TempData[] = this.dataHelper.listTempData(nodeId);

    for (let index = 0; index < list.length; index++) {
      const tempData = list[index];
      this.processRepublishPost(tempData);
    }
  }

  processRepublishPost(tempData: FeedsData.TempData) {
    if (tempData == null || tempData == undefined) return;
    switch (tempData.status) {
      case FeedsData.SendingStatus.normal:
        const tempContent = tempData.content;
        const content = this.postHelperService.createContent(tempContent.text, tempContent.mediaDatas);
        this.feedsServiceApi.publishPost(
          tempData.nodeId,
          tempData.feedId,
          content,
          tempData.tempPostId,
        );
        return;
      case FeedsData.SendingStatus.needDeclearPost:
        this.feedsServiceApi.declarePost(
          tempData.nodeId,
          tempData.feedId,
          tempData.content,
          false,
          tempData.tempPostId,
          tempData.transDataChannel,
          tempData.imageData,
          tempData.videoData,
        );
        return;
      case FeedsData.SendingStatus.needPushData:
        if (tempData.transDataChannel == FeedsData.TransDataChannel.MESSAGE) {
          this.sendDataFromMsg(
            tempData.nodeId,
            tempData.feedId,
            tempData.postId,
            tempData.commentId,
            0,
            tempData.videoData,
            tempData.imageData,
            tempData.tempPostId,
          );
          return;
        }
        if (tempData.transDataChannel == FeedsData.TransDataChannel.SESSION) {
          let isBusy = this.sessionService.checkSessionIsBusy();
          if (!isBusy)
            this.sendData(
              tempData.nodeId,
              tempData.feedId,
              tempData.postId,
              tempData.commentId,
              0,
              tempData.videoData,
              tempData.imageData,
              tempData.tempPostId,
            );
          return;
        }
      case FeedsData.SendingStatus.needNotifyPost:
        this.feedsServiceApi.notifyPost(
          tempData.nodeId,
          tempData.feedId,
          tempData.postId,
          tempData.tempPostId,
        );
        return;
    }
  }

  checkPostIsAvalible(post: FeedsData.Post): boolean {
    if (post == null || post == undefined) {
      this.native.toastWarn('common.currentPostError');
      return false;
    }

    if (
      this.getConnectionStatus() == FeedsData.ConnState.disconnected &&
      (post.post_status == FeedsData.PostCommentStatus.sending ||
        post.post_status == FeedsData.PostCommentStatus.error)
    ) {
      this.native.toastWarn('common.connectionError');
      return false;
    }

    let serverStatus = this.getServerStatusFromId(post.nodeId);
    if (
      serverStatus == FeedsData.ConnState.disconnected &&
      (post.post_status == FeedsData.PostCommentStatus.sending ||
        post.post_status == FeedsData.PostCommentStatus.error)
    ) {
      this.native.toastWarn('common.connectionError1');
      return false;
    }

    if (post.post_status == FeedsData.PostCommentStatus.sending) {
      this.native.toastWarn('common.sendingTip');
      return false;
    }

    if (post.post_status == FeedsData.PostCommentStatus.error) {
      this.native.toastWarn('common.sendingErrorTip');
      return false;
    }

    return true;
  }

  getBindPublisherAccountType() {
    return this.bindPublisherAccountType;
  }

  setBindPublisherAccountType(publisherAccountType: string) {
    this.bindPublisherAccountType = publisherAccountType;
  }

  getCollectibleStatus() {
    return this.collectibleStatus;
  }

  setCollectibleStatus(collectibleStatus: any) {
    this.collectibleStatus = collectibleStatus;
  }

  setEidURL(url: string) {
    didManager.setResolverUrl(
      url,
      () => {
        Logger.log(TAG, 'Set resolve url success, url is', url);
      },
      error => {
        Logger.log(TAG, 'Set resolve url error, error is', error);
      },
    );
  }

  // async getUserAvatar(userDid: string): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     let signinData = this.getSignInData();
  //     if (signinData == null || signinData == undefined) {
  //       resolve('assets/images/default-contact.svg');
  //       return;
  //     }

  //     let userDid = signinData.did;
  //     let avatar = await this.dataHelper.loadUserAvatar(userDid);
  //     if (avatar) {
  //       resolve(avatar);
  //       return;
  //     }
  //     const loadKey = UtilService.getESSAvatarKey(userDid);
  //     let essavatar = await this.dataHelper.loadUserAvatar(loadKey);

  //     if (essavatar) {
  //       resolve(essavatar)
  //       return
  //     }

  //     resolve('assets/images/default-contact.svg');
  //     return;
  //   });
  // }

  setPasarListGrid(pasarListGrid: boolean) {
    this.pasarListGrid = pasarListGrid;
  }

  getPasarListGrid() {
    return this.pasarListGrid;
  }

  setSelsectNftImage(selsectNftImage: any) {
    this.selsectNftImage = selsectNftImage;
  }

  getSelsectNftImage() {
    return this.selsectNftImage;
  }

  setElaUsdPrice(elaUsdPrice: string) {
    this.elaUsdPrice = elaUsdPrice;
  }

  getElaUsdPrice() {
    return this.elaUsdPrice;
  }

  setNftFirstdisclaimer(nftFirstdisclaimer: string) {
    this.nftFirstdisclaimer = nftFirstdisclaimer;
  }

  getNftFirstdisclaimer() {
    return this.nftFirstdisclaimer;
  }

  // syncOpenOrder() {
  //   this.nftContractHelperService.syncOpenOrderFromAssist().catch(() => {
  //   });
  // }

  getWhiteListData() {
    return this.whiteListData;
  }

  setWhiteListData(whiteListData: FeedsData.WhiteItem[]) {
    this.whiteListData = whiteListData;
  }

  async getDidUri() {
    const signinData = this.getSignInData();
    const did = this.userDIDService.getSigninDid(signinData);
    const userDidUri = await this.userDIDService.getDidUri(did);
    return userDidUri;
  }

  getSigninDidObj() {
    const signinData = this.getSignInData();
    const signinDid = this.userDIDService.getSigninDid(signinData);
    return this.userDIDService.getUserDidObj(signinDid);
  }

  resolveDidObjectForName(didString: string): Promise<{ name: string }> {
    return this.didHelperService.resolveDidObjectForName(didString);
  }

  getDidFromWalletAddress(walletAddress: string): Promise<FeedsData.DidObj> {
    return new Promise(async (resolve, reject) => {
      try {
        let didObj = this.dataHelper.getDidMapper(walletAddress)
        if (didObj) {
          resolve(didObj);
          return;
        }
        didObj = await this.pasarAssistService.getDidFromAddress(walletAddress);
        if (didObj)
          this.dataHelper.addDidMapper(walletAddress, didObj);
        resolve(didObj);
      } catch (error) {
        reject(error);
        Logger.error(TAG, 'Get did from dddress error', error);
      }
    });
  }
}
