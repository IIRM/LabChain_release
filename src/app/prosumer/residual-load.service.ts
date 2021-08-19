import { Injectable } from '@angular/core';
import {BehaviorSubject, ReplaySubject, Subject} from 'rxjs';
import {TimeService} from "../core/time.service";
import {HelperService} from "../shared/helper.service";
import {ProsumerInstance} from "../core/data-types/ProsumerInstance";
import {SessionDataService} from "../core/session-data.service";

@Injectable({
  providedIn: 'root'
})
export class ResidualLoadService {
  /** array with the net activity on markets to increase/reduce residual load. Take into account all trades from the
   * perspective of the time steps with sign (- load reducing: purchasing, + load enhancing: selling) */
  private netMarketActivity = [];
  /** Emitter for broadcasting imbalances to interested parties */
  public inbalanceEmitter: Subject<number> = new Subject<number>();
  /** The array containing the time series of the residual load to display */
  //private residualLoadSeries = [];
  /** Emitter for announcing a changed residual load series */
  public residualLoadEmitter: BehaviorSubject<Array<number>>;
  private prosumerInstance: ProsumerInstance;
  public netMarketActivityEmitter: Subject<string> = new Subject<string>();
  constructor(private time: TimeService,
              private session: SessionDataService,
              private helper: HelperService) {
    this.netMarketActivity = Array.from({length: this.time.getEndTime() + 1}, () => 0);
    //this.residualLoadSeries = Array.from({length: this.time.getEndTime()}, () => 0);
   // this.residualLoadEmitter.subscribe(() => this.residualLoadSeries);
    if(session.currentProsumer){
      this.prosumerInstance = session.currentProsumer;
    } else {
      session.prosumerEmitter.subscribe(currentProsumer => {
        this.prosumerInstance = currentProsumer;
      });
    }
    this.residualLoadEmitter  = new BehaviorSubject<Array<number>>(this.calculateResidualLoad())
    this.time.timeEmitter.subscribe(currentTime => {
      //Broadcast inbalance through
      this.inbalanceEmitter.next(this.calculateResidualLoad()[currentTime]);
    })
    this.time.doomsDayEmitter.subscribe(() => {
      this.registerLastFee();
    })
  }

  ngOnInit(){

  }

  /**
   * Method to calculate the residual load given the respective assets.
   * Aggregates the generation and consumption for the respective assets separately and then calculates the net load for each data point
   *
   * @returns the residual load series as aggregation of the individual generation and consumption of all assets of the respective prosumer instance
   */
  private calculateResidualLoad(): number[] {
    let aggregatedGeneration= Array(this.time.getEndTime() + 1).fill(0);
    let aggregatedLoad = Array(this.time.getEndTime() + 1).fill(0);
    let aggregatedStorage = Array(this.time.getEndTime() + 1).fill(0);

    // aggregate all nonControllable generators
    if (this.prosumerInstance.nonControllableGenerators[0]) {
      const generatorArrays = [];
      this.prosumerInstance.nonControllableGenerators.forEach(currentNCG => generatorArrays.push(currentNCG.powerSeries));
      aggregatedGeneration = this.helper.aggregateArrays(generatorArrays);
    }

    // aggregate all loads
    if (this.prosumerInstance.loads[0]) {
      const loadArrays = [];
      this.prosumerInstance.loads.forEach(currentLoad => {
        loadArrays.push(currentLoad.powerSeries)
      });
      aggregatedLoad = this.helper.aggregateArrays(loadArrays);
    }
    // invert all aggregated loads as they have negative impact on residual load
    const invertedLoad = aggregatedLoad.map(currentLoad => (-1) * currentLoad);

    // calculate change in storage capacity
    if (this.prosumerInstance.storage[0]) {
      let storageArrays= [];
      this.prosumerInstance.storage.forEach(storage => {
        let storageChange = [0];
        for (let i = 1; i <= this.time.getEndTime(); i++) {
          let change = storage.powerSeries[i-1] - storage.powerSeries[i];
          if (change < 0) { change += Math.round((1-storage.cycleEfficiency) * change * 1000) / 1000; } // account for loss when storing
          storageChange.push(change);
        }
        storageArrays.push(storageChange);
      });
      aggregatedStorage = this.helper.aggregateArrays(storageArrays);
    }
    return this.helper.aggregateArrays([aggregatedGeneration, invertedLoad, this.netMarketActivity, aggregatedStorage]);
  }

  /**
   *
   * @param timeStep The time step where market activity needs to be taken into account for
   * @param power The (signed) contracted power (+ injection, - drawing from the grid)
   */
  public addMarketActivity(timeStep: number, power: number){
    this.netMarketActivity[timeStep] += power;
    console.log('about to emit market activity');
    this.netMarketActivityEmitter.next('Emitting activity for ' + power + ' at timestep ' + timeStep);
  }

  getResidualLoad(){
    return this.calculateResidualLoad();
  }

  drawRL() {
    this.residualLoadEmitter.next(this.calculateResidualLoad());
  }

  registerLastFee() {
    let currentInbalance = this.calculateResidualLoad()[this.time.getEndTime()];
    console.log('Punishing inbalance of ' + currentInbalance + ' at time ' + (this.time.getEndTime()) +
        ' with a fee of ' + this.session.experimentInstance.instanceOfExperiment.inbalancePenalty[this.time.getEndTime()] +
        ' amounting to ' + Math.floor(currentInbalance) * this.session.experimentInstance.instanceOfExperiment.inbalancePenalty[this.time.getEndTime()]);
    currentInbalance = Math.floor(Math.abs(currentInbalance) * 10) / 10.0;
    if (currentInbalance >= 0.1) { // calculate fee in 0.1 steps
      const inbalanceFee = {
        timeStep: this.time.getEndTime(),
        inbalancePower: Math.round(currentInbalance * 100) / 100.0,
        inbalancePaid: Math.round(currentInbalance * this.session.experimentInstance.instanceOfExperiment.inbalancePenalty[this.time.getEndTime()] * 100) / 100
      }
      this.session.currentProsumer.amountTokens = Math.round((this.session.currentProsumer.amountTokens - inbalanceFee.inbalancePaid) * 100) / 100;
      this.session.marketResultManager.recordInbalanceFee(inbalanceFee);
    }
  }
}
