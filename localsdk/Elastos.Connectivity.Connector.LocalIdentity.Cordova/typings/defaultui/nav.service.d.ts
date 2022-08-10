import type { NavigatedView } from "./navigatedview";
import type { ViewType } from "./viewtype";
declare class NavService {
    activeView: NavigatedView;
    constructor();
    navigateTo(viewType: ViewType, params?: any): void;
}
export declare const navService: NavService;
export {};
