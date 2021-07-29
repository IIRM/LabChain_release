import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from "@angular/forms";

@Component({
  selector: 'app-p2p-market-view',
  templateUrl: './p2p-market-view.component.html',
  styleUrls: ['./p2p-market-view.component.css']
})
export class P2PMarketViewComponent implements OnInit {

  selectedTradeDirection: string = '';
  public p2pMarketForm = new FormGroup(
      {
        ask: new FormControl('false'),
        bid: new FormControl('false')
      });
  constructor() {
  }

  ngOnInit() {
  }

  public selectTrade(direction: string) {
      console.log('change in form to ' + direction);
      this.selectedTradeDirection = direction;
      if(this.selectedTradeDirection === 'ask'){
        this.p2pMarketForm.get('bid')!.setValue(false);
        this.p2pMarketForm.get('ask')!.setValue(true);
      } else if (this.selectedTradeDirection === 'bid'){
        this.p2pMarketForm.get('ask')!.setValue(false);
        this.p2pMarketForm.get('bid')!.setValue(true);
      }
  }
}
