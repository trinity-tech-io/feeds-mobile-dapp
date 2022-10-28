declare class StorageService {
    constructor();
    setProfile(value: any): Promise<void>;
    getProfile(): Promise<any>;
}
export declare const storageService: StorageService;
export {};
