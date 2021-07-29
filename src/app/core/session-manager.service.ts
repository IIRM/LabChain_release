import { Injectable } from '@angular/core';
import {ProsumerInstance} from "./data-types/ProsumerInstance";
import {EdmConnectorService} from "./edmInterface/edm-connector.service";
import {SocketioService} from "./coordinationInterface/socketio.service";
import {BlockchainInterfaceSetupService} from "./blockchainInterface/blockchain-interface-setup.service";
import {Prosumer} from "./data-types/Prosumer";
import {SessionDataService} from "./session-data.service";
import {Router} from "@angular/router";
import {LabchainDatabase} from "../researcher/LabchainDatabase";
import {ExperimentDescription} from "./data-types/ExperimentDescription";
import {ExperimentInstance} from "./data-types/ExperimentInstance";
import {BlockchainRelayService} from "./interfaceRelayServices/blockchain-relay.service";
import {MockEDMService} from "./mockStorageInterfaces/mock-edm.service";
import {AngularFirestore} from "@angular/fire/firestore";

@Injectable({
  providedIn: 'root'
})
/**
 * Service to tie together setup the interfaces to the other service layers and to route to the respective components when initialization is finished.
 * Service is further responsible to ensure that data is set in the sessionData so that experiment execution components can assume that data has been retrieved.
 */
export class SessionManagerService {

  blockchainPassword = '9bec0d21a9a36e81a476335707e94a04';
  //TODO AngularFirestore in for convenience; remove eventually
  constructor(private edmConnector: EdmConnectorService,
              private coordinationLayer: SocketioService,
              private blockchain: BlockchainInterfaceSetupService,
              private sessionData: SessionDataService,
              private router: Router,
              private database: LabchainDatabase,
              private relayService: BlockchainRelayService,
              private mockEDM: MockEDMService,
              private db: AngularFirestore) { }

  /**
   * Function to retrieve the relevant data for the experiment and set up the respective services.
   * Loads data from the EDM and only when the prosumer is retrieved connects to the blockchain interface
   * @param loginString String to contain the experiment ID, experiment instance ID, role and prosumer ID separated by _
   * @param mockModeBlockchain TODO!
   * @param mockModeEDM if mockMode is active, data is pulled from the (internal) database instead of the EDM platform
   */
  //TODO revise according to the roles; determine what components to include for what roles and probably do the routing first
  public loadSessionData(loginString: string, mockModeBlockchain: boolean, mockModeEDM: boolean){
    //experiment code format: ExperimentID_ExperimentInstanceID_role_ProsumerID
    const experimentData = loginString.split('_');
    switch(experimentData[2]) {
      case 'Prosumer':
        this.loadParticipantSession(experimentData[0], experimentData[1], experimentData[3], mockModeBlockchain, mockModeEDM);
        break;
      default:
        this.loadNonParticipantSession(experimentData[0], experimentData[1], experimentData[2], mockModeEDM);
        this.routeToModule(experimentData[2]);
    }
  }

  private loadNonParticipantSession(experimentID: string, experimentInstanceID: string, role: string, mockModeEDM: boolean) {
    //set up EDM layer
    if(mockModeEDM){
      if(experimentID) {
        this.mockEDM.loadExperimentDescription(experimentID).then(experimentDescription => {
          if (experimentInstanceID) {
            this.mockEDM.loadExperimentInstance(experimentInstanceID, experimentDescription);
          }
        });
      }
    } else {
      this.edmConnector.acquireRTPToken().then(edmToken => {
        if(mockModeEDM) {
          if (experimentID) {
            this.edmConnector.loadExperimentDescription(experimentID).then(experimentDescription => {
              if (experimentInstanceID) {
                this.edmConnector.loadExperimentInstance(experimentInstanceID, experimentDescription);
              }
            });
          }
        }
        // this.loadEDMData(experimentData[0], experimentData[1], experimentData[3]);
      });
    }
    console.log('EDM layer set up');
  }

  private loadParticipantSession(experimentID: string, experimentInstanceID: string, prosumerID: string, mockModeBlockchain: boolean, mockModeEDM: boolean) {
    //set up EDM layer
    if (mockModeEDM) {
      if (experimentID) {
        //TODO for convenience, remove eventually
        this.mockEDM.loadExperimentDescription(experimentID).then(experimentDescription => {
          if (experimentInstanceID) {
            this.mockEDM.loadExperimentInstance(experimentInstanceID, experimentDescription).then(experimentInstance => {
              this.setSessionData(experimentDescription, experimentInstance, prosumerID);
              console.log('EDM layer set up');
              this.initializeBlockchainLayer(mockModeBlockchain);
              this.initializeCoordinationLayer();
              this.routeToModule('Prosumer', prosumerID);
            });
          }
        });
      }
    } else {
      this.edmConnector.acquireRTPToken().then(edmToken => {
        if (experimentID) {
          this.edmConnector.loadExperimentDescription(experimentID).then(experimentDescription => {
            if (experimentInstanceID) {
              this.edmConnector.loadExperimentInstance(experimentInstanceID, experimentDescription).then(experimentInstance => {
                this.setSessionData(experimentDescription, experimentInstance, prosumerID);
                console.log('EDM layer set up');
                this.initializeBlockchainLayer(mockModeBlockchain);
                this.initializeCoordinationLayer();
                this.routeToModule('Prosumer', prosumerID);
              });
            }
          });
        }
      });
    }
  }

