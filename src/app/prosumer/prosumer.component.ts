import { Component, OnInit, ViewChild } from '@angular/core';
import { Prosumer } from '../core/data-types/Prosumer';
import { ActivatedRoute } from '@angular/router';
import { Location} from '@angular/common';
import { ProsumerInstance } from '../core/data-types/ProsumerInstance';
import {Observable, of} from 'rxjs';
import {SessionDataService} from "../core/session-data.service";
import {ExperimentInstance} from "../core/data-types/ExperimentInstance";
import {SocketioService} from "../core/coordinationInterface/socketio.service";
import {ResourceManagerService} from "../core/blockchainInterface/resource-manager.service";
import {ResidualLoadComponent} from './residual-load/residual-load.component';
import {ResidualLoadService} from "./residual-load.service";

@Component({
  selector: 'app-prosumer',
  templateUrl: './prosumer.component.html',
  styleUrls: ['./prosumer.component.css']
})

/**
 * (Top-level) component to host all relevant information for a prosumer
 */
export class ProsumerComponent implements OnInit {
  /** The prosumer to be displayed */
  public prosumer: Prosumer;
  /** The id of the experiment the prosumer is participanting in */
  public experimentId: number;
  private experiment: ExperimentInstance;
  /** selection variable that indicates whether the persistant resource display should be shown or not */
  public showPRD = true;
  /** selection variable that indicates whether the peer-to-peer editor should be shown or not */
  public showP2PEditor = false;
  /** selection variable that indicates whether the market view should be shown or not */
  public showMarketView = false;
  /** selection variable that indicates whether the fee and levy display should be shown or not */
  public showFeeLevy = true;
  /** An observable of the prosumer instance connected to the prosumer */
  public prosumerInstance: Observable<ProsumerInstance>;
  /** A variable that allows access to methods in the residual load component */
  @ViewChild(ResidualLoadComponent, {static: false}) residualLoadComponent: ResidualLoadComponent;
  /** Toggle variable to toggle the view for displaying information */
  /** selection variable that indicates which other view to include in the component view */
  public currentView = undefined;
  public readyButton = false;
  public recordedData = '';
  public residualLoadActivity = '';

  private readynessDeclared = false;
  constructor( private route: ActivatedRoute,
               private location: Location,
               private ess: SessionDataService,
               private coordinationService: SocketioService,
               private resourceManager: ResourceManagerService,
               private residualLoad: ResidualLoadService) {
  }

  ngOnInit() {
    if(this.ess.currentProsumer){
      this.prosumerInstance = of (this.ess.currentProsumer);
      this.prosumer = this.ess.currentProsumer.respectiveProsumer;
    } else {
      this.ess.prosumerEmitter.subscribe(currentProsumer => {
        this.prosumerInstance = of (currentProsumer);
        this.prosumer = currentProsumer.respectiveProsumer;
      });
    }
    if(this.ess.experimentInstance){
      this.experiment = this.ess.experimentInstance;
      this.experimentId = this.experiment.experimentID;
    } else {
      this.ess.experimentInstanceEmitter.subscribe(experimentInstance => {
        this.experiment = experimentInstance;
      });
    }
    if(this.resourceManager.resourceAvailable()){
      this.readyButton = true;
    } else {
      this.resourceManager.poolEmitter.subscribe(poolState => {
        if(poolState['available'] > 0){
          this.readyButton = !this.readynessDeclared;
        }
      });
    }
    this.ess.sessionDataEmitter.subscribe(sessionData => {
      console.log('setting recorded data to');
      console.log(sessionData);
      this.recordedData = sessionData;
    });
    this.residualLoad.netMarketActivityEmitter.subscribe(marketActivity => {
      console.log('registering netMarketActivity');
      console.log(marketActivity);
      this.residualLoadActivity += '\n' + marketActivity + '\n';
    });
  }

  /**
   * Selection method to change the component that should be shown
   *
   * @param newView string of component to be shown (BidEditor, MarketView, FeeView)
   */
  public changeView(newView: string): void {
    this.currentView = newView;
  }

  //TODO make safer by waiting for confirmation for registration
  private signalReadyness(){
    this.coordinationService.signalReadyness();
    this.ess.readyForExperiment = true;
    this.readynessDeclared = true;
  }
}
