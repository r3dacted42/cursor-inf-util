import cursorSlots from "./assets/cursorSlots";
import type { CursorFile } from "./types";
import JSZip from "jszip";

export const defaultCursorFile: CursorFile = {
  filename: '',
  base64Data: '',
  slot: 'pointer',
  type: 'unknown',
};

export function getEnabledCursorFiles() {
  return Object.keys(cursorSlots).map(slot => {
    const entry = localStorage.getItem(`cursor-file-${slot}`);
    if (!entry) return;
    const cur = JSON.parse(entry) as CursorFile;
    if (cur.base64Data.length !== 0) return cur;
  }).filter(f => !!f);
}

export function getInstallInfString(packName: string, dirName: string): string {
  const _dirName = !!dirName ? dirName : packName;
  const enabledCursorFiles = getEnabledCursorFiles();
  const uniqFilenames = Object.keys(enabledCursorFiles.reduce((acc, cur) => ({
    ...acc,
    [cur.filename]: null,
  }), {}));
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

[Scheme.Cur]${uniqFilenames.reduce((acc, fname) => {
    return `${acc}\n"${fname}"`;
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
  let inclFilenames: Record<string, true> = {};
  const zip = new JSZip();
  const folder = zip.folder(_dirName)!;
  for (const cur of enabledCursorFiles) {
    if (inclFilenames[cur.filename]) continue;
    folder.file(cur.filename, cur.base64Data.split(',')[1]!, { base64: true });
    inclFilenames[cur.filename] = true;
  }
  const infString = getInstallInfString(packName, _dirName);
  folder.file("install.inf", infString);
  const blob = await zip.generateAsync({ type: 'blob' });
  return URL.createObjectURL(blob);
}