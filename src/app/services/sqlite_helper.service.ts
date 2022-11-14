import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Logger } from './logger';
import _ from 'lodash';
import { Config } from './config';
import { StorageService } from './StorageService';

const TAG: string = 'sqlite-helper';

@Injectable()
export class FeedsSqliteHelper {
  private readonly TABLE_POST: string = 'posts';
  private readonly TABLE_CHANNEL: string = 'channel';
  private readonly TABLE_COMMENT: string = 'comment';
  private readonly TABLE_LIKE: string = 'like';
  private readonly TABLE_SUBSCRIPTION_CHANNEL: string = 'subscriptionchannel';
  private readonly TABLE_SUBSCRIPTION: string = 'subscription';
  private readonly TABLE_CHANNEL_NEW: string = 'channelnew';
  private readonly TABLE_POST_NEW: string = 'postsnew';
  private readonly TABLE_POST_NEW330: string = 'postsnew330';
  private readonly TABLE_USER: string = 'users';
  // private readonly TABLE_PINPOST: string = 'pinpost';

  private readonly TABLE_SUBSCRIBED_CHANNELS: string = 'subscribed_channels';

  public isOpen: boolean = false;
  private limitNum: number = 30;

  // private sqliteObject: SQLiteObject = null;
  private sqliteMap: { [did: string]: SQLiteObject } = {};
  constructor(
    private sqlite: SQLite,
    private storageService: StorageService) { }

