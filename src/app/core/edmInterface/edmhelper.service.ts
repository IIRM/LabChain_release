import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ExperimentDescription} from "../data-types/ExperimentDescription";
import {LabchainDatabase} from "../../researcher/LabchainDatabase";
import {ExperimentInstance} from "../data-types/ExperimentInstance";

@Injectable({
  providedIn: 'root'
})
/**
 * Helper service for the EDMConnectorService to store static data and provide helping functionality for storing and retrieving information.
 */
export class EDMHelperService {
  //Emitter to send the retrieved instance of the experimentInstance to all interested parties when successfully retrieved
  public edmTokenEndpoint = 'https://keycloak-windnode-dev.okd.fokus.fraunhofer.de/auth/realms/windnode/protocol/openid-connect/token';
  public edmPiveauHubEndpoint = 'https://piveau-hub-windnode-dev.okd.fokus.fraunhofer.de';
  public edmUsername = 'wn_leipzig';
  public edmPassword = 'p$J6MPnn';
  public proxyUrl = 'http://irpsim.uni-leipzig.de:3002';
  //Context string for JSON-LD and TTL format
  public EDMcontextString = '"dc":"http://purl.org/dc/elements/1.1/",\n' +
      '                "dcat":"http://www.w3.org/ns/dcat#",\n' +
      '                "dct":"http://purl.org/dc/terms/",\n' +
      '                "dcterms":"http://purl.org/dc/terms/",\n' +
      '                "edp":"https://europeandataportal.eu/voc#",\n' +
      '                "foaf":"http://xmlns.com/foaf/0.1/",\n' +
      '                "locn":"http://www.w3.org/ns/locn#",\n' +
      '                "owl":"http://www.w3.org/2002/07/owl#",\n' +
      '                "eur":"http://publications.europa.eu/resource/dataset/data-theme/",\n' +
      '                "rdf":"http://www.w3.org/1999/02/22-rdf-syntax-ns#",\n' +
      '                "rdfs":"http://www.w3.org/2000/01/rdf-schema#",\n' +
      '                "schema":"http://schema.org/",\n' +
      '                "skos":"http://www.w3.org/2004/02/skos/core#",\n' +
      '                "time":"http://www.w3.org/2006/time",\n' +
      '                "vcard":"http://www.w3.org/2006/vcard/ns#",\n' +
      '                "xsd":"http://www.w3.org/2001/XMLSchema#"';
  public EDMcontextStringTTL = ' @prefix dc: <http://purl.org/dc/elements/1.1/> .\n' +
      ' @prefix dcat: <http://www.w3.org/ns/dcat#> .\n' +
      ' @prefix dct: <http://purl.org/dc/terms/> .\n' +
      ' @prefix dcterms: <http://purl.org/dc/terms/> .\n' +
      ' @prefix edp: <https://europeandataportal.eu/voc#> .\n' +
      ' @prefix foaf: <http://xmlns.com/foaf/0.1/>. \n' +
      ' @prefix locn: <http://www.w3.org/ns/locn#>. \n' +
      ' @prefix owl: <http://www.w3.org/2002/07/owl#>. \n' +
      ' @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>. \n' +
      ' @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . \n' +
      ' @prefix schema: <http://schema.org/> .\n' +
      ' @prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n' +
      ' @prefix time: <http://www.w3.org/2006/time>. \n' +
      ' @prefix vcard: <http://www.w3.org/2006/vcard/ns#> . \n' +
      ' @prefix eur: <http://publications.europa.eu/resource/dataset/data-theme> . \n' +
      ' @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .';
  constructor(private http: HttpClient,
              private database: LabchainDatabase) {
  }

