// Minimal placeholder types to avoid installing @zama-fhe/relayer-sdk locally.
// The SDK is loaded at runtime via CDN in relayer mode; in mock mode we use @fhevm/mock-utils.
// You can replace these with real imports if you add the SDK packages.
export type FhevmInstance = {
  // encryption
  createEncryptedInput: (contractAddress: string, userAddress: string) => {
    add32: (v: number) => void;
    encrypt: () => Promise<{ handles: string[]; inputProof: string }>;
  };
  // decryption
  userDecrypt: (
    handles: { handle: string; contractAddress: string }[],
    priv: string,
    pub: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, string | bigint | boolean>>;
  // keypair & EIP712 helpers
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string | `0x${string}`,
    contractAddresses: `0x${string}`[],
    startTimestamp: number,
    durationDays: number
  ) => any;
  // public params
  getPublicKey: () => any;
  getPublicParams: (bits: number) => any;
};
export type FhevmInstanceConfig = any;
export type HandleContractPair = { handle: string; contractAddress: string };
export type DecryptedResults = Record<string, string | bigint | boolean>;

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};


