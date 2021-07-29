import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Service to hold mostly static data for the blockchain functionality such as the URL, the timestamp reference of the first time step in the simulation and the timestamp increment of a time step according to the blockchain market design.
 * Shift the beginning of the time frame of interest (utcTimeframe) with the progress of time through the timeEmitter.
 */
export class BlockchainHelperService {
  chainApi = 'https://set-api-smartcities.apps.osc.fokus.fraunhofer.de';
  firstTradingWindow = 1695513600;
  //utcTimeframe = 1607472000;
  startingTime = this.firstTradingWindow;
  //time between trading windows
  timeScalingFactor = 96*15*60;
  optimalResourcePoolSize = 6;
  constructor(){
  }
}
