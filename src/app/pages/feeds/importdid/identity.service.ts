import { Injectable } from '@angular/core';
import { Issuer, VerifiablePresentation, JWTHeader, DefaultDIDAdapter, DIDBackend, RootIdentity, Mnemonic, DIDStore, DID, VerifiableCredential, DIDDocument } from '@elastosfoundation/did-js-sdk'
import { Logger } from 'src/app/services/logger'
import { Util } from './util'
import { FileService } from 'src/app/services/FileService';
import { NativeService } from 'src/app/services/NativeService';
import { DIDHelperService } from 'src/app/services/did_helper.service';
import { StorageService } from 'src/app/services/StorageService';
import dayjs from "dayjs"

let TAG: string = 'Feeds-IdentityService'

@Injectable()
export class IdentityService {
    private rootIdentity: RootIdentity = null;
    public mnemonicLanguage: string
    public mnemonicString: string
    public mnemonicPassphrase: string
    public appInstanceDID: string
    public appInstanceDIDPath: string
    public appInstanceDIDStorePass: string
    public userDID: string
    public userDIDStorePath: string
    public userDIDStorePass: string
    private readonly INSTANCE_DID = "feeds-instance-did-info"

    constructor(
        private fileService: FileService,
        private native: NativeService,
        private didHelperService: DIDHelperService,
        private storageService: StorageService,
    ) {
    }

    isMnemonicValid(mnemonic: string): boolean {
        try {
            this.mnemonicString = mnemonic
            this.mnemonicPassphrase = ""

            return Mnemonic.checkIsValid(mnemonic)
        } catch (error) {
            Logger.error(TAG, "mnemonic is Valid: ", error)
            throw error 
        }
    }

    public static getLanguage(mnemonic: string): string {
        return Mnemonic.getLanguage(mnemonic)
    }

    public async startImportingMnemonic(existingMnemonic: string, passphrase: string) {
        let _mnemonic = existingMnemonic
        let _passphrase = passphrase
        if (existingMnemonic === null) {
            _mnemonic = this.mnemonicString
            _passphrase = this.mnemonicPassphrase
        }
        console.log("新流程： 开始 startImportingMnemonic: ", existingMnemonic, _passphrase)
        await this.createStoreAfterImport(_mnemonic, _passphrase)
        console.log("新流程： 结束 startImportingMnemonic ")
    }

    public async createDIDStore(didStoreId = null): Promise<DIDStore> {
        // No ID provided (which is normally the case except for the resolver DID store) -> create one.
        if (!didStoreId)
            didStoreId = Util.uuid(6, 16)

        Logger.log(TAG, "Initializing a new DID Store with ID " + didStoreId)
        try {
            console.log("新流程： 开始 createDIDStore： fileService ======== ", this.fileService)
            const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
            const path = rootDirEntry.fullPath
            this.userDIDStorePath = path + didStoreId
            console.log("新流程： 开始 createDIDStore： didStorePath ======== ", this.userDIDStorePath)
            const didStore = await DIDStore.open(this.userDIDStorePath)
            console.log("新流程： 结束 createDIDStore： didStore ======== ", didStore)
            return didStore
        }
        catch (e) {
            Logger.error(TAG, 'DIDStore create error :', e)
            throw e
        }
    }

