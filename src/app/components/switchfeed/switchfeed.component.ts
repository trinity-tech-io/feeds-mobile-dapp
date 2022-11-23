import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { UtilService } from '../../services/utilService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
import _ from 'lodash';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import SparkMD5 from 'spark-md5';
@Component({
  selector: 'app-switchfeed',
  templateUrl: './switchfeed.component.html',
  styleUrls: ['./switchfeed.component.scss'],
})
export class SwitchfeedComponent implements OnInit {
  @Input() public channelList = [];
  @Output() hideComment = new EventEmitter();
  public currentFeed: any = {};
  public avatarList: any = {};
  public newChannelList = [];
  public channelPublicStatusList: any = {};
  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService
  ) {}

  ngOnInit() {
    this.currentFeed = this.dataHelper.getCurrentChannel();
    if(this.channelList.length > 1){
    let index = _.findIndex(this.channelList,(item: FeedsData.ChannelV3)=>{
       return item.destDid ===  this.currentFeed.destDid && item.channelId === this.currentFeed.channelId;
    });
    if(index > -1 && index != 0){
        this.channelList.splice(index,1);
        this.channelList.splice(0,0,this.currentFeed);
    }
    }
    try {
      this.getAllAvatarList();
    } catch (error) {

    }
    this.getPublicChannelStatusList();
  }

  async getAllAvatarList(){
      for(let channel of this.channelList){
        let avatarUri  = channel.avatar || "";
        if(avatarUri != ""){
        let destDid = channel.destDid;
        this.avatarList[avatarUri] = "";
        try {
          let avatar =  await this.parseAvatar(avatarUri,destDid) || '';
          this.avatarList[avatarUri] = avatar;
        } catch (error) {
          this.avatarList[avatarUri] = '"./assets/images/default-contact.svg"';
        }
        }else{
          this.avatarList[avatarUri] = '"./assets/images/default-contact.svg"';
        }
      }
  }

  async getPublicChannelStatusList(){
    for(let channel of this.channelList){
      let destDid = channel.destDid;
      let channelId = channel.channelId;
      try {
        this.getChannelPublicStatus(destDid,channelId);
      } catch (error) {
      }

    }
}

  async parseAvatar(avatarUri: string,destDid: string):Promise<string> {

    let avatar = await this.handleChannelAvatar(avatarUri,destDid);


    return avatar;
  }

  handleChannelAvatar(channelAvatarUri: string,destDid: string): Promise<string>{
    return new Promise(async (resolve, reject) => {
      try {
        let fileName:string = channelAvatarUri.split("@")[0];
        this.hiveVaultController.getV3Data(destDid,channelAvatarUri,fileName,"0")
        .then((result)=>{
           let channelAvatar = result || '';
           resolve(channelAvatar);
        }).catch((err)=>{
          resolve('');
        })
      }catch(err){
        resolve('');
      }
    });

  }

  moreName(name: string) {
    return UtilService.moreNanme(name, 25);
  }

  clickItem(feed: any) {
    this.hideComment.emit(feed);
  }

  getChannelPublicStatus(destDid: string, channelId: string) {
    this.channelPublicStatusList = this.dataHelper.getChannelPublicStatusList();
    let key = destDid + '-' + channelId;
    let channelPublicStatus = this.channelPublicStatusList[key] || '';
    if (channelPublicStatus === '') {
      this.getChannelInfo(channelId).then((channelInfo) => {
        if (channelInfo != null) {
          this.channelPublicStatusList[key] = "2";//已公开
          this.dataHelper.setChannelPublicStatusList(this.channelPublicStatusList);
          //add channel contract cache
          this.addChannelNftCache(channelInfo, channelId);

        } else {
          this.channelPublicStatusList[key] = "1";//未公开
          this.dataHelper.setChannelPublicStatusList(this.channelPublicStatusList);
          //add channel contract cache
          this.addChannelNftCache(null, channelId);
        }
      }).catch((err) => {

      });

    }
  }

  async addChannelNftCache(channelInfo: any, channelId: string) {
    if (channelInfo === null) {
      let channelContractInfoList = this.dataHelper.getChannelContractInfoList() || {};
      channelContractInfoList[channelId] = "unPublic";
      this.dataHelper.setChannelContractInfoList(channelContractInfoList);
      this.dataHelper.saveData("feeds.contractInfo.list", channelContractInfoList);
      return;
    }
    let channelNft: FeedsData.ChannelContractInfo = {
      description: '',
      cname: '',
      avatar: '',
      receiptAddr: '',
      tokenId: '',
      tokenUri: '',
      channelEntry: '',
      ownerAddr: '',
      signature: ''
    };
    channelNft.tokenId = channelInfo[0];
    channelNft.tokenUri = channelInfo[1];
    channelNft.channelEntry = channelInfo[2];
    channelNft.receiptAddr = channelInfo[3];
    channelNft.ownerAddr = channelInfo[4];
    let uri = channelInfo[1].replace('feeds:json:', '');
    let result: any = await this.ipfsService
      .nftGet(this.ipfsService.getNFTGetUrl() + uri);
    channelNft.description = result.description;
    channelNft.cname = result.data.cname;
    channelNft.signature = result.data.signature;
    let avatarUri = result.data.avatar.replace('feeds:image:', '');
    let avatar = await UtilService.downloadFileFromUrl(this.ipfsService.getNFTGetUrl() + avatarUri);
    let avatarBase64 = await UtilService.blobToDataURL(avatar);
    let hash = SparkMD5.hash(avatarBase64);
    channelNft.avatar = hash;
    let channelContractInfoList = this.dataHelper.getChannelContractInfoList() || {};
    channelContractInfoList[channelId] = channelNft;
    this.dataHelper.setChannelContractInfoList(channelContractInfoList);
    this.dataHelper.saveData("feeds.contractInfo.list", channelContractInfoList);
  }

  async getChannelInfo(channelId: string) {

    try {
      let tokenId: string = "0x" + channelId;
      tokenId = UtilService.hex2dec(tokenId);
      let tokenInfo = await this.nftContractControllerService.getChannel().channelInfo(tokenId);
      if (tokenInfo[0] != '0') {
        return tokenInfo;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
