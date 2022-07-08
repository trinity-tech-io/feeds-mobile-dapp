import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-connectionmenu',
  templateUrl: './connectionmenu.component.html',
  styleUrls: ['./connectionmenu.component.scss'],
})
export class ConnectionmenuComponent implements OnInit {
  @Output() hideConnectionMenu = new EventEmitter();
  constructor(
    public theme: ThemeService
  ) { }

  ngOnInit() {}


  clickItem(buttonType: string) {
    this.hideConnectionMenu.emit({
      buttonType: buttonType
    });
  }
}
