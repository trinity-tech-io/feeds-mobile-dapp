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
    if (!url) url = location.search;
    var query = url.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
      var item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }

  public openTwitterLoginPage() {
    const target = '_blank';
    const options = 'location=no';
    console.log("inappBrowser 开始 >>>>>>>>>>>>>>>>>>>>>>>>>>>> ")

    const browser = this.inappBrowser.create(TwitterApi.AUTH, target, options);
    browser.on('loadstart').subscribe(event => {
      console.log("inappBrowser 回调 结果 >>>>>>>>>>>>>>>>>>>>>>>>>>>> ")
      console.log(event.url)
      if (event.url.includes("www.baidu.com")
        && event.url.includes("code=")) {
        browser.hide();
        const codeValue = this.getJsonFromUrl(event.url)["code"];
        let params = {
          code: codeValue,
          grant_type: TwitterApi.GRANT_TYPE,
          client_id: TwitterApi.CLIENT_ID,
          redirect_uri: TwitterApi.REDIRECT_URI,
          code_verifier: TwitterApi.CODE_VERIFIER
        };
        let header = {}
        this.http.post(TwitterApi.TOKEN, params, header)
          .then(data => {
            console.log(data.status);
            console.log(data.data); // data received by server
            console.log(data.headers);
            const ddata = JSON.parse(data.data);
            console.log("ddata ===== ", ddata)
            Logger.log(TAG, 'auth twitter success: ', data.data)
            const accessToken1 = ddata.access_token
            const accessToken2 = ddata['access_token']
            const accessToken3 = ddata["access_token"]
            console.log("accessToken1 ===== ", accessToken1)
            console.log("accessToken2 ===== ", accessToken2)
            console.log("accessToken3 ===== ", accessToken3)
          })
          .catch(error => {
            console.log(error.status);
            console.log(error.error); // error message as string
            console.log(error.headers);
            Logger.error(TAG, "auth twitter Error: ", error)

          });
      }

      console.log("inappBrowser回调 结束 >>>>>>>>>>>>>>>>>>>>>>>>>>>> ")
    }, err => {
      alert("InAppBrowser loadstart Event Error: " + err);
    });
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
