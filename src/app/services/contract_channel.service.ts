import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import Web3 from 'web3';
import { Config } from './config';
import { Logger } from './logger';

const TAG: string = "ChannelService";
const EstimateGasError = 'EstimateGasError';
type TXData = {
  from: string;
  gasPrice: string;
  gas: number;
  value: any;
}
@Injectable()
export class ChannelContractService {
  private channelAddress: string = Config.CHANNEL_ADDRESS;
  private channelAbi = require('../../assets/contracts/channelRegistryABI.json');
  private web3: Web3;
  private channelContract: any;
  private checkTokenInterval: NodeJS.Timer;
  private checkBurnInterval: NodeJS.Timer;
  private checkUpdateChannelInterval: NodeJS.Timer;
  private checkTokenNum: number = 0;
  private checkBurnNum: number = 0;
  private checkUpdateChannelNum: number = 0;

  constructor(
    private walletConnectControllerService: WalletConnectControllerService,
  ) {
    this.init();
  }

  init() {
    this.web3 = this.walletConnectControllerService.getWeb3();
    if (!this.web3) return;
    this.channelContract = new this.web3.eth.Contract(
      this.channelAbi,
      this.channelAddress,
    );
  }

  setTestMode(testMode: boolean) {
    if (testMode) {
      this.channelAddress = Config.CHANNEL_TEST_ADDRESS;
      return;
    }
    this.channelAddress = Config.CHANNEL_ADDRESS;
  }

  getChannel() {
    return this;
  }

  getChannelAddress() {
    return this.channelAddress;
  }

  async getCategoryList() {
    return await this.channelContract.methods
      .getCategoryList()
      .call()
  }

  async isValidChannelId(tokenId: string) {
    return await this.channelContract.methods
      .isValidChannelId(tokenId)
      .call()
  }

  async owner() {
    return await this.channelContract.methods
      .owner()
      .call()
  }

  async createTxParams(data) {
    return new Promise(async (resolve, reject) => {
      try {
        let accountAddress = this.walletConnectControllerService.getAccountAddress();
        let txGas = 0;

        const txData = {
          from: this.walletConnectControllerService.getAccountAddress(),
          to: this.channelAddress,
          value: 0,
          data: data,
        };
        Logger.log(TAG, 'Create Tx Params is', txData);

        await this.web3.eth.estimateGas(txData, (error, gasResult) => {
          txGas = gasResult;
          Logger.log(TAG, 'EstimateGas finish ,gas is', txGas, ', error is', error);
        });
        if (!txGas || txGas == 0) {
          Logger.error(TAG, EstimateGasError);
          reject(EstimateGasError);
          return;
        }
        Logger.log(TAG, 'Finnal gas is', txGas);

        let gasPrice = await this.web3.eth.getGasPrice();
        let txResult: TXData = {
          from: accountAddress,
          // to: chanelAddr,
          gasPrice: gasPrice,
          gas: Math.round(txGas * 3),
          value: 0,
        };
        resolve(txResult);
      } catch (error) {
        Logger.log(TAG, 'error', error);
        reject(EstimateGasError);
      }
    });
  }

