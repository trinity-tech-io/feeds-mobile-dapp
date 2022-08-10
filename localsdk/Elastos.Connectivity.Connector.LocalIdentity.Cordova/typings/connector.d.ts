/// <reference types="@elastosfoundation/elastos-cordova-plugin-did" />
import type { Interfaces, Wallet, DID } from "@elastosfoundation/elastos-connectivity-sdk-cordova";
export declare class LocalIdentityConnector implements Interfaces.Connectors.IConnector {
    name: string;
    constructor();
    getDisplayName(): Promise<string>;
    /**
     * DID API
     */
    getCredentials(query: DID.GetCredentialsQuery): Promise<DIDPlugin.VerifiablePresentation>;
    generateAppIdCredential(appInstanceDID: string, appDID: string): Promise<DIDPlugin.VerifiableCredential>;
    /**
     * Wallet API
     */
    pay(query: Wallet.PayQuery): Promise<Wallet.TransactionResult>;
    voteForDPoS(): Promise<void>;
    voteForCRCouncil(): Promise<void>;
    voteForCRProposal(): Promise<void>;
    sendSmartContractTransaction(payload: any): Promise<string>;
}
