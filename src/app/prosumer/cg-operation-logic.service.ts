import { Injectable } from '@angular/core';
import { ControllableGenerator } from '../core/data-types/ControllableGenerator';

@Injectable({
  providedIn: 'root'
})

export class CGOperationLogicService {

  constructor() {
  }

  /**
   * Returns the minimal possible generation of the controllable generator at a given time step with respect to the progressed time in the experiment.
   *
   * @param asset The controllable generator currently operated
   * @param timeStep The time under consideration
   * @param currentTime The current time of the experiment
   */
  static deriveMinimalGenerationCG(asset: ControllableGenerator, timeStep: number, currentTime: number): number {
    let minimalGeneration: number;

    if (timeStep > 0 && asset.powerSeries !== undefined) {
      // obtain number of time steps since last down or up time
      const possibleTimeStepsBack = CGOperationLogicService.getPossibleTimeStepsBack(asset, timeStep, currentTime);
      // obtain number of time steps to next down or up time considering the minimal down time
      // const possibleTimeStepsToFuture = CGOperationLogicService.getPossibleTimeStepsInFuture(asset, timeStep + asset.minimalDowntime);

      // get generation at last up or down time and calculate minimum generation
      const minimalGenerationPast = asset.powerSeries[timeStep - possibleTimeStepsBack] - possibleTimeStepsBack * (asset.rampingParameter * asset.maximalGeneration);
      // get generation before future ramping and calculate minimum generation
      // let minimalGenerationFuture = 0;
      // if (timeStep + possibleTimeStepsToFuture + asset.minimalDowntime < asset.ramping.length) {
      //   minimalGenerationFuture = asset.scheduledGeneration[timeStep + possibleTimeStepsToFuture + asset.minimalDowntime] - possibleTimeStepsToFuture * (asset.rampingParameter * asset.maximalGeneration);
      // }
      minimalGeneration = Math.max(0, minimalGenerationPast); // , minimalGenerationFuture);
      return minimalGeneration;
    } else {
      return undefined;
    }
  }

  /**
   * Returns the maximal possible generation of the controllable generator at a given time step with respect to the progressed time in the experiment.
   *
   * @param asset The controllable generator currently operated
   * @param timeStep The time under consideration
   * @param currentTime The current time of the experiment
   */
  static deriveMaximalGenerationCG(asset: ControllableGenerator, timeStep: number, currentTime: number): number {
    let maximalGeneration: number;

    if (timeStep > 0 && asset.powerSeries !== undefined) {
      // obtain number of time steps since last downtime/uptime
      const possibleTimeStepsBack = CGOperationLogicService.getPossibleTimeStepsBack(asset, timeStep, currentTime);
      // obtain number of time steps that can be taken to next ramping considering the minimal up time
      // const possibleTimeStepsToFuture = CGOperationLogicService.getPossibleTimeStepsInFuture(asset, timeStep + asset.minimalUptime);

      // get generation at last up or down time and calculate maximum generation
      const maximalGenerationPast = asset.powerSeries[timeStep - possibleTimeStepsBack] + possibleTimeStepsBack * (asset.rampingParameter * asset.maximalGeneration);

      // get generation before future ramping and calculate minimum generation
      // let maximalGenerationFuture = asset.maximalGeneration;
      // if (timeStep + possibleTimeStepsToFuture + asset.minimalUptime < asset.ramping.length) {
      //   maximalGenerationFuture = asset.scheduledGeneration[timeStep + possibleTimeStepsToFuture + asset.minimalUptime] + possibleTimeStepsToFuture * (asset.rampingParameter * asset.maximalGeneration);
      //   }
      maximalGeneration = Math.min(asset.maximalGeneration, maximalGenerationPast); // , maximalGenerationFuture);
      return maximalGeneration;
    } else {
      return undefined;
    }
  }

  /**
   * Returns the number of time steps to last down or up time. If there has not been any scheduling it should return the current time.
   *
   * @param asset The controllable generator currently operated
   * @param schedulingTime The time under consideration
   * @param currentTime The current time of the experiment
   */
  private static getPossibleTimeStepsBack(asset: ControllableGenerator, schedulingTime: number, currentTime: number): number {
    let numberStepsBack = 0;
    let timeCopy = schedulingTime;

    while (asset.ramping[timeCopy] === 'r' && timeCopy > currentTime) {
      numberStepsBack += 1;
      timeCopy -= 1;
    }

    return numberStepsBack;
  }

