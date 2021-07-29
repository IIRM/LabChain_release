import io from 'socket.io-client';
import { Injectable } from '@angular/core';
import {environment} from '../../../environments/environment'
import {TimeService} from "../time.service";
import {SessionDataService} from "../session-data.service";
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
/**
 * Service to represent the client side of the coordination layer.
 * Comprises the socket management for the coordination backend as socketIO websocket.
 * Allows to send 'registration' and 'participantReady' messages and to receive 'userBroadcast', 'startSimulation' and 'endSimulation' messages.
 */
export class SocketioService {
  socket;
  public registeredParticipants: Subject<string[]> = new Subject();
  constructor(private timeService: TimeService,
              private sessionData: SessionDataService) { this.setupSocketConnection();
  }

  /**
   * Setup the socket and register listen events
   */
  setupSocketConnection() {
    this.socket = io(environment.SOCKET_ENDPOINT);
    this.socket.on('userBroadcast', (participantList: string) => {
      if(participantList.length > 0){
        this.registeredParticipants.next(participantList.split(','));
      }
    });
    this.socket.on('startSimulation', (participatingUsers: Array<string>) => {
      console.log('relaying the start symbol');
      //Relay the starting of the simulation to the time service
      this.timeService.startExperiment();
    });
    this.socket.on('endSimulation', (participatingUsers: Array<string>) => {
      console.log('experiment has been aborted');
      //Relay the ending of the simulation to the time service
      this.timeService.endExperiment();
    });
  }
  registerForExperiment(){
    //register for experiment with the id of the respective prosumer
    this.socket.emit('registration', this.sessionData.currentProsumer!.respectiveProsumer.id);
  }
  signalReadyness(){
    //signal readyness for experiment with the id of the respective prosumer
    this.socket.emit('participantReady', this.sessionData.currentProsumer!.respectiveProsumer.id);
  }
}
