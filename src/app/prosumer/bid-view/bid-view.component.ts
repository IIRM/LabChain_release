import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TimeService } from '../../core/time.service';
import { SessionDataService } from "../../core/session-data.service";
import { P2PMarketDesign } from '../../core/data-types/P2PMarketDesign';
import { P2POption } from '../../core/data-types/P2POption';
import { BlockchainRelayService } from "../../core/interfaceRelayServices/blockchain-relay.service";
import { FilterSetting } from "../../core/data-types/experiment-results/marketResults";

@Component({
  selector: 'app-bid-view',
  templateUrl: './bid-view.component.html',
  styleUrls: ['./bid-view.component.css']
})

export class BidViewComponent implements OnInit {
  /** Variable to store the bids to be shown in the view */
  public  relevantBids: P2POption[] = [];
  /** Form to allow for filtering the bid relevant for the view */
  public bidFilterForm = new FormGroup(
    {
      maxPrice: new FormControl(''),
      minFeedInTime: new FormControl(''),
      maxFeedInTime: new FormControl(''),
      minDuration: new FormControl(''),
      maxDuration: new FormControl(''),
      minPower: new FormControl(''),
      maxPower: new FormControl('')
    });

  /** variable to store the market design of the considered market */
  public p2pMarketDesign: P2PMarketDesign | undefined;
  /** Helper variable to determine the maximal price of a bid (could be different from the value in the market design */
  public marketMaxPrice: number = 0;
  /** Helper variable to determine the maximal size of a bid */
  public maxBidSize: number = 0;
  /** reference variable to store which was the last slider the user changed */
  public latestChangeSlider = '';
  /** reference variable to refer to the bid currently selected in the view */
  public selectedBid: P2POption | undefined;
  private unconfirmedBidCommits: Set<P2POption> = new Set<P2POption>();
  public maxDuration = 48;
  constructor(private bts: BlockchainRelayService,
              private timeService: TimeService,
              public sessionData: SessionDataService) {
  }

  ngOnInit() {
    this.timeService.timeEmitter.subscribe(simulationTime => {
      this.maxDuration = Math.min(this.getEndTime() - simulationTime, 48);
    });
    // subscribe to the emitter of open bids to be able to update the view
    this.bts.relevantOpenBidsSubject.subscribe(openBids => {
      this.relevantBids = openBids.filter(bid => this.conformsToFilter(bid));
    });
    if(this.sessionData.experimentInstance) {
      const length = this.sessionData.experimentInstance.instanceOfExperiment.experimentLength;
      this.bidFilterForm.get('maxFeedInTime')!.setValue(length);
      this.bidFilterForm.get('maxDuration')!.setValue(length);
    } else {
      this.sessionData.experimentInstanceEmitter.subscribe(instance => {
        const length = instance.instanceOfExperiment.experimentLength;
        this.bidFilterForm.get('maxFeedInTime')!.setValue(length);
        this.bidFilterForm.get('maxDuration')!.setValue(length);
      });
    }
    this.bidFilterForm.get('maxPower')!.setValue(1000);
    this.bidFilterForm.valueChanges.subscribe(form => this.checkBounds());
    if(this.sessionData.experimentInstance) {
      this.p2pMarketDesign = this.sessionData.experimentInstance.instanceOfExperiment.p2pMarketDesign;
      this.bidFilterForm.get('minFeedInTime')!.setValue(this.p2pMarketDesign.bidClosure);
      this.bidFilterForm.get('minDuration')!.setValue(this.p2pMarketDesign.timeSliceLength);
      this.bidFilterForm.get('minPower')!.setValue(this.p2pMarketDesign.minBidSize);
      if (this.p2pMarketDesign.maxPrice === -1) {
        this.marketMaxPrice = 10000;
      } else {
        this.marketMaxPrice = this.p2pMarketDesign.maxPrice;
      }
      this.bidFilterForm.get('maxPrice')!.setValue(this.marketMaxPrice);
    } else {
      this.sessionData.experimentInstanceEmitter.subscribe(experimentInstance => {
        this.p2pMarketDesign = this.sessionData.experimentInstance.instanceOfExperiment.p2pMarketDesign;
        this.bidFilterForm.get('minFeedInTime')!.setValue(this.p2pMarketDesign.bidClosure);
        this.bidFilterForm.get('minDuration')!.setValue(this.p2pMarketDesign.timeSliceLength);
        this.bidFilterForm.get('minPower')!.setValue(this.p2pMarketDesign.minBidSize);
        if (this.p2pMarketDesign.maxPrice === -1) {
          this.marketMaxPrice = 10000;
        } else {
          this.marketMaxPrice = this.p2pMarketDesign.maxPrice;
        }
        this.bidFilterForm.get('maxPrice')!.setValue(this.marketMaxPrice);
      })
    }
    this.bts.unconfirmedBidCommitEmitter.subscribe(newBidCommits => {
      this.unconfirmedBidCommits = newBidCommits;
    });
    this.bts.bidCommitmentIntention.subscribe(bidToCommitTo => {
      this.sessionData.marketResultManager.recordBidCommitmentMarketActivity(bidToCommitTo, this.sessionData.currentProsumer!, this.timeService.getCurrentTime(), this.sessionData.currentProsumer!.amountTokens, new FilterSetting(
        this.bidFilterForm.value.maxPrice,
        this.bidFilterForm.value.minFeedInTime,
        this.bidFilterForm.value.maxFeedInTime,
        this.bidFilterForm.value.minDuration,
        this.bidFilterForm.value.maxDuration,
        this.bidFilterForm.value.minPower,
        this.bidFilterForm.value.maxPower)
      )});
  }

