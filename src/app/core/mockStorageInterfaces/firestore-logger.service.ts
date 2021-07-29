import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Helper service to log firestore-specific information to the console.
 * Allows for specifying the level of to print based on the priority of the message.
 * Furthermore it provide different logging domains for more fine-grained control.
 */
export class FirestoreLoggerService {

  private detailLevel = 2;
  constructor() {
  }

  /**
   * Logger for mock-blockchain-side offers being transformed from the firestore representation to the UI-layer representation
   * @param logMessage
   * @param priority
   */
  public offerPipelineLog(logMessage, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }

  /**
   * Logger for message concerning the creation/submission of offers on the mockchain
   * @param logMessage
   * @param priority
   */
  public offerGenerationLog(logMessage, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }

  /**
   * Logger for message wrt loading data from the store
   * @param logMessage
   * @param priority
   */
  public firestoreLoaderLog(logMessage, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }
}
