import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { BidValidationService } from '../../core/blockchainInterface/bid-validation.service';
import { SessionDataService } from "../../core/session-data.service";
import { P2POption } from '../../core/data-types/P2POption';
import { ResourceManagerService } from "../../core/blockchainInterface/resource-manager.service";
import { BlockchainRelayService } from "../../core/interfaceRelayServices/blockchain-relay.service";
import { TransactionClearingService } from "../../core/transaction-clearing.service";
import { TimeService } from 'src/app/core/time.service';

@Component({
  selector: 'app-p2p-bid-editor',
  templateUrl: './p2p-bid-editor.component.html',
  styleUrls: ['./p2p-bid-editor.component.css']
})

// TODO Implement bid strategy bot stuff

/**
 * Component to provide the form that can be used to create a new bid in the P2P market
 */
export class P2PBidEditorComponent implements OnInit {

  /** The respective form group used to contain and manage the data regarding the respective bid */
  public optionForm = new FormGroup(
    {
      offerType: new FormControl(''),
      feedInTime: new FormControl('', (control: AbstractControl) => this.validationService.fitValidator(control)),
      duration: new FormControl('', (control: AbstractControl) => this.validationService.durationValidator(control)),
      power: new FormControl('', (control: AbstractControl) => this.validationService.powerValidator(control)),
      price: new FormControl('', (control: AbstractControl) => this.validationService.priceValidator(control))
    });
  /** Helper variable to display errors within the form */
  private formError = '';
  private resourceLinker;
  public offmarketPrice: number = NaN;
  public pendingResources: number = NaN;
  public availableResources: number = NaN;
  public inUseResources: number = NaN;

  constructor(private validationService: BidValidationService,
              private bts: BlockchainRelayService,
              private sessionData: SessionDataService,
              private resourceManager: ResourceManagerService,
              private tcs: TransactionClearingService,
              private timeService: TimeService) {
    this.resourceLinker = this.resourceManager.resourceAvailable();
    this.resourceManager.poolEmitter.subscribe(poolSizes => {
      this.pendingResources = poolSizes.pending;
      this.availableResources = poolSizes.available;
      this.inUseResources = poolSizes.inUse;
    })
  }

  ngOnInit() {
    this.optionForm.valueChanges.subscribe(updatedForm => {
      if(updatedForm.power && updatedForm.duration && updatedForm.feedInTime){
        if(updatedForm.offerType === 'bid'){
          this.offmarketPrice = 0;
          for(let i = 0; i < updatedForm.duration; i++){
            this.offmarketPrice += updatedForm.power * this.sessionData.experimentInstance.instanceOfExperiment.retailPrice[updatedForm.feedInTime + i];
          }
        } else if (updatedForm.offerType === 'ask'){
          this.offmarketPrice = 0;
          for(let i = 0; i < updatedForm.duration; i++){
            this.offmarketPrice += updatedForm.power * this.sessionData.experimentInstance.instanceOfExperiment.feedInTariff[updatedForm.feedInTime + i];
          }
        }
      }
    });
  }

  /**
   * Method to create the bid, check it for validity and if so, send it to the bts.
   * If the bid does not validate, it provides information about issues with the bid through the formError variable
   */
  private submitBid(): void {
    const bidInQuestion: P2POption = {
      id: "",
      optionCreator: this.sessionData.currentProsumer!,
      deliveryTime: this.optionForm.value.feedInTime,
      duration: this.optionForm.value.duration,
      price: this.optionForm.value.price,
      power: this.optionForm.value.power,
      acceptedParty: NaN
    };
    console.log(bidInQuestion);
    if (this.validationService.checkBidValidity(bidInQuestion)) {
      this.sessionData.marketResultManager.recordBidMarketActivity(bidInQuestion, this.timeService.getCurrentTime(), this.sessionData.currentProsumer!.amountTokens);
      this.bts.submitBid(bidInQuestion);
      this.optionForm.reset();
      this.optionForm.get('offerType')!.setValue('bid');
    } else {
      console.log('validation service should be false, is ' + this.validationService.checkBidValidity(this.optionForm.value));
      console.log(this.validationService.getBidValidityErrors(bidInQuestion));
      this.formError = this.validationService.getBidValidityErrors(bidInQuestion).reduce((string1, string2) => string1 + string2);
    }
  }


  /**
   * Method to create the ask, check it for validity and if so, send it to the bts.
   * If the ask does not validate, it provides information about issues with the ask through the formError variable
   */
  private submitAsk(): void {
    const askInQuestion: P2POption = {
      id: "",
      optionCreator: this.sessionData.currentProsumer!,
      deliveryTime: this.optionForm.value.feedInTime,
      duration: this.optionForm.value.duration,
      price: this.optionForm.value.price,
      power: this.optionForm.value.power,
      acceptedParty: NaN
    };
    console.log(askInQuestion);
    if (this.validationService.checkBidValidity(askInQuestion)) {
      this.sessionData.marketResultManager.recordAskMarketActivity(askInQuestion, this.timeService.getCurrentTime(), this.sessionData.currentProsumer!.amountTokens);
      this.bts.submitAsk(askInQuestion);
      this.optionForm.reset();
      this.optionForm.get('offerType')!.setValue('ask');
    } else {
      console.log('validation service should be false, is ' + this.validationService.checkBidValidity(this.optionForm.value));
      console.log(this.validationService.getBidValidityErrors(askInQuestion));
      this.formError = this.validationService.getBidValidityErrors(askInQuestion).reduce((string1, string2) => string1 + string2);
    }
  }

  public submit(): void {
    console.log('offer submitted');
    if (this.optionForm.value.offerType === 'bid') {
      this.submitBid();
    } else if (this.optionForm.value.offerType === 'ask'){
      this.submitAsk();
    }
  }
}
