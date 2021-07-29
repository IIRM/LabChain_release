import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WelcomeComponent } from './welcome/welcome.component';
import { SharedModule } from '../shared/shared.module';
import { TimeComponent } from './time/time.component';
import { TimeService } from './time.service';
import {SessionDataService} from "./session-data.service";
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {AuthenticationInterceptService} from "./blockchainInterface/authentication-intercept.service";
import {ClearingLoggerService, TransactionClearingService} from "./transaction-clearing.service";

@NgModule({
  declarations: [
    WelcomeComponent,
    TimeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  exports: [TimeComponent],
  providers: [
      { provide: HTTP_INTERCEPTORS, useClass: AuthenticationInterceptService, multi: true},
      SessionDataService,
      TimeService,
      ClearingLoggerService]
})
export class CoreModule { }
