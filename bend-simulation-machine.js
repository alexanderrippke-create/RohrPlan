/* Conservative checks against the measured TUBOBEND envelopes, in mm.
 * The tube is a polyline of capsules. Expanded boxes are intentionally
 * conservative near edges; a machine hit is a warning, never a certification.
 */
(()=>{
 'use strict';
 const EPS=1e-7;
 const at=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 function boxInterval(a,b,min,max,padding){
  let lo=0,hi=1;
  for(let i=0;i<3;i++){
   const d=b[i]-a[i],lower=min[i]-padding,upper=max[i]+padding;
   if(Math.abs(d)<EPS){if(a[i]<lower||a[i]>upper)return null;continue;}
   const t0=(lower-a[i])/d,t1=(upper-a[i])/d;
   lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
   if(lo>hi)return null;
  }
  return [lo,hi];
 }
 function radialRange(a,b){
  const d=[b[1]-a[1],b[2]-a[2]],den=d[0]*d[0]+d[1]*d[1];
  const t=den?Math.max(0,Math.min(1,-(a[1]*d[0]+a[2]*d[1])/den)):0;
  return {min:Math.hypot(a[1]+d[0]*t,a[2]+d[1]*t),max:Math.max(Math.hypot(a[1],a[2]),Math.hypot(b[1],b[2])),t};
 }
 function chuckHit(a,b,chuck,tubeRadius,padding){
  // A straight tube along the spindle axis is the intended clamping contact.
  if([a[1],a[2],b[1],b[2]].every(v=>Math.abs(v)<EPS))return null;
  const interval=boxInterval(a,b,[chuck.center[0]-chuck.length,-Infinity,-Infinity],[chuck.center[0],Infinity,Infinity],padding);
  if(!interval)return null;
  const p=at(a,b,interval[0]),q=at(a,b,interval[1]),radial=radialRange(p,q);
  const boreRadius=tubeRadius+1; // Only the straight tube passage is known.
  if(radial.min>chuck.radius+padding||radial.max+padding<boreRadius)return null;
  return at(p,q,radial.t);
 }
 function armPieces(a,b,C,contactRadius){
  if([a[1],a[2],b[1],b[2]].every(v=>Math.abs(v)<EPS)&&a[0]<=EPS&&b[0]<=EPS)return [];
  // Exclude the normal active-tool contact only in the horizontal bending plane.
  // Split at the contact-zone boundary so a long segment is still checked outside.
  const cuts=[0,1],d=b.map((v,i)=>v-a[i]),x=a[0]-C[0],y=a[1]-C[1];
  const A=d[0]*d[0]+d[1]*d[1],B=2*(x*d[0]+y*d[1]),D=B*B-4*A*(x*x+y*y-contactRadius*contactRadius);
  if(A>EPS&&D>=0)for(const t of [(-B-Math.sqrt(D))/(2*A),(-B+Math.sqrt(D))/(2*A)])if(t>0&&t<1)cuts.push(t);
  if(Math.abs(d[2])>EPS)for(const z of [-.5,.5]){const t=(z-a[2])/d[2];if(t>0&&t<1)cuts.push(t);}
  cuts.sort((x,y)=>x-y);const pieces=[];
  for(let i=1;i<cuts.length;i++){
   if(cuts[i]-cuts[i-1]<EPS)continue;
   const mid=at(a,b,(cuts[i]+cuts[i-1])/2);
   if(Math.abs(mid[2])<=.5+EPS&&Math.hypot(mid[0]-C[0],mid[1]-C[1])<=contactRadius+EPS)continue;
   pieces.push([at(a,b,cuts[i-1]),at(a,b,cuts[i])]);
  }
  return pieces;
 }
 function inspect(state,model,diameter,margin=0){
  const tubeRadius=diameter/2,padding=tubeRadius+.5+margin,hits=new Map();
  const part=id=>model.components.find(c=>c.id===id),rail=part('guide-top'),arm=part('bend-arm'),baseChuck=part('chuck-front');
  const transform=window.RohrPlanMachines.armTransform(model,state.radius,state.angle),C=transform.center;
  const {min:bodyMin,max:bodyMax}=window.RohrPlanMachines.bodyBounds(model,state.radius);
  const frontX=Math.max(baseChuck.farthestFrontCenter[0],Math.min(baseChuck.nearestFrontCenter[0],state.points[0][0]+baseChuck.length));
  const chuck={...baseChuck,center:[frontX,0,0]};
  // The box width includes unmeasured positions of the tool-side parts.
  const contactRadius=Math.hypot(state.radius,arm.maxWidth/2+tubeRadius+4),bounds=window.RohrPlanMachines.movingBounds(model,state.radius);
  function record(id,label,index,point,severity='warning'){
   if(!hits.has(id))hits.set(id,{id,label,severity,point,segments:[]});
   hits.get(id).segments.push(index);
  }
  for(let i=1;i<state.points.length;i++){
   const a=state.points[i-1],b=state.points[i];
   if(Math.min(a[2],b[2])-padding<=model.floorZ){const point=a[2]<b[2]?a:b,actualContact=point[2]-tubeRadius<=model.floorZ;record('floor','Boden',i-1,point,actualContact&&state.phase!=='Futterdrehung'?'error':'warning');}
   const bed=boxInterval(a,b,bodyMin,bodyMax,padding);if(bed)record('body','Maschinenbett',i-1,at(a,b,(bed[0]+bed[1])/2));
   const guide=boxInterval(a,b,rail.min,rail.max,padding);if(guide)record('guide-top','Führungsrahmen · Oberkante',i-1,at(a,b,(guide[0]+guide[1])/2));
   const spindle=chuckHit(a,b,chuck,tubeRadius,padding);if(spindle)record('chuck-front','Spannfutter',i-1,spindle);
   for(const [p,q]of armPieces(a,b,C,contactRadius)){
    const p0=transform.toLocal(p),p1=transform.toLocal(q);
    const moving=(bounds.cylinder&&boxInterval(p0,p1,bounds.cylinder.min,bounds.cylinder.max,padding))||boxInterval(p0,p1,bounds.arm.min,bounds.arm.max,padding);
    if(moving){record('bend-arm','Arm / Zylinder · Außenhülle',i-1,at(p,q,(moving[0]+moving[1])/2));break;}
   }
  }
  return {hits:[...hits.values()],clearance:Math.min(...state.points.map(p=>p[2]))-tubeRadius-model.floorZ};
 }
 function phaseSpeed(phase,getState,model){
  const start=getState(phase.start),duration=phase.end-phase.start;
  if(phase.kind==='Vorschub')return 2*phase.feed/duration;
  if(phase.kind==='Futterdrehung')return Math.abs(phase.rotation)/duration*Math.max(0,...start.points.slice(1).map(p=>Math.hypot(p[1],p[2])));
  const tubeReach=start.radius+Math.max(0,...start.points.slice(1).map(p=>Math.hypot(p[0],p[1])));
  const reach=tubeReach+Math.max(start.radius,model.components.find(c=>c.id==='bend-arm').length);
  return Math.abs(phase.angle)/duration*reach;
 }
 async function analyze(sequence,model,getState,{isCancelled=()=>false,onProgress=()=>{}}={}){
  const events=[];let samples=0,finished=0,chunkStart=performance.now();
  const spacing=Math.max(1,Math.min(5,sequence.diameter/4)),budget=100000;
  for(const phase of sequence.phases){
   if(isCancelled())return {cancelled:true,events,samples,complete:false};
   const speed=phaseSpeed(phase,getState,model),steps=Math.max(1,Math.ceil(speed*(phase.end-phase.start)/spacing));
   const margin=speed*(phase.end-phase.start)/steps/2,seen=new Set();
   for(let j=0;j<=steps;j++){
    if(isCancelled())return {cancelled:true,events,samples,complete:false};
    if(samples>=budget)return {events,samples,complete:false,reason:'Die Biegefolge ist für eine vollständige Prüfung zu umfangreich.'};
    const time=j===steps?Math.max(phase.start,phase.end-1e-8):phase.start+(phase.end-phase.start)*j/steps;
    const state=getState(time);state.phase=phase.kind;state.number=phase.number;
    const report=inspect(state,model,sequence.diameter,margin);samples++;
    for(const hit of report.hits)if(!seen.has(hit.id)){
     seen.add(hit.id);events.push({...hit,time,number:phase.number,phase:phase.kind,margin});
    }
    if(performance.now()-chunkStart>30){onProgress(time/sequence.duration);await new Promise(resolve=>setTimeout(resolve,0));chunkStart=performance.now();}
   }
   finished=phase.end;onProgress(finished/sequence.duration);
  }
  events.sort((a,b)=>a.time-b.time);return {events,samples,complete:true};
 }
 window.RohrPlanMachineCollision={inspect,analyze};
})();
