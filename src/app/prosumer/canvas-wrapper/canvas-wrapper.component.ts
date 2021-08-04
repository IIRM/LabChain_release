import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { DispatchableAsset } from '../../core/data-types/DispatchableAsset';
import { Chart } from 'chart.js';
import { Load } from '../../core/data-types/Load';
import { ControllableGenerator } from '../../core/data-types/ControllableGenerator';
import { NonControllableGenerator } from '../../core/data-types/NonControllableGenerator';
import { FormControl, FormGroup } from '@angular/forms';
import { TimeService } from '../../core/time.service';

@Component({
  selector: 'app-canvas-wrapper',
  templateUrl: './canvas-wrapper.component.html',
  styleUrls: ['./canvas-wrapper.component.css']
})
export class CanvasWrapperComponent implements AfterViewInit {

  /** The respective asset to detail in the view */
  @Input() resource: DispatchableAsset | NonControllableGenerator;
  /** The chart element that comprises the visualization information used in the canvas for diplaying the load */
  loadChart: Chart;
  /** The element ref element that visualizes the information about the time series of the respective load */
  @ViewChild('canvas', {static: false}) canvas: ElementRef;
  /** The array containing the time series the is plotted and can be the full residual load time series or just a chunk of it */
  public plotData = [];
  /** The maximum length of the 2 days ahead plot data */
  public maxLength = 48;
  /** The form for radio button selection */
  public canvasForm = new FormGroup({
    partial: new FormControl(false)
  });

  constructor(private cd: ChangeDetectorRef,
              private timeService: TimeService) { }

  ngAfterViewInit(): void {
    this.loadGraph();

    this.timeService.timeEmitter.subscribe(() => {
      this.calculateMaxLength();
      this.loadGraph();
    });
  }

  /**
   * Method to load the graph for displaying the load curve.
   * Loads and sets the respective information and starts a change detection cycle
   */
  loadGraph(): void {
    if (this.loadChart !== undefined) {  // if destroy existing chart before redrawing as old chart will only be overlayed otherwise
      this.loadChart.destroy();
    }
    this.calculateMaxLength();
    let i;
    if (this.canvasForm.get('partial').value) {
      i = this.timeService.getCurrentTime();
      this.plotData = Object.assign([], this.resource.powerSeries.slice(this.timeService.getCurrentTime(), this.timeService.getCurrentTime() + this.maxLength + 1));
    } else {
      i = 0;
      this.plotData = Object.assign([], this.resource.powerSeries);
      this.plotData[0] = NaN;
    }
    this.loadChart = new Chart((this.canvas.nativeElement as HTMLCanvasElement).getContext('2d'), {
      type: 'line',
      data: {
        labels: this.plotData.map(() => (i++)),
        datasets: [{
          label: this.resource.model,
          data: this.plotData
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
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'time step'
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'power consumption (kW)'
            }
          }]
        },
        labelString: 'Power consumption of resource'
      }
    });
    this.cd.detectChanges();
  }

  /**
   * returns the label with respect to
   */
  private getLabel(): string {
    if (this.resource instanceof Load) {
      return 'scheduled load';
    } else if (this.resource instanceof ControllableGenerator) {
      return 'scheduled generation';
    } else if (this.resource instanceof NonControllableGenerator) {
      return 'projected generation'
    } else {
      return 'scheduled storage';
    }
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
