import { Component, Input, OnInit } from '@angular/core';
import { TransactionClearingService } from '../../core/transaction-clearing.service';
import { ProsumerInstance } from '../../core/data-types/ProsumerInstance';
import { TransactionFeeEntry } from '../../core/data-types/TransactionFeeEntry';
import { Observable } from 'rxjs';
import {ResidualLoadService} from "../residual-load.service";
import {InbalanceFee} from "../../core/data-types/InbalanceFee";
import {TimeService} from "../../core/time.service";
import {SessionDataService} from "../../core/session-data.service";

@Component({
  selector: 'app-fee-levy-display',
  templateUrl: './fee-levy-display.component.html',
  styleUrls: ['./fee-levy-display.component.css']
})

/**
 * Component to show the fees and levies the respective prosumer (instance) incurred over the course of the simulation.
 * For every cleared transaction the component checks whether the associated participant has to incur the feed and if so lists it in the component.
 */
export class FeeLevyDisplayComponent implements OnInit {
  /** An array of the respective occasions that the prosumer incurred fee and levy payments for display purposes */
  public respectiveTransactionFees: Array<TransactionFeeEntry>;
  /** The observable the prosumer instance used is based upon */
  @Input() piObservable!: Observable<ProsumerInstance>;
  /** The respective prosumer instance to display the fees and levies for */
  private prosumer: ProsumerInstance | undefined;
  /** Variable to store the aggregated fees the actor incurred */
  public aggregatedFees: number = NaN;
  /** Array for the fees paid in the time steps */
  public inbalanceFees: Array<InbalanceFee>;
  public inbalanceFeeSum = 0;
  public tradingFeeSum = 0;

  constructor(private tcs: TransactionClearingService,
              private residualLoad: ResidualLoadService,
              private timeService: TimeService,
              private session: SessionDataService) {
    this.respectiveTransactionFees = new Array<TransactionFeeEntry>();
    this.inbalanceFees = new Array<InbalanceFee>();
    this.residualLoad.inbalanceEmitter.subscribe(rawInbalance => {
      if(!isNaN(rawInbalance) && !isNaN(this.session.experimentInstance.instanceOfExperiment.inbalancePenalty[this.timeService.getCurrentTime() - 1])) {
        const currentInbalance = Math.floor(Math.abs(rawInbalance) * 10) / 10.0;
        console.log('Punishing inbalance of ' + currentInbalance + ' at time ' + (this.timeService.getCurrentTime() - 1) + ' with a fee of ' + this.session.experimentInstance.instanceOfExperiment.inbalancePenalty[this.timeService.getCurrentTime() - 1] + ' amounting to ' + Math.floor(currentInbalance) * this.session.experimentInstance.instanceOfExperiment.inbalancePenalty[this.timeService.getCurrentTime() - 1]);
        if (currentInbalance >= 0.1) { // calculate fee in 0.1 steps
          const inbalanceFee = {
            timeStep: this.timeService.getCurrentTime() - 1,
            inbalancePower: Math.round(currentInbalance * 100) / 100.0,
            inbalancePaid: Math.round(currentInbalance * this.session.experimentInstance.instanceOfExperiment.inbalancePenalty[this.timeService.getCurrentTime() - 1] * 100) / 100
          }
          this.inbalanceFees.push(inbalanceFee);
          this.inbalanceFeeSum += inbalanceFee.inbalancePaid;
          this.aggregatedFees += inbalanceFee.inbalancePaid;
          this.session.currentProsumer!.amountTokens = Math.round((this.session.currentProsumer!.amountTokens - inbalanceFee.inbalancePaid) * 100) / 100;
          this.session.marketResultManager.recordInbalanceFee(inbalanceFee);
        }
      }
    });
  }

  ngOnInit() {
    //Initialize variables and subscribe to the emitters to process the respective events properly
    this.aggregatedFees = 0;
    // Subscribe to the respective emitter of the tcs for receiving newly cleared transactions (i.e. new information on paid fees and levies)
    this.tcs.newlyClearedBidEmitter.subscribe(transactionFeeEntry => {
      this.processTransaction(transactionFeeEntry);
    });
    this.tcs.newlyClearedAskEmitter.subscribe(transactionFeeEntry => {
      this.processTransaction(transactionFeeEntry);
    });
    this.piObservable.subscribe(derivedInstance => {
      this.prosumer = derivedInstance;
    });
  }

  /**
   * Helper function to process a transaction by filtering whether the current prosumer incurs the fee and if so counting it as an incurred transaction fees
   * @param transactionFeeEntry The respective transaction object
   */
  private processTransaction(transactionFeeEntry: TransactionFeeEntry){
    // Filter out those fees that weren't paid by the respective prosumer
    if (this.prosumer!.respectiveProsumer.id === transactionFeeEntry.payerID) {
      this.respectiveTransactionFees.push(transactionFeeEntry);
      this.aggregatedFees += transactionFeeEntry.amount;
      this.tradingFeeSum += transactionFeeEntry.amount;
      console.log(transactionFeeEntry);
    }
  }
}
