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
import hmacSHA1 from 'crypto-js/hmac-sha1';
import Base64 from 'crypto-js/enc-base64';
import *  as  CryptoJS from 'crypto-js/crypto-js';

const TAG: string = 'TwitterService';

@Injectable()
export class TwitterService {
  public loading: any = null
  public oauth_token_secret = ''
  public oauth_token = ''

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

  public async openTwitterLoginPage() {
    const target = '_system'
    const options = 'location=no'
    Logger.log(TAG, 'inappBrowser star >>>>>>>>>>>>>>>>>>>>>>>>>>>> ')
    this.inappBrowser.create(TwitterApi.AUTH, target, options)
  }

  public async postTweet(text: string) {
    try {
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
    if (userDid === '') {
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

  /// ========================== AUTH1.0 ========================
  private makeid(length) {
    var result = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength))
    }
    return result
  }

  private generateAuthorization_secretWithAuth1(params: any, url: string, secret: string) {
    var keys = Object.keys(params).sort()
    let paramStr = ""
    let character = ""
    for (var key in keys) {
      paramStr = paramStr + character
      paramStr = paramStr + keys[key] + "=" + encodeURIComponent(params[keys[key]])
      character = "&"
    }
    // 2: 参数： 把第一步的值进行URIComponent
    const urlEncode = encodeURIComponent(url)
    const parmStrEncode = encodeURIComponent(paramStr)

    // 3: 把 POST/URL/和第二步得到的值 用&连接成字符串
    const str = "POST&" + urlEncode + "&" + parmStrEncode

    // 4: _secret
    const oauth_consumer_secret = TwitterApi.OAUTH_CONSUMER_SECRET + "&" + secret

    // 5: 加密 oauth_signature
    // var oauth_signature = CryptoJS.HmacSHA1(str, oauth_consumer_secret).toString(CryptoJS.enc.Base64);
    const oauth_signatureString = Base64.stringify(hmacSHA1(str, oauth_consumer_secret))
    const oauth_signature = encodeURIComponent(oauth_signatureString)
    // const authorization = "OAuth " + "oauth_verifier=" + oauth_verifier + ",oauth_token=" + oauth_token + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature2
    return oauth_signature
  }

  private generateAuthorizationLoginWithAuth1() {
    const url = TwitterApi.AUTH1_REQUESTTOKEN

    const oauth_consumer_key = TwitterApi.OAUTH_CONSUMER_KEY
    const oauth_signature_method = TwitterApi.OAUTH_SIGNATURE_METHOD
    const oauth_timestamp = (Date.now() / 1000) | 0
    const oauth_nonce = this.makeid(11)
    const oauth_version = TwitterApi.OAUTH_VERSION
    const oauth_callback = TwitterApi.OAUTH_CALLBACK
    const oauth_callback_ = "oauth_callback=" + encodeURIComponent(oauth_callback)

    let auth = {
      "oauth_callback": oauth_callback,
      "oauth_version": oauth_version,
      "oauth_nonce": oauth_nonce,
      "oauth_timestamp": oauth_timestamp,
      "oauth_signature_method": oauth_signature_method,
      "oauth_consumer_key": oauth_consumer_key
    }

    const oauth_signature = this.generateAuthorization_secretWithAuth1(auth, url, "")
    const authorization = "OAuth " + oauth_callback_ + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature
    return authorization
  }

  private generateAuthorizationForAccessTokenWithAuth1(params: any) {
    const url = TwitterApi.AUTH1_ACCESSTOKEN
    const oauth_consumer_key = TwitterApi.OAUTH_CONSUMER_KEY
    const oauth_signature_method = TwitterApi.OAUTH_SIGNATURE_METHOD
    const oauth_timestamp = (Date.now() / 1000) | 0
    const oauth_nonce = this.makeid(11)
    const oauth_token = params.oauth_token
    const oauth_version = TwitterApi.OAUTH_VERSION
    const oauth_verifier = params.oauth_verifier
    let auth = {
      "oauth_verifier": oauth_verifier,
      "oauth_token": oauth_token,
      "oauth_version": oauth_version,
      "oauth_nonce": oauth_nonce,
      "oauth_timestamp": oauth_timestamp,
      "oauth_signature_method": oauth_signature_method,
      "oauth_consumer_key": oauth_consumer_key
    }
    const oauth_signature = this.generateAuthorization_secretWithAuth1(auth, url, this.oauth_token_secret)
    const authorization = "OAuth " + "oauth_verifier=" + oauth_verifier + ",oauth_token=" + oauth_token + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature
    return authorization
  }

