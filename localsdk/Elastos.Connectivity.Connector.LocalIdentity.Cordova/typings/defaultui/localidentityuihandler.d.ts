/// <reference types="@elastosfoundation/elastos-cordova-plugin-did" />
import type { ILocalIdentityUIHandler } from "../interfaces/ilocalidentityuihandler";
import type { DID } from "@elastosfoundation/elastos-connectivity-sdk-cordova";
declare class LocalIdentityUIHandler implements ILocalIdentityUIHandler {
    private localIdentityModalShown;
    private genericModalContainer;
    constructor();
    private showRootComponentInModal;
    /**
     * Show the local identity creation popup / flow / steps
     */
    showCreateIdentity(): Promise<void>;
    showRequestGetCredentials(query: DID.GetCredentialsQuery): Promise<DIDPlugin.VerifiablePresentation>;
    showRequestIssueAppIDCredential(appInstanceDID: string, appDID: string): Promise<DIDPlugin.VerifiableCredential>;
    showManageIdentity(): Promise<void>;
}
export declare const localIdentityUIHandler: LocalIdentityUIHandler;
export {};
