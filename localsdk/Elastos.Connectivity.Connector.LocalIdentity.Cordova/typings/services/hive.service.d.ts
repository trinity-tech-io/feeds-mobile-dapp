/// <reference types="@elastosfoundation/elastos-cordova-plugin-hive" />
declare class HiveService {
    private availableHideNodeProviders;
    private hiveClient;
    constructor();
    getHiveClient(forceNewClient?: boolean): Promise<HivePlugin.Client>;
    getUserVault(forceNewClient?: boolean): Promise<HivePlugin.Vault>;
    /**
     * Returns a random hive node address among the nodes that we can choose as default quick start
     * vault provider for new users.
     */
    getRandomQuickStartHiveNodeAddress(): string;
    /**
     * Makes hive vault ready for the current user.
     */
    prepareHiveVault(): Promise<boolean>;
}
export declare const hiveService: HiveService;
export {};
