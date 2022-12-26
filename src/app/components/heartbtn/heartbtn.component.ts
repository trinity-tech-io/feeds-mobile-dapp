import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import _ from 'lodash';

@Component({
  selector: 'app-heartbtn',
  templateUrl: './heartbtn.component.html',
  styleUrls: ['./heartbtn.component.scss'],
})
export class HeartbtnComponent implements OnInit {
  @Input() isLiked: string = "";
  @Input() isSaving: string = "";
  // @Output() clickMore = new EventEmitter();
  constructor(
    public theme: ThemeService,
  ) { }

  async ngOnInit() {
  }
}
