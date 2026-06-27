export type CreateTypeOption<T extends string = string> = {
  value: T;
  label: string;
  summary: string;
  bestFor?: string[];
  lifecycleNote?: string;
};
