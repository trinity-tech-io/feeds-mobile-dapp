import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { DataHelper } from './DataHelper';
import { PostHelperService } from 'src/app/services/post_helper.service';
import { HiveVaultHelper } from 'src/app/services/hivevault_helper.service';
import { en } from 'src/assets/i18n/en';

const TAG = 'API-HiveVault';

@Injectable()
export class HiveVaultApi {
  constructor(
    private hiveService: HiveService,
    private dataHelper: DataHelper,
    private postHelperService: PostHelperService,
    private hiveVaultHelper: HiveVaultHelper
  ) {
  }

  registeScripting(): Promise<string> {
    return this.hiveVaultHelper.registeScripting();
  }

  createFeedsScripting(lasterVersion: string, preVersion: string, registScripting: boolean = false): Promise<string> {
    return this.hiveVaultHelper.createFeedsScripting(lasterVersion, preVersion, registScripting);
  }

  updateFeedsScripting(lasterVersion: string, preVersion: string, registScripting: boolean = false) {
    return this.hiveVaultHelper.updateFeedsScripting(lasterVersion, preVersion, registScripting);
  }

  queryFeedsScripting(): Promise<any> {
    return this.hiveVaultHelper.queryFeedsScripting();
  }

  createAllCollections(): Promise<string> {
    return this.hiveVaultHelper.createAllCollections();
  }

  deleteCollection(collectionName: string): Promise<void> {
    return this.hiveVaultHelper.deleteCollection(collectionName)
  }

  deleteAllCollections(): Promise<string> {
    return this.hiveVaultHelper.deleteAllCollections()
  }
  /** Channel */
  async createChannel(channelName: string, displayName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string, category: string = '', proof: string = ''): Promise<any> {
    return await this.hiveVaultHelper.createChannel(channelName, displayName, intro, avatarAddress, tippingAddress, type, nft, memo, category, proof);
  }

  async updateChannel(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
    newTippingAddress: string, newNft: string) {
    return await this.hiveVaultHelper.updateChannel(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft);
  }

  queryChannelInfo(targetDid: string, channelId: string): Promise<any> {
    return this.hiveVaultHelper.queryChannelInfo(targetDid, channelId);
  }

  /** Post */
  async publishPost(channelId: string, tag: string, content: string, type: string = 'public', status: number = FeedsData.PostCommentStatus.available, memo: string, proof: string, from: number): Promise<{ targetDid: string, postId: string, createdAt: number, updatedAt: number }> {
    return await this.hiveVaultHelper.publishPost(channelId, tag, content, type, status, memo, proof, from);
  }

  updatePost(postId: string, channelId: string, newType: string, newTag: string, newContent: string, newStatus: number, newUpdateAt: number, newMemo: string, newProof: string, pinStatus: FeedsData.PinStatus, from: number) {
    return this.hiveVaultHelper.updatePost(postId, channelId, newType, newTag, newContent, newStatus, newUpdateAt, newMemo, newProof, pinStatus, from);
  }

  deletePost(postId: string, channelId: string): Promise<{ updatedAt: number, status: number }> {
    return this.hiveVaultHelper.deletePost(postId, channelId);
  }

  queryPostByChannelId(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.queryPostByChannelId(targetDid, channelId);
  }

  queryPostByRangeOfTime(targetDid: string, channelId: string, star: number, end: number) {
    return this.hiveVaultHelper.queryPostRangeOfTimeScripting(targetDid, channelId, star, end)
  }
  queryPostById(targetDid: string, channelId: string, postId: string) {
    return this.hiveVaultHelper.queryPostById(targetDid, channelId, postId);
  }

  /** Suscription */
  async subscribeChannel(targetDid: string, channelId: string, displayName: string, status: number = FeedsData.PostCommentStatus.available): Promise<{ createdAt: number, updatedAt: number }> {
    return await this.hiveVaultHelper.subscribeChannel(targetDid, channelId, displayName, status);
  }

  updateSubscription(targetDid: string, channelId: string, status: number): Promise<{ updatedAt: number }> {
    return this.hiveVaultHelper.updateSubscription(targetDid, channelId, status);
  }

  unSubscribeChannel(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.unsubscribeChannel(targetDid, channelId);
  }

  querySubscrptionInfoByChannelId(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.querySubscriptionInfoByChannelId(targetDid, channelId);
  }

