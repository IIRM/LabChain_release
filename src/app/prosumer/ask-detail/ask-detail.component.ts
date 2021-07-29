import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { P2POption } from '../../core/data-types/P2POption';
import { BlockchainTransactionService } from '../../core/blockchainInterface/blockchain-transaction.service';
import { TimeService } from '../../core/time.service';
import {SessionDataService} from "../../core/session-data.service";
import {BlockchainRelayService} from "../../core/interfaceRelayServices/blockchain-relay.service";

@Component({
  selector: 'app-ask-detail',
  templateUrl: './ask-detail.component.html',
  styleUrls: ['./ask-detail.component.css']
})

// TODO allow for toggling to see with and without fees & levies

/**
 * Component to display the details of a P2POption and to provide ask commitment / purchase functionality of the detailed ask.
 * Commitment to the ask emits an event to the parent component to remove the detailed ask from the parent element
 */
export class AskDetailComponent implements OnInit {
  /** The respective P2POption to detail */
  @Input() ask!: P2POption;
  /** An EventEmitted for removing the component from the parent element */
  @Output() removeComponent: EventEmitter<any> = new EventEmitter();
  constructor(private bts: BlockchainRelayService) { }

  ngOnInit() {
  }

  /**
   * Method for committing to the detailed ask by the current prosumer (i.e. the one the SessionDataService refers to) using the BlockchainTransactionService
   * Furthermore attempts to remove the component from the parent component if successful, since it doesn't represent a ask anymore
   */
  public sell(): void {
    if (this.bts.commitToP2PAsk(this.ask)) {
      this.removeComponent.emit();
    }
  }
}