  async mint(
    tokenId: string,
    tokenURI: string,
    channelEntry: string,
    receiptAddr: string,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        Logger.log(TAG, 'Mint params ', tokenId, tokenURI, channelEntry, receiptAddr);
        const mintdata = this.channelContract.methods
          .mint(tokenId, tokenURI, channelEntry, receiptAddr)
          .encodeABI();
        let transactionParams = await this.createTxParams(mintdata);

        Logger.log(TAG,
          'Calling smart contract through wallet connect',
          mintdata,
          transactionParams,
        );
        this.channelContract.methods
          .mint(tokenId, tokenURI, channelEntry, receiptAddr)
          .send(transactionParams)
          .on('transactionHash', hash => {
            Logger.log(TAG, 'Mint process, transactionHash is', hash);
          })
          .on('receipt', receipt => {
            Logger.log(TAG, 'Mint process, receipt is', receipt);
            reject(receipt);
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            Logger.log(TAG,
              'Mint process, confirmation is',
              confirmationNumber,
              receipt,
            );
          })
          .on('error', (error, receipt) => {
            Logger.error(TAG, 'Mint process, error is', error, receipt);
            if(typeof(error) === 'object'){
              let message: string = error['message'] || '';
              if(message != '' && message.indexOf('Errored or cancelled') > -1){
                reject(error);
              }
            }
          });

        this.checkTokenState(tokenId, info => {
          Logger.log(TAG, 'Mint success, token info is', info);
          resolve(info);
        });
      } catch (error) {
        Logger.error(TAG, 'Mint error', error);
        reject(error);
      }
    });
  }

  checkTokenState(tokenId, callback: (tokenInfo: any) => void) {
    this.checkTokenNum = 0;
    this.checkTokenInterval = setInterval(async () => {
      if (!this.checkTokenInterval) return;
      let info = await this.channelInfo(tokenId);
      if (info[0] != '0') {
        Logger.log(TAG, 'Check token state finish', info);
        clearInterval(this.checkTokenInterval);
        callback(info);
        this.checkTokenInterval = null;
        return;
      }

      this.checkTokenNum++;
      if (this.checkTokenNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkTokenInterval);
        this.checkTokenInterval = null;
        callback(null);
        Logger.log(TAG, 'Exit check token state by self');
      }
    }, Config.CHECK_STATUS_INTERVAL_TIME);
  }

  async channelInfo(tokenId: string) {
    if (!this.channelContract) return [];
    return await this.channelContract.methods.channelInfo(tokenId).call();
  }

  cancelMintProcess() {
    if (!this.checkTokenInterval) return;
    clearInterval(this.checkTokenInterval);
  }

  async burnChannel(
    tokenId: string,
  ): Promise<any>{
    return new Promise(async (resolve, reject) => {
          try {
            Logger.log(TAG, 'burn params ', tokenId);
            const burndata = this.channelContract.methods
              .burn(tokenId)
              .encodeABI();
            let transactionParams = await this.createTxParams(burndata);
            Logger.log(TAG,
              'Calling smart contract through wallet connect',
              burndata,
              transactionParams,
            );
            this.channelContract.methods
              .burn(tokenId)
              .send(transactionParams)
              .on('transactionHash', hash => {
              Logger.log(TAG, 'Burn process, transactionHash is', hash);
              })
              .on('receipt', receipt => {
                Logger.log(TAG, 'Burn process, receipt is', receipt);
                reject(receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                Logger.log(TAG,
                  'Burn process, confirmation is',
                  confirmationNumber,
                  receipt,
                );
              })
              .on('error', (error, receipt) => {
                Logger.error(TAG, 'Burn process, error is', error, receipt);
                if(typeof(error) === 'object'){
                  let message: string = error['message'] || '';
                  if(message != '' && message.indexOf('Errored or cancelled') > -1){
                    reject(error);
                  }
                }
              });
              this.checkBurnState(tokenId,(info)=>{
                 resolve(info);
              });
          } catch (error) {
            Logger.error(TAG, 'burn error', error);
            reject(error);
          }
    });
  }

  cancelBurnProcess(){
    if (!this.checkBurnInterval) return;
    clearInterval(this.checkBurnInterval);
  }

  checkBurnState(tokenId:string,callback: (tokenInfo: any) => void){
     this.checkBurnInterval = setInterval(async () => {
      if (!this.checkBurnInterval) return;
      let info = await this.channelInfo(tokenId);
      if (info[0] === '0') {
        clearInterval(this.checkBurnInterval);
        callback("success");
        this.checkBurnInterval = null;
        return;
      }

      this.checkBurnNum++;
      if (this.checkBurnNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkBurnInterval);
        this.checkBurnInterval = null;
      }
     },Config.CHECK_STATUS_INTERVAL_TIME);
  }

  cancelUpdateChanneProcess(){
    if (!this.checkUpdateChannelInterval) return;
    clearInterval(this.checkUpdateChannelInterval);
  }

  checkUpdateChannelState(tokenId:string, tokenUri: string, channelEntry:string, receiptAddr: string,callback: (tokenInfo: any) => void){
    this.checkUpdateChannelInterval = setInterval(async () => {
     if (!this.checkUpdateChannelInterval) return;
     let info = await this.channelInfo(tokenId);
     if (info[1] === tokenUri && info[3] === receiptAddr) {
       clearInterval(this.checkUpdateChannelInterval);
       callback("success");
       this.checkUpdateChannelInterval = null;
       return;
     }
     this.checkUpdateChannelNum++;
     if (this.checkUpdateChannelNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
       clearInterval(this.checkUpdateChannelInterval);
       this.checkUpdateChannelInterval = null;
     }
    },Config.CHECK_STATUS_INTERVAL_TIME);
 }

 async totalSupply() {
    return await this.channelContract.methods
    .totalSupply()
    .call();
  }

  async channelByIndex(index: number) {
    return await this.channelContract.methods
    .channelByIndex(index)
    .call();
  }


  async updateChannel(tokenId: string, tokenUri: string, channelEntry: string,receiptAddr: string) : Promise<any>{
    return new Promise(async (resolve, reject) => {
          try {
            Logger.log(TAG, 'updateChannel params ', tokenId, tokenUri, channelEntry, receiptAddr);
            const updateChanneldata = this.channelContract.methods
              .updateChannel(tokenId, tokenUri, channelEntry, receiptAddr)
              .encodeABI();
            let transactionParams = await this.createTxParams(updateChanneldata);
            Logger.log(TAG,
              'Calling smart contract through wallet connect',
              updateChanneldata,
              transactionParams,
            );
            this.channelContract.methods
              .updateChannel(tokenId, tokenUri, channelEntry, receiptAddr)
              .send(transactionParams)
              .on('transactionHash', hash => {
              Logger.log(TAG, 'updateChannel process, transactionHash is', hash);
              })
              .on('receipt', receipt => {
                Logger.log(TAG, 'updateChannel process, receipt is', receipt);
                reject(receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                Logger.log(TAG,
                  'updateChannel process, confirmation is',
                  confirmationNumber,
                  receipt,
                );
              })
              .on('error', (error, receipt) => {
                Logger.error(TAG, 'updateChannel process, error is', error, receipt);
                if(typeof(error) === 'object'){
                  let message: string = error['message'] || '';
                  if(message != '' && message.indexOf('Errored or cancelled') > -1){
                    reject(error);
                  }
                }
              });
              this.checkUpdateChannelState(tokenId, tokenUri, channelEntry, receiptAddr,(info)=>{
                 resolve(info);
              });
          } catch (error) {
            Logger.error(TAG, 'updateChannel error', error);
            reject(error);
          }
    });
  }


}