  private initializeCoordinationLayer() {
    //set up coordination layer
    this.coordinationLayer.setupSocketConnection();
    if(this.sessionData.currentProsumer) {
      this.coordinationLayer.registerForExperiment();
    } else {
      this.sessionData.prosumerEmitter.subscribe(currentProsumer => {
        this.coordinationLayer.registerForExperiment();
      });
    }
    console.log('Coordination layer set up');
  }

  private initializeBlockchainLayer(mockModeBlockchain: boolean) {
    //set up blockchain layer
    if (mockModeBlockchain) {
      this.relayService.setUsedBlockchain('mockChain');
    } else {
      this.relayService.setUsedBlockchain('fokusChain');
      if (this.sessionData.currentProsumer) {
        this.blockchain.login(this.sessionData.currentProsumer.respectiveProsumer.id, this.blockchainPassword);
        console.log('blockchain layer set up');
      } else {
        this.sessionData.prosumerEmitter.subscribe(participantProsumer => {
          this.blockchain.login(participantProsumer.respectiveProsumer.id, this.blockchainPassword);
          console.log('blockchain layer set up');
        });
      }
    }
  }

  /**
   * Helper function to facilitate routing to the respective view as specified by the role
   * @param role
   * @param id
   */
  private routeToModule(role: string, id?: string){
    switch (role) {
      case 'Prosumer': {
        console.log('About to navigate to the prosumerView');
        this.router.navigate(['ProsumerView/', id]);
        break;
      }
      case 'GridOperator': {
        this.router.navigate(['GridOperatorView/']);
        break;
      }
      case 'PublicActor': {
        this.router.navigate(['PublicActorView/']);
        break;
      }
      case 'ExperimentDesigner': {
        this.router.navigate(['ExperimentDesignerView/']);
        break;
      }
      default: {
        console.error('actor role ' + role + ' does not exist.');
      }
    }
  }

  /**
   * Helper function that extracts the session data from the EDM based on the specified IDS.
   * Loads the experimentDescription and instance and initializes the session
   * @param experimentDescriptionString The id of the ExperimentDescription to retrieve in the EDM
   * @param experimentInstanceString The id of the ExperimentInstance to retrieve in the EDM
   * @param experimentParticipantString The id of the Prosumer this client instance is to represent (experiment participant).
   */
  //TODO check if it can be discarded
  private loadEDMData(experimentDescriptionString: string, experimentInstanceString: string, experimentParticipantString: string) {
    this.edmConnector.loadExperimentDescription(experimentDescriptionString).then(description => {
      //retrieve experimentInstance
      this.edmConnector.loadExperimentInstance(experimentInstanceString, description).then(instance => {
        this.setSessionData(description, instance, experimentParticipantString);
      });
    });
  }

  /**
   * Helper function that sets the session data.
   * This function thus sets the experimentInstance, prosumerInstance and the currentProsumer in the session data.
   * @param description The ExperimentDescription corresponding to the experiment
   * @param instance The ExperimentInstance corresponding to the experiment
   * @param participantId The id of the Prosumer this client instance is to represent (experiment participant).
   */
  private setSessionData(description: ExperimentDescription, instance: ExperimentInstance, participantId: string) {
    this.sessionData.setExperimentInstance(instance);
    const experimentProsumers: Array<ProsumerInstance> = new Array<ProsumerInstance>();
    //retrieve prosumers
    description.prosumers.forEach(currentDescriptionProsumer => {
      const currentProsumerInstance = new ProsumerInstance(
          new Prosumer(currentDescriptionProsumer.id, currentDescriptionProsumer.name),
          currentDescriptionProsumer.assets.controllableGenerators,
          currentDescriptionProsumer.assets.nonControllableGenerators,
          currentDescriptionProsumer.assets.loads,
          currentDescriptionProsumer.assets.storageUnits,
          currentDescriptionProsumer.coordinates,
          currentDescriptionProsumer.startTokens
      );
      experimentProsumers.push(currentProsumerInstance);
      if (currentDescriptionProsumer.id.toString() === participantId) {
        this.sessionData.setCurrentProsumer(currentProsumerInstance);
      } else if (participantId === '320') {
        console.log('trying to mock the prosumer');
        this.sessionData.setCurrentProsumer(new ProsumerInstance(new Prosumer(320, 'Mock Prosumer 2'), [], [], [], [], {x: 0, y: 0}, 0));
      } else if (participantId === '319') {
        console.log('trying to mock the prosumer');
        this.sessionData.setCurrentProsumer(new ProsumerInstance(new Prosumer(319, 'Mock Prosumer'), [], [], [], [], {x: 0, y: 0}, 0));
      }
    });
    console.log('Trying to set the ' + experimentProsumers.length + ' prosumers for the experiment ');
    try {
      this.sessionData.setExperimentProsumers(experimentProsumers);
      this.initializeProsumerAssets(experimentProsumers, instance.instanceOfExperiment.experimentLength);
    } catch (e) {
      console.error(e);
    }
    if (!this.sessionData.currentProsumer) {
      console.error('Error! Prosumer with ID ' + participantId + ' was not found in the list of prosumers for experiment ' + instance.experimentID);
    }
  }

  // TODO critical: does this make sense here?
  private initializeProsumerAssets(prosumers: Array<ProsumerInstance>, experimentLength: number){
    prosumers.forEach(currentProsumer => {
      currentProsumer.storage.forEach(currentStorage => {
        currentStorage.initiateSchedule(experimentLength);
      });
      currentProsumer.controllableGenerators.forEach(currentCG => {
        currentCG.initiateSchedule(experimentLength);
      });
    })
  }
}