  querySubscriptionInfoByUserDID(targetDid: string, userDid: string) {
    return this.hiveVaultHelper.querySubscriptionByUserDID(targetDid, userDid);
  }

  querySubscriptionByUserDIDAndChannelId(targetDid: string, userDid: string, channelId: string) {
    return this.hiveVaultHelper.querySubscriptionByUserDIDAndChannelId(targetDid, userDid, channelId);
  }

  /** Comment */
  async createComment(targetDid: string, channelId: string, postId: string, refcommentId: string, content: string): Promise<{ commentId: string, createrDid: string, createdAt: number }> {
    return await this.hiveVaultHelper.createComment(targetDid, channelId, postId, refcommentId, content);
  }

  async updateComment(targetDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<{ updatedAt: number }> {
    return await this.hiveVaultHelper.updateComment(targetDid, channelId, postId, commentId, content);
  }

  deleteComment(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.deleteComment(targetDid, channelId, postId, commentId);
  }

  queryCommentByPostId(targetDid: string, channelId: string, postId: string) {
    return this.hiveVaultHelper.queryCommentByPostId(targetDid, channelId, postId);
  }

  queryCommentByID(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.queryCommentByID(targetDid, channelId, postId, commentId);
  }

  queryCommentByChannel(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.queryCommentByChannel(targetDid, channelId);
  }

  queryCommentByRangeOfTime(targetDid: string, channelId: string, postId: string, star: number, end: number) {
    return this.hiveVaultHelper.queryCommentRangeOfTimeScripting(targetDid, channelId, postId, star, end)
  }

  /** Like */
  queryLikeByChannel(targetDid: string, channelId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByChannel(targetDid, channelId);
  }

  queryLikeById(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeById(targetDid, channelId, postId, commentId);
  }

  queryLikeByUser(targetDid: string, channelId: string, postId: string, commentId: string, userDid: string): Promise<any> {
    // TODO userDid: string
    return this.hiveVaultHelper.queryLikeById(targetDid, channelId, postId, commentId);
  }

  queryLikeByPost(targetDid: string, channelId: string, postId: string): Promise<any> {
    return this.hiveVaultHelper.queryLikeByPost(targetDid, channelId, postId);
  }

  queryLikeByRangeOfTime(targetDid: string, channelId: string, postId: string, star: number, end: number) {
    return this.hiveVaultHelper.queryLikeRangeOfTimeScripting(targetDid, channelId, postId, star, end)
  }

  addLike(targetDid: string, likeId: string, channelId: string, postId: string, commentId: string): Promise<{ createdAt: number }> {
    return this.hiveVaultHelper.addLike(targetDid, likeId, channelId, postId, commentId);
  }

  removeLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
    return this.hiveVaultHelper.removeLike(targetDid, channelId, postId, commentId);
  }

  updateLike(targetDid: string, likeId: string, status: FeedsData.PostCommentStatus): Promise<{ updatedAt: number }> {
    return this.hiveVaultHelper.updateLike(targetDid, likeId, status);
  }

  /** Download data */
  downloadScripting(targetDid: string, avatarHiveURL: string): Promise<any> {
    return this.hiveVaultHelper.downloadScripting(targetDid, avatarHiveURL)
  }

  downloadCustomeAvatar(remoteHiveUrlPath: string): Promise<any> {
    return this.hiveVaultHelper.downloadFile(remoteHiveUrlPath);
  }

  parseDidDocumentAvatar(userDid: string) {
    return this.hiveVaultHelper.parseDidDocumentAvatar(userDid);
  }

  downloadEssAvatar(avatarParam: string, avatarScriptName: string, tarDID: string, tarAppDID: string): Promise<string> {
    return this.hiveVaultHelper.downloadEssAvatar(avatarParam, avatarScriptName, tarDID, tarAppDID);
  }

  downloadAvatarFromHiveUrl(hiveUrl: string, targetDid: string): Promise<string> {
    return this.hiveVaultHelper.downloadAvatarFromHiveUrl(hiveUrl, targetDid);
  }

  uploadMediaDataWithString(data: string): Promise<string> {
    return this.hiveVaultHelper.uploadMediaDataWithString(data);
  }

  uploadMediaDataWithBuffer(data: Buffer): Promise<string> {
    return this.hiveVaultHelper.uploadMediaDataWithBuffer(data);
  }

