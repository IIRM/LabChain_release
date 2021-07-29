import { Component, Input, OnInit } from '@angular/core';
import { NonControllableGenerator } from '../../core/data-types/NonControllableGenerator';

@Component({
  selector: 'app-non-controllable-generation-prd',
  templateUrl: './non-controllable-generation-prd.component.html',
  styleUrls: ['./non-controllable-generation-prd.component.css']
})

/**
 * Component to display information about a non-controllable generation asset
 */
export class NonControllableGenerationPRDComponent implements OnInit {
  /** The generator to be displayed */
  @Input() resource!: NonControllableGenerator;
  /** The respective element ref that displays the canvas */
  public showResource = true;

  constructor() {
  }

  ngOnInit() {
  }
}
