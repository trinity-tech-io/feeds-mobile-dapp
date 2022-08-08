import { Injectable } from '@angular/core';
import { Executable, InsertOptions, File as HiveFile, ScriptRunner, Vault, AppContext, Logger as HiveLogger, UpdateResult, UpdateOptions, Condition, InsertResult } from "@elastosfoundation/hive-js-sdk";
import { Claims, DIDDocument, JWTParserBuilder, DID, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiableCredential } from '@elastosfoundation/did-js-sdk';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { FileService } from 'src/app/services/FileService';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
let TAG: string = 'Feeds-HiveService';
import { Events } from 'src/app/services/events.service';
import { Config } from './config';
import { reject } from 'lodash';

@Injectable()
export class HiveService {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  public static readonly CHANNEL = "channels"
  public static readonly TARGETDID = "targetDid"
  public static readonly postId = "channelId"
  private static readonly RESOLVE_CACHE = "data/didCache"

  public image = null
  public appinstanceDid: string
  private vault: Vault
  // private scriptRunner: ScriptRunner
  private scriptRunners: { [key: string]: ScriptRunner } = {}

  constructor(
    private standardAuthService: StandardAuthService,
    private fileService: FileService,
    private dataHelper: DataHelper,
    private events: Events,
  ) {
  }

  public async creatAppContext(appInstanceDocumentString: string, userDidString: string): Promise<AppContext> {
    return new Promise(async (resolve, reject) => {
      try {

        const currentNet = "MainNet".toLowerCase();
        HiveLogger.setDefaultLevel(HiveLogger.TRACE)
        DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
        try {
          AppContext.setupResolver(currentNet, HiveService.RESOLVE_CACHE)
        } catch (error) {
        }
        const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
        const path = rootDirEntry.fullPath
        // auth
        let self = this
        let cachedAuthToken = '';

        const context = await AppContext.build({
          getLocalDataDir(): string {
            return path
          },
          getAppInstanceDocument(): Promise<DIDDocument> {
            return new Promise(async (resolve, reject) => {
              try {
                let appInstanceDidDocument = DIDDocument._parseOnly(appInstanceDocumentString)
                resolve(appInstanceDidDocument)
              } catch (error) {
                Logger.error(TAG, "get AppInstanceDocument Error: ", error)
                reject(error)
              }
            })
          },
          getAuthorization(jwtToken: string): Promise<string> {
            return new Promise(async (resolve, reject) => {
              try {
                console.log('Get authorization jwtToken is', jwtToken);
                const authToken = await self.standardAuthService.generateHiveAuthPresentationJWT(jwtToken)
                console.log('Get authorization authToken is', authToken);
                resolve(authToken)
              } catch (error) {
                Logger.error(TAG, "get Authorization Error: ", error)
                reject(error)
              }
            })
          }
        }, userDidString, Config.APPLICATION_DID);
        resolve(context)
      } catch (error) {
        // Logger.error(TAG, "creat Error: ", error)
        reject(error)
      }
    })
  }
  async creatScriptRunner(userDid: string, targetDid: string) {
    const appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
    const context = await this.creatAppContext(appinstanceDocument, userDid)
    const providerAddress = await AppContext.getProviderAddressByUserDid(targetDid);
    const scriptRunner = new ScriptRunner(context, providerAddress)
    this.scriptRunners[targetDid] = scriptRunner
    return scriptRunner
  }

