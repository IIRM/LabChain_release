import {EventEmitter, Injectable} from '@angular/core';
import { interval, Observable, Subject } from 'rxjs';
import { TimeRegime } from './data-types/TimeRegime';
import {LabchainDatabase} from "../researcher/LabchainDatabase";
import {SessionDataService} from "./session-data.service";
import {EdmConnectorService} from "./edmInterface/edm-connector.service";
import {MockEDMService} from "./mockStorageInterfaces/mock-edm.service";
import Swal from 'sweetalert2/dist/sweetalert2.js';
import {ResidualLoadService} from "../prosumer/residual-load.service";


@Injectable({
  providedIn: 'root'
})

/**
 * Service to manage and provide temporal information related with the experiment
 */
export class TimeService {
  /** Variable to store the time */
  private currentTime: number;
  /** A subject to notify observers about temporal updates */
  public timeEmitter: Subject<number> = new Subject<number>();
  /** The end time of the simulation */
  private endTime: number;
  /** The interval to periodically query data from APIs **/
  public watcherInterval = 2500;
  private timeRegime: TimeRegime;
  private experimentRunning = false;
  public doomsDayEmitter: EventEmitter<any> = new EventEmitter();

      constructor(private database: LabchainDatabase,
                  private sessionData: SessionDataService,
                  private edmConnector: EdmConnectorService,
                  private mockEDM: MockEDMService,) {
        this.currentTime = 0;
        // Set the respective time emitter to notify observers within the correct time regime
        this.database.getTimeRegime().subscribe(timeRegime => {
          this.timeRegime = timeRegime;
          console.log('time regime set to ' + timeRegime);
        });
        if (this.sessionData.experimentInstance) {
          this.endTime = this.sessionData.experimentInstance.instanceOfExperiment.experimentLength;
        } else {
          this.sessionData.experimentInstanceEmitter.subscribe(experimentDescription => {
            console.log('receiving experiment instance');
            this.endTime = experimentDescription.instanceOfExperiment.experimentLength;
          });
        }
      }

  /**
   * Function to start the experiment for the prosumer. Should only be called by the synchronizing backend.
   */
  public startExperiment(): void {
    if(this.experimentRunning) {
      console.error('Error! Experiment is already running!! Tried to start it once more!');
    } else {
      this.experimentRunning = true;
      if (this.timeRegime === TimeRegime.DISCRETE) {
        //TODO take from experiment description (external data), not the internal database
        this.discretePeriodicEmittance(this.database.getTimeStepLength());
      } else if (this.timeRegime === TimeRegime.CONTINUOUS) {
        this.continuousPeriodicEmittance(this.database.getAccellerationFactor());
      } else {
        console.error('Time Regime ' + this.timeRegime + ' is invalid!!!');
      }
    }
  }

  /**
   * Method to advance the time in the simulation and notify all observers
   *
   * @param amount The amount the time should progress
   */
  public advanceTime(amount: number): void {
    if (this.currentTime + amount <= this.endTime) {
      if (amount > 0) {
        this.currentTime += amount;
        this.timeEmitter.next(this.currentTime);
      }
    } else if (this.currentTime === this.endTime){
      console.log('ending condition reached');
      this.endExperiment();
    } else {
      throw new Error('the experiment ends before taking' + amount + ' time steps!');
      // TODO end experiment
    }
  }

  /**
   * Method to emit the time periodically within a discrete temporal scheme
   * Using the time emitter, the time is advanced by 1 step until the end time of the simulation is used every timeStepLength seconds
   *
   * @param timeStepLength An observable of the length of a time step within the discrete time regime (i.e. how many seconds each step should last)
   */
  private discretePeriodicEmittance(timeStepLength: Observable<number>) {
    timeStepLength.subscribe(stepLength => {
      const intervalCounter = interval(1000 * stepLength);
      intervalCounter.subscribe(() => {
        // if (this.currentTime === 0) {
        //   this.timeEmitter.next(0);
        // }
        if (this.endTime) {
          if ((this.currentTime < this.endTime) && this.experimentRunning) {
            this.advanceTime(1);
          } else if (this.experimentRunning && (this.currentTime === this.endTime)){
            this.endExperiment();
            this.experimentRunning = false;
          }
        }
      });
    });
  }

  public endExperiment(){
    console.log('ending experiment');
    Swal.fire('Thanks for your participation!');
    this.doomsDayEmitter.emit();
    this.experimentRunning = false;
    this.edmConnector.recordData(this.sessionData.experimentInstance, this.sessionData.currentProsumer);
    this.sessionData.closeSession(this.edmConnector);
    this.sessionData.closeSession(this.mockEDM);
  }

  /**
   * Method to emit the time periodically within a continuous temporal scheme
   * Using the time emitter, the time is advanced by the accellerationFactor until the end time of the simulation every second (to be more exact, the even is emitted every 100ms by a tenth of the accelleratioNFactor)
   *
   * @param accellerationFactor An observable of the factor by which the simulation is to be sped up from realtime (=1: progression in real-time)
   */
  private continuousPeriodicEmittance(accellerationFactor: Observable<number>) {
    accellerationFactor.subscribe(accFac => {
      const intervalCounter = interval(100);
      intervalCounter.subscribe(() => {
        if (this.endTime) {
          if (this.currentTime < this.endTime) {
            this.advanceTime(accFac / 10.0);
          }
        }
      });
    });
  }

  /**
   * Method to provide the end time of the simulation
   *
   * @returns The end time of the simulation
   */
  public getEndTime(): number {
    return this.endTime;
  }

  /**
   * Method to provide the current time of the service within the experiment
   *
   * @returns The time point of the service relative to the respective time regime
   */
  public getCurrentTime(): number {
    if(this.currentTime){
      return this.currentTime;
    } else {
      return 0;
    }
  }
}
