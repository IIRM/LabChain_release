import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
/**
 * Helper service to log blockchain-specific information to the console.
 * Allows for specifying the level of to print based on the priority of the message.
 * Furthermore it provide different logging domains for more fine-grained control.
 */
export class BlockchainLoggerService {

  private detailLevel = 1;
  constructor() {
  }

  /**
   * Logger for blockchain-side offers being transformed from the blockchain-layer representation to the UI-layer representation
   * @param logMessage
   * @param priority
   */
  public offerPipelineLog(logMessage: string, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }

  /**
   * Logger for the resource and offer watchers in detecting data on the blockchain.
   * @param logMessage
   * @param priority
   */
  public watcherLog(logMessage: string, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }

  /**
   * Logger for message concerning the creation/submission of offers on the blockchain
   * @param logMessage
   * @param priority
   */
  public offerGenerationLog(logMessage: string, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }

  /**
   * Logger for messages during setup of the blockchain
   * @param logMessage
   * @param priority
   */
  public setupLog(logMessage: string, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }

  /**
   * Logger for messages concerning the administration of resources
   * @param logMessage
   * @param priority
   */
  public resourceManagerLog(logMessage: string, priority: number){
   if (priority <= this.detailLevel){
    console.log(logMessage);
   }
  }

  /**
   * Logger for anything concerning the interaction with the API
   * @param logMessage
   * @param priority
   */
  public requestInfrastructureLog(logMessage: string, priority: number){
    if (priority <= this.detailLevel){
      console.log(logMessage);
    }
  }
}
