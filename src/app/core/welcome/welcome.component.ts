import { Component, OnInit } from '@angular/core';
import {SessionManagerService} from "../session-manager.service";
import {BlockchainInterfaceSetupService} from "../blockchainInterface/blockchain-interface-setup.service";
import {HttpClient} from "@angular/common/http";
import {BlockchainHelperService} from "../blockchainInterface/blockchain-helper.service";
import {SessionDataService} from "../session-data.service";
import {LabchainDatabase} from "../../researcher/LabchainDatabase";
import {MockEDMService} from "../mockStorageInterfaces/mock-edm.service";


@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})

/**
 * Component to show the login page of the experiment, where participants select their respective role within the simulation.
 * Allows participants to be forwarded to the respective path with the experiment code they receive for the experiment
 */
export class WelcomeComponent implements OnInit {
  /** The code participants enter for joining the experiment. Login code consists of the experiment ID, the role and (if applicable) the participant ID of the participant, as separated by "_" */
  loginCode: string = "";
  /** Variable to hold a potentially relevant error code */
  errorCode = '';

  constructor(private session: SessionManagerService,
              private http: HttpClient,
              private bcHelper: BlockchainHelperService,
              private data: SessionDataService,
              private database: LabchainDatabase,
              private mockEDM: MockEDMService) {  }

  ngOnInit() {  }

  /**
   * Attempts to login the respective actor based on the login code they provide (as held in the login code).
   * Routes the client to the respective view for their role and provides the experiment and (if applicable) participant ID to the respective component.
   * Stores stateful information contained in the login code in the respective SessionDataService
   */
  login(): void {
    console.log('Triggering the login');
    this.errorCode = 'Attempting to login';
    // Constant to store the components of the login information
    if (this.loginCode === undefined) {
      throw new Error('invalid login information');
    }
    this.session.loadSessionData(this.loginCode, false, true);
  }

  /**
   * Method to let the respective agent login with a given code, by setting the code automatically and referring to the respective login method
   *
   * @param code The login code the client uses
   */
  loginWCode(code: string): void {
    this.loginCode = code;
    this.login();
  }

  storeDefaultExperiment() {
    console.log('clicked');
    this.database.getDefaultExperiment().then(experiment => {
      console.log('experiment retrieved');
      this.mockEDM.storeExperimentDescription(experiment);
      this.mockEDM.storeExperimentInstance(experiment, 1, 1);
    });
  }
}