  /**
   * Function to compose the query string for creating the dataset corresponding to the data to be stored.
   * @param description Description of the data set
   * @param title Title for the data set
   * @param keywords Keywords within the data set
   * @return A string in LD-JSON format with the respective metadata to upload to the EDM
   */
  //TODO check for format and triples after consulting Ben
  constructDataSetString(description: string, title: string, keywords: Map<string, string[]>) {
    //TODO check whether the data set name matters (i.e. is part of the URL or will be replaced within the EDM namespace
    const dataSetName = this.getFreeDataSetName();
    const date = new Date();
    let returnString = '"@id":"';
    returnString += dataSetName + '",\n';
    returnString += '"@type":"dcat:Dataset",\n' + '"dcat:distribution":[{\n"@id":"';
    returnString += this.getFreeDistribution(dataSetName, 3) + '"\n}],\n';
    returnString += '"dcterms:description":"' + description + '",\n';
    returnString += '"dcterms:issued":{\n"@type":"xsd:dateTime",\n"@value":"' + date.toISOString() + '"\n},\n';
    returnString += '"dcterms:language":{\n"@id":"http://publications.europa.eu/resource/authority/language/ENG"\n},\n';
    returnString += '"dcterms:modified":{\n"@type":"xsd:dateTime",\n"@value":"' + date.toISOString() + '"\n},\n';
    returnString += '"dcterms:title":"' + title + '"\n';
    returnString += '"dcat:keyword": [';
    keywords.forEach((keywordSet, languageTag) => {
      for (const key of keywordSet) { //index = 0; index < keywordSet.length; index++) {
        returnString += key + '@ ' + languageTag + ', ';
      }
    });
    returnString += 'LabChain@en';
    return returnString;
  }

  /**
   * Function to compose the query string for creating the distribution corresponding to the data to be stored.
   * @param description Description of the data set
   * @param title Title for the data set
   * @return A string in LD-JSON format with the respective metadata to upload to the EDM
   */
  constructDistributionString(description: string, title: string): string {
    let returnString = '"@id":"' + this.getFreeDistribution('dataset111', 3) + '",\n';
    returnString += '"@type":"dcat:Distribution",\n' + '"dcterms:license":"",\n' + '"dcterms:description":"' + description + '",\n';
    returnString += '"dcterms:format":{\n' + '"@id":"http://publications.europa.eu/resource/authority/file-type/XML"\n' + '},\n';
    returnString += '"dcterms:title":"' + title + '",\n';
    returnString += '"dcat:accessURL":{\n' + '"@id": "https://viaduct-ui-windnode-dev.okd.fokus.fraunhofer.de/datasets/dataset111/?lang=de"\n}\n'
    return returnString;
  }

  //TODO change (probably remove)
  getFreeDataSetName(): string {
    return 'https://test.de/dataset113';
  }

  //TODO change (probably remove)
  getFreeDistribution(dataset: string, mode: number): string {
    return dataset + '/resource/' + mode;
  }

  /**
   * Function to retrieve the URL where the data in the respective format can be downloaded for retrieval
   * @param dataset The dataset the data to download belongs to
   * @param distribution The distribution the data is associated with
   * @param catalogue The catalogue where the dataset and distribution is found
   */
  getDownloadURL(dataset: string, distribution: string, catalogue: string): string {
    //TODO put in the right format for the distribution
    this.http.get(this.edmPiveauHubEndpoint + '/distributions/' + distribution + '/' + dataset + '?catalogue=' + catalogue + '&data=true').subscribe(result => {
      result['@graph'].forEach(graphElement => {
        const uriElements: string[] = graphElement['@id'].split('/');
        if (graphElement === 'http://www.w3.org/ns/dcat#Distribution') {
          //TODO filter for accessURL
          const accessURL = '';
          return accessURL;
        }
      });
    });
    throw new Error('Data for distribution ' + distribution + ' of dataset ' + dataset + ' cant be found in catalogue ' + catalogue);
  }

  /**
   * Function to download the experimentDescription from a valid downloadURL
   * @param downloadURL The URL where the experimentDescription can be downloaded from
   */
  retrieveExperimentDescription(downloadURL: string): Promise<ExperimentDescription> {
    //TODO fill in when EDM stable
    return null;
  }

  /**
   * Function to download the experimentInstance from a valid downloadURL
   * @param downloadURL The URL where the experimentInstance can be downloaded from
   */
  retrieveExperimentInstance(downloadURL: string): Promise<ExperimentInstance> {
    //TODO fill in when stable
    return new Promise<ExperimentInstance>(resolve => {
          resolve(null);
    });
  }
}
