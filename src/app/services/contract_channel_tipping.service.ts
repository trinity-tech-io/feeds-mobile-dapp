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
export class ChannelTippingContractService {
  private channelTippingAddress: string = Config.CHANNEL_TIPPTING_PAYMENT_ADDRESS;
  private channelTippingAbi = require('../../assets/contracts/channelTippingPaymentABI.json');
  private web3: Web3;
  private channelTippingContract: any;

  private checkTippingInterval: NodeJS.Timer;
  private checkTippingNum: number = 0;

  constructor(
    private walletConnectControllerService: WalletConnectControllerService,
  ) {
    this.init();
  }

  init() {
    this.web3 = this.walletConnectControllerService.getWeb3();
    if (!this.web3) return;
    this.channelTippingContract = new this.web3.eth.Contract(
      this.channelTippingAbi,
      this.channelTippingAddress,
    );
  }

  setTestMode(testMode: boolean) {
    if (testMode) {
      this.channelTippingAddress = Config.CHANNEL_TEST_TIPPTING_PAYMENT_ADDRESS;
      return;
    }
    this.channelTippingAddress = Config.CHANNEL_TIPPTING_PAYMENT_ADDRESS;
  }

  getChannelTippingContractService() {
    return this;
  }


  async makeTipping(
    channelId: string,
    postId: string,
    paidToken: string,
    amount: string,
    memo: string,
    walletAddress: string
  ): Promise<any>{
    return new Promise(async (resolve, reject) => {
          try {
            Logger.log(TAG, 'burn params ', channelId, postId, paidToken, amount, memo);
            const makeTippingdata = this.channelTippingContract.methods
              .makeTipping(channelId, postId, paidToken, amount, memo)
              .encodeABI();
            let transactionParams = await this.createTxParams(makeTippingdata,amount);
            Logger.log(TAG,
              'Calling smart contract through wallet connect',
              makeTippingdata,
              transactionParams,
            );
            this.channelTippingContract.methods
              .makeTipping(channelId, postId, paidToken, amount, memo)
              .send(transactionParams)
              .on('transactionHash', hash => {
              Logger.log(TAG, 'makeTipping process, transactionHash is', hash);
              })
              .on('receipt', receipt => {
                Logger.log(TAG, 'makeTipping process, receipt is', receipt);
              })
              .on('confirmation', (confirmationNumber, receipt) => {
                Logger.log(TAG,
                  'makeTipping process, confirmation is',
                  confirmationNumber,
                  receipt,
                );
              })
              .on('error', (error, receipt) => {
                Logger.error(TAG, 'makeTipping process, error is', error, receipt);
                if(typeof(error) === 'object'){
                  let message: string = error['message'] || '';
                  if(message != '' && message.indexOf('Errored or cancelled') > -1 || message.indexOf('User rejected the transaction') > -1){
                    reject(error);
                  }
                }
              });

              this.checkTippingState(walletAddress,(info)=>{
                 resolve(info);
              });
          } catch (error) {
            Logger.error(TAG, 'burn error', error);
            reject(error);
          }
    });
  }

  async createTxParams(data, amount) {
    return new Promise(async (resolve, reject) => {
      try {
        let accountAddress = this.walletConnectControllerService.getAccountAddress();
        let txGas = 0;

        const txData = {
          from: this.walletConnectControllerService.getAccountAddress(),
          to: this.channelTippingAddress,
          value: amount,
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
          gasPrice: gasPrice,
          gas: Math.round(txGas * 3),
          value: amount,
        };
        resolve(txResult);
      } catch (error) {
        Logger.log(TAG, 'error', error);
        reject(EstimateGasError);
      }
    });
  }

  cancelTippingProcess(){
    if (!this.checkTippingInterval) return;
    clearInterval(this.checkTippingInterval);
  }

  async checkTippingState(walletAddress: string,callback: (tokenInfo: any) => void){
     let balance = await this.getBalance(walletAddress);
     this.checkTippingInterval= setInterval(async () => {
      if (!this.checkTippingInterval) return;
      let curBalance = await this.getBalance(walletAddress);
      if (curBalance < balance) {
        clearInterval(this.checkTippingInterval);
        callback("success");
        this.checkTippingInterval = null;
        return;
      }

      this.checkTippingNum++;
      if (this.checkTippingNum * Config.CHECK_STATUS_INTERVAL_TIME > Config.WAIT_TIME_MINT) {
        clearInterval(this.checkTippingInterval);
        this.checkTippingInterval = null;
      }
     },Config.CHECK_STATUS_INTERVAL_TIME);
  }


  async getBalance(walletAddress: string){
    try {
      let balance = await this.web3.eth.getBalance(walletAddress);
      let balance1 = this.web3.utils.fromWei(balance, 'ether');
      return balance1;
    } catch (error) {
    }
  }
}
