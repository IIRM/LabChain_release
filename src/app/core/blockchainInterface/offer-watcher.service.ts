import { Injectable } from '@angular/core';
import {RawOffer} from '../data-types/response-types/RawOffer';
import {Subject} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BlockchainLoggerService} from './blockchain-logger.service';
import {BlockchainHelperService} from "./blockchain-helper.service";
import {SessionDataService} from "../session-data.service";
import {TimeService} from "../time.service";

@Injectable({
  providedIn: 'root'
})
/**
 * The OfferWatcherService serves to periodically extract the raw offers from the API and emits them on the rawOfferStream.
 * As offers can only be retrieved
 * It allows listeners to get a periodic snapshot of all offers mined in transactions on the chain within a given time frame.
 * It emits these raw offers through the rawOfferStream, which notifies subscribers of the current offer state on the chain.
 */
export class OfferWatcherService {
  // Stream to send the raw offers as watched from the blockchain
  public rawOfferStream: Subject<Map<number, RawOffer[]>> = new Subject<Map<number, RawOffer[]>>();
  constructor(private http: HttpClient,
              private blockchain: BlockchainHelperService,
              private session: SessionDataService,
              private logger: BlockchainLoggerService,
              private timeService: TimeService) {
    console.log('Initializing offer watcher service');
    //periodicalyl watch the blockchain transactions
    if (this.session.blockchainToken){
      this.watchCycle();
      this.logger.watcherLog('Offer watch cycle initialized', 2);
    } else {
      this.session.tokenEmitter.subscribe(token => {
        this.watchCycle();
        this.logger.watcherLog('Offer watch cycle initialized', 2);
      });
    }
  }

  /**
   * Function for continuously polling the blockchain for transactions in use.
   * Sends a casted version of the resources with the respective found offers for the coming trading frames through the rawOfferStream
   * and schedules repeated execution based on the watcherInterval
   */
  private watchCycle(): void {
    //Dictionary to associate the responses with their respective time steps (simulation time of the trading frames)
    let promiseMap: Map<number, Promise<Object>> = new Map<number, Promise<Object>>();
    //Array to gather all promises in order to ensure all promises have been resolved
    let promiseSet: Array<Promise<Object>> = new Array<Promise<Object>>();
    //Issue a number of GET requests for retrieving offers (as many as trading frames are left in the simulation)
    for(let i = Math.floor(this.timeService.getCurrentTime()/48); i < 4; i++){
      this.logger.watcherLog('In for loop watch cycle', 4);
      const requestParams = new HttpParams()
        .set('utcTimeframe', (this.blockchain.firstTradingWindow + (i * this.blockchain.timeScalingFactor)).toString());
      this.logger.watcherLog('requesting for ' + i + 'th block at time ' + (this.blockchain.firstTradingWindow + (i * this.blockchain.timeScalingFactor)).toString(), 3);
      this.logger.watcherLog('attempting to add promise No. ' + i, 5);
      //this.logger.watcherLog(this.http.get(this.blockchain.chainApi + '/trading/dayAhead/bid', {params: requestParams}).toPromise(), 3);
      //Prepare the request as promise and add to the map
      const currentPromise: Promise<Object> = this.http.get(this.blockchain.chainApi + '/trading/dayAhead/bid', {params: requestParams}).toPromise();
      promiseMap.set(i*48, currentPromise);
      promiseSet.push(currentPromise);
    }
    //Wait until all promises are resolved
    Promise.all(promiseSet).then(timeframesOfferResponseArray => {
      //TODO check if the valuePromiseSet adds something or if the promiseSet would work just as well
      let valuePromiseSet: Array<Promise<Object>> = new Array<Promise<Object>>();
      this.logger.watcherLog('All ' + promiseMap.size + ' promises resolved in offer watch cycle', 3);
      let rawOfferMap: Map<number, Array<RawOffer>> = new Map<number, Array<RawOffer>>();
      //go through all trading frames and extract the offers belonging to them as rawOffers
      promiseMap.forEach((value, key) => {
        valuePromiseSet.push(value);
        value.then(currentOfferResponse => {
          const currentRawOffers: Array<RawOffer> = new Array<RawOffer>();
          this.logger.watcherLog('Response for timestep ' + key, 4);
          this.logger.watcherLog(currentOfferResponse.toString(), 4);
          //TODO check why the bids are not set in the rawOfferMap to begin with
          if (currentOfferResponse.hasOwnProperty("bids")) {
            currentOfferResponse['bids'].forEach(currentRawOffer => {
              currentRawOffers.push(currentRawOffer);
            });
          }
          this.logger.offerPipelineLog('Setting ' + currentRawOffers.length + ' entries for time step ' + key, 5);
          //set return map for the respective time step
          rawOfferMap.set(key, currentRawOffers);
          this.logger.offerPipelineLog('Map recorded ' + rawOfferMap.get(key).length + ' entries for time step ' + key, 5);
        });
      });
      //After all promises are resolved and the rawOfferMap prepared, propagate it to the respective receivers
      Promise.all(valuePromiseSet).then(resolve => {
          this.logger.watcherLog('loggin promise map', 3);
          this.logger.watcherLog(rawOfferMap.toString(), 3);
          this.logger.offerPipelineLog("sending the raw offers with a total of " + rawOfferMap.size + ' time steps', 5);
          this.rawOfferStream.next(rawOfferMap);
          //test clean up to facilitate garbage collection
          valuePromiseSet = null;
          rawOfferMap = null;
          promiseMap = null;
          promiseSet = null;
        });
    }).catch(error => {
      console.log(error);
    });
    //Schedule repeated execution after a time period determined by the watcherInterval
    setTimeout(() => {this.watchCycle();}, this.timeService.watcherInterval);
  }
}
