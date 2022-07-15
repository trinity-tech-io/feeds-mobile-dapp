import { Injectable } from '@angular/core';
import { DID } from '@elastosfoundation/elastos-connectivity-sdk-cordova';
import { StorageService } from 'src/app/services/StorageService';
import { Logger } from './logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { DIDHelperService } from './did_helper.service';

let TAG: string = 'StandardAuthService';
@Injectable()
export class StandardAuthService {
  private appIdCredential: DIDPlugin.VerifiableCredential = null;
  private appInstanceDID: DIDPlugin.DID
  private appInstanceDIDInfo: {
    storeId: string;
    didString: string;
    storePassword: string;
  }
  constructor(
    private storeService: StorageService,
    private dataHelper: DataHelper,
    private events: Events,
    private didHelperService: DIDHelperService
  ) { }

  getCredentials(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let didAccess = new DID.DIDAccess();
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
        let presentation = await didAccess.getCredentials(params);
        Logger.log(TAG, 'Got credentials result, presentation is', presentation);
        if (presentation) {
          resolve(presentation);
          Logger.log(TAG, 'Got credentials:', presentation);
        } else {
          resolve(null);
          Logger.log(TAG, 'Empty ....', presentation);
        }
      } catch (error) {
        resolve(null);
        Logger.log(TAG, 'error', error);
      }
    });
  }

  getInstanceDIDDoc(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let didAccess = new DID.DIDAccess();
      try {
        let instanceDIDInfo = await didAccess.getOrCreateAppInstanceDID() || null;
        if (instanceDIDInfo != null) {
          let didStore = instanceDIDInfo.didStore || null;
          if (didStore != null) {
            instanceDIDInfo.didStore.loadDidDocument(
              instanceDIDInfo.did.getDIDString(),
              didDocument => {
                resolve(didDocument.toJson());
              },
            );
          } else {
            this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 1 });
          }
        } else {
          this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 1 });
        }
      } catch (error) {
        this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 1 });
        reject(error);
      }

    });
  }

  getNameFromCredential(credentialJson: string): string {
    if (
      credentialJson == null ||
      credentialJson == undefined ||
      credentialJson == ''
    )
      return '';
    try {
      let credential = JSON.parse(credentialJson);
      if (credential == null || credential == undefined || credential == '')
        return '';

      if (
        credential.credentialSubject == null ||
        credential.credentialSubject == undefined ||
        credential.credentialSubject == ''
      )
        return '';

      if (
        credential.credentialSubject.name == null ||
        credential.credentialSubject.name == undefined ||
        credential.credentialSubject.name == ''
      )
        return '';
      return credential.credentialSubject.name;
    } catch (error) {
      Logger.error(TAG, 'Parse local credential error ', error);
    }
  }

  getAppIdCredentialFromStorage(
    appIdCredential: DIDPlugin.VerifiableCredential,
  ): Promise<DIDPlugin.VerifiableCredential> {
    return new Promise(async (resolve, reject) => {
      if (appIdCredential != null && appIdCredential != undefined) {
        Logger.log(TAG, 'Get credential from memory , credential is ', appIdCredential);

        resolve(appIdCredential);
        return;
      }

      let mAppIdCredential = await this.storeService.get('appIdCredential');
      Logger.log(TAG, 'Get credential from storage , credential is ', mAppIdCredential);

      resolve(mAppIdCredential);
    });
  }

  checkAppIdCredentialStatus(
    appIdCredential: DIDPlugin.VerifiableCredential,
  ): Promise<DIDPlugin.VerifiableCredential> {
    return new Promise(async (resolve, reject) => {

      if (this.checkCredentialValid(appIdCredential)) {

        Logger.log(TAG, 'Credential valid , credential is ', appIdCredential);
        resolve(appIdCredential);
        return;
      }

      Logger.warn(TAG, 'Credential invalid, Getting app identity credential');
      let didAccess = new DID.DIDAccess();

      try {
        let mAppIdCredential = await didAccess.getExistingAppIdentityCredential();
        if (mAppIdCredential) {

          Logger.log(TAG, 'Get app identity credential', mAppIdCredential);
          resolve(mAppIdCredential);
          return;
        }

        mAppIdCredential = await didAccess.generateAppIdCredential();

        if (mAppIdCredential) {

          Logger.log(TAG, 'Generate app identity credential, credential is ', mAppIdCredential);
          resolve(mAppIdCredential);
          return;
        }
        this.events.publish(FeedsEvent.PublishType.authEssentialFail, { type: 0 })
        Logger.error(TAG, 'Get app identity credential error, credential is ', mAppIdCredential);
      } catch (error) {
        reject(error);
        Logger.error(TAG, error);
      }
    });
  }

  checkCredentialValid(
    appIdCredential: DIDPlugin.VerifiableCredential,
  ): boolean {
    if (appIdCredential == null || appIdCredential == undefined) {
      return false;
    }

    let currentData = new Date();
    if (appIdCredential.getExpirationDate().valueOf() < currentData.valueOf()) {
      return false;
    }

    return true;
  }

  async getAppId(): Promise<string> {
    let userDid = (await this.dataHelper.getSigninData()).did
    let appid = await this.storeService.get(userDid + 'appDid');
    return appid
  }


  generateHiveAuthPresentationJWT(authChallengeJwttoken: string): Promise<string> {
    return new Promise(async (resolver, reject) => {

      Logger.log(TAG, 'Starting process to generate auth presentation JWT, authChallengeJwttoken is ', authChallengeJwttoken)
      if (!authChallengeJwttoken) {
        reject('Params error');
        return;
      }

      // Parse, but verify on chain that this JWT is valid first
      let jwtResult = null;
      try {
        jwtResult = await this.didHelperService.parseJWT(authChallengeJwttoken);
        Logger.log(TAG, 'JWT json result is', JSON.stringify(jwtResult));
      } catch (error) {
        Logger.warn(TAG, 'Parse JWT error,', error)
        reject(error);
      }

      Logger.log(TAG, 'Parse JWT Result is', jwtResult)
      if (!jwtResult) {
        reject('Parse jwt error, parse result null')
        return;
      }

      const body = this.didHelperService.getJWTBody(jwtResult);
      const payload = body.getJWTPayload();

      // The request JWT must contain iss and nonce fields
      if (!('iss' in payload) || !('nonce' in payload)) {
        reject('The received authentication JWT token does not contain iss or nonce');
        return;
      }

      // Generate a authentication presentation and put the credential + back-end info such as nonce inside
      let nonce = payload['nonce'] as string;
      let realm = payload['iss'] as string;

      let name = (payload['name'] as string) || '';
      let didAccess = new DID.DIDAccess();

      const instanceDid = await didAccess.getOrCreateAppInstanceDID() || null;
      if (!instanceDid) {
        const msg = 'Get or create app instance did error';
        Logger.warn(TAG, msg);
        reject(msg);
        return;
      }

      this.appInstanceDID = instanceDid.did || null;
      if (!this.appInstanceDID) {
        const msg = 'Get did from instnceDid obj error';
        Logger.warn(TAG, msg);
        reject(msg);
        return;
      }

      this.appInstanceDIDInfo = await didAccess.getExistingAppInstanceDIDInfo();
      if (!this.appInstanceDIDInfo) {
        const msg = 'Get Existing App Instance DID Info error';
        Logger.warn(TAG, msg);
        reject(msg);
        return;
      }

      this.appIdCredential = await this.getAppIdCredentialFromStorage(this.appIdCredential);
      this.appIdCredential = await this.checkAppIdCredentialStatus(this.appIdCredential);

      Logger.log(TAG, 'AppIdCredential is ', this.appIdCredential);
      if (!this.appIdCredential) {
        Logger.warn(TAG, 'Empty app id credential')
        resolver(null)
        return
      }

      let userDid = (await this.dataHelper.getSigninData()).did
      await this.storeService.set(userDid + 'appDid', this.appIdCredential.getSubject()["appDid"]);

      this.appInstanceDID.createVerifiablePresentation([this.appIdCredential], realm, nonce, this.appInstanceDIDInfo.storePassword, async presentation => {

        if (presentation) {
          // Generate the back end authentication JWT
          Logger.log(TAG,
            'Opening DID store to create a JWT for presentation:',
            presentation
          );
          let didStore = await DID.DIDHelper.openDidStore(
            this.appInstanceDIDInfo.storeId,
          );

          Logger.log(TAG, 'Loading DID document');
          didStore.loadDidDocument(
            this.appInstanceDIDInfo.didString,
            async didDocument => {
              let validityDays = 2;
              Logger.log(TAG, 'Creating JWT')
              didDocument.createJWT(
                {
                  presentation: JSON.parse(await presentation.toJson()),
                },
                validityDays,
                this.appInstanceDIDInfo.storePassword,
                jwtToken => {
                  Logger.log(TAG, 'JWT created for presentation:', jwtToken)
                  resolver(jwtToken)
                },
                err => {
                  reject(err)
                },
              );
            },
            err => {
              reject(err)
            },
          );
        } else {
          reject('No presentation generated')
        }
      },
        err => {
          Logger.error(TAG, 'Create Verifiable Presentation error', err);
          reject(err);
        })

    })
  }
}
