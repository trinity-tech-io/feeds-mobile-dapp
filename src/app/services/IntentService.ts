import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { NgZone } from '@angular/core';
import { NativeService } from '../services/NativeService';
import { LanguageService } from 'src/app/services/language.service';
import { ThemeService } from './../services/theme.service';
import { DataHelper } from './../services/DataHelper';
import { TranslateService } from '@ngx-translate/core';
import { UtilService } from 'src/app/services/utilService';
import { HttpService } from './HttpService';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import { TwitterService } from 'src/app/services/TwitterService';
import { RedditService } from 'src/app/services/RedditService';

let TAG: string = 'IntentService';
declare let intentManager: IntentPlugin.IntentManager;

@Injectable()
export class IntentService {
  private static BASEURL_CHANNEL: string = 'https://feeds.trinity-feeds.app/v3channel';
  private static BASEURL_POST: string = 'https://feeds.trinity-feeds.app/v3post';
  private static BASEURL_PASAR: string = 'https://feeds.trinity-feeds.app/pasar';
  private static BASEURL_NAV: string = 'https://feeds.trinity-feeds.app/nav';
  private static BASEURL_SHORTEN: string = 'https://s.trinity-feeds.app/api/v2/action/shorten?key=9fa8ef7f86a28829f53375abcb0af5';
  private static BASEURL_TWITTER: string = "https://feeds.trinity-feeds.app/login-from-twitter"
  private static BASEURL_REDDIT: string = "https://feeds.trinity-feeds.app/reddit"


  constructor(
    private redditService: RedditService,
    private twitterService: TwitterService,
    private zone: NgZone,
    private native: NativeService,
    private languageService: LanguageService,
    public theme: ThemeService,
    private dataHelper: DataHelper,
    private translate: TranslateService,
    private httpService: HttpService,
    private nftContractHelperService: NFTContractHelperService) { }

