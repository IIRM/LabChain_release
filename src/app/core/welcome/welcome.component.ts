import { Component, OnInit } from '@angular/core';
import { SessionManagerService } from "../session-manager.service";

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

  constructor(private session: SessionManagerService) {  }

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
    // set mockModeBlockchain to false if there is a Blockchain set up for this again!
    this.session.loadSessionData(this.loginCode, true, true);
  }
}
