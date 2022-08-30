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
      this.native.toastWarn("common.RedditNotLogin");
      return
    }
    return this.fetchTokenFromRefreshToken(token, RedditApi.GRANT_TYPE_REFRESH)
  }

  private fetchTokenFromRefreshToken(code: string, type: string) {
    let params = {
      refresh_token: code,
      grant_type: type,
      redirect_uri: RedditApi.REDIRECT_URI,
    }

    return this.fetchTokenFromReddit(params)
  }

  private async fetchTokenFromAuthorizationCode(code: string, type: string) {
    let params = {
      code: code,
      grant_type: type,
      redirect_uri: RedditApi.REDIRECT_URI,
    }
    try {
      await this.fetchTokenFromReddit(params)
      this.events.publish(FeedsEvent.PublishType.RedditLoginSuccess);
    }
    catch (error) {
      this.events.publish(FeedsEvent.PublishType.RedditLoginFailed);
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
      Logger.log(TAG, "fetchTokenFromReddit header = ", header)
      Logger.log(TAG, "fetchTokenFromReddit params = ", params)
      Logger.log(TAG, "fetchTokenFromReddit url = ", RedditApi.TOKEN)

      this.http.setDataSerializer('urlencoded')
      const result = await this.http.post(RedditApi.TOKEN, params, header)
      Logger.log(TAG, "fetchTokenFromReddit result = ", result.data)
      const ddata = JSON.parse(result.data)
      this.dataHelper.UpdateRedditToken(userDid, ddata)
      const accessToken = ddata.access_token
      return accessToken
    }
    catch (error) {
      Logger.log(TAG, "fetchTokenFromReddit error = ", error)
      this.events.publish(FeedsEvent.PublishType.RedditLoginFailed);
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
          const lent = codeValue.length - 2
          const c = codeValue.substring(0, lent)
          await this.getRedditAccessToken(c)
          const isElastos = await this.subreddits()
          if (isElastos == false) {
            this.native.toastWarn("common.SubscribeElastosCommunity");
          }
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
        "sr": "Elastos" //Elastos //668899
      }
      const token = await this.checkRedditIsExpired()
      let header = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "bearer " + token,
        "scope": "submit"
      }
      this.http.setDataSerializer('urlencoded')
      const result = await this.http.post(RedditApi.REDDIT_SUBMIT, params, header)
      const jsonResult = JSON.parse(result.data)
      const resultSuccess = jsonResult.success

      if (resultSuccess === false) {
        const limitedStr = jsonResult.jquery[14][3][0]
        Logger.log(TAG, 'Your Reddit is limited >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', limitedStr)
        this.native.toastWarn(limitedStr)
      }
      Logger.log(TAG, 'post Reddit success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result)
      return result
    }
    catch (error) {
      Logger.log(TAG, 'post Reddit error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
      throw error
    }
  }

  public async subreddits() {
    try {
      const token = await this.checkRedditIsExpired()
      let header = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "bearer " + token
      }
      this.http.setDataSerializer('urlencoded')
      const result = await this.http.get(RedditApi.subreddits, {}, header)
      const jsonResult = JSON.parse(result.data)
      console.log('get subReddit success result.data = >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result.data)
      const children = jsonResult.data.children
      const userDid = (await this.dataHelper.getSigninData()).did
      let containsElastos = false
      children.forEach(async item => {
        const elastosUrl = "/r/Elastos/"
        const myUrl = item.data.url
        if (elastosUrl === myUrl) {
          this.dataHelper.updateRedditIsSubscribeElastos(userDid, "true")
          Logger.log(TAG, 'get Reddit success: contains elastos  >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', children)

          containsElastos = true
          return true
        }
      })

      this.dataHelper.updateRedditIsSubscribeElastos(userDid, containsElastos.toString())
      Logger.log(TAG, 'get subReddit success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', containsElastos.toString())
      return containsElastos
    }
    catch (error) {
      Logger.log(TAG, 'get subReddit error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
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
        token = await this.fetchRedditAccessToken(userDid)
      }
      return token
    }
    catch (error) {
      Logger.log(TAG, 'fetch reddit accessToken error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
      this.dataHelper.removeRedditToken(userDid)
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
