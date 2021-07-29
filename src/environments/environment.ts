// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  SOCKET_ENDPOINT: 'http://irpsim.uni-leipzig.de:3000',
  firebaseConfig : {
    apiKey: "AIzaSyDe2EGsc9oBQMTeLCaE1anS7DseWkePlEE",
    authDomain: "labchain-24329.firebaseapp.com",
    projectId: "labchain-24329",
    storageBucket: "labchain-24329.appspot.com",
    messagingSenderId: "249712566831",
    appId: "1:249712566831:web:9658fa0b0935ad3c5b5cda"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
