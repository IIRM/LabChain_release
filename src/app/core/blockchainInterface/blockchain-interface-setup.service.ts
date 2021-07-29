import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BlockchainLoggerService} from './blockchain-logger.service';
import {BlockchainHelperService} from "./blockchain-helper.service";
import {SessionDataService} from "../session-data.service";
import {BlockchainRelayService} from "../interfaceRelayServices/blockchain-relay.service";


@Injectable({
  providedIn: 'root'
})
/**
 * Class to provide the functionality to initialize the blockchain by logging in an storing the token
 */
export class BlockchainInterfaceSetupService {
  private logger: BlockchainLoggerService;
  constructor(private http: HttpClient,
              private blockchain: BlockchainHelperService,
              private session: SessionDataService) {
    this.logger = new BlockchainLoggerService();
  }

  /**
   * Function to login the participant in the blockchain
   * @param user the id of the participant for login in the blockchain
   * @param userPassword the respective password of the participant
   */
  login(user: number, userPassword: string): void{
    console.log('Attempting to login BC');
    const userEmail = this.session.selectBlockchainUsername(user);
    console.log('Trying to log into the blockchain '+ this.blockchain.chainApi + '/user/login' + ' with email ' + userEmail + ' and password ' + userPassword);
    this.http.post(
      this.blockchain.chainApi + '/user/login',
      {email: userEmail, password: userPassword},
      {observe: 'body', responseType: 'json'}
    ).subscribe(data => {
      console.log(data);
      for (const key of Object.keys(data)){
        this.logger.setupLog('key: ' + key + ' with data ' + data[key], 4);
      }
      if (data.hasOwnProperty('token')){
        const token = data['token'];
        // store the blockchain access token in the session data
        this.session.storeBlockchainToken(token);
        this.logger.setupLog('Acquired BC token ' + token, 2);
      }
    });
    this.logger.setupLog('attempt at login', 1);
  }
}
