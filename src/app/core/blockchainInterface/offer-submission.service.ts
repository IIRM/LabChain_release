import { Injectable } from '@angular/core';
import {ResourceManagerService} from './resource-manager.service';
import {P2POption} from '../data-types/P2POption';
import {TimeService} from '../time.service';
import {BlockchainLoggerService} from './blockchain-logger.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import {PowerSeriesEntry} from '../data-types/response-types/RawOffer';
import {BlockchainHelperService} from "./blockchain-helper.service";
import {SessionDataService} from "../session-data.service";
import {Committment} from "../data-types/BlockchainOffer";

@Injectable({
  providedIn: 'root'
})
export class OfferSubmissionService {

  constructor(private resourceManager: ResourceManagerService,
              private timeService: TimeService,
              private logger: BlockchainLoggerService,
              private http: HttpClient,
              private blockchain: BlockchainHelperService,
              private session: SessionDataService) { }

  /**
   * Method to submit an ask to the blockchain layer as an open ask.
   * Requires the ask to not have been committed before (i.e. not be in the list of open or committed asks) and to be valid.
   * Will otherwise not be successful.
   *
   * @param ask The offer to be committed to the blockchain
   */
  submitAsk(ask: P2POption): void {
    this.resourceManager.requestFreeResourcePromise().then(resource => {
      this.logger.offerGenerationLog('Generating an ask offer corresponding to resource ' + resource.resourceID, 3);
      ask.id = resource.resourceID.split('-')[3];
      const zeroSeries = Array<PowerSeriesEntry>(96).fill({amount: 0, price: 0});
      //Trading windows are separated 48 steps apart; the tradingWindowTime
      const tradingWindowTime = this.blockchain.firstTradingWindow + (Math.floor(ask.deliveryTime / 48) * this.blockchain.timeScalingFactor);
      const askWindowSeries = new Array(96);
      // fill non-zero slots (offset from trade window + duration)
      for (let i = 0; i < 96; i++){
        if ((i >= (ask.deliveryTime % 48)) && (i < ((ask.deliveryTime % 48) + ask.duration))) {
          askWindowSeries[i] = {price: ask.price, amount: ask.power * 1000};
        } else {
          askWindowSeries[i] = {amount: 0, price: 0};
        }
      }
      this.logger.offerGenerationLog('Offer starting at ' + ask.deliveryTime + ' and lasting ' + ask.duration + ' translate to the following series in the ' + Math.floor(ask.deliveryTime / 48) + 'th trading window.', 2);
      this.logger.offerGenerationLog(askWindowSeries.toString(), 3);
      if(this.session.blockchainToken){
        this.http.post(this.blockchain.chainApi + '/trading/dayAhead/bid', {
          resourceID: resource.resourceID,
          utcTimeframe: tradingWindowTime.toString(),
          negativePowerSeries: zeroSeries,
          positivePowerSeries: askWindowSeries
        }, {observe: 'body', responseType: 'json'}).subscribe(askResponseData => {
          this.logger.offerGenerationLog('Created partial ask offer corresponding to resource ' + resource, 3);
          this.logger.offerGenerationLog(askResponseData.toString(), 3);
        });
        this.logger.offerGenerationLog('Generating DA ask with ID ' + resource.resourceID + ' and time ' + tradingWindowTime.toString(), 2);
      } else {
        this.session.tokenEmitter.subscribe(token => {
          this.http.post(this.blockchain.chainApi + '/trading/dayAhead/bid', {
            resourceID: resource.resourceID,
            utcTimeframe: tradingWindowTime.toString(),
            negativePowerSeries: zeroSeries,
            positivePowerSeries: askWindowSeries
          }, {observe: 'body', responseType: 'json'}).subscribe(askResponseData => {
            this.logger.offerGenerationLog('Created partial ask offer corresponding to resource ' + resource, 3);
            this.logger.offerGenerationLog(askResponseData.toString(), 3);
          });
          this.logger.offerGenerationLog('Generating DA ask with ID ' + resource.resourceID + ' and time ' + tradingWindowTime.toString(), 2);
        });
      }
    });
  }

