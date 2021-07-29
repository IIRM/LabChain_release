import { Injectable } from '@angular/core';
import {BlockchainTransactionService} from "../blockchainInterface/blockchain-transaction.service";
import {MockBlockchainService} from "../mockStorageInterfaces/mock-blockchain.service";
import {BlockchainInterface} from "../data-types/interfaces";
import {Subject} from "rxjs";
import {P2POption} from "../data-types/P2POption";

@Injectable({
  providedIn: 'root'
})
export class BlockchainRelayService implements BlockchainInterface{

  private usedBlockchain: string;
  committedAskSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  committedBidSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  relevantOpenAsksSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  relevantOpenBidsSubject: Subject<P2POption[]> = new Subject<P2POption[]>();
  unconfirmedAskCommits: Set<P2POption> = new Set<P2POption>();
  unconfirmedBidCommits: Set<P2POption> = new Set<P2POption>();
  /** Emitters for the unconfirmed offers */
  unconfirmedBidCommitEmitter: Subject<Set<P2POption>> = new Subject<Set<P2POption>>();
  unconfirmedAskCommitEmitter: Subject<Set<P2POption>> = new Subject<Set<P2POption>>();
  /** Emitters for the offer that are committed to at the time of commitment submission */
  askCommitmentIntention: Subject<P2POption> = new Subject<P2POption>();
  bidCommitmentIntention: Subject<P2POption> = new Subject<P2POption>();

  constructor(private fokusChain: BlockchainTransactionService,
              private mockChain: MockBlockchainService) { }

  setUsedBlockchain(blockchainToUse: string){
    this.usedBlockchain = blockchainToUse;
    console.log('using blockchain ' + this.usedBlockchain);
    switch(blockchainToUse) {
      case 'fokusChain':
        this.fokusChain.committedAskSubject.subscribe(committedAsks => {
          this.committedAskSubject.next(committedAsks);
        });
        this.fokusChain.committedBidSubject.subscribe(committedBids => {
          this.committedBidSubject.next(committedBids);
        });
        this.fokusChain.relevantOpenAsksSubject.subscribe(openAsks => {
          this.relevantOpenAsksSubject.next(openAsks);
        });
        this.fokusChain.relevantOpenAsksSubject.subscribe(openBids => {
          this.relevantOpenAsksSubject.next(openBids);
        });
        this.fokusChain.unconfirmedBidCommitEmitter.subscribe(uBCs => {
          this.unconfirmedBidCommitEmitter.next(uBCs);
        });
        this.fokusChain.unconfirmedAskCommitEmitter.subscribe(uACs => {
          this.unconfirmedAskCommitEmitter.next(uACs);
        });
        break;
      case 'mockChain':
        this.mockChain.committedAskSubject.subscribe(committedAsks => {
          this.committedAskSubject.next(committedAsks);
        });
        this.mockChain.committedBidSubject.subscribe(committedBids => {
          this.committedBidSubject.next(committedBids);
        });
        this.mockChain.relevantOpenAsksSubject.subscribe(openAsks => {
          console.log('relaying relevant open ask subject');
          this.relevantOpenAsksSubject.next(openAsks);
        });
        this.mockChain.relevantOpenAsksSubject.subscribe(openBids => {
          this.relevantOpenAsksSubject.next(openBids);
        });
        break;
    }
  }


  commitToP2PAsk(askToCommitTo: P2POption): boolean {
    this.askCommitmentIntention.next(askToCommitTo);
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.commitToP2PAsk(askToCommitTo);
      case 'mockChain':
        return this.mockChain.commitToP2PAsk(askToCommitTo);
      default:
        console.error('No valid chain set in configuration!!');
        return false;
    }
  }

  commitToP2PBid(bidToCommitTo: P2POption): boolean {
    this.bidCommitmentIntention.next(bidToCommitTo);
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.commitToP2PBid(bidToCommitTo);
      case 'mockChain':
        return this.mockChain.commitToP2PBid(bidToCommitTo);
      default:
        console.error('No valid chain set in configuration!!');
        return false;
    }
  }

  getCommitedAsks(): P2POption[] {
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.getCommitedAsks();
      case 'mockChain':
        return this.mockChain.getCommitedAsks();
      default:
        console.error('No valid chain set in configuration!!');
        return null;
    }
  }

  getCommitedBids(): P2POption[] {
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.getCommitedBids();
      case 'mockChain':
        return this.mockChain.getCommitedBids();
      default:
        console.error('No valid chain set in configuration!!');
        return null;
    }
  }

  getOpenAsks(): P2POption[] {
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.getOpenAsks();
      case 'mockChain':
        return this.mockChain.getOpenAsks();
      default:
        console.error('No valid chain set in configuration!!');
        return null;
    }
  }

  getOpenBids(): P2POption[] {
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.getOpenBids();
      case 'mockChain':
        return this.mockChain.getOpenBids();
      default:
        console.error('No valid chain set in configuration!!');
        return null;
    }
  }

  submitAsk(ask: P2POption): boolean {
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.submitAsk(ask);
      case 'mockChain':
        return this.mockChain.submitAsk(ask);
      default:
        console.error('No valid chain set in configuration!!');
        return false;
    }
  }

  submitBid(bid: P2POption): boolean {
    switch (this.usedBlockchain){
      case 'fokusChain':
        return this.fokusChain.submitBid(bid);
      case 'mockChain':
        return this.mockChain.submitBid(bid);
      default:
        console.error('No valid chain set in configuration!!');
        return false;
    }
  }
}
