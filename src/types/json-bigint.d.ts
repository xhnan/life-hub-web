declare module 'json-bigint' {
  export interface Options {
      strict?: boolean;
      storeAsString?: boolean;
      useNativeBigInt?: boolean;
      alwaysParseAsBig?: boolean;
      protoAction?: 'error' | 'ignore' | 'preserve';
      constructorAction?: 'error' | 'ignore' | 'preserve';
  }

  export interface JSONBigInt {
      parse(text: string, reviver?: (key: any, value: any) => any): any;
      stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
  }

  const JSONBig: {
      (options?: Options): JSONBigInt;
      parse(text: string, reviver?: (key: any, value: any) => any): any;
      stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
  };
  export default JSONBig;
}
