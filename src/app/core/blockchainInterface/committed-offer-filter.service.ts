import { Injectable } from '@angular/core';
import {P2POption} from '../data-types/P2POption';
import {Subject} from 'rxjs';
import {BlockchainOfferProcessorService} from './blockchain-offer-processor.service';
import {BlockchainLoggerService} from './blockchain-logger.service';


@Injectable({
  providedIn: 'root'
})
/**
 * Class to filter the offers retrieved from the blockchain into those that are available and those that are taken.
 * Checks for purchasers of the respective offers and emits the respective streams.
 */
export class CommittedOfferFilterService {

  public openBidSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  public openAskSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  public committedBidSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  public committedAskSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  constructor(private blockchainOfferProcessor: BlockchainOfferProcessorService,
              private logger: BlockchainLoggerService){
    this.logger.offerPipelineLog('Committed offer filter initialized', 3);
    //Upon receiving a new set of asks, filter them by whether they have an accepted party (committedAsk) or not (openAsk) and emit the respective streams
    blockchainOfferProcessor.P2PAskStream.subscribe(currentAskSet => {
      const openAsks: Array<P2POption> = new Array<P2POption>();
      const committedAsks: Array<P2POption> = new Array<P2POption>();
      currentAskSet.forEach(currentOffer => {
        if(currentOffer.acceptedParty === null){
          openAsks.push(currentOffer);
        } else {
          committedAsks.push(currentOffer);
        }
      });
      this.logger.watcherLog('Emitting the stream of ' + openAsks.length + ' open ask offers', 3);
      this.openAskSubject.next(openAsks);
      this.logger.watcherLog('Emitting the stream of ' + committedAsks.length + ' committed ask offers', 3);
      this.committedAskSubject.next(committedAsks);
      this.logger.watcherLog('Detected ' + openAsks.length + ' open and ' + committedAsks.length + ' committed asks', 2);
    });
    //Upon receiving a new set of bids, filter them by whether they have an accepted party (committedBid) or not (openBid) and emit the respective streams
    blockchainOfferProcessor.P2PBidStream.subscribe(currentBidSet => {
      const openBids: Array<P2POption> = new Array<P2POption>();
      const committedBids: Array<P2POption> = new Array<P2POption>();
      currentBidSet.forEach(currentOffer => {
        if(currentOffer.acceptedParty === null){
          openBids.push(currentOffer);
        } else {
          this.logger.offerPipelineLog('Accepting party of offer: ' + currentOffer.acceptedParty, 3);
          committedBids.push(currentOffer);
        }
      });
      this.logger.watcherLog('Emitting the stream of ' + openBids.length + ' open bid offers', 3);
      this.openBidSubject.next(openBids);
      this.logger.watcherLog('Emitting the stream of ' + committedBids.length + ' committed bid offers', 3);
      this.committedBidSubject.next(committedBids);
      this.logger.watcherLog('Detected ' + openBids.length + ' open and ' + committedBids.length + ' committed bids', 2);
    });
  }
}
