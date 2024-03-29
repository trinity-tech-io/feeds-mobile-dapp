import { Injectable } from '@angular/core';
import { HiveService } from 'src/app/services/HiveService';
import { Logger } from './logger';
import { UtilService } from './utilService';
import { DataHelper } from './DataHelper';
import { QueryHasResultCondition, FindExecutable, AndCondition, NetworkException, InsertExecutable, UpdateExecutable, DeleteExecutable, UpdateResult, UpdateOptions, InsertResult, FileDownloadExecutable, HiveException, InsufficientStorageException } from "@elastosfoundation/hive-js-sdk";
import { Config } from 'src/app/services/config';
import { rawImageToBase64DataUrl } from 'src/app/services/picture.helpers';
import SparkMD5 from 'spark-md5';
const TAG = 'HiveVaultHelper';
import { TranslateService } from '@ngx-translate/core';
import { PopupProvider } from './popup';
import { NativeService } from './NativeService';

@Injectable()
export class HiveVaultHelper {
    public static readonly TABLE_FEEDS_SCRIPTING = "feeds_scripting2";

    public static readonly TABLE_CHANNELS = "channels";
    public static readonly TABLE_POSTS = "posts";
    public static readonly TABLE_SUBSCRIPTIONS = "subscriptions";
    public static readonly TABLE_COMMENTS = "comments";
    public static readonly TABLE_LIKES = "likes";
    public static readonly TABLE_BACKUP_SUBSCRIBEDCHANNEL = "backup_subscribed_channel";
    public static readonly TABLE_PROFILE = "profile";
    public static readonly TABLE_SUBSCRIBED_CHANNELS = "subscribed_channels";

    // public static readonly SCRIPT_ALLPOST = "script_allpost_name";
    public static readonly SCRIPT_SPECIFIED_POST = "script_specified_post_name";
    public static readonly SCRIPT_SOMETIME_POST = "script_sometime_post_name";
    public static readonly SCRIPT_CHANNEL = "script_channel_name";
    public static readonly SCRIPT_COMMENT = "script_comment_name";
    public static readonly SCRIPT_SUBSCRIPTION = "script_subscriptions_name";

    public static readonly SCRIPT_QUERY_POST_BY_CHANNEL = "script_query_post_by_channel";//all
    public static readonly SCRIPT_QUERY_CHANNEL_INFO = "script_query_channel_info";

    public static readonly SCRIPT_SUBSCRIBE_CHANNEL = "script_subscribe_channel";
    public static readonly SCRIPT_UNSUBSCRIBE_CHANNEL = "script_unsubscribe_channel";
    public static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID = "script_query_subscription_by_channelid";
    public static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID = "script_query_subscription_by_userdid";
    public static readonly SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID = "script_query_subscription_by_userdid_channelid";
    public static readonly SCRIPT_UPDATE_SUBSCRIPTION = "script_update_subscription";

    public static readonly SCRIPT_CREATE_COMMENT = "script_create_comment";
    public static readonly SCRIPT_UPDATE_COMMENT = "script_update_comment";
    public static readonly SCRIPT_QUERY_COMMENT = "script_query_comment";
    public static readonly SCRIPT_DELETE_COMMENT = "script_delete_comment";
    public static readonly SCRIPT_QUERY_COMMENT_BY_POSTID = "script_query_comment_by_postid";
    public static readonly SCRIPT_QUERY_COMMENT_BY_COMMENTID = "script_query_comment_by_commentid";
    public static readonly SCRIPT_QUERY_COMMENT_BY_CHANNELID = "script_query_comment_by_channelid";
    public static readonly SCRIPT_SOMETIME_COMMENT = "script_sometime_comment";

    public static readonly SCRIPT_CREATE_LIKE = "script_add_like";
    public static readonly SCRIPT_REMOVE_LIKE = "script_remove_like";
    public static readonly SCRIPT_QUERY_LIKE_BY_ID = "script_query_like_by_id";
    public static readonly SCRIPT_QUERY_LIKE_BY_POST = "script_query_like_by_post";
    public static readonly SCRIPT_QUERY_LIKE_BY_CHANNEL = "script_query_like_by_channel";
    public static readonly SCRIPT_QUERY_USER_DISPLAYNAME = "script_query_user_displayname";
    public static readonly SCRIPT_UPDATE_LIKE = "script_update_like";
    public static readonly SCRIPT_SOMETIME_LIKE = "script_sometime_like";

    public static readonly SCRIPT_QUERY_SELF_LIKE_BY_ID = "script_query_self_like_by_id";

    public static readonly SCRIPT_QUERY_COMMENT_FROM_POSTS = "script_query_comment_from_posts";
    public static readonly SCRIPT_QUERY_COMMENT_COUNTS = "script_query_comment_counts";

    //public
    public static readonly QUERY_PUBLIC_SPECIFIED_POST = "query_public_specified_post";
    public static readonly QUERY_PUBLIC_SOMETIME_POST = "query_public_sometime_post";
    public static readonly QUERY_PUBLIC_POST_BY_CHANNEL = "query_public_post_by_channel";

    public static readonly SCRIPT_QUERY_PROFILE = "script_query_profile";

    public static readonly SCRIPTV1_QUERY_OWNEDCHANNELS = "script_query_profile_channels_by_targetdid";
    public static readonly SCRIPT_QUERY_SUBSCRIBED_CHANNELS = "script_query_subscribed_channels_by_targetdid";

    private buyStorageSpaceDialog: any = null;
    constructor(
        private hiveService: HiveService,
        private dataHelper: DataHelper,
        private translate: TranslateService,
        private popupProvider: PopupProvider,
        private native: NativeService
    ) {
    }

    registeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                //channel
                const p1 = this.registerQueryChannelInfoScripting()

                //post
                const p2 = this.registerQueryPostByChannelIdScripting();
                const p3 = this.registerQueryPostRangeOfTimeScripting();
                const p4 = this.registerQueryPostByIdScripting();

                //subscription
                const p5 = this.registerSubscribeScripting();
                const p6 = this.registerQuerySubscriptionInfoByChannelIdScripting();
                const p7 = this.registerQuerySubscriptionInfoByUserDIDScripting();
                const p8 = this.registerUnsubscribeScripting()
                const p9 = this.registerUpdateSubscription();

                //comment
                const p10 = this.registerCreateCommentScripting();
                const p11 = this.registerFindCommentByIdScripting();
                const p12 = this.registerQueryCommentByPostIdScripting();
                const p13 = this.registerUpdateCommentScripting();
                const p14 = this.registerDeleteCommentScripting();
                const p15 = this.registerQueryCommentByChannelScripting();

                // //like
                const p16 = this.registerCreateLikeScripting();
                const p17 = this.registerQueryLikeByIdScripting();
                const p18 = this.registerRemoveLikeScripting();
                const p19 = this.registerQueryLikeByChannelScripting();
                const p20 = this.registerQueryLikeByPostScripting();
                const p21 = this.registerUpdateLike()

                //DisplayName
                const p22 = this.registerQueryDisplayNameScripting();

                const p23 = this.registerQueryCommentsFromPostsScripting();

                const p24 = this.registerQuerySelfLikeByIdScripting();

                //Public post
                const p25 = this.registerQueryPublicPostByIdScripting();
                const p26 = this.registerQueryPublicPostByChannelIdScripting();
                const p27 = this.registerQueryPublicPostRangeOfTimeScripting();

                const p28 = this.registerQuerySubscriptionInfoByUserDIDAndChannelIdScripting();

