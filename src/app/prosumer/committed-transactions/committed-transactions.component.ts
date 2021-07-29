import { Component, OnInit } from '@angular/core';
import { BlockchainTransactionService } from '../../core/blockchainInterface/blockchain-transaction.service';
import { P2POption } from '../../core/data-types/P2POption';
import {BlockchainRelayService} from "../../core/interfaceRelayServices/blockchain-relay.service";
import {ProsumerInstance} from "../../core/data-types/ProsumerInstance";
import {SessionDataService} from "../../core/session-data.service";

@Component({
  selector: 'app-committed-transactions',
  templateUrl: './committed-transactions.component.html',
  styleUrls: ['./committed-transactions.component.css']
})

/**
 * Component to show the transactions that were already committed to / were purchased.
 * Uses the state of the BlockchainTransactionService to acquire the data and displays them in the respective view
 */
export class CommittedTransactionsComponent implements OnInit {
  /** array to holds the bids relevant for the view */
  respectiveBids: P2POption[] = [];
  /** array to hold the asks relevant for the view */
  respectiveAsks: P2POption[] = [];
  currentProsumer: ProsumerInstance;

  constructor(private bts: BlockchainRelayService,
              private session: SessionDataService) {
    this.respectiveBids = this.bts.getCommitedBids();
    this.respectiveAsks = this.bts.getCommitedAsks();
    this.currentProsumer = session.currentProsumer!;
  }

  ngOnInit() {
    // subscribe to the respective component of the bts, in order to receive updates on the committed bids
    this.bts.committedBidSubject.subscribe(bids => {
      this.respectiveBids = bids;
    });
    this.bts.committedAskSubject.subscribe( asks => {
      this.respectiveAsks = asks;
    });
  }
}
