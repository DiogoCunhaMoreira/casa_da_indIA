// Real-pointer regression check against the Godot iframe and an xterm instance.
// Uses an isolated profile and never starts providers or reads application data.
const { resolve, join } = require('node:path');
const { tmpdir } = require('node:os');
const root = resolve(__dirname, '..');
const { app, BrowserWindow } = require('electron');
const { buildSync } = require(root + '/node_modules/esbuild');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const temp = fs.mkdtempSync(join(tmpdir(), 'casa-sidebar-smoke-'));
app.setPath('userData', join(temp, 'profile'));
app.setAppPath(root);
const { registerWorldProtocol } = require(root + '/test/load-ts.cjs')('src/main/worldProtocol.ts');
buildSync({stdin:{contents:`
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './src/renderer/src/i18n/index';
import { SidebarSplitter } from './src/renderer/src/components/SidebarSplitter';
import { sidebarLimits, clampSidebarWidth } from './src/renderer/src/components/sidebarLayout';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
window.ready = false;
setInterval(()=>document.querySelector('iframe')?.contentWindow?.postMessage({version:2,type:'hello'},'casa-world://app'),500);
window.addEventListener('message', e => { if(e.origin === 'casa-world://app' && e.data.type === 'ready') window.ready = true; });
function Fixture() {
 const [node, setNode] = useState(null);
 const [available, setAvailable] = useState(window.innerWidth - 32);
 const [preferred, setPreferred] = useState(420);
 const [mounted,setMounted] = useState(true);
 window.unmountSplitter = () => setMounted(false);
 const bounds = sidebarLimits(available);
 const width = clampSidebarWidth(preferred,bounds.min,bounds.max);
 useEffect(() => { if(!node)return; const ro=new ResizeObserver(([e]) => setAvailable(e.contentRect.width));ro.observe(node);return()=>ro.disconnect(); }, [node]);
 useEffect(() => { const host=document.getElementById('terminal'); const term=new Terminal(); const fit=new FitAddon();term.loadAddon(fit);term.open(host);term.write('Casa da Índia — sessão preservada');window.term=term;window.originalTerm=term;const ro=new ResizeObserver(()=>fit.fit());ro.observe(host);return()=>{ro.disconnect();term.dispose();}; }, []);
 window.snapshot = () => ({width,preferred,available,cols:window.term?.cols,sameTerm:window.term===window.originalTerm,cursor:document.body.style.cursor,selection:document.body.style.userSelect,overlays:document.querySelectorAll('[aria-hidden="true"]').length,world:document.querySelector('iframe').contentWindow});
 return <div ref={setNode} style={{display:'flex',padding:16,height:'100vh',boxSizing:'border-box'}}>
 <div style={{flex:1,minWidth:0}}><iframe title="World" src="casa-world://app/index.html" style={{width:'100%',height:'100%',border:0}} /></div>
 {mounted && <SidebarSplitter width={width} onChange={setPreferred} min={bounds.min} max={bounds.max}/>}
 <div id="agent-detail-panel" style={{width,minWidth:0,flexShrink:0}}><div id="terminal" style={{width:'100%',height:'100%'}}/></div>
 </div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`,resolveDir:root,loader:'tsx'},bundle:true,outfile:join(temp, 'casa-sidebar-smoke.js'),platform:'browser',alias:{'@shared':root+'/src/shared'},jsx:'automatic'});
