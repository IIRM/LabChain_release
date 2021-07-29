import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { BidValidationService } from "../../core/blockchainInterface/bid-validation.service";
import { Chart } from 'chart.js';
import { TimeService } from "../../core/time.service";
import { SessionDataService } from "../../core/session-data.service";
import { TransactionClearingService } from "../../core/transaction-clearing.service";
import { MarketParticipantType } from "../../core/data-types/OffmarketTrade";
import { ResidualLoadService } from "../residual-load.service";

@Component({
  selector: 'app-external-market-view',
  templateUrl: './external-market-view.component.html',
  styleUrls: ['./external-market-view.component.css']
})
/**
 * Component to manage the interaction with external markets
 * (remuneration for feed-in for selling excess electricity and
 * electricity purchases from the retailer)
 */
export class ExternalMarketViewComponent implements OnInit, AfterViewInit {
  /** The element ref element that acts as the canvas for the chart */
  @ViewChild('canvas', {static: false}) canvas: ElementRef | undefined;
  /** The chart for visualizing the external series price data */
  public retailPlot: Chart | undefined;
  /** The array containing the time series of the fit data to display upon request */
  private fitPriceData: number[] = [];
  /** The array containing the time series of the retail price data to display upon request */
  private retailPriceData: number[] = [];
  /** The array with the price data to display (48 time step window of fit or retail price data, depending on what is selected) */
  public plotData: number[] = [];
  /** variable to store the labels for the chart to display */
  private labels: number[] = [];
  /** The price / remuneration the current form settings would entail */
  public transactionValue: number = 0;
  /** The current case, i.e. "Buy" or "Sell" */
  public case = 'Sell';
  /** */
  public correspondingResidualLoad: number | undefined;
  /** The respective form group used to contain and manage the data regarding the respective bid */
  public retailInteractionForm = new FormGroup(
      {
        fit: new FormControl('true'),
        feedInTime: new FormControl('', (control: AbstractControl) => this.validationService.fitValidator(control)),
        duration: new FormControl('', (control: AbstractControl) => this.validationService.durationValidator(control)),
        power: new FormControl('', (control: AbstractControl) => this.validationService.externalPowerValidator(control))
      });
  /** Helper variable to display errors within the form */
  private formError = '';
  constructor(private validationService: BidValidationService,
              private cd: ChangeDetectorRef,
              private timeService: TimeService,
              private session: SessionDataService,
              private tcs: TransactionClearingService,
              private residualLoadService: ResidualLoadService) {
    this.timeService.timeEmitter.subscribe(currentTime => {
      this.updateRetailPlotData();
      if (!this.cd['destroyed']) {
        this.cd.detectChanges();
      }
    });
    this.retailInteractionForm.valueChanges.subscribe(changedValue => {
      if(this.retailInteractionForm.get('feedInTime') && this.retailInteractionForm.get('duration') && this.retailInteractionForm.get('power')) {
        this.transactionValue = 0;
        const startTime = this.retailInteractionForm.get('feedInTime')!.value;
        const duration = Math.min(this.retailInteractionForm.get('duration')!.value, ((this.timeService.getEndTime() - startTime) + 1));
        if (this.retailInteractionForm.get('fit')!.value) {
          for (let i = startTime; i < duration + startTime; i++) {
            this.transactionValue += this.retailInteractionForm.get('power')!.value * this.fitPriceData[i];
          }
        } else {
          for (let i = startTime; i < duration + startTime; i++) {
            this.transactionValue += this.retailInteractionForm.get('power')!.value * this.retailPriceData[i];
          }
        }
      }
      this.updateRetailPlotData();
    });
    this.retailInteractionForm.valueChanges.subscribe(() => {
      if(this.retailInteractionForm.get('feedInTime')!.value){
        this.correspondingResidualLoad = this.residualLoadService.getResidualLoad()[this.retailInteractionForm.get('feedInTime')!.value];
      } else {
        this.correspondingResidualLoad = undefined;
      }
    })
  }

