import type { Writable } from 'svelte/store';

export type CreateSheetFooter = {
  leftLabel: string;
  rightLabel: string;
  rightDisabled: boolean;
  onLeft: () => void;
  onRight: () => void;
};

export type CreateSheetChrome = {
  steps: Array<{ id: string; title: string }>;
  stepIndex: number;
  goTo: (index: number) => void;
};

export const CREATE_SHEET_FOOTER = 'create-sheet-footer';
export const CREATE_SHEET_CHROME = 'create-sheet-chrome';
export const CREATE_SHEET_CLOSE = 'create-sheet-close';

export type CreateSheetFooterStore = Writable<CreateSheetFooter | null>;
export type CreateSheetChromeStore = Writable<CreateSheetChrome | null>;
