import { Injectable } from '@angular/core';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { NFTContractParsarService } from 'src/app/services/nftcontract_parsar.service';
import { NFTContractStickerService } from 'src/app/services/nftcontract_sticker.service';
import { ChannelContractService } from 'src/app/services/contract_channel.service';
import { ChannelTippingContractService } from 'src/app/services/contract_channel_tipping.service';
import { NFTContractDiamondService } from './nftcontract_diamond.service';
import { Events } from 'src/app/services/events.service';
import { UtilService } from './utilService';

@Injectable()
export class NFTContractControllerService {
  constructor(
    private event: Events,
    private walletConnectControllerService: WalletConnectControllerService,
    private nftContractParsarService: NFTContractParsarService,
    private nftContractStickerService: NFTContractStickerService,
    private channelContractService: ChannelContractService,
    private channelTippingContractService: ChannelTippingContractService,
    private nftContractDiamondService: NFTContractDiamondService
  ) {
    this.init();
    this.initSubscribeEvent();
  }

  init() {
    this.nftContractStickerService.init();
    this.nftContractParsarService.init();
    this.nftContractDiamondService.init();
    this.channelContractService.init();
    this.channelTippingContractService.init();
    this.nftContractDiamondService.init();
  }

  initSubscribeEvent() {
    this.event.subscribe(FeedsEvent.PublishType.walletConnected, () => {
      this.init();
    });
    this.event.subscribe(FeedsEvent.PublishType.walletDisconnected, () => {
      this.init();
    });

    this.event.subscribe(FeedsEvent.PublishType.walletAccountChanged, () => {
      this.init();
    });
  }

  getSticker(): NFTContractStickerService {
    return this.nftContractStickerService.getSticker();
  }

  getPasar(): NFTContractParsarService {
    return this.nftContractParsarService.getPasar();
  }

  getChannel(): ChannelContractService {
    return this.channelContractService.getChannel();
  }

  getChannelTippingContractService(): ChannelTippingContractService{
    return this.channelTippingContractService.getChannelTippingContractService();
  }

  getDiamond(): NFTContractDiamondService {
    return this.nftContractDiamondService.getDiamond();
  }

  getAccountAddress() {
    return this.walletConnectControllerService.getAccountAddress();
  }

  transFromWei(price: string) {
    let eth = this.walletConnectControllerService
      .getWeb3()
      .utils.fromWei(price, 'ether');
    return eth;
  }

  transToWei(price: string) {
    let wei = this.walletConnectControllerService
      .getWeb3()
      .utils.toWei(price, 'ether');
    return wei;
  }

  isTokenId(tokenId: string) {
    let isHex = this.walletConnectControllerService
      .getWeb3().utils.isHexStrict(tokenId);
    if (isHex) {
      if (tokenId.length === 66) {
        return tokenId;
      }
    }

    try {
      let hexString = "0x" + UtilService.dec2hex(tokenId);
      let isHex = this.walletConnectControllerService
        .getWeb3().utils.isHexStrict(hexString);
      if (isHex) {
        if (hexString.length === 66) {
          return hexString;
        } else {
          return "";
        }
      } else {
        return "";
      }
    } catch (error) {
      return "";
    }
  }

  isAddress(address: string) {
    return this.walletConnectControllerService
      .getWeb3()
      .utils.isAddress(address);
  }
}
