export type FhevmRelayerSDKType = {
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: any) => Promise<any>;
  SepoliaConfig: any;
  __initialized__?: boolean;
};

export type FhevmWindowType = Window & { relayerSDK: FhevmRelayerSDKType };

export type FhevmInitSDKOptions = Record<string, unknown> | undefined;
export type FhevmLoadSDKType = () => Promise<void>;
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;


