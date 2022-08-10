import type { PersistentInfo } from '../model/persistentinfo.model';
declare class PersistenceService {
    private persistentInfo;
    constructor();
    init(): Promise<void>;
    private createNewPersistentInfo;
    getPersistentInfo(): PersistentInfo;
    savePersistentInfo(persistentInfo: PersistentInfo): Promise<void>;
    reset(): Promise<void>;
}
export declare const persistenceService: PersistenceService;
export {};
