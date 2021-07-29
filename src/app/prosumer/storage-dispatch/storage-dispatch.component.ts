import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StorageUnit } from '../../core/data-types/StorageUnit';
import { TimeService } from '../../core/time.service';
import { Subject } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { StorageOperationLogicService } from '../storage-operation-logic.service';
import { SessionDataService } from '../../core/session-data.service';
import { ResidualLoadService } from '../residual-load.service';

@Component({
  selector: 'app-storage-dispatch',
  templateUrl: './storage-dispatch.component.html',
  styleUrls: ['./storage-dispatch.component.css']
})

/**
 * Component to provide dispatch functionality for storage units
 * Allows for setting the respective functionality of the dispatch within operational bounds of the asset
 */
export class StorageDispatchComponent implements OnInit {
  /** The storage unit that is to be dispatched */
  @Input() asset!: StorageUnit;
  /** The emitter through which the asset dispatch is provided to the parent component */
  @Output() notifyCanvas = new EventEmitter();
  /** The maximal charge the storage unit can be set too for the respective time step given the technical constraints and dispatch data of the storage unit */
  public maxCharge: number = NaN;
  /** The maximal discharge the storage unit can be set too for the respective time step given the technical constraints and dispatch data of the storage unit */
  public maxDischarge: number = NaN;
  /** The form group to contain and validate the dispatch data for the generator in question */
  public scheduledDispatchForm = new FormGroup({
    timeStep: new FormControl('', (control: AbstractControl) => this.timeStepValidator(control)),
    scheduledDispatch: new FormControl('')
  });
  /** The residual load of the time step corresponding to the time step to schedule for */
  public correspondingResidualLoad: number = NaN;
  constructor(private timeService: TimeService,
              private session: SessionDataService,
              private residualLoadService: ResidualLoadService) {
    this.scheduledDispatchForm.valueChanges.subscribe(dispatchFormChange => {
      if(this.scheduledDispatchForm.get('timeStep')!.value){
        this.correspondingResidualLoad = this.residualLoadService.getResidualLoad()[this.scheduledDispatchForm.get('timeStep')!.value];
      } else {
        this.correspondingResidualLoad = NaN;
      }
    })
  }

  ngOnInit() {
    // emit the respective time service when it is available to the component in order to make it available for the temporal validator
    this.maxCharge = this.asset.feedinPower;
    this.maxDischarge = this.asset.feedoutPower;
  }


  /**
   * Method to change the slider ranges for the dispatch form element when the temporal context for the dispatch changes
   * Derives new generation range bounds based on the operational constraints as asserted by the AssetOperationLogicService
   */
  adjustSlider() {
    this.maxCharge = StorageOperationLogicService.deriveMaxChargeStorage(this.asset, this.scheduledDispatchForm.get('timeStep')!.value);
    this.maxDischarge = StorageOperationLogicService.deriveMaxDischargeStorage(this.asset, this.scheduledDispatchForm.get('timeStep')!.value);
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

  fulfillResidualLoad() {
    const plannedDispatchValue = this.residualLoadService.getResidualLoad()[this.scheduledDispatchForm.get('timeStep')!.value];
    this.asset.scheduleGeneration(this.scheduledDispatchForm.get('timeStep')!.value, plannedDispatchValue, this.timeService.getCurrentTime());
    this.session.assetSchedulingResultManager.recordAssetSchedulingDataPoint(this.asset, this.scheduledDispatchForm.get('timeStep')!.value, plannedDispatchValue,
        this.residualLoadService.getResidualLoad(), this.asset.powerSeries, this.timeService.getCurrentTime());
    this.scheduledDispatchForm.reset();
    this.residualLoadService.drawRL();
    this.notifyCanvas.emit();
  }
}