    private async createStoreAfterImport(existingMnemonic: string, passphrase: string) {
        Logger.log(TAG, "Create store after import")
        console.log("新流程： 开始 createStoreAfterImport existingMnemonic ======== ", existingMnemonic, passphrase)

        let didStore = await this.createDIDStore()
        Logger.log(TAG, 'Getting didStore', didStore)
        const currentNet = "mainnet"
        if (!DIDBackend.isInitialized()) {
            DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
        }
        // Generate a random password
        this.userDIDStorePass = "TODO:generateRandomPassword"
        this.rootIdentity = RootIdentity.createFromMnemonic(existingMnemonic, passphrase, didStore, this.userDIDStorePass, false)
        didStore.setDefaultRootIdentity(this.rootIdentity)
        // Synchronize the store with chain
        Logger.log(TAG, "Synchronizing identities")

        // await this.native.showLoading("common.waitMoment");

        try {
            try {
                await didStore.synchronize()
            }
            catch (e) {
                Logger.error(TAG, "Synchronizing exception", e)
                // Special case - "invalid signature" during synchronize - bug of getdids.com DIDs.
                // Recommend user to create a new DID
                if (e) {
                    let message = e.message ? new String(e.message) : new String(e)
                    if (message.indexOf("signature mismatch") > 0) {
                        Logger.error(TAG, "Corrupted user DID, synchronize() has failed. Need to create a new DID")

                        // this.native.hideLoading()
                        // TODO: ERROR
                        return
                    }
                }
                else {
                    throw e
                }
            }
            // this.native.hideLoading()
            let dids = await didStore.listDids()
            console.log("新流程：-1 开始 createStoreAfterImport dids ======== ", dids)

            // Check if we could retrieve a DID or not.
            if (dids.length > 0) {
                console.log("新流程：-2 开始 createStoreAfterImport dids ======== ", dids)
                // We could sync at least one DID from chain
                Logger.log(TAG, dids.length + " DIDs could be retrieved on chain")

                if (dids.length === 1) {
                    Logger.log(TAG, "Exactly one DID was synced. Using this one directly.")
                    console.log("新流程：-3 开始 createStoreAfterImport dids ======== ", dids)
                    // Exactly one DID was synced, so we directly use this one
                    let createdDID = dids[0]
                    Logger.log(TAG, "did = ", createdDID)
                    this.userDID = createdDID.toString()
                    const json = {
                        did: this.userDID,
                        mnemonic: existingMnemonic,
                        mnemonicPass: passphrase,
                        didStorePath: this.userDIDStorePath,
                        didStorePassword: this.userDIDStorePass
                    }
                    console.log(createdDID.toString(), " json ==== ", json)
                    await this.storageService.set(createdDID.toString(), JSON.stringify(json))
                    console.log(" signInData-new ==== ", createdDID.toString())
                    console.log(" this.storageService ==== ", this.storageService)
                    await this.storageService.set("signInData-new", createdDID.toString())
                    console.log("新流程： 结束 createStoreAfterImport ")
                    await this.continueImportAfterCreatedDID(didStore, this.userDIDStorePass, createdDID, true);
                }
                else {
                    Logger.log(TAG, "More than one DID was synced, asking user to pick one");
                    console.log("新流程：-11 error: createStoreAfterImport: More than one DID was synced ======== ")
                    // More than one did was synced. Ask user which one he wants to keep during this import,
                    // as for now we only allow one import at a time.
                    // TODO: MOER DIDS
                }
            }
            else {
                // No DID could be retrieved, so we need to create one.
                Logger.log('didsessions', "No DID found on chain. Creating a new one.");
                console.log("新流程：-12 结束 No DID found on chain. ")
                // TODO: show popup to user to tell him that no identity could be retrieved on chain, and that he can
                // create a new profile
                // TODO: 
            }
        }
        catch (e) {
            // this.native.hideLoading()
            let reworkedEx = e ? e : "No specific information"
            console.log("新流程：-13 error: No specific information. ", e)
            Logger.error(TAG, 'createStoreAfterImport error', reworkedEx)
            throw e
        }
    }

