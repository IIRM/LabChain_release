import { Component, Input, OnInit } from '@angular/core';
import { ProsumerInstance } from '../../core/data-types/ProsumerInstance';
import { Observable } from 'rxjs';
import { TimeService } from '../../core/time.service';

@Component({
  selector: 'app-persistent-resource-display',
  templateUrl: './persistent-resource-display.component.html',
  styleUrls: ['./persistent-resource-display.component.css']
})

/**
 * Component to display the persistent resources of a consumer, i.e.
 * - their tokens
 * - their residual loads
 * - the respective assets (i.e. all assets the prosumer owns)
 */
export class PersistentResourceDisplayComponent implements OnInit {
  /** The (observable of the) prosumer instance whose assets are to be diplayed */
  @Input() prosumerInstanceObservable!: Observable<ProsumerInstance>;
  /** variable to store the prosumer instance once derived from the observable */
  public prosumerInstance: ProsumerInstance | undefined;
  /** Helper variable for the current time of the simulation */
  private currentTime: number = NaN;
  constructor(private timeService: TimeService) {}

  ngOnInit() {
    this.timeService.timeEmitter.subscribe(time => this.currentTime = time);
    this.currentTime = this.timeService.getCurrentTime();
    this.prosumerInstanceObservable.subscribe(derivedInstance => {
      this.prosumerInstance = derivedInstance;
    });
  }
}