  /**
   * Helper method to check the bounds of the last changed slider.
   * If the slider was moved out of bounds (e.g. max/min order reversed), it is corrected.
   * Consecutively, the relevant bids are filtered according to a filter adjusted to the last slider modified
   */
  private checkBounds(): void {
    switch (this.latestChangeSlider) {
      case 'maxFeedInTime':
        this.checkMaxFIT();
        break;
      case 'minFeedInTime':
        this.checkMinFIT();
        break;
      case 'maxDuration':
        this.checkMaxDuration();
        break;
      case 'minDuration':
        this.checkMinDuration();
        break;
      case 'maxPower':
        this.checkMaxPower();
        break;
      case 'minPower':
        this.checkMinPower();
        break;
    }
    // Filter out bids not compliant with the respective filters
    this.relevantBids = this.bts.getOpenBids().filter(bid => this.conformsToFilter(bid));
  }

  /**
   * Method to check whether a bid conforms to a number of criteria set by the respective form.
   * A bid is invalid if either
   * - the delivery time lies outside [minimalFIT, maximalFIT]
   * - the power lies outside [minimalPower, maximalPower]
   * - the duration lies outside [minimalDuration, maximalDuration]
   * - the bid price exceeds the maximal bid price
   * @param bidToFilter The bid that is to be filtered for form-based filter compliance
   * @returns true if the bid conforms to all filter criteria, false if it violates at least one
   */
  private conformsToFilter(bidToFilter: P2POption): boolean {
    if ((bidToFilter.deliveryTime < this.bidFilterForm.value.minFeedInTime) || (bidToFilter.deliveryTime > this.bidFilterForm.value.maxFeedInTime)) {
      return false;
    } else if ((bidToFilter.power < this.bidFilterForm.value.minPower) || (bidToFilter.deliveryTime > this.bidFilterForm.value.maxPower)) {
      return false;
    } else if ((bidToFilter.duration < this.bidFilterForm.value.minDuration) || (bidToFilter.duration > this.bidFilterForm.value.maxDuration)) {
      return false;
    } else if (bidToFilter.price > this.bidFilterForm.value.maxPrice) {
      return false;
    } else {
      return true;
    }
  }


  /**
   * Method to correct invalid bounds (min>max) to equal value
   */
  private checkMaxFIT() {
    if (this.bidFilterForm.value.minFeedInTime > this.bidFilterForm.value.maxFeedInTime) { this.bidFilterForm.get('maxFeedInTime')!.setValue(this.bidFilterForm.value.minFeedInTime); }
  }

  /**
   * Method to correct invalid bounds (min>max) to equal value
   */
  private checkMinFIT() {
    if (this.bidFilterForm.value.minFeedInTime > this.bidFilterForm.value.maxFeedInTime) { this.bidFilterForm.get('minFeedInTime')!.setValue(this.bidFilterForm.value.maxFeedInTime); }
  }

  /**
   * Method to correct invalid bounds (min>max) to equal value
   */
  private checkMaxDuration() {
    if (this.bidFilterForm.value.minDuration > this.bidFilterForm.value.maxDuration) { this.bidFilterForm.get('maxDuration')!.setValue(this.bidFilterForm.value.minDuration); }
  }

  /**
   * Method to correct invalid bounds (min>max) to equal value
   */
  private checkMinDuration() {
    if (this.bidFilterForm.value.minDuration > this.bidFilterForm.value.maxDuration) { this.bidFilterForm.get('minDuration')!.setValue(this.bidFilterForm.value.maxDuration); }
  }

  /**
   * Method to correct invalid bounds (min>max) to equal value
   */
  private checkMaxPower() {
    if (this.bidFilterForm.value.minPower > this.bidFilterForm.value.maxPower) { this.bidFilterForm.get('maxPower')!.setValue(this.bidFilterForm.value.minPower); }
  }

  /**
   * Method to correct invalid bounds (min>max) to equal value
   */
  private checkMinPower() {
    if (this.bidFilterForm.value.minPower > this.bidFilterForm.value.maxPower) { this.bidFilterForm.get('minPower')!.setValue(this.bidFilterForm.value.maxPower); }
  }

  /**
   * Helper method to set the current bid as the selected bid
   *
   * @param bidToDisplay bid to set as selected bid
   */
  setSelectedBid(bidToDisplay: P2POption) {
    if(!((bidToDisplay.optionCreator.respectiveProsumer.id === this.sessionData.currentProsumer!.respectiveProsumer.id) || (this.unconfirmedBidCommits.has(bidToDisplay)))) {
      this.selectedBid = bidToDisplay;
    }
  }

  /**
   * Method to reset the selected bid variable (to null)
   */
  public resetBid(): void {
    this.selectedBid = undefined;
  }

  bidStyle(respectiveBid: P2POption){
    let color = '#FFFFFF';
    if(respectiveBid === this.selectedBid){
      color = '#42A948';
    } else if(respectiveBid.optionCreator.respectiveProsumer.id === this.sessionData.currentProsumer!.respectiveProsumer.id){
      color = '#ffb732';
    } else if(this.unconfirmedBidCommits.has(respectiveBid)){
      color = '#990000';
    }
    return {'background': color}
  }

  getCurrentTime(){
    return this.timeService.getCurrentTime();
  }

  getEndTime(){
    return this.timeService.getEndTime();
  }
}
