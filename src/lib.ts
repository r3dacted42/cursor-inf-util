import { useStorage } from "@vueuse/core";
import cursorSlots from "./assets/cursorSlots";
import type { CursorFile } from "./types";
import JSZip from "jszip";

export const defaultCursorFile: CursorFile = {
  filename: '',
  base64Data: '',
  slot: 'pointer',
  type: 'unknown',
};

export const enabledSlots = useStorage('enabled-cursor-slots',
  Object.keys(cursorSlots).reduce((acc, curr) => {
    acc[curr] = true;
    return acc;
  }, {} as Record<string, boolean>), localStorage);

export function getEnabledCursorFiles() {
  return Object.entries(enabledSlots.value).map(([slot, enabled]) => {
    if (!enabled) return;
    const entry = localStorage.getItem(`cursor-file-${slot}`);
    if (!entry) return;
    return JSON.parse(entry) as CursorFile;
  }).filter(f => !!f);
}

export function getInstallInfString(packName: string, dirName: string): string {
  const _dirName = !!dirName ? dirName : packName;
  const enabledCursorFiles = getEnabledCursorFiles();
  return `[Version]
signature="$CHICAGO$"

[DefaultInstall]
CopyFiles = Scheme.Cur
AddReg    = Scheme.Reg

[DestinationDirs]
Scheme.Cur = 10,"%CUR_DIR%"

[Scheme.Reg]
HKCU,"Control Panel\\Cursors\\Schemes","%SCHEME_NAME%",,"${enabledCursorFiles.reduce((acc, cur) => {
    if (!acc) return `%10%\\%CUR_DIR%\\%${cur.slot}%`;
    return `${acc},%10%\\%CUR_DIR%\\%${cur.slot}%`;
  }, "")}"

; -- Common Information

[Scheme.Cur]${enabledCursorFiles.reduce((acc, cur) => {
    return `${acc}\n"${cur.filename}"`;
  }, "")}

[Strings]
CUR_DIR = \"Cursors\\${_dirName}\"
SCHEME_NAME = \"${packName}\"${enabledCursorFiles.reduce((acc, cur) => {
    return `${acc}\n${cur.slot} = "${cur.filename}"`;
  }, "")}`;
}

export async function getCursorPackZipUrl(packName: string, dirName: string): Promise<string> {
  const _dirName = !!dirName ? dirName : packName;
  const enabledCursorFiles = getEnabledCursorFiles();
  const zip = new JSZip();
  const folder = zip.folder(_dirName)!;
  for (const cur of enabledCursorFiles) {
    folder.file(cur.filename, cur.base64Data.split(',')[1]!, { base64: true });
  }
  const infString = getInstallInfString(packName, _dirName);
  folder.file("install.inf", infString);
  const blob = await zip.generateAsync({ type: 'blob' });
  return URL.createObjectURL(blob);
}