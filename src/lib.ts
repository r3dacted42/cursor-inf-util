import type { CursorFile, CursorSlot } from "./types";
import JSZip from "jszip";

export const cursorSlots = {
  pointer: "normal",
  help: "help select",
  work: "working in background",
  busy: "busy",
  cross: "precision select",
  text: "text select",
  hand: "handwriting",
  unavailiable: "unavailable",
  vert: "vertical resize",
  horz: "horizontal resize",
  dgn1: "diagonal resize 1 \\",
  dgn2: "diagonal resize 2 /",
  move: "move",
  alternate: "alternate select",
  link: "link select",
  location: "location select",
  person: "person select",
} as const;

export const defaultCursorFile: CursorFile = {
  filename: '',
  base64Data: '',
  slot: 'pointer',
  type: 'unknown',
};

export function getCursors() {
  return Object.keys(cursorSlots).reduce((acc, slot) => {
    const entry = localStorage.getItem(`cursor-file-${slot}`);
    return {
      ...acc,
      [slot as CursorSlot]: !!entry ? JSON.parse(entry) as CursorFile : null,
    };
  }, {} as Record<CursorSlot, CursorFile | null>);
}

export function getInstallInfString(packName: string, dirName: string): string {
  const _dirName = !!dirName ? dirName : packName;
  const cursors = getCursors();
  const uniqFilenames = Object.keys(Object.values(cursors)
    .reduce((acc, cur) => (cur && !!cur.base64Data
      ? {
        ...acc,
        [cur.filename]: null,
      } : acc), {}));
  return `[Version]
signature="$CHICAGO$"

[DefaultInstall]
CopyFiles = Scheme.Cur
AddReg    = Scheme.Reg

[DestinationDirs]
Scheme.Cur = 10,"%CUR_DIR%"

[Scheme.Reg]
HKCU,"Control Panel\\Cursors\\Schemes","%SCHEME_NAME%",,"${Object.entries(cursors)
      .reduce((acc, [slot, cur]) => {
        const out = !!cur?.base64Data ? `%10%\\%CUR_DIR%\\%${slot}%` : "";
        if (!acc) return out;
        return `${acc},${out}`;
      }, "")}"

; -- Common Information

[Scheme.Cur]${uniqFilenames.reduce((acc, fname) => {
        return `${acc}\n"${fname}"`;
      }, "")}

[Strings]
CUR_DIR = \"Cursors\\${_dirName}\"
SCHEME_NAME = \"${packName}\"${Object.entries(cursors)
      .reduce((acc, [slot, cur]) => {
        if (!cur || !cur.base64Data) return acc;
        return `${acc}\n${slot} = "${cur.filename}"`;
      }, "")}`;
}

export async function getCursorPackZipUrl(packName: string, dirName: string): Promise<string> {
  const _dirName = !!dirName ? dirName : packName;
  const cursors = getCursors();
  let inclFilenames: Record<string, true> = {};
  const zip = new JSZip();
  const folder = zip.folder(_dirName)!;
  for (const [_, cur] of Object.entries(cursors)) {
    if (!cur || inclFilenames[cur.filename] || !cur.base64Data) continue;
    folder.file(cur.filename, cur.base64Data.split(',')[1]!, { base64: true });
    inclFilenames[cur.filename] = true;
  }
  const infString = getInstallInfString(packName, _dirName);
  folder.file("install.inf", infString);
  const blob = await zip.generateAsync({ type: 'blob' });
  return URL.createObjectURL(blob);
}