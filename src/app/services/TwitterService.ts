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

  public getTwitterAccessToken(code: string) {
    return this.fetchTokenFromAuthorizationCode(code, TwitterApi.GRANT_TYPE)
  }

  public fetchTwitterAccessToken(userDid: string) {
    const token = this.dataHelper.getTwitterRefreshToken(userDid)
    if (token === null) {
      // this.native.toastWarn("common.twitterNotLogin");
      return
    }
    return this.fetchTokenFromRefreshToken(token, TwitterApi.GRANT_TYPE_REFRESH)
  }

  private fetchTokenFromRefreshToken(code: string, type: string) {
    let params = {
      refresh_token: code,
      grant_type: type,
      client_id: TwitterApi.CLIENT_ID,
      redirect_uri: TwitterApi.REDIRECT_URI,
      code_verifier: TwitterApi.CODE_VERIFIER
    }
    return this.fetchTokenFromTwitter(params)
  }

  private async fetchTokenFromAuthorizationCode(code: string, type: string) {
    let params = {
      code: code,
      grant_type: type,
      client_id: TwitterApi.CLIENT_ID,
      redirect_uri: TwitterApi.REDIRECT_URI,
      code_verifier: TwitterApi.CODE_VERIFIER
    }
    try {
      await this.fetchTokenFromTwitter(params)
      this.events.publish(FeedsEvent.PublishType.twitterLoginSuccess);
    }
    catch (error) {
      throw error
    }
  }

  private async fetchTokenFromTwitter(params: any) {
    const userDid = (await this.dataHelper.getSigninData()).did
    let header = {}
    this.http.setDataSerializer('json')
    try {
      const result = await this.http.post(TwitterApi.TOKEN, params, header)
      const ddata = JSON.parse(result.data)
      this.dataHelper.UpdateTwitterToken(userDid, ddata)
      const accessToken = ddata.access_token
      return accessToken
    }
    catch (error) {
        this.events.publish(FeedsEvent.PublishType.twitterLoginFailed);
      throw error
    }
  }

  public openTwitterLoginPage(platform: string) {
    if (platform === "ios") {
      const target = '_system' // _system _blank
      const options = 'location=no'
      this.inappBrowser.create(TwitterApi.AUTH, target, options)
    }
    else {
      const target = '_blank' // _system _blank
      const options = 'location=yes'
      const browser = this.inappBrowser.create(TwitterApi.AUTH, target, options)
      browser.on('loadstart').subscribe(async event => {
        if (event.url.includes(TwitterApi.REDIRECT_URI)
          && event.url.includes("code=")) {
          browser.hide()
          const codeValue = this.getJsonFromUrl(event.url)["code"]
          await this.getTwitterAccessToken(codeValue)
        }
      }, err => {
          alert("InAppBrowser load auth twitter Error: " + err);
      });
    }
  }

  public async postTweet(text: string) {
    try {
      const suffix = " via #elastos Feeds"
      text = text + suffix
    let params = {
      "text": text
    }
      const token = await this.checkTwitterIsExpired()
    let header = {
      "Content-Type": "application/json",
      "Authorization": "bearer " + token
    }
    this.http.setDataSerializer('json')
      const result = await this.http.post(TwitterApi.TEWWTS, params, header)
      Logger.log(TAG, 'post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result)
      return result
    }
    catch (error) {
      // const emsg = "{\"detail\":\"You are not allowed to create a Tweet with duplicate content.\",\"type\":\"about:blank\",\"title\":\"Forbidden\",\"status\":403}"
      // if (emsg === error.error) {
      //   this.native.toastWarn("common.duplicate")
      //   return
      // }
        Logger.log(TAG, 'post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
        throw error
    }
  }

  public async checkTwitterIsExpired() {
   
    let signinData = await this.dataHelper.getSigninData() || null
      if (signinData == null || signinData == undefined) {
        return null
      }
    const userDid = signinData.did || ''
      if(userDid === ''){
        return null
      }
    try {
      let token = this.dataHelper.getTwitterAccessToken(userDid)
      if (token === false) {
        // TODO: refreshTOken 同样过期，提示用户重新登录
        token = await this.fetchTwitterAccessToken(userDid)
        console.log("开始刷新refresh token2 ============== ", token)
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
