# cursor install.inf utility

a modern, browser-based tool to generate `install.inf` files for windows cursor schemes.  
<img style="max-width:100%" alt="screenshot of cursor-inf-util" src="https://github.com/r3dacted42/cursor-inf-util/blob/main/public/screenshot.png?raw=true" />  
try it: https://r3dacted42.github.io/cursor-inf-util/

## key features 
- **completely local & private**  
  this application runs entirely in your browser. when you drop your `.cur` or `.ani` files into the slots, they are processed using the HTML5 File API and Canvas API directly on your device. no files are ever uploaded to a server.
- **persistent storage**  
  working on a cursor pack but need to take a break? no problem. the app utilizes local browser storage to automatically save the state of your filled slots. you can close the tab or restart your browser, and your cursor setup will be waiting for you when you return.
- **progressive web app (PWA)**  
  this tool is fully installable!
  - works offline: once loaded, you don't need an internet connection to use it.
  - installable: add it to your desktop or mobile home screen for a native app-like experience.
  - zero latency: instant interactions with no server round-trips.
- **instant preview**  
  - ANI support: fully renders `.ani` windows cursors using `ani-cursor`'s parser to display animations at their correct frame rates.
  - live testing: preview exactly how the cursor will look before generating the installer.

## usage
- drag & drop: drag your cursor files onto the corresponding slots (normal, help select, etc.).
- preview: all cursors are visible in their slots and you can also hover to test their feel.
- generate: click "generate zip" (or "generate inf") to get a ready-to-install package.
- install: right-click the generated `.inf` file in windows explorer and select `Install`.

## tech stack
framework: Vue 3 + TypeScript  
build tool: Vite  
PWA: Vite PWA Plugin  
ANI parsing and preview: ani-cursor (part of Webamp)  
creating zip: JSZip  
styling: Holiday CSS  

## development
```bash
# install dependencies
npm install
# start dev server
npm run dev
# build for production
npm run build
```
