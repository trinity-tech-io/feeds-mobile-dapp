import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from '../../services/theme.service';
@Component({
  selector: 'app-picturemenu',
  templateUrl: './picturemenu.component.html',
  styleUrls: ['./picturemenu.component.scss'],
})
export class PicturemenuComponent implements OnInit {
  @Output() hidePictureMenu = new EventEmitter();
  @Output() openGallery = new EventEmitter();
  @Output() openCamera = new EventEmitter();
  @Input () isSupportGif: boolean = true;
  public accept: string = "image/png, image/jpeg, image/jpg, image/gif";
  constructor(
   private native: NativeService,
   public theme :ThemeService,

  ) { }

  ngOnInit() {}

  clickOpenCamera() {
    this.openCamera.emit();
  }

  clickItem(buttonType: string) {
      this.hidePictureMenu.emit({
        buttonType: buttonType
      });
  }

  async onChange(event: any) {

    let realFile = event.target.files[0];
    if(realFile.type === "image/gif" && !this.isSupportGif){
      this.openGallery.emit({
        fileBase64 : ''
      });
      this.native.toastWarn("ProfileimagePage.avatarEorr");
      return;
    }
    //Logger.log("Real File type is", realFile.type);
    //Logger.log("Real File is", realFile);
    this.createImagePreview(realFile, event);
  }

  async createImagePreview(file: any, inputEvent?: any) {
    await this.native.showLoading("common.waitMoment");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async event => {
      try {
          let assetBase64 = event.target.result.toString();
          this.native.hideLoading();
          this.openGallery.emit({
            fileBase64 : assetBase64
          });
        }catch (error) {
          this.openGallery.emit({
            fileBase64 : ''
          });
          this.native.hideLoading();
      }
    }
  }

  handelFile(event: any) {
    event.target.value = null;
    document.getElementById("mintfile1").onchange = async (event) => {
        this.onChange(event);
    };
  }

}