    private async continueImportAfterCreatedDID(didStore: DIDStore, storePassword: string, createdDID: DID, deleteDIDStoreOnError: boolean) {
        Logger.log(TAG, 'Checking all identities if import is already added', "TODO: ")
        let duplicate = false // TODO: 去重

        if (!duplicate) {
            let credentials = await didStore.listCredentials(createdDID)
            let nameDidURL = null
            for (let index = 0; index < credentials.length; index++) {
                const cre = credentials[index]
                const creF = cre.getFragment()
                if (creF == "name") { // TODO: #name
                    nameDidURL = cre
                }
            }
            let profileName = null
            if (nameDidURL != null) {
                let nameCredential = await didStore.loadCredential(nameDidURL)
                const sub = nameCredential.getSubject()
                profileName = sub.getProperty("name")
            }
            if (profileName) {
                Logger.log(TAG, "Name credential found in the DID. Using it.")
                Logger.log(TAG, "profileName = ", profileName)
            }
            else {
                // No existing name credential found in the DID, so we need to ask user to give us one
                Logger.log(TAG, "No name credential found in the DID. Asking user to provide one.")
                // TODO: 
            }
        }
        else {
            Logger.log(TAG, 'New DID is already added')
            // TODO: 
        }
    }

    async loadProfiles(): Promise<string> {
        const userDIDStore = await DIDStore.open(this.userDIDStorePath)
        let credentials = await userDIDStore.listCredentials(this.userDID)
        let nameDidURL = null
        let emailDidURL = null
        let telephoneDidURL = null
        let nationDidURL = null
        let nicknameDidURL = null
        let descriptionDidURL = null
        for (let index = 0; index < credentials.length; index++) {
            const cre = credentials[index]
            const creF = cre.getFragment()
            if (creF == "name") { // TODO: #name
                nameDidURL = cre
            }
            else if (creF == "email") {
                emailDidURL = cre
            }
            else if (creF == "telephone") {
                telephoneDidURL = cre
            }
            else if (creF == "nation") {
                nationDidURL = cre
            }
            else if (creF == "nickname") {
                nicknameDidURL = cre
            }
            else if (creF == "description") {
                descriptionDidURL = cre
            }
        }
        let profileName = null
        let profileEmail = null
        let profileTelephone = null
        let profileNation = null
        let profileNickname = null
        let profileDescription = null
        if (nameDidURL != null) {
            let nameCredential = await userDIDStore.loadCredential(nameDidURL)
            const sub = nameCredential.getSubject()
            profileName = sub.getProperty("name")
        }
        if (emailDidURL != null) {
            let emailCredential = await userDIDStore.loadCredential(emailDidURL)
            const sub = emailCredential.getSubject()
            profileEmail = sub.getProperty("email")
        }
        if (telephoneDidURL != null) {
            let telephoneCredential = await userDIDStore.loadCredential(telephoneDidURL)
            const sub = telephoneCredential.getSubject()
            profileTelephone = sub.getProperty("telephone")
        }
        if (nationDidURL != null) {
            let nationCredential = await userDIDStore.loadCredential(nationDidURL)
            const sub = nationCredential.getSubject()
            profileNation = sub.getProperty("nation")
        }
        if (nicknameDidURL != null) {
            let nicknameCredential = await userDIDStore.loadCredential(nicknameDidURL)
            const sub = nicknameCredential.getSubject()
            profileNickname = sub.getProperty("nickname")
        }
        if (descriptionDidURL != null) {
            let descriptionCredential = await userDIDStore.loadCredential(descriptionDidURL)
            const sub = descriptionCredential.getSubject()
            profileDescription = sub.getProperty("description")
        }
        console.log("新：createdDID= ", this.userDID)
        console.log("新：profileName= ", profileName)
        console.log("新：profileEmail= ", profileEmail)
        console.log("新：profileTelephone= ", profileTelephone)
        console.log("新：profileNation= ", profileNation)
        console.log("新：profileNickname= ", profileNickname)
        console.log("新：profileDescription= ", profileDescription)

        const json = {
            userDID: this.userDID,
            profileName: profileName,
            profileEmail: profileEmail,
            profileTelephone: profileTelephone,
            profileNation: profileNation,
            profileNickname: profileNickname,
            profileDescription: profileDescription,
        }
        return JSON.stringify(json)
    }

