import type { ILocalIdentityUIHandler } from "./interfaces/ilocalidentityuihandler";
import { localIdentityManager as localIdentity } from "./manager";
import { LocalIdentityConnector } from "./connector";
import { persistenceService } from "./services/persistence.service";
export type { ILocalIdentityUIHandler };
export { LocalIdentityConnector, persistenceService, localIdentity };