  /**
   * Returns the number of time steps that would be free for down time
   *
   * @param asset The controllable generator currently operated
   * @param schedulingTime The time under consideration
   */ /*
  private static getPossibleTimeStepsInFuture(asset: ControllableGenerator, schedulingTime: number): number {
    let numberFutureSteps = 0;
    let timeCopy = schedulingTime;

    while (asset.ramping[timeCopy] === 'r' && timeCopy < asset.ramping.length) {
      numberFutureSteps += 1;
      timeCopy += 1;
    }

    return numberFutureSteps;
  }*/

  /**
   * Schedules the submitted values at a given time and makes changes in scheduledGeneration as well as the shiftable load.
   *
   * @param asset Load under consideration
   * @param timeStep Time step the new load value will be scheduled
   * @param dispatchValue New load value that should be scheduled
   * @param currentTime Time progressed in the experiment so far
   */
  public static schedule(asset: ControllableGenerator, timeStep: number, dispatchValue: number, currentTime: number) {

    // check validity
    if (asset.ramping[timeStep] === 'x') {
      console.error('cannot schedule ' + dispatchValue + ' at time step ' + timeStep + ' as ' + asset.model + ' is still in minimal up or down time');
    } else if (asset.ramping[timeStep] === '+' || asset.ramping[timeStep] === '-') {
      console.error('cannot schedule ' + dispatchValue + ' at time step ' + timeStep + ' as ' + asset.model + ' is still ramping');
    } else {
      let startRampingTime = timeStep;
      let diff = dispatchValue - asset.powerSeries[timeStep];
      // Case 1: ramping up
      if (diff > 0) {
        // this.scheduledGeneration[timeStep] = dispatchValue;

        while (Math.round((diff * 100)) / 100 > 0) {
          diff = diff - (asset.maximalGeneration * asset.rampingParameter);
          startRampingTime = startRampingTime - 1;
        }

        if (startRampingTime < currentTime) {
          console.error('ramping start preceeds current time! Start time is ' + diff);
          return;
        }

        // calc gradient given correct starting time
        const gradient = (dispatchValue - asset.powerSeries[startRampingTime]) / (timeStep - startRampingTime); // y/x

        // start ramping up
        let startTime = startRampingTime + 1;
        while (startTime <= timeStep) {
          asset.powerSeries[startTime] = asset.powerSeries[startTime] + (gradient * (startTime - startRampingTime));
          asset.ramping[startTime] = '+';
          startTime++;
        }
        // block ramping
        for (let i = timeStep + 1; i < asset.powerSeries.length; i++) {
          asset.powerSeries[i] = dispatchValue;
          if (i <= timeStep + asset.minimalUptime) {
            asset.ramping[i] = 'x';
          }
        }
      } else {
        // Case 2: ramping down
        while (diff < 0) {
          diff = diff + (asset.maximalGeneration * asset.rampingParameter);
          startRampingTime = startRampingTime - 1;
        }

        if (startRampingTime < currentTime) {
          console.error('ramping start preceeds current time!');
          return;
        }

        // calc gradient given correct starting time
        const gradient = (dispatchValue - asset.powerSeries[startRampingTime]) / (timeStep - startRampingTime); // y/x

        // start ramping down
        let startTime = startRampingTime + 1;
        while (startTime <= timeStep) {
          asset.powerSeries[startTime] = asset.powerSeries[startTime] + (gradient * (startTime - startRampingTime));
          asset.ramping[startTime] = '-';
          startTime++;
        }

        // block ramping
        for (let i = timeStep + 1; i < asset.powerSeries.length; i++) {
          asset.powerSeries[i] = dispatchValue;
          if (i <= timeStep + asset.minimalUptime) {
            asset.ramping[i] = 'x';
          }
        }
      }
    }
  }
}

/*
removed code from scheduling at a point in time where cg is still ramping which is code that cannot be reached
      // still ramping up
      if (asset.scheduledGeneration[timeStep - 1] < dispatchValue && asset.ramping[timeStep - 1] === '+') {
        asset.ramping[timeStep] = '+';
        // TO DO check validity i.e. t-1 + rampParameter >= dispatchValue
        asset.scheduledGeneration[timeStep] = dispatchValue;
        for (let i = timeStep + 1; i <= timeStep + asset.minimalUptime; i++) {
          asset.ramping[i] = 'x';
        }
        // TO DO schedule to the end
      } else
        // still ramping down
      if (asset.scheduledGeneration[timeStep - 1] > dispatchValue && asset.ramping[timeStep - 1] === '-') {
        asset.ramping[timeStep] = '-';
        for (let i = timeStep + 1; i <= timeStep + asset.minimalDowntime; i++) {
          asset.ramping[i] = '-';
        }
      }
 */