  share(title: string, content: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      Logger.log(TAG, "Shared title is ", title, " &url is", content);
      try {
        let res = await intentManager.sendIntent('share', {
          title: this.translate.instant(title),
          url: content,
        });

        if (res) {
          resolve(res);
          return;
        }
        let error: string = 'Share error, result is ' + JSON.stringify(res);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  private credaccess(params: any): Promise<any> {
    let url = 'https://did.elastos.net/credaccess';
    Logger.log(TAG, 'Call intent credaccess result is params', params, url);
    return intentManager.sendIntent(
      url,
      params,
    );
  }

  credaccessWithParams(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let params = {
        claims: {
          name: true,
          avatar: {
            required: false,
            reason: 'For profile picture',
          },
          email: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          gender: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          telephone: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          nation: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          nickname: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          description: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
          interests: {
            required: false,
            reason: 'Maybe Feeds dapp need',
          },
        },
      };

      try {
        let response = await this.credaccess(params);
        if (response && response.result && response.result.presentation) {
          let data = response.result;
          resolve(data);
          return;
        }
        let error = 'Credaccess error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  credaccessWithoutParams(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {};

      try {
        let response = await this.credaccess(params);
        if (response && response.result && response.result.presentation) {
          let presentation = response.result.presentation;
          resolve(presentation);
          return;
        }
        let error = 'Credaccess error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  didtransaction(payload: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {
        didrequest: JSON.parse(payload),
      };
      let url = 'https://did.elastos.net/didtransaction';
      try {
        Logger.log(TAG, 'Call intent didtransaction result is params', params, url);
        let response = await intentManager.sendIntent(
          url,
          params,
        );
        Logger.log(TAG, 'Call intent didtransaction result is ', response);
        if (response) {
          resolve(response);
          return;
        }

        let error =
          'DIDtransaction error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  credissue(
    did: string,
    serverName: string,
    serverDesc: string,
    elaAddress: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {
        identifier: 'credential', // unique identifier for this credential
        types: ['BasicProfileCredential'], // Additional credential types (strings) such as BasicProfileCredential.
        subjectdid: did, // DID targeted by the created credential. Only that did will be able to import the credential.
        properties: {
          name: serverName,
          description: serverDesc,
          elaAddress: elaAddress,
        },
        expirationdate: new Date(2024, 10, 10).toISOString(),
      };

      try {
        let response = await intentManager.sendIntent(
          'https://did.elastos.net/credissue',
          params,
        );
        if (response && response.result && response.result.credential) {
          let credential = response.result.credential;
          resolve(credential);
          return;
        }

        let error = 'Credissue error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  pay(receiver: string, amount: number, memo: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {
        receiver: receiver,
        amount: amount,
        memo: memo,
      };

      try {
        let response = await intentManager.sendIntent(
          'https://wallet.elastos.net/pay',
          params,
        );
        if (response) {
          resolve(response);
          return;
        }

        let error = 'Pay error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  promptpublishdid(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let params = {};

      try {
        let response = await intentManager.sendIntent(
          'https://did.elastos.net/promptpublishdid',
          params,
        );
        if (response) {
          resolve(response);
          return;
        }

        let error = 'Pay error response is ' + JSON.stringify(response);
        Logger.error(TAG, error);
        reject(error);
      } catch (error) {
        Logger.error(TAG, error);
        reject(error);
      }
    });
  }

  addIntentListener(callback: (intentResult: IntentPlugin.ReceivedIntent) => void) {
    intentManager.addIntentListener(callback);
  }

  async dispatchIntent(receivedIntent: IntentPlugin.ReceivedIntent) {

    const signinData = await this.dataHelper.getSigninData();
    if (!signinData) {
      Logger.log(TAG, "Not signin");
      this.native.setRootRouter(['/signin']);
      return;
    }
    Logger.log(TAG, "Intent received, now dispatching to listeners", receivedIntent);

    const action = receivedIntent.action;
    const params = receivedIntent.params;

    switch (action) {
      case IntentService.BASEURL_REDDIT:
        this.handleRedditIntent(params)
        break;
      case IntentService.BASEURL_TWITTER:
        this.handleTwitterIntent(params)
        break;
      case IntentService.BASEURL_CHANNEL:
        this.handleChannelIntent(params);
        break;
      case IntentService.BASEURL_POST:
        this.handlePostIntent(params);
        break;
      case IntentService.BASEURL_PASAR:
        this.handlePasarIntent(params);
        break;
      case IntentService.BASEURL_NAV:
        // https://feeds.trinity-feeds.app/nav/?page=home
        break;
      default:
        this.native.toast('toast.linkageInvalidParams');
        break;
    }
  }



  onMessageReceived(msg: IntentPlugin.ReceivedIntent) {
    Logger.log(TAG, 'Received intent ', msg);
    var params: any = msg.params;
    if (typeof params == 'string') {
      try {
        params = JSON.parse(params);
      } catch (e) {
      }
    }

    if (msg.action === 'currentLocaleChanged') {
      this.zone.run(() => {
        this.setCurLang(params.data);
      });
    }

    //TO be check
    if (
      msg.action === 'preferenceChanged' &&
      params.data.key === 'ui.darkmode'
    ) {
      this.zone.run(() => {
        this.theme.setTheme(params.data.value);
      });
    }
  }

  setCurLang(currentLang: string) {
    this.languageService.setCurLang(currentLang);
  }

  async createChannelShareLink(channel: FeedsData.ChannelV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!channel) {
          reject('Share link channel params is null');
          return;
        }

        const destDid: string = channel.destDid || '';
        const channelId: string = channel.channelId || '';

        const url = UtilService.generateChannelShareLink(IntentService.BASEURL_CHANNEL, destDid, channelId);
        Logger.log(TAG, "Shared channel link url is " + url);

        const finalURL = await this.shortenURL(url);
        resolve(finalURL);
        return finalURL;
      } catch (error) {
        reject(error);
      }
    });
  }

  createPostShareLink(post: FeedsData.PostV3): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!post || !post.content) {
          reject('Share link post params is null');
          return;
        }

        const destDid: string = post.destDid;
        const channelId: string = post.channelId;
        const postId: string = post.postId;

        const url = UtilService.generatePostShareLink(IntentService.BASEURL_POST, destDid, channelId, postId);

        Logger.log(TAG, "Shared post link url is " + url);

        const finalURL = await this.shortenURL(url);
        resolve(finalURL);
        return finalURL;
      } catch (error) {
        reject(error);
      }
    });
  }

  async createSharePasarLink(orderId: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let url = IntentService.BASEURL_PASAR
          + "/?orderId=" + orderId

        // let encodeURL = encodeURI(url);
        Logger.log(TAG, "Shared Pasar link url is " + url);

        const finalURL = await this.shortenURL(url);
        resolve(finalURL);
        return finalURL;
      } catch (error) {
        reject(error);
      }
    });
  }

  createSharePostTitle(post: FeedsData.PostV3): string {
    if (!post) {
      return '';
    }

    const content = post.content || null;

    if (!content) {
      return '';
    }

    let postText: string = content.content || '';

    if (postText.replace(/(^[\s\n\t]+|[\s\n\t]+$)/g, "") == '')
      return this.translate.instant("common.sharesharingPost");

    let brief: string = UtilService.briefText(postText, 30);
    return brief + this.translate.instant("common.shareReadMore");
  }

  createSharePasarTitle(): string {
    return this.translate.instant("common.sharePasar");
  }

  createShareChannelTitle(destDid: string, channelId: string, channel: FeedsData.ChannelV3): string {
    // const key = this.dataHelper.getKey(destDid, channelId, "0", 0);
    // const channel = this.dataHelper.getChannel(key);

    const channelName = channel.displayName || channel.name || '';

    if (channelName != '') {
      let code = this.languageService.getCurLang() || "en";
      let des = ""
      if (code === "zh") {
        des = "这是我从Feeds(@ElastosFeeds) 分享的微频 '" + channelName + "'，请订阅后继续阅读 ";
      } else {
        des = "Check out this channel '" + channelName + "' on Feeds(@ElastosFeeds) ";
      }
      return des;
    }
    return this.translate.instant("common.shareSharingChannel");
  }

  async shortenURL(url: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const baseURL = IntentService.BASEURL_SHORTEN;
        let body = {
          "url": url
        }
        let shortURLResponse = await this.httpService.httpPostWithText(baseURL, body);
        Logger.log("ShortURLResponse is", shortURLResponse);
        const shortURL = shortURLResponse.body as string || "";
        resolve(shortURL);
        return shortURL;
      } catch (error) {
        Logger.error("Shorten URL error", error);
        reject(error);
      }
    });
  }

  async handleRedditIntent(params: any) {
    try {
      await this.redditService.getRedditAccessToken(params["code"])
    }
    catch (error) {
      throw error
    }
  }

  async handleTwitterIntent(params: any) {
    try {
      await this.twitterService.getTwitterAccessToken(params["code"])
    }
    catch {
      // TODO:
    }
    // this.native.setRootRouter('ConnectionsPage');
  }

  handleChannelIntent(params: any) {
    const targetDid = decodeURIComponent(params.targetDid);
    const channelId = decodeURIComponent(params.channelId);
    this.native.getNavCtrl().navigateForward(['/channels', targetDid, channelId]);
  }

  handlePostIntent(params: any) {
    const targetDid = decodeURIComponent(params.targetDid);
    const channelId = decodeURIComponent(params.channelId);
    const postId = decodeURIComponent(params.postId);
    this.native.getNavCtrl().navigateForward(['/postdetail', targetDid, channelId, postId]);
  }

  async handlePasarIntent(params: any) {
    Logger.log(TAG, "handlePasarIntent, params", params);
    const orderId = params.orderId;
    let nftOrderId = orderId || '';
    if (nftOrderId == '') {
      this.native.toast("common.orderCantFind");
      return;
    }

    await this.native.showLoading("common.parseing", () => { }, 30000);
    try {
      const orderInfo = await this.nftContractHelperService.getOrderInfo(orderId);

      if (orderInfo.orderState == 2) {
        this.native.toast('common.orderHasBeenSold');
        return;
      }

      if (orderInfo.orderState == 3) {
        this.native.toast('common.orderHasBeenSold');
        return;
      }

      if (orderInfo.orderState != 1) {
        this.native.toast('common.orderInvalid');
      }
      const tokenInfo = await this.nftContractHelperService.getTokenInfo((orderInfo.tokenId).toString(), true);
      let tokenJson = await this.nftContractHelperService.getTokenJson(tokenInfo.tokenUri);
      this.navToBidPage(orderInfo, tokenInfo, tokenJson);
      this.native.hideLoading();
    } catch (error) {
      this.native.hideLoading();
      this.native.toast('common.internalError');
    }
  }

  async navToBidPage(orderInfo: FeedsData.OrderInfo, tokenInfo: FeedsData.TokenInfo, tokenJson: FeedsData.TokenJson) {
    try {
      let item = {
        saleOrderId: orderInfo.orderId,
        tokenId: orderInfo.tokenId,
        asset: tokenJson.image,
        name: tokenJson.name,
        description: tokenJson.description,
        fixedAmount: orderInfo.price,
        kind: tokenJson.kind,
        type: tokenJson.type,
        royalties: tokenInfo.royaltyFee,
        quantity: orderInfo.amount,
        thumbnail: tokenJson.thumbnail,
        sellerAddr: orderInfo.sellerAddr,
        createTime: orderInfo.createTime * 1000,
      };
      item['showType'] = 'buy';

      this.native.navigateForward(['bid'], { queryParams: item });
    } catch (error) {
      Logger.error(TAG, 'Nav to bid page error', error);
    }
  }
}
