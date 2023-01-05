import { Injectable } from '@angular/core';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { UtilService } from 'src/app/services/utilService';
import { Logger } from './logger';
import { HiveVaultResultParse } from './hivevault_resultparse.service';
import { TwitterService } from 'src/app/services/TwitterService';
import { RedditService } from 'src/app/services/RedditService';
import { FileHelperService } from './FileHelperService';
import _ from 'lodash';
import { Config } from './config';
import { VaultNotFoundException } from '@elastosfoundation/hive-js-sdk';
import { DIDHelperService } from 'src/app/services/did_helper.service';

const TAG = 'HiveVaultController';

@Injectable()
export class HiveVaultController {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  constructor(private hiveVaultApi: HiveVaultApi,
    private dataHelper: DataHelper,
    private postHelperService: PostHelperService,
    private fileHelperService: FileHelperService,
    private eventBus: Events,
    private twitterService: TwitterService,
    private redditService: RedditService,
    private didHelper: DIDHelperService,
  ) {
  }

  //Test
  syncAllPostWithTime(endTime: number): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribedChannels = await this.dataHelper.getSelfSubscribedChannelV3List();
        if (subscribedChannels.length === 0) {
          resolve([]);
          return;
        }

        let postList = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const channelId = subscribedChannel.channelId
          const destDid = subscribedChannel.targetDid

          this.dataHelper.cleanOldestPostV3();