  private generateAuthorizationForTweetsWithAuth1(userDid: string, url: string) {
    const authData = this.dataHelper.getTwitterTokenDataWithAuth1(userDid)
    // const url = TwitterApi.TEWWTS // TEWWTS AUTH1_CREATE
    const oauth_consumer_key = TwitterApi.OAUTH_CONSUMER_KEY
    const oauth_token = authData.oauth_token
    const oauth_timestamp = (Date.now() / 1000) | 0
    const oauth_signature_method = TwitterApi.OAUTH_SIGNATURE_METHOD
    const oauth_nonce = this.makeid(11)
    const oauth_version = TwitterApi.OAUTH_VERSION

    let auth = {
      "oauth_token": oauth_token,
      "oauth_version": oauth_version,
      "oauth_nonce": oauth_nonce,
      "oauth_timestamp": oauth_timestamp,
      "oauth_signature_method": oauth_signature_method,
      "oauth_consumer_key": oauth_consumer_key,
    }
    const oauth_signature = this.generateAuthorization_secretWithAuth1(auth, url, authData.oauth_token_secret)
    const authorization = "OAuth " + "oauth_token=" + oauth_token + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature
    return authorization
  }

  private generateAuthorizationForTweetWithAuth1(userDid: string) {
    const url = TwitterApi.TEWWTS // TEWWTS AUTH1_CREATE
    return this.generateAuthorizationForTweetsWithAuth1(userDid, url)
  }

  private generateAuthorizationForUploadMediaWithAuth1(userDid: string) {
    const url = TwitterApi.AUTH1_MEDIA // TEWWTS AUTH1_CREATE
    return this.generateAuthorizationForTweetsWithAuth1(userDid, url)
  }

  private generateAuthorizationForTweetAndMediaWithAuth1(userDid: string) {
    const url = TwitterApi.TEWWTS // TEWWTS AUTH1_CREATE
    return this.generateAuthorizationForTweetsWithAuth1(userDid, url)
  }

  private parseAuthResponse(str: string) {
    console.log("parseAuthResponse str = ", str)
    // const str1 = "oauth_token=9PzG1wAAAAABeURIAAABgfBMVLE&oauth_token_secret=af8FVlRcJOLQszh3nV3Qh1tbnmFjupzs&oauth_callback_confirmed=true"
    const parts = str.split("&")
    let dic = {}
    console.log("parseAuthResponse parts = ", parts)
    for (let i = parts.length; i--;) {
      let str = parts[i]
      let reg0 = RegExp("oauth_token")
      let reg1 = RegExp("oauth_token_secret")
      let reg2 = RegExp("oauth_callback_confirmed")
      let reg3 = RegExp("user_id")
      let reg4 = RegExp("screen_name")

      if (reg0.exec(str)) {
        if (reg1.exec(str)) {
          str = str.substring(str.indexOf('=') + 1, str.length)
          console.log("parseAuthResponse str ========= ", str)
          dic["oauth_token_secret"] = str
        }
        else {
          str = str.substring(str.indexOf('=') + 1, str.length)
          console.log("parseAuthResponse str ========= ", str)
          dic["oauth_token"] = str
        }
      }
      else if (reg2.exec(str)) {
        str = str.substring(str.indexOf('=') + 1, str.length)
        console.log("parseAuthResponse str ========= ", str)
        dic["oauth_callback_confirmed"] = str
      }
      else if (reg3.exec(str)) {
        str = str.substring(str.indexOf('=') + 1, str.length)
        console.log("parseAuthResponse str ========= ", str)
        dic["user_id"] = str
      }
      else if (reg4.exec(str)) {
        str = str.substring(str.indexOf('=') + 1, str.length)
        console.log("parseAuthResponse str ========= ", str)
        dic["screen_name"] = str
      }
    }
    console.log("parseAuthResponse dic ========= ", dic)

    return dic
  }

