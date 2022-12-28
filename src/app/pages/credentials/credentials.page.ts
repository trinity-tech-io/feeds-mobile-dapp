import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NativeService } from 'src/app/services/NativeService';
import { StandardAuthService } from 'src/app/services/StandardAuthService';
import { DIDHelperService } from 'src/app/services/did_helper.service';

@Component({
  selector: 'app-credentials',
  templateUrl: './credentials.page.html',
  styleUrls: ['./credentials.page.scss'],
})
export class CredentialsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public isKycmePublic: boolean = false;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private zone: NgZone,
    private standardAuthService: StandardAuthService,
    private didHelperService: DIDHelperService
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('app.credentials'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
  }

  toggleKycmeStatus() {
    this.zone.run(() => {
      this.isKycmePublic = !this.isKycmePublic;
      this.native.toast('this.isKycmePublic = ' + this.isKycmePublic);

      const request = this.standardAuthService.requestKYCCredentials().then(async (result) => {
        if (!result) {
          this.isKycmePublic = false;
          return;
        }

        console.log('result is', result);
        console.log('result type is', typeof result);


        const json = await result.toJson();
        console.log('json result type is', typeof json);
        console.log('json result is', json);

        const tmp = result.toString();
        console.log('tmp json', typeof tmp);
        console.log('tmp json', tmp);
      }).catch((error) => {
        console.log('result error', error);
      });
    });
  }
}
