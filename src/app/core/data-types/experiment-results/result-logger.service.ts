import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Helper service to log information specific to loggin results to the console.
 * Allows for specifying the level of to print based on the priority of the message.
 * Furthermore it provides different logging domains for more fine-grained control.
 */
export class ResultLoggerService {

  private static detailLevel = 2;

  constructor() {
  }

  /**
   * Logger for logging market results
   * @param logMessage
   * @param priority
   */
  public static marketResultLog(logMessage, priority: number) {
    if (priority <= this.detailLevel) {
      console.log(logMessage);
    }
  }

  /**
   * Logger for logging scheduling results
   * @param logMessage
   * @param priority
   */
  public static schedulingResultLog(logMessage, priority: number) {
    if (priority <= this.detailLevel) {
      console.log(logMessage);
    }
  }

  /**
   * Logger for logging miscellaneous results
   * @param logMessage
   * @param priority
   */
  public static miscResultLog(logMessage, priority: number) {
    if (priority <= this.detailLevel) {
      console.log(logMessage);
    }
  }
}
