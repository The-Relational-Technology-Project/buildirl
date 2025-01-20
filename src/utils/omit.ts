type OmitDistributive<T, K extends PropertyKey> = T extends unknown
  ? T extends object
    ? Id<OmitRecursively<T, K>>
    : T
  : never;
type Id<T> = object & { [P in keyof T]: T[P] };

export type OmitRecursively<T, K extends PropertyKey> = Omit<
  { [P in keyof T]: OmitDistributive<T[P], K> },
  K
>;
