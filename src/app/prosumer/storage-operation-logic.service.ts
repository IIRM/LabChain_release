import { Injectable } from '@angular/core';
import { StorageUnit } from '../core/data-types/StorageUnit';

@Injectable({
  providedIn: 'root'
})

export class StorageOperationLogicService {
  /** returns the maximum possible value for charging storage unit at a time step
   * *
   * @param asset Storage unit under consideration
   * @param timeStep Time step of (dis-)charge
   */
  static deriveMaxChargeStorage(asset: StorageUnit, timeStep: number) {
    return Math.min(asset.storageCapacity - Math.max(...asset.powerSeries.slice(timeStep)), asset.feedinPower);
  }

  /** returns minimum value of remaining scheduled storage that can be discharged at a time step
   *
   * @param asset Storage unit under consideration
   * @param timeStep Time step of (dis-)charge
   */
  static deriveMaxDischargeStorage(asset: StorageUnit, timeStep: number) {
    return -Math.min(...asset.powerSeries.slice(timeStep), asset.feedoutPower);
  }

  /**
   * Actual scheduling of an asset given a certain time and a (dis)charge value with respect to the current time
   *
   * @param asset Storage Unit that is (dis)charged
   * @param timeStep Time of (dis)charge
   * @param dispatchValue Amount of (dis)charge energy
   * @param currentTime The progressed time of the experiment
   */
  static schedule(asset: StorageUnit, timeStep: number, dispatchValue: number, currentTime: number) {
    if (timeStep < currentTime) {
      console.log('tried to (dis)charge ' + asset.model + ' at time ' + timeStep + ' while time has already progressed to ' + currentTime);
      return;
    }
    if (dispatchValue + Math.min(...asset.powerSeries.slice(timeStep)) < 0) {
      console.error('dispatch value results in negative storage values ' + (Math.min(...asset.powerSeries) + dispatchValue));
    } else
    if (dispatchValue + Math.max(...asset.powerSeries.slice(timeStep)) > asset.storageCapacity) {
      console.error('dispatch value leads to overstepping the storage capacity of ' + asset.storageCapacity);
    } else {
      if (dispatchValue > 0) {
        dispatchValue = Math.round(dispatchValue * asset.cycleEfficiency * 1000) / 1000;
      }
      for (let i = timeStep; i < asset.powerSeries.length; i++) {
        asset.powerSeries[i] = asset.powerSeries[i] + dispatchValue;
      }
    }
  }
}
