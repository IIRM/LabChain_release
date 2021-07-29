import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {ProsumerInstance} from '../../core/data-types/ProsumerInstance';

@Component({
  selector: 'app-market-view',
  templateUrl: './market-view.component.html',
  styleUrls: ['./market-view.component.css']
})

// TODO allow to hide the fee/levy component in the bid
// TODO think about including the historical market data component

/**
 * Component to provide filtering and the market view for the relevant bids accoring to the filter
 */
export class MarketViewComponent implements OnInit{

  /** The (observable of the) prosumer instance whose assets are to be diplayed */
  @Input() prosumerInstanceObservable!: Observable<ProsumerInstance>;
  /** variable to store the prosumer instance once derived from the observable */
  public prosumerInstance: ProsumerInstance | undefined;
  /** selector string to display the respective component */
  public selected: string = "";

  constructor() {
  }

  ngOnInit() {
    this.prosumerInstanceObservable.subscribe(derivedInstance => {
      this.prosumerInstance = derivedInstance;
    });
  }
}