    async generateHiveAuthPresentationJWT(authChallengeJwttoken: string): Promise<string> {
        Logger.log(TAG, 'Starting process to generate auth presentation JWT, authChallengeJwttoken is ', authChallengeJwttoken)
        if (!authChallengeJwttoken) {
            return
        }
        // Parse, but verify on chain that this JWT is valid first
        let jwtResult = null;
        try {
            jwtResult = await this.didHelperService.parseJWT(authChallengeJwttoken);
            Logger.log(TAG, 'JWT json result is', JSON.stringify(jwtResult));
        } catch (error) {
            Logger.warn(TAG, 'Generate HiveAuth Presentation JWT Parse JWT error,', error)
            throw error
        }

        Logger.log(TAG, 'Parse JWT Result is', jwtResult)
        if (!jwtResult) {
            return
        }

        const body = this.didHelperService.getJWTBody(jwtResult)
        const payload = body.getJWTPayload()

        // The request JWT must contain iss and nonce fields
        if (!('iss' in payload) || !('nonce' in payload)) {
            return
        }

        // Generate a authentication presentation and put the credential + back-end info such as nonce inside

        let realm = payload['iss'] as string
        let nonce = payload['nonce'] as string
        let name = (payload['name'] as string) || ''
        const instanceDid = await this.getOrCreateAppInstanceDID()
        if (!instanceDid) {
            const msg = 'Get or create app instance did error'
            Logger.warn(TAG, msg)
            return
        }
        const vp = await this.createVerifiablePresentation(realm, nonce)
        const token = await this.createjwtToken(vp)

        return token
    }

    async createVerifiablePresentation(realm: string, nonce: string): Promise<VerifiablePresentation> {
        const userDIDStore = await DIDStore.open(this.userDIDStorePath)
        const userDidDocument = await userDIDStore.loadDid(this.userDID)
        const appinstanceDIDStore = await DIDStore.open(this.appInstanceDIDPath)
        const appinstanceDIDDocument = await this.getOrCreateAppInstanceDIDDocument()
        let builder = DIDDocument.Builder.newFromDocument(appinstanceDIDDocument).edit()

        const issuer = new Issuer(userDidDocument)
        let cb = issuer.issueFor(this.appInstanceDID)
        let props = {
            appDid: "did:elastos:iqtWRVjz7gsYhyuQEb1hYNNmWQt1Z9geXg",
            appInstanceDid: this.appInstanceDID,
        };
        try {
            const did = this.appInstanceDID + "#app-id-credential"
            let vc = await cb.id(did)
                .type("AppIdCredential")
                .properties(props)
                .seal(this.userDIDStorePass)
            await builder.addCredential(vc)
            let vpb = await VerifiablePresentation.createFor(this.appInstanceDID, null, appinstanceDIDStore)
            const vp = await vpb.credentials(vc)
            .realm(realm)
            .nonce(nonce)
                .seal(this.appInstanceDIDStorePass)
            return vp
        } catch (error) {
            throw error
        }
    }

    async issueAppIdCredentialFor() {

    }

    async createjwtToken(vp: VerifiablePresentation): Promise<string> {
        const appinstanceDidStore = await DIDStore.open(this.appInstanceDIDPath)
        const appinstanceDIDDocument = await appinstanceDidStore.loadDid(this.appInstanceDID)
        let cal = dayjs()
        let iat = cal.unix()
        let nbf = cal.add(-1, 'month').unix()
        let exp = cal.add(4, 'month').unix()
        const token = appinstanceDIDDocument.jwtBuilder()
            .addHeader(JWTHeader.TYPE, JWTHeader.JWT_TYPE)
            .addHeader(JWTHeader.CONTENT_TYPE, "json")
            .setIssuer(this.appInstanceDID)
            .setIssuedAt(iat)
            .setExpiration(exp)
            .claimsWithJson("presentation", vp.toString())
            .sign(this.appInstanceDIDStorePass)

        return token
    }

