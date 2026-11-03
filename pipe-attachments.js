/* Per-pipe PDF/image attachments, with binary drafts in IndexedDB. */
(()=>{
 'use strict';
 const types={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',bmp:'image/bmp'};
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,maxSize=50*1024*1024;
 const directories=new Map();
 const empty=()=>({version:1,folderId:crypto.randomUUID(),files:[]});
 const extension=name=>String(name).split('.').at(-1).toLowerCase();
 const cacheKey=file=>file.id+':'+file.sha256;
 const clone=value=>JSON.parse(JSON.stringify(value));
 function normalize(value){
  if(value==null)return empty();
  if(value.version!==1||!uuid.test(value.folderId)||!Array.isArray(value.files)||value.files.length>200)throw Error('Ungültige Rohr-Anhänge.');
  const ids=new Set();
  const files=value.files.map(file=>{
   const type=types[extension(file.name)];
   if(!uuid.test(file.id)||ids.has(file.id)||typeof file.name!=='string'||!file.name||file.name.length>255||/[\\/\u0000-\u001f]/.test(file.name)||!type||type!==file.type||!Number.isSafeInteger(file.size)||file.size<=0||file.size>maxSize||!/^[a-f0-9]{64}$/.test(file.sha256))throw Error('Ungültiger PDF- oder Bildanhang.');
   ids.add(file.id);return {id:file.id,name:file.name,type,size:file.size,sha256:file.sha256};
  });
  return {version:1,folderId:value.folderId,files};
 }
 function database(){return new Promise((resolve,reject)=>{
  const request=indexedDB.open('rohrplan-attachments-v1',1);
  request.onupgradeneeded=()=>{request.result.createObjectStore('files');request.result.createObjectStore('directories');};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });}
 async function stored(store,key,value){
  const db=await database();
  try{return await new Promise((resolve,reject)=>{
   const writing=arguments.length===3,tx=db.transaction(store,writing?'readwrite':'readonly');
   const request=writing?tx.objectStore(store).put(value,key):tx.objectStore(store).get(key);
   let result;request.onsuccess=()=>{result=request.result;};
   tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Speichern abgebrochen.'));
  });}finally{db.close();}
 }
 async function hash(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),byte=>byte.toString(16).padStart(2,'0')).join('');}
 async function validateBlob(blob,file){
  if(blob.size!==file.size||await hash(blob)!==file.sha256)throw Error('Der Anhang „'+file.name+'“ fehlt oder wurde verändert.');
  return blob.slice(0,blob.size,file.type);
 }
 async function checkFile(file){
  const type=types[extension(file.name)];
  if(!type)throw Error('Erlaubt sind PDF, JPG, PNG, WEBP, GIF und BMP.');
  if(file.size<=0||file.size>maxSize)throw Error('Bitte eine Datei zwischen 1 Byte und 50 MB auswählen.');
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer()),text=new TextDecoder('latin1').decode(bytes);
  const valid=type==='application/pdf'?text.startsWith('%PDF-'):type==='image/png'?bytes[0]===137&&text.slice(1,4)==='PNG':type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/gif'?/^GIF8[79]a/.test(text):type==='image/webp'?text.startsWith('RIFF')&&text.slice(8,12)==='WEBP':text.startsWith('BM');
  if(!valid)throw Error('Dateiinhalt und Dateiendung passen nicht zusammen.');
  return {id:crypto.randomUUID(),name:file.name,type,size:file.size,sha256:await hash(file)};
 }
 const storedName=file=>file.id+'.'+extension(file.name);
 async function folder(root,state,create=false){
  const parent=await root.getDirectoryHandle('Anhänge',{create});
  return parent.getDirectoryHandle(state.folderId,{create});
 }
 function bindProject(state,handle){
  directories.set(state.folderId,handle);
  const value=window.rohrPlanDesktop?{desktopPath:handle.path,name:handle.name}:handle;
  stored('directories',state.folderId,value).catch(error=>console.warn('Anhangordner konnte nicht gemerkt werden:',error));
 }
 function create(options){
  const el=id=>document.getElementById(id),dialog=el('attachmentsDialog');
  let busy=false,selected=null,previewUrl=null,viewRevision=0;
  function status(text){el('attachmentStatus').textContent=text;}
  async function sourceDirectory(state){
   let handle=directories.get(state.folderId);
   if(!handle){const value=await stored('directories',state.folderId);handle=value?.desktopPath?options.desktopDirectory(value):value;}
   if(!handle)throw Error('Bitte das Rohr aus seinem Projektordner öffnen, um die Anhänge zu laden.');
   if(await handle.queryPermission({mode:'readwrite'})!=='granted')throw Error('Bitte den Projektordner unter „Projekt öffnen“ erneut freigeben und das Rohr laden.');
   directories.set(state.folderId,handle);return handle;
  }
  async function readBlob(state,file){
   const cached=await stored('files',cacheKey(file));
   if(cached)return validateBlob(cached,file);
   const root=await sourceDirectory(state),directory=await folder(root,state);
   const blob=await validateBlob(await(await directory.getFileHandle(storedName(file))).getFile(),file);
   await stored('files',cacheKey(file),blob).catch(error=>console.warn('Anhang konnte nicht zwischengespeichert werden:',error));return blob;
  }
  async function persistToProject(input,root){
   const state=normalize(input);
   if(!state.files.length){bindProject(state,root);return state;}
   const target=await folder(root,state,true);
   for(const file of state.files){
    const blob=await readBlob(state,file);
    try{
     const existing=await(await target.getFileHandle(storedName(file))).getFile();
     if(existing.size){await validateBlob(existing,file);continue;}
    }catch(error){if(error.name!=='NotFoundError'&&!/\bENOENT\b/.test(error.message))throw error;}
    const handle=await target.getFileHandle(storedName(file),{create:true}),writer=await handle.createWritable();
    try{await writer.write(blob);await writer.close();}catch(error){if(writer.abort)await writer.abort().catch(()=>{});throw error;}
   }
   bindProject(state,root);return state;
  }
  async function exportState(input){
   const state=normalize(input),files=[];
   for(const file of state.files){
    const blob=await readBlob(state,file);
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
    files.push({...file,data});
   }
   return {...state,files};
  }
  async function importState(input,root=null){
   const state=normalize(input);
   for(let i=0;i<state.files.length;i++){
    const file=state.files[i],data=input.files[i].data;
    if(data===undefined)continue;
    if(typeof data!=='string'||data.length>Math.ceil(maxSize/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))throw Error('Ungültiger eingebetteter Anhang.');
    const decoded=atob(data),bytes=Uint8Array.from(decoded,char=>char.charCodeAt(0));
    const blob=await validateBlob(new Blob([bytes],{type:file.type}),file);await checkFile(new File([blob],file.name,{type:file.type}));
    await stored('files',cacheKey(file),blob);
   }
   if(root)bindProject(state,root);return state;
  }
  function clearPreview(){
   el('attachmentPreview').replaceChildren();el('downloadAttachment').hidden=true;
   if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
  }
  async function preview(state,file){
   const revision=++viewRevision;clearPreview();el('attachmentPreviewName').textContent=file.name;
   const loading=document.createElement('p');loading.className='attachment-empty';loading.textContent='Anhang wird geladen …';el('attachmentPreview').append(loading);
   try{
    const blob=await readBlob(state,file);
    if(revision!==viewRevision||!dialog.open)return;
    previewUrl=URL.createObjectURL(blob);
    const viewer=document.createElement(file.type==='application/pdf'?'iframe':'img');
    viewer.src=previewUrl;if(viewer.tagName==='IMG')viewer.alt=file.name;else viewer.title='PDF: '+file.name;
    el('attachmentPreview').replaceChildren(viewer);
    const link=el('downloadAttachment');link.href=previewUrl;link.download=file.name;link.hidden=false;
   }catch(error){if(revision===viewRevision){loading.textContent='Anhang konnte nicht geöffnet werden: '+error.message;}}
  }
  function refresh(){
   const context=options.context(),state=context.state;
   el('attachmentCount').textContent=String(state.files.length);
   if(!dialog.open)return;
   viewRevision++;clearPreview();el('attachmentsPipeName').textContent=context.name;
   el('addAttachments').disabled=busy||!context.canAttach;el('savePipeAttachments').disabled=busy||!context.canAttach;
   const list=el('attachmentList');list.replaceChildren();
   for(const file of state.files){
    const row=document.createElement('div');row.className='attachment-row';
    const open=document.createElement('button');open.type='button';open.className='attachment-select';
    const badge=document.createElement('span');badge.className='attachment-kind';badge.textContent=extension(file.name).toUpperCase();
    const info=document.createElement('span'),name=document.createElement('strong'),size=document.createElement('small');
    name.textContent=file.name;size.textContent=file.size>=1048576?(file.size/1048576).toFixed(1)+' MB':Math.ceil(file.size/1024)+' KB';info.append(name,size);open.append(badge,info);
    open.setAttribute('aria-pressed',String(selected===file.id));open.onclick=()=>{selected=file.id;refresh();};
    const remove=document.createElement('button');remove.type='button';remove.className='attachment-remove';remove.textContent='×';remove.title='Zuordnung entfernen';remove.setAttribute('aria-label','Zuordnung von '+file.name+' entfernen');remove.disabled=busy;
    remove.onclick=()=>{const next=clone(state);next.files=next.files.filter(item=>item.id!==file.id);options.change(context.tabId,next);if(selected===file.id)selected=null;status('Zuordnung entfernt. Die Datei bleibt erhalten; bitte das Rohr speichern.');refresh();};
    row.append(open,remove);list.append(row);
   }
   if(!state.files.length){
    const emptyNode=document.createElement('p');emptyNode.className='attachment-empty';emptyNode.textContent=context.canAttach?'Noch keine Anhänge. Füge PDFs oder Bilder für dieses Rohr hinzu.':'Zeichne oder öffne zuerst ein Rohr. Danach kannst du hier PDFs und Bilder zuordnen.';list.append(emptyNode);
   }
   const file=state.files.find(item=>item.id===selected)||state.files[0];selected=file?.id||null;
   el('attachmentPreviewName').textContent=file?file.name:'Vorschau';
   if(file)preview(state,file);else{const hint=document.createElement('p');hint.className='attachment-empty';hint.textContent='Wähle links einen Anhang aus.';el('attachmentPreview').append(hint);}
  }
  el('openAttachments').onclick=()=>{dialog.showModal();selected=null;status('');refresh();};
  el('closeAttachments').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{viewRevision++;clearPreview();});
  el('addAttachments').onclick=()=>el('attachmentFiles').click();
  el('attachmentFiles').onchange=async event=>{
   const context=options.context(),files=[...event.target.files];event.target.value='';if(!files.length||!context.canAttach||busy)return;
   const next=clone(context.state),errors=[];busy=true;refresh();status('Anhänge werden übernommen …');let added=0;
   try{
    for(const file of files){
     try{if(next.files.length>=200)throw Error('Höchstens 200 Anhänge je Rohr.');const meta=await checkFile(file);await stored('files',cacheKey(meta),file.slice(0,file.size,meta.type));next.files.push(meta);selected=meta.id;added++;}
     catch(error){errors.push(file.name+': '+error.message);}
    }
    if(added)options.change(context.tabId,next);
   }finally{busy=false;refresh();status((added?added+' Anhang/Anhänge zu „'+context.name+'“ hinzugefügt. Bitte mit dem Rohr speichern. ':'')+errors.join(' '));}
  };
  el('savePipeAttachments').onclick=async()=>{
   if(busy)return;busy=true;refresh();
   try{dialog.close();await options.save();}finally{busy=false;refresh();}
  };
  return {refresh,persistToProject,exportState,importState,isBusy:()=>busy};
 }
 window.RohrPlanAttachments={empty,normalize,create};
})();
