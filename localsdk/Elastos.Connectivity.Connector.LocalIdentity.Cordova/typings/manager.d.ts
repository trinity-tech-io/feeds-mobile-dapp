declare class LocalIdentityManager {
    /**
     * Triggers the UI interface that allows user to manage his local identity (profile name, export, etc).
     * In case the identity creation is not completed yet, the identity creation UI is displayed.
     */
    manageIdentity(): Promise<void>;
}
export declare const localIdentityManager: LocalIdentityManager;
export {};
