import { Injectable } from '@angular/core';
import {Subject} from "rxjs";
import {ExperimentInstance} from "./data-types/ExperimentInstance";
import {ProsumerInstance} from "./data-types/ProsumerInstance";
import {MarketResultManager} from "./data-types/experiment-results/marketResults";
import {AssetSchedulingResultManager} from "./data-types/experiment-results/assetSchedulingResults";
import {EDMInterface} from "./data-types/interfaces";
import {ProsumerResults} from "./data-types/experiment-results/prosumerResults";
import {HelperService} from "../shared/helper.service";
import {ReducedTransactionFeeEntry} from "./data-types/TransactionFeeEntry";

/**
 * Service to retrieve and administer all relevant session data of the experiment execution.
 * Serves as interface to the edm and data authority within the UI side
 */

@Injectable({
  providedIn: 'root'
})
export class SessionDataService {
  public blockchainToken: string = "";
  public experimentInstance: ExperimentInstance;
  /** The prosumers participating in the experiment **/
  public experimentProsumers: ProsumerInstance[] = [];
  /** The prosumer instance participating in the experiment */
  public currentProsumer: ProsumerInstance | undefined;
  // Emitter objects for notifying interested components in token, currentProsumer and experimentInstance acquisition
  public tokenEmitter: Subject<string> = new Subject<string>();
  public prosumerEmitter: Subject<ProsumerInstance> = new Subject<ProsumerInstance>();
  public experimentInstanceEmitter: Subject<ExperimentInstance> = new Subject<ExperimentInstance>();
  //Record state of whether the participant is ready to start the experiment
  public readyForExperiment = false;
  public marketResultManager = new MarketResultManager();
  public assetSchedulingResultManager = new AssetSchedulingResultManager();
  public sessionDataEmitter: Subject<string> = new Subject<string>();
  constructor() {
  }

  public setCurrentProsumer(prosumer: ProsumerInstance){
    console.log('setting prosumer ' + prosumer.respectiveProsumer.name);
    this.currentProsumer = prosumer;
    this.prosumerEmitter.next(this.currentProsumer);
  }

  public setExperimentInstance(experiment: ExperimentInstance){
    this.experimentInstance = experiment;
    console.log(experiment.instanceOfExperiment);
    console.log('experiment instance being set; emitting it now');
    this.experimentInstanceEmitter.next(experiment);
  }

  public setExperimentProsumers(prosumers: ProsumerInstance[]): void{
    this.experimentProsumers = prosumers;
  }

  public storeBlockchainToken(token: string): void {
    this.blockchainToken = token;
    this.tokenEmitter.next(token);
    console.log('Blockchain token ' + token + ' added in session data');
  }

  public selectBlockchainUsername(user: number): string{
    return ('uni_leipzig' + (user - 310) + '@fokus.fraunhofer.de');
  }
  closeSession(edmInterface: EDMInterface){
    const reducedPaidFees: Array<ReducedTransactionFeeEntry> = this.currentProsumer!.paidFees.map(transactionFee => HelperService.reducedTransactionCaster(transactionFee));
    const prosumerData: ProsumerResults = {
      paidFees: reducedPaidFees,
      finalAmountTokens: this.currentProsumer!.amountTokens
    }
    edmInterface.storeData('prosumer data for prosumer with id ' + this.currentProsumer!.respectiveProsumer.id, 'prosumer data for prosumer with id ' + this.currentProsumer!.respectiveProsumer.id, prosumerData);
    edmInterface.storeData('prosumer market data for prosumer with id ' + this.currentProsumer!.respectiveProsumer.id, 'prosumer market data for prosumer with id ' + this.currentProsumer!.respectiveProsumer.id, this.marketResultManager.toDictionary());
    edmInterface.storeData('prosumer scheduling data for prosumer with id ' + this.currentProsumer!.respectiveProsumer.id, 'prosumer scheduling data for prosumer with id ' + this.currentProsumer!.respectiveProsumer.id, {schedulingDataPoints: this.assetSchedulingResultManager.toDictionary()});
    this.sessionDataEmitter.next(this.parseSessionData(this.marketResultManager, this.assetSchedulingResultManager));
  }

  private parseSessionData(marketResultManager: MarketResultManager, assetSchedulingManager: AssetSchedulingResultManager): string{
    let sessionDataString = 'paidFees: ' + this.currentProsumer!.paidFees.toString() + '\n';
    sessionDataString += 'finalAmountTokens: ' + this.currentProsumer!.amountTokens + '\n';
    sessionDataString += 'askCommitmentMarketActivity' + JSON.stringify(marketResultManager.toDictionary().askCommitmentMarketActivity) + '\n';
    sessionDataString += 'askMarketActivity' + JSON.stringify(marketResultManager.toDictionary().askMarketActivity) + '\n';
    sessionDataString += 'bidCommitmentMarketActivity' + JSON.stringify(marketResultManager.toDictionary().bidCommitmentMarketActivity) + '\n';
    sessionDataString += 'bidMarketActivity' + JSON.stringify(marketResultManager.toDictionary().bidMarketActivity) + '\n';
    sessionDataString += 'feedInActivity' + JSON.stringify(marketResultManager.toDictionary().feedInActivity) + '\n';
    sessionDataString += 'retailActivity' + JSON.stringify(marketResultManager.toDictionary().retailActivity) + '\n';
    sessionDataString += 'inbalanceFees' + JSON.stringify(marketResultManager.toDictionary().inbalanceFees) + '\n';
    sessionDataString += 'assetScheduling' + JSON.stringify(assetSchedulingManager.toDictionary()) + '\n';
    console.log(sessionDataString);
    return sessionDataString;
  }
}
