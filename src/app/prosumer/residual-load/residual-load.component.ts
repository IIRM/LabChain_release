import {Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef, ChangeDetectorRef, HostListener} from '@angular/core';
import { Chart } from 'chart.js';
import { ProsumerInstance } from '../../core/data-types/ProsumerInstance';
import { Observable } from 'rxjs';
import { ResidualLoadService } from "../residual-load.service";
import { TimeService } from '../../core/time.service';
import {FormControl, FormGroup} from '@angular/forms';
import {SessionDataService} from "../../core/session-data.service";

@Component({
  selector: 'app-residual-load',
  templateUrl: './residual-load.component.html',
  styleUrls: ['./residual-load.component.css']
})


/**
 * Component to display the residual time series of the combined assets of the respective prosumer
 * (i.e. the difference between generation and battery discharge and consumption and battery charge).
 * A negative value indicates a net consumption, whereas a positive number indicates a net generation.
 */
export class ResidualLoadComponent implements OnInit, AfterViewInit {
  /** An observable of the respective prosumer instance to display */
  @Input() prosumerObservable!: Observable<ProsumerInstance>;
  /** The element ref element that acts as the canvas for the chart */
  @ViewChild('canvas', {static: false}) canvas: ElementRef | undefined;
  /** The chart for visualizing the residual load */
  public loadPlot: Chart | undefined;
  /** The array containing the time series of the residual load to display */
  private residualLoadSeries: number[] = [];
  /** The array containing the time series that is plotted and can be the full residual load time series or just a chunk of it */
  public plotData: number[] = [];
  /** The array containing the color to each data point in plotData */
  public colorArray: string[] = [];
  /** The array containing the fee data that is plotted and can be the full fee data series or just a chunk of it */
  public feeData: number[] = [];
  /** The element ref element that acts as the canvas for the fee plot */
  @ViewChild('feeCanvas', {static: false}) feeCanvas: ElementRef | undefined;
  /** The chart for visualizing the fee data */
  public feePlot: Chart | undefined;
  /** The prosumer instance derived from the provided observable */
  private prosumerInstance: ProsumerInstance | undefined;
  /** The maximum length of the 2 days ahead plot data */
  public maxLength = 48;

  sticky: boolean = false;
  @ViewChild('stickyElement', {static: false}) element: ElementRef | undefined;
  elementPosition: any;
  @HostListener('window:scroll', ['$event'])
  handleScroll(){
    let windowScroll = window.pageYOffset;
    if(windowScroll > this.elementPosition + 100){ //add 16 since this is the length of the progress bar
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }

  /** The form for radio button selection */
  public residualLoadForm = new FormGroup({
    partial: new FormControl(false)
  });


  constructor(private cd: ChangeDetectorRef,
              private rlService: ResidualLoadService,
              private timeService: TimeService,
              private session: SessionDataService) { }

  ngOnInit() {
    this.prosumerObservable.subscribe(loadedProsumerInstance => {
      this.prosumerInstance = loadedProsumerInstance;
    });
    if(this.session.experimentInstance){
      this.feeData = this.session.experimentInstance.instanceOfExperiment.inbalancePenalty;
    } else {
      this.session.experimentInstanceEmitter.subscribe(experimentInstance => {
        this.feeData = experimentInstance.instanceOfExperiment.inbalancePenalty;
      })
    }
  }

  ngAfterViewInit(): void {
    this.elementPosition = this.element!.nativeElement.offsetTop
    this.rlService.residualLoadEmitter.subscribe((currentRLSeries) => {
      this.calculateMaxLength();
      this.residualLoadSeries = currentRLSeries;
      this.loadGraph();
      this.cd.detectChanges();
    });

    this.timeService.timeEmitter.subscribe(() => {
      this.calculateMaxLength();
      this.loadGraph();
    });
  }

  /**
   * Method to set up the chart data for the residual load chart based on the provided data
   */
  loadGraph(): void {
    if(this.loadPlot !== undefined) {
      this.loadPlot.destroy();
    }
    if(this.feePlot !== undefined) {
      this.feePlot.destroy();
    }
    let i: number;
    if (this.residualLoadForm.get('partial')!.value) {
      i = this.timeService.getCurrentTime();
      this.plotData = this.residualLoadSeries.slice(this.timeService.getCurrentTime(), this.timeService.getCurrentTime() + this.maxLength + 1);
      this.feeData = this.session.experimentInstance.instanceOfExperiment.inbalancePenalty.slice(this.timeService.getCurrentTime(), this.timeService.getCurrentTime() + this.maxLength + 1);
    } else {
      i = 0;
      this.plotData = this.residualLoadSeries;
      this.feeData = this.session.experimentInstance.instanceOfExperiment.inbalancePenalty;
    }
    this.colorArray = [];
    for (let j = 0; j < this.plotData.length; j++) {
      if (this.plotData[j] >= this.session.experimentInstance.instanceOfExperiment.p2pMarketDesign.feeAmount ||
          this.plotData[j] <= -1 * this.session.experimentInstance.instanceOfExperiment.p2pMarketDesign.feeAmount) {
        this.colorArray.push("#FA8072");
      } else {
        this.colorArray.push("#C9C9C9");
      }
    }
    let j = i;
    if (this.timeService.getCurrentTime() === 0) {
      this.plotData[0] = NaN;
      this.feeData[0] = NaN;
    }
    this.loadPlot = new Chart((this.canvas!.nativeElement as HTMLCanvasElement).getContext('2d')!, {
      type: 'line',
      data: {
        labels: this.plotData.map(() => ('t = ' + i++)),
        datasets: [{
          label: 'residual load',
          data: this.plotData,
          pointBackgroundColor: this.colorArray
        }]
      },
      options: {
        animation: {
          duration: 0
        },
        legend: {
          display: false
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'time step'
            }
          },
          y: {
            title: {
              display: true,
              text: 'residual load (kW)'
            }
          }
        },
      }
    });
    this.feePlot = new Chart((this.feeCanvas!.nativeElement as HTMLCanvasElement).getContext('2d')!, {
      type: 'line',
      data: {
        labels: this.feeData.map(() => ('t = ' + j++)),
        datasets: [{
          label: 'inbalance fees',
          data: this.feeData
        }]
      },
      options: {
        animation: {
          duration: 0
        },
        legend: {
          display: false
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'time step'
            }
          },
          y: {
            title: {
              display: true,
              text: 'fee (token/kWh)'
            }
          }
        },
      }
    });
    this.cd.detectChanges();
  }

  /** A buffer method to wait for the form control to update its value */
  public changeCase() {
    setTimeout(() => this.loadGraph());
  }

  /** calculates the maximum length of the plotted data */
  private calculateMaxLength() {
    this.maxLength = Math.min(this.timeService.getEndTime() - this.timeService.getCurrentTime(), 48);
  }
}