  public async openTwitterLoginPageWithAuth1() {

    // const url = TwitterApi.AUTH1_REQUESTTOKEN

    // const oauth_consumer_key = "oKrTiVZ0fyBL64Aas92XgWhcv"
    // const oauth_signature_method = "HMAC-SHA1"
    // const oauth_timestamp = (Date.now() / 1000) | 0
    // const oauth_nonce = this.makeid(11)
    // const oauth_version = "1.0"
    // const oauth_callback = "https://feeds.trinity-feeds.app/logininsuccess"

    // let param = {
    //   "oauth_callback": oauth_callback,
    //   "oauth_version": oauth_version,
    //   "oauth_nonce": oauth_nonce,
    //   "oauth_timestamp": oauth_timestamp,
    //   "oauth_signature_method": oauth_signature_method,
    //   "oauth_consumer_key": oauth_consumer_key
    // }

    // var keys = Object.keys(param).sort()
    // let paramStr = ""
    // let character = ""
    // for (var key in keys) {
    //   paramStr = paramStr + character
    //   paramStr = paramStr + keys[key] + "=" + encodeURIComponent(param[keys[key]])
    //   character = "&"

    // }

    // // 1: 参数： =连接 key=vaule
    // const oauth_callback_ = "oauth_callback=" + encodeURIComponent(oauth_callback)

    // // 2: 参数： 把第一步的值进行URIComponent
    // const urlEncode = encodeURIComponent(url)

    // const parmStrEncode = encodeURIComponent(paramStr)

    // // 3: 把 POST/URL/和第二步得到的值 用&连接成字符串
    // const str = "POST&" + urlEncode + "&" + parmStrEncode

    // // 4: _secret
    // const oauth_consumer_secret = "1Bz8wwu82C7EGaMM9Wm5L46qspJveYCyMz7ALeEm4ov9hyihd0&"

    // // 5: 加密 oauth_signature
    // var oauth_signature = CryptoJS.HmacSHA1(str, oauth_consumer_secret).toString(CryptoJS.enc.Base64);
    // const oauth_signature1 = Base64.stringify(hmacSHA1(str, oauth_consumer_secret))
    // const oauth_signature2 = encodeURIComponent(oauth_signature1)
    // const authorization = "OAuth " + oauth_callback_ + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature2

    let params = {}
    const url = TwitterApi.AUTH1_REQUESTTOKEN
    const authorization = this.generateAuthorizationLoginWithAuth1()
    let header = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": authorization
    }

    console.log("authorization", authorization);

    // this.http.setDataSerializer('json')
    try {
      const request = await this.http.post(url, params, header)
      console.log(request.data);
      const strData = request.data
      const result = this.parseAuthResponse(strData)
      this.oauth_token = result["oauth_token"]
      this.oauth_token_secret = result["oauth_token_secret"]

      const openUrl = "https://api.twitter.com/oauth/authorize?oauth_token=" + this.oauth_token

      const target = '_system'
      const options = 'location=no'
      this.inappBrowser.create(openUrl, target, options)
    }
    catch (error) {
      Logger.error(TAG, "auth twitter Error: ", error)
      throw error
    }
    //   .then(data => {
    //     console.log(data.data);
    //     const strData = data.data
    //     const result = this.parseAuthResponse(strData)
    //     this.oauth_token = result["oauth_token"]
    //     this.oauth_token_secret = result["oauth_token_secret"]

    //     const url = "https://api.twitter.com/oauth/authorize?oauth_token=" + this.oauth_token

