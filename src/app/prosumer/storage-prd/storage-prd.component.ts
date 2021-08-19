import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { StorageUnit } from '../../core/data-types/StorageUnit';
import { TimeService } from '../../core/time.service';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';

@Component({
  selector: 'app-storage-prd',
  templateUrl: './storage-prd.component.html',
  styleUrls: ['./storage-prd.component.css']
})

/**
 * Component to display the information for an energy storage unit as persistent resource.
 *
 */
export class StoragePRDComponent implements OnInit {
  /** The respective storage unit to display */
  @Input() resource!: StorageUnit;
  /** The child canvas component to redraw chart */
  @ViewChild(CanvasWrapperComponent, {static: false}) canvasWrapperComponent!: CanvasWrapperComponent;
  /** selection variable whether the display should be shown or hidden */
  public showResource = true;
  /** variable to hold the state of charge of the respective battery */
  public currentSOC: number = NaN;

  constructor(
    private timeService: TimeService
  ) { }

  ngOnInit() {
    this.currentSOC = this.resource.powerSeries[0];
    this.timeService.timeEmitter.subscribe(timeUpdate => {
      this.currentSOC = this.resource.powerSeries[timeUpdate];
    });
  }

  public notifyCanvas(){
    this.canvasWrapperComponent.loadGraph();
  }
}
