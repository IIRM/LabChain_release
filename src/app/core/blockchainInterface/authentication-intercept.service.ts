import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlockchainLoggerService } from './blockchain-logger.service';
import { SessionDataService } from "../session-data.service";

@Injectable({
  providedIn: 'root'
})
/**
 * Service to intercept HTTP requests and inject them with the authorization token (as well as allowing to log information).
 */
export class AuthenticationInterceptService implements HttpInterceptor{

  constructor(private session: SessionDataService,
              private logger: BlockchainLoggerService) { }
  //implement the intercept function of the HTTPInterceptor to intercept HTTP requests by cloning the request
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // const started = Date.now();
    if (this.session.blockchainToken){
      this.logger.requestInfrastructureLog('Attempting to authorize with token ' + this.session.blockchainToken, 3);
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${this.session.blockchainToken}`)
      });
      return next.handle(authReq);
    } else {
      return next.handle(req);
    }
  }
}
