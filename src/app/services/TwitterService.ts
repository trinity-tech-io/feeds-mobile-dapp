import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { ModalController } from '@ionic/angular';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { TwitterApi } from './TwitterApi';
import { Logger } from 'src/app/services/logger';

const TAG: string = 'TwitterService';

@Injectable()
export class TwitterService {
  public loading: any = null;
  constructor(
    public modalController: ModalController,
    private inappBrowser: InAppBrowser,
    private http: HTTP

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

  public fetchTokenFromTwitterUseCode(code) {
    let params = {
      code: code,
      grant_type: TwitterApi.GRANT_TYPE,
      client_id: TwitterApi.CLIENT_ID,
      redirect_uri: TwitterApi.REDIRECT_URI,
      code_verifier: TwitterApi.CODE_VERIFIER
    }
    let header = {}
    this.http.post(TwitterApi.TOKEN, params, header)
      .then(data => {
        const ddata = JSON.parse(data.data)
        Logger.log(TAG, 'auth twitter success: ', data.data)
        const accessToken1 = ddata.access_token
        console.log("accessToken1 ===== ", accessToken1)
        // TODO: 存储TOKEN DATA
      })
      .catch(error => {
        Logger.error(TAG, "auth twitter Error: ", error)
      })
  }

  public openTwitterLoginPage() {
    const target = '_system'
    const options = 'location=no'
    console.log("inappBrowser 开始 >>>>>>>>>>>>>>>>>>>>>>>>>>>> ")
    this.inappBrowser.create(TwitterApi.AUTH, target, options)
  }

  public postTweet(text: string) {
    console.log("post tweet 开始 >>>>>>>>>>>>>>>>>>>>>>>>>>>> ")
    let params = {
      "text": text
    }
    // TODO: 本地取token
    const token = "bearer RGxjQjl1TVZhUGxYVlVDY0NCREtlUDlybFg3YmhPMm53S2Y3RlpMR0tYeVppOjE2NTY5MjE0NDYzMzM6MTowOmF0OjE"
    let header = {
      "Content-Type": "application/json",
      "Authorization": token 
    }
    this.http.setDataSerializer('json')
    this.http.post(TwitterApi.TEWWTS, params, header)
      .then(data => console.log(data))
      .catch(error => console.log(error))
  }
}