  async creatVault() {
    try {
      const userDid = (await this.dataHelper.getSigninData()).did
      let appinstanceDocument = await this.standardAuthService.getInstanceDIDDoc()
      const context = await this.creatAppContext(appinstanceDocument, userDid)

      // let scriptRunner = await this.creatScriptRunner(userDid)
      // this.scriptRunners[userDid] = scriptRunner
      const vault = new Vault(context)
      Logger.log(TAG, 'Create vault ', userDid, this.vault)
      return vault
    }
    catch (error) {
      Logger.error(TAG, 'Create vault error:', error);
      this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 1 });
      throw error
    }
  }

  parseUserDIDDocumentForUserAvatar(userDid: string): Promise<{
    avatarParam: string;
    avatarScriptName: string;
    tarDID: string;
    tarAppDID: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDID = DID.from(userDid)
        const userDIDDocument = await userDID.resolve()

        const avatarDid = userDid + "#avatar"
        const avatarVC = userDIDDocument.getCredential(avatarDid)
        if (!avatarVC) {// 没有有头像
          Logger.warn(TAG, 'Not found avatar from did document');
          return null;
        }

        const sub = avatarVC.getSubject()
        const pro = sub.getProperty("avatar")
        const data: string = pro["data"]
        // const type = pro["type"]
        const prefix = "hive://"
        const avatarParam = data.substr(prefix.length)
        // this.avatarParam = avatarParam
        const parts = avatarParam.split("/")
        if (parts.length < 2) // TODO 验证parts是否大于2个 ，否则 抛出异常
          throw "userDIDDocument 中缺少参数"

        const dids = parts[0].split("@")
        if (dids.length != 2) // TODO 验证dids是否等于2个 ，否则 抛出异常
          throw "userDIDDocument 中缺少参数"

        // const star = data.length - (prefix.length + parts[0].length + 1)
        const values = parts[1].split("?")
        if (values.length != 2) // TODO 验证values是否等于2个 ，否则 抛出异常
          throw "userDIDDocument 中缺少参数"

        const avatarScriptName = values[0]
        // this.avatarScriptName = avatarScriptName
        // const paramStr = values[1]
        // const scriptParam = JSON.parse(paramStr.substr(7))
        const tarDID = dids[0]
        const tarAppDID = dids[1]

        const res = {
          avatarParam: avatarParam,
          avatarScriptName: avatarScriptName,
          tarDID: tarDID,
          tarAppDID: tarAppDID
        }
        resolve(res);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getScriptRunner(userDid: string, targetDid: string): Promise<ScriptRunner> {
    try {
      let scriptRunner = this.scriptRunners[userDid]
      if (!scriptRunner) {
        scriptRunner = await this.creatScriptRunner(userDid, targetDid)
      }
      return scriptRunner
    } catch (error) {
      throw error
    }
  }

  async getVault(forceCreate: boolean = false): Promise<Vault> {
    if (this.vault === undefined || this.vault === null || forceCreate) {
      this.vault = await this.creatVault()
    }
    Logger.log(TAG, 'Get vault from', 'vault is', this.vault)
    return this.vault
  }

  async getDatabaseService() {
    return (await this.getVault()).getDatabaseService()
  }

  async getFilesService() {
    return (await this.getVault()).getFilesService()
  }

  async getScriptingService(forceCreate: boolean) {
    return (await this.getVault(forceCreate)).getScriptingService()
  }

  async createCollection(channelName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const databaseService = await this.getDatabaseService()
        const result = await databaseService.createCollection(channelName);
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'createCollection error', error);
        reject(error);
      }
    })
  }

  async deleteCollection(collectionName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const databaseService = await this.getDatabaseService()
        const result = await databaseService.deleteCollection(collectionName);
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'delete collection error', error);
        reject(error);
      }
    })
  }

  registerScript(forceCreate: boolean, scriptName: string, executable: Executable, condition?: Condition, allowAnonymousUser?: boolean, allowAnonymousApp?: boolean): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let scriptingService = await this.getScriptingService(forceCreate);
        await scriptingService.registerScript(scriptName, executable,
          condition, allowAnonymousUser, allowAnonymousApp)
        resolve()
      } catch (error) {
        Logger.error(TAG, 'register error:', error)
        this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 0 })
        reject(error)
      }
    })
  }

  async callScript(scriptName: string, document: any, targetDid: string, appid: string, userDid: string): Promise<any> {
    let scriptRunner = await this.getScriptRunner(userDid, targetDid);
    let result = await scriptRunner.callScript<any>(scriptName, document, targetDid, appid)
    return result
  }

  async getMyChannelList(userDid: string) {
    this.dataHelper.getMyChannelListWithHive(userDid)
  }

  async uploadScriting(transactionId: string, data: string) {
    const userDid = (await this.dataHelper.getSigninData()).did
    const scriptRunner = await this.getScriptRunner(userDid, userDid)
    return scriptRunner.uploadFile(transactionId, data)
  }

  async downloadEssAvatarTransactionId(avatarParam: string, avatarScriptName: string, targetDid: string, tarAppDID: string) {
    try {
      if (avatarParam === null || avatarParam === undefined) {
        return
      }
      const userDid = (await this.dataHelper.getSigninData()).did
      const scriptRunner = await this.getScriptRunner(userDid, targetDid)
      return await scriptRunner.callScript<any>(avatarScriptName, avatarParam, targetDid, tarAppDID)
    } catch (error) {
      Logger.error(TAG, "Download Ess Avatar transactionId error: ", error)
      throw error
    }
  }

  async downloadFileByHiveUrl(hiveUrl: string, targetDid: string) {
    try {
      if (hiveUrl === null || hiveUrl === undefined) {
        return
      }
      let userDid = (await this.dataHelper.getSigninData()).did;
      const scriptRunner = await this.getScriptRunner(userDid, targetDid);
      return await scriptRunner.downloadFileByHiveUrl(hiveUrl);
    } catch (error) {
      Logger.error(TAG, "Download Ess Avatar error: ", error)
      throw error
    }
  }

  async downloadScripting(targetDid: string, transaction_id: string) {
    try {
      const userDid = (await this.dataHelper.getSigninData()).did
      const scriptRunner = await this.getScriptRunner(userDid, targetDid)
      return await scriptRunner.downloadFile(transaction_id)
    } catch (error) {
      Logger.error(TAG, "scriptingService.downloadFile error: ", error)
      throw error
    }
  }

  async downloadFile(remotePath: string) {
    const fileService = await this.getFilesService()
    return await fileService.download(remotePath)
  }

  async getUploadDataFromScript(targetDid: string, transactionId: string, img: any) {
    try {
      const userDid = (await this.dataHelper.getSigninData()).did
      const scriptRunner = await this.getScriptRunner(userDid, targetDid)
      return scriptRunner.uploadFile(transactionId, img)
    }
    catch (error) {
      Logger.error(TAG, "getUploadDataFromScript error: ", error);
      throw error
    }
  }

  async uploadDataFromScript(targetDid: string, transactionId: string, img: any) {
    try {
      const userDid = (await this.dataHelper.getSigninData()).did
      const scriptRunner = await this.getScriptRunner(userDid, targetDid)
      return scriptRunner.uploadFile(transactionId, img)
    }
    catch (error) {
      Logger.error(TAG, "uploadDataFromScript error: ", error);
      throw error
    }
  }

  async uploadScriptWithBuffer(remotePath: string, img: Buffer) {
    try {
      const fileService = await this.getFilesService()
      return await fileService.upload(remotePath, img)
    }
    catch (error) {
      Logger.error(TAG, "Upload script blob error: ", error);
      throw error
    }
  }

  async uploadScriptWithString(remotePath: string, img: any) {
    try {
      const fileService = await this.getFilesService()
      return await fileService.upload(remotePath, Buffer.from(img, 'utf8'))
    }
    catch (error) {
      Logger.error(TAG, "uploadScriptWithString error: ", error);
      throw error
    }
  }

  insertDBData(collectName: string, doc: any,): Promise<InsertResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const insertResult = await dbService.insertOne(collectName, doc, new InsertOptions(false, true));
        resolve(insertResult)
      } catch (error) {
        Logger.error(TAG, 'Insert error:', error);
        reject(error)
      }
    })
  }

  updateOneDBData(collectName: string, filter: JSONObject, update: JSONObject, option: UpdateOptions): Promise<UpdateResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const result = await dbService.updateOne(collectName, filter, update, option)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'update one error:', error)
        reject(error)
      }
    })
  }

  deleateOneDBData(collectName: string, fillter: JSONObject): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        await dbService.deleteOne(collectName, fillter)
        resolve()
      } catch (error) {
        Logger.error(TAG, 'delete one error:', error)
        reject(error)
      }
    })
  }

  queryDBData(collectionName: string, filter: any): Promise<JSONObject[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const dbService = await this.getDatabaseService()
        const result = dbService.findMany(collectionName, filter)
        resolve(result)
      } catch (error) {
        Logger.error(TAG, 'listPostDB error:', error)
        reject(error)
      }
    })
  }

  newInsertOptions() {
    return new InsertOptions(false, true);
  }
}