    //     const target = '_system'
    //     const options = 'location=no'
    //     this.inappBrowser.create(url, target, options)
    //   })
    //   .catch(error => {
    //     Logger.error(TAG, "auth twitter Error: ", error)
    //   })
    // return
  }

  public async obtainAccessTokenWithAuth1(params: any) {
    // const url = TwitterApi.AUTH1_ACCESSTOKEN
    // const oauth_consumer_key = TwitterApi.OUTH_OAUTH_CONSUMER_KEY
    // const oauth_signature_method = TwitterApi.OUTH_SIGNATURE_METHOD
    // const oauth_timestamp = (Date.now() / 1000) | 0
    // const oauth_nonce = this.makeid(11)
    // const oauth_token = params.oauth_token
    // const oauth_version = TwitterApi.OAUTH_VERSION
    // const oauth_verifier = params.oauth_verifier

    // let auth = {
    //   "oauth_verifier": oauth_verifier,
    //   "oauth_token": oauth_token,
    //   "oauth_version": oauth_version,
    //   "oauth_nonce": oauth_nonce,
    //   "oauth_timestamp": oauth_timestamp,
    //   "oauth_signature_method": oauth_signature_method,
    //   "oauth_consumer_key": oauth_consumer_key
    // }
    // var keys = Object.keys(auth).sort()
    // let paramStr = ""
    // let character = ""
    // for (var key in keys) {
    //   paramStr = paramStr + character
    //   paramStr = paramStr + keys[key] + "=" + encodeURIComponent(auth[keys[key]])
    //   character = "&"
    // }
    // // 2: 参数： 把第一步的值进行URIComponent
    // const urlEncode = encodeURIComponent(url)
    // const parmStrEncode = encodeURIComponent(paramStr)

    // // 3: 把 POST/URL/和第二步得到的值 用&连接成字符串
    // const str = "POST&" + urlEncode + "&" + parmStrEncode

    // // 4: _secret
    // const oauth_consumer_secret = "1Bz8wwu82C7EGaMM9Wm5L46qspJveYCyMz7ALeEm4ov9hyihd0&" + this.oauth_token_secret

    // // 5: 加密 oauth_signature
    // var oauth_signature = CryptoJS.HmacSHA1(str, oauth_consumer_secret).toString(CryptoJS.enc.Base64);
    // const oauth_signature1 = Base64.stringify(hmacSHA1(str, oauth_consumer_secret))
    // const oauth_signature2 = encodeURIComponent(oauth_signature1)
    // const authorization = "OAuth " + "oauth_verifier=" + oauth_verifier + ",oauth_token=" + oauth_token + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature2

    const url = TwitterApi.AUTH1_ACCESSTOKEN
    const parameter = {}
    const authorization = this.generateAuthorizationForAccessTokenWithAuth1(params)
    let header = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": authorization
    }
    // this.http.setDataSerializer('json')
    const userDid = (await this.dataHelper.getSigninData()).did
    try {
      const result = await this.http.post(url, parameter, header)
      console.log(result.data);
      const strData = result.data
      const tokens = this.parseAuthResponse(result.data)
      let authToken = { "oauth_token": tokens["oauth_token"], "oauth_token_secret": tokens["oauth_token_secret"] }
      this.dataHelper.updateTwitterTokenWithAuth1(userDid, authToken)
      console.log(" auth1.0 auth success: ", authToken)
    }
    catch (error) {
      Logger.error(TAG, "auth twitter Error: ", error)
      throw error
    }
    // .then(data => {
    //   console.log(data.data);
    //   const strData = data.data
    //   const tokens = this.parseAuthResponse(strData)
    //   let authToken = { "oauth_token": tokens["oauth_token"], "oauth_token_secret": tokens["oauth_token_secret"] }
    //   this.dataHelper.updateTwitterAuth1Token(userDid, authToken)
    // })
    // .catch(error => {
    //   Logger.error(TAG, "auth twitter Error: ", error)
    // })
  }

  public async postTweetWithAuth1(text: string) {

    // const userDid = (await this.dataHelper.getSigninData()).did
    // const authData = this.dataHelper.getTwitterTokenDataWithAuth1(userDid)

    // const url = TwitterApi.TEWWTS
    // const oauth_consumer_key = "oKrTiVZ0fyBL64Aas92XgWhcv"
    // const oauth_token_ = authData.oauth_token
    // const oauth_timestamp = (Date.now() / 1000) | 0
    // const oauth_signature_method = "HMAC-SHA1"
    // const oauth_nonce = this.makeid(11)
    // const oauth_version = "1.0"

    // let param = {
    //   "oauth_token": authData.oauth_token,
    //   "oauth_version": oauth_version,
    //   "oauth_nonce": oauth_nonce,
    //   "oauth_timestamp": oauth_timestamp,
    //   "oauth_signature_method": oauth_signature_method,
    //   "oauth_consumer_key": oauth_consumer_key,
    // }

    // var keys = Object.keys(param).sort()

    // let paramStr = ""
    // let character = ""
    // for (var key in keys) {
    //   paramStr = paramStr + character
    //   paramStr = paramStr + keys[key] + "=" + encodeURIComponent(param[keys[key]])
    //   character = "&"
    // }

    // 2: 参数： 把第一步的值进行URIComponent
    // const urlEncode = encodeURIComponent(url)
    // const parmStrEncode = encodeURIComponent(paramStr)

    // // 3: 把 POST/URL/和第二步得到的值 用&连接成字符串
    // const str = "POST&" + urlEncode + "&" + parmStrEncode

    // // 4: _secret
    // const oauth_consumer_secret = encodeURIComponent("1Bz8wwu82C7EGaMM9Wm5L46qspJveYCyMz7ALeEm4ov9hyihd0") + "&" + encodeURIComponent(authData.oauth_token_secret)

    // // 5: 加密 oauth_signature
    // var oauth_signature = CryptoJS.HmacSHA1(str, oauth_consumer_secret).toString(CryptoJS.enc.Base64);
    // const oauth_signature1 = Base64.stringify(hmacSHA1(str, oauth_consumer_secret))
    // const oauth_signature2 = encodeURIComponent(oauth_signature1)

    // const authorization = "OAuth " + "oauth_token=" + authData.oauth_token + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature2

    const userDid = (await this.dataHelper.getSigninData()).did
    const authorization = this.generateAuthorizationForTweetWithAuth1(userDid)
    let header = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      "Authorization": authorization
    }
    const url = TwitterApi.TEWWTS

    let params = {
      "text": text
    }
    console.log("authorization ============= ", authorization)
    console.log("header ============= ", header)
    console.log("url ============= ", url)

    this.http.setDataSerializer('json')
    try {
      const result = await this.http.post(TwitterApi.TEWWTS, params, header)
      console.log("post Tweet With Auth1 ................. success = ", result)
      console.log("post Tweet With Auth1 ................. success = ", result.data)
      Logger.log(TAG, 'post Tweet With Auth1 success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result)
      return result
    }
    catch (error) {
      console.log("post Tweet With Auth1 ................. error = ", error)
      console.log("post Tweet With Auth1 ................. error = ", error.errror)

      Logger.log(TAG, 'post Tweet With Auth1 error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
      throw error
    }
    // .then(data => {
    //   console.log("................. data = ", data)
    //   console.log("................. data = ", data.data)
    //   Logger.log(TAG, 'postTweetOauth1 post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', data)
    //   return data
    // })
    // .catch(error => {
    //   console.log("................. error = ", error)
    //   Logger.log(TAG, 'postTweetOauth1 post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
    //   throw error
    // })
  }

  public async postTweetAndMediaWithAuth1(text: string, mediaId: string) {
    const userDid = (await this.dataHelper.getSigninData()).did
    // const authData = this.dataHelper.getTwitterAuth1TokenData(userDid)

    // console.log("postTweetMedia ---------------------- ")
    // const url = TwitterApi.CREATE
    // const oauth_consumer_key = "oKrTiVZ0fyBL64Aas92XgWhcv"
    // const oauth_token_ = authData.oauth_token
    // const oauth_timestamp = (Date.now() / 1000) | 0
    // const oauth_signature_method = "HMAC-SHA1"
    // const oauth_nonce = this.makeid(11)
    // const oauth_version = "1.0"

    // let param = {
    //   "oauth_token": authData.oauth_token,
    //   "oauth_version": oauth_version,
    //   "oauth_nonce": oauth_nonce,
    //   "oauth_timestamp": oauth_timestamp,
    //   "oauth_signature_method": oauth_signature_method,
    //   "oauth_consumer_key": oauth_consumer_key,
    // }

    // const test = JSON.stringify(param)
    // var keys = Object.keys(param).sort()

    // let paramStr = ""
    // let character = ""
    // for (var key in keys) {
    //   paramStr = paramStr + character
    //   paramStr = paramStr + keys[key] + "=" + encodeURIComponent(param[keys[key]])
    //   character = "&"
    // }

    // // 2: 参数： 把第一步的值进行URIComponent
    // const urlEncode = encodeURIComponent(url)
    // const parmStrEncode = encodeURIComponent(paramStr)

    // // 3: 把 POST/URL/和第二步得到的值 用&连接成字符串
    // const str = "POST&" + urlEncode + "&" + parmStrEncode

    // // 4: _secret
    // const oauth_consumer_secret = encodeURIComponent("1Bz8wwu82C7EGaMM9Wm5L46qspJveYCyMz7ALeEm4ov9hyihd0") + "&" + encodeURIComponent(authData.oauth_token_secret)

    // // 5: 加密 oauth_signature
    // var oauth_signature = CryptoJS.HmacSHA1(str, oauth_consumer_secret).toString(CryptoJS.enc.Base64);
    // const oauth_signature1 = Base64.stringify(hmacSHA1(str, oauth_consumer_secret))
    // const oauth_signature2 = encodeURIComponent(oauth_signature1)

    // const authorization = "OAuth " + "oauth_token=" + authData.oauth_token + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature2
    const authorization = this.generateAuthorizationForTweetAndMediaWithAuth1(userDid)
    let header = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      "Authorization": authorization
    }

    let params = {
      "text": text,
      "media": { "media_ids": [mediaId] }
    }
    const url = TwitterApi.TEWWTS
    this.http.setDataSerializer('json')
    try {
      const result = await this.http.post(url, params, header)
      console.log("post Tweet And Media With Auth1 success ................. data = ", result)
      console.log("post Tweet And Media With Auth1 success ................. data = ", result.data)
      Logger.log(TAG, 'post Tweet And Media With Auth1 success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result)
      return result
    }
    catch (error) {
    /*
    TODO:

error: "{\"detail\":\"You are not allowed to create a Tweet with duplicate content.\",\"type\":\"about:blank\",\"title\":\"Forbidden\",\"status\":403}"

headers: {content-type: "application/json; charset=utf-8", x-rate-limit-limit: "200", x-access-level: "read-write", content-disposition: "attachment; filename=json.json", content-encoding: "gzip", …}

status: 403


[Log] Convert-To-Logger – "post Tweet Media With Auth1 error >>>>>>>>>>>>>>>>>>>>>>>>>>>> " – {status: -6, error: "The Internet connection appears to be offline."} (vendor-es2015.js, line 59129)
[Log] Convert-To-Logger – "post Tweet Media With Auth1 error >>>>>>>>>>>>>>>>>>>>>>>>>>>> " – "The Internet connection appears to be offline." (vendor-es2015.js, line 59129)
    */
      console.log("post Tweet And Media With Auth1 error = ", error)
      console.log("post Tweet And Media With Auth1 error = ", error.error)
      Logger.log(TAG, 'post Tweet And Media With Auth1 error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
      throw error
    }
    // .then(data => {
    //   console.log("................. data = ", data.data)
    //   Logger.log(TAG, 'postTweetMedia post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', data)
    //   return data
    // })
    // .catch(error => {
    //   console.log("................. error = ", error)
    //   Logger.log(TAG, 'postTweetMedia post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
    //   throw error
    // })
  }


  public async postTweetMediaWithAuth1(mediabase64String: string) {

    // const userDid = (await this.dataHelper.getSigninData()).did
    // const authData = this.dataHelper.getTwitterAuth1TokenData(userDid)

    // const url = TwitterApi.MEDIA
    // const oauth_consumer_key = "oKrTiVZ0fyBL64Aas92XgWhcv"
    // const oauth_token_ = authData.oauth_token
    // const oauth_timestamp = (Date.now() / 1000) | 0
    // const oauth_signature_method = "HMAC-SHA1"
    // const oauth_nonce = this.makeid(11)
    // const oauth_version = "1.0"

    // let param = {
    //   "oauth_token": authData.oauth_token,
    //   "oauth_version": oauth_version,
    //   "oauth_nonce": oauth_nonce,
    //   "oauth_timestamp": oauth_timestamp,
    //   "oauth_signature_method": oauth_signature_method,
    //   "oauth_consumer_key": oauth_consumer_key,
    // }

    // const test = JSON.stringify(param)
    // var keys = Object.keys(param).sort()

    // let paramStr = ""
    // let character = ""
    // for (var key in keys) {
    //   paramStr = paramStr + character
    //   paramStr = paramStr + keys[key] + "=" + encodeURIComponent(param[keys[key]])
    //   character = "&"
    // }

    // // 2: 参数： 把第一步的值进行URIComponent
    // const urlEncode = encodeURIComponent(url)

    // // const parmStr = oauth_callback_ + "&" + oauth_consumer_key_ + "&" + oauth_nonce_ + "&" + oauth_signature_method_ + "&" + oauth_timestamp_ + "&" + oauth_version_

    // const parmStrEncode = encodeURIComponent(paramStr)

    // // 3: 把 POST/URL/和第二步得到的值 用&连接成字符串
    // const str = "POST&" + urlEncode + "&" + parmStrEncode

    // // 4: _secret
    // const oauth_consumer_secret = encodeURIComponent("1Bz8wwu82C7EGaMM9Wm5L46qspJveYCyMz7ALeEm4ov9hyihd0") + "&" + encodeURIComponent(authData.oauth_token_secret)

    // // 5: 加密 oauth_signature
    // var oauth_signature = CryptoJS.HmacSHA1(str, oauth_consumer_secret).toString(CryptoJS.enc.Base64);
    // const oauth_signature1 = Base64.stringify(hmacSHA1(str, oauth_consumer_secret))
    // const oauth_signature2 = encodeURIComponent(oauth_signature1)

    // const authorization = "OAuth " + "oauth_token=" + authData.oauth_token + ",oauth_consumer_key=" + oauth_consumer_key + ",oauth_signature_method=" + oauth_signature_method + ",oauth_timestamp=" + oauth_timestamp + ",oauth_nonce=" + oauth_nonce + ",oauth_version=" + oauth_version + ",oauth_signature=" + oauth_signature2

    const userDid = (await this.dataHelper.getSigninData()).did
    const authorization = this.generateAuthorizationForUploadMediaWithAuth1(userDid)

    let header = {
      "Content-Type": "multipart/form-data;",
      "Authorization": authorization
    }

    console.log("mediabase64String ==== ", mediabase64String);

    let formData = new FormData();
    formData.append('media_data', mediabase64String);
    const url = TwitterApi.AUTH1_MEDIA
    this.http.setDataSerializer('multipart')
    try {
      const result = await this.http.sendRequest(url, {
        method: "post",
        data: formData,
        headers: header
      })
      const ddata = JSON.parse(result.data)
      console.log('post Tweet Media With Auth1 success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', result.data)
      const mediaId = ddata.media_id_string // media_id
      console.log('post Tweet Media With Auth1 success >>>>>>>>>>>>>>>>>>>>>>>>>>>> mediaId: ', mediaId)
      return mediaId
    } catch (error) {
      console.log('post Tweet Media With Auth1 error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
      console.log('post Tweet Media With Auth1 error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error.error)
      throw error
    }
    // .then(data => {
    //   console.log('post tweet success >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', data.data)
    //   return data
    // })
    // .catch(error => {
    //   console.log('post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error)
    //   console.log('post tweet error >>>>>>>>>>>>>>>>>>>>>>>>>>>> ', error.error)
    //   return error
    // })
  }
}
