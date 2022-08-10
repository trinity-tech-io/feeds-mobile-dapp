/// <reference types="@elastosfoundation/elastos-cordova-plugin-did" />
export interface ILocalIdentityUIHandler {
    showCreateIdentity(): Promise<void>;
    showManageIdentity(): Promise<void>;
    showRequestGetCredentials(claims: any): Promise<DIDPlugin.VerifiablePresentation>;
    showRequestIssueAppIDCredential(appInstanceDID: string, appDID: string): Promise<DIDPlugin.VerifiableCredential>;
}
