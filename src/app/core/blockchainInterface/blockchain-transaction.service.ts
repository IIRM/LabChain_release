import { Injectable } from '@angular/core';
import { P2POption } from '../data-types/P2POption';
import { TimeService } from '../time.service';
import { SessionDataService } from '../session-data.service';
import { BidValidationService } from './bid-validation.service';
import {CommittedOfferFilterService} from "./committed-offer-filter.service";
import {OfferSubmissionService} from "./offer-submission.service";
import {Subject} from "rxjs";
import {BlockchainInterface} from "../data-types/interfaces";

@Injectable({
  providedIn: 'root'
})

/**
 * The service facilitate the transactions for the blockchain.
 * It represents the binding element of the Angular/UI world and the blockchain it uses.
 * Encapsulates all functionality related with the blockchain layer within the LabChain project.
 * Provides an interface to the submission service and does some housekeeping to allow to hide uncommitted bids in the market view
 */
export class BlockchainTransactionService implements BlockchainInterface{
  /** Variable to track the bids that an other actor committed to */
  private committedBids: P2POption[] = [];
  /** Variable to track the asks that an other actor committed to */
  private committedAsks: P2POption[] = [];
  /** Variable to track the bids no actor committed to yet */
  private openBids: P2POption[] = [];
  /** Variable to track the asks no actor committed to yet */
  private openAsks: P2POption[] = [];
  /** Set to keep track of unconfirmed bids the participant issued to commit */
  public unconfirmedBidCommits: Set<P2POption> = new Set<P2POption>();
  /** Set to keep track of unconfirmed asks the participant issued to commit */
  public unconfirmedAskCommits: Set<P2POption> = new Set<P2POption>();
  /** Emitters for the unconfirmed offers */
  public unconfirmedBidCommitEmitter: Subject<Set<P2POption>> = new Subject<Set<P2POption>>();
  public unconfirmedAskCommitEmitter: Subject<Set<P2POption>> = new Subject<Set<P2POption>>();
  // Subjects that emit the respective Arrays to interested parties
  public relevantOpenAsksSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  public relevantOpenBidsSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  public committedBidSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  public committedAskSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  constructor(private timeService: TimeService,
              private state: SessionDataService,
              private bvs: BidValidationService,
              private offerReader: CommittedOfferFilterService,
              private blockchainSubmission: OfferSubmissionService) {
    console.log('FOKUS bts initialized');
    //update local data structures when new data is received
    this.offerReader.openAskSubject.subscribe(openAsks => {
      this.openAsks = openAsks;
    });
    this.offerReader.committedAskSubject.subscribe(committedAsks => {
      this.committedAsks = committedAsks.filter(currentAsk => ((currentAsk.acceptedParty === this.state.currentProsumer.respectiveProsumer.id) || (currentAsk.optionCreator.respectiveProsumer.id === this.state.currentProsumer.respectiveProsumer.id)));
      committedAsks.forEach(committedTransaction => {
        if(this.unconfirmedAskCommits.has(committedTransaction)){
          this.unconfirmedAskCommits.delete(committedTransaction);
        }
      });
      this.relevantOpenAsksSubject.next(this.getOpenAsks());
      this.committedAskSubject.next(this.committedAsks);
    });
    this.offerReader.openBidSubject.subscribe(openBids => {
      this.openBids = openBids;
    });
    this.offerReader.committedBidSubject.subscribe(committedBids => {
      this.committedBids = committedBids.filter(currentBid => ((currentBid.acceptedParty === this.state.currentProsumer.respectiveProsumer.id) || (currentBid.optionCreator.respectiveProsumer.id === this.state.currentProsumer.respectiveProsumer.id)));
      committedBids.forEach(currentTransaction => {
        if(this.unconfirmedBidCommits.has(currentTransaction)){
          this.unconfirmedBidCommits.delete(currentTransaction);
        }
      });
      this.relevantOpenBidsSubject.next(this.getOpenBids());
      this.committedBidSubject.next(this.committedBids);
    });
  }

  /**
   * Method to commit to (accept) an open bid by an interested actor.
   * Adds the respective transaction to the blockchain, and does the respective housekeeping with marking the bid to not be shown.
   *
   * @param bidToCommitTo The bid the participant is committing to
   * @returns true if this was successful, false if anything out of the ordinary happened, and the bid could not be committed to
   */
  public commitToP2PBid(bidToCommitTo: P2POption): boolean {
    this.blockchainSubmission.submitBidCommitment(bidToCommitTo);
    this.unconfirmedBidCommits.add(bidToCommitTo);
    this.unconfirmedBidCommitEmitter.next(this.unconfirmedBidCommits);
    return true;
  }

