import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { ModalController } from '@ionic/angular';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { RedditApi } from './RedditApi';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from './events.service';
import { NativeService } from './NativeService';
import { theme } from '@elastosfoundation/elastos-connectivity-sdk-cordova/typings';

const TAG: string = 'RedditService';

@Injectable()
export class RedditService {
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

  public getRedditAccessToken(code: string) {
    return this.fetchTokenFromAuthorizationCode(code, RedditApi.GRANT_TYPE)
  }

  public fetchRedditAccessToken(userDid: string) {
    const token = this.dataHelper.getRedditRefreshToken(userDid)
    if (token === null) {
      // this.native.toastWarn("common.RedditNotLogin");
      return
    }
    return this.fetchTokenFromRefreshToken(token, RedditApi.GRANT_TYPE_REFRESH)
  }

  private fetchTokenFromRefreshToken(code: string, type: string) {
    let params = {
      refresh_token: code,
      grant_type: type,
      client_id: RedditApi.CLIENT_ID,
      redirect_uri: RedditApi.REDIRECT_URI,
      code_verifier: RedditApi.CODE_VERIFIER
    }
    return this.fetchTokenFromReddit(params)
  }

  private async fetchTokenFromAuthorizationCode(code: string, type: string) {
    let params = {
      code: code,
      grant_type: type,
      // client_id: RedditApi.CLIENT_ID,
      redirect_uri: RedditApi.REDIRECT_URI,
      // code_verifier: RedditApi.CODE_VERIFIER
    }
    try {
      await this.fetchTokenFromReddit(params)
      // this.events.publish(FeedsEvent.PublishType.RedditLoginSuccess);
    }
    catch (error) {
      throw error
    }
  }

  private async fetchTokenFromReddit(params: any) {
    const userDid = (await this.dataHelper.getSigninData()).did
    let header = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa("HeRDPm57bP09VIhD-FbfMA" + ':' + "s1Bw_UhxiYvxGbVOUKx76YxiAS5CXQ")
    }

    try {
      console.log("param ===== ", params)

      const result = await this.http.post(RedditApi.TOKEN, params, header)
      console.log("result ====== ", result)
      const ddata = JSON.parse(result.data)
      console.log("ddata ====== ", ddata)
      this.dataHelper.UpdateRedditToken(userDid, ddata)
      const accessToken = ddata.access_token
      return accessToken
    }
    catch (error) {
      // this.events.publish(FeedsEvent.PublishType.RedditLoginFailed);
      throw error
    }
  }

  public openRedditLoginPage(platform: string) {
    if (platform === "ios") {
      const target = '_system' // _system _blank
      const options = 'location=no'
      this.inappBrowser.create(RedditApi.AUTH, target, options)
    }
    else {
      const target = '_blank' // _system _blank
      const options = 'location=yes'
      const browser = this.inappBrowser.create(RedditApi.AUTH, target, options)
      browser.on('loadstart').subscribe(async event => {
        if (event.url.includes(RedditApi.REDIRECT_URI)
          && event.url.includes("code=")) {
          browser.hide()
          const codeValue = this.getJsonFromUrl(event.url)["code"]
          await this.getRedditAccessToken(codeValue)
        }
      }, err => {
        alert("InAppBrowser load auth Reddit Error: " + err);
      });
    }
  }

  public async postReddit(tittle: string, text: string) {
    try {
      let params = {
        "api_type": "Json",
        "kind": "self",
        "title": tittle,
        "text": text,       
        "sr": "Elastos"
      }
      const token = await this.checkRedditIsExpired()
      let header = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "bearer " + token,
        "scope": "submit"
      }
      // this.http.setDataSerializer('json')
      const result = await this.http.post(RedditApi.REDDIT_SUBMIT, params, header)
      console.log('post Reddit success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result)
      console.log('post Reddit success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result.data)
      Logger.log(TAG, 'post Reddit success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result)
      return result
    }
    catch (error) {
      console.log('post Reddit error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
      Logger.log(TAG, 'post Reddit error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
      throw error
    }
  }

  public async checkRedditIsExpired() {

    let signinData = await this.dataHelper.getSigninData() || null
    if (signinData == null || signinData == undefined) {
      return null
    }
    const userDid = signinData.did || ''
    if (userDid === '') {
      return null
    }
    try {
      let token = this.dataHelper.getRedditAccessToken(userDid)// todo
      if (token === false) {
        // TODO: refreshTOken 同样过期，提示用户重新登录
        token = await this.fetchRedditAccessToken(userDid)
        console.log("开始刷新refresh token2 ============== ", token)
      }
      return token
    }
    catch (error) {
      // TODO: 处理refresh token 过期
      this.dataHelper.removeRedditToken(userDid)
      // this.native.toastWarn("common.RedditExpired");
      throw error
    }
  }

  public async checkRedditIsExpiredWithToast() {
    try {
      // TODO: refreshTOken 同样过期，提示用户重新登录
      const token = await this.checkRedditIsExpired()
      if (token === null) {
        this.native.toastWarn("common.RedditNotLogin");
      }
      return token
    }
    catch {
      // TODO: 处理refresh token 过期
      this.native.toastWarn("common.RedditExpired");
      return null
    }
  }
}
