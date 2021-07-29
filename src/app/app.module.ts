import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TimeService } from './core/time.service';
import { GridOperatorModule } from './grid-operator/grid-operator.module';
import { DatabaseMockdataService } from './researcher/database-mockdata.service';
import { CoreModule } from './core/core-module';
import { ResearcherModule } from './researcher/researcher.module';
import { PublicActorModule } from './public-actor/public-actor.module';
import { ProsumerModule } from './prosumer/prosumer.module';
import {SessionDataService} from "./core/session-data.service";
import {AngularFireDatabaseModule} from "@angular/fire/database";
import {environment} from "../environments/environment";
import {AngularFireModule} from "@angular/fire";
import {AngularFirestore} from "@angular/fire/firestore";

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    GridOperatorModule,
    CoreModule,
    ResearcherModule,
    PublicActorModule,
    ProsumerModule
  ],
  providers: [
    DatabaseMockdataService,
    SessionDataService,
    TimeService,
    AngularFirestore
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor() {}

}
