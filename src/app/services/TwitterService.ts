import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { ModalController } from '@ionic/angular';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { TwitterApi } from './TwitterApi';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from './events.service';
import { NativeService } from './NativeService';
import { theme } from '@elastosfoundation/elastos-connectivity-sdk-cordova/typings';

const TAG: string = 'TwitterService';

@Injectable()
export class TwitterService {
  public loading: any = null;
  constructor(
    public modalController: ModalController,
    private inappBrowser: InAppBrowser,
    private http: HTTP,
    private dataHelper: DataHelper,
    private events: Events,
    private native: NativeService,
  ) { }

  public getJsonFromUrl(url) {
    if (!url) url = location.search
    var query = url.substr(1)
    var result = {}
    query.split("&").forEach(function (part) {
      var item = part.split("=")
      result[item[0]] = decodeURIComponent(item[1])
    })
    return result
  }

  public getTokenFromCode(code: string) {
    console.log("getTokenFromCode >>>>>>>>>> ")
    return this.fetchTokenFromTwitter(code, TwitterApi.GRANT_TYPE)
  }

  public async fetchToken(userDid: string) {
    const token = this.dataHelper.getTwitterRefreshToken(userDid)
    console.log("fetchToken >>>>>>>>>> ")
    return this.fetchTokenFromTwitter(token, TwitterApi.GRANT_TYPE_REFRESH)
  }

  private async fetchTokenFromTwitter(code: string, type: string) {
    console.log("fetchTokenFromTwitter code >>>>>>>>>> ", code, type)
    let params = {
      code: code,
      grant_type: type,
      client_id: TwitterApi.CLIENT_ID,
      redirect_uri: TwitterApi.REDIRECT_URI,
      code_verifier: TwitterApi.CODE_VERIFIER
    }
    const userDid = (await this.dataHelper.getSigninData()).did
    let header = {}
    this.http.post(TwitterApi.TOKEN, params, header)
      .then(data => {
        console.log("this.events.publish(FeedsEvent.PublishType.twitterLoginSuccess) >>>>>>>>>>>>>>>>>> ")
        this.events.publish(FeedsEvent.PublishType.twitterLoginSuccess);
        console.log("data >>>>>>>>>>>>>>>>>> ", data)
        const ddata = JSON.parse(data.data)
        this.dataHelper.UpdateTwitterToken(userDid, ddata)
        const accessToken = ddata.access_token
        return accessToken
      })
      .catch(error => {
        this.events.publish(FeedsEvent.PublishType.twitterLoginFailed);
        console.error(TAG, "auth twitter Error: ", error)
        throw error
      })
  }

  public async openTwitterLoginPage() {
    const target = '_system'
    const options = 'location=no'
    Logger.log(TAG, 'inappBrowser star >>>>>>>>>>>>>>>>>>>>>>>>>>>> ')
    this.inappBrowser.create(TwitterApi.AUTH, target, options)
  }

  public async postMedia(base64Encoded: string) {
    Logger.log(TAG, 'post media star >>>>>>>>>>>>>>>>>>>>>>>>>>>> ')
    let params = {
      "text": base64Encoded
    }
    const token = await this.checkTwitterIsExpired()
    Logger.log(TAG, 'post media token >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', token)
    let header = {
      "Content-Type": "multipart/form-data",
      "Authorization": "bearer " + token
    }
    this.http.setDataSerializer('multipart')
    // this.http.sendRequest(TwitterApi.MEDIA, {
    //   method: "post",
    //   data: base64Encoded,
    //   headers: header
    // })
    //   .then(data => {
    //     Logger.log(TAG, 'post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', data)
    //     return data
    //   })
    //   .catch(error => {
    //     Logger.log(TAG, 'post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
    //     return error
    //   })
  }
  public async postTweet(text: string) {
    Logger.log(TAG, 'post tweet star >>>>>>>>>>>>>>>>>>>>>>>>>>>> ')
    let params = {
      "text": text
    }
    const token = await this.checkTwitterIsExpired()
    Logger.log(TAG, 'post tweet token >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', token)
    let header = {
      "Content-Type": "application/json",
      "Authorization": "bearer " + token
    }
    this.http.setDataSerializer('json')
    this.http.post(TwitterApi.TEWWTS, params, header)
      .then(data => {
        Logger.log(TAG, 'post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', data)
        return data
      })
      .catch(error => {
        Logger.log(TAG, 'post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
        throw error
      })
  }

  public async checkTwitterIsExpired() {

    let signinData = await this.dataHelper.getSigninData() || null;
    if (signinData == null || signinData == undefined) {
      return null;
    }
    const userDid = signinData.did || '';
    if(userDid === ''){
      return null;
    }
    try {
    let token = this.dataHelper.getTwitterAccessToken(userDid)
    if (token === false) {
      // TODO: refreshTOken 同样过期，提示用户重新登录
      token = await this.fetchToken(userDid)
    }
      return token
    }
    catch (error) {
      // TODO: 处理refresh token 过期
      this.dataHelper.removeTwitterToken(userDid)
      // this.native.toastWarn("common.twitterExpired");
      throw error
    }
  }

  public async checkTwitterIsExpiredWithToast() {
    try {
      // TODO: refreshTOken 同样过期，提示用户重新登录
      const token = await this.checkTwitterIsExpired()
      if (token === null) {
        this.native.toastWarn("common.twitterNotLogin");
      }
      return token
    }
    catch {
      // TODO: 处理refresh token 过期
      this.native.toastWarn("common.twitterExpired");
      return null
    }
  }
}