          try {
            const posts = await this.queryPostByChannelIdWithTimeFromRemote(destDid, channelId, endTime, null);
            postList = _.differenceWith(postList, posts);
          } catch (error) {
          }
        }
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Get all subscribed channel post error', error);
        reject(error);
      }
    });
  }

  /** sync data doRefresh use */
  syncAllPost(): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // const subscribedChannels = await this.dataHelper.getBackupSubscribedChannelV3List();
        const subscribedChannels = await this.dataHelper.getSelfSubscribedChannelV3List();
        if (subscribedChannels.length === 0) {
          resolve([]);
          return;
        }

        let postList = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const channelId = subscribedChannel.channelId
          const destDid = subscribedChannel.targetDid

          this.dataHelper.cleanOldestPostV3();

          try {
            const posts = await this.queryPostByChannelIdWithTimeFromRemote(destDid, channelId, UtilService.getCurrentTimeNum(), null);
            postList.push(posts);
          } catch (error) {
          }
        }
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Get all subscribed channel post error', error);
        reject(error);
      }
    });
  }

  syncAllComments(): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let commentList = [];
        const selfDid = (await this.dataHelper.getSigninData()).did;
        const subscribedChannels = await this.dataHelper.getSubscribedChannelByUser(selfDid);
        if (!subscribedChannels) {
          resolve(commentList);
          return;
        }

        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.targetDid;
          const channelId = subscribedChannel.channelId;

          try {
            const comments = await this.queryCommentByChannelIdFromRemote(destDid, channelId);
            commentList.push(comments);
          } catch (error) {
          }
        }
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Sync all comment error', error);
        reject(error);
      }
    });
  }

  syncPostFromChannel(destDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const selfDid = (await this.dataHelper.getSigninData()).did;
        let postList = [];
        if (destDid == selfDid) {
          const posts = await this.syncSelfPostsByChannel(channelId);
          postList.push(posts);
        } else {
          const posts = await this.syncPostListByChannel(destDid, channelId);
          postList.push(posts);
        }
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Sync post from channel error', error);
        reject(error);
      }
    });
  }

  syncCommentFromChannel(destDid: string, channelId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryCommentByChannel(destDid, channelId);
        const commentList = await this.handleCommentResult(destDid, result);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Sync comment from post error', error);
        reject(error);
      }
    });
  }

  syncCommentFromPost(destDid: string, channelId: string, postId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryCommentByPostId(destDid, channelId, postId);
        const commentList = await this.handleCommentResult(destDid, result);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Sync comment from post error', error);
        reject(error);
      }
    });
  }

  syncLikeDataFromChannel(destDid: string, channelId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeByChannel(destDid, channelId);
        const likeList = this.handleLikeResult(destDid, result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Sync comment from post error', error);
        reject(error);
      }
    });
  }

  syncAllLikeData(): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const selfDid = (await this.dataHelper.getSigninData()).did;
        const subscribedChannels = await this.dataHelper.getSubscribedChannelByUser(selfDid);
        let likeList = [];
        let likePromiseList: Promise<any>[] = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];

          const destDid = subscribedChannel.targetDid;
          const channelId = subscribedChannel.channelId;

          const promise = this.syncLikeDataFromChannel(destDid, channelId)
            .then((likes) => {
              likeList.push(likes);
            })
            .catch((error) => {
            });

          likePromiseList.push(promise);
        }

        Promise.allSettled(likePromiseList);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Sync all like data error', error);
        reject(error);
      }
    });
  }

  asyncGetAllChannelInfo(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // const subscribedChannels = await this.dataHelper.getBackupSubscribedChannelV3List();
        const subscribedChannels = await this.dataHelper.getSelfSubscribedChannelV3List();
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.targetDid;
          const channelId = subscribedChannel.channelId;

          this.getChannelV3ByIdFromRemote(destDid, channelId).catch((error) => {
            Logger.warn(TAG, 'Get channel info from', destDid, channelId, 'occur error,', error);
          });
        }
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Sync all like data error', error);
        reject(error);
      }
    });
  }

  asyncGetAllPost(callback: (postNum: number) => void): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // const subscribedChannels = await this.dataHelper.getBackupSubscribedChannelV3List();
        const subscribedChannels = await this.dataHelper.getSelfSubscribedChannelV3List();
        if (subscribedChannels.length === 0) {
          resolve('FINISH');
          return;
        }

        this.dataHelper.cleanOldestPostV3();

        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const channelId = subscribedChannel.channelId
          const destDid = subscribedChannel.targetDid

          this.queryPostByChannelIdWithTimeFromRemote(destDid, channelId, UtilService.getCurrentTimeNum(), callback).catch((error) => {
            Logger.warn(TAG, 'Get remote posts from', destDid, channelId, 'occur error,', error);
          });
        }
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Get all post error', error);
        reject(error);
      }
    });
  }

  asyncGetAllComments(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // const subscribedChannels = await this.dataHelper.getBackupSubscribedChannelV3List();
        const subscribedChannels = await this.dataHelper.getSelfSubscribedChannelV3List();
        if (!subscribedChannels) {
          resolve('FINISH');
          return;
        }

        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.targetDid;
          const channelId = subscribedChannel.channelId;

          this.queryCommentByChannelIdFromRemote(destDid, channelId).catch((error) => {
            Logger.warn(TAG, 'Get remote comments from', destDid, channelId, 'occur error', error);
          });
        }
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Sync all comment error', error);
        reject(error);
      }
    });
  }

  asyncGetAllLikeData(): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // const subscribedChannels = await this.dataHelper.getBackupSubscribedChannelV3List();
        const subscribedChannels = await this.dataHelper.getSelfSubscribedChannelV3List();
        let likeList = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.targetDid;
          const channelId = subscribedChannel.channelId;

          this.syncLikeDataFromChannel(destDid, channelId).catch((error) => {
            Logger.warn(TAG, 'Get remote like from', destDid, channelId, 'occur error', error);
          });
        }

        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Sync all like data error', error);
        reject(error);
      }
    });
  }

  syncAllChannelInfo(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // const subscribedChannels = await this.dataHelper.getBackupSubscribedChannelV3List();
        const subscribedChannels = await this.dataHelper.getSelfSubscribedChannelV3List();
        let channelList = [];
        let promiseList: Promise<any>[] = [];
        for (let index = 0; index < subscribedChannels.length; index++) {
          const subscribedChannel = subscribedChannels[index];
          const destDid = subscribedChannel.targetDid;
          const channelId = subscribedChannel.channelId;

          const channelPromise = this.getChannelV3ByIdFromRemote(destDid, channelId) || null;

          promiseList.push(channelPromise);
        }

        Promise.allSettled(promiseList);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Sync all channel info data error', error);
        reject(error);
      }
    });
  }

  //TODO be improve user link
  querySubscriptionChannelById(targetDid: string, channelId: string): Promise<FeedsData.SubscriptionV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.querySubscrptionInfoByChannelId(targetDid, channelId);
        Logger.log(TAG, 'Query subscription info result is', result);
        if (!result) {
          resolve([]);
          return;
        }

        const subscriptions = HiveVaultResultParse.parseSubscriptionResult(targetDid, result);
        if (!subscriptions || subscriptions.length == 0) {
          resolve([]);
          return;
        }

        await this.dataHelper.deleteSubscriptionData(channelId);
        await this.dataHelper.addSubscriptionsV3Data(subscriptions);
        // await this.dataHelper.addSubscribedChannels(subscriptions);
        resolve(subscriptions);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  refreshSubscription(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const selfDid = (await this.dataHelper.getSigninData()).did;
      const subscribedChannels = await this.dataHelper.getSubscribedChannelByUser(selfDid);
      let subscribedPromise: Promise<any>[] = [];
      for (let index = 0; index < subscribedChannels.length; index++) {
        const subscribedChannel = subscribedChannels[index];
        const promise = this.checkSubscriptionStatusFromRemote(subscribedChannel.targetDid, subscribedChannel.channelId)
          .then((status) => {
            if (!status) {
              this.removeSubscribedChannelFromRemote(selfDid, subscribedChannel.targetDid, subscribedChannel.channelId);
            }
          })
          .catch(() => {
          });
        subscribedPromise.push(promise);
      }

      Promise.allSettled(subscribedPromise);
      resolve('FINISH');
    });
  }

  getSelfSubscriptionChannel(targetDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const selfDid = (await this.dataHelper.getSigninData()).did;
        const result = await this.hiveVaultApi.querySubscriptionInfoByUserDID(targetDid, selfDid);
        Logger.log(TAG, 'Query user subscription info result is', result);

        if (!result) {
          resolve([]);
          return;
        }
        const subscriptions = HiveVaultResultParse.parseSubscriptionResult(targetDid, result);
        if (!subscriptions || subscriptions.length == 0) {
          resolve([]);
          return;
        }

        let subscibedChannelList: FeedsData.SubscribedChannelV3[] = [];
        for (let index = 0; index < subscriptions.length; index++) {
          const subscription = subscriptions[index];
          const subscribedChannel: FeedsData.SubscribedChannelV3 = {
            userDid: selfDid,
            targetDid: targetDid,
            channelId: subscription.channelId,
            subscribedAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,

            channelName: '',
            channelDisplayName: '',
            channelIntro: '',
            channelAvatar: '',
            channelType: '',
            channelCategory: ''
          }
          subscibedChannelList.push(subscribedChannel);
        }
        this.dataHelper.addSubscribedChannels(subscibedChannelList);
        resolve(subscibedChannelList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  checkSubscriptionStatusFromRemote(targetDid: string, channelId: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const selfDid = (await this.dataHelper.getSigninData()).did;
        const result = await this.hiveVaultApi.querySubscriptionByUserDIDAndChannelId(targetDid, selfDid, channelId);
        Logger.log(TAG, 'Check subscription status from remote result is', result);
        if (!result) {
          resolve(false);
          return;
        }

        try {
          const subscribedChannel = await this.dataHelper.getSubscribedChannelByID(selfDid, targetDid, channelId);
          if (subscribedChannel)
            this.dataHelper.removeSubscribedChannelByID(selfDid, targetDid, channelId);
        } catch (error) {
        }

        const subscriptions = HiveVaultResultParse.parseSubscriptionResult(targetDid, result);
        if (!subscriptions || subscriptions.length == 0) {
          resolve(false);
          return;
        }

        const newSubscribedChannel: FeedsData.SubscribedChannelV3 = {
          userDid: selfDid,
          targetDid: subscriptions[0].destDid,
          channelId: subscriptions[0].channelId,
          subscribedAt: subscriptions[0].createdAt,
          updatedAt: subscriptions[0].updatedAt,

          channelName: '',
          channelDisplayName: '',
          channelIntro: '',
          channelAvatar: '',
          channelType: '',
          channelCategory: ''
        }

        await this.dataHelper.addSubscribedChannel(newSubscribedChannel);
        resolve(true);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  async queryPostByRangeOfTime(targetDid: string, channelId: string, star: number, end: number) {
    const result = await this.hiveVaultApi.queryPostByRangeOfTime(targetDid, channelId, star, end)
    const rangeOfTimePostList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
    console.log("rangeOfTimePostList >>>>>>>>>>>> ", rangeOfTimePostList)
  }

  async queryPostByPostIdFromRemote(targetDid: string, channelId: string, postId: string): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostById(targetDid, channelId, postId);
        Logger.log(TAG, 'Query post by id result is', result);
        if (!result) {
          resolve(null);
          return;
        }
        const posts = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
        await this.dataHelper.addPost(posts[0]);
        resolve(posts[0]);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error)
      }
    });
  }

  queryPostByPostIdFromLocal(targetDid: string, channelId: string, postId: string): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const post = await this.dataHelper.getPostV3ById(postId) || null;
        Logger.log(TAG, 'Query Post By PostId From Local result is', post);
        resolve(post);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error)
      }
    });
  }

  syncPostListByChannel(targetDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const postList = await this.getPostListByChannel(targetDid, channelId);
        await this.dataHelper.addPosts(postList);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getPostListByChannel(targetDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostByChannelId(targetDid, channelId);
        Logger.log(TAG, 'Get post from channel result is', result);
        if (!result) {
          resolve([]);
          return;
        }
        const postList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  syncPostById() {

  }

  async downloadScripting(targetDid: string, mediaPath: string) {
    return this.hiveVaultApi.downloadScripting(targetDid, mediaPath)
  }

  getChannelV3ByIdFromRemote(targetDid: string, channelId: string): Promise<FeedsData.ChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryChannelInfo(targetDid, channelId);
        if (!result) {
          resolve(null);
          return;
        }

        const channelList = await this.handleChannelResult(targetDid, result.find_message.items);
        if (!channelList || channelList.length == 0) {
          resolve(null);
          return;
        }

        resolve(channelList[0]);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getChannelV3ByIdFromLocal(targetDid: string, channelId: string): Promise<FeedsData.ChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const channel: FeedsData.ChannelV3 = await this.dataHelper.getChannelV3ById(targetDid, channelId);
        if (!channel) {
          resolve(null);
          return;
        }

        resolve(channel);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getChannelV3ById(targetDid: string, channelId: string, callback: (localCachedChannel: FeedsData.ChannelV3) => void, forceLoadRemote: boolean = false): Promise<FeedsData.ChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const localCachedChannel = await this.getChannelV3ByIdFromLocal(targetDid, channelId) || null;
        callback(localCachedChannel);
        if (!forceLoadRemote && localCachedChannel != null) {
          resolve(localCachedChannel);
          return;
        }

        const remoteChannel = await this.getChannelV3ByIdFromRemote(targetDid, channelId);
        if (!remoteChannel) {
          resolve(null);
          return;
        }
        resolve(remoteChannel);
      } catch (error) {
        Logger.error(TAG, error);
        resolve(null);
        reject(error);
      }
    });
  }

  queryCommentByChannelIdFromRemote(targetDid: string, channelId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryCommentByChannel(targetDid, channelId);
        Logger.log(TAG, 'Query comment from channel, result is', result);

        const commentsResult = await this.handleCommentResult(targetDid, result);
        resolve(commentsResult);
      } catch (error) {
        Logger.error(TAG, 'Query comment by channel error', error);
        reject(error);
      }
    });
  }

  publishPost(channelId: string, postText: string, imagesBase64: string[], videoData: FeedsData.videoData, from: number, tag: string, type: string = 'public', status: number = FeedsData.PostCommentStatus.available, memo: string = '', proof: string = ''): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDid = (await this.dataHelper.getSigninData()).did

        if (localStorage.getItem(userDid + "isSyncToTwitter") === "true") {
          await this.twitterService.postTweet(postText);
        }

        const content = await this.progressMediaData(postText, imagesBase64, videoData)
        const result = await this.hiveVaultApi.publishPost(channelId, tag, JSON.stringify(content), type, status, memo, proof, from)

        Logger.log(TAG, "Publish new post , result is", result);
        if (!result) {
          const errorMsg = 'Publish new post error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg)
          return;
        }
        let postV3: FeedsData.PostV3 = {
          destDid: result.targetDid,
          postId: result.postId,
          channelId: channelId,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          content: content,
          status: FeedsData.PostCommentStatus.available,
          type: type,
          tag: tag,
          proof: proof,
          memo: memo,
          pinStatus: FeedsData.PinStatus.NOTPINNED,
          from: from
        }
        await this.dataHelper.addPost(postV3);

        if (localStorage.getItem(userDid + "isSyncToReddit") === "true") {
          let length = UtilService.getSize(postText);
          const suffix = " via #elastos Feeds";
          let tittle = postText + suffix;
          let content = ''
          if (length > 299) {
            tittle = postText.substring(0, 299) + '...'
            content = postText.substring(299, postText.length)
          }
          await this.redditService.postReddit(tittle, content)
        }

        resolve(postV3);
      } catch (error) {
        Logger.error(TAG, 'Publish post error', error);
        reject(error);
      }
    });
  }

  public updatePost(originPost: FeedsData.PostV3, newContent: FeedsData.postContentV3, pinStatus: FeedsData.PinStatus, updateAt: number, newType: string = 'public', newTag: string, newStatus: number = FeedsData.PostCommentStatus.edited, newMemo: string = '', newProof: string = '', from: number): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.updatePost(originPost.postId, originPost.channelId, newType, newTag, JSON.stringify(newContent), newStatus, updateAt, newMemo, newProof, pinStatus, from);
        if (!result) {
          const errorMsg = 'Update post error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
        let postV3: FeedsData.PostV3 = {
          destDid: originPost.destDid,
          postId: originPost.postId,
          channelId: originPost.channelId,
          createdAt: originPost.createdAt,
          updatedAt: updateAt,
          content: newContent,
          status: newStatus,
          type: newType,
          tag: newTag,
          proof: newProof,
          memo: newMemo,
          pinStatus: pinStatus,
          from: from
        };
        await this.dataHelper.addPost(postV3);
        resolve(postV3);
      } catch (error) {
        Logger.error(TAG, 'Update post error', error);
        reject(error);
      }
    })
  }

  public pinPost(originPost: FeedsData.PostV3, pinStatus: FeedsData.PinStatus, from: number): Promise<FeedsData.PostV3> {
    return this.updatePost(originPost, originPost.content, pinStatus, UtilService.getCurrentTimeNum(), originPost.type, originPost.tag, originPost.status, originPost.memo, originPost.proof, from);
  }

  private async progressMediaData(newPostText: string, newImagesBase64: string[], newVideoData: FeedsData.videoData) {
    const mediaData = await this.postHelperService.prepareMediaDataV3(newImagesBase64, newVideoData);
    let mediaType = FeedsData.MediaType.noMeida;
    if (newImagesBase64.length > 0 && newImagesBase64[0] != null && newImagesBase64[0] != '') {
      mediaType = FeedsData.MediaType.containsImg
    } else if (newVideoData) {
      mediaType = FeedsData.MediaType.containsVideo
    }
    const content = this.postHelperService.preparePublishPostContentV3(newPostText, mediaData, mediaType);

    return content
  }

  async createCollectionAndRregisteScript(callerDid: string) {
    try {
      await this.hiveVaultApi.createAllCollections()
    } catch (error) {
      // ignore
    }
    await this.hiveVaultApi.registeScripting()
  }

  createChannel(channelName: string, displayName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string = '', category: string = '', proof: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        //check local store
        const targetDid = (await this.dataHelper.getSigninData()).did;
        const channelId = UtilService.generateChannelId(targetDid, channelName);
        const localChannel = await this.dataHelper.getChannelV3ById(targetDid, channelId);
        if (localChannel) {
          Logger.error(TAG, 'Channel already exist');
          reject('Already exist')
        }

        // 处理avatar
        const avatarHiveURL = await this.hiveVaultApi.uploadMediaDataWithString(avatarAddress);
        const insertResult = await this.hiveVaultApi.createChannel(channelName, displayName, intro, avatarHiveURL, tippingAddress, type, nft, memo, category, proof)
        //add cache
        let fileName = avatarHiveURL.split('@')[0];
        await this.fileHelperService.saveV3Data(fileName, avatarAddress);
        //TODO add category、proof、memo
        let channelV3: FeedsData.ChannelV3 = {
          destDid: insertResult.destDid,
          channelId: insertResult.channelId,
          createdAt: insertResult.createdAt,
          updatedAt: insertResult.updatedAt,
          name: channelName,
          intro: intro,
          avatar: avatarHiveURL, // 存储图片
          type: type,
          tipping_address: tippingAddress,
          nft: nft,
          category: category,
          proof: proof,
          memo: memo,
          displayName: displayName
        }

        await this.dataHelper.addChannel(channelV3);
        resolve(channelV3.channelId)
      } catch (error) {
        reject(error)
      }
    });
  }

  async updateChannel(channelId: string, channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', proof: string = '', category: string = '', memo: string = ''): Promise<FeedsData.ChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理avatar
        const signinDid = (await this.dataHelper.getSigninData()).did;
        const originChannel = await this.dataHelper.getChannelV3ById(signinDid, channelId);
        const updatedAt = UtilService.getCurrentTimeNum();
        let avatarHiveURL = '';
        let finalTippingAddress = '';
        let finalName = '';
        let finalIntro = '';
        let finalType = '';
        let finalNft = '';
        let finalCategory = '';
        let finalMemo = '';
        let finalProof = '';

        if (avatarAddress) {
          avatarHiveURL = await this.hiveVaultApi.uploadMediaDataWithString(avatarAddress);
          //add cache
          let fileName = avatarHiveURL.split('@')[0];
          await this.fileHelperService.saveV3Data(fileName, avatarAddress);
        } else {
          avatarHiveURL = originChannel.avatar;
        }

        if (tippingAddress) {
          finalTippingAddress = tippingAddress;
        } else {
          finalTippingAddress = originChannel.tipping_address || '';
        }

        if (channelName) {
          finalName = channelName;
        } else {
          finalName = originChannel.name;
        }

        if (intro) {
          finalIntro = intro;
        } else {
          finalIntro = originChannel.intro;
        }

        if (type) {
          finalType = type;
        } else {
          finalType = originChannel.type;
        }

        if (nft) {
          finalNft = nft;
        } else {
          finalNft = originChannel.nft;
        }

        if (memo) {
          finalMemo = memo;
        } else {
          finalMemo = originChannel.memo;
        }

        if (proof) {
          finalProof = proof;
        } else {
          finalProof = originChannel.proof;
        }
        const result = await this.hiveVaultApi.updateChannel(channelId, finalName, finalIntro, avatarHiveURL, finalType, finalMemo, finalTippingAddress, finalNft);

        if (!result) {
          resolve(null);
          return;
        }

        let channelV3: FeedsData.ChannelV3 = {
          destDid: signinDid,
          channelId: channelId,
          createdAt: originChannel.createdAt,
          updatedAt: updatedAt,
          name: originChannel.name,
          intro: finalIntro,
          avatar: avatarHiveURL, // 存储图片
          type: finalType,
          tipping_address: finalTippingAddress,
          nft: finalNft,
          category: finalCategory,
          proof: finalProof,
          memo: finalMemo,
          displayName: finalName
        }

        await this.dataHelper.addChannel(channelV3);
        resolve(channelV3);
      } catch (error) {
        Logger.error(TAG, 'Update channel error', error);
        reject(error)
      }
    });
  }

  subscribeChannel(targetDid: string, channelId: string, userDisplayName: string = ''): Promise<FeedsData.SubscribedChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const signinData = await this.dataHelper.getSigninData();
        let userName = '';
        if (userDisplayName == '') {
          userName = signinData.name;
        } else {
          userName = userDisplayName;
        }

        const result = await this.hiveVaultApi.subscribeChannel(targetDid, channelId, userName);
        if (!result) {
          const errorMsg = 'Subscribe channel error, destDid is' + targetDid + 'channelId is' + channelId;
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
        let subscribedChannel: FeedsData.SubscribedChannelV3 = {
          userDid: signinData.did,
          targetDid: targetDid,
          channelId: channelId,
          subscribedAt: result.createdAt,
          updatedAt: result.updatedAt,

          channelName: '',
          channelDisplayName: '',
          channelIntro: '',
          channelAvatar: '',
          channelType: '',
          channelCategory: ''
        }
        this.dataHelper.addSubscribedChannel(subscribedChannel);

        this.insertSubscribedChannelToRemote(targetDid, channelId, result.createdAt, result.updatedAt);
        try {
          await this.queryPostByChannelIdWithTimeFromRemote(targetDid, channelId, UtilService.getCurrentTimeNum(), null);
        } catch (error) {
        }

        resolve(subscribedChannel);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  updateSubscriptionChannel(targetDid: string, channelId: string, status: number): Promise<{ updatedAt: number }> {
    return this.hiveVaultApi.updateSubscription(targetDid, channelId, status);
  }

  downloadCustomeAvatar(remotePath: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // 检测本地是否存在
        let userDid = (await this.dataHelper.getSigninData()).did
        let avatar = await this.dataHelper.loadUserAvatar(userDid);
        if (avatar) {
          resolve(avatar);
          return;
        }
        let self = this
        let imgstr = ''
        try {
          var dataBuffer = await this.hiveVaultApi.downloadCustomeAvatar(remotePath)
          // dataBuffer = dataBuffer.slice(1, -1)
          imgstr = dataBuffer.toString()
          self.dataHelper.saveUserAvatar(userDid, imgstr);
          resolve(imgstr);
        } catch (error) {
          Logger.error(TAG, 'Download custom avatar error: ', JSON.stringify(error))
          reject(error);
        }
      } catch (error) {
        Logger.error(TAG, 'downloadCustomeAvatar error', error);
        reject(error);
      }
    });
  }

  parseDidDocumentAvatar(userDid: string) {
    return this.hiveVaultApi.parseDidDocumentAvatar(userDid);
  }

  checkESSAvatar(): Promise<{ userDid: string, essAvatar: string }> {
    return new Promise(async (resolve, reject) => {
      let userDid = '';
      try {
        userDid = (await this.dataHelper.getSigninData()).did
        const loadKey = UtilService.getESSAvatarKey(userDid);
        let essavatar = await this.dataHelper.loadUserAvatar(loadKey) || null;
        if (essavatar) {
          resolve({ userDid: userDid, essAvatar: essavatar });
          return
        } else {
          resolve({ userDid: userDid, essAvatar: null });
        }
      } catch (error) {
        resolve({ userDid: userDid, essAvatar: null });
      }
    });
  }

  checkCustomAvatar(): Promise<{ userDid: string, customAvatar: string }> {
    return new Promise(async (resolve, reject) => {
      let userDid = '';
      try {
        userDid = (await this.dataHelper.getSigninData()).did
        let customAvatar = await this.dataHelper.loadUserAvatar(userDid)
        if (customAvatar) {
          resolve({ userDid: userDid, customAvatar: customAvatar });
          return
        } else {
          resolve({ userDid: userDid, customAvatar: null });
        }
      } catch (error) {
        resolve({ userDid: userDid, customAvatar: null });
      }
    });
  }

  refreshAvatar(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      this.processDownloadEssAvatar().then(() => {
        return this.downloadCustomeAvatar("custome");
      }).then(() => {
        resolve('FINISH');
      }).catch((error) => {
        reject(error)
      });
    });
  }

  getUserAvatar(userDid: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let signinData = await this.dataHelper.getSigninData();
      if (signinData == null || signinData == undefined) {
        resolve('./assets/images/did-default-avatar.svg');
        return;
      }

      if (!userDid) {
        userDid = signinData.did;
      }
      try {
        let userProfile: FeedsData.UserProfile = await this.getUserProfile(userDid);
        const avatarHiveUrl = userProfile.avatar || userProfile.resolvedAvatar;
        if (!avatarHiveUrl) {
          resolve('./assets/images/did-default-avatar.svg');
          return;
        }

        const avatar = await this.getV3HiveUrlData(avatarHiveUrl);
        if (!avatar) {
          resolve('./assets/images/did-default-avatar.svg');
          return;
        }

        resolve(avatar);
      } catch (error) {
        resolve('./assets/images/did-default-avatar.svg');
      }
      return;
    });
  }

  getUserAvatarFromHiveUrl(avatarHiveUrl: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!avatarHiveUrl) {
        resolve('./assets/images/did-default-avatar.svg');
        return;
      }

      const avatar = await this.getV3HiveUrlData(avatarHiveUrl);
      if (!avatar) {
        resolve('./assets/images/did-default-avatar.svg');
        return;
      }

      resolve(avatar);
      return;
    });
  }

  downloadEssAvatar(avatarParam: string, avatarScriptName: string, tarDID: string, tarAppDID: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // const essavatarObj = await this.checkESSAvatar();

        // if (essavatarObj.essAvatar) {
        //   resolve(essavatarObj.essAvatar);
        //   return
        // }
        const rawImage = await this.hiveVaultApi.downloadEssAvatar(avatarParam, avatarScriptName, tarDID, tarAppDID);
        if (rawImage === undefined || rawImage === null) {
          resolve(null)
          return
        }
        const savekey = UtilService.getESSAvatarKey(tarDID);
        this.dataHelper.saveUserAvatar(savekey, rawImage)
        resolve(rawImage);
      }
      catch (error) {
        reject(error)
        Logger.error(TAG, "Download Ess Avatar error: ", error);
      }
    });
  }

  downloadEssAvatarFromHiveUrl(hiveUrl: string, targetDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const rawImage = await this.hiveVaultApi.downloadAvatarFromHiveUrl(hiveUrl, targetDid);
        if (!rawImage) {
          resolve(null)
          return
        }
        // const savekey = UtilService.getESSAvatarKey(tarDID);
        // this.dataHelper.saveUserAvatar(savekey, rawImage)
        resolve(rawImage);
      }
      catch (error) {
        reject(error)
        Logger.error(TAG, "Download Ess Avatar error: ", error);
      }
    });
  }

  processDownloadEssAvatar(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const signinData = await this.dataHelper.getSigninData() || null;
      if (!signinData) return;
      const userDid = signinData.did || '';
      if (!userDid) return;

      this.parseDidDocumentAvatar(userDid).then((value: {
        avatarParam: string;
        avatarScriptName: string;
        tarDID: string;
        tarAppDID: string;
      }) => {
        if (!value) {
          const errorMsg = 'User did document null';
          Logger.log(TAG, errorMsg);
          reject(errorMsg);
          return;
        }

        this.downloadEssAvatar(value.avatarParam, value.avatarScriptName, value.tarDID, value.tarAppDID).then((value) => {
          resolve(value);
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getAllPostScripting() {
    // const postList = this.hiveVaultApi();
  }

  getV3Data(destDid: string, remotePath: string, fileName: string, type: string, isDownload?: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (destDid === '' || fileName === '' || remotePath === '') {
          resolve('');
          return;
        }
        let defaultAvatar = UtilService.getDefaultAvatarHash(fileName) || "";
        if (defaultAvatar != "") {
          resolve(defaultAvatar);
          return;
        }
        isDownload = isDownload || '';
        const result = await this.fileHelperService.getV3Data(fileName);
        if (result && result != '') {
          resolve(result);
          return;
        }

        if (result == '' && isDownload != '') {
          resolve('');
          return;
        }

        if (result == '' && isDownload === '') {
          try {
            const downloadResult = await this.hiveVaultApi.downloadScripting(destDid, remotePath);
            await this.fileHelperService.saveV3Data(fileName, downloadResult);
            resolve(downloadResult);
          } catch (error) {
            reject(error);
          }
          return;
        }
        resolve('')
      } catch (error) {
        Logger.error(TAG, 'Get data error', error);
        reject(error);
      }
    });
  }

  getV3HiveUrlData(hiveUrl: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!hiveUrl) {
          resolve('');
          return;
        }

        const scriptName = UtilService.parseScriptNameFromHiveUrl(hiveUrl);
        const result = await this.fileHelperService.getV3Data(scriptName);

        if (!result || result == 'null') {
          try {
            const targetDid = UtilService.parseTargetDidFromHiveUrl(hiveUrl);
            const downloadResult = await this.hiveVaultApi.downloadAvatarFromHiveUrl(hiveUrl, targetDid);
            await this.fileHelperService.saveV3Data(scriptName, downloadResult);
            resolve(downloadResult);
          } catch (error) {
            reject(error);
          }
          return;
        } else {

        }

        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'Get data error', error);
        reject(error);
      }
    });
  }

  syncSelfChannel(did: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const channelsResult = await this.hiveVaultApi.querySelfChannels();
        Logger.log(TAG, 'Query self channels result', channelsResult);

        if (!channelsResult) {
          resolve([]);
          return;
        }

        const channelList = await this.handleChannelResult(did, channelsResult);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'Sync self channel', error);
        resolve([]);

      }
    });
  }

  syncSelfPosts(): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const postResult = await this.hiveVaultApi.querySelfPosts();
        Logger.log('Query self posts result', postResult);
        if (!postResult) {
          resolve([]);
          return;
        }
        const parseResult = HiveVaultResultParse.parsePostResult(did, postResult);
        await this.dataHelper.addPosts(parseResult);
        resolve(parseResult);
      } catch (error) {
        Logger.error(TAG, 'Sync self post', error);
        reject(error);
      }
    });
  }

  private syncSelfPostsByChannel(channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const postList = await this.getSelfPostsByChannel(channelId);
        await this.dataHelper.addPosts(postList);
        resolve(postList);
        return;
      } catch (error) {
        Logger.error(TAG, 'Sync self post by channel', error);
        reject(error);
      }
    });
  }

  getSelfPostsByChannel(channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const postResult = await this.hiveVaultApi.querySelfPostsByChannel(channelId);
        Logger.log('Query self post result', postResult);
        if (!postResult) {
          resolve([]);
          return;
        }
        const postList = HiveVaultResultParse.parsePostResult(did, postResult);
        resolve(postList);
        return;
      } catch (error) {
        Logger.error(TAG, 'Sync self post by channel', error);
        reject(error);
      }
    });
  }

  createComment(destDid: string, channelId: string, postId: string, refcommentId: string, content: any): Promise<FeedsData.CommentV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.createComment(destDid, channelId, postId, refcommentId, content);
        Logger.log('createComment result', result);

        if (!result) {
          resolve(null);
          return;
        }
        const comment: FeedsData.CommentV3 = {
          destDid: destDid,
          commentId: result.commentId,

          channelId: channelId,
          postId: postId,
          refcommentId: refcommentId,
          content: content,
          status: FeedsData.PostCommentStatus.available,
          updatedAt: result.createdAt,
          createdAt: result.createdAt,
          proof: '',
          memo: '',

          createrDid: result.createrDid
        }
        await this.dataHelper.addComment(comment);

        //resolve cached comment list
        try {
          let cachedCommentList = this.dataHelper.getcachedCommentList(postId, refcommentId) || [];
          cachedCommentList.push(comment);
          this.dataHelper.cacheCommentList(postId, refcommentId, cachedCommentList)
        } catch (error) {
        }

        resolve(comment);
      } catch (error) {
        Logger.error(TAG, 'Create comment error', error);
        reject(error);
      }
    });
  }

  getCommentsByPostFromRemote(destDid: string, channelId: string, postId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const commentResult = await this.hiveVaultApi.queryCommentByPostId(destDid, channelId, postId);
        const commentList = await this.handleCommentResult(destDid, commentResult);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Query comments by post error', error);
        reject(error);
      }
    });
  }

  like(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3> {
    return new Promise(async (resolve, reject) => {
      try {
        //TODO
        //1.query
        //2.if null add else update ,toast warn
        const createrDid = (await this.dataHelper.getSigninData()).did;
        const likeId = UtilService.generateLikeId(postId, commentId, createrDid);

        const result = await this.hiveVaultApi.querySelfLikeById(destDid, channelId, likeId);
        const likeList = await this.handleLikeResult(destDid, result) || [];

        let like = likeList[0];
        let updatedAt = 0;
        let createdAt = 0;

        if (like) {
          const updateResult = await this.hiveVaultApi.updateLike(destDid, likeId, FeedsData.PostCommentStatus.available);
          createdAt = like.createdAt;
          updatedAt = updateResult.updatedAt;
        } else {
          const addResult = await this.hiveVaultApi.addLike(destDid, likeId, channelId, postId, commentId);
          createdAt = addResult.createdAt;
          updatedAt = createdAt;
        }

        Logger.log('like result', result);
        if (result) {
          const like: FeedsData.LikeV3 = {
            likeId: likeId,

            destDid: destDid,
            postId: postId,
            commentId: commentId,

            channelId: channelId,
            createdAt: createdAt,
            createrDid: createrDid,
            proof: '',
            memo: '',

            updatedAt: updatedAt,
            status: FeedsData.PostCommentStatus.available
          }

          await this.dataHelper.addLike(like);
          resolve(like);

        } else {
          reject('Like error');
        }
      } catch (error) {
        Logger.error(TAG, 'Like error', error);
        reject(error);
      }
    });
  }

  removeLike(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const createrDid = (await this.dataHelper.getSigninData()).did;
        const like = await this.dataHelper.getLikeV3ByUser(postId, commentId, createrDid);
        if (!like) {
          resolve(null);
          return;
        }
        const result = await this.hiveVaultApi.updateLike(destDid, like.likeId, FeedsData.PostCommentStatus.deleted);
        Logger.log('Remove like result', result);
        if (!result) {
          resolve(null);
          return
        }
        like.updatedAt = result.updatedAt;
        like.status = FeedsData.PostCommentStatus.deleted;
        await this.dataHelper.addLike(like);
        resolve(like);
      } catch (error) {
        Logger.error(TAG, 'Remove like data error', error);
        reject(error);
      }
    });
  }

  unSubscribeChannel(destDid: string, channelId: string): Promise<{ destDid: string, channelId: string }> {
    return new Promise(async (resolve, reject) => {
      try {

        const did = (await this.dataHelper.getSigninData()).did;
        const result = await this.hiveVaultApi.unSubscribeChannel(destDid, channelId);
        console.log('unSubscribeChannel result', result);

        if (!result) {
          const errorMsg = 'Unsubscribe channel error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
          return
        }

        const removeResult = await this.removeSubscribedChannelDataFromRemote(destDid, channelId);
        if (!removeResult) {
          const errorMsg = 'Remove subscribed channel from remote error error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
        await this.dataHelper.removeSubscribedChannelByID(did, destDid, channelId);
        await this.dataHelper.removeChannelPostData(channelId);
        const returnResult = {
          destDid: destDid,
          channelId: channelId
        }
        resolve(returnResult);
      } catch (error) {
        Logger.error(TAG, 'Unsubscribe channel error', error);
        reject(error);
      }
    });
  }

  deleteCollection(collectionName: string): Promise<void> {
    return this.hiveVaultApi.deleteCollection(collectionName)
  }

  deleteAllCollections(): Promise<string> {
    Logger.log(TAG, "deleteAllCollections");
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.deleteAllCollections();
        resolve(result);
      } catch (error) {
        Logger.error(TAG, 'deleteAllCollections data error', error);
        reject(error);
      }
    });
  }

  deletePost(post: FeedsData.PostV3): Promise<FeedsData.PostV3> {
    Logger.log(TAG, "Delete post", post);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.deletePost(post.postId, post.channelId);;
        if (result) {
          post.updatedAt = result.updatedAt;
          post.status = result.status;

          await this.dataHelper.deletePostV3(post);
          resolve(post);
        } else {
          const errorMsg = 'Delete post error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
      } catch (error) {
        Logger.error(TAG, 'deletePost data error', error);
        reject(error);
      }
    });
  }

  updateComment(originComment: FeedsData.CommentV3, content: string): Promise<FeedsData.CommentV3> {
    Logger.log(TAG, "updateComment", originComment, content);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.updateComment(originComment.destDid, originComment.channelId, originComment.postId, originComment.commentId, content);
        Logger.log(TAG, 'Update comment result', result);
        if (!result) {
          resolve(null);
          return;
        }

        const comment: FeedsData.CommentV3 = {
          destDid: originComment.destDid,
          commentId: originComment.commentId,

          channelId: originComment.channelId,
          postId: originComment.postId,
          refcommentId: originComment.refcommentId,
          content: content,
          status: FeedsData.PostCommentStatus.edited,
          updatedAt: result.updatedAt,
          createdAt: originComment.createdAt,
          proof: '',
          memo: originComment.memo,

          createrDid: originComment.createrDid
        }

        await this.dataHelper.addComment(comment);
        resolve(comment);
      } catch (error) {
        Logger.error(TAG, 'Update comment data error', error);
        reject(error);
      }
    });
  }

  deleteComment(comment: FeedsData.CommentV3): Promise<FeedsData.CommentV3> {
    Logger.log(TAG, "Delete comment", comment);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.deleteComment(comment.destDid, comment.channelId, comment.postId, comment.commentId);
        Logger.log(TAG, "Delete comment result", result);

        if (result) {
          comment.status = FeedsData.PostCommentStatus.deleted;
          await this.dataHelper.deleteCommentV3(comment);
          resolve(comment);
        } else {
          Logger.error(TAG, 'Delete comment data error');
          reject('Delete comment error');
        }
      } catch (error) {
        Logger.error(TAG, 'Delete comment data error', error);
        reject(error);
      }
    });
  }

  handleChannelResult(targetDid: string, result: any): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!result) {
          resolve([]);
          return;
        }

        const channelList = HiveVaultResultParse.parseChannelResult(targetDid, result);
        if (!channelList || channelList.length == 0) {
          resolve([]);
          return;
        }

        await this.dataHelper.addChannels(channelList);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'Handle comment result error', error);
        reject(error);
      }
    });
  }

  handleCommentResult(targetDid: string, result: any): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!result) {
          resolve([]);
          return;
        }

        const commentList = HiveVaultResultParse.parseCommentResult(targetDid, result);
        if (!commentList || commentList.length == 0) {
          resolve([]);
          return;
        }

        await this.dataHelper.addComments(commentList);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Handle comment result error', error);
        reject(error);
      }
    });
  }

  handleLikeResult(destDid: string, result: any): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!result) {
          const errorMsg = 'Handle like result error ,result null';
          reject(errorMsg);
          return;
        }

        const likeList = HiveVaultResultParse.parseLikeResult(destDid, result);
        if (!likeList || likeList.length == 0) {
          resolve([]);
          return;
        }

        await this.dataHelper.addLikes(likeList);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Handle like result error', error);
        reject(error);
      }
    });
  }

  getLikeById(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryLikeById(destDid, channelId, postId, commentId);
        Logger.log(TAG, 'Get like by id result', result);
        const likeList = await this.handleLikeResult(destDid, result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Get like by id error', error);
        reject(error);
      }
    });
  }

  getCommentByID(destDid: string, channelId: string, postId: string, commentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryCommentByID(destDid, channelId, postId, commentId);
        Logger.log(TAG, 'Get comment by id result', result)
        const commentList = await this.handleCommentResult(destDid, result);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'Get comment by id data error', error);
        reject(error);
      }
    });
  }

  //TODO wrong
  removePostListByChannel(targetDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostByChannelId(targetDid, channelId);
        Logger.log(TAG, 'Get post from channel result is', result);
        if (result) {
          const postList = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
          for (let postIndex = 0; postIndex < postList.length; postIndex++) {
            let postId = postList[postIndex].postId;
            await this.dataHelper.deletePostData(postId);
          }
          resolve(postList);
        } else {
          const errorMsg = 'remove post from channel error';
          Logger.error(TAG, errorMsg);
          reject(errorMsg);
        }
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  getDisplayName(targetDid: string, channelId: string, userDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const displayName = this.dataHelper.getUserDisplayName(targetDid, channelId, userDid);
        if (displayName) {
          resolve(displayName);
          return;
        }

        const result = await this.hiveVaultApi.queryUserDisplayName(targetDid, channelId, userDid);
        Logger.log(TAG, 'getDisplayName result is ', result);
        if (result) {
          const subscriptions = HiveVaultResultParse.parseSubscriptionResult(targetDid, result);
          if (subscriptions && subscriptions[0]) {
            const displayName = subscriptions[0].displayName;
            this.dataHelper.cacheUserDisplayName(targetDid, channelId, userDid, displayName);
            resolve(displayName);
            return;
          } else {
            const errorMsg = 'getDisplayName error';
            //Logger.error(TAG, errorMsg);
            reject(errorMsg);
          }
        } else {
          resolve('UNKNOW');
        }
      } catch (error) {
        Logger.error(TAG, 'getDisplayName error', error);
        reject(error);
      }
    });
  }

  getCommentList(postId: string, refCommentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const commentList = this.dataHelper.getcachedCommentList(postId, refCommentId) || [];

        if (commentList && commentList.length > 0) {
          resolve(commentList);
          return;
        }
        const list = await this.dataHelper.getCommentsV3ByRefId(postId, refCommentId);
        if (list && list.length > 0) {
          this.dataHelper.cacheCommentList(postId, refCommentId, list);
          resolve(list);
        } else {
          //TODO sync data from remote
          resolve([]);
        }
      } catch (error) {
        Logger.error(TAG, 'Get local comment list error', error);
        reject(error);
      }
    });
  }

  getReplyCommentListMap(postId: string, hideDeletedComments: boolean): Promise<{ [refCommentId: string]: FeedsData.CommentV3[] }> {
    return new Promise(async (resolve, reject) => {
      try {
        const commentList = await this.getCommentList(postId, '0');
        if (!commentList || commentList.length == 0) {
          resolve({});
          return;
        }

        let replyCommentsMap: { [refCommentId: string]: FeedsData.CommentV3[] } = {};
        for (let index = 0; index < commentList.length; index++) {
          const comment = commentList[index];
          let replyCommentList = await this.getCommentList(comment.postId, comment.commentId);

          replyCommentList = _.sortBy(replyCommentList, (item: FeedsData.CommentV3) => {
            return -Number(item.createdAt);
          });

          if (!hideDeletedComments) {
            replyCommentList = _.filter(replyCommentList, (item: any) => {
              return item.status != 1;
            });
          }
          replyCommentsMap[comment.commentId] = replyCommentList;
        }

        if (!replyCommentsMap || Object.keys(replyCommentsMap).length == 0) {
          resolve({});
          return;
        }

        resolve(replyCommentsMap);
        return;
      } catch (error) {
        Logger.error(TAG, 'Get reply comment list error', error);
        reject(error);
      }
    });
  }

  getReplyCommentListMapPro(postId: string, hideDeletedComments: boolean): Promise<{ [refCommentId: string]: FeedsData.CommentV3[] }> {
    return new Promise(async (resolve, reject) => {
      try {
        const firstLevelCommentList = await this.getCommentList(postId, '0');
        if (!firstLevelCommentList || firstLevelCommentList.length == 0) {
          resolve({});
          return;
        }

        let replyCommentsMap: { [replyCommentId: string]: FeedsData.CommentV3[] } = {};
        for (let index = 0; index < firstLevelCommentList.length; index++) {
          const comment = firstLevelCommentList[index];
          const replyCommentList = await this.getCommentList(comment.postId, comment.commentId);
          let resultList = [];

          let replyList = await this.getReplyList(replyCommentList);
          resultList = _.unionWith(replyList, replyCommentList, _.isEqual);

          resultList = _.sortBy(resultList, (item: FeedsData.CommentV3) => {
            return -Number(item.createdAt);
          });

          if (!hideDeletedComments) {
            resultList = _.filter(resultList, (item: any) => {
              return item.status != 1;
            });
          }
          replyCommentsMap[comment.commentId] = resultList;
        }

        if (!replyCommentsMap || Object.keys(replyCommentsMap).length == 0) {
          resolve({});
          return;
        }
        resolve(replyCommentsMap);
        return;
      } catch (error) {
        Logger.error(TAG, 'Get reply comment list error', error);
        reject(error);
      }
    });
  }

  getReplyList(commentList: FeedsData.CommentV3[]): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let resultList = [];

        for (let index = 0; index < commentList.length; index++) {
          const comment = commentList[index];
          let replyCommentList = await this.getCommentList(comment.postId, comment.commentId);

          if (!replyCommentList || replyCommentList.length == 0) {
            continue;
          } else {
            const replyList = await this.getReplyList(replyCommentList);
            resultList = _.unionWith(replyList, replyCommentList, _.isEqual);
          }
        }
        resolve(resultList);
        return;
      } catch (error) {
        Logger.error(TAG, 'Get reply comment list error', error);
        reject(error);
      }
    });
  }

  getLikeStatus(postId: string, commentId: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let likedStatus = this.dataHelper.getCachedLikeStatus(postId, commentId);
        if (likedStatus) {
          resolve(likedStatus);
          return;
        }
        const list = await this.dataHelper.getSelfLikeV3(postId, commentId) || '';

        if (list && list.status === FeedsData.PostCommentStatus.available) {
          likedStatus = true;
        } else {
          likedStatus = false;
          //TODO sync data from remote //TODO modify local like sql table ,add status
        }
        this.dataHelper.cacheLikeStatus(postId, commentId, likedStatus);
        resolve(likedStatus);
      } catch (error) {
        Logger.error(TAG, 'Get local like list error', error);
        reject(error);
      }
    });
  }

  getLikeNum(postId: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        let likedNum = this.dataHelper.getCachedLikeNum(postId, commentId);
        if (likedNum) {
          resolve(likedNum);
          return;
        }

        const num = await this.dataHelper.getLikeNum(postId, commentId);
        this.dataHelper.cacheLikeNum(postId, commentId, num);
        //TODO sync data from remote //TODO modify local like sql table ,add status
        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'Get local like number list error', error);
        reject(error);
      }
    });
  }

  getSelfChannel(): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const did = (await this.dataHelper.getSigninData()).did;
        const channelsResult = await this.hiveVaultApi.querySelfChannels();
        Logger.log(TAG, 'Query self channels result', channelsResult);
        if (channelsResult) {
          const parseResult = HiveVaultResultParse.parseChannelResult(did, channelsResult);
          console.log('parseResult', parseResult);
          resolve(parseResult);
        } else {
          resolve([]);
        }
      } catch (error) {
        Logger.error(TAG, 'Sync self channel', error);
        reject(error);
      }
    });
  }

  creatFeedsScripting(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const lasterVersion = '1.0'
        const preVersion = '0'
        const registScripting = false
        await this.hiveVaultApi.createFeedsScripting(lasterVersion, preVersion, registScripting);
        resolve("SUCCESS")
      } catch (error) {
        reject(error)
      }
    })
  }

  updateFeedsScripting(lasterVersion: string, preVersion: string, registScripting: boolean = false) {
    return this.hiveVaultApi.updateFeedsScripting(lasterVersion, preVersion, registScripting);
  }

  queryFeedsScripting(): Promise<any> {
    return this.hiveVaultApi.queryFeedsScripting();
  }

  prepareConnection(forceCreate: boolean): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.hiveVaultApi.prepareConnection(forceCreate);
        this.eventBus.publish(FeedsEvent.PublishType.authEssentialSuccess);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Prepare Connection error', error);
        if (error instanceof VaultNotFoundException) {
          this.eventBus.publish(FeedsEvent.PublishType.authEssentialFail, { type: 11 });
        } else {
          this.eventBus.publish(FeedsEvent.PublishType.authEssentialFail, { type: 1 });
        }
        reject(error);
      }
    });
  }

  checkPostIsLast(originPost: FeedsData.PostV3): FeedsData.PostV3 {
    const post = this.dataHelper.getOldestPostV3(originPost.destDid, originPost.channelId);
    if (!post) {
      return null;
    }

    //TODO sync post by time
    this.queryPostByChannelIdWithTimeFromRemote(post.destDid, post.channelId, post.updatedAt, null);
    return post;
  }

  private queryPostByChannelIdByTimeFromLocal(destDid: string, channelId: string, endTime: number): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const postList = await this.dataHelper.queryPostDataByChannelIdByTime(channelId, 0, endTime) || [];
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Query post with time error', error);
        reject(error);
      }
    });
  }

  queryRemoteChannelPostWithTime(destDid: string, channelId: string, endTime: number): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPublicPostRangeOfTime(destDid, channelId, 0, endTime);
        if (!result) {
          resolve([]);
          return;
        }

        const postList = HiveVaultResultParse.parsePostResult(destDid, result.find_message.items);
        // const postList = await this.handleSyncPostResult(destDid, channelId, result);
        if (!postList || postList.length == 0) {
          resolve([]);
          return;
        }

        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Query channel post with time error', error);
        reject(error);
      }
    });
  }

  queryLocalPostWithTime() {
    return new Promise(async (resolve, reject) => {
      try {
        // const result = await this.dataHelper.getPostV3List .queryPostByRangeOfTime(destDid, channelId, 0, endTime);
        // const postList = await this.handleSyncPostResult(destDid, channelId, result);

        this.eventBus.publish(FeedsEvent.PublishType.updateTab, false);
        // resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Query post with time error', error);
        reject(error);
      }
    });
  }

  handleSyncPostResult(destDid: string, channelId: string, result: any, callback: (newPostNum: number) => void): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      if (!result) {
        resolve([]);
        return;
      }
      try {
        let newPostNum: number = 0;
        let oldestPost: FeedsData.PostV3 = null;
        const postList = HiveVaultResultParse.parsePostResult(destDid, result.find_message.items);
        for (let postIndex = 0; postIndex < postList.length; postIndex++) {
          const newPost = postList[postIndex];

          // console.log('oldestPost', oldestPost);
          // console.log('newPost', newPost);
          if (!oldestPost || newPost.updatedAt < oldestPost.updatedAt) {
            //TOBE Improve
            oldestPost = _.cloneDeep<FeedsData.PostV3>(newPost);
            console.log('clone oldestPost', oldestPost);
          }
          const isNewPost = await this.dataHelper.addPost(newPost);
          if (isNewPost) {
            newPostNum++;
          }
        }

        if (callback != null) {
          callback(newPostNum);
        }

        this.dataHelper.updateOldestPostV3(destDid, channelId, oldestPost);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Handle post result error', error);
        reject(error);
      }
    });
  }

  syncSubscribedChannelFromRemote(): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const ownerDid: string = (await this.dataHelper.getSigninData()).did;
        const subscribedChannelList = await this.restoreSubscibedChannelFromRemote(ownerDid) || [];
        if (!subscribedChannelList || subscribedChannelList.length == 0) {
          const newSubscribedChannelList = await this.restoreSubscribedChannelFromRemoteBackupSubscribedChannel(ownerDid);
          resolve(newSubscribedChannelList);
          return;
        }
        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, 'Sync subscribed channel error', error);
        reject(error);
      }
    });
  }

  restoreSubscibedChannelFromRemote(ownerDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const subcribedChannelsList = await this.querySubscribedChannelsByOwnerFromRemote(ownerDid);
        if (!subcribedChannelsList || subcribedChannelsList.length == 0) {
          resolve([]);
          return;
        }

        await this.dataHelper.resetOwnSubscribedChannel(subcribedChannelsList);
        resolve(subcribedChannelsList);
      } catch (error) {
        resolve([]);
      }
    });
  }

  restoreSubscribedChannelFromRemoteBackupSubscribedChannel(ownerDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const backupSubscribedChannels: FeedsData.BackupSubscribedChannelV3[] = await this.queryBackupSubscribedChannelFromRemote();
        if (!backupSubscribedChannels || backupSubscribedChannels.length == 0) {
          resolve([]);
          return;
        }

        let newSubcribedChannelList: FeedsData.SubscribedChannelV3[] = [];
        for (let index = 0; index < backupSubscribedChannels.length; index++) {
          const backupSubscribedChannel = backupSubscribedChannels[index];
          const subscribedChannel: FeedsData.SubscribedChannelV3 = {
            userDid: ownerDid,
            targetDid: backupSubscribedChannel.destDid,
            channelId: backupSubscribedChannel.channelId,
            subscribedAt: 0,
            updatedAt: 0,

            channelName: '',
            channelDisplayName: '',
            channelIntro: '',
            channelAvatar: '',
            channelType: '',
            channelCategory: ''
          }
          await this.updateSubscribedChannelDataToRemote(subscribedChannel);
          newSubcribedChannelList.push(subscribedChannel);
        }

        if (!newSubcribedChannelList || newSubcribedChannelList.length == 0) {
          resolve([]);
          return;
        }

        await this.dataHelper.resetOwnSubscribedChannel(newSubcribedChannelList);
        resolve(newSubcribedChannelList);
      } catch (error) {
      }
    });
  }

  //For all user
  private querySubscribedChannelsByOwnerFromRemote(ownerDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.querySubscribedChannelsByUserDid(ownerDid);
        console.log(TAG, 'Query subscribed channel result is', result);
        if (!result) {
          resolve([])
          return;
        }

        const subscribedChannelList = HiveVaultResultParse.parseSubscribedChannelResult(ownerDid, result.find_message.items);
        if (!subscribedChannelList || subscribedChannelList.length == 0) {
          resolve([]);
          return;
        }
        await this.dataHelper.addSubscribedChannels(subscribedChannelList);
        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, 'Query subscribed channel error', error);
        reject(error);
      }
    });
  }

  //For self, only delete owned remote data
  removeSubscribedChannelFromRemote(userDid: string, targetDid: string, channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.hiveVaultApi.removeSubscribedChannelById(targetDid, channelId);
        await this.dataHelper.removeSubscribedChannelByID(userDid, targetDid, channelId);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Remove subscribed channel error', error);
        reject(error);
      }
    });
  }

  queryCommentsFromPosts(targetDid: string, postIds: string[]): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.hiveVaultApi.queryCommentsFromPosts(targetDid, postIds);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Query comments from posts error', error);
        reject(error);
      }
    });
  }

  loadPostMoreData(useRemoteData: boolean, originPostList: FeedsData.PostV3[]): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this._loadPostMoreData(useRemoteData, originPostList) || [];
        let postList: FeedsData.PostV3[] = [];
        if (list && list.length > 0) {
          postList = _.unionWith(originPostList, list, _.isEqual);

          postList = _.sortBy(postList, (item: FeedsData.PostV3) => {
            return -Number(item.createdAt);
          });
        }
        resolve(postList);
      } catch (error) {
        reject(error);
      }
    });
  }

  loadPublicChannelPostMoreData(useRemoteData: boolean, destDid: string, channelId: string, originPostList: FeedsData.PostV3[]): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this._loadPublicChannelPostMoreData(useRemoteData, destDid, channelId, originPostList) || [];
        let postList: FeedsData.PostV3[] = [];
        if (list && list.length > 0) {
          postList = _.unionWith(originPostList, list, _.isEqual);

          postList = _.sortBy(postList, (item: FeedsData.PostV3) => {
            return -Number(item.createdAt);
          });
        }
        resolve(postList);
      } catch (error) {
        reject(error);
      }
    });
  }

  private _loadPostMoreData(useRemoteData: boolean, postList: FeedsData.PostV3[]): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let endTime = UtilService.getCurrentTimeNum();
        if (postList && postList.length > 0) {
          const minUpdatePost = _.minBy(postList, (item) => {
            return item.updatedAt;
          });
          endTime = minUpdatePost.updatedAt || endTime;
        }

        let list = [];
        if (useRemoteData) {
          list = await this.syncAllPostWithTime(endTime) || [];
        } else {
          list = await this.loadMoreLocalData(endTime) || [];
        }
        resolve(list);
      } catch (error) {
        reject(error);
      }
    });
  }

  private _loadPublicChannelPostMoreData(useRemoteData: boolean, destDid: string, channelId: string, postList: FeedsData.PostV3[]): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        let endTime = UtilService.getCurrentTimeNum();
        if (postList && postList.length > 0) {
          const minUpdatePost = _.minBy(postList, (item) => {
            return item.updatedAt;
          });
          endTime = minUpdatePost.updatedAt || endTime;
        }

        let list = [];
        if (useRemoteData) {
          list = await this.queryRemoteChannelPostWithTime(destDid, channelId, endTime) || [];
        } else {
          list = await this.loadLocalChannelPostData(channelId, endTime) || [];
        }
        resolve(list);
      } catch (error) {
        reject(error);
      }
    });
  }

  queryLikeByRangeOfTime(targetDid: string, channelId: string, postId: string, star: number, end: number) {
    return this.hiveVaultApi.queryLikeByRangeOfTime(targetDid, channelId, postId, star, end)
  }

  queryCommentByRangeOfTime(targetDid: string, channelId: string, postId: string, star: number, end: number) {
    return this.hiveVaultApi.queryCommentByRangeOfTime(targetDid, channelId, postId, star, end)
  }

  loadMoreLocalData(end: number): Promise<FeedsData.PostV3[]> {
    return this.dataHelper.queryPostDataByTime(0, end);
  }

  loadLocalChannelPostData(channelId: string, end: number): Promise<FeedsData.PostV3[]> {
    return this.dataHelper.queryPostDataByChannelIdByTime(channelId, 0, end);
  }

  processHiveFunction(method: Function) {
  }

  checkSubscriptionState() {
  }

  async initRegisterScript(isForce: boolean) {
    let regist_scripting = false;
    let lasterVersion = '';
    let preVersion = '';
    const signinData = await this.dataHelper.getSigninData() || {};
    let userDid = signinData.did || "";
    if (userDid === '' || userDid === undefined || userDid === null) {
      return
    }
    const key = UtilService.generateDIDLocalVersion(userDid);
    let localVersion = localStorage.getItem(key) || ''
    if (localVersion == "" && isForce === false) {
      return
    }
    if (localVersion != Config.scriptVersion) {
      try {
        if (localVersion === '') {
          let result = await this.queryFeedsScripting();
          regist_scripting = result[0]["regist_scripting"];
          lasterVersion = result[0]["laster_version"];
          preVersion = result[0]["pre_version"];
        }
        else {

        }
      }
      catch (error) {
        if (error["code"] === 404) {
          regist_scripting = true
        }
      }
    }
    else {
      // 不需要注册 return

      await this.syncSubscribedChannelFromRemote();
      return
    }
    if (Config.scriptVersion !== lasterVersion) {
      try {
        // let syncHiveData1 = { status: 1, describe: "GalleriahivePage.creatingScripting" }
        // this.events.publish(FeedsEvent.PublishType.updateSyncHiveData, syncHiveData1);
        // this.dataHelper.setSyncHiveData(syncHiveData1);
        await this.createCollectionAndRregisteScript(userDid)
        await this.restoreCustomAvatar();
        preVersion = lasterVersion === '' ? localVersion : lasterVersion
        lasterVersion = Config.scriptVersion
        regist_scripting = false
        localVersion = lasterVersion
        //update
        await this.updateFeedsScripting(lasterVersion, preVersion, regist_scripting)
        const key = UtilService.generateDIDLocalVersion(userDid);
        localStorage.setItem(key, localVersion)
      } catch (error) {
        Logger.warn(error);
      }
    } else if (localVersion === '' && Config.scriptVersion === lasterVersion) {
      localVersion = Config.scriptVersion
      const key = UtilService.generateDIDLocalVersion(userDid);
      localStorage.setItem(key, localVersion)
    }

    await this.syncSubscribedChannelFromRemote();
  }

  prepareHive(userDid: string, forceCreate: boolean): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createSQLTables(userDid);
        await this.prepareConnection(forceCreate);
        await this.initRegisterScript(true);
        resolve('FINISH');
      } catch (error) {
        reject(error);
      }
    });
  }

  createSQLTables(userDid: string): Promise<string> {
    return this.dataHelper.createSQLTables(userDid);
  }

  deleteAllPost() {
    return new Promise(async (resolve, reject) => {
      try {
        const channelList = await this.dataHelper.getSelfChannelListV3();
        let sum = 0;
        for (let index = 0; index < channelList.length; index++) {
          const channel = channelList[index];
          const postList = await this.dataHelper.getPostListV3FromChannel(channel.destDid, channel.channelId);
          for (let indexPost = 0; indexPost < postList.length; indexPost++) {
            const post = postList[indexPost];
            sum++;

            this.deletePost(post).then(() => {
              sum--;
              if (sum == 0) {
                resolve('FINISH');
              }
            });
          }
        }
        if (sum == 0) {
          resolve('FINISH');
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserProfile(userDid: string, syncRemote: boolean = false): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!syncRemote) {
          const localProfile = await this.getUserProfileFromLocal(userDid);
          if (!localProfile) {
            resolve(null);
            return;
          }

          try {
            if (!localProfile.resolvedName && !localProfile.resolvedBio && !localProfile.resolvedAvatar) {
              const profile = await this.syncUserProfileFromDidDocument(userDid);
              resolve(profile);
            }
          } catch (error) {
          }

          try {
            if (!localProfile.updatedAt || localProfile.updatedAt == 0)
              this.getUserProfileWithSaveFromRemote(userDid).catch(() => { });
          } catch (error) {
          }
          resolve(localProfile);
        } else {
          let remoteProfile = null;
          try {
            remoteProfile = await this.getUserProfileWithSaveFromRemote(userDid).catch(() => { });
          } catch (error) {
          }
          resolve(remoteProfile);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserProfilePageItem(userDid: string): Promise<{ name: string, description: string, avatarHiveUrl: string, credentials: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const userProfile = await this.getUserProfile(userDid);
        if (!userProfile) {
          resolve({ name: '', description: '', avatarHiveUrl: '', credentials: '' })
          return;
        }

        const name = userProfile.name || userProfile.resolvedName || userProfile.displayName
        const avatarHiveUrl = userProfile.avatar || userProfile.resolvedAvatar;
        const description = userProfile.bio || userProfile.resolvedBio;

        const credentials = userProfile.credentials || '';
        resolve({ name: name, description: description, avatarHiveUrl: avatarHiveUrl, credentials: credentials });
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserProfileFromLocal(userDid: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        const user: FeedsData.UserProfile = await this.dataHelper.getUserProfileData(userDid);
        if (!user) {
          const displayName = await this.dataHelper.getDisplayNameByUserDid(userDid);
          const newUser: FeedsData.UserProfile = {
            did: userDid,
            resolvedName: '',
            resolvedAvatar: '',
            resolvedBio: '',
            displayName: displayName,
            name: '',
            avatar: '',
            bio: '',
            updatedAt: 0,
            credentials: ''
          }
          this.dataHelper.addUserProfile(newUser);
          resolve(newUser);
          return;
        }

        if (!user.displayName) {
          const displayName = await this.dataHelper.getDisplayNameByUserDid(userDid);
          const newUser: FeedsData.UserProfile = {
            did: userDid,
            resolvedName: user.resolvedName,
            resolvedAvatar: user.resolvedAvatar,
            resolvedBio: user.resolvedBio,
            displayName: displayName,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            updatedAt: user.updatedAt,
            credentials: user.credentials
          }
          this.dataHelper.addUserProfile(newUser);
          resolve(newUser);
          return;
        }
        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  }


  getLocalUserProfile(userDid: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        const user: FeedsData.UserProfile = await this.dataHelper.getUserProfileData(userDid);
        if (!user) {
          const displayName = await this.dataHelper.getDisplayNameByUserDid(userDid);
          const newUser: FeedsData.UserProfile = {
            did: userDid,
            resolvedName: '',
            resolvedAvatar: '',
            resolvedBio: '',
            displayName: displayName,
            name: '',
            avatar: '',
            bio: '',
            updatedAt: 0,
            credentials: ''
          }
          this.dataHelper.addUserProfile(newUser);
          resolve(newUser);
          return;
        }

        if (!user.displayName) {
          const displayName = await this.dataHelper.getDisplayNameByUserDid(userDid);
          const newUser: FeedsData.UserProfile = {
            did: userDid,
            resolvedName: user.resolvedName,
            resolvedAvatar: user.resolvedAvatar,
            resolvedBio: user.resolvedBio,
            displayName: displayName,
            name: user.name,
            avatar: user.avatar,
            bio: user.bio,
            updatedAt: user.updatedAt,
            credentials: user.credentials
          }
          this.dataHelper.addUserProfile(newUser);
          resolve(newUser);
          return;
        }
        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  }

  syncUserProfileFromSubscribedChannel() {
    return new Promise(async (resolve, reject) => {
      try {

        // resolve();
      } catch (error) {

      }
    });
  }

  syncUserProfileFromDidDocument(userDid: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        const resolvedResult = await this.didHelper.resolveUserProfile(userDid);

        if (!resolvedResult) {
          const originUserProfile = await this.getUserProfileFromLocal(userDid) || null;
          resolve(originUserProfile);
          Logger.warn(TAG, 'Resolve user profile result is null');
          return;
        }

        const resolvedAvatar = resolvedResult.avatar;
        const resolvedName = resolvedResult.name;
        const resolvedDescrpition = resolvedResult.description;

        const originUserProfile = await this.getUserProfileFromLocal(userDid) || null;

        let originName = '';
        let originDisplayName = '';
        let originAvatar = '';
        let originBio = '';
        let originUpdatedAt = 0;
        let originCredentials = '';

        if (originUserProfile) {
          originName = originUserProfile.name;
          originDisplayName = originUserProfile.displayName;
          originAvatar = originUserProfile.avatar;
          originBio = originUserProfile.bio;
          originUpdatedAt = originUserProfile.updatedAt;
          originCredentials = originUserProfile.credentials;
        }

        const newUserProfile: FeedsData.UserProfile = {
          did: userDid,
          resolvedName: resolvedName,
          resolvedAvatar: resolvedAvatar,
          resolvedBio: resolvedDescrpition,
          displayName: originDisplayName,
          name: originName,
          avatar: originAvatar,
          bio: originBio,
          updatedAt: originUpdatedAt,
          credentials: originCredentials
        }
        await this.dataHelper.addUserProfile(newUserProfile);
        resolve(newUserProfile);
      } catch (error) {
        reject(error);
      }
    });
  }

  syncUserProfileFromHive(userDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        //TODO
      } catch (error) {
      }
    });
  }

  refreshUserProfile(userDid: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        let remoteProfile = null;
        try {
          remoteProfile = await this.getUserProfileWithSaveFromRemote(userDid);
        } catch (error) {
        }

        try {
          remoteProfile = await this.syncUserProfileFromDidDocument(userDid);
        } catch (error) {
        }

        resolve(remoteProfile);
      } catch (error) {
        Logger.error(TAG, 'Update profile error', error);
        reject(error);
      }
    });
  }

  syncDidDocumentProfileFromList(usersDidList: string[]) {
  }

  syncHiveProfileFromList(usersDidList: string[]) {

  }

  queryPublicPostById(targetDid: string, channelId: string, postId: string): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPublicPostById(targetDid, channelId, postId);
        if (!result) {
          resolve(null);
          return;
        }

        const posts = HiveVaultResultParse.parsePostResult(targetDid, result.find_message.items);
        if (!posts || posts.length == 0) {
          resolve(null);
          return;
        }

        resolve(posts[0]);
      } catch (error) {
      }
    });
  }

  uploadUserProfile(did: string, name: string, description: string, avatar: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        const avatarHiveURL = await this.hiveVaultApi.uploadMediaDataWithString(avatar);
        const result = await this.hiveVaultApi.uploadSelfProfile(name, description, avatarHiveURL);

        const originProfile = await this.getUserProfile(did);
        const userProfile: FeedsData.UserProfile = {
          did: did,
          resolvedName: originProfile.resolvedName,
          resolvedAvatar: originProfile.resolvedAvatar,
          resolvedBio: originProfile.resolvedBio,
          displayName: originProfile.displayName,
          name: result.name,
          avatar: result.avatar,
          bio: result.description,
          updatedAt: result.updatedAt,
          credentials: originProfile.credentials
        }
        this.dataHelper.addUserProfile(userProfile);
        resolve(userProfile)
      } catch (error) {
      }
    });
  }

  updateUserProfile(did: string, name: string, description: string, avatar: string, newCredentials: string = ''): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        let avatarHiveUrl = '';
        if (avatar != '' && avatar != 'null' && !avatar.startsWith('hive://')) {
          avatarHiveUrl = await this.uploadUserProfileAvatar(avatar);
        }

        const originProfile = await this.getUserProfileFromLocal(did);

        let credentials = ''
        if (!newCredentials) {
          credentials = originProfile.credentials;
        } else {
          credentials = newCredentials;
        }

        const result = await this.hiveVaultApi.updateSelfProfile(name, description, avatarHiveUrl, credentials);
        if (!result) {
          Logger.error(TAG, 'Update profile result null');
          reject('Update profile result null');
          return;
        }

        const userProfile: FeedsData.UserProfile = {
          did: did,
          resolvedName: originProfile.resolvedName,
          resolvedAvatar: originProfile.resolvedAvatar,
          resolvedBio: originProfile.resolvedBio,
          displayName: originProfile.displayName,
          name: name,
          avatar: avatarHiveUrl,
          bio: description,
          updatedAt: result.updatedAt,
          credentials: newCredentials
        }

        if (avatarHiveUrl != originProfile.avatar) {
          const scriptName = UtilService.parseScriptNameFromHiveUrl(avatarHiveUrl);
          await this.fileHelperService.saveV3Data(scriptName, avatar);
        }

        await this.dataHelper.addUserProfile(userProfile);
        resolve(userProfile)
      } catch (error) {
        Logger.error(TAG, 'Update profile error', error);
        reject(error);
      }
    });
  }

  getRemoteUserProfileWithoutSave(userDid: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryProfile(userDid);
        if (!result) {
          Logger.error(TAG, 'Get remote result null');
          resolve(null);
          return;
        }
        const profile = HiveVaultResultParse.parseProfileResult(result.find_message.items);
        if (!profile) {
          Logger.error(TAG, 'Get remote profile result null');
          resolve(null);
          return;
        }
        const originProfile = await this.getUserProfileFromLocal(userDid);
        const userProfile: FeedsData.UserProfile = {
          did: userDid,
          resolvedName: originProfile.resolvedName,
          resolvedAvatar: originProfile.resolvedAvatar,
          resolvedBio: originProfile.resolvedBio,
          displayName: originProfile.displayName,
          name: profile.name,
          avatar: profile.avatar,
          bio: profile.description,
          updatedAt: profile.updatedAt,
          credentials: profile.credentials
        }

        resolve(userProfile);
      } catch (error) {
        Logger.warn(TAG, 'Cant get remote profile', userDid);
        reject(error);
      }
    });
  }

  getUserProfileWithSaveFromRemote(userDid: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        const profile = await this.getRemoteUserProfileWithoutSave(userDid);
        if (!profile) {
          Logger.error(TAG, 'Get remote user profile result null');
          resolve(null);
          return;
        }
        await this.dataHelper.addUserProfile(profile);
        resolve(profile);
      } catch (error) {
        Logger.warn(TAG, 'Cant Get remote user profile', userDid);
        reject(error);
      }
    });
  }

  syncSelfProfileWithRemote(): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      const signinData = (await this.dataHelper.getSigninData());
      const userDid: string = (await this.dataHelper.getSigninData()).did;
      try {
        let remoteProfile = null;
        try {
          remoteProfile = await this.getRemoteUserProfileWithoutSave(userDid);
        } catch (error) {
        }

        try {
          await this.syncUserProfileFromDidDocument(userDid);
        } catch (error) {
        }

        const localUserProfile = await this.getUserProfileFromLocal(userDid);
        if (!remoteProfile || !remoteProfile.updatedAt) {
          const name = localUserProfile.name || localUserProfile.resolvedName || localUserProfile.displayName;
          const description = localUserProfile.bio || localUserProfile.resolvedBio;
          const avatar = localUserProfile.avatar || localUserProfile.resolvedAvatar;
          const credentials = localUserProfile.credentials || '';

          let finalName = ''
          if (!name) {
            finalName = signinData.name;
          } else {
            finalName = name;
          }
          if (!name || !description || !avatar) {
            const updatedProfile = await this.updateUserProfile(userDid, finalName, description, avatar, credentials);
            resolve(updatedProfile);
            return;
          }
          resolve(localUserProfile);
          return;
        }

        this.dataHelper.addUserProfile(remoteProfile);
        resolve(remoteProfile);
      } catch (error) {
        Logger.error(TAG, 'Update profile error', error);
        reject(error);
      }
    });
  }

  refreshAllDidDocument(userDidList: string[]) {
    userDidList.forEach(userDid => {
      this.syncUserProfileFromDidDocument(userDid);
    });
  }

  refreshAllDidDocumentFromSubscriptionList() {

  }
  diffProfile(originProfile: FeedsData.UserProfile, newProfile: FeedsData.UserProfile): boolean {
    return _.isEqual(originProfile, newProfile);
  }

  //For self
  insertSubscribedChannelToRemote(targetDid: string, channelId: string, subscribedAt: number, updatedAt: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.hiveVaultApi.insertSubscribedChannel(targetDid, channelId, '', '', '', '', '', '', subscribedAt, updatedAt);
        resolve('FINISH');
      } catch (error) {
        Logger.error(TAG, 'Backup subscribed channel error', error);
        reject(error);
      }
    });
  }

  uploadUserProfileAvatar(avatarData: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const selfDid = (await this.dataHelper.getSigninData()).did;
        const scriptName = await this.hiveVaultApi.uploadDataWithScriptName(Config.FEEDS_HIVE_CUSTOM_AVATAR_PATH, avatarData, (process: number) => { });
        const hiveUrl = UtilService.createHiveUrl(selfDid, scriptName);
        resolve(hiveUrl);
      } catch (error) {
        Logger.error(TAG, 'Upload profile avatar error', error);
        reject(error);
      }
    });
  }

  queryUserOwnedChannels(userDid: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryOwnedChannelsByTargetDid(userDid);
        if (!result) {
          resolve(null);
          return;
        }
        const channelList = await this.handleChannelResult(userDid, result.find_message.items);
        if (!channelList || channelList.length == 0) {
          resolve(null);
          return;
        }
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  querySubscribedChannelsByOwnerFromLocal(userDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribedChannels = await this.dataHelper.getSubscribedChannelByUser(userDid);
        if (!subscribedChannels) {
          resolve([]);
          return;
        }
        resolve(subscribedChannels);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  querySubscribedChannelsByOwner(userDid: string, subscribedChannelType: FeedsData.SubscribedChannelType = FeedsData.SubscribedChannelType.ALL_CHANNEL, callback: (localCachedSubscribedChannelList: FeedsData.SubscribedChannelV3[]) => void, forceLoadRemote: boolean = false): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const localCacheSubscribedChannels = await this.querySubscribedChannelsByOwnerFromLocal(userDid);
        if (subscribedChannelType == FeedsData.SubscribedChannelType.ALL_CHANNEL) {
          callback(localCacheSubscribedChannels);
        } else {
          const filterResult = await this.dataHelper.filterSubscribedChannelV3(userDid, localCacheSubscribedChannels, subscribedChannelType);
          callback(filterResult);
        }
        if (!forceLoadRemote && localCacheSubscribedChannels != null) {
          if (subscribedChannelType == FeedsData.SubscribedChannelType.ALL_CHANNEL) {
            resolve(localCacheSubscribedChannels);
            return;
          } else {
            const filterResult = await this.dataHelper.filterSubscribedChannelV3(userDid, localCacheSubscribedChannels, subscribedChannelType);
            resolve(filterResult);
            return;
          }
        }
        const subscribedChannels = await this.querySubscribedChannelsByOwnerFromRemote(userDid);
        if (!subscribedChannels) {
          resolve([]);
          return;
        }
        if (subscribedChannelType == FeedsData.SubscribedChannelType.ALL_CHANNEL) {
          resolve(subscribedChannels);
        } else {
          const filterResult = await this.dataHelper.filterSubscribedChannelV3(userDid, subscribedChannels, subscribedChannelType);
          resolve(filterResult);
        }
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  updateSubscribedChannelDataToRemote(subscribedChannel: FeedsData.SubscribedChannelV3) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.updateSubscribedChannel(subscribedChannel.targetDid, subscribedChannel.channelId, subscribedChannel.subscribedAt, subscribedChannel.channelName, subscribedChannel.channelDisplayName,
          subscribedChannel.channelIntro, subscribedChannel.channelAvatar, subscribedChannel.channelType, subscribedChannel.channelCategory);
        if (!result) {
          resolve(null);
          return;
        }
        resolve(result);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  removeSubscribedChannelDataFromRemote(targetDid: string, channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.removeSubscribedChannelById(targetDid, channelId);
        if (!result) {
          resolve(null);
          return;
        }
        resolve(result);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  private queryBackupSubscribedChannelFromRemote(): Promise<FeedsData.BackupSubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryBackupData();
        console.log(TAG, 'Query backup subscribed channel result is', result);
        if (!result) {
          resolve([])
          return;
        }

        const subscribedList = HiveVaultResultParse.parseBackupSubscribedChannelResult(result);

        if (!subscribedList || subscribedList.length == 0) {
          resolve([]);
          return;
        }

        resolve(subscribedList);
      } catch (error) {
        Logger.error(TAG, 'Query backup subscribed channel error', error);
        reject(error);
      }
    });
  }

  getChannelListFromSubscribedChannelList(subscribedChannelList: FeedsData.SubscribedChannelV3[], callback: (localCachedChannelList: FeedsData.ChannelV3[]) => void, forceLoadRemote: boolean = false): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      if (!subscribedChannelList || subscribedChannelList.length == 0) {
        resolve([]);
        return
      }
      let localChannelList: FeedsData.ChannelV3[] = [];
      let remoteChannelList: FeedsData.ChannelV3[] = [];
      let channelPromisList: Promise<void>[] = [];

      subscribedChannelList.forEach((subscribedChannel: FeedsData.SubscribedChannelV3) => {
        if (subscribedChannel) {
          const getChannelDataPromise = this.getChannelV3ById(subscribedChannel.targetDid, subscribedChannel.channelId, (localChannel: FeedsData.ChannelV3) => {
            localChannelList.push(localChannel);
          }, forceLoadRemote).then((remoteChannel: FeedsData.ChannelV3) => {
            remoteChannelList.push(remoteChannel);
          }).catch((error) => {
          });
          channelPromisList.push(getChannelDataPromise);
        }
      });
      callback(localChannelList);
      Promise.allSettled(channelPromisList).then(() => {
        resolve(remoteChannelList)
      }).catch((error) => { });
    });
  }

  getChannelListFromOwner(ownerDid: string, subscribedChannelType: FeedsData.SubscribedChannelType = FeedsData.SubscribedChannelType.ALL_CHANNEL, callback: (localCachedChannelList: FeedsData.ChannelV3[]) => void, forceLoadRemote: boolean = false): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      this.querySubscribedChannelsByOwner(ownerDid, subscribedChannelType, (localCachedSubscribedChannelList: FeedsData.SubscribedChannelV3[]) => {
        this.getChannelListFromSubscribedChannelList(localCachedSubscribedChannelList, (channelList: FeedsData.ChannelV3[]) => {
          callback(channelList);
        }).then((channelList: FeedsData.ChannelV3[]) => {
          callback(channelList);
        }).catch((error) => { });
      }, forceLoadRemote).then((finalSubscribedChannelList: FeedsData.SubscribedChannelV3[]) => {
        this.getChannelListFromSubscribedChannelList(finalSubscribedChannelList, (channelList: FeedsData.ChannelV3[]) => {
          callback(channelList);
        }).then((channelList: FeedsData.ChannelV3[]) => {
          callback(channelList);
          resolve(channelList);
        }).catch((error) => {
        });
      }).catch((error) => {
        reject(error);
      })
    });
  }

  //#####################
  //TODO
  queryTimeLineData() {

  }

  queryPostByPostId(targetDid: string, channelId: string, postId: string, callback: (localCachedChannel: FeedsData.PostV3) => void, forceLoadRemote: boolean = false): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const localPost = await this.queryPostByPostIdFromLocal(targetDid, channelId, postId) || null;
        callback(localPost);
        if (!forceLoadRemote && localPost != null) {
          resolve(localPost);
          return;
        }

        const remotePost = await this.queryPostByPostIdFromRemote(targetDid, channelId, postId) || null;
        if (!remotePost) {
          resolve(null);
          return;
        }
        resolve(remotePost);
      } catch (error) {
        Logger.error(TAG, error);
        resolve(null);
        reject(error);
      }
    });
  }

  queryCommentListByChannelId(targetDid: string, channelId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {

      } catch (error) {
        Logger.error(TAG, error);
        resolve(null);
        reject(error);
      }
    });
  }

  queryCommentListByPostId(): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {

      } catch (error) {
        Logger.error(TAG, error);
        resolve(null);
        reject(error);
      }
    });
  }

  /* queryPostListByChannelId start*/
  queryPostListByChannelId(): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      // try {
      //   const localPost = await this.queryPostListByChannelIdFromLocal(targetDid, channelId, postId) || null;
      //   callback(localPost);
      //   if (!forceLoadRemote && localPost != null) {
      //     resolve(localPost);
      //     return;
      //   }

      //   const remotePost = await this.querypostli(targetDid, channelId, postId) || null;
      //   if (!remotePost) {
      //     resolve(null);
      //     return;
      //   }
      //   resolve(remotePost);
      // } catch (error) {
      //   Logger.error(TAG, error);
      //   resolve(null);
      //   reject(error);
      // }
    });
  }

  queryPostListByChannelIdFromLocal() {

  }

  queryPostListByChannelIdFromRemote() {

  }
  /* queryPostListByChannelId end*/

  /* queryPostByChannelIdWithTime start*/
  private queryPostByChannelIdWithTime(targetDid: string, channelId: string, endTime: number, callbackCached: (localCachedPost: FeedsData.PostV3[]) => void, callback: (newPostNum: number) => void, forceLoadRemote: boolean = false): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const localPostList = await this.queryPostByChannelIdByTimeFromLocal(targetDid, channelId, endTime) || [];
        callbackCached(localPostList);
        if (!forceLoadRemote && localPostList.length > 0) {
          resolve(localPostList);
          return;
        }

        const remotePostList = await this.queryPostByChannelIdWithTimeFromRemote(targetDid, channelId, endTime, (newPostNum: number) => { callback(newPostNum); }) || [];
        if (!remotePostList) {
          resolve([]);
          return;
        }
        resolve(remotePostList);
      } catch (error) {
        Logger.error(TAG, error);
        resolve(null);
        reject(error);
      }
    });
  }

  private queryPostByChannelIdWithTimeFromLocal(destDid: string, channelId: string, endTime: number, callback: (postNum: number) => void): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostByRangeOfTime(destDid, channelId, 0, endTime);
        const postList = await this.handleSyncPostResult(destDid, channelId, result, callback);

        //this.eventBus.publish(FeedsEvent.PublishType.updateTab, false);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Query post with time error', error);
        reject(error);
      }
    });
  }

  //TOBE Improve
  queryPostByChannelIdWithTimeFromRemote(destDid: string, channelId: string, endTime: number, callback: (postNum: number) => void): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.hiveVaultApi.queryPostByRangeOfTime(destDid, channelId, 0, endTime);
        const postList = await this.handleSyncPostResult(destDid, channelId, result, callback);

        //this.eventBus.publish(FeedsEvent.PublishType.updateTab, false);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Query post with time error', error);
        reject(error);
      }
    });
  }
  /* queryPostByChannelIdWithTime end*/

  /* queryPostListByChannelList start*/
  queryPostListByChannelList(channelIdList: string[], callback: (localCachedPostList: FeedsData.PostV3[]) => void, forceLoadRemote: boolean = false): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      // try {
      //   const localPost = await this.queryPostListByChannelListFromLocal(channelIdList) || null;
      //   callback(localPost);
      //   if (!forceLoadRemote && localPost != null) {
      //     resolve(localPost);
      //     return;
      //   }

      //   const remotePost = await this.queryPostByPostIdFromRemote(targetDid, channelId, postId) || null;
      //   if (!remotePost) {
      //     resolve(null);
      //     return;
      //   }
      //   resolve(remotePost);
      // } catch (error) {
      //   Logger.error(TAG, error);
      //   resolve(null);
      //   reject(error);
      // }
    });
  }

  private queryPostListByChannelListFromLocal(channelIdList: string[]): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const localPostList = await this.dataHelper.getPostListByChannelList(channelIdList) || [];
        resolve(localPostList);
      } catch (error) {
        Logger.error(TAG, error);
        resolve([]);
        reject(error);
      }
    });
  }

  private queryPostListByChannelListFromRemote() {

  }
  /* queryPostListByChannelList end*/

  //ForUI
  refreshChannelPage() {
    //subscribedChannel sync
    //post
    //channel
    //like
  }

  //ForUI
  refreshHomePage() {
  }

  //ForUI
  refereshPostDetailPage() {

  }

  //ForUI
  refreshProfilePage() {
    // subscribedChannel
    // userProfile asyn
    //
  }

  //TOBE improve
  refreshHomeData(callback: (postNum: number) => void) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.syncSubscribedChannelFromRemote();
        await this.refreshSubscription();
        const did = (await this.dataHelper.getSigninData()).did;
        this.syncSelfChannel(did).catch(() => { });
        this.asyncGetAllChannelInfo().catch(() => { });
        this.asyncGetAllPost(callback).catch(() => { });
        this.asyncGetAllComments().catch(() => { });
        this.asyncGetAllLikeData().catch(() => { });
      } catch (error) {
      }
    });
  }

  restoreCustomAvatar(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let avatarImage = null;
      try {
        avatarImage = await this.downloadCustomeAvatar('custome');
      } catch (error) {
      }

      if (!avatarImage) {
        resolve('FINISH');
        return;
      }

      try {
        const signinData = (await this.dataHelper.getSigninData());
        const selfDid = signinData.did
        const userProfile = await this.getUserProfileWithSaveFromRemote(selfDid);
        const credentials = userProfile.credentials || '';
        let name = ''
        if (!userProfile.name) {
          name = signinData.name;
        } else {
          name = userProfile.name;
        }
        if (!userProfile.avatar) {
          await this.updateUserProfile(selfDid, name, userProfile.bio, avatarImage, credentials);
          resolve('FINISH');
        } else {
          resolve('FINISH');
        }
      } catch (error) {

      }
    });
  }

}
