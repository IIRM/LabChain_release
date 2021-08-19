import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import { SessionDataService } from '../session-data.service';
import { LabchainDatabase } from '../../researcher/LabchainDatabase';
import { TimeService } from '../time.service';
import { TimeRegime } from '../data-types/TimeRegime';

@Component({
  selector: 'app-time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css']
})

/**
 * The TimeComponent manages the monitoring of time within the simulation.
 * It is used to display temporal information within the simulation
 *
 */
export class TimeComponent implements OnInit, AfterViewInit {
  /** Variable to depict the length of the experiment */
  public experimentLength;
  /** Variable to store the time within the experiment (how far it progressed) */
  public experimentTime: number;
  /** Stores the timeRegime (as TimeRegime.DISCRETE or TimeRegime.CONTINUOUS) in order to show the respective component */
  public timeRegime;
  public discreteRegime = TimeRegime.DISCRETE;
  public continuousRegime = TimeRegime.CONTINUOUS;
  /** Variable to contain the date to show progress appropriately */
  public dateView = new Date(0, 0, 0, 0, 0, 0, 0);
  /** Variable to hold the progress of the simulation */
  public progress = 0;
  /** Flag to indicate whether the experiment started */
  public experimentRunning = false;

  sticky: boolean = false;
  @ViewChild('stickyTime', {static: false}) timeElement: ElementRef;
  timePosition: any;
  @HostListener('window:scroll', ['$event'])
  handleScroll(){
    const windowScroll = window.pageYOffset;
    if(windowScroll >= this.timePosition){
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }


  constructor(private state: SessionDataService,
              private database: LabchainDatabase,
              public timeService: TimeService) { }

  ngOnInit() {
    // Set the length of the experiment with the data obtained from the data provision service
    if(this.state.experimentInstance){
      this.experimentLength = this.state.experimentInstance.instanceOfExperiment.experimentLength;
    } else {
      this.state.experimentInstanceEmitter.subscribe(experimentInstance => {
        this.experimentLength = experimentInstance.instanceOfExperiment.experimentLength;
      });
    }
    // Obtain the current time from the time service
    this.experimentTime = this.timeService.getCurrentTime();
    // subscribe to the time emitter of the time service to receive updates on the simulation time
    this.timeService.timeEmitter.subscribe(newTime => {
      this.experimentTime = newTime;
      this.progress = this.experimentTime / this.experimentLength;
      this.dateView.setSeconds(newTime);
    });
    // Set the time regime the simulation is configured with
    this.database.getTimeRegime().subscribe(regime => this.timeRegime = regime);
  }

  ngAfterViewInit(){
    this.timePosition = this.timeElement.nativeElement.offsetTop
  }

  public storeData(){
    this.timeService.endExperiment();
  }

  startSimulation() {
    this.timeService.startExperiment();
    this.experimentRunning = true;
  }
}