    async getOrCreateAppInstanceDIDDocument(): Promise<DIDDocument> {
        await this.getOrCreateAppInstanceDID()
        console.log("新流程： 开始 getOrCreateAppInstanceDIDDocument appInstanceDIDPath = ", this.appInstanceDIDPath)
        const didstore = await DIDStore.open(this.appInstanceDIDPath)
        const appinstanceDocument = await didstore.loadDid(this.appInstanceDID)
        console.log("新流程： 结束 getOrCreateAppInstanceDIDDocument ： appinstanceDocument = ", appinstanceDocument)
        return appinstanceDocument
    }

    async getOrCreateAppInstanceDID(): Promise<string> {
        console.log("新流程： 开始 getOrCreateAppInstanceDID")
        const existing = await this.getExistingAppInstanceDID()
        if (existing == null || existing == undefined) {
            return await this.createNewAppInstanceDID()
        }
        console.log("新流程： 结束 getOrCreateAppInstanceDID existing = ", existing)
        return existing
    }

    async getExistingAppInstanceDID(): Promise<string> {
        console.log("新流程： 开始 getExistingAppInstanceDID")

        if (this.appInstanceDID == null || this.appInstanceDID == undefined) {
            const instanceDidString = await this.storageService.get(this.INSTANCE_DID)
            if (instanceDidString == null || instanceDidString == undefined) {
                return null
            }
            const instanceDid = JSON.parse(instanceDidString)
            this.appInstanceDID = instanceDid["did"]
            this.appInstanceDIDStorePass = instanceDid["didStorePassword"]
            this.appInstanceDIDPath = instanceDid["didStorePath"]
            console.log("新流程： 结束 getExistingAppInstanceDID did = ", this.appInstanceDID)
            return this.appInstanceDID
        }
        console.log("新流程： 结束 getExistingAppInstanceDID existing = ", this.appInstanceDID)

        return this.appInstanceDID
    }

    async createNewAppInstanceDID(): Promise<string> {
        console.log("新流程： 开始 createNewAppInstanceDID")
        const didStoreId = Util.uuid(6, 16)
        const rootDirEntry = await this.fileService.resolveLocalFileSystemURL()
        const path = rootDirEntry.fullPath
        this.appInstanceDIDPath = path + didStoreId
        console.log("新流程： 开始 createNewAppInstanceDID: appInstanceDIDPath = ", this.appInstanceDIDPath)

        const didStore = await DIDStore.open(this.appInstanceDIDPath)
        const mn = Mnemonic.getInstance()
        let mnemonic = mn.generate()
        const passphrase = ""
        this.appInstanceDIDStorePass = "TODO:"
        // Initialize the root identity.
        const appInstanceIdendity = RootIdentity.createFromMnemonic(mnemonic, passphrase, didStore, this.appInstanceDIDStorePass)
        const currentNet = "mainnet"
        if (!DIDBackend.isInitialized()) {
            DIDBackend.initialize(new DefaultDIDAdapter(currentNet))
        }
        didStore.setDefaultRootIdentity(appInstanceIdendity)
        const did = appInstanceIdendity.getDefaultDid()
        this.appInstanceDID = did.toString()
        const doc = await appInstanceIdendity.newDid(this.appInstanceDIDStorePass)
        await didStore.storeDid(doc)
        const json = {
            did: this.appInstanceDID,
            mnemonic: mnemonic,
            mnemonicPass: passphrase,
            didStorePath: this.appInstanceDIDPath,
            didStorePassword: this.appInstanceDIDStorePass
        }
        await this.storageService.set(this.INSTANCE_DID, JSON.stringify(json))
        console.log("新流程： 结束 createNewAppInstanceDID: json ==== ", json)
        return this.appInstanceDID
    }
}