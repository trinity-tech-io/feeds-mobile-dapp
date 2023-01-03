import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSlides, Platform } from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { IdentityService } from 'src/app/pages/feeds/importdid/identity.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { UtilService } from 'src/app/services/utilService';
import { DataHelper } from 'src/app/services/DataHelper';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService, SignInData } from 'src/app/services/FeedService';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';

@Component({
  selector: 'app-prepare-didpage',
  templateUrl: './prepare-didpage.page.html',
  styleUrls: ['./prepare-didpage.page.scss'],
})
export class PrepareDIDPagePage implements OnInit {

  public slideIndex = 0;

  private PUBLISH_DID_SLIDE_INDEX = 0;
  private SIGN_IN_SLIDE_INDEX = 1;
  private HIVE_SETUP_SLIDE_INDEX = 2;
  private DEFAULT_WALLET_SLIDE_INDEX = 3;
  public ALL_DONE_SLIDE_INDEX = 4;

  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonSlides, { static: false }) slide: IonSlides;

  constructor(
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private identityService: IdentityService,
    private hiveVaultController: HiveVaultController,
    private native: NativeService,
    private dataHelper: DataHelper,
    private hiveVaultApi: HiveVaultApi,

  ) { }

  ngOnInit() {

  }

  private computeNextSlideIndex(currentSlideIndex: number) {

    if (currentSlideIndex <= this.PUBLISH_DID_SLIDE_INDEX) {
      return this.PUBLISH_DID_SLIDE_INDEX;
    }
    else if (currentSlideIndex <= this.SIGN_IN_SLIDE_INDEX) {
      return this.SIGN_IN_SLIDE_INDEX;
    }
    else if (currentSlideIndex <= this.HIVE_SETUP_SLIDE_INDEX) {
      return this.HIVE_SETUP_SLIDE_INDEX;
    }
    if (currentSlideIndex < this.DEFAULT_WALLET_SLIDE_INDEX) {
      return this.DEFAULT_WALLET_SLIDE_INDEX;
    }
    else {
      return this.ALL_DONE_SLIDE_INDEX;
    }
  }

  showSlider() {

    void this.slide.getSwiper().then((swiper) => {
      swiper.init()
      this.slideIndex = 0
      void this.slide.slideTo(this.slideIndex)
    });
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async ionViewWillEnter() {
    this.initTitle()
    let nextSlideIndex = -1
    console.log("开始导入助记词++++++++++++ " + nextSlideIndex)
    this.slide.slideTo(0)
    this.slideIndex = 0
    try {
      await this.identityService.startImportingMnemonic(null, null)
      console.log("开始导入助记词 结束++++++++++++ ")
    } catch (e) {
      console.log("开始导入助记词errror++++++++++++ ", e)
    }

    const userDid = this.identityService.userDID
    console.log("userDid ++++++++++++ " + userDid)
    this.slide.slideTo(1)
    this.slideIndex = 1
    try {
      // console.log("开始加载vcs++++++++++++ ")
      // const profiles = await this.identityService.loadProfiles()
      // console.log("开始解析vcs++++++++++++ ")
      // const profilesJson = await JSON.parse(profiles)
      // console.log("profilesJson ===== >>>>>>>>>>> ", profilesJson)
      // console.log("profilesJson.userDID ===== >>>>>>>>>>> ", profilesJson.userDID)

      // console.log("开始存储vcs++++++++++++ ")
      // const signinData = new SignInData(
      //   profilesJson.userDID,
      //   profilesJson.profileName,
      //   null,
      //   profilesJson.profileEmail,
      //   profilesJson.profileTelephone,
      //   profilesJson.profileNation,
      //   profilesJson.profileNickname,
      //   profilesJson.profileDescription,
      //   UtilService.getCurrentTimeNum() + 10 * 24 * 60 * 60 * 1000,
      // )
      // // this.dataHelper.setLocalSignInData(signinData)
      // await this.dataHelper.saveData(FeedsData.PersistenceKey.signInData, signinData)
      // console.log("开始获取已经存储的signInData ++++++++++++ ")

      // const userDid = await this.dataHelper.getUserDid()
      // console.log("获取已经存储的signInData 结果++++++++++++ userDid = ", userDid)

      // await this.feedService.saveSignInData(profilesJson.userDID,
      //   profilesJson.profileName,
      //   null,
      //   profilesJson.profileEmail,
      //   profilesJson.profileTelephone,
      //   profilesJson.profileNation,
      //   profilesJson.profileNickname,
      //   profilesJson.profileDescription)
      console.log("开始登录hive ++++++++++++ " + nextSlideIndex)
      await this.hiveVaultController.prepareConnection(true)
    }
    catch (e) {
      console.log(" error ========>>>>>>>>>>> ", e)
    }

    this.slide.slideTo(2)
    this.slideIndex = 2
    console.log("开始准备存储空间 ++++++++++++ ")
    try {
      await this.hiveVaultController.createSQLTables(userDid)
    } catch (error) {
      console.log("存储空间 error ====== ", error)
    }

    this.slide.slideTo(3)
    this.slideIndex = 3
    console.log("开始注册script ++++++++++++ ")
    try {
      await this.hiveVaultController.initRegisterScript(true)
    } catch (error) {
      console.log("注册script error ====== ", error)
    }
    
    this.slide.slideTo(4)
    this.slideIndex = 4
    // do {
    //   console.log("开始导入助记词++++++++++++ " + nextSlideIndex)
    //   await this.identityService.startImportingMnemonic(null, null)
    //   this.slide.slideTo(2);
    //   console.log("开始登录hive ++++++++++++ " + nextSlideIndex)
    //   const userDid = this.identityService.userDID
    //   await this.hiveVaultController.prepareHive(userDid, true)
    //   this.slide.slideTo(3);

    //   console.log("登录hive 结束 ++++++++++++ " + nextSlideIndex)

    //   console.log("11111 ++ " + nextSlideIndex)

    //   // nextSlideIndex = this.computeNextSlideIndex(nextSlideIndex);
    //   // nextSlideIndex = nextSlideIndex + 1

    //   // this.slide.slideTo(nextSlideIndex);
    //   // this.slideIndex = nextSlideIndex;
    //   console.log("11111")
    //   switch (nextSlideIndex) {
    //     case this.PUBLISH_DID_SLIDE_INDEX:
    //       console.log("111112")
    //       await this.delay(1000);
    //     case this.SIGN_IN_SLIDE_INDEX:
    //       await this.delay(1000);
    //       console.log("111113")
    //       break;
    //     case this.HIVE_SETUP_SLIDE_INDEX:
    //       await this.delay(1000);
    //       console.log("11114")
    //       break;
    //     case this.DEFAULT_WALLET_SLIDE_INDEX:
    //       console.log("111115")
    //       await this.delay(1000);
    //       break;
    //     default:
    //     // Do nothing.
    //   }
    // }
    // while (nextSlideIndex !== this.ALL_DONE_SLIDE_INDEX);

  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      "",
    )
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  finalizePreparation() {
    const syncHiveData = UtilService.generateHiveSyncCompleteObj();
    this.dataHelper.setSyncHiveData(syncHiveData);
    this.dataHelper.saveData("feeds.initHive", "1");
    this.native.setRootRouter(['/tabs/home']);
    this.hiveVaultController.syncSelfProfileWithRemote();
  }
}
