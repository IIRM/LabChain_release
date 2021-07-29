import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ControllableGenerator } from '../../core/data-types/ControllableGenerator';
import { CanvasWrapperComponent } from '../canvas-wrapper/canvas-wrapper.component';

@Component({
  selector: 'app-controllable-generation-prd',
  templateUrl: './controllable-generation-prd.component.html',
  styleUrls: ['./controllable-generation-prd.component.css']
})

/**
 * Component to display properties of the controllable generator as asset information element
 */
export class ControllableGenerationPRDComponent implements OnInit {
  /** The respective asset to detail in the view */
  @Input() resource: ControllableGenerator;
  /** The child canvas component to redraw chart */
  @ViewChild(CanvasWrapperComponent, {static: false}) canvasWrapperComponent: CanvasWrapperComponent;
  /** Toggle variable to toggle the view for displaying information */
  public showResource = true;

  constructor() {}

  ngOnInit() {
  }

  public notifyCanvas(){
    this.canvasWrapperComponent.loadGraph();
  };
}
