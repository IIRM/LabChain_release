import { Component, OnInit } from '@angular/core';
import { TransactionFeeEntry } from '../core/data-types/TransactionFeeEntry';
import {SessionDataService} from "../core/session-data.service";
import {ExperimentInstance} from "../core/data-types/ExperimentInstance";
import {LabchainDatabase} from "../researcher/LabchainDatabase";

@Component({
  selector: 'app-public-actor',
  templateUrl: './public-actor.component.html',
  styleUrls: ['./public-actor.component.css']
})

/**
 * (Top-level) component for the view of the public actor.
 * Shows a list of all fees collected from transactions within the respective simulation
 */
export class PublicActorComponent implements OnInit {
  /** The identifier of the experiment concluded */
  public experimentId: number = NaN;
  private experiment: ExperimentInstance = new ExperimentInstance();
  /** A local set of data for the transaction fee entries */
  public transactionFeeData: Set<TransactionFeeEntry> = new Set<TransactionFeeEntry>();

  constructor(
    private data: LabchainDatabase,
    private ess: SessionDataService,
    ) { }

  ngOnInit() {
    if(this.ess.experimentInstance){
      this.experiment = this.ess.experimentInstance;
      this.experimentId = this.experiment.experimentID;
    } else {
      this.ess.experimentInstanceEmitter.subscribe(experimentInstance => {
        this.experiment = experimentInstance;
      });
    }
    this.transactionFeeData = this.data.getMockPublicActorData();
  }
}
