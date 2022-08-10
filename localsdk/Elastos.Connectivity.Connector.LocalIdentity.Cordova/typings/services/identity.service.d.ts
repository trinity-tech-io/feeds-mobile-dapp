/// <reference types="@elastosfoundation/elastos-cordova-plugin-did" />
declare class IdentityService {
    private didAccess;
    constructor();
    /**
     * Tells if the identity is fully ready to use (so we can proceed to real intent requests) or if it needs
     * to be setup first.
     */
    identityIsFullyReadyToUse(): Promise<boolean>;
    /**
     * Tells if the DID is published and confirmed. Hive doesn't need to be ready yet.
     */
    identityIsPublished(): Promise<boolean>;
    createLocalIdentity(): Promise<void>;
    getLocalDID(): Promise<DIDPlugin.DID>;
    getDIDMnemonic(): Promise<string>;
    /**
     * Queries the DID sidechain to check if the given DID is published or not.
     */
    getIdentityOnChain(didString: string): Promise<DIDPlugin.DIDDocument>;
    /**
     * Publish the DID using assist api
     */
    publishIdentity(): Promise<void>;
    private addRandomHiveToDIDDocument;
    private removeHiveVaultServiceFromDIDDocument;
    private publishDIDOnAssist;
    /**
     * Checks the publication status on the assist API, for a previously saved ID.
     */
    checkPublicationStatusAndUpdate(): Promise<void>;
    /**
     * Resets the whole process as if we were at the beginning.
     */
    resetOnGoingProcess(): Promise<void>;
    private openDidStore;
    private loadLocalDIDDocument;
    /**
     * Generates a semi-"fake" presentation that contains credentials for the required claims.
     * As this is a local identity, we have to emulate everything that's missing with placeholders.
     */
    generatePresentationForClaims(claims: any): Promise<DIDPlugin.VerifiablePresentation>;
    private createCredential;
    createCredaccessPresentation(credentials: DIDPlugin.VerifiableCredential[]): Promise<DIDPlugin.VerifiablePresentation>;
    /**
     * Generates a appid credential for hive authentication, silently
     */
    generateApplicationIDCredential(appinstancedid: string, mainNativeApplicationDID: string): Promise<DIDPlugin.VerifiableCredential>;
    /**
     * Tries to find the best elastos API provider for the current device location. When found, this provider
     * is selected and used as currently active provider.
     */
    autoDetectTheBestProvider(): Promise<void>;
    /**
     * Tries to find the best provider and returns it.
     */
    private _bestProviderEndpoint;
    private findTheBestProvider;
    /**
     * Call a test API on a provider to check its speed in findTheBestProvider().
     * - All errors are catched and not forwarded because we don't want Promise.race() to throw, we
     * want it to resolve the first successful call to answer.
     * - API calls that return errors are resolved with a timeout, to make sure they are considered as
     * "slow" but on the other hand that they resolve one day (we can't stack unresolved promises forever).
     */
    private callTestAPIOnProvider;
    private setResolverUrl;
}
export declare const identityService: IdentityService;
export {};
