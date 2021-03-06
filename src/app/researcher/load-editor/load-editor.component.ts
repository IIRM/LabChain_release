import { Component, OnInit } from '@angular/core';
import { LabchainDatabase } from '../LabchainDatabase';
import { Load } from '../../core/data-types/Load';
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-load-editor',
  templateUrl: './load-editor.component.html',
  styleUrls: ['./load-editor.component.css']
})

/**
 * Component that allows the creation of loads for the configuration of the respective experiments.
 * Allows to create (valid) loads out of nothing or to base a new load on an existing (parameterized) load.
 * A load is valid if the model name is unique, the load curve consists of a comma-separated list of non-negative values, its temporal shifting is non-negative and its relative controllability is within the unit interval.
 */
export class LoadEditorComponent implements OnInit {
  /** container for the respective assets loaded from the data base */
  public loads: Load[];
  /** subject wrapper for the loaded assets for injecting them in the validator */
  private loadSubject: Subject<Load[]> = new Subject<Load[]>();
  /** entry selection model for choosing preconfigured, existing assets */
  selectedModel = '';

  /**
   * Form Group (loadForm) representing the load to edit with
   * draftModel: the (preliminary) model string of the asset
   * draftLoadProfile: the (preliminary) load profile, i.e. time series for consumed electricity of the asset
   * draftRelativeControllability: the (preliminary) amount of consumption that can be shifted to another time point
   * draftTemporalShiftingCapability: the (preliminary) maximal time that shifted consumption can be shifted
   */
  public loadForm = new FormGroup({
    draftModel: new FormControl('', this.modelValidator),
    draftLoadProfile: new FormControl('', this.loadProfileValidator),
    draftRelativeControllability: new FormControl('', this.relativeControllabilityValidator),
    draftTemporalShiftingCapability: new FormControl('', this.temporalShiftingCapabilityValidator)
  });

  /**
   * Constructor sets up the templates from which new assets can be derived.
   * Uses the respective EDMService for accessing the 'Energiedatenmarkt' hosting the data
   *
   * @param mes The service accessing the EDM data base
   */
  constructor(private mes: LabchainDatabase) {
    mes.getConfiguredLoads().subscribe(retrievedLoads => {
      this.loads = retrievedLoads;
      this.loadSubject.next(this.loads);
    });
  }

  ngOnInit() {
  }

  /**
   * Validator for the model entry in the form.
   * The model name must be different from any other model in the data base in order to validate
   */
  modelValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const loadSub = this.loadSubject;
      loadSub.subscribe(existingLoads => {
        this.loads = existingLoads;
      });
      let errorString = '';
      this.loads.forEach(currentLoad => {
        if (currentLoad.model === control.value) {
          errorString = ('Chosen model name is already taken by ' + currentLoad.model);
        }
      });
      if (errorString !== '') {
        return {
          modelError: errorString
        };
      } else {
        return null;
      }
    };
  }

  /**
   * Validator for the load profile entry in the form.
   * Entry validates its a valid series of (non-negative) floating point values, separated by commas
   *
   */
  private loadProfileValidator(): ValidatorFn {
    const lpRegex = /^([0-9]*\.[0-9]*,\s*)*([0-9]*\.[0-9]*)$/i;
    return (control: AbstractControl) => {
      return lpRegex.test(control.value) ? null : {
        loadProfileError: 'loadProfile needs to consist of a comma-separated series of floating point numbers'
      };
    };
  }

  /**
   * Validator for the temporal shifting capability entry in the form.
   * Entry validates when its a non-negative number
   */
  private temporalShiftingCapabilityValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (control.value < 0) {
        return {
          temporalShiftingCapabilityError: 'temporal shifting capability cant be negative'
        };
      } else {
        return null;
      }
    };
  }

  /**
   * Validator for the relative controllability entry in the form.
   * Entry validates when its within the unit interval (between 0 and 1)
   */
  private relativeControllabilityValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      if ((control.value > 1.0) || (control.value < 0)) {
        return {
          relativeControllabilityError: 'relative controllability has to be in the unit interval'
        };
      } else {
        return null;
      }
    };
  }

  /**
   * Function to set the input fields of the form to the respective values corresponding to the load selected in the selection list (select / option element in the .html of the component)
   */
  setParameters(): void {
    this.loads.forEach(currentLoad => {
      if (currentLoad.model === this.selectedModel) {
        this.loadForm.get('draftModel').setValue(currentLoad.model);
        this.loadForm.get('draftLoadProfile').setValue(currentLoad.powerSeries.toString());
        this.loadForm.get('draftRelativeControllability').setValue(currentLoad.relativeControllability);
        this.loadForm.get('draftTemporalShiftingCapability').setValue(currentLoad.temporalShiftingCapability);
      }
    });
  }

  /**
   * Function to reset the input fields in the html file of the component (resetting to empty strings or 0-values)
   */
  resetParameters(): void {
    this.loadForm.get('draftModel').setValue('');
    this.loadForm.get('draftLoadProfile').setValue('');
    this.loadForm.get('draftRelativeControllability').setValue(0);
    this.loadForm.get('draftTemporalShiftingCapability').setValue(0);
  }

  /**
   * Function to store the drafted asset according to the values specified in the form through the respective EDM service
   */
  storeLoadTemplate() {
    this.mes.addNewLoad(new Load(
      this.loadForm.get('draftModel').value,
      this.loadForm.get('draftRelativeControllability').value,
      this.loadForm.get('draftTemporalShiftingCapability').value
    ));
  }
}
