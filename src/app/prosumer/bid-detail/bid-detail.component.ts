import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { P2POption } from '../../core/data-types/P2POption';
import { BlockchainTransactionService } from '../../core/blockchainInterface/blockchain-transaction.service';
import { TimeService } from '../../core/time.service';
import {SessionDataService} from "../../core/session-data.service";
import {BlockchainRelayService} from "../../core/interfaceRelayServices/blockchain-relay.service";

@Component({
  selector: 'app-bid-detail',
  templateUrl: './bid-detail.component.html',
  styleUrls: ['./bid-detail.component.css']
})


/**
 * Component to display the details of a P2PBid and to provide bid commitment / purchase functionality of the detailed bid.
 * Commitment to the bid emits an event to the parent component to remove the detailed bid from the parent element
 */
export class BidDetailComponent implements OnInit {
  /** The respective P2PBid to detail */
  @Input() bid!: P2POption;
  /** An EventEmitted for removing the component from the parent element */
  @Output() removeComponent: EventEmitter<any> = new EventEmitter();
  constructor(private bts: BlockchainRelayService) { }

  ngOnInit() {
  }

  /**
   * Method for committing to the detailed bid by the current prosumer (i.e. the one the SessionDataService refers to) using the BlockchainTransactionService
   * Furthermore attempts to remove the component from the parent component if successful, since it doesn't represent a bid anymore
   */
  public purchase(): void {
    if (this.bts.commitToP2PBid(this.bid)) {
      this.removeComponent.emit();
    }
  }
}