  /**
   * Method to submit a bid to the blockchain layer as an open bid.
   * Requires the bid to not have been committed before (i.e. not be in the list of open or committed bids) and to be valid.
   * Will otherwise not be successful.
   *
   * @param bid The offer to be committed to the blockchain
   */
  submitBid(bid: P2POption): void {
    this.resourceManager.requestFreeResourcePromise().then(resource => {
      bid.id = resource.resourceID.split('-')[3];
      this.logger.offerGenerationLog('Generating a bid offer corresponding to resource ' + resource.resourceID, 3);
      const zeroSeries = Array<PowerSeriesEntry>(96).fill({amount: 0, price: 0});
      const tradingWindowTime = this.blockchain.firstTradingWindow + (Math.floor(bid.deliveryTime / 48) * this.blockchain.timeScalingFactor);
      const bidWindowSeries = new Array(96);
      // see if askWindowSeries needs to be interpolated
      for (let i = 0; i < 96; i++){
        if ((i >= (bid.deliveryTime % 48)) && (i < ((bid.deliveryTime % 48) + bid.duration))) {
          bidWindowSeries[i] = {price: bid.price, amount: bid.power * 1000};
        } else {
          bidWindowSeries[i] = {amount: 0, price: 0};
        }
      }
        if(this.session.blockchainToken){
          this.http.post(this.blockchain.chainApi + '/trading/dayAhead/bid', {
            resourceID: resource.resourceID,
            utcTimeframe: tradingWindowTime.toString(),
            positivePowerSeries: zeroSeries,
            negativePowerSeries: bidWindowSeries
          }, {observe: 'body', responseType: 'json'}).subscribe(bidResponseData => {
            this.logger.offerGenerationLog('Created partial ask offer corresponding to resource ' + resource, 3);
            this.logger.offerGenerationLog(bidResponseData.toString(), 2);
          });
          this.logger.offerGenerationLog('Generating DA bid with ID ' + resource.resourceID + ' and time ' + tradingWindowTime.toString(), 2);
          // If the token is not set yet, hold off with the request until the token is set
        } else {
          this.session.tokenEmitter.subscribe(token => {
            this.http.post(this.blockchain.chainApi + '/trading/dayAhead/bid', {
              resourceID: resource,
              utcTimeframe: tradingWindowTime.toString(),
              positivePowerSeries: zeroSeries,
              negativePowerSeries: bidWindowSeries
            }, {observe: 'body', responseType: 'json'}).subscribe(bidResponseData => {
              this.logger.offerGenerationLog('Created partial ask offer corresponding to resource ' + resource, 3);
              this.logger.offerGenerationLog(bidResponseData.toString(), 3);
            });
          });
          this.logger.offerGenerationLog('Generating DA bid with ID ' + resource.resourceID + ' and time ' + tradingWindowTime.toString(), 2);
          console.log('positive power series is ');
          console.log(bidWindowSeries);
        }
    });
  }

  /**
   * Function allowing to commit to an offer by matching the time series of the offer (no partial acceptance).
   * translates the P2POption to the blockchain-side format and executes the respective HTTP request
   * @param offerToCommit The offer to which the participant shall commit
   */
  submitBidCommitment(offerToCommit: P2POption){
    //construct a series of the offer as a zero-series whos first duration entries are overwritten
    const zeroSeries: Array<Committment> = new Array<Committment>(96).fill({share: 0.0});
    const commitmentSeries: Array<Committment> = new Array<Committment>(96).fill({share: 0.0});
    for(let i = (offerToCommit.deliveryTime % 48) ; i < (offerToCommit.duration + (offerToCommit.deliveryTime % 48)); i ++ ){
      commitmentSeries[i] = {share: 1.0};
    }
    console.log(commitmentSeries);
    //Add commitment to the blockchain
    const requestParams = new HttpParams()
        .set('utcTimeframe', (this.blockchain.firstTradingWindow + (Math.floor(offerToCommit.deliveryTime/48) * this.blockchain.timeScalingFactor)).toString())
        .set('resourceID', this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + offerToCommit.optionCreator.respectiveProsumer.id + '-' + offerToCommit.id);
    this.http.put(this.blockchain.chainApi + '/trading/dayAhead/bid/ask', {
      negativePowerSeries: commitmentSeries,
      positivePowerSeries: zeroSeries
    }, {params: requestParams}).subscribe(result => {
      this.logger.offerGenerationLog('Commit for bid ' + offerToCommit.id + ' submitted to the chain', 2);
      this.logger.offerGenerationLog(result.toString(), 2);
    });
  }

  /**
   * Function allowing to commit to an offer by matching the time series of the offer (no partial acceptance).
   * translates the P2POption to the blockchain-side format and executes the respective HTTP request
   * @param offerToCommit The offer to which the participant shall commit
   */
  submitAskCommitment(offerToCommit: P2POption){
    //construct a series of the offer as a zero-series whos first duration entries are overwritten
    const zeroSeries: Array<Committment> = new Array<Committment>(96).fill({share: 0.0});
    const commitmentSeries: Array<Committment> = new Array<Committment>(96).fill({share: 0.0});
    // const commitmentSeries: Array<PowerSeriesEntry> = new Array<PowerSeriesEntry>(96).fill({price: 0, amount: 0});
    for(let i = (offerToCommit.deliveryTime % 48); i < (offerToCommit.duration + (offerToCommit.deliveryTime % 48)); i ++ ){
      commitmentSeries[i] = {share: 1.0};
    }
    // //Add commitment to the blockchain
    // console.log(commitmentSeries);
    // console.log(zeroSeries);
    const requestParams = new HttpParams()
        .set('utcTimeframe', (this.blockchain.firstTradingWindow + (Math.floor(offerToCommit.deliveryTime/48) * this.blockchain.timeScalingFactor)).toString())
        .set('resourceID', this.session.experimentInstance.instanceOfExperiment.id + '-' + this.session.experimentInstance.experimentID + '-' + offerToCommit.optionCreator.respectiveProsumer.id + '-' + offerToCommit.id);
    this.http.put(this.blockchain.chainApi + '/trading/dayAhead/bid/ask', {
      negativePowerSeries: zeroSeries,
      positivePowerSeries: commitmentSeries
    }, {params: requestParams}).subscribe(result => {
      this.logger.offerGenerationLog('Commit for ask ' + offerToCommit.id + ' submitted to the chain', 2);
      this.logger.offerGenerationLog(result.toString(), 2);
    });
  }
}