  /** selfData */
  querySelfChannels(): Promise<any> {
    return this.hiveVaultHelper.querySelfChannels();
  }

  querySelfPosts(): Promise<any> {
    return this.hiveVaultHelper.querySelfPosts();
  }

  querySelfPostsByChannel(channelId: string): Promise<any> {
    return this.hiveVaultHelper.querySelfPostsByChannel(channelId);
  }

  queryUserDisplayName(targetDid: string, channelId: string, userDid: string): Promise<any> {
    return this.hiveVaultHelper.queryUserDisplayName(targetDid, channelId, userDid);
  }

  querySubscription(targetDid: string, channelId: string): Promise<any> {
    return this.hiveVaultHelper.querySubscriptionInfoByChannelId(targetDid, channelId);
  }

  prepareConnection(forceCreate: boolean) {
    return this.hiveVaultHelper.prepareConnection(forceCreate);
  }

  backupSubscribedChannel(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.backupSubscribedChannel(targetDid, channelId);
  }

  queryBackupData(): Promise<any> {
    return this.hiveVaultHelper.queryBackupData();
  }

  removeBackupData(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.removeBackupData(targetDid, channelId);
  }

  queryCommentsFromPosts(targetDid: string, postIds: string[]): Promise<any> {
    return this.hiveVaultHelper.queryCommentsFromPosts(targetDid, postIds);
  }

  querySelfLikeById(targetDid: string, channelId: string, likeId: string) {
    return this.hiveVaultHelper.querySelfLikeById(targetDid, channelId, likeId);
  }

  queryPublicPostById(targetDid: string, channelId: string, postId: string): Promise<any> {
    return this.hiveVaultHelper.queryPublicPostById(targetDid, channelId, postId);
  }

  queryPublicPostByChannelId(targetDid: string, channelId: string): Promise<any> {
    return this.hiveVaultHelper.queryPublicPostByChannelId(targetDid, channelId);
  }

  queryPublicPostRangeOfTime(targetDid: string, channelId: string, start: number, end: number): Promise<any> {
    return this.hiveVaultHelper.queryPublicPostRangeOfTime(targetDid, channelId, start, end);
  }

  uploadSelfProfile(name: string, description: string, avatarAddress: string) {
    return this.hiveVaultHelper.uploadProfile(name, description, avatarAddress);
  }

  updateSelfProfile(name: string, description: string, avatarHiveUrl: string) {
    return this.hiveVaultHelper.updateProfile(name, description, avatarHiveUrl);
  }

  queryProfile(targetDid: string) {
    return this.hiveVaultHelper.queryProfile(targetDid);
  }

  delteFile(remotePath: string) {
    return this.hiveVaultHelper.deleteFile(remotePath);
  }

  uploadDataWithScriptName(remotePath: string, data: string, callback: (process: number) => void): Promise<string> {
    return this.hiveVaultHelper.uploadDataWithScriptName(remotePath, data, callback);
  }

  queryOwnedChannelsByTargetDid(targetDid: string) {
    return this.hiveVaultHelper.queryOwnedChannelsByTargetDid(targetDid);
  }

  insertSubscribedChannel(targetDid: string, channelId: string, channelName: string, channelDisplayName: string,
    channelIntro: string, channelAvatar: string, channelType: string, channelCategory: string, subscribedAt: number, updatedAt: number) {
    return this.hiveVaultHelper.insertSubscribedChannel(targetDid, channelId, channelName, channelDisplayName,
      channelIntro, channelAvatar, channelType, channelCategory, subscribedAt, updatedAt);
  }

  updateSubscribedChannel(targetDid: string, channelId: string, subscribedAt: number, channelName: string, channelDisplayName: string,
    channelIntro: string, channelAvatar: string, channelType: string, channelCategory: string) {
    return this.hiveVaultHelper.updateSubscribedChannel(targetDid, channelId, subscribedAt, channelName, channelDisplayName,
      channelIntro, channelAvatar, channelType, channelCategory);
  }

  removeSubscribedChannel(targetDid: string, channelId: string) {
    return this.hiveVaultHelper.removeSubscribedChannel(targetDid, channelId);
  }

  querySubscribedChannelsByUserDid(targetDid: string) {
    return this.hiveVaultHelper.querySubscribedChannelsByOwnerDid(targetDid);
  }
}
