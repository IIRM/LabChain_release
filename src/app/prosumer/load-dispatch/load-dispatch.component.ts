import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Load } from '../../core/data-types/Load';
import { TimeService } from '../../core/time.service';
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { LoadOperationLogicService } from '../load-operation-logic.service';
import { SessionDataService } from '../../core/session-data.service';
import { ResidualLoadService } from '../residual-load.service';

@Component({
  selector: 'app-load-dispatch',
  templateUrl: './load-dispatch.component.html',
  styleUrls: ['./load-dispatch.component.css']
})

/**
 * Component to provide dispatch functionality for loads
 * Allows for setting the respective functionality of the dispatch within operational bounds of the asset
 */
export class LoadDispatchComponent implements OnInit {
  /** The load that is to be dispatched */
  @Input() asset!: Load;
  /** The emitter through which the asset dispatch is provided to the parent component */
  @Output() notifyCanvas = new EventEmitter();
  /** The maximal consumption the load can be set too for the respective time step given the technical constraints and dispatch data of the load */
  public maxLoad: number = NaN;
  /** The minimal consumption the load can be set too for the respective time step given the technical constraints and dispatch data of the load */
  public minLoad: number = NaN;
  /** The form group to contain and validate the dispatch data for the generator in question */
  public scheduledDispatchForm = new FormGroup({
    timeStep: new FormControl('', (control: AbstractControl) => this.timeStepValidator(control)),
    scheduledDispatch: new FormControl('')
  });

  constructor(private timeService: TimeService,
              private session: SessionDataService,
              private residualLoadService: ResidualLoadService) {
  }

  ngOnInit() {
    // emit the respective time service when it is available to the component in order to make it available for the temporal validator
    this.maxLoad = this.asset.powerSeries[this.timeService.getCurrentTime()] +
      this.asset.shiftingPotential[this.timeService.getCurrentTime()][this.timeService.getCurrentTime()];
    this.minLoad = this.asset.powerSeries[this.timeService.getCurrentTime()] -
      this.asset.shiftingPotential[this.timeService.getCurrentTime()][this.timeService.getCurrentTime()];
  }

  /**
   * Method to change the slider ranges for the dispatch form element when the temporal context for the dispatch changes
   * Derives new generation range bounds based on the operational constraints as asserted by the AssetOperationLogicService
   */
  adjustSlider() {
    this.maxLoad = LoadOperationLogicService.deriveMaxLoadOperationValue(this.asset, this.scheduledDispatchForm.get('timeStep')!.value, this.timeService.getCurrentTime());
    this.minLoad = LoadOperationLogicService.deriveMinLoadOperationValue(this.asset, this.scheduledDispatchForm.get('timeStep')!.value);
  }

  /**
   * Method to schedule the dispatch for the respective time step when the dispatch schedule is changed in the respective form.
   * Uses the scheduling emitter to propagate the dispatch scheduling to the respective context
   */
  scheduleTimeStep() {
    this.asset.scheduleGeneration(this.scheduledDispatchForm.get('timeStep')!.value, this.scheduledDispatchForm.get('scheduledDispatch')!.value, this.timeService.getCurrentTime());
    this.session.assetSchedulingResultManager.recordAssetSchedulingDataPoint(this.asset, this.scheduledDispatchForm.get('timeStep')!.value, this.scheduledDispatchForm.get('scheduledDispatch')!.value,
        this.residualLoadService.getResidualLoad(), this.asset.powerSeries, this.timeService.getCurrentTime());
    this.scheduledDispatchForm.reset();
    this.residualLoadService.drawRL();
    this.notifyCanvas.emit();
  }

  /**
   * Validator function to provide validation for the temporal dimension of the asset dispatch scheduling
   */
  private timeStepValidator(control: AbstractControl) {
    if (this.timeService) {
      if (control.value < this.timeService.getCurrentTime()) {
        return { timeStepError: 'asset cant be scheduled anymore since time is ' + this.timeService.getCurrentTime() }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  public getCurrentTime() {
    return this.timeService.getCurrentTime();
  }

  public getEndTime() {
    return this.timeService.getEndTime();
  }
}
