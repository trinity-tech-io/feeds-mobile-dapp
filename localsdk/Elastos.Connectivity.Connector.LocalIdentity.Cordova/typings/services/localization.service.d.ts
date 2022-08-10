declare class LocalizationService {
    private activeLanguage;
    private baseLanguages;
    private currentLanguages;
    constructor();
    init(): void;
    /**
     * Sets the active language for all UI items.
     */
    private setLanguage;
    translateInstant(key: string): string;
}
export declare const localizationService: LocalizationService;
export {};
