/* Shared bending geometry for the preview and the bend-data collision report. */
(()=>{
 'use strict';
 const radians=Math.PI/180;
 const rotationDelta=(next,previous)=>((next-previous+540)%360-180)*radians;
 const rotateX=(p,a)=>[p[0],p[1]*Math.cos(a)-p[2]*Math.sin(a),p[1]*Math.sin(a)+p[2]*Math.cos(a)];
 const rotateZ=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]];
 function createSequence(payload,model){
  if(payload?.format!=='rohrplan-bend-simulation'||payload.version!==1||!Array.isArray(payload.bends)||!payload.bends.length||payload.bends.length>500||!Number.isFinite(payload.cutLength)||payload.cutLength<=0||!Number.isFinite(payload.tubeOuterDiameter)||payload.tubeOuterDiameter<=0)throw Error('Keine gültigen RohrPlan-Biegedaten.');
  const maxAngle=model.components.find(c=>c.id==='bend-arm').maxAngleDegrees;
  let time=0,previous=null,rotation=0;const phases=[];
  const bends=payload.bends.map((b,i)=>{
   if(![b.angleDegrees,b.radius,b.position,b.rotation].every(Number.isFinite)||b.angleDegrees<=0||b.angleDegrees>maxAngle||b.radius<=0||b.position<0||b.position>payload.cutLength)throw Error('Ungültige Biegedaten oder Biegewinkel über '+maxAngle+'°.');
   const feed=previous?previous.position-b.position-previous.radius*previous.angleDegrees*radians:payload.cutLength-b.position;
   if(feed<-.1)throw Error('Die Biegungen überlappen oder die Zwischenstrecke ist zu kurz.');
   const delta=rotationDelta(b.rotation,rotation),number=b.number??i+1;
   for(const [kind,duration]of [['Vorschub',2],['Futterdrehung',Math.max(.6,Math.abs(delta)/radians/45)],['Biegen',Math.max(1,b.angleDegrees/20)]]){
    phases.push({kind,start:time,end:time+duration,number,feed:Math.max(0,feed),rotation:delta,angle:b.angleDegrees*radians});time+=duration;
   }
   rotation=b.rotation;previous=b;return {...b,number,feed:Math.max(0,feed),angle:b.angleDegrees};
  });
  const used=bends.reduce((sum,b)=>sum+b.feed+b.radius*b.angle*radians,0);
  if(used>payload.cutLength+.1)throw Error('Die Biegestrecken überschreiten die Rohrlänge.');
  return {name:String(payload.name||'Rohr'),diameter:payload.tubeOuterDiameter,length:payload.cutLength,height:Number.isFinite(payload.centerHeight)&&payload.centerHeight>0?payload.centerHeight:model.centerHeight,bends,duration:time,phases};
 }
 function stateAt(sequence,time){
  let shape=[[0,0,0]],used=0,remainingTime=time,previousRotation=0,angle=0,rotationAngle=0,radius=sequence.bends[0].radius;
  for(let i=0;i<sequence.bends.length;i++){
   const b=sequence.bends[i];radius=b.radius;const feed=b.feed,delta=rotationDelta(b.rotation,previousRotation);
   for(const phase of sequence.phases.slice(i*3,i*3+3)){
    const t=Math.min(1,Math.max(0,remainingTime/(phase.end-phase.start)));
    if(phase.kind==='Vorschub'){shape=[[0,0,0],...shape.map(p=>[p[0]+feed*t,p[1],p[2]])];used+=feed*t;angle=0;}
    if(phase.kind==='Futterdrehung'){shape=shape.map(p=>rotateX(p,delta*t));rotationAngle=previousRotation*radians+delta*t;}
    if(phase.kind==='Biegen'){
     angle=b.angle*t;const a=angle*radians,r=b.radius,end=[r*Math.sin(a),-r*(1-Math.cos(a)),0];
     const stepAngle=Math.min(Math.PI/90,2*Math.acos(Math.max(-1,1-.5/r))),count=Math.max(2,Math.ceil(a/Math.max(stepAngle,1e-8))+1);
     if(count>20000||shape.length+count>20000)throw Error('Zu viele Rohrpunkte für eine vollständige Prüfung.');
     const arc=Array.from({length:count},(_,j)=>{const q=a*j/(count-1);return [r*Math.sin(q),-r*(1-Math.cos(q)),0];});
     shape=[...arc,...shape.slice(1).map(p=>rotateZ(p,-a).map((v,k)=>v+end[k]))];used+=r*a;
    }
    if(remainingTime<phase.end-phase.start)return {points:[[-Math.max(0,sequence.length-used),0,0],...shape],angle,radius,rotation:rotationAngle,phase:phase.kind,number:b.number,message:'Biegung '+(i+1)+' / '+sequence.bends.length+' · '+phase.kind};
    remainingTime-=phase.end-phase.start;
   }
   previousRotation=b.rotation;
  }
  return {points:[[-Math.max(0,sequence.length-used),0,0],...shape],angle,radius,rotation:rotationAngle,phase:'Fertig',number:sequence.bends.at(-1).number,message:'Fertig · '+sequence.name};
 }
 window.RohrPlanBendSequence={createSequence,stateAt};
})();
