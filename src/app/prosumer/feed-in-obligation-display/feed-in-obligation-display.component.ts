import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { BlockchainTransactionService } from '../../core/blockchainInterface/blockchain-transaction.service';
import { ProsumerInstance } from '../../core/data-types/ProsumerInstance';
import { Observable } from 'rxjs';
import { TimeService } from '../../core/time.service';
import {P2POption} from "../../core/data-types/P2POption";
import {BlockchainRelayService} from "../../core/interfaceRelayServices/blockchain-relay.service";

@Component({
  selector: 'app-feed-in-obligation-display',
  templateUrl: './feed-in-obligation-display.component.html',
  styleUrls: ['./feed-in-obligation-display.component.css']
})

/**
 * Component to display the contractual obligations of the respective prosumer for feeding electricity into the grid.
 * Manages the data relevant for displaying the respective plot
 */
export class FeedInObligationDisplayComponent implements OnInit {
  /** The element reference for the canvas element used in the view of the component */
  @ViewChild('canvas', {static: false}) canvas: ElementRef | undefined;
  /** The observable for deriving the prosumer instance of the component */
  @Input() piObservable!: Observable<ProsumerInstance>;
  /** The prosumer instance for which to display the feed-in obligation */
  private prosumer: ProsumerInstance | undefined;
  /** The respective chart element to display data in */
  public obligationPlot: Chart | undefined;
  /** Array to store a time series of the obligation for feeding in (net) electricity into the grid for each time step / time slice */
  private obligationSeries: number[] = [];
  /** Variable to contain the next feed-in obligation of the prosumer */
  public nextFIT: number = NaN;
  /** Variable to track which offers have been accounted for in the feedIn obligation */
  private accountedOffers: P2POption[];
  constructor(private bts: BlockchainRelayService,
              private cd: ChangeDetectorRef,
              private timeService: TimeService) {
    this.accountedOffers = new Array<P2POption>();
  }

  ngOnInit() {
    if(this.timeService.getEndTime()){
      this.obligationSeries = new Array<number>(this.timeService.getEndTime());
    }
    this.piObservable.subscribe(derivedInstance => {
      this.prosumer = derivedInstance;
    });
    //Subscribe to the emitter of the committed bids and asks that contain relief (bids as creator, asks as purchaser) or stress (asks as creator, bids as purchaser)
    this.bts.committedBidSubject.subscribe(commitedBids => {
      commitedBids.forEach(currentBid => {
        //check if the bid is not accounted for yet and if so process it and account for it
        if(this.accountedOffers.indexOf(currentBid) === -1){
          if (currentBid.optionCreator.respectiveProsumer.id === this.prosumer!.respectiveProsumer.id) {
            // decrease the committed power delivery to each time slice that concern this commitment
            for (let i = 0; i < currentBid.duration; i++) {
              this.obligationSeries[currentBid.deliveryTime + i] -= currentBid.power;
            }
          } else if (currentBid.acceptedParty === this.prosumer!.respectiveProsumer.id){
            // increase the committed power delivery to each time slice that concern this commitment
            for (let i = 0; i < currentBid.duration; i++) {
              this.obligationSeries[currentBid.deliveryTime + i] += currentBid.power;
            }
          }
          //After modifying the obligation, mark it as accounted for
          this.accountedOffers.push(currentBid);
        }
      });
    });
    this.bts.committedAskSubject.subscribe(commitedAsks => {
      commitedAsks.forEach(currentBid => {
        if(this.accountedOffers.indexOf(currentBid) === -1){
          if (currentBid.optionCreator === this.prosumer) {
            // increase the committed power delivery to each time slice that concern this commitment
            for (let i = 0; i < currentBid.duration; i++) {
              this.obligationSeries[currentBid.deliveryTime + i] += currentBid.power;
            }
          } else if (currentBid.acceptedParty === this.prosumer!.respectiveProsumer.id){
            // decrease the committed power delivery to each time slice that concern this commitment
            for (let i = 0; i < currentBid.duration; i++) {
              this.obligationSeries[currentBid.deliveryTime + i] -= currentBid.power;
            }
          }
          this.accountedOffers.push(currentBid);
        }
      });
    });
    this.timeService.timeEmitter.subscribe(simulationTime => {
      if(this.obligationSeries === undefined){
        this.obligationSeries = new Array<number>(this.timeService.getEndTime());
      }
      this.nextFIT = this.obligationSeries[Math.ceil(simulationTime)];
    });
  }

  ngAfterInit() {
    this.loadGraph();
  }

  /**
   * Method to load the graph / chart as a HTMLCanvasELement
   * Specifies the parameters for displaying the respective time series to display and triggers the change detection after setting up the graph
   */
  loadGraph(): void {
    this.obligationPlot = new Chart((this.canvas!.nativeElement as HTMLCanvasElement)!.getContext('2d')!, {
      type: 'line',
      data: {
        labels: Array.from(Array(this.obligationSeries.length).keys()),
        datasets: [{
          label: 'projected generation',
          data: this.obligationSeries
        }]
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'time step'
            }
          },
          y: {
            title: {
              display: true,
              text: 'residual load (kW)'
            }
          }
        },
      }
    });
    this.cd.detectChanges();
  }
}
