import { Injectable } from '@angular/core';
import { Claims, DIDDocument, JWTParserBuilder, JWT, DID, DIDURL, DIDBackend, DefaultDIDAdapter, JSONObject, VerifiableCredential, VerifiablePresentation, JWTHeader } from '@elastosfoundation/did-js-sdk';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from './logger';

let TAG: string = 'Feeds-DIDHelperService';


@Injectable()
export class DIDHelperService {
  constructor(private translate: TranslateService) {
    // const currentNet = "MainNet".toLowerCase();
    // DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
  }

  resolveDidDocument(didString: string): Promise<DIDDocument> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDID = DID.from(didString)
        const userDIDDocument = await userDID.resolve()
        resolve(userDIDDocument);
      } catch (error) {
        reject(error);
      }
    });
  }

  getCredential(didString: string, credentialId: string | DIDURL): Promise<VerifiableCredential> {
    return new Promise(async (resolve, reject) => {
      try {
        const didDocument = await this.resolveDidDocument(didString);
        const credential = didDocument.getCredential(credentialId);
        resolve(credential);
      } catch (error) {
        reject(error);
      }
    });
  }

  getCredentials(verifiablePresentation: VerifiablePresentation): VerifiableCredential[] {
    return verifiablePresentation.getCredentials();
  }

  parseVerifiableCredentials(vpJson: string): VerifiablePresentation {
    return VerifiablePresentation.parse(vpJson);
  }

  resolveDid() {
  }

  resolveDidObjectForName(didString: string): Promise<{ name: string }> {
    return new Promise(async (resolve, reject) => {
      const emptyName = { name: '' };
      if (!didString) {
        Logger.warn(TAG, 'Did empty');
        resolve(emptyName);
        return;
      }
      try {
        const didDocument = await this.resolveDidDocument(didString);

        if (!didDocument) {
          Logger.warn(TAG, 'Get DIDDocument from did error');
          resolve(emptyName);
          return;
        }

        const nameCredential = didDocument.getCredential("#name");
        if (!nameCredential) {
          Logger.warn(TAG, 'Get name credential from did error');
          resolve(emptyName);
          return;
        }

        const nameSubject = nameCredential.getSubject() || null;
        if (!nameSubject) {
          Logger.warn(TAG, 'Get name subject from did error');
          resolve(emptyName);
          return;
        }
        const name = nameSubject.getProperty('name');

        let resultObjcet = { "name": name };
        resolve(resultObjcet);
      } catch (error) {
        const errorMsg = 'Resolve DidDocument error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }


  decodeSignInData(presentationJson: string): { did: string, name: string, avatar: string, email: string, telephone: string, nation: string, nickname: string, description: string } {
    try {
      const vp = this.parseVerifiableCredentials(presentationJson);
      const did = vp.getHolder().toString();
      const credentials = this.getCredentials(vp);
      const interests = this.findCredentialValueById(credentials, 'interests', '');
      const desc = this.findCredentialValueById(credentials, 'description', '');
      let description = this.translate.instant('DIDdata.NoDescription');

      if (desc !== '') {
        description = desc;
      } else if (interests != '') {
        description = interests;
      }

      const notProvidedValue = this.translate.instant('DIDdata.Notprovided');
      const name = this.findCredentialValueById(credentials, 'name', notProvidedValue);
      const avatar = this.findCredentialValueById(credentials, 'avatar', notProvidedValue);
      const email = this.findCredentialValueById(credentials, 'email', notProvidedValue);
      const telephone = this.findCredentialValueById(credentials, 'telephone', notProvidedValue);
      const nation = this.findCredentialValueById(credentials, 'nation', notProvidedValue);
      const nickname = this.findCredentialValueById(credentials, 'nickname', '');
      return { did: did, name: name, avatar: avatar, email: email, telephone: telephone, nation: nation, nickname: nickname, description: description };
    } catch (error) {
      Logger.error(TAG, 'Decode signin data error', error);
      return null;
    }
  }

  findCredentialValueById(credentials: VerifiableCredential[], fragment: string, defaultVault: string): string {
    let matchingCredential = credentials.find(c => {
      const didUrl = c.getId();
      if (didUrl) {
        return didUrl.getFragment() == fragment;
      }
    });

    if (!matchingCredential)
      return defaultVault;
    else
      return matchingCredential.getSubject().getProperty(fragment);
  }

  parseJWT(token: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const parserBuilder = new JWTParserBuilder().setAllowedClockSkewSeconds(300);
        const parser = parserBuilder.build();
        const jwtResult: JWT = await parser.parse(token);
        resolve(jwtResult);
      } catch (error) {
        Logger.error(TAG, 'Parse jwt error', error);
        reject(error);
      }
    });
  }

  getJWTBody(jwt: JWT): Claims {
    return jwt.getBody();
  }

  getJWTHeader(jwt: JWT): JWTHeader {
    return jwt.getHeader();
  }
}