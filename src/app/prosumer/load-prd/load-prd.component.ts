import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Load } from '../../core/data-types/Load';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';

@Component({
  selector: 'app-load-prd',
  templateUrl: './load-prd.component.html',
  styleUrls: ['./load-prd.component.css'],
})

/**
 * Component to display properties of the load as asset information element
 */
export class LoadPRDComponent implements OnInit {
  /** The respective asset to detail in the view */
  @Input() resource!: Load;
  /** The child canvas component to redraw chart */
  @ViewChild(CanvasWrapperComponent, {static: false}) canvasWrapperComponent!: CanvasWrapperComponent;
  /** Toggle variable to toggle the view for displaying information */
  public showResource = true;

  constructor() {
  }

  ngOnInit() {
  }

  public notifyCanvas(){
    this.canvasWrapperComponent.loadGraph();
  }
}
