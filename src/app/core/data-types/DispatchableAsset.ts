/**
 * Superclass for all assets whose generation / consumption of energy can be changed arbitrarily (at least to some degree), i.e. that can be dispatched.
 * Allows to schedule the generation / consumption (as negative generation) of the respective assets.
 * Semantics of the scheduling and asset operation need to be implemented with the respective asset.
 *
 * @param model The string describing the model of the respective asset
 */
export class DispatchableAsset {

  public powerSeries: number[] = [];

  constructor(
    readonly model: string
    ) {}

  /**
   * Method to schedule the generation of the respective asset.
   * Does not perform validity checks, which need to be done with the respective methods
   *
   * @param timeStep The time step the generation is to be scheduled for
   * @param dispatchValue The quantity of generation scheduled for the respective time
   * @param currentTime The amount of time progressed in the experiment
   */
  public scheduleGeneration(timeStep: number, dispatchValue: number, currentTime: number) {
    this.powerSeries[timeStep] = dispatchValue;
    console.error('please define scheduleGeneration for model: ' + this.model);
  }

  /**
   * Method to initialize the load schedule if not yet initialized
   * For this, storage is prepared with 0 schedule.
   * If storage is already initialized, nothing happens
   *
   * @param experimentLength The planned experiment lengthß
   */
  public initiateSchedule(experimentLength: number) {
    if (this.powerSeries === undefined) {
      this.powerSeries = new Array<number>(experimentLength);
      this.powerSeries.fill(0);
    }
  }

  public toDictionary(){
    return {
      powerSeries: this.powerSeries,
      model: this.model
    }
  }
}