                const p29 = this.registerQueryProfileScripting();
                const p30 = this.registerQueryOwnedChannelsScripting();
                const p31 = this.registerQuerySubscribedChannelsScripting();
                const array = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23, p24, p25, p26, p27, p28, p29, p30, p31] as const
                Promise.all(array).then(values => {
                    resolve('FINISH');
                }, reason => {
                    reject(reason)
                })
            } catch (error) {
                Logger.error(TAG, "registeScripting error", error);
                reject(await this.handleError(error))
            }
        });
    }

    /** 存储feeds 信息 ： 版本号 等 star */
    private insertDataToFeedsScriptingDB(lasterVersion: string, preVersion: string, registScripting: boolean = false): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const doc = {
                "laster_version": lasterVersion,
                "pre_version": preVersion,
                "regist_scripting": registScripting,
            }

            try {
                const insertResult = this.hiveService.insertDBData(HiveVaultHelper.TABLE_FEEDS_SCRIPTING, doc);
                Logger.log(TAG, 'Insert feeds scripting db result', insertResult)
                resolve(doc)
            } catch (error) {
                Logger.error(TAG, 'Insert feeds scripting db error', error)
                reject(await this.handleError(error))
            }
        })
    }

    async handleError(error: any) {

        let message = error.message || null;
        if (message != null && message.indexOf("Failed to construct 'URL': Invalid URL") > -1) {
            this.native.toastWarn('ErrorInfo.HIVE_ERROR_URL');
            return error;
        }

        if (message != null && (message.indexOf("Network Error") > -1 || message.indexOf("Network error") > -1)) {
            this.native.toastWarn('ErrorInfo.HIVE_ERROR_undefined');
            return error;
        }

        let errorCode = error["code"];
        let errorDes = "ErrorInfo.HIVE_ERROR_" + errorCode;
        if (errorCode === 507) {
            if (this.buyStorageSpaceDialog === null) {
                await this.showBuyStorageSpaceDialog(errorDes);
            }
        }
        return error
    }

    async handleLikeError(error: any) {

        let message = error.message || null;
        if (message != null && message.indexOf("Failed to construct 'URL': Invalid URL") > -1) {
            this.native.toastWarn('ErrorInfo.HIVE_ERROR_URL');
            return error;
        }

        if (message != null && (message.indexOf("Network Error") > -1 || message.indexOf("Network error") > -1)) {
            this.native.toastWarn('common.likeError');
            return error;
        }

        let errorCode = error["code"] || null;
        let errorDes = "ErrorInfo.HIVE_ERROR_" + errorCode;
        if (errorCode === 507) {
            if (this.buyStorageSpaceDialog === null) {
                await this.showBuyStorageSpaceDialog(errorDes);
            }
        } else {
            if (errorCode != null) {
                this.native.HiveErrorWarn("common.likeError1", errorCode);
            } else {
                this.native.toastWarn("common.likeError1");
            }
        }

        return error;
    }

    createFeedsScripting(lasterVersion: string, preVersion: string, registScripting: boolean = false) {
        return this.insertDataToFeedsScriptingDB(lasterVersion, preVersion, registScripting);
    }

    private updateDataToFeedsScriptingDB(lasterVersion: string, preVersion: string, registScripting: boolean = false): Promise<UpdateResult> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc =
                {
                    "laster_version": lasterVersion,
                    "pre_version": preVersion,
                    "regist_scripting": registScripting,
                }
                const option = new UpdateOptions(false, true)
                let filter = {};
                let update = { "$set": doc };

                const updateResult = await this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_FEEDS_SCRIPTING, filter, update, option);
                Logger.log(TAG, 'update feeds scripting result', updateResult)
                resolve(updateResult)
            } catch (error) {
                Logger.error(TAG, 'updateDataToFeedsScriptingDB error', error)
                reject(await this.handleError(error))
            }
        })
    }

    updateFeedsScripting(lasterVersion: string, preVersion: string, registScripting: boolean = false) {
        return this.updateDataToFeedsScriptingDB(lasterVersion, preVersion, registScripting);
    }

    private queryFeedsScriptingFromDB(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {};
                const result = this.hiveService.queryDBData(HiveVaultHelper.TABLE_FEEDS_SCRIPTING, filter);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query Feeds scripting from DB', error);
                reject(await this.handleError(error))
            }
        });
    }

    queryFeedsScripting(): Promise<any> {
        return this.queryFeedsScriptingFromDB();
    }

    /** 存储feeds 信息结束*/

    private createCollection(collectName: string): Promise<void> {
        return this.hiveService.createCollection(collectName);
    }

    createAllCollections(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const p1 = this.createCollection(HiveVaultHelper.TABLE_FEEDS_SCRIPTING)
            const p2 = this.createCollection(HiveVaultHelper.TABLE_CHANNELS);
            const p3 = this.createCollection(HiveVaultHelper.TABLE_POSTS);
            const p4 = this.createCollection(HiveVaultHelper.TABLE_SUBSCRIPTIONS);
            const p5 = this.createCollection(HiveVaultHelper.TABLE_COMMENTS);
            const p6 = this.createCollection(HiveVaultHelper.TABLE_LIKES);
            const p7 = this.createCollection(HiveVaultHelper.TABLE_BACKUP_SUBSCRIBEDCHANNEL);
            const p8 = this.createCollection(HiveVaultHelper.TABLE_PROFILE);
            const p9 = this.createCollection(HiveVaultHelper.TABLE_SUBSCRIBED_CHANNELS);
            const array = [p1, p2, p3, p4, p5, p6, p7, p8, p9] as const
            Promise.all(array).then(values => {
                resolve('true');
            }, async reason => {
                Logger.error(TAG, 'create Collections error', reason);
                reject(await this.handleError(reason))
            })
        });
    }

    deleteCollection(collectionName: string): Promise<void> {
        return this.hiveService.deleteCollection(collectionName)
    }

    deleteAllCollections(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.deleteCollection(HiveVaultHelper.TABLE_CHANNELS);
                await this.deleteCollection(HiveVaultHelper.TABLE_POSTS);
                await this.deleteCollection(HiveVaultHelper.TABLE_SUBSCRIPTIONS);
                await this.deleteCollection(HiveVaultHelper.TABLE_COMMENTS);
                await this.deleteCollection(HiveVaultHelper.TABLE_LIKES);
                await this.deleteCollection(HiveVaultHelper.TABLE_BACKUP_SUBSCRIBEDCHANNEL);
                await this.deleteCollection(HiveVaultHelper.TABLE_FEEDS_SCRIPTING);
                await this.deleteCollection(HiveVaultHelper.TABLE_PROFILE);
                await this.deleteCollection(HiveVaultHelper.TABLE_SUBSCRIBED_CHANNELS);
                resolve("true")
            } catch (error) {
                Logger.error(TAG, 'delete Collections error', error);
                if (error["code"] === 404) {
                    resolve("true")
                } else {
                    reject(await this.handleError(error))
                }
            }
        });
    }
    /** create channel start */
    private insertDataToChannelDB(channelId: string, name: string, displayName: string, intro: string, avatar: string, memo: string,
        createdAt: number, updatedAt: number, type: string, tippingAddress: string, nft: string, category: string, proof: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const doc = {
                "channel_id": channelId,
                "name": name,
                "display_name": displayName,
                "intro": intro,
                "avatar": avatar,
                "created_at": createdAt,
                "updated_at": updatedAt,
                "type": type,
                "tipping_address": tippingAddress,
                "nft": nft,
                "memo": memo,
                "category": category,
                "proof": proof
            }

            try {
                const insertResult = await this.hiveService.insertDBData(HiveVaultHelper.TABLE_CHANNELS, doc);
                Logger.log(TAG, 'Insert channel db result', insertResult)
                resolve(doc)
            } catch (error) {
                Logger.error(TAG, 'Insert channel db error', error)
                reject(await this.handleError(error))
            }
        })
    }

    private insertChannelData(channelName: string, displayName: string, intro: string, avatarAddress: string, tippingAddress: string, type: string, nft: string, memo: string, category: string, proof: string): Promise<{ [x: string]: string | number | boolean }> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;
                const createdAt = UtilService.getCurrentTimeNum();
                const updatedAt = UtilService.getCurrentTimeNum();
                const channelId = UtilService.generateChannelId(signinDid, channelName);
                let result = await this.insertDataToChannelDB(channelId.toString(), channelName, displayName, intro, avatarAddress, memo, createdAt, updatedAt, type, tippingAddress, nft, category, proof);
                if (result) {
                    const insertResult = {
                        destDid: signinDid,
                        channelId: channelId,
                        createdAt: createdAt,
                        updatedAt: updatedAt
                    }
                    resolve(insertResult);
                }
                else
                    reject('Insert channel data error');
            } catch (error) {
                Logger.error(TAG, "insertChannelData error", error);
                reject(error)
            }
        });
    }

    async createChannel(channelName: string, displayName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = '', memo: string = '', category: string = '', proof: string = '') {
        return await this.insertChannelData(channelName, displayName, intro, avatarAddress, tippingAddress, type, nft, memo, category, proof);
    }
    /** create channel end */

    /** update channel start */
    private updateDataToChannelDB(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
        newTippingAddress: string, newNft: string, updatedAt: number): Promise<UpdateResult> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc =
                {
                    "display_name": newName,
                    "intro": newIntro,
                    "avatar": newAvatar,
                    "updated_at": updatedAt,
                    "type": newType,
                    "tipping_address": newTippingAddress,
                    "nft": newNft,
                    "memo": newMemo,
                }
                const option = new UpdateOptions(false, true)
                let filter = { "channel_id": channelId };
                let update = { "$set": doc };

                const updateResult = await this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_CHANNELS, filter, update, option);
                Logger.log(TAG, 'update channel result', updateResult)
                resolve(updateResult)
            } catch (error) {
                Logger.error(TAG, 'updateDataToChannelDB error', error)
                reject(await this.handleError(error))
            }
        })
    }

    private async updateChannelData(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
        newTippingAddress: string, newNft: string) {
        const updatedAt = UtilService.getCurrentTimeNum();
        return await this.updateDataToChannelDB(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft, updatedAt);
    }

    async updateChannel(channelId: string, newName: string, newIntro: string, newAvatar: string, newType: string, newMemo: string,
        newTippingAddress: string, newNft: string) {
        return await this.updateChannelData(channelId, newName, newIntro, newAvatar, newType, newMemo, newTippingAddress, newNft);
    }
    /** update channel end */

    /** query channel info start*/
    private registerQueryChannelInfoScripting(forceCreate: boolean = false): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = { "channel_id": "$params.channel_id", "type": "public" }
                let options = { "projection": { "_id": false }, "limit": 100 }
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_CHANNELS, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(forceCreate, HiveVaultHelper.SCRIPT_QUERY_CHANNEL_INFO, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryChannelInfo error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryChannelInfo(targetDid: string, channelId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_CHANNEL_INFO, { "channel_id": channelId })
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'Call query channel info Scripting error:', error)
                reject(error)
            }
        })
    }

    queryChannelInfo(targetDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.callQueryChannelInfo(targetDid, channelId);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query channnel info error', error);
                reject(error);
            }
        });
    }
    /** query channel info end*/

    /** publish post start */
    private insertDataToPostDB(postId: string, channelId: string, type: string, tag: string, content: string, memo: string, createdAt: number, updateAt: number, status: number, proof: string = '', from: number): Promise<InsertResult> {
        return new Promise(async (resolve, reject) => {
            const doc =
            {
                "channel_id": channelId,
                "post_id": postId,
                "created_at": createdAt,
                "updated_at": updateAt,
                "content": content,
                "status": status,
                "memo": memo,
                "type": type,
                "tag": tag,
                "proof": proof,
                "from": from,
                "pin_status": FeedsData.PinStatus.NOTPINNED
            }

            try {
                const insertResult = await this.hiveService.insertDBData(HiveVaultHelper.TABLE_POSTS, doc)
                Logger.log(TAG, 'insert postData result', insertResult)
                resolve(insertResult)
            } catch (error) {
                Logger.error(TAG, 'insertDataToPostDB error', error);
                reject(await this.handleError(error))
            }
        })
    }

    private insertPostData(channelId: string, tag: string, content: string, type: string, status: number, memo: string, proof: string, from: number): Promise<{ targetDid: string, postId: string, createdAt: number, updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;

                const createdAt = UtilService.getCurrentTimeNum();
                const updatedAt = UtilService.getCurrentTimeNum();
                const postId = UtilService.generatePostId(signinDid, channelId, content);

                await this.insertDataToPostDB(postId, channelId, type, tag, content, memo, createdAt, updatedAt, status, proof, from);

                resolve({ targetDid: signinDid, postId: postId, createdAt: createdAt, updatedAt: updatedAt });
            } catch (error) {
                Logger.error(TAG, "insertPostData error", error);
                reject(error)
            }
        });
    }

    async publishPost(channelId: string, tag: string, content: string, type: string = 'public', status: number = FeedsData.PostCommentStatus.available, memo: string, proof: string, from: number = FeedsData.Device.UNKNOW): Promise<{ targetDid: string, postId: string, createdAt: number, updatedAt: number }> {
        return await this.insertPostData(channelId, tag, content, type, status, memo, proof, from);
    }
    /** publish post end */

    /** update post start */
    private updateDataToPostDB(postId: string, channelId: string, updatedAt: number, newType: string, newTag: string, newContent: string, newStatus: number = FeedsData.PostCommentStatus.edited, newMemo: string, newProof: string, pinstatus: FeedsData.PinStatus, from: number): Promise<UpdateResult> {
        return new Promise(async (resolve, reject) => {
            const doc =
            {
                "updated_at": updatedAt,
                "content": newContent,
                "status": newStatus,
                "memo": newMemo,
                "type": newType,
                "tag": newTag,
                "proof": newProof,
                "pin_status": pinstatus,
                "from": from
            }
            const option = new UpdateOptions(false, true)
            let filter = { "channel_id": channelId, "post_id": postId };
            let update = { "$set": doc };
            try {
                const updateResult = await this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_POSTS, filter, update, option);
                Logger.log(TAG, 'update post result', updateResult);
                resolve(updateResult);
            } catch (error) {
                Logger.error(TAG, 'updateDataToPostDB error', error)
                reject(await this.handleError(error))
            }
        });
    }

    private updatePostData(postId: string, channelId: string, newType: string, newTag: string, newContent: string, newStatus: number, newUpdateAt: number, newMemo: string, newProof: string, pinStatus: FeedsData.PinStatus, from: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.updateDataToPostDB(postId, channelId, newUpdateAt, newType, newTag, newContent, newStatus, newMemo, newProof, pinStatus, from)
                Logger.log(TAG, 'update post result', result)
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'updatePostData error', error)
                reject(error)
            }
        })
    }

    updatePost(postId: string, channelId: string, newType: string, newTag: string, newContent: string, newStatus: number, newUpdateAt: number, newMemo: string, newProof: string, pinStatus: FeedsData.PinStatus, from: number): Promise<any> {
        return this.updatePostData(postId, channelId, newType, newTag, newContent, newStatus, newUpdateAt, newMemo, newProof, pinStatus, from);
    }
    /** update post end */

    /** delete post , Not use now */
    private deleteDataFromPostDB(postId: string, channelId: string, updatedAt: number): Promise<{ updatedAt: number, status: number }> {
        return new Promise(async (resolve, reject) => {
            const doc =
            {
                "updated_at": updatedAt,
                "status": FeedsData.PostCommentStatus.deleted,
            }
            const option = new UpdateOptions(false, true)
            let filter = { "channel_id": channelId, "post_id": postId };
            let update = { "$set": doc };
            try {
                const result = await this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_POSTS, filter, update, option);
                Logger.log(TAG, 'Delete post result', result);
                resolve({ updatedAt: updatedAt, status: FeedsData.PostCommentStatus.deleted });
            } catch (error) {
                Logger.error(TAG, 'Delete data from postDB error', error);
                reject(await this.handleError(error))
            }
        });
    }

    /** delete post start */
    private deletePostData(postId: string, channelId: string): Promise<{ updatedAt: number, status: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const updatedAt = UtilService.getCurrentTimeNum();
                const result = await this.deleteDataFromPostDB(postId, channelId, updatedAt);
                Logger.log(TAG, 'delete post result success')
                resolve(result)
            }
            catch (error) {
                Logger.error(TAG, 'deletePostData error', error)
                reject(error)
            }
        });
    }

    deletePost(postId: string, channelId: string): Promise<{ updatedAt: number, status: number }> {
        return this.deletePostData(postId, channelId);
    }
    /** delete post end */

    /** query post data by id start*/
    private registerQueryPostByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id" }
                let options = { "projection": { "_id": false }, "limit": 100 }
                let conditionfilter1 = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let conditionfilter2 = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": "public" }
                let queryCondition1 = new QueryHasResultCondition("subscription_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter1, null)
                let queryCondition2 = new QueryHasResultCondition("post_permission", HiveVaultHelper.TABLE_POSTS, conditionfilter2, null)
                let andCondition = new AndCondition("verify_user_permission", [queryCondition1, queryCondition2])
                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_SPECIFIED_POST, findExe, andCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryPostById error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryPostById(targetDid: string, channelId: string, postId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = { "channel_id": channelId, "post_id": postId }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SPECIFIED_POST, doc)
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryPostById error:', error)
                reject(error)
            }
        });
    }

    queryPostById(targetDid: string, channelId: string, postId: string) {
        return this.callQueryPostById(targetDid, channelId, postId);
    }
    /** query post data by id end*/

    /** query post data by channel id start */
    private registerQueryPostByChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = { "channel_id": "$params.channel_id" }
                let options = { "projection": { "_id": false }, "limit": 100 }
                let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null)
                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_POST_BY_CHANNEL, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryPostByChannelId error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryPostByChannelId(targetDid: string, channelId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_POST_BY_CHANNEL, { "channel_id": channelId })
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryPostByChannelId error:', error)
                reject(error)
            }
        })
    }

    queryPostByChannelId(targetDid: string, channelId: string): Promise<any> {
        return this.callQueryPostByChannelId(targetDid, channelId);
    }
    /** query post data by channel id end */

    /** query post data range of time start */
    private registerQueryPostRangeOfTimeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter =
                    { "channel_id": "$params.channel_id", "updated_at": { $gt: "$params.start", $lt: "$params.end" } }
                let options = { "projection": { "_id": false }, "limit": 30, "sort": { "updated_at": -1 } }
                let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null)
                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_SOMETIME_POST, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryPostRangeOfTime error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryPostRangeOfTimeScripting(targetDid: string, channelId: string, start: number, end: number) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SOMETIME_POST, { "channel_id": channelId, "start": start, "end": end })
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryPostByChannelId error:', error)
                reject(error)
            }
        })
    }

    queryPostRangeOfTimeScripting(targetDid: string, channelId: string, start: number, end: number): Promise<any> {
        return this.callQueryPostRangeOfTimeScripting(targetDid, channelId, start, end);
    }
    /** query post data range of time end */

    /** subscribe channel start */
    private registerSubscribeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const type = 'public';    //Currently only public channels are found for subscription
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "type": type
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_CHANNELS, conditionfilter, null);

                let document = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                    "created_at": "$params.created_at",
                    "display_name": "$params.display_name",
                    "updated_at": "$params.updated_at",
                    "status": "$params.status"
                }
                let options = { "projectxsion": { "_id": false } };

                const executable = new InsertExecutable("database_insert", HiveVaultHelper.TABLE_SUBSCRIPTIONS, document, options);
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_SUBSCRIBE_CHANNEL, executable, condition);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerSubscribe error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callSubscribeScripting(targetDid: string, channelId: string, userDisplayName: string, status: number): Promise<{ createdAt: number, updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            const createdAt = UtilService.getCurrentTimeNum();
            const updatedAt = UtilService.getCurrentTimeNum();
            try {
                const params = {
                    "channel_id": channelId,
                    "created_at": createdAt,
                    "display_name": userDisplayName,
                    "updated_at": updatedAt,
                    "status": status
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SUBSCRIBE_CHANNEL, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'callSubscription error:', error)
                reject(error)
            }
        })
    }

    async subscribeChannel(targetDid: string, channelId: string, displayName: string, status: number): Promise<{ createdAt: number, updatedAt: number }> {
        return await this.callSubscribeScripting(targetDid, channelId, displayName, status);
    }

    registerUpdateSubscription(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const conditionfilter = {
                    "channel_id": "$params.channel_id",
                };

                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null);
                let set = {
                    "status": "$params.status",
                    "updated_at": "$params.updated_at",
                };
                const filter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                };
                let update = { "$set": set };
                let options = { "bypass_document_validation": false, "upsert": true };
                const executable = new UpdateExecutable("database_update", HiveVaultHelper.TABLE_SUBSCRIPTIONS, filter, update, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_UPDATE_SUBSCRIPTION, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerUpdateSubscription error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callUpdateSubscription(targetDid: string, channelId: string, status: number): Promise<{ updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const updatedAt = UtilService.getCurrentTimeNum();
                const params = {
                    "channel_id": channelId,
                    "updated_at": updatedAt,
                    "status": status
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_UPDATE_SUBSCRIPTION, params);
                resolve({ updatedAt: updatedAt })
            } catch (error) {
                Logger.error(TAG, 'update subscription error:', error);
                reject(error)
            }
        });
    }

    updateSubscription(targetDid: string, channelId: string, status: number): Promise<{ updatedAt: number }> {
        return this.callUpdateSubscription(targetDid, channelId, status)
    }

    /** subscribe channel end */

    /** unsubscribe channel start */
    private registerUnsubscribeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                }

                const executable = new DeleteExecutable("database_delete", HiveVaultHelper.TABLE_SUBSCRIPTIONS, filter);
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_UNSUBSCRIBE_CHANNEL, executable, null);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerUnsubscribe error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callUnsubscribeScripting(targetDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_UNSUBSCRIBE_CHANNEL, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'callSubscription error:', error)
                reject(error)
            }
        })
    }

    unsubscribeChannel(targetDid: string, channelId: string): Promise<any> {
        return this.callUnsubscribeScripting(targetDid, channelId);
    }

    /** unsubscribe channel end */

    /** query subscription info by channelId start */
    private registerQuerySubscriptionInfoByChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "status": "$params.status"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_SUBSCRIPTIONS, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, executable, null, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQuerySubscriptionInfoByChannelId error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQuerySubscriptionInfoByChannelId(targetDid: string, channelId: string, status: number = FeedsData.PostCommentStatus.available): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "status": status
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_CHANNELID, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query subscription from scripting , error:', error);
                reject(error);
            }
        });
    }

    querySubscriptionInfoByChannelId(targetDid: string, channelId: string): Promise<any> {
        return this.callQuerySubscriptionInfoByChannelId(targetDid, channelId);
    }
    /** query subscription info by channelId end */

    /** query subscription info by userDid start */
    private registerQuerySubscriptionInfoByUserDIDScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const executableFilter = {
                    "user_did": "$params.user_did"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_SUBSCRIPTIONS, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID, executable, null, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQuerySubscriptionInfoByUserDID error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQuerySubscriptionByUserDID(targetDid: string, userDid: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "user_did": userDid
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Find subscription from scripting , error:', error);
                reject(error);
            }
        });
    }

    querySubscriptionByUserDID(targetDid: string, userDid: string): Promise<any> {
        return this.callQuerySubscriptionByUserDID(targetDid, userDid);
    }
    /** query subscription info by userDid end */

    /** query subscription info by userDid and channelId start */
    private registerQuerySubscriptionInfoByUserDIDAndChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$params.user_did"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_SUBSCRIPTIONS, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID, executable, null, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQuerySubscriptionInfoByUserDID error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQuerySubscriptionByUserDIDAndChannelId(targetDid: string, userDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "user_did": userDid
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIPTION_BY_USERDID_CHANNELID, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Find subscription from scripting , error:', error);
                reject(error);
            }
        });
    }

    querySubscriptionByUserDIDAndChannelId(targetDid: string, userDid: string, channelId: string): Promise<any> {
        return this.callQuerySubscriptionByUserDIDAndChannelId(targetDid, userDid, channelId);
    }
    /** query subscription info by userDid and channelId end */

    /** query comment by postId start */
    private registerQueryCommentByPostIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executableFilter, options).setOutput(true)

                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_POSTID, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryCommentByPostId error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryCommentByPostIdScripting(targetDid: string, channelId: string, postId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_POSTID, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by post id error:', error);
                reject(error);
            }
        });
    }

    queryCommentByPostId(targetDid: string, channelId: string, postId: string): Promise<any> {
        return this.callQueryCommentByPostIdScripting(targetDid, channelId, postId);
    }
    /** query comment by postId end */

    /** query comment by id start */
    private registerFindCommentByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executableFilter, options).setOutput(true)

                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_COMMENTID, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerFindCommentById error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryCommentByID(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_COMMENTID, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by comment id error:', error);
                reject(error);
            }
        });
    }

    queryCommentByID(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callQueryCommentByID(targetDid, channelId, postId, commentId);
    }
    /** query comment by id end */

    private registerQueryCommentRangeOfTimeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter =
                    { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "updated_at": { $gt: "$params.start", $lt: "$params.end" } }
                let options = { "projection": { "_id": false }, "limit": 30, "sort": { "updated_at": -1 } }
                let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null)
                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_SOMETIME_COMMENT, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryCommentRangeOfTime error", error)
                reject(await this.handleError(error))
            }
        })
    }

    queryCommentRangeOfTimeScripting(targetDid: string, channelId: string, postId: string, start: number, end: number): Promise<any> {
        return this.callQueryCommentRangeOfTimeScripting(targetDid, channelId, postId, start, end);
    }

    private callQueryCommentRangeOfTimeScripting(targetDid: string, channelId: string, postId: string, start: number, end: number) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SOMETIME_COMMENT, { "channel_id": channelId, "post_id": postId, "start": start, "end": end })
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryCommentRangeOfTimeScripting error:', error)
                reject(error)
            }
        })
    }

    /** query comment by channel start */
    private registerQueryCommentByChannelScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "channel_id": "$params.channel_id"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executableFilter, options).setOutput(true)

                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_CHANNELID, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryCommentByChannel error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryCommentByChannel(targetDid: string, channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_COMMENT_BY_CHANNELID, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by channel id error:', error);
                reject(error);
            }
        });
    }

    queryCommentByChannel(targetDid: string, channelId: string): Promise<any> {
        return this.callQueryCommentByChannel(targetDid, channelId);
    }
    /** query comment by channel end */

    /** create comment start */
    private registerCreateCommentScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null);

                let executablefilter = {
                    "comment_id": "$params.comment_id",
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "refcomment_id": "$params.refcomment_id",
                    "content": "$params.content",
                    "status": FeedsData.PostCommentStatus.available,
                    "created_at": "$params.created_at",
                    "updated_at": "$params.created_at",
                    "creater_did": "$caller_did"
                }

                let options = {
                    "projection":
                    {
                        "_id": false
                    }
                };
                const executable = new InsertExecutable("database_update", HiveVaultHelper.TABLE_COMMENTS, executablefilter, options).setOutput(true)

                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_CREATE_COMMENT, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerCreateComment error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callCreateComment(targetDid: string, commentId: string, channelId: string, postId: string, refcommentId: string, content: string, createdAt: number) {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "comment_id": commentId,
                    "channel_id": channelId,
                    "post_id": postId,
                    "refcomment_id": refcommentId,
                    "content": content,
                    "created_at": createdAt
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_CREATE_COMMENT, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Create comment from scripting , error:', error);
                reject(error)
            }
        });
    }

    createComment(targetDid: string, channelId: string, postId: string, refcommentId: string, content: string): Promise<{ commentId: string, createrDid: string, createdAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;
                const commentId = UtilService.generateCommentId(signinDid, postId, refcommentId, content);
                const createdAt = UtilService.getCurrentTimeNum();
                const result = await this.callCreateComment(targetDid, commentId, channelId, postId, refcommentId, content, createdAt);

                resolve({ commentId: commentId, createrDid: signinDid, createdAt: createdAt });
            } catch (error) {
                reject(await this.handleError(error));
            }
        });
    }
    /** create comment end */

    /** update comment start */
    private registerUpdateCommentScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "creater_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_COMMENTS, conditionfilter, null);

                const filter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                };

                let set = {
                    "status": FeedsData.PostCommentStatus.edited,
                    "content": "$params.content",
                    "updated_at": `$params.updated_at`,
                    "creater_did": "$caller_did"
                };
                let update = { "$set": set };
                let options = { "bypass_document_validation": false, "upsert": true };

                const executable = new UpdateExecutable("database_update", HiveVaultHelper.TABLE_COMMENTS, filter, update, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_UPDATE_COMMENT, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerUpdateComment error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callUpdateComment(targetDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<{ updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const updatedAt = UtilService.getCurrentTimeNum();
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId,
                    "content": content,
                    "updated_at": updatedAt
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_UPDATE_COMMENT, params);
                resolve({ updatedAt: updatedAt });
            } catch (error) {
                Logger.error(TAG, 'Get comment from scripting by comment id error:', error);
                reject(await this.handleError(error));
            }
        });
    }

    async updateComment(targetDid: string, channelId: string, postId: string, commentId: string, content: string): Promise<{ updatedAt: number }> {
        return await this.callUpdateComment(targetDid, channelId, postId, commentId, content);
    }
    /** update comment end */

    /** delte comment start */
    private registerDeleteCommentScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "creater_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_COMMENTS, conditionfilter, null);

                const filter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                };

                let set = {
                    "status": FeedsData.PostCommentStatus.deleted,
                };
                let update = { "$set": set };
                let options = { "bypass_document_validation": false, "upsert": true };

                const executable = new UpdateExecutable("database_update", HiveVaultHelper.TABLE_COMMENTS, filter, update, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_DELETE_COMMENT, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerDeleteComment error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callDeleteComment(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_DELETE_COMMENT, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Delete comment from scripting , error:', error);
                reject(await this.handleError(error))
            }
        });
    }

    deleteComment(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callDeleteComment(targetDid, channelId, postId, commentId);
    }
    /** delte comment end */

    /** query like by id start */
    private registerQueryLikeByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "status": "$params.status"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_ID, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryLikeById error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryLikeById(targetDid: string, channelId: string, postId: string, commentId: string, status: number = FeedsData.PostCommentStatus.available): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId,
                    "status": status
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_ID, params);
                Logger.log("Query like from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query like from scripting , error:', error);
                reject(error);
            }
        });
    }

    queryLikeById(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callQueryLikeById(targetDid, channelId, postId, commentId);
    }
    /** query like by id end */


    /** query like by id and user start */
    private registerQuerySelfLikeByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "like_id": "$params.like_id",
                    "creater_did": "$caller_did",
                    "status": "$params.status"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_SELF_LIKE_BY_ID, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQuerySelfLikeById error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQuerySelfLikeById(targetDid: string, channelId: string, likeId: string, status: number = FeedsData.PostCommentStatus.available): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "like_id": likeId,
                    "status": status
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_SELF_LIKE_BY_ID, params);
                Logger.log(TAG, "Query like from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query like from scripting , error:', error);
                reject(this.handleLikeError(error));
            }
        });
    }

    querySelfLikeById(targetDid: string, channelId: string, likeId: string): Promise<any> {
        return this.callQuerySelfLikeById(targetDid, channelId, likeId);
    }
    /** query like by id and user end */

    /** query like by channel start */
    private registerQueryLikeByChannelScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "status": "$params.status"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_CHANNEL, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryLikeByChannel error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryLikeByChannel(targetDid: string, channelId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "status": FeedsData.PostCommentStatus.available
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_CHANNEL, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query like by channel from scripting , error:', error);
                reject(error);
            }
        });
    }

    queryLikeByChannel(targetDid: string, channelId: string): Promise<any> {
        return this.callQueryLikeByChannel(targetDid, channelId);
    }
    /** query like by channel end */

    /** query like by post start */
    private registerQueryLikeByPostScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "status": "$params.status"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_POST, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryLikeByPost error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryLikeByPost(targetDid: string, channelId: string, postId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "status": FeedsData.PostCommentStatus.available
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_LIKE_BY_POST, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query like by post from scripting , error:', error);
                reject(error);
            }
        });
    }

    queryLikeByPost(targetDid: string, channelId: string, postId: string): Promise<any> {
        return this.callQueryLikeByPost(targetDid, channelId, postId);
    }
    /** query like by post end */

    private registerLikeRangeOfTimeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter =
                    { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "updated_at": { $gt: "$params.start", $lt: "$params.end" } }
                let options = { "projection": { "_id": false }, "limit": 30, "sort": { "updated_at": -1 } }
                let conditionfilter = { "channel_id": "$params.channel_id", "user_did": "$caller_did" }
                let queryCondition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null)
                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_LIKES, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_SOMETIME_LIKE, findExe, queryCondition, false, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerLikeRangeOfTime error", error)
                reject(await this.handleError(error))
            }
        })
    }

    queryLikeRangeOfTimeScripting(targetDid: string, channelId: string, postId: string, start: number, end: number): Promise<any> {
        return this.callQueryLikeRangeOfTimeScripting(targetDid, channelId, postId, start, end);
    }

    private callQueryLikeRangeOfTimeScripting(targetDid: string, channelId: string, postId: string, start: number, end: number) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_SOMETIME_LIKE, { "channel_id": channelId, "post_id": postId, "start": start, "end": end })
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'callQueryLikeRangeOfTimeScripting error:', error)
                reject(error)
            }
        })
    }

    /** add like start */
    private registerCreateLikeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionfilter, null);

                let executablefilter = {
                    "like_id": "$params.like_id",
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "created_at": "$params.created_at",
                    "creater_did": "$caller_did",
                    "updated_at": "$params.updated_at",
                    "status": "$params.status"
                }

                let options = {
                    "projection":
                    {
                        "_id": false
                    }
                };
                const executable = new InsertExecutable("database_insert", HiveVaultHelper.TABLE_LIKES, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_CREATE_LIKE, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerCreateLike error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callAddLike(targetDid: string, likeId: string, channelId: string, postId: string, commentId: string): Promise<{ createdAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const createdAt = UtilService.getCurrentTimeNum();
                const params = {
                    "like_id": likeId,
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId,
                    "created_at": createdAt,
                    "updated_at": createdAt,
                    "status": FeedsData.PostCommentStatus.available
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_CREATE_LIKE, params);
                resolve({ createdAt: createdAt });
            } catch (error) {
                Logger.error(TAG, 'Add like from scripting , error:', error);
                reject(this.handleLikeError(error));
            }
        });
    }

    addLike(targetDid: string, likeId: string, channelId: string, postId: string, commentId: string): Promise<{ createdAt: number }> {
        return this.callAddLike(targetDid, likeId, channelId, postId, commentId);
    }
    /** add like end */

    /** remove like start */
    private registerRemoveLikeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionfilter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id",
                    "creater_did": "$caller_did"
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_LIKES, conditionfilter, null);

                const filter = {
                    "channel_id": "$params.channel_id",
                    "post_id": "$params.post_id",
                    "comment_id": "$params.comment_id"
                };
                const executable = new DeleteExecutable("database_delete", HiveVaultHelper.TABLE_LIKES, filter).setOutput(true);
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_REMOVE_LIKE, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerRemoveLike error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callRemoveLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "post_id": postId,
                    "comment_id": commentId
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_REMOVE_LIKE, params);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Remove like from scripting , error:', error);
                reject(error);
            }
        });
    }

    removeLike(targetDid: string, channelId: string, postId: string, commentId: string): Promise<any> {
        return this.callRemoveLike(targetDid, channelId, postId, commentId);
    }
    /** remove like end */

    /** update like start */
    registerUpdateLike(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const conditionfilter = {
                    "like_id": "$params.like_id",
                    "creater_did": "$caller_did",
                };

                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_LIKES, conditionfilter, null);
                let set = {
                    "status": "$params.status",
                    "updated_at": "$params.updated_at",
                };
                const filter = {
                    "like_id": "$params.like_id",
                };
                let update = { "$set": set };
                let options = { "bypass_document_validation": false, "upsert": true };
                const executable = new UpdateExecutable("database_update", HiveVaultHelper.TABLE_LIKES, filter, update, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_UPDATE_LIKE, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerUpdateLike error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callUpdateLike(targetDid: string, likeId: string, status: FeedsData.PostCommentStatus): Promise<{ updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const updatedAt = UtilService.getCurrentTimeNum();
                const params = {
                    "updated_at": updatedAt,
                    "like_id": likeId,
                    "status": status
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_UPDATE_LIKE, params);
                resolve({ updatedAt: updatedAt });
            } catch (error) {
                Logger.error(TAG, 'update subscription error:', error);
                reject(this.handleLikeError(error));
            }
        });
    }

    updateLike(targetDid: string, likeId: string, status: FeedsData.PostCommentStatus): Promise<{ updatedAt: number }> {
        return this.callUpdateLike(targetDid, likeId, status)
    }
    /** update like end */

    parseDidDocumentAvatar(userDid: string) {
        return this.hiveService.parseUserDIDDocumentForUserAvatar(userDid);
    }

    /** download essential avatar start */
    private downloadEssAvatarData(avatarParam: string, avatarScriptName: string, targetDid: string, tarAppDID: string): Promise<string> {

        return new Promise(async (resolve, reject) => {
            try {
                let hiveUrl = "hive://" + avatarParam;
                const result = await this.hiveService.downloadFileByHiveUrl(hiveUrl, targetDid);
                if (!result) {
                    resolve(null);
                    return;
                }

                const rawImage = await rawImageToBase64DataUrl(result);
                resolve(rawImage);
            }
            catch (error) {
                Logger.error(TAG, "Download Ess Avatar error: ", error);
                reject(error)
            }
        });
    }

    downloadEssAvatar(avatarParam: string, avatarScriptName: string, tarDID: string, tarAppDID: string): Promise<string> {
        return this.downloadEssAvatarData(avatarParam, avatarScriptName, tarDID, tarAppDID);
    }
    /** download essential avatar end */

    /** download avatar from hiveurl start */
    private downloadAvatarDataFromHiveUrl(hiveUrl: string, targetDid: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.hiveService.downloadFileByHiveUrl(hiveUrl, targetDid);
                if (!result) {
                    resolve(null);
                    return;
                }

                const rawImage = await rawImageToBase64DataUrl(result);
                resolve(rawImage);
            }
            catch (error) {
                Logger.error(TAG, "Download Ess Avatar error: ", error);
                reject(await this.handleError(error))
            }
        });
    }

    downloadAvatarFromHiveUrl(hiveUrl: string, targetDid: string): Promise<string> {
        return this.downloadAvatarDataFromHiveUrl(hiveUrl, targetDid);
    }
    /** download avatar from hiveurl end */

    uploadMediaDataWithString(data: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const hash = SparkMD5.hash(data);

                const remoteName = 'feeds/data/' + hash;
                await this.hiveService.uploadScriptWithString(remoteName, data);
                const scriptName = hash
                await this.registerFileDownloadScripting(scriptName);
                let avatarHiveURL = scriptName + "@" + remoteName //
                Logger.log(TAG, "Generated avatar url:", avatarHiveURL);
                resolve(avatarHiveURL);
            } catch (error) {
                reject(await this.handleError(error))
            }
        });
    }

    uploadMediaDataWithBuffer(bufferData: Buffer): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const dataBase64 = bufferData.toString()
                const hash = SparkMD5.hash(dataBase64);
                const remoteName = 'feeds/data/' + hash;
                await this.hiveService.uploadScriptWithBuffer(remoteName, bufferData);
                const scriptName = hash
                await this.registerFileDownloadScripting(scriptName);
                let avatarHiveURL = scriptName + "@" + remoteName //
                Logger.log(TAG, "Generated avatar url:", avatarHiveURL);
                resolve(avatarHiveURL)
            } catch (error) {
                reject(await this.handleError(error))
            }
        });
    }

    uploadDataWithScriptName(remotePath: string, data: string, callback: (process: number) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const scriptName = SparkMD5.hash(data);
                await this.hiveService.uploadFileWithScriptName(remotePath, data, callback, scriptName);
                resolve(scriptName);
            } catch (error) {
                reject(error);
            }
        });
    }

    downloadFile(remotePath: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.hiveService.downloadFile(remotePath)
                resolve(result)
            } catch (error) {
                Logger.error(TAG, "downloadFile error:", error);
                reject(await this.handleError(error))
            }
        });
    }

    /** helper */
    private registerFileDownloadScripting(scriptName: string): Promise<void> {
        const executable = new FileDownloadExecutable(scriptName).setOutput(true);
        return this.hiveService.registerScript(false, scriptName, executable, null, false);
    }

    downloadScripting(targetDid: string, avatarHiveURL: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!avatarHiveURL || avatarHiveURL == '') {
                    const errorMsg = 'Input param null';
                    Logger.warn(TAG, errorMsg);
                    reject(errorMsg);
                    return;
                }
                const transaction_id = await this.downloadScriptingTransactionID(targetDid, avatarHiveURL);
                if (!transaction_id || transaction_id == '') {
                    const errorMsg = 'Download transactionId null';
                    Logger.warn(TAG, errorMsg);
                    reject(errorMsg);
                    return;
                }
                const data = await this.downloadScriptingDataWithString(targetDid, transaction_id);
                // const rawImage = await rawImageToBase64DataUrl(dataBuffer)

                resolve(data);
            } catch (error) {
                Logger.error(TAG, 'download file from scripting error', error);
                reject(await this.handleError(error))
            }
        });
    }

    // avatarHiveURL = scriptName@remoteName
    private downloadScriptingTransactionID(targetDid: string, avatarHiveURL: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {

                if (!avatarHiveURL || !avatarHiveURL.includes('@')) {
                    // reject('Input avatar url is null');
                    resolve('');
                    return;
                }

                const params = avatarHiveURL.split("@")
                const scriptName = params[0]
                const remoteName = params[1]

                const result = await this.callScript(targetDid, scriptName, { "path": remoteName })
                const transaction_id = result[scriptName]["transaction_id"]
                resolve(transaction_id);
            } catch (error) {
                reject(error)
            }
        });
    }

    private async downloadScriptingDataWithString(targetDid: string, transactionID: string) {
        try {
            let dataBuffer = await this.hiveService.downloadScripting(targetDid, transactionID)
            let jsonString = dataBuffer.toString();
            return jsonString
        } catch (error) {
            throw error
        }
    }

    private async downloadScriptingDataWithBuffer(targetDid: string, transactionID: string) {
        let dataBuffer = await this.hiveService.downloadScripting(targetDid, transactionID)
        // let jsonString = dataBuffer.toString();
        return dataBuffer
    }

    private callScript(targetDid: string, scriptName: string, params: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const appid = Config.APPLICATION_DID;
                Logger.log(TAG, 'Call script params is targetDid:', targetDid, 'scriptName:', scriptName, 'params:', params);
                let userDid = (await this.dataHelper.getSigninData()).did;
                let result = await this.hiveService.callScript(scriptName, params, targetDid, appid, userDid);
                Logger.log('Call script result is', result);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    /** query self channels start */
    private queryChannelsFromDB(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {};
                const result = await this.hiveService.queryDBData(HiveVaultHelper.TABLE_CHANNELS, filter);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query channels from DB', error);
                reject(await this.handleError(error))
            }
        });
    }

    querySelfChannels(): Promise<any> {
        return this.queryChannelsFromDB();
    }
    /** query self channels end */

    /** query slef post start */
    private queryPostsFromDB(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = {};
                const result = await this.hiveService.queryDBData(HiveVaultHelper.TABLE_POSTS, filter);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query post from DB', error);
                reject(await this.handleError(error))
            }
        });
    }

    querySelfPosts(): Promise<any> {
        return this.queryPostsFromDB();
    }
    /** query slef post end */

    /** query slef post by channel start */
    private queryPostsByChannelFromDB(channelId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const filter = { 'channel_id': channelId };
                const result = await this.hiveService.queryDBData(HiveVaultHelper.TABLE_POSTS, filter);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query post by channel from DB', error);
                reject(await this.handleError(error))
            }
        });
    }

    querySelfPostsByChannel(channelId: string): Promise<any> {
        return this.queryPostsByChannelFromDB(channelId);
    }
    /** query slef post by channel end */


    /** query user displayName start */
    private registerQueryDisplayNameScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                // let conditionFilter = {
                //     "channel_id": "$params.channel_id",
                //     "user_did": "$caller_did"
                // };
                // const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$params.user_did"
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_SUBSCRIPTIONS, executableFilter, options).setOutput(true)
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_USER_DISPLAYNAME, executable, null, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryDisplayName error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryUserDisplayName(targetDid: string, channelId: string, userDid: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "channel_id": channelId,
                    "user_did": userDid
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_USER_DISPLAYNAME, params);
                Logger.log("Query user display name from scripting , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query user display name from scripting , error:', error);
                reject(error);
            }
        });
    }

    queryUserDisplayName(targetDid: string, channelId: string, userDid: string): Promise<any> {
        return this.callQueryUserDisplayName(targetDid, channelId, userDid);
    }
    /** query displayName end */

    prepareConnection(forceCreate: boolean): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.registerQueryChannelInfoScripting(forceCreate)
                resolve('FINISH')
            } catch (error) {
                Logger.error(TAG, 'Prepare Connection error', error);
                reject(error)
            }
        });
    }

    /** backup subscribed_channel start */
    private insertDataToBackupSCDB(targetDid: string, channelId: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const doc = {
                "target_did": targetDid,
                "channel_id": channelId
            }

            try {
                const insertResult = this.hiveService.insertDBData(HiveVaultHelper.TABLE_BACKUP_SUBSCRIBEDCHANNEL, doc);
                Logger.log(TAG, 'Insert bsc db result', insertResult);
                resolve('FINISH');
            } catch (error) {
                Logger.error(TAG, 'Insert bsc db error', error);
                reject(await this.handleError(error))
            }
        })
    }

    backupSubscribedChannel(targetDid: string, channelId: string): Promise<string> {
        return this.insertDataToBackupSCDB(targetDid, channelId);
    }
    /** backup subscribed_channel end */

    /** remove subscribed_channel start */
    private removeDataFromBackupSCDB(targetDid: string, channelId: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const doc = {
                "target_did": targetDid,
                "channel_id": channelId
            };

            try {
                const result = this.hiveService.deleateOneDBData(HiveVaultHelper.TABLE_BACKUP_SUBSCRIBEDCHANNEL, doc);
                Logger.log(TAG, 'Remove bsc db result', result);
                resolve('FINISH');
            } catch (error) {
                Logger.error(TAG, 'Remove bsc db error', error);
                reject(await this.handleError(error))
            }
        })
    }

    removeBackupData(targetDid: string, channelId: string): Promise<string> {
        return this.removeDataFromBackupSCDB(targetDid, channelId);
    }
    /** remove subscribed_channel end */


    /** query subscribed_channel start */
    private queryDataFromBackupSCDB(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = this.hiveService.queryDBData(HiveVaultHelper.TABLE_BACKUP_SUBSCRIBEDCHANNEL, {});
                Logger.log(TAG, 'Query bsc db result', result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query bsc db error', error);
                reject(await this.handleError(error))
            }
        })
    }

    queryBackupData(): Promise<any> {
        return this.queryDataFromBackupSCDB();
    }
    /** remove subscribed_channel end */

    /** query subscription info by channelId start */
    private registerQueryCommentsFromPostsScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let conditionFilter = {
                    "channel_id": "$params.channel_id",
                    "user_did": "$caller_did",
                };
                const condition = new QueryHasResultCondition("verify_user_permission", HiveVaultHelper.TABLE_SUBSCRIPTIONS, conditionFilter, null);

                const executableFilter = {
                    "post_id": { "$in": "$params.post_ids" }
                };

                let options = { "projection": { "_id": false }, "limit": 100 };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_COMMENTS, executableFilter, options).setOutput(true);
                await this.hiveService.registerScript(false, HiveVaultHelper.SCRIPT_QUERY_COMMENT_FROM_POSTS, executable, condition, false);
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryCommentsFromPosts error", error)
                reject(await this.handleError(error))
            }
        });
    }

    private callQueryCommentsFromPosts(targetDid: string, postIds: string[]): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const params = {
                    "post_ids": postIds
                }
                const result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_COMMENT_FROM_POSTS, params);
                Logger.log("Query comments counts from posts , result is", result);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Query comments from posts, error:', error);
                reject(error);
            }
        });
    }

    queryCommentsFromPosts(targetDid: string, postIds: string[]): Promise<any> {
        return this.callQueryCommentsFromPosts(targetDid, postIds);
    }

    /** query public post data by id start*/
    private registerQueryPublicPostByIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const postType = 'public';
                let postCondition = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": postType };
                let queryCondition = new QueryHasResultCondition("post_permission", HiveVaultHelper.TABLE_POSTS, postCondition, null);

                let executablefilter = { "channel_id": "$params.channel_id", "post_id": "$params.post_id", "type": postType };
                let options = { "projection": { "_id": false }, "limit": 100 };

                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true);
                await this.hiveService.registerScript(false, HiveVaultHelper.QUERY_PUBLIC_SPECIFIED_POST, findExe, queryCondition, false, false);
                resolve("SUCCESS");
            } catch (error) {
                Logger.error(TAG, 'Register query public post by id error', error);
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryPublicPostById(targetDid: string, channelId: string, postId: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = { "channel_id": channelId, "post_id": postId };
                const result = await this.callScript(targetDid, HiveVaultHelper.QUERY_PUBLIC_SPECIFIED_POST, doc);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'callQueryPostById error:', error);
                reject(error);
            }
        });
    }

    queryPublicPostById(targetDid: string, channelId: string, postId: string): Promise<any> {
        return this.callQueryPublicPostById(targetDid, channelId, postId);
    }
    /** query public post data by id end*/

    /** query public post data by channel id start */
    private registerQueryPublicPostByChannelIdScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const channelType = 'public';
                const postType = 'public';
                let conditionfilter = { "channel_id": "$params.channel_id", "type": channelType };
                let queryCondition = new QueryHasResultCondition("channel_permission", HiveVaultHelper.TABLE_CHANNELS, conditionfilter, null);

                let executablefilter = { "channel_id": "$params.channel_id", "type": postType };
                let options = { "projection": { "_id": false }, "limit": 100 };

                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true);
                await this.hiveService.registerScript(false, HiveVaultHelper.QUERY_PUBLIC_POST_BY_CHANNEL, findExe, queryCondition, false, false);
                resolve("SUCCESS");
            } catch (error) {
                Logger.error(TAG, 'Register query public post by channel error', error);
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryPublicPostByChannelId(targetDid: string, channelId: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.QUERY_PUBLIC_POST_BY_CHANNEL, { "channel_id": channelId });
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Call query public post by channel error:', error);
                reject(error);
            }
        })
    }

    queryPublicPostByChannelId(targetDid: string, channelId: string): Promise<any> {
        return this.callQueryPublicPostByChannelId(targetDid, channelId);
    }
    /** query public post data by channel id end */

    /** query public post data range of time start */
    private registerQueryPublicPostRangeOfTimeScripting(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const channelType = 'public';
                const postType = 'public';
                let conditionfilter = { "channel_id": "$params.channel_id", "type": channelType };
                let queryCondition = new QueryHasResultCondition("channel_permission", HiveVaultHelper.TABLE_CHANNELS, conditionfilter, null);

                let executablefilter = { "channel_id": "$params.channel_id", "updated_at": { $gt: "$params.start", $lt: "$params.end" }, "type": postType };
                let options = { "projection": { "_id": false }, "limit": 30, "sort": { "updated_at": -1 } };

                let findExe = new FindExecutable("find_message", HiveVaultHelper.TABLE_POSTS, executablefilter, options).setOutput(true);
                await this.hiveService.registerScript(false, HiveVaultHelper.QUERY_PUBLIC_SOMETIME_POST, findExe, queryCondition, false, false);
                resolve("SUCCESS");
            } catch (error) {
                Logger.error(TAG, "registerQueryPublicPostRangeOfTime error", error);
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryPublicPostRangeOfTime(targetDid: string, channelId: string, start: number, end: number) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.QUERY_PUBLIC_SOMETIME_POST, { "channel_id": channelId, "start": start, "end": end });
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Call query post by channel and range of time error:', error);
                reject(error);
            }
        })
    }

    queryPublicPostRangeOfTime(targetDid: string, channelId: string, start: number, end: number): Promise<any> {
        return this.callQueryPublicPostRangeOfTime(targetDid, channelId, start, end);
    }
    /** query public post data range of time end */

    async showBuyStorageSpaceDialog(message: string) {

        this.buyStorageSpaceDialog = await this.popupProvider.ionicAlert(
            this,
            'buyStorageSpaceDialog.title',
            message,
            this.cancelBuyStorageSpace,
            'hiveStrong.svg',
        );
    }


    cancelBuyStorageSpace(that: any) {
        if (that.buyStorageSpaceDialog != null) {
            that.buyStorageSpaceDialog.dismiss();
            that.buyStorageSpaceDialog = null;
        }
    }

    deleteSelfProfile() {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;
                const filter = {
                    "did": signinDid
                }
                const deleteResult = await this.hiveService.deleateOneDBData(HiveVaultHelper.TABLE_PROFILE, filter);
                Logger.log(TAG, 'Delete profile db result', deleteResult);
                resolve('FINISH')
            } catch (error) {
                Logger.error(TAG, 'Delete profile db error', error)
                reject(await this.handleError(error))
            }
        })
    }

    /** create profile start */
    private insertSelfProfileToProfileDB(did: string, name: string, description: string, avatar: string, updatedAt: number): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const doc = {
                "did": did,
                "name": name,
                "description": description,
                "avatar_url": avatar,
                "updated_at": updatedAt,
            }

            try {
                const insertResult = await this.hiveService.insertDBData(HiveVaultHelper.TABLE_PROFILE, doc);
                Logger.log(TAG, 'Insert profile db result', insertResult)
                resolve(doc)
            } catch (error) {
                Logger.error(TAG, 'Insert profile db error', error)
                reject(await this.handleError(error))
            }
        })
    }

    private insertSelfProfileData(name: string, description: string, avatarAddress: string): Promise<{ did: string, name: string, description: string, avatar: string, updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;
                const updatedAt = UtilService.getCurrentTimeNum();
                let result = await this.insertSelfProfileToProfileDB(signinDid, name, description, avatarAddress, updatedAt);
                if (result) {
                    const insertResult = {
                        did: signinDid,
                        name: name,
                        description: description,
                        avatar: avatarAddress,
                        updatedAt: updatedAt
                    }
                    resolve(insertResult);
                }
                else
                    reject('Insert profile data error');
            } catch (error) {
                Logger.error(TAG, "Insert profile error", error);
                reject(error)
            }
        });
    }

    uploadProfile(name: string, description: string, avatarAddress: string): Promise<{ did: string, name: string, description: string, avatar: string, updatedAt: number }> {
        return this.insertSelfProfileData(name, description, avatarAddress);
    }
    /** create profile end */

    /** update profile start */
    private updateDataToProfileDB(did: string, name: string, description: string, avatarHiveUrl: string, updatedAt: number, credentials: string): Promise<UpdateResult> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc =
                {
                    "did": did,
                    "name": name,
                    "description": description,
                    "avatar_url": avatarHiveUrl,
                    "updated_at": updatedAt,
                    "credentials": credentials
                }
                const option = new UpdateOptions(false, true)
                let filter = { "did": did };
                let update = { "$set": doc };

                const updateResult = await this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_PROFILE, filter, update, option);
                Logger.log(TAG, 'update profile to db result', updateResult)
                resolve(updateResult)
            } catch (error) {
                Logger.error(TAG, 'update profile to db error', error)
                reject(await this.handleError(error))
            }
        })
    }

    private async updateProfileData(name: string, description: string, avatarHiveUrl: string, credentials: string): Promise<{ updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const signinDid = (await this.dataHelper.getSigninData()).did;
                const updatedAt = UtilService.getCurrentTimeNum();
                const result = await this.updateDataToProfileDB(signinDid, name, description, avatarHiveUrl, updatedAt, credentials);
                if (!result) {
                    const errorMsg = 'Update profile result null';
                    Logger.error(TAG, errorMsg);
                    reject(errorMsg)
                }
                resolve({ updatedAt: updatedAt });
            } catch (error) {
                Logger.error(TAG, 'Update profile error', error)
                reject(error);
            }
        });

    }

    updateProfile(name: string, description: string, avatarHiveUrl: string, credentials: string) {
        return this.updateProfileData(name, description, avatarHiveUrl, credentials);
    }
    /** update profile end */

    /** query profile start*/
    private registerQueryProfileScripting(forceCreate: boolean = false): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = { "did": "$params.did" };
                let options = { "projection": { "_id": false } };
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_PROFILE, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(forceCreate, HiveVaultHelper.SCRIPT_QUERY_PROFILE, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "registerQueryChannelInfo error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private callQueryProfile(targetDid: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_PROFILE, { "did": targetDid })
                resolve(result)
            } catch (error) {
                // Logger.error(TAG, 'Call query profile Scripting error:', error)
                reject(error)
            }
        })
    }

    queryProfile(targetDid: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.callQueryProfile(targetDid);
                resolve(result);
            } catch (error) {
                // Logger.error(TAG, 'Query profile error', error);
                reject(error);
            }
        });
    }
    /** query profile info end*/

    /** delete File start*/
    deleteFile(remotePath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.hiveService.deleteFile(remotePath);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'Delete file error', error);
                reject(error);
            }
        });
    }
    /** delete File end*/

    // /** query public channel start*/
    // private registerQueryPublicChannelScripting(forceCreate: boolean = false): Promise<string> {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             const channelType='public';
    //             let executablefilter = { "type": "public" }
    //             let options = { "projection": { "_id": false }, "limit": 100 }
    //             const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_CHANNELS, executablefilter, options).setOutput(true)
    //             await this.hiveService.registerScript(forceCreate, HiveVaultHelper.SCRIPT_QUERY_CHANNEL_INFO, executable, null, false)
    //             resolve("SUCCESS")
    //         } catch (error) {
    //             Logger.error(TAG, "registerQueryChannelInfo error", error)
    //             reject(await this.handleError(error))
    //         }
    //     })
    // }

    // private callQueryChannelInfo(targetDid: string, channelId: string) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_CHANNEL_INFO, { "channel_id": channelId })
    //             resolve(result)
    //         } catch (error) {
    //             Logger.error(TAG, 'Call query channel info Scripting error:', error)
    //             reject(error)
    //         }
    //     })
    // }

    // queryChannelInfo(targetDid: string, channelId: string): Promise<any> {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             const result = await this.callQueryChannelInfo(targetDid, channelId);
    //             resolve(result);
    //         } catch (error) {
    //             Logger.error(TAG, 'Query channnel info error', error);
    //             reject(error);
    //         }
    //     });
    // }
    // queryPublicChannelByUser() {

    // }

    /** query owned channels by targetDid start*/
    private registerQueryOwnedChannelsScripting(forceCreate: boolean = false): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const channelType = 'public';
                let executablefilter = { "type": channelType }
                let options = {
                    "projection": { "_id": false },
                    "sort": { "updated_at": -1 }
                }
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_CHANNELS, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(forceCreate, HiveVaultHelper.SCRIPTV1_QUERY_OWNEDCHANNELS, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "Register query owned channels scripting error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private queryOwnedChannels(targetDid: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPTV1_QUERY_OWNEDCHANNELS, {})
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'Call query owned channels error:', error)
                reject(error)
            }
        })
    }

    queryOwnedChannelsByTargetDid(targetDid: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.queryOwnedChannels(targetDid);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'query owned channels error', error);
                reject(error);
            }
        });
    }
    /** query owned channels by targetDid end*/

    /** insert subscribed channel start */
    private insertDataToSubscribedChannelDB(targetDid: string, channelId: string, subscribedAt: number, updatedAt: number, channelName: string, channelDisplayName: string,
        channelIntro: string, channelAvatar: string, channelType: string, channelCategory: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const doc = {
                "target_did": targetDid,
                "channel_id": channelId,
                "subscribed_at": subscribedAt,
                "updated_at": updatedAt,

                "channel_name": channelName,
                "channel_display_name": channelDisplayName,
                "channel_intro": channelIntro,
                "channel_avatar": channelAvatar,
                "channel_type": channelType,
                "channel_category": channelCategory,
            }

            try {
                const insertResult = this.hiveService.insertDBData(HiveVaultHelper.TABLE_SUBSCRIBED_CHANNELS, doc);
                Logger.log(TAG, 'Insert data to subscribed channel db result', insertResult);
                resolve('FINISH');
            } catch (error) {
                Logger.error(TAG, 'Insert data to subscribed channel db error', error);
                reject(await this.handleError(error))
            }
        })
    }

    insertSubscribedChannel(targetDid: string, channelId: string, channelName: string, channelDisplayName: string,
        channelIntro: string, channelAvatar: string, channelType: string, channelCategory: string, subscribedAt: number, updatedAt: number): Promise<string> {
        return this.insertDataToSubscribedChannelDB(targetDid, channelId, subscribedAt, updatedAt, channelName, channelDisplayName,
            channelIntro, channelAvatar, channelType, channelCategory);
    }
    /** insert subscribed channel end */

    /** update subscribed channel start */
    private updateSubscribedChannelDB(targetDid: string, channelId: string, subscribedAt: number, updatedAt: number, channelName: string, channelDisplayName: string,
        channelIntro: string, channelAvatar: string, channelType: string, channelCategory: string): Promise<UpdateResult> {
        return new Promise(async (resolve, reject) => {
            try {
                const doc =
                {
                    "target_did": targetDid,
                    "channel_id": channelId,
                    "subscribed_at": subscribedAt,
                    "updated_at": updatedAt,

                    "channel_name": channelName,
                    "channel_display_name": channelDisplayName,
                    "channel_intro": channelIntro,
                    "channel_avatar": channelAvatar,
                    "channel_type": channelType,
                    "channel_category": channelCategory,
                }
                const option = new UpdateOptions(false, true)
                let filter = { "target_did": targetDid, "channel_id": channelId };
                let update = { "$set": doc };

                const updateResult = await this.hiveService.updateOneDBData(HiveVaultHelper.TABLE_SUBSCRIBED_CHANNELS, filter, update, option);
                Logger.log(TAG, 'Update subscribed channel db result', updateResult)
                resolve(updateResult)
            } catch (error) {
                Logger.error(TAG, 'Update subscribed channel db error', error)
                reject(await this.handleError(error))
            }
        })
    }

    private async updateSubscribedChannelData(targetDid: string, channelId: string, subscribedAt: number, channelName: string, channelDisplayName: string,
        channelIntro: string, channelAvatar: string, channelType: string, channelCategory: string): Promise<{ updatedAt: number }> {
        return new Promise(async (resolve, reject) => {
            try {
                const updatedAt = UtilService.getCurrentTimeNum();
                const result = await this.updateSubscribedChannelDB(targetDid, channelId, subscribedAt, updatedAt, channelName, channelDisplayName,
                    channelIntro, channelAvatar, channelType, channelCategory);
                if (!result) {
                    const errorMsg = 'Update profile result null';
                    Logger.error(TAG, errorMsg);
                    reject(errorMsg)
                }
                resolve({ updatedAt: updatedAt });
            } catch (error) {
                Logger.error(TAG, 'Update profile error', error)
                reject(error);
            }
        });

    }

    updateSubscribedChannel(targetDid: string, channelId: string, subscribedAt: number, channelName: string, channelDisplayName: string,
        channelIntro: string, channelAvatar: string, channelType: string, channelCategory: string) {
        return this.updateSubscribedChannelData(targetDid, channelId, subscribedAt, channelName, channelDisplayName,
            channelIntro, channelAvatar, channelType, channelCategory);
    }
    /** update subscribed channel end */

    /** remove subscribed channel start */
    private removeSubscribedChannelDB(targetDid: string, channelId: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const filter = {
                "target_did": targetDid,
                "channel_id": channelId
            };

            try {
                const result = this.hiveService.deleateOneDBData(HiveVaultHelper.TABLE_SUBSCRIBED_CHANNELS, filter);
                Logger.log(TAG, 'Remove subscribed channel db result', result);
                resolve('FINISH');
            } catch (error) {
                Logger.error(TAG, 'Remove subscribed channel db error', error);
                reject(await this.handleError(error))
            }
        })
    }

    removeSubscribedChannelById(targetDid: string, channelId: string): Promise<string> {
        return this.removeSubscribedChannelDB(targetDid, channelId);
    }
    /** remove subscribed channel end */

    /** query subscribed channels by targetDid start*/
    private registerQuerySubscribedChannelsScripting(forceCreate: boolean = false): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                let executablefilter = {}
                let options = {
                    "projection": { "_id": false },
                    "sort": { "updated_at": -1 }
                }
                const executable = new FindExecutable("find_message", HiveVaultHelper.TABLE_SUBSCRIBED_CHANNELS, executablefilter, options).setOutput(true)
                await this.hiveService.registerScript(forceCreate, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIBED_CHANNELS, executable, null, false)
                resolve("SUCCESS")
            } catch (error) {
                Logger.error(TAG, "Register query subscribed channels scripting error", error)
                reject(await this.handleError(error))
            }
        })
    }

    private querySubscribedChannels(targetDid: string) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.callScript(targetDid, HiveVaultHelper.SCRIPT_QUERY_SUBSCRIBED_CHANNELS, {})
                resolve(result)
            } catch (error) {
                Logger.error(TAG, 'Call query subscribed channels error:', error)
                reject(error)
            }
        })
    }

    querySubscribedChannelsByOwnerDid(ownerDid: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.querySubscribedChannels(ownerDid);
                resolve(result);
            } catch (error) {
                Logger.error(TAG, 'query subscribed channels error', error);
                reject(error);
            }
        });
    }
    /** query owned channels by targetDid end*/
}