  /**
   * Method to commit to (accept) an open ask by an interested actor.
   * Adds the respective transaction to the blockchain, and does the respective housekeeping updating the open and committed bids stored in this service as well as informing the respective observers
   *
   * @param committedAsk The ask the seller is committing to
   * @returns true if this was successful, false if anything out of the ordinary happened, and the ask could not be committed to
   */
  public commitToP2PAsk(committedAsk: P2POption): boolean {
    this.blockchainSubmission.submitAskCommitment(committedAsk);
    this.unconfirmedAskCommits.add(committedAsk);
    this.unconfirmedAskCommitEmitter.next(this.unconfirmedAskCommits);
    return true;
  }

  // Getter for the bids and asks on the blockchain
  public getCommitedBids(): P2POption[] { return this.committedBids; }
  public getCommitedAsks(): P2POption[] { return this.committedAsks; }
  public getOpenBids(): P2POption[] {
    const bidsToReturn: Array<P2POption> = new Array<P2POption>();
    this.openBids.forEach(currentBid => {
      if((this.timeService.getCurrentTime() + this.state.experimentInstance.instanceOfExperiment.p2pMarketDesign.bidClosure) > currentBid.deliveryTime){
        console.log('too late for this, bud!');
      } else if (this.unconfirmedAskCommits.has(currentBid)){
        console.log('Is unconfirmed ask');
      } else {
        bidsToReturn.push(currentBid);
      }
    });
    //Filter out all bids whose delivery time is before the earliest point of delivery (now + bidClosure) or which the participant already committed to, but which haven't been confirmed yet
    return bidsToReturn
    //return this.openBids.filter(currentBid => ((this.timeService.getCurrentTime() + this.state.experimentInstance.instanceOfExperiment.p2pMarketDesign.bidClosure) > currentBid.deliveryTime)).filter(currentBid => this.unconfirmedBidCommits.has(currentBid));
  }
  public getOpenAsks(): P2POption[] {
    const asksToReturn: Array<P2POption> = new Array<P2POption>();
    this.openAsks.forEach(currentAsk => {
      if((this.timeService.getCurrentTime() + this.state.experimentInstance.instanceOfExperiment.p2pMarketDesign.askClosure) > currentAsk.deliveryTime){
        console.log('too late for this, bud!');
      } else if (this.unconfirmedAskCommits.has(currentAsk)){
        console.log('Is unconfirmed ask');
      } else {
        asksToReturn.push(currentAsk);
      }
    });
    //Filter out all asks whose delivery time is before the earliest point of delivery (now + bidClosure) or which the participant already committed to, but which haven't been confirmed yet
    //return this.openAsks.filter(currentAsk => ((this.timeService.getCurrentTime() + this.state.experimentInstance.instanceOfExperiment.p2pMarketDesign.askClosure) <= currentAsk.deliveryTime)).filter(currentAsk => !this.unconfirmedAskCommits.has(currentAsk));
    return asksToReturn;
  }

  /**
   * Method to submit a bid to the blockchain layer as an open bid.
   * Requires the bid to not have been committed before (i.e. not be in the list of open or committed bids) and to be valid.
   * Will otherwise not be successful.
   *
   * @param bid The bid to be committed to the blockchain
   * @returns Returns true if the bid has not been committed before and to be valid
   */
  submitBid(bid: P2POption): boolean {
    if (((this.openBids.indexOf(bid) === - 1) && (this.committedBids.indexOf(bid) === - 1)) && this.bvs.checkBidValidity(bid)) {
      this.blockchainSubmission.submitBid(bid);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Method to submit an ask to the blockchain layer as an open ask.
   * Requires the ask to not have been committed before (i.e. not be in the list of open or committed asks) and to be valid.
   * Will otherwise not be successful.
   *
   * @param ask The bid to be committed to the blockchain
   * @returns Returns true if the ask has not been committed before and to be valid
   */
  submitAsk(ask: P2POption): boolean {
    if (((this.openAsks.indexOf(ask) === -1) && (this.committedAsks.indexOf(ask) === -1)) && this.bvs.checkBidValidity(ask)) {
      this.blockchainSubmission.submitAsk(ask);
      return true;
    } else {
      return false;
    }
  }
}
