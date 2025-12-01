import cursorSlots from "./assets/cursorSlots";

export type CursorFileType = 'cur' | 'ani' | 'unknown';

export type CursorSlot = keyof typeof cursorSlots;

export type CursorFile = {
  filename: string;
  type: CursorFileType;
  slot: CursorSlot;
  base64Data: string;
};