  ngOnInit() {
    this.retailPriceData = this.session.experimentInstance.instanceOfExperiment.retailPrice;
    this.fitPriceData = this.session.experimentInstance.instanceOfExperiment.feedInTariff;
    this.plotData = this.fitPriceData.slice(0, 49);
  }

  ngAfterViewInit(): void {
    this.updateRetailPlotData();
  }

  /**
   * Method to set up the chart data for the residual load chart based on the provided data
   */
  loadGraph(): void {
    if (this.retailPlot !== undefined) {  // if destroy existing chart before redrawing as old chart will only be overlayed otherwise
      this.retailPlot.destroy();
    }
    if (this.timeService.getCurrentTime() === 0) {
      this.plotData[0] = NaN;
    }
    let i = this.timeService.getCurrentTime();
    this.labels = this.plotData.map(() => (i++));
    this.retailPlot = new Chart((this.canvas!.nativeElement as HTMLCanvasElement).getContext('2d')!, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [{
          label: 'external market prices',
          data: this.plotData
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
              text: 'price (ct/kWh)'
            }
          }
        },
      }
    });
    if (!this.cd['destroyed']) {
      this.cd.detectChanges();
    }
  }

  updateRetailPlotData() {
    // With progression of time, fill the plot data array with the currently selected price series
    if(this.retailInteractionForm.get('fit')!.value){
      this.plotData = this.fitPriceData.slice(this.timeService.getCurrentTime(), Math.min(this.timeService.getCurrentTime() + 48, this.timeService.getEndTime()) + 1);
      this.case = 'Sell';
    } else {
      this.plotData = this.retailPriceData.slice(this.timeService.getCurrentTime(), Math.min(this.timeService.getCurrentTime() + 48, this.timeService.getEndTime()) + 1);
      this.case = 'Buy';
    }
    this.loadGraph();
  }

  submit() {
    const direction = this.retailInteractionForm.get('fit')!.value;
    //If prosumer is selling electricity to the grid operator
    if(this.retailInteractionForm.get('fit')!.value){
      this.tcs.clearOffMarketTrade({
        payer: {id: 101, type: MarketParticipantType.GridOperator},
        payee: {id: this.session.currentProsumer!.respectiveProsumer.id, type: MarketParticipantType.Prosumer},
        power: parseFloat(this.retailInteractionForm.get('power')!.value),
        duration: Math.min((this.timeService.getEndTime() - parseInt(this.retailInteractionForm.get('feedInTime')!.value)) + 1, parseInt(this.retailInteractionForm.get('duration')!.value)),
        deliveryTime: parseInt(this.retailInteractionForm.get('feedInTime')!.value),
        volume: this.transactionValue
      });
      this.session.marketResultManager.recordFeedInActivity(this.transactionValue, parseFloat(this.retailInteractionForm.get('power')!.value), this.timeService.getCurrentTime(), this.session.currentProsumer!.amountTokens);
      console.log('selling');
    } else {
      // buying electricity from the grid operator
      this.tcs.clearOffMarketTrade({
        payee: {id: 102, type: MarketParticipantType.GridOperator},
        payer: {id: this.session.currentProsumer!.respectiveProsumer.id, type: MarketParticipantType.Prosumer},
        power: parseFloat(this.retailInteractionForm.get('power')!.value),
        duration: Math.min((this.timeService.getEndTime() - parseInt(this.retailInteractionForm.get('feedInTime')!.value)) + 1, parseInt(this.retailInteractionForm.get('duration')!.value)),
        deliveryTime: parseInt(this.retailInteractionForm.get('feedInTime')!.value),
        volume: this.transactionValue
      });
      this.session.marketResultManager.recordRetailActivity(this.transactionValue, parseFloat(this.retailInteractionForm.get('power')!.value), this.timeService.getCurrentTime(), this.session.currentProsumer!.amountTokens);
      console.log('buying');
    }
    this.retailInteractionForm.reset();
    this.retailInteractionForm.get('fit')!.setValue(direction);
  }
}
