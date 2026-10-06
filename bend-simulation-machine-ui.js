/* Connect the collision report to the existing geometric preview. */
(()=>{
 'use strict';
 const engine=window.RohrPlanMachineCollision,el=id=>document.getElementById(id);
 let revision=0,review=null,reviewPromise=null,pausedEvents=[],collisionPaused=false,acknowledged=new Set();
 const oldGeometry=sequenceGeometry,oldDraw=draw,oldLoad=loadSequence;
 const panel=document.createElement('section');panel.className='collision-panel';
 const heading=document.createElement('h2');heading.textContent='Kollisionsprüfung';
 const toolbar=document.createElement('div');toolbar.className='tools';
 const check=document.createElement('button');check.textContent='Biegefolge prüfen';
 const stopLabel=document.createElement('label'),stopCheck=document.createElement('input');stopCheck.type='checkbox';stopCheck.checked=true;
 stopLabel.append(stopCheck,document.createTextNode(' Bei Warnung anhalten'));
 toolbar.append(check,stopLabel);
 const summary=document.createElement('p');summary.className='collision-summary';summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
 const list=document.createElement('div');list.className='collision-events';
 const note=document.createElement('small');note.textContent='Geprüft werden Vorschub, Futterdrehung und Biegen gegen Bett, Futter, Rahmenoberkante, bewegte Außenhülle und Boden. Maschinenkontakte sind Warnungen auf Basis vereinfachter Formen. Normale Rohrführung und Werkzeuganlage sind ausgenommen. Spannbacken, Rahmenstützen und Armrücklauf sind noch nicht erfasst.';
 panel.append(heading,toolbar,summary,list,note);el('model').after(panel);
 document.querySelector('.note').textContent='Kollisionsprüfung mit deinen Maschinenmaßen. Rot markiert mögliche Berührungen; Treffer an vereinfachten Maschinenformen werden als Warnung angezeigt.';
 const style=document.createElement('style');style.textContent='.collision-panel{margin:16px 0;padding:16px;background:var(--dialog-card,#263240);border:1px solid var(--dialog-border,#566b82);border-radius:8px}.collision-panel h2{margin:0}.collision-panel .tools{margin:10px 0}.collision-summary{color:#bed0e3}.collision-events{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow:auto;margin:10px 0}.collision-events button{text-align:left;background:#493324;border-color:#b97b49}.collision-events button[data-severity="error"]{background:#552824;border-color:#cc7065}.collision-panel input{accent-color:var(--dialog-accent,#8dcef7)}body.embedded .collision-panel{font-size:13px;padding:10px}body.embedded .collision-events{max-height:130px}';document.head.append(style);

 sequenceGeometry=function(time){
  const result=oldGeometry(time),phase=sequence?.phases?.find(p=>time<p.end-1e-9);
  return {...result,phase:phase?.kind||(sequence&&time>=sequence.duration?'Fertig':'Biegen'),number:phase?.number||sequence?.bends?.at(-1)?.number||1};
 };
 function phasesFor(current){return current.phases;}
 function demoState(){
  const radius=data.tooling.centerlineRadius,a=armAngle*Math.PI/180,count=Math.max(1,Math.ceil(armAngle/2));
  const points=[[-600,0,0],[0,0,0]];
  for(let i=1;i<=count;i++){const t=a*i/count;points.push([radius*Math.sin(t),-radius*(1-Math.cos(t)),0]);}
  const end=points.at(-1),remaining=600-radius*a;points.push([end[0]+remaining*Math.cos(a),end[1]-remaining*Math.sin(a),0]);
  return {points,radius,angle:armAngle,rotation:0,phase:'Biegen',number:1};
 }
 function currentState(){return sequence?sequenceGeometry(sequenceTime):demoState();}
 function warningText(hit,state){
  const phase=hit.phase??state.phase;
  const label=hit.id==='floor'?(hit.severity==='error'?'Bodenkontakt':phase==='Futterdrehung'?'Mögliche Bodenberührung beim Drehen':'Mögliche Bodenberührung'):'Mögliche Kollision: '+hit.label;
  return 'Biegung '+(hit.number??state.number)+' · '+(hit.phase??state.phase)+' · '+label;
 }
 function drawWarningOverlay(state,hits){
  if(!hits.length)return;
  const hitIds=new Set(hits.map(h=>h.id)),part=id=>data.components.find(c=>c.id===id);
  if(hitIds.has('body')){const b=part('body'),shift=data.tooling.centerlineRadius-state.radius;drawBox(b.min.map((v,i)=>v+(i===1?shift:0)),b.max.map((v,i)=>v+(i===1?shift:0)),'#d63828',true);}
  if(hitIds.has('guide-top')){const b=part('guide-top');drawBox(b.min,b.max,'#d63828',true);}
  if(hitIds.has('bend-arm')){
   const bounds=window.RohrPlanMachines.movingBounds(data,state.radius),C=[0,-state.radius,0],turn=p=>rotateZ(p,-state.angle*Math.PI/180).map((v,i)=>v+C[i]);
   if(bounds.cylinder)drawBox(bounds.cylinder.min,bounds.cylinder.max,'#d63828',true,turn);
   drawBox(bounds.arm.min,bounds.arm.max,'#d63828',true,turn);
  }
  const affected=new Set(hits.flatMap(h=>h.segments));
  const scale=(focus==='head'?Math.min(w/1500,h/1700):Math.min(w/7500,h/2700))*zoom;
  ctx.save();ctx.lineWidth=Math.max(5,(sequence?.diameter??data.tooling.tubeOuterDiameter)*scale+2);ctx.lineCap='round';ctx.strokeStyle='#d63828';
  for(const index of affected){const a=state.points[index],b=state.points[index+1];if(!a||!b)continue;ctx.beginPath();ctx.moveTo(...project(a));ctx.lineTo(...project(b));ctx.stroke();}
  for(const hit of hits){const p=project(hit.point);ctx.beginPath();ctx.arc(p[0],p[1],7,0,Math.PI*2);ctx.fillStyle='#f7faf8';ctx.fill();ctx.lineWidth=2;ctx.stroke();label(hit.point,hit.label,'#bf3023');}
  ctx.restore();
 }
 draw=function(){
  oldDraw();const state=currentState(),model={...data,floorZ:-(sequence?.height??data.centerHeight)},diameter=sequence?.diameter??data.tooling.tubeOuterDiameter;
  const report=engine.inspect(state,model,diameter),hits=[...report.hits];
  for(const event of pausedEvents)if(!hits.some(h=>h.id===event.id))hits.push(event);
  drawWarningOverlay(state,hits);
  if(sequence){
   el('sequenceStatus').textContent=hits.length?hits.map(hit=>warningText(hit,state)).join(' · '):state.message+' · Bodenabstand '+report.clearance.toFixed(1)+' mm';
   el('sequenceStatus').style.color=hits.some(h=>h.severity==='error')?'#ff978b':hits.length?'#f3c46a':'';
  }
 };
 function seek(event){
  stopAnimation();sequenceTime=event.time;acknowledged=new Set((review?.events||[]).filter(e=>e.time<event.time-1e-7).map(e=>e.key));
  pausedEvents=(review?.events||[]).filter(e=>Math.abs(e.time-event.time)<1e-7);collisionPaused=true;
  setAngle(sequenceGeometry(sequenceTime).angle);el('playBend').textContent='Weiter';
 }
 async function beginReview(){
  if(!sequence)return;
  stopAnimation();const current=sequence,id=++revision;
  current.phases=phasesFor(current);review=null;acknowledged.clear();pausedEvents=[];collisionPaused=false;list.replaceChildren();check.disabled=true;
  summary.textContent='Biegefolge wird geprüft …';el('playBend').disabled=true;
  reviewPromise=engine.analyze(current,{...data,floorZ:-current.height},time=>sequenceGeometry(time),{
   isCancelled:()=>id!==revision||sequence!==current,
   onProgress:value=>{if(id===revision)summary.textContent='Biegefolge wird geprüft … '+Math.round(value*100)+' %';}
  }).then(result=>{
   if(id!==revision||sequence!==current||result.cancelled)return;
   review={...result,events:result.events.map((e,index)=>({...e,key:index}))};
   summary.textContent=!result.complete?result.reason+' Die Prüfung ist unvollständig.':result.events.length?result.events.length+' Kontaktwarnung(en). Klicke auf eine Warnung, um die Stelle zu sehen.':'Keine Kontakte mit den erfassten Maschinenformen oder dem Boden erkannt.';
   for(const event of review.events.slice(0,200)){
    const button=document.createElement('button');button.type='button';button.dataset.severity=event.severity;button.textContent=warningText(event,{});button.onclick=()=>seek(event);list.append(button);
   }
   if(review.events.length>200){const extra=document.createElement('p');extra.textContent='Weitere '+(review.events.length-200)+' Warnungen werden beim Abspielen berücksichtigt.';list.append(extra);}
   draw();
  }).catch(error=>{
   if(id!==revision)return;review={complete:false,events:[]};summary.textContent='Prüfung nicht abgeschlossen: '+error.message;
  }).finally(()=>{if(id===revision){check.disabled=false;el('playBend').disabled=false;}});
  await reviewPromise;
 }
 loadSequence=function(payload){
  oldLoad(payload);revision++;sequence.phases=phasesFor(sequence);beginReview();
 };
 function loadDemo(){loadSequence({format:'rohrplan-bend-simulation',version:1,name:'Demo-Rohr',cutLength:1200,tubeOuterDiameter:data.tooling.tubeOuterDiameter,centerHeight:data.centerHeight,bends:[{number:1,angleDegrees:Number(el('targetAngle').value)||90,radius:data.tooling.centerlineRadius,position:600,rotation:0}]});}
 check.onclick=()=>{if(!sequence)loadDemo();else beginReview();};
 el('playBend').onclick=async()=>{
  if(playing){stopAnimation();return;}
  if(!sequence)loadDemo();
  if(reviewPromise)await reviewPromise;
  if(!review?.complete){summary.textContent='Die Prüfung ist noch unvollständig. Bitte „Biegefolge prüfen“ ausführen.';return;}
  if(sequenceTime>=sequence.duration){sequenceTime=0;acknowledged.clear();}
  if(collisionPaused){for(const event of pausedEvents)acknowledged.add(event.key);pausedEvents=[];collisionPaused=false;}
  playing=true;lastFrame=null;el('playBend').textContent='Pause';requestAnimationFrame(animateBend);
 };
 animateSequence=function(time){
  if(!playing)return;
  const elapsed=lastFrame===null?0:Math.min((time-lastFrame)/1000,.1);lastFrame=time;
  const next=Math.min(sequence.duration,sequenceTime+elapsed);
  const event=stopCheck.checked?review?.events.find(e=>!acknowledged.has(e.key)&&e.time>=sequenceTime-1e-7&&e.time<=next+1e-7):null;
  if(event){
   sequenceTime=event.time;pausedEvents=review.events.filter(e=>!acknowledged.has(e.key)&&Math.abs(e.time-event.time)<1e-7);collisionPaused=true;
   armAngle=sequenceGeometry(sequenceTime).angle;el('armAngle').value=armAngle;el('armAngleValue').textContent=armAngle.toFixed(1)+'°';draw();stopAnimation();el('playBend').textContent='Weiter';return;
  }
  sequenceTime=next;pausedEvents=[];armAngle=sequenceGeometry(sequenceTime).angle;el('armAngle').value=armAngle;el('armAngleValue').textContent=armAngle.toFixed(1)+'°';draw();
  if(sequenceTime>=sequence.duration){stopAnimation();return;}
  requestAnimationFrame(animateBend);
 };
 const oldProgress=el('sequenceProgress').oninput;
 el('sequenceProgress').oninput=event=>{pausedEvents=[];collisionPaused=false;oldProgress(event);acknowledged=new Set((review?.events||[]).filter(e=>e.time<sequenceTime-1e-7).map(e=>e.key));};
 const oldReset=el('resetBend').onclick;
 el('resetBend').onclick=()=>{pausedEvents=[];collisionPaused=false;acknowledged.clear();oldReset();};
 const oldDemo=el('demoSimulation').onclick;
 el('demoSimulation').onclick=()=>{revision++;review=null;reviewPromise=null;pausedEvents=[];collisionPaused=false;acknowledged.clear();list.replaceChildren();check.disabled=false;el('playBend').disabled=false;summary.textContent='Demo-Rohr: „Biegefolge prüfen“ oder „Start“ prüft den Ablauf.';data.floorZ=-data.centerHeight;oldDemo();};
 summary.textContent='„Biegefolge prüfen“ oder „Start“ prüft den Demo-Ablauf. Geladene Rohre werden automatisch geprüft.';
 draw();
})();