fs.writeFileSync(join(temp, 'casa-sidebar-smoke.html'),`<html><head><style>body{margin:0;--cth-ink-300:#555;--cth-ink-900:#111;--cth-cream-300:#ddd}:focus-visible{outline:2px solid blue}</style><link rel="stylesheet" href="${root}/node_modules/@xterm/xterm/css/xterm.css"></head><body><div id="root"></div><script src="casa-sidebar-smoke.js"></script></body></html>`);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({width:1440,height:900,show:true,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 registerWorldProtocol(win.webContents.session,root+'/src/renderer/public/godot');
 const js=s=>win.webContents.executeJavaScript(s);
 win.webContents.on('console-message',(_e,level,message)=>{if(level>=3) console.error(message)});
 await win.loadFile(join(temp, 'casa-sidebar-smoke.html'));
 for(let i=0;i<60;i++){if(await js('window.ready'))break;await delay(500);}
 assert.ok(await js('window.ready'),'real Godot iframe ready');
 win.focus();
 await delay(500);
 const state=()=>js('({...window.snapshot(),world:undefined})');
 const point=()=>js('(()=>{const r=document.querySelector("[role=separator]").getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()');
 const input=(type,p,extra={})=>win.webContents.sendInputEvent({type,...p,...extra,...(type==='mouseUp'?{modifiers:[]}: {})});
 const drag=async delta=>{const p=await point();input('mouseMove',p);input('mouseDown',p,{button:'left',clickCount:1,modifiers:['leftButtonDown']});await delay(50);input('mouseMove',{x:p.x-delta,y:p.y},{modifiers:['leftButtonDown']});await delay(100);input('mouseUp',{x:p.x-delta,y:p.y},{button:'left',clickCount:1,modifiers:['leftButtonDown']});await delay(150)};
 const before=await state();
 await drag(300);let s=await state();assert.equal(s.width,720);assert.ok(s.cols>before.cols);assert.ok(s.sameTerm);assert.equal(s.cursor,'');console.log('PASS: drag across real Godot iframe; terminal fits without recreation');
 await drag(-200);assert.equal((await state()).width,520);console.log('PASS: reverse drag across terminal');
 const p=await point();input('mouseMove',p);input('mouseDown',p,{button:'left',clickCount:1,modifiers:['leftButtonDown']});await delay(50);input('mouseMove',{x:2,y:p.y},{modifiers:['leftButtonDown']});await delay(50);input('mouseUp',{x:-20,y:p.y},{button:'left',clickCount:1,modifiers:['leftButtonDown']});await delay(100);s=await state();assert.equal(s.cursor,'');assert.equal(s.width,s.available-370);console.log('PASS: limit and release outside content');
 const preferred=s.preferred;win.setSize(1000,900);await delay(250);s=await state();assert.equal(s.preferred,preferred);assert.equal(s.width,s.available-370);win.setSize(1440,900);await delay(250);assert.equal((await state()).width,preferred);console.log('PASS: window resize retains preference');
 await js('document.querySelector("[role=separator]").focus()');input('keyDown',{}, {keyCode:'ENTER'});input('keyUp',{}, {keyCode:'ENTER'});await delay(100);assert.equal((await state()).width,420);input('keyDown',{}, {keyCode:'LEFT'});input('keyUp',{}, {keyCode:'LEFT'});await delay(100);assert.equal((await state()).width,430);console.log('PASS: keyboard reset and resize');
 for(const cancel of ['window.dispatchEvent(new Event("blur"))','document.querySelector("[role=separator]").dispatchEvent(new PointerEvent("pointercancel",{bubbles:true}))','window.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))','window.unmountSplitter()']){
   const p=await point();input('mouseMove',p);input('mouseDown',p,{button:'left',clickCount:1,modifiers:['leftButtonDown']});await delay(80);assert.equal((await state()).cursor,'ew-resize');await js(cancel);await delay(100);input('mouseUp',p,{button:'left',clickCount:1,modifiers:['leftButtonDown']});assert.equal((await state()).cursor,'');assert.equal((await state()).selection,'');
 }
 console.log('PASS: blur, cancellation, Escape and unmount cleanup');
 fs.writeFileSync(join(temp, 'result.png'),(await win.webContents.capturePage()).toPNG());
 console.log('Evidence:', join(temp, 'result.png'));
 app.exit(0);
}).catch(e=>{console.error(e);app.exit(1)});
