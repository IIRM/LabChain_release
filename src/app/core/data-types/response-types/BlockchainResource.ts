export interface BlockchainParticipant {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  ethereumAddress: string;
  createdAt: string;
}

export interface BlockchainResource {
  owner: BlockchainParticipant;
  resourceID: string;
  resourceType: string;
}
