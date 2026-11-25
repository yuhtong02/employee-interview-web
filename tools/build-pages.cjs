'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),out=path.join(root,'.site');const files=['index.html','site.css','backend-config.js','pages-bridge.js','ui-preview.html','robots.txt','.nojekyll','assets/yuhtong-logo-transparent.png'];
if(fs.existsSync(out))throw Error('OUTPUT_ALREADY_EXISTS');
fs.mkdirSync(out);for(const n of files){if(!/^[A-Za-z0-9_.\/-]+$/.test(n)||n.includes('..'))throw Error('PATH_INVALID');const p=path.join(root,n);if(fs.lstatSync(p).isSymbolicLink())throw Error('SYMLINK_FORBIDDEN');fs.mkdirSync(path.dirname(path.join(out,n)),{recursive:true});fs.copyFileSync(p,path.join(out,n));}
console.log('Allowlisted public static files staged; no backend or private files included.');