  private createSqlite(dbUserDid: string): Promise<SQLiteObject> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbName = dbUserDid + '_feedsdata.db';
        const sqliteObject = await this.sqlite.create({
          name: dbName,
          location: 'default'
        });
        Logger.log(TAG, 'Create sql', sqliteObject);
        resolve(sqliteObject);
      } catch (error) {
        Logger.error(TAG, 'Create sqlite obj error', error);
        reject(error);
      }
    });
  }

  private getSqliteObj(dbUserDid: string): Promise<SQLiteObject> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.sqliteMap)
          this.sqliteMap = {};

        if (!this.sqliteMap[dbUserDid])
          this.sqliteMap[dbUserDid] = await this.createSqlite(dbUserDid);

        resolve(this.sqliteMap[dbUserDid]);
      } catch (error) {
        Logger.error(TAG, 'Get sqlite obj error', error);
        reject(error);
      }
    });
  }

  private executeSql(dbUserDid: string, statement: string, params?: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let db: SQLiteObject = null;
      try {
        Logger.log(TAG, 'Exec sql statement is ', statement);
        Logger.log(TAG, 'Exec sql params is ', params);
        db = await this.getSqliteObj(dbUserDid);

        if (this.isOpen == false) {
          await db.open();
          this.isOpen = true;
        }
        const result = await db.executeSql(statement, params);

        Logger.log(TAG, 'Exec sql result is ', result);

        if (result) {
          resolve(result);
        } else {
          Logger.error(TAG, 'Excutesql error, result is', result);
          reject('Excutesql error, result is' + result);
        }
      } catch (error) {
        try {
          if (error.message.includes("UNIQUE")) {
            Logger.log(error.message);
            resolve(null);
          } else {
            Logger.error(TAG, 'Excutesql error', error);
            reject(error);
          }
        } catch (error) {
          Logger.error(TAG, 'Excutesql error', error);
          reject(error);
        }

      } finally {
        // try {
        //   if (db) {
        //     await db.close();
        //   }
        // } catch (error) {
        // }
      }
    });
  }

  createTables(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const p1 = this.createPostTable(dbUserDid);
        const p2 = this.createChannelTable(dbUserDid);
        const p3 = this.createBackupSubscribedChannelTable(dbUserDid);
        const p4 = this.createSubscriptionTable(dbUserDid);
        const p5 = this.createCommentTable(dbUserDid);
        const p6 = this.createLikeTable(dbUserDid);
        // const p7 = this.createPinPostTable(dbUserDid);
        const p7 = this.createUserTable(dbUserDid);
        const p8 = this.createSubscribedChannelTable(dbUserDid);
        Promise.all(
          [p1, p2, p3, p4, p5, p6, p7, p8]
        );

        this.storageService.set(FeedsData.PersistenceKey.sqlversion, Config.SQL_VERSION);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create table error', error);
        reject(error);
      }
    });
  }

  // Post
  private createPostTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_POST_NEW330
          + '('
          + 'post_id VARCHAR(64) UNIQUE, dest_did VARCHAR(64), channel_id VARCHAR(64), created_at REAL(64), updated_at REAL(64),'
          + 'content TEXT, status INTEGER, type VARCHAR(64), tag VARCHAR(64), proof VARCHAR(64), memo TEXT, pin_status INTEGER, device INTEGER'
          + ')';

        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'crete post table result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create post table error', error);
        reject(error);
      }
    });
  }

  queryPostData(dbUserDid: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST_NEW330;
        const result = await this.executeSql(dbUserDid, statement);
        // const pinpostList = await this.queryPinPostList(dbUserDid);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post data error', error);
        reject(error);
      }
    });
  }

  queryOriginPostData(dbUserDid: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST;
        const result = await this.executeSql(dbUserDid, statement);
        // const pinpostList = await this.queryPinPostList(dbUserDid);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query origin post data error', error);
        reject(error);
      }
    });
  }

  queryNewOriginPostData(dbUserDid: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST_NEW;
        const result = await this.executeSql(dbUserDid, statement);
        // const pinpostList = await this.queryPinPostList(dbUserDid);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query new origin post data error', error);
        reject(error);
      }
    });
  }

  queryPostDataByTime(dbUserDid: string, start: number, end: number): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST_NEW330 + ' WHERE updated_at>=? and updated_at<=?  ORDER BY updated_at Desc limit ' + this.limitNum;
        const result = await this.executeSql(dbUserDid, statement, [start, end]);
        // const pinpostList = await this.queryPinPostList(dbUserDid);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post data by time error', error);
        reject(error);
      }
    });
  }

  queryChannelPostDataByTime(dbUserDid: string, channelId: string, start: number, end: number): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST_NEW330 + ' WHERE channel_id=? and updated_at>=? and updated_at<=?  ORDER BY updated_at Desc limit ' + this.limitNum;
        const result = await this.executeSql(dbUserDid, statement, [channelId, start, end]);
        // const pinpostList = await this.queryPinPostDataByChannelId(dbUserDid, channelId);
        const postList = this.parsePostData(result);
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post data by time error', error);
        reject(error);
      }
    });
  }

  queryPostDataByID(dbUserDid: string, postId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST_NEW330 + ' WHERE post_id=?';
        const params = [postId];
        const result = await this.executeSql(dbUserDid, statement, params);
        // const pinpostList = await this.queryPinPostList(dbUserDid);
        const postList = this.parsePostData(result);
        Logger.log(TAG, 'query post data by id result: ', postList)
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post table error', error);
        reject(error);
      }
    });
  }

  queryPostDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST_NEW330 + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        // const pinpostList = await this.queryPinPostDataByChannelId(dbUserDid, channelId);
        const postList = this.parsePostData(result);

        Logger.log(TAG, 'query post data by channel id result: ', postList)
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query post table error', error);
        reject(error);
      }
    });
  }

  queryChannelPinPostData(dbUserDid: string, channelId: string): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_POST_NEW330 + ' WHERE channel_id=? and pin_status=1';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        // const pinpostList = await this.queryPinPostDataByChannelId(dbUserDid, channelId);
        const postList = this.parsePostData(result);

        Logger.log(TAG, 'query channel pin post data by channel id result: ', postList)
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'query channel pin post table error', error);
        reject(error);
      }
    });
  }

  insertPostData(dbUserDid: string, postV3: FeedsData.PostV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_POST_NEW330
          + '(post_id, dest_did, channel_id, created_at, updated_at, content, status, type, tag, proof, memo, pin_status, device) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?,?,?)';
        const pinStatus = postV3.pinStatus || FeedsData.PinStatus.NOTPINNED;
        const device = postV3.from || FeedsData.Device.UNKNOW;
        const params = [postV3.postId, postV3.destDid, postV3.channelId, postV3.createdAt, postV3.updatedAt
          , JSON.stringify(postV3.content), postV3.status, postV3.type, postV3.tag, postV3.proof, postV3.memo, pinStatus, device];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'InsertData result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'insert post data error', error);
        reject(error);
      }
    });
  }

  updatePostData(dbUserDid: string, postV3: FeedsData.PostV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_POST_NEW330
          + ' SET updated_at=?, content=?, status=?, type=?, tag=?, proof=?, memo=?, pin_status=?, device=? WHERE post_id=?';
        const pinStatus = postV3.pinStatus || FeedsData.PinStatus.NOTPINNED
        const device = postV3.from || FeedsData.Device.UNKNOW
        const params = [postV3.updatedAt, JSON.stringify(postV3.content), postV3.status, postV3.type, postV3.tag, postV3.proof, postV3.memo, pinStatus, device, postV3.postId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'update post data result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update post data error', error);
        reject(error);
      }
    });
  }

  deletePostData(dbUserDid: string, postId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_POST_NEW330 + ' WHERE post_id=?'
        const params = [postId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete post data result: ', result)
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete post data error', error);
        reject(error);
      }
    });
  }

  deleteOriginPostData(dbUserDid: string, postId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_POST + ' WHERE post_id=?'
        const params = [postId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete post data result: ', result)
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete post data error', error);
        reject(error);
      }
    });
  }

  deleteNewOriginPostData(dbUserDid: string, postId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_POST_NEW + ' WHERE post_id=?'
        const params = [postId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete post data result: ', result)
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete post data error', error);
        reject(error);
      }
    });
  }

  removePostDataByChannel(dbUserDid: string, channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_POST_NEW330 + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete post from channel result: ', result)
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete post from channel error', error);
        reject(error);
      }
    });
  }

  // channel
  private createChannelTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_CHANNEL_NEW
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64) UNIQUE, channel_name VARCHAR(64), intro TEXT, created_at REAL(64), updated_at REAL(64),'
          + 'avatar_address TEXT, tipping_address TEXT, type VARCHAR(64), proof VARCHAR(64), nft TEXT, memo TEXT, category TEXT, display_name VARCHAR(64)'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);

        Logger.log(TAG, 'create cahnnel table result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create channel table error', error);
        reject(error);
      }
    });
  }

  insertChannelData(dbUserDid: string, channelV3: FeedsData.ChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_CHANNEL_NEW
          + '(dest_did, channel_id, channel_name, intro, created_at, updated_at, avatar_address, tipping_address, type, proof, nft, memo, category, display_name) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        let displayName = channelV3.displayName;
        if (!displayName) displayName = channelV3.name;
        const params = [channelV3.destDid, channelV3.channelId, channelV3.name, channelV3.intro, channelV3.createdAt, channelV3.updatedAt
          , channelV3.avatar, channelV3.tipping_address, channelV3.type, channelV3.proof, channelV3.nft, channelV3.memo, channelV3.category, displayName];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert channel Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert channel table date error', error);
        reject(error);
      }
    });
  }

  queryChannelData(dbUserDid: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL_NEW;
        const result = await this.executeSql(dbUserDid, statement);
        const channelList = this.parseChannelData(result);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data error', error);
        reject(error);
      }
    });
  }

  queryOriginChannelData(dbUserDid: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL;
        const result = await this.executeSql(dbUserDid, statement);
        const channelList = this.parseChannelData(result);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data error', error);
        reject(error);
      }
    });
  }

  queryChannelDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL_NEW + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const channelList = this.parseChannelData(result);

        Logger.log(TAG, 'query channel data by channel id result is', channelList);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query channel data by channel id error', error);
        reject(error);
      }
    });
  }

  queryChannelWithDid(dbUserDid: string, userDid: string): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_CHANNEL_NEW + ' WHERE dest_did=?'
        const result = await this.executeSql(dbUserDid, statement, [userDid]);
        const channelList = this.parseChannelData(result)
        Logger.log(TAG, 'query self channel with userDid result is', channelList);
        resolve(channelList);
      } catch (error) {
        Logger.error(TAG, 'query Channel Data with user error', error);
        reject(error);
      }
    });
  }

  updateChannelData(dbUserDid: string, channelV3: FeedsData.ChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_CHANNEL_NEW
          + ' SET channel_name=?, intro=?, created_at=?, updated_at=?, avatar_address=?, tipping_address=?, type=?, proof=?, nft=?, memo=?, category=? , display_name=?WHERE channel_id=?';
        const params = [channelV3.name, channelV3.intro, channelV3.createdAt, channelV3.updatedAt, channelV3.avatar, channelV3.tipping_address, channelV3.type, channelV3.proof, channelV3.nft, channelV3.memo, channelV3.category, channelV3.displayName, channelV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'update channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update channel data error', error);
        reject(error);
      }
    });
  }

  deleteChannelData(dbUserDid: string, channelId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_CHANNEL_NEW + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete channel data result is', result);
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete channel data error', error);
        reject(error);
      }
    });
  }

  deleteOriginChannelData(dbUserDid: string, channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_CHANNEL + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'delete channel data result is', result);
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'delete channel data error', error);
        reject(error);
      }
    });
  }

  dropOriginChannel(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DROP TABLE ' + this.TABLE_CHANNEL;
        const params = [];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'drop channel data result is', result);
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'drop channel data error', error);
        reject(error);
      }
    });
  }

  // subscription channel 本地存储使用
  private createBackupSubscribedChannelTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_SUBSCRIPTION_CHANNEL
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64)'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'Create subscribed channel table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create backup subscriptionChannel table error', error);
        reject(error);
      }
    });
  }

  insertBackupSubscribedChannelData(dbUserDid: string, subscribedChannelV3: FeedsData.BackupSubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_SUBSCRIPTION_CHANNEL
          + '(dest_did, channel_id) VALUES'
          + '(?,?)';

        const params = [subscribedChannelV3.destDid, subscribedChannelV3.channelId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert subscription Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert subscriptionChannel table date error', error);
        reject(error);
      }
    });
  }

  queryBackupSubscribedChannelData(dbUserDid: string): Promise<FeedsData.BackupSubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL;
        const result = await this.executeSql(dbUserDid, statement);
        const subscribedChannelList = this.parseBackupSubscriptionChannelData(result);
        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, 'query subscriptionChannel Data error', error);
        reject(error);
      }
    });
  }

  queryBackupSubscribedChannelDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.BackupSubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const subscriptionChannelList = this.parseBackupSubscriptionChannelData(result);

        Logger.log(TAG, 'query subscribed channel data by channel id result is', subscriptionChannelList);
        resolve(subscriptionChannelList);
      } catch (error) {
        Logger.error(TAG, 'query subscriptionChannel Data By ID  error', error);
        reject(error);
      }
    });
  }

  deleteBackupSubscribedChannelData(dbUserDid: string, subscribedChannelV3: FeedsData.BackupSubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL + ' WHERE channel_id=?'
        const params = [subscribedChannelV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'remove subscription channel result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete subscriptionChannel Data error', error);
        reject(error);
      }
    });
  }

  cleanBackupSubscribedChannelData(dbUserDid: string,): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIPTION_CHANNEL;
        const params = [];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Clean subscribed channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete subscriptionChannel Data error', error);
        reject(error);
      }
    });
  }

  // SubscriptionV3
  private createSubscriptionTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_SUBSCRIPTION
          + '('
          + 'dest_did VARCHAR(64), channel_id VARCHAR(64), user_did VARCHAR(64), created_at REAL(64), display_name VARCHAR(64), updated_at REAL(64), status INTEGER'
          + ')';

        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'Create subscribed  table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create subscription table error', error);
        reject(error);
      }
    });
  }

  insertSubscriptionData(dbUserDid: string, subscriptionV3: FeedsData.SubscriptionV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_SUBSCRIPTION
          + '(dest_did, channel_id, user_did, created_at, display_name, updated_at, status) VALUES'
          + '(?,?,?,?,?,?,?)';

        const params = [subscriptionV3.destDid, subscriptionV3.channelId, subscriptionV3.userDid, subscriptionV3.createdAt, subscriptionV3.displayName, subscriptionV3.updatedAt, subscriptionV3.status];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert subscription Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert subscription table date error', error);
        reject(error);
      }
    });
  }

  querySubscriptionList(dbUserDid: string): Promise<FeedsData.SubscriptionV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION;
        const result = await this.executeSql(dbUserDid, statement);
        const subscriptionList = this.parseSubscriptionData(result);
        resolve(subscriptionList);
      } catch (error) {
        Logger.error(TAG, 'query subscription Data error', error);
        reject(error);
      }
    });
  }

  querySubscriptionDataByChannelId(dbUserDid: string, channelId: string): Promise<FeedsData.SubscriptionV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const subscriptionList = this.parseSubscriptionData(result);

        Logger.log(TAG, 'query subscription data by channel id result is', result);
        resolve(subscriptionList);
      } catch (error) {
        Logger.error(TAG, 'query subscription Data By ID  error', error);
        reject(error);
      }
    });
  }

  queryDistinctSubscriptionUserListByChannelId(dbUserDid: string, channelId: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT DISTINCT user_did FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=? ORDER BY updated_at desc';
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const userList = this.parseUserDidData(result);

        Logger.log(TAG, 'query subscription user list by channel id result is', result);
        resolve(userList);
      } catch (error) {
        Logger.error(TAG, 'query subscription user list by channel id  error', error);
        reject(error);
      }
    });
  }

  querySubscriptionNumByChannelId(dbUserDid: string, channelId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const num = this.parseNum(result);
        Logger.log(TAG, 'query subscription Num by channel id result is', num);
        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'query subscription num by channel id error', error);
        reject(error);
      }
    });
  }

  queryDistinnctSubscriptionNumByChannelId(dbUserDid: string, channelId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(DISTINCT user_did) FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const num = this.parseDistinctUserDidNum(result);
        Logger.log(TAG, 'query subscription user Num by channel id result is', num);
        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'query subscription user num by channel id error', error);
        reject(error);
      }
    });
  }

  queryDisplayNameByUserDid(dbUserDid: string, userDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE user_did=?'
        const params = [userDid];
        const result = await this.executeSql(dbUserDid, statement, params);
        const subscriptions = this.parseSubscriptionData(result);

        if (!subscriptions || subscriptions.length == 0) {
          resolve('');
          return;
        }

        const subscription = subscriptions[0];
        if (!subscription || !subscription.displayName) {
          resolve('');
          return;
        }

        Logger.log(TAG, 'query subscription displayName by userdid result is', subscription.displayName);
        resolve(subscription.displayName);
      } catch (error) {
        Logger.error(TAG, 'query subscription displayName by userdid error', error);
        reject(error);
      }
    });
  }

  updateSubscriptionData(dbUserDid: string, subscriptionV3: FeedsData.SubscriptionV3) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_SUBSCRIPTION
          + ' SET display_name=? WHERE channel_id=?';
        const params = [subscriptionV3.displayName, subscriptionV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'update subscription data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update subscription data error', error);
        reject(error);
      }
    });
  }

  deleteSubscriptionData(dbUserDid: string, channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIPTION + ' WHERE channel_id=?'
        const params = [channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'remove subscription result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete subscription data error', error);
        reject(error);
      }
    });
  }

  cleanSubscriptionData(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIPTION;
        const params = [];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'clean subscription result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'clean subscription data error', error);
        reject(error);
      }
    });
  }

  // comment
  private createCommentTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_COMMENT
          + '('
          + 'dest_did VARCHAR(64), comment_id VARCHAR(64) UNIQUE, channel_id VARCHAR(64), post_id VARCHAR(64), refcomment_id VARCHAR(64), content TEXT, status INTEGER, created_at REAL(64), updated_at REAL(64), proof TEXT, memo TEXT, creater_did VARCHAR(64)'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'create Comment table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create Comment table error', error);
        reject(error);
      }
    });
  }

  insertCommentData(dbUserDid: string, commentV3: FeedsData.CommentV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_COMMENT
          + '(dest_did, comment_id, channel_id, post_id, refcomment_id, content, status, created_at, updated_at, proof, memo, creater_did) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?,?)';

        const params = [commentV3.destDid, commentV3.commentId, commentV3.channelId, commentV3.postId, commentV3.refcommentId, commentV3.content
          , commentV3.status, commentV3.createdAt, commentV3.updatedAt, commentV3.proof, commentV3.memo, commentV3.createrDid];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert comment Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert comment table date error', error);
        reject(error);
      }
    });
  }

  updateCommentData(dbUserDid: string, commentV3: FeedsData.CommentV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_COMMENT
          + ' SET content=?, status=?, updated_at=?, proof=?, memo=? WHERE comment_id=?'; // 条件是否使用refcomment_id
        const params = [commentV3.content, commentV3.status, commentV3.updatedAt, commentV3.proof, commentV3.memo, commentV3.commentId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'update comment data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update comment data error', error);
        reject(error);
      }
    });
  }

  queryCommentByCommentId(dbUserDid: string, commentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?';
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const commentList = this.parseCommentData(result);

        Logger.log(TAG, 'query comment by commentId result is', commentList);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data By ID  error', error);
        reject(error);
      }
    });
  }

  queryCommentById(dbUserDid: string, postId: string, commentId: string): Promise<FeedsData.CommentV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?';
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const commentList = this.parseCommentData(result);

        Logger.log(TAG, 'query comment by Id result is', commentList);
        resolve(commentList[0]);
      } catch (error) {
        Logger.error(TAG, 'query comment Data By ID  error', error);
        reject(error);
      }
    });
  }

  queryCommentByRefId(dbUserDid: string, postId: string, refCommentId: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT + ' WHERE post_id=? and refcomment_id=?';
        const params = [postId, refCommentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const commentList = this.parseCommentData(result);

        Logger.log(TAG, 'query comment by ref Id result is', commentList);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data By ref ID  error', error);
        reject(error);
      }
    });
  }

  queryCommentData(dbUserDid: string): Promise<FeedsData.CommentV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_COMMENT;
        const result = await this.executeSql(dbUserDid, statement);
        const commentList = this.parseCommentData(result);
        resolve(commentList);
      } catch (error) {
        Logger.error(TAG, 'query comment Data error', error);
        reject(error);
      }
    });
  }

  deleteCommentData(dbUserDid: string, commentId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?'
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Remove comment data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Remove comment from sql error', error);
        reject(error);
      }
    });
  }

  queryCommentNum(dbUserDid: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_COMMENT + ' WHERE comment_id=?'
        const params = [commentId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const num = this.parseNum(result);

        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'Query comment num error', error);
        reject(error);
      }
    });
  }

  // like
  private createLikeTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_LIKE
          + '('
          + 'like_id VARCHAR(64) UNIQUE, dest_did VARCHAR(64), channel_id VARCHAR(64), post_id VARCHAR(64), comment_id VARCHAR(64), created_at REAL(64), creater_did VARCHAR(64), proof TEXT, memo TEXT,updated_at REAL(64), status INTEGER'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'create like table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create like table error', error);
        reject(error);
      }
    });
  }

  insertLike(dbUserDid: string, likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_LIKE
          + '(like_id, dest_did, channel_id, post_id, comment_id, created_at, creater_did, proof, memo, updated_at, status) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?)';
        const params = [likeV3.likeId, likeV3.destDid, likeV3.channelId, likeV3.postId, likeV3.commentId, likeV3.createdAt, likeV3.createrDid, likeV3.proof, likeV3.memo, likeV3.updatedAt, likeV3.status];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert like result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert like table date error', error);
        reject(error);
      }
    });
  }

  queryLikeData(dbUserDid: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE;
        const result = await this.executeSql(dbUserDid, statement);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Query like Data error', error);
        reject(error);
      }
    });
  }

  queryLikeDataById(dbUserDid: string, postId: string, commentId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE post_id=? and comment_id=? and status=?'
        const params = [postId, commentId, FeedsData.PostCommentStatus.available];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'query like Data error', error);
        reject(error);
      }
    });
  }

  queryLikeDataById2(dbUserDid: string, likeId: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE like_id=? and status=?'
        const params = [likeId, FeedsData.PostCommentStatus.available];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'query like Data error', error);
        reject(error);
      }
    });
  }

  queryLikeNum(dbUserDid: string, postId: string, commentId: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT COUNT(*) FROM ' + this.TABLE_LIKE + ' WHERE post_id=? and comment_id=? and status=?'
        const params = [postId, commentId, FeedsData.PostCommentStatus.available];
        const result = await this.executeSql(dbUserDid, statement, params);
        const num = this.parseNum(result)
        resolve(num);
      } catch (error) {
        Logger.error(TAG, 'Query like num error', error);
        reject(error);
      }
    });
  }

  queryUserLikeData(dbUserDid: string, postId: string, commentId: string, userDid: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE post_id=? and comment_id=? and creater_did=? '
        const params = [postId, commentId, userDid];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Query user likes data error', error);
        reject(error);
      }
    });
  }

  queryUserAllLikeData(dbUserDid: string, userDid: string): Promise<FeedsData.LikeV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_LIKE + ' WHERE creater_did=? and status=?'
        const params = [userDid, FeedsData.PostCommentStatus.available];

        const result = await this.executeSql(dbUserDid, statement, params);
        const likeList = this.parseLikeData(result);
        resolve(likeList);
      } catch (error) {
        Logger.error(TAG, 'Query user all like data error', error);
        reject(error);
      }
    });
  }

  deleteLike(dbUserDid: string, likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_LIKE + ' WHERE like_id=?'
        const params = [likeV3.likeId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'delete like result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete like error', error);
        reject(error);
      }
    });
  }

  updateLike(dbUserDid: string, likeV3: FeedsData.LikeV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_LIKE
          + ' SET proof=?, memo=?, updated_at=?, status=? WHERE like_id=?';
        const params = [likeV3.proof, likeV3.memo, likeV3.updatedAt, likeV3.status, likeV3.likeId];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'update comment data result is', result);
        resolve('SUCCESS');
      }
      catch (error) {
        Logger.error(TAG, 'update like error', error);
        reject(error)
      }
    });
  }

  //User
  private createUserTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_USER
          + '('
          + 'did VARCHAR(64) UNIQUE, resolved_name VARCHAR(64), resolved_avatar TEXT, resolved_bio TEXT, display_name VARCHAR(64), name VARCHAR(64), avatar TEXT, bio TEXT, updated_at REAL(64)'
          + ')';

        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'Create users table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create users table error', error);
        reject(error);
      }
    });
  }

  insertUserData(dbUserDid: string, user: FeedsData.UserProfile): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_USER
          + '(did, resolved_name, resolved_avatar, resolved_bio, display_name, name, avatar, bio, updated_at) VALUES'
          + '(?,?,?,?,?,?,?,?,?)';

        const params = [user.did, user.resolvedName, user.avatar, user.resolvedBio, user.displayName, user.name, user.avatar, user.bio, user.updatedAt];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert users data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert users date error', error);
        reject(error);
      }
    });
  }

  updateUserData(dbUserDid: string, user: FeedsData.UserProfile): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_USER
          + ' SET resolved_name=?, resolved_avatar=?, resolved_bio=?, display_name=?, name=?, avatar=?, bio=?, updated_at=? WHERE did=?';
        const params = [user.resolvedName, user.resolvedAvatar, user.resolvedBio, user.displayName, user.name, user.avatar, user.bio, user.updatedAt, user.did];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'update users data result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update users data error', error);
        reject(error);
      }
    });
  }

  queryUserDataById(dbUserDid: string, userDid: string): Promise<FeedsData.UserProfile> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_USER + ' WHERE did=?';
        const params = [userDid];
        const result = await this.executeSql(dbUserDid, statement, params);
        const users = this.parseUserData(result);
        resolve(users[0]);
      } catch (error) {
        Logger.error(TAG, 'query userdata data error', error);
        reject(error);
      }
    });
  }

  // subscribed channel 本地存储使用
  private createSubscribedChannelTable(dbUserDid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'create table if not exists ' + this.TABLE_SUBSCRIBED_CHANNELS
          + '('
          + 'user_did VARCHAR(64), target_did VARCHAR(64), channel_id VARCHAR(64), subscribed_at REAL(64), updated_at REAL(64), '
          + 'channel_name VARCHAR(64), channel_display_name VARCHAR(64), channel_intro VARCHAR(64), channel_avatar TEXT, channel_type VARCHAR(64), channel_category VARCHAR(64)'
          + ')';
        const result = await this.executeSql(dbUserDid, statement);
        Logger.log(TAG, 'Create subscribed channel table result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Create subscriptionChannel table error', error);
        reject(error);
      }
    });
  }

  insertSubscribedChannelData(dbUserDid: string, subscribedChannelV3: FeedsData.SubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'INSERT INTO ' + this.TABLE_SUBSCRIBED_CHANNELS
          + '(user_did, target_did, channel_id, subscribed_at, updated_at, channel_name, channel_display_name, channel_intro, channel_avatar, channel_type, channel_category) VALUES'
          + '(?,?,?,?,?,?,?,?,?,?,?)';

        const params = [subscribedChannelV3.userDid, subscribedChannelV3.targetDid, subscribedChannelV3.channelId, subscribedChannelV3.subscribedAt, subscribedChannelV3.updatedAt,
        subscribedChannelV3.channelName, subscribedChannelV3.channelDisplayName, subscribedChannelV3.channelIntro, subscribedChannelV3.channelAvatar, subscribedChannelV3.channelType, subscribedChannelV3.channelCategory];

        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Insert subscription Data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Insert subscriptionChannel table date error', error);
        reject(error);
      }
    });
  }


  updateSubscribedChannelData(dbUserDid: string, subscribedChannelV3: FeedsData.SubscribedChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'UPDATE ' + this.TABLE_SUBSCRIBED_CHANNELS
          + ' SET subscribed_at=?, updated_at=?, channel_name=?, channel_display_name=?, channel_intro=?, channel_avatar=?, channel_type=?, channel_category=? WHERE user_did=? and target_did=? and channel_id=?';
        const params = [subscribedChannelV3.subscribedAt, subscribedChannelV3.updatedAt,
        subscribedChannelV3.channelName, subscribedChannelV3.channelDisplayName, subscribedChannelV3.channelIntro, subscribedChannelV3.channelAvatar, subscribedChannelV3.channelType, subscribedChannelV3.channelCategory,
        subscribedChannelV3.userDid, subscribedChannelV3.targetDid, subscribedChannelV3.channelId];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'update subscribed channel data result: ', result)
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'update subscribed channel data error', error);
        reject(error);
      }
    });
  }

  queryAllSubscribedChannelData(dbUserDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIBED_CHANNELS;
        const result = await this.executeSql(dbUserDid, statement);
        const subscribedChannelList = this.parseSubscribedChannelData(result);
        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, 'Query subscribed channel data error', error);
        reject(error);
      }
    });
  }

  //TODO
  querySubscribedChannelDataExceptUserDid(dbUserDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIBED_CHANNELS;
        const result = await this.executeSql(dbUserDid, statement);
        const subscribedChannelList = this.parseSubscribedChannelData(result);
        resolve(subscribedChannelList);
      } catch (error) {
        Logger.error(TAG, 'Query subscribed channel data error', error);
        reject(error);
      }
    });
  }

  querySubscribedChannelDataByUserDid(dbUserDid: string, userDid: string): Promise<FeedsData.SubscribedChannelV3[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIBED_CHANNELS + ' WHERE user_did=?';
        const params = [userDid];
        const result = await this.executeSql(dbUserDid, statement, params);
        const subscriptionChannelList = this.parseSubscribedChannelData(result);

        Logger.log(TAG, 'Query subscribed channel data by user result is', subscriptionChannelList);
        resolve(subscriptionChannelList);
      } catch (error) {
        Logger.error(TAG, 'Query subscribed channel data by user error', error);
        reject(error);
      }
    });
  }

  querySubscribedChannelDataById(dbUserDid: string, userDid: string, targetDid: string, channelId: string): Promise<FeedsData.SubscribedChannelV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'SELECT * FROM ' + this.TABLE_SUBSCRIBED_CHANNELS + ' WHERE user_did=? and target_did=? and channel_id=?';
        const params = [userDid, targetDid, channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        const subscriptionChannelList = this.parseSubscribedChannelData(result);

        Logger.log(TAG, 'Query subscribed channel data by user result is', subscriptionChannelList);
        resolve(subscriptionChannelList[0]);
      } catch (error) {
        Logger.error(TAG, 'Query subscribed channel data by user error', error);
        reject(error);
      }
    });
  }


  deleteSubscribedChannelDataById(dbUserDid: string, userDid: string, targetDid: string, channelId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIBED_CHANNELS + ' WHERE user_did=? and target_did=? and channel_id=?'
        const params = [userDid, targetDid, channelId];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Remove subscribed channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Remove subscribed channel data error', error);
        reject(error);
      }
    });
  }

  deleteSubscribedChannelDataByUser(dbUserDid: string, userDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIBED_CHANNELS + ' WHERE user_did=?'
        const params = [userDid];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Remove subscribed channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'Remove subscribed channel data error', error);
        reject(error);
      }
    });
  }

  cleanSubscribedChannelData(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const statement = 'DELETE FROM ' + this.TABLE_SUBSCRIBED_CHANNELS;
        const params = [];
        const result = await this.executeSql(dbUserDid, statement, params);
        Logger.log(TAG, 'Clean subscribed channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'delete subscriptionChannel Data error', error);
        reject(error);
      }
    });
  }

  //////////////////////////////////////////////////////////////////////////////

  //pinpost
  // private createPinPostTable(dbUserDid: string): Promise<any> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'create table if not exists ' + this.TABLE_PINPOST
  //         + '('
  //         + 'dest_did VARCHAR(64), channel_id VARCHAR(64), post_id VARCHAR(64)'
  //         + ')';

  //       const result = await this.executeSql(dbUserDid, statement);
  //       Logger.log(TAG, 'Create pin post  table result is', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'Create subscription table error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // insertPinPostData(dbUserDid: string, destDid: string, channelId: string, postId: string): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'INSERT INTO ' + this.TABLE_PINPOST
  //         + '(dest_did, channel_id, post_id) VALUES'
  //         + '(?,?,?)';

  //       const params = [destDid, channelId, postId];

  //       const result = await this.executeSql(dbUserDid, statement, params);
  //       Logger.log(TAG, 'Insert pin post Data result is', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'Insert pin post table date error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // queryPinPostList(dbUserDid: string): Promise<{ destDid: string, channelId: string, postId: string }[]> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'SELECT * FROM ' + this.TABLE_PINPOST;
  //       const result = await this.executeSql(dbUserDid, statement);
  //       const pinPostList = this.parsePinPostData(result);
  //       resolve(pinPostList);
  //     } catch (error) {
  //       Logger.error(TAG, 'query pin post Data error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // queryPinPostDataByChannelId(dbUserDid: string, channelId: string): Promise<{ destDid: string, channelId: string, postId: string }[]> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'SELECT * FROM ' + this.TABLE_PINPOST + ' WHERE channel_id=?';
  //       const params = [channelId];
  //       const result = await this.executeSql(dbUserDid, statement, params);
  //       const pinPostList = this.parsePinPostData(result);

  //       Logger.log(TAG, 'query pin post data by channel id result is', result);
  //       resolve(pinPostList);
  //     } catch (error) {
  //       Logger.error(TAG, 'query pin post Data By ID  error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // queryPinPostData(dbUserDid: string, channelId: string, postId: string): Promise<{ destDid: string, channelId: string, postId: string }[]> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'SELECT * FROM ' + this.TABLE_PINPOST + ' WHERE channel_id=? and post_id=?';
  //       const params = [channelId];
  //       const result = await this.executeSql(dbUserDid, statement, params);
  //       const pinPostList = this.parsePinPostData(result);

  //       Logger.log(TAG, 'query pin post data by channel id result is', result);
  //       resolve(pinPostList);
  //     } catch (error) {
  //       Logger.error(TAG, 'query pin post Data By ID  error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // deletePinPostData(dbUserDid: string, channelId: string): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'DELETE FROM ' + this.TABLE_PINPOST + ' WHERE channel_id=?'
  //       const params = [channelId];
  //       const result = await this.executeSql(dbUserDid, statement, params);
  //       Logger.log(TAG, 'remove pin post result is', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'delete pin post data error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // deletePinPostDataByChannelId(dbUserDid: string, channelId: string): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'DELETE FROM ' + this.TABLE_PINPOST + ' WHERE channel_id=?'
  //       const params = [channelId];
  //       const result = await this.executeSql(dbUserDid, statement, params);
  //       Logger.log(TAG, 'remove pin post result is', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'delete pin post data error', error);
  //       reject(error);
  //     }
  //   });
  // }

  // cleanPinPostData(dbUserDid: string): Promise<string> {
  //   return new Promise(async (resolve, reject) => {
  //     try {
  //       const statement = 'DELETE FROM ' + this.TABLE_PINPOST;
  //       const params = [];
  //       const result = await this.executeSql(dbUserDid, statement, params);
  //       Logger.log(TAG, 'clean pin post result is', result);
  //       resolve('SUCCESS');
  //     } catch (error) {
  //       Logger.error(TAG, 'clean subscription data error', error);
  //       reject(error);
  //     }
  //   });
  // }

  parsePostData(result: any): FeedsData.PostV3[] {
    Logger.log(TAG, 'Parse post result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);

      // content
      const contentData = element['content']
      const contentDatas = JSON.parse(contentData)
      //mediaDataV3
      const mediaDataV3Data = contentDatas['mediaData'][0]
      let mediaDataV3Array = []

      if (mediaDataV3Data != undefined) {
        const mediaDataV3: FeedsData.mediaDataV3 = {
          kind: mediaDataV3Data['kind'],       //"image/video/audio"
          originMediaPath: mediaDataV3Data['originMediaPath'],
          type: mediaDataV3Data['type'],           //"image/jpg",
          size: mediaDataV3Data['size'],           //origin file size
          thumbnailPath: mediaDataV3Data['thumbnailPath'],   //"thumbnailCid"
          duration: mediaDataV3Data['duration'],
          imageIndex: mediaDataV3Data['imageIndex'],
          additionalInfo: mediaDataV3Data['additionalInfo'],
          memo: mediaDataV3Data['memo'],
        }
        mediaDataV3Array.push(mediaDataV3)
      }

      let postContentV3: FeedsData.postContentV3 = {
        version: contentDatas['version'],
        content: contentDatas['content'],
        mediaData: mediaDataV3Array,// 已经上传的到hive(size/type/scriptName@path)
        mediaType: contentDatas['mediaType'],
      }

      const destDid = element['dest_did'];
      const channelId = element['channel_id'];
      const postId = element['post_id'];
      const pinStatus = element['pin_status'] || FeedsData.PinStatus.NOTPINNED;
      const device = element['device'] || FeedsData.Device.UNKNOW;

      let postV3: FeedsData.PostV3 = {
        destDid: destDid,
        postId: postId,
        channelId: channelId,
        createdAt: element['created_at'],
        updatedAt: element['updated_at'],
        content: postContentV3,// string 转mediaDataV3
        status: element['status'],// PostCommentStatus
        type: element['type'],
        tag: element['tag'],
        proof: element['proof'],
        memo: element['memo'],
        pinStatus: pinStatus,
        from: device
      }
      list.push(postV3);
    }

    Logger.log(TAG, 'Parse post list from sql, list is', list);
    return list;
  }

  parseChannelData(result: any): FeedsData.ChannelV3[] {
    Logger.log(TAG, 'Parse channel result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let displayName = element['display_name'];
      if (!displayName) displayName = element['channel_name'];
      let channelV3: FeedsData.ChannelV3 = {
        destDid: element['dest_did'],
        channelId: element['channel_id'],
        createdAt: element['created_at'],
        updatedAt: element['updated_at'],
        name: element['channel_name'],
        intro: element['intro'],
        avatar: element['avatar_address'],
        type: element['type'],
        tipping_address: element['tipping_address'],
        nft: element['nft'],
        category: element['category'],
        proof: element['proof'],
        memo: element['memo'],
        displayName: displayName
      }

      list.push(channelV3);
    }
    Logger.log(TAG, 'Parse channel list from sql, list is', list);
    return list;
  }

  parseCommentData(result: any): FeedsData.CommentV3[] {
    Logger.log(TAG, 'Parse comment result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let commentV3: FeedsData.CommentV3 = {
        destDid: element['dest_did'],
        commentId: element['comment_id'],
        channelId: element['channel_id'],
        postId: element['post_id'],
        refcommentId: element['refcomment_id'],
        content: element['content'],
        status: element['status'],//PostCommentStatus
        createdAt: element['created_at'],
        updatedAt: element['updated_at'],
        proof: element['proof'],
        memo: element['memo'],
        createrDid: element['creater_did'],
      }
      list.push(commentV3);
    }
    Logger.log(TAG, 'Parse comment list from sql, list is', list);
    return list;
  }

  parseLikeData(result: any): FeedsData.LikeV3[] {
    Logger.log(TAG, 'Parse like result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let likeV3: FeedsData.LikeV3 = {
        likeId: element['like_id'],

        destDid: element['dest_did'],
        postId: element['post_id'],
        commentId: element['comment_id'],
        channelId: element['channel_id'],
        createdAt: element['created_at'],
        createrDid: element['creater_did'],
        proof: element['proof'],
        memo: element['memo'],

        updatedAt: element['updated_at'],
        status: element['status'],
      }
      list.push(likeV3);
    }
    Logger.log(TAG, 'Parse like list from sql, list is', list);
    return list;
  }

  parseNum(result: any): number {
    Logger.log(TAG, 'Parse like count result from sql, result is', result);
    if (!result) {
      return 0;
    }
    let num = 0;
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      num = element['COUNT(*)']
    }
    Logger.log(TAG, 'Parse count from sql, count is', num);
    return num;
  }

  parseDistinctUserDidNum(result: any): number {
    Logger.log(TAG, 'Parse like count result from sql, result is', result);
    if (!result) {
      return 0;
    }
    let num = 0;
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      num = element['COUNT(DISTINCT user_did)']
    }
    Logger.log(TAG, 'Parse count from sql, count is', num);
    return num;
  }

  parseBackupSubscriptionChannelData(result: any): FeedsData.BackupSubscribedChannelV3[] {
    Logger.log(TAG, 'Parse subscription channel result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let subscribedChannel: FeedsData.BackupSubscribedChannelV3 = {
        destDid: element['dest_did'],
        channelId: element['channel_id']
      }
      list.push(subscribedChannel);
    }
    Logger.log(TAG, 'Parse subscription channel list from sql, list is', list);
    return list;
  }

  parseSubscribedChannelData(result: any): FeedsData.SubscribedChannelV3[] {
    Logger.log(TAG, 'Parse subscribed channel result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let subscribedChannel: FeedsData.SubscribedChannelV3 = {
        userDid: element['user_did'],
        targetDid: element['target_did'],
        channelId: element['channel_id'],
        subscribedAt: element['subscribed_at'],
        updatedAt: element['updated_at'],

        channelName: element['channel_name'],
        channelDisplayName: element['channel_display_name'],
        channelIntro: element['channel_intro'],
        channelAvatar: element['channel_avatar'],
        channelType: element['channel_type'],
        channelCategory: element['channel_category']
      }
      list.push(subscribedChannel);
    }
    Logger.log(TAG, 'Parse subscribed channel list from sql, list is', list);
    return list;
  }

  parseSubscriptionData(result: any): FeedsData.SubscriptionV3[] {
    Logger.log(TAG, 'Parse subscription result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let subscriptionV3: FeedsData.SubscriptionV3 = {
        destDid: element['dest_did'],
        channelId: element['channel_id'],
        userDid: element['user_did'],
        createdAt: element['created_at'],
        displayName: element['display_name'],

        updatedAt: element['updated_at'],
        status: element['status'],
      }
      list.push(subscriptionV3);
    }
    Logger.log(TAG, 'Parse subscription list from sql, list is', list);
    return list;
  }

  parseUserDidData(result: any): string[] {
    Logger.log(TAG, 'Parse subscription result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      list.push(element['user_did']);
    }
    Logger.log(TAG, 'Parse subscription list from sql, list is', list);
    return list;
  }

  restoreSqlData311(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createChannelTable(dbUserDid);
        let channelData = [];
        try {
          channelData = await this.queryOriginChannelData(dbUserDid);
        } catch (error) {
        }
        for (let index = 0; index < channelData.length; index++) {
          const channel = channelData[index];
          await this.insertChannelData(dbUserDid, channel);
          await this.deleteOriginChannelData(dbUserDid, channel.channelId);
        }
        resolve('FINISH');
      } catch (error) {
        reject(error);
      }
    });
  }

  restoreSqlData320(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createUserTable(dbUserDid);
        await this.createPostTable(dbUserDid);
        let postData = [];
        try {
          postData = await this.queryOriginPostData(dbUserDid);
        } catch (error) {
        }

        for (let index = 0; index < postData.length; index++) {
          const post = postData[index];
          await this.insertPostData(dbUserDid, post)
          await this.deleteOriginPostData(dbUserDid, post.postId);
        }
        resolve('FINISH');
      } catch (error) {
        reject(error);
      }
    });
  }

  restoreSqlData330(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createUserTable(dbUserDid);
        await this.createPostTable(dbUserDid);
        let postData = [];
        try {
          postData = await this.queryNewOriginPostData(dbUserDid);
        } catch (error) {
        }

        for (let index = 0; index < postData.length; index++) {
          const post = postData[index];
          await this.insertPostData(dbUserDid, post)
          await this.deleteNewOriginPostData(dbUserDid, post.postId);
        }
        resolve('FINISH');
      } catch (error) {
        reject(error);
      }
    });
  }

  restoreSqlData340(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.createSubscribedChannelTable(dbUserDid);
        resolve('FINISH');
      } catch (error) {
        reject(error);
      }
    });
  }

  restoreSqlData(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const sqlversion = await this.storageService.get(FeedsData.PersistenceKey.sqlversion) || 0;
        if (sqlversion < Config.SQL_VERSION311 && sqlversion > 0) {
          await this.restoreSqlData311(dbUserDid);
        }

        if (sqlversion < Config.SQL_VERSION320 && sqlversion > 0) {
          await this.restoreSqlData320(dbUserDid);
        }

        if (sqlversion < Config.SQL_VERSION330 && sqlversion > 0) {
          await this.restoreSqlData330(dbUserDid);
        }

        if (sqlversion < Config.SQL_VERSION340 && sqlversion > 0) {
          await this.restoreSqlData340(dbUserDid);
        }

        if (sqlversion == 0) {
          const restore311 = this.restoreSqlData311(dbUserDid);
          const restore320 = this.restoreSqlData320(dbUserDid);
          const restore330 = this.restoreSqlData330(dbUserDid);
          const restore340 = this.restoreSqlData340(dbUserDid);
          await Promise.allSettled([restore311, restore320, restore330, restore340]);
        }

        resolve('FINISH');
      } catch (error) {
      } finally {
        this.storageService.set(FeedsData.PersistenceKey.sqlversion, Config.SQL_VERSION);
      }
    });
  }

  parsePinPostData(result: any): { destDid: string, channelId: string, postId: string }[] {
    Logger.log(TAG, 'Parse pin post result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);
      let pinPost = {
        destDid: element['dest_did'],
        channelId: element['channel_id'],
        postId: element['post_id'],
      }
      list.push(pinPost);
    }
    Logger.log(TAG, 'Parse subscription list from sql, list is', list);
    return list;
  }

  parseUserData(result: any): FeedsData.UserProfile[] {
    Logger.log(TAG, 'Parse user result from sql, result is', result);
    if (!result) {
      return [];
    }
    let list: FeedsData.UserProfile[] = [];
    for (let index = 0; index < result.rows.length; index++) {
      const element = result.rows.item(index);

      const did = element['did']
      const resolvedName = element['resolved_name'];
      const resolvedAvatar = element['resolved_avatar'];
      const resolvedBio = element['resolved_bio'];
      const displayName = element['display_name'];
      const name = element['name'];
      const avatar = element['avatar'];
      const bio = element['bio'];
      const updatedAt = element['updated_at'];

      let user: FeedsData.UserProfile = {
        did: did,
        resolvedName: resolvedName,
        resolvedAvatar: resolvedAvatar,
        resolvedBio: resolvedBio,
        displayName: displayName,
        name: name,
        avatar: avatar,
        bio: bio,
        updatedAt: updatedAt
      }
      list.push(user);
    }

    Logger.log(TAG, 'Parse user list from sql, list is', list);
    return list;
  }

  dropAllData(dbUserDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.dropChannelData(dbUserDid);
      } catch (error) {
      }

      try {
        await this.dropCommentData(dbUserDid);
      } catch (error) {
      }

      try {
        await this.dropLikeData(dbUserDid);
      } catch (error) {
      }

      try {
        await this.dropNewChannelData(dbUserDid);
      } catch (error) {
      }

      try {
        await this.dropNewPostData(dbUserDid);
      } catch (error) {
      }

      try {
        await this.dropPostData(dbUserDid);
      } catch (error) {
      }

      try {
        await this.dropSubscriptionChannelData(dbUserDid);
      } catch (error) {
      }

      try {
        await this.dropSubscriptionChannelData(dbUserDid);
      } catch (error) {
      }

      resolve('FINISH');
    });
  }

  dropChannelData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_CHANNEL + " ; ";
        const params = [];
        await this.executeSql(dbUserDid, statement, params);
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  dropNewChannelData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_CHANNEL_NEW + " ; ";
        const params = [];
        await this.executeSql(dbUserDid, statement, params);
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  dropPostData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_POST + " ; ";
        const params = [];
        await this.executeSql(dbUserDid, statement, params);
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  dropNewPostData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_POST_NEW + " ; ";
        const params = [];
        await this.executeSql(dbUserDid, statement, params);
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  dropSubscriptionData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_SUBSCRIPTION + " ; ";
        const params = [];
        await this.executeSql(dbUserDid, statement, params);
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  dropSubscriptionChannelData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_SUBSCRIPTION_CHANNEL + " ; ";
        const params = [];
        await this.executeSql(dbUserDid, statement, params);
        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  dropCommentData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_COMMENT + " ; ";
        const params = [];
        await this.executeSql(dbUserDid, statement, params);

        resolve('SUCCESS');
      } catch (error) {
        reject(error);
      }
    });
  }

  dropLikeData(dbUserDid: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const statement =
          'DROP TABLE ' + this.TABLE_LIKE + " ; ";
        const params = [];
        const result = await this.executeSql(dbUserDid, statement, params);

        Logger.log(TAG, 'drop channel data result is', result);
        resolve('SUCCESS');
      } catch (error) {
        Logger.error(TAG, 'drop channel data error', error);
        reject(error);
      }
    });
  }
}
