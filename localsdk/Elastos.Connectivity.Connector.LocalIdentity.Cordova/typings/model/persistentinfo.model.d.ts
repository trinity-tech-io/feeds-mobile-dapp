import type { DIDPublicationStatus } from "./didpublicationstatus.model";
import type { HiveCreationStatus } from "./hivecreationstatus.model";
/**
 * Model that holds all information we want to store locally for later reuse.
 */
export declare type PersistentInfo = {
    did: {
        storeId: string;
        storePassword: string;
        didString: string;
        publicationStatus: DIDPublicationStatus;
        assistPublicationID: string;
    };
    hive: {
        vaultProviderAddress: string;
        creationStatus: HiveCreationStatus;
    };
};
