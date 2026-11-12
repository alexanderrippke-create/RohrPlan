/* Saved machines and the common model used by preview and collision checks. */
(()=>{
 'use strict';
 const key='rohrplan.machines.v1',clone=value=>JSON.parse(JSON.stringify(value));
 const template=window.RohrPlanTubobend48Model,listeners=new Set(),toolingListeners=new Set();
 let tooling=null;
 const fields=Object.fromEntries(Object.entries(template.collisionMeasurements.groups).map(([group,values])=>[group,Object.keys(values).filter(name=>group!=='M2'||name!=='dieWidth')]));
 // Optional detail measurements. Until a value is entered the estimate taken
 // from the machine photos is used and reported as "estimated".
 const detailFields={
  beamOuterEdge:{label:'Rohrmitte bis äußere Balkenkante auf der Bedienseite',estimate:162.5,min:-600,max:1000,collision:true},
  beamHeight:{label:'Höhe des Führungsbalkens',estimate:150,min:1,max:1000,collision:true},
  support1FromTangent:{label:'O bis Stützfuß 1',estimate:null,min:0,max:30000,collision:true},
  support2FromTangent:{label:'O bis Stützfuß 2',estimate:null,min:0,max:30000,collision:true},
  chuckHandleReach:{label:'Rohrmitte bis Griffende am Futterschlitten',estimate:205,min:0,max:1000,collision:true},
  chuckCarriageTop:{label:'Rohrmitte bis Oberkante Klemmhebel am Futterschlitten',estimate:115,min:0,max:1000,collision:true},
  clampCylinderLength:{label:'Länge des Spannzylinders am Biegearm',estimate:150,min:1,max:1000,collision:false},
  housingRearCutLength:{label:'Gehäuse: Länge der hinteren Aussparung ab Futterseite',estimate:225,min:0,max:3000,collision:true},
  housingRearCutDepth:{label:'Gehäuse: Tiefe der hinteren Aussparung ab Rückseite',estimate:195,min:0,max:3000,collision:true},
  housingRearCutHeight:{label:'Gehäuse: Höhe der hinteren Aussparung ab Bettoberkante',estimate:320,min:0,max:3000,collision:true},
  housingRearStepDrop:{label:'Gehäuse: Absatz hinten, tiefer als Bettoberkante',estimate:50,min:0,max:3000,collision:true},
  housingNicheWidth:{label:'Gehäuse: Breite der Nische unter der Rollenachse',estimate:190,min:0,max:3000,collision:true},
  housingNicheDepth:{label:'Gehäuse: Tiefe der Nische ab Kopfende',estimate:130,min:0,max:3000,collision:true},
  housingNicheHeight:{label:'Gehäuse: Höhe der Nische ab Bettoberkante',estimate:320,min:0,max:3000,collision:true}
 };
 // The housing as columns on a plan grid inside the measured outer box
 // (clockwise reference layout). Each column ends at its own top level.
 function housingColumns(bounds,rollY,v){
  const [x0,y0,z0]=bounds.min,[x1,y1,z1]=bounds.max,clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
  const niche0=clamp(rollY-v.housingNicheWidth/2,y0,y1),niche1=clamp(rollY+v.housingNicheWidth/2,y0,y1);
  const cutX=clamp(x0+v.housingRearCutLength,x0,x1),cutY=clamp(y0+v.housingRearCutDepth,y0,y1),nicheX=clamp(x1-v.housingNicheDepth,x0,x1);
  const sorted=list=>[...new Set(list)].sort((a,b)=>a-b),xs=sorted([x0,cutX,nicheX,x1]),ys=sorted([y0,cutY,niche0,niche1,y1]),boxes=[];
  for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){
   const x=(xs[i-1]+xs[i])/2,y=(ys[j-1]+ys[j])/2;let drop=y<niche0?v.housingRearStepDrop:0;
   if(x<cutX&&y<cutY)drop=Math.max(drop,v.housingRearCutHeight);
   if(x>nicheX&&y>niche0&&y<niche1)drop=Math.max(drop,v.housingNicheHeight);
   const top=Math.max(z0,z1-drop);if(top>z0)boxes.push({min:[xs[i-1],ys[j-1],z0],max:[xs[i],ys[j],top]});
  }
  return boxes;
 }
 function resolveDetails(machine){
  const values={},status={},raw=machine?.measurements?.details||{};
  for(const [name,field] of Object.entries(detailFields)){
   const measured=Number.isFinite(raw[name]);
   values[name]=measured?raw[name]:field.estimate;status[name]=measured?'measured':field.estimate===null?'missing':'estimated';
  }
  return {values,status};
 }
 function getTooling(){return tooling?clone(tooling):null;}
 function setTooling(value){
  const next=value&&Number.isFinite(value.radius)&&value.radius>0&&Number.isFinite(value.tubeOuterDiameter)&&value.tubeOuterDiameter>0?{radius:value.radius,tubeOuterDiameter:value.tubeOuterDiameter}:null;
  if(JSON.stringify(next)===JSON.stringify(tooling))return;
  tooling=next;for(const listener of toolingListeners)listener(getTooling());
 }
 // Bounds are recalculated for every bend, including imported sequences with different radii.
 function movingBounds(model,radius){
  const arm=model.components.find(c=>c.id==='bend-arm'),head=model.components.find(c=>c.id==='bending-head'),bounds=head.boundsRelativeToRollAxis;
  const start=2*radius,end=arm.length;
  return {cylinder:start<end?{min:[bounds.min[0],start,bounds.min[2]],max:[bounds.max[0],end,bounds.max[2]]}:null,
   arm:{min:[-arm.width/2,0,bounds.min[2]],max:[arm.width/2,end,bounds.max[2]]}};
 }
 // Measurements describe the drawing's clockwise reference layout. The
 // opposite tooling arrangement is its reflection across the tube axis.
 const bendSign=model=>model.bendDirection==='counterclockwise'?-1:1;
 // Positive chuck positions follow the saved direction, viewed from the
 // chuck towards the die. All consumers use the same shortest rotation.
 function chuckRotationDelta(next,previous,direction='clockwise'){
  const degrees=((next-previous+180)%360+360)%360-180;
  return degrees*Math.PI/180*(direction==='counterclockwise'?-1:1);
 }
 const rollCenter=(model,radius)=>[0,-bendSign(model)*radius,0];
 // The rear tube end rests against the chuck body face, between the jaws. The
 // chuck travels with it along the whole guide beam and stops at the nearest
 // measured position in front of the bending head. Jaw depth is schematic.
 const chuckJawDepth=model=>.1*model.components.find(c=>c.id==='chuck-front').length;
 function chuckFront(model,tubeRearX){
  const chuck=model.components.find(c=>c.id==='chuck-front'),beam=model.components.find(c=>c.id==='guide-top');
  const farthest=Math.min(chuck.farthestFrontCenter[0],beam.min[0]+chuck.length);
  return Math.max(farthest,Math.min(chuck.nearestFrontCenter[0],tubeRearX+chuckJawDepth(model)));
 }
 function armTransform(model,radius,angleDegrees){
  const sign=bendSign(model),center=rollCenter(model,radius),angle=angleDegrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  return {center,
   toWorld:p=>[p[0]*c+p[1]*s+center[0],sign*(-p[0]*s+p[1]*c)+center[1],p[2]+center[2]],
   toLocal:p=>{const x=p[0]-center[0],y=sign*(p[1]-center[1]);return [x*c-y*s,x*s+y*c,p[2]-center[2]];}};
 }
 function bodyBounds(model,radius){
  const body=model.components.find(c=>c.id==='body'),shift=rollCenter(model,radius)[1]-model.tooling.rollAxis[1];
  return {min:body.min.map((v,i)=>v+(i===1?shift:0)),max:body.max.map((v,i)=>v+(i===1?shift:0))};
 }
 // Housing columns moved with the roll axis like bodyBounds; key 'boxes' is the
 // checked shape, 'displayBoxes' the drawn one.
 function bodyBoxes(model,radius,key='boxes'){
  const body=model.components.find(c=>c.id==='body'),shift=rollCenter(model,radius)[1]-model.tooling.rollAxis[1];
  return body[key].map(box=>({min:[box.min[0],box.min[1]+shift,box.min[2]],max:[box.max[0],box.max[1]+shift,box.max[2]]}));
 }
 function validate(input){
  if(!input||typeof input.name!=='string'||!input.name.trim())throw Error('Bitte einen Maschinennamen eingeben.');
  if(input.name.trim().length>100)throw Error('Der Maschinenname darf höchstens 100 Zeichen haben.');
  if(!Number.isFinite(input.centerHeight)||input.centerHeight<=0)throw Error('Die Rohrmittellinienhöhe muss größer als 0 mm sein.');
  if(!['clockwise','counterclockwise'].includes(input.bendDirection))throw Error('Bitte eine Biegerichtung auswählen.');
  const chuckRotationDirection=input.chuckRotationDirection===undefined?'clockwise':input.chuckRotationDirection;
  if(!['clockwise','counterclockwise'].includes(chuckRotationDirection))throw Error('Bitte eine Futterdrehrichtung auswählen.');
  const groups={};
  for(const [group,names] of Object.entries(fields)){
   groups[group]={};
   for(const name of names){
    const value=input.measurements?.groups?.[group]?.[name];
    if(!Number.isFinite(value))throw Error('Bitte alle roten Maßfelder ausfüllen.');
    const negative=group==='M5'&&name.includes('ZFromTubeCenter');
    if(negative?value>=0:value<0)throw Error('Bitte positive Abstände in die Maßskizze eintragen.');
    groups[group][name]=value;
   }
  }
  const {M1:a,M2:w,M3:h,M4:c,M5:b,M6:g,M7:s}=groups;
  if(a.reachFromRollAxis<=0||w.armWidth<=0||w.cylinderWidth<=0||w.maxWidth<=0||h.aboveTubeCenter+h.belowTubeCenter<=0||c.outerDiameter<=0||c.axialLength<=0||g.width<=0||s.maxSwingAngle<=0||s.maxSwingAngle>360)throw Error('Breiten, Längen und Schwenkwinkel müssen größer als 0 sein; der Schwenkwinkel darf höchstens 360° betragen.');
  if(w.maxWidth<Math.max(w.armWidth,w.cylinderWidth))throw Error('Die größte Breite muss mindestens so groß wie Arm und Zylinder sein.');
  if(c.farthestFrontToTangent<c.nearestFrontToTangent)throw Error('Der hintere Futterabstand darf nicht kleiner als der nahe Abstand sein.');
  if(g.endToTangent<=g.startToTangent)throw Error('Das Rahmenende muss weiter von O entfernt sein als der Rahmenanfang.');
  if(b.bottomZFromTubeCenter>=b.topZFromTubeCenter||b.leftFromRollAxis+b.rightFromRollAxis<=0||b.upFromRollAxis+b.downFromRollAxis<=0)throw Error('Bitte die Außenmaße des Maschinenbetts prüfen.');
  const details={},rawDetails=input.measurements?.details;
  if(rawDetails&&typeof rawDetails==='object')for(const [name,field] of Object.entries(detailFields)){
   const value=rawDetails[name];if(value===null||value===undefined)continue;
   if(!Number.isFinite(value)||value<field.min||value>field.max)throw Error('Detailmaß „'+field.label+'“ ist ungültig. Erlaubt: '+field.min+' bis '+field.max+' mm.');
   details[name]=value;
  }
  return {id:typeof input.id==='string'?input.id:'',name:input.name.trim(),manufacturer:String(input.manufacturer||'').trim().slice(0,100),centerHeight:input.centerHeight,bendDirection:input.bendDirection,chuckRotationDirection,measurements:{...clone(template.collisionMeasurements),machine:input.name.trim(),groups,details}};
 }
 function defaultMachine(){return validate({id:'tubobend-48',name:'TUBOBEND 48',manufacturer:'Tracto-Technik',centerHeight:template.centerHeight,bendDirection:template.bendDirection,measurements:clone(template.collisionMeasurements)});}
 let state={version:1,activeId:'tubobend-48',machines:[defaultMachine()]},loadError='';
 try{
  const stored=localStorage.getItem(key);
  // Keep the machine list exactly as the previous program version left it, once.
  // If reading fails below, nothing is lost and it can be restored from here.
  if(stored&&localStorage.getItem(key+'.backup-before-details')===null)localStorage.setItem(key+'.backup-before-details',stored);
  if(stored){
   const saved=JSON.parse(stored);
   if(saved.version!==1||!Array.isArray(saved.machines)||!saved.machines.length)throw Error('Ungültige Maschinenliste');
   const machines=saved.machines.map(validate),ids=new Set(machines.map(m=>m.id));
   // A TUBOBEND 48 saved before the detail measurements existed gets the measured defaults.
   for(const machine of machines)if(machine.id==='tubobend-48'&&!Object.keys(machine.measurements.details).length)machine.measurements.details=clone(template.collisionMeasurements.details||{});
   if(ids.size!==machines.length||machines.some(m=>!m.id)||!ids.has(saved.activeId))throw Error('Ungültige Maschinenauswahl');
   state={version:1,activeId:saved.activeId,machines};
  }else{
   const legacy=JSON.parse(localStorage.getItem('rohrplan.machine-settings.v1')||'null'),machine=defaultMachine();
   if(Number.isFinite(legacy?.centerHeight)&&legacy.centerHeight>0)machine.centerHeight=legacy.centerHeight;
   if(legacy?.bendDirection==='counterclockwise')machine.bendDirection=legacy.bendDirection;
   state.machines=[machine];
  }
 }catch{loadError='Gespeicherte Maschinendaten konnten nicht gelesen werden. Bitte die Stammdaten prüfen.';}
 function persist(next){localStorage.setItem(key,JSON.stringify(next));state=next;loadError='';for(const listener of listeners)listener();}
 function getActive(){return clone(state.machines.find(m=>m.id===state.activeId));}
 function save(input){
  const machine=validate(input);
  if(state.machines.some(m=>m.id!==machine.id&&m.name.toLocaleLowerCase()===machine.name.toLocaleLowerCase()))throw Error('Dieser Maschinenname ist bereits vorhanden. Bitte einen anderen Namen wählen.');
  if(machine.id&&!state.machines.some(m=>m.id===machine.id))throw Error('Die zu bearbeitende Maschine wurde nicht gefunden.');
  if(!machine.id)machine.id='machine-'+crypto.randomUUID();
  const machines=state.machines.filter(m=>m.id!==machine.id);machines.push(machine);
  persist({version:1,activeId:machine.id,machines});return clone(machine);
 }
 function select(id){if(!state.machines.some(m=>m.id===id))throw Error('Maschine nicht gefunden.');persist({...state,activeId:id});}
 function model(input=getActive(),tool=getTooling()){
  const machine=validate(input),result=clone(template),p=id=>result.components.find(c=>c.id===id);
  const radius=tool?.radius??template.tooling.centerlineRadius,diameter=tool?.tubeOuterDiameter??template.tooling.tubeOuterDiameter;
  if(!Number.isFinite(radius)||radius<=0||!Number.isFinite(diameter)||diameter<=0)throw Error('Biegeradius und Rohrdurchmesser müssen größer als 0 mm sein.');
  const {M1:a,M2:w,M3:h,M4:c,M5:b,M6:g,M7:s}=machine.measurements.groups,C=[0,-radius,0];
  Object.assign(result.tooling,{centerlineRadius:radius,tubeOuterDiameter:diameter,rollAxis:C});
  result.machine=machine.name;result.machineProfileId=machine.id;result.machineProfile=clone(machine);result.centerHeight=machine.centerHeight;result.floorZ=-machine.centerHeight;result.bendDirection=machine.bendDirection;result.chuckRotationDirection=machine.chuckRotationDirection;
  result.collisionMeasurements=clone(machine.measurements);result.measurementSource='saved-machine-profile';result.measurements=null;result.measurementNotes=[];
  result.collisionMeasurements.groups.M2.dieWidth=2*radius;
  Object.assign(p('body'),{min:[-b.leftFromRollAxis,C[1]-b.downFromRollAxis,b.bottomZFromTubeCenter],max:[b.rightFromRollAxis,C[1]+b.upFromRollAxis,b.topZFromTubeCenter]});
  // The beam sits beside the tube axis. While its offset is only estimated the
  // collision box also keeps the former centred position (conservative union).
  const detail=resolveDetails(machine),d=detail.values,half=g.width/2,offset=d.beamOuterEdge-half,offsetMeasured=detail.status.beamOuterEdge==='measured';
  const beamBottom=-g.topBelowTubeCenter-d.beamHeight;
  result.details=d;result.detailStatus=detail.status;
  Object.assign(p('guide-top'),{kind:'box',status:offsetMeasured?'measured-box':'measured-top-surface-estimated-offset-and-height',missing:[],
   assumptions:offsetMeasured?[]:['Lateral offset estimated from photos; collision box also covers the centred position'],
   min:[-g.endToTangent,offsetMeasured?offset-half:Math.min(-half,offset-half),beamBottom],max:[-g.startToTangent,offsetMeasured?offset+half:Math.max(half,offset+half),-g.topBelowTubeCenter],
   displayMin:[-g.endToTangent,offset-half,beamBottom],displayMax:[-g.startToTangent,offset+half,-g.topBelowTubeCenter]});
  const supports=[d.support1FromTangent,d.support2FromTangent].filter(Number.isFinite).map(distance=>({min:[-distance-40,offset-half,-machine.centerHeight],max:[-distance+40,offset+half,beamBottom]}));
  // Housing shape: the preview uses estimates, the collision check only uses a
  // cut-out once all of its dimensions are measured (otherwise the full box).
  const measured=(...names)=>names.every(name=>detail.status[name]==='measured'),nicheMeasured=measured('housingNicheWidth','housingNicheDepth','housingNicheHeight');
  const checked={...d,housingRearCutLength:measured('housingRearCutLength','housingRearCutDepth','housingRearCutHeight')?d.housingRearCutLength:0,
   housingNicheDepth:nicheMeasured?d.housingNicheDepth:0,housingRearStepDrop:nicheMeasured&&measured('housingRearStepDrop')?d.housingRearStepDrop:0};
  const bodyPart=p('body'),bodyBox={min:bodyPart.min,max:bodyPart.max};
  bodyPart.displayBoxes=housingColumns(bodyBox,C[1],d);bodyPart.boxes=housingColumns(bodyBox,C[1],checked);
  result.components=result.components.filter(c=>c.id!=='guide-supports'&&c.id!=='chuck-carriage');
  result.components.push({id:'guide-supports',kind:'boxes',status:supports.length?'measured-position-schematic-shape':'missing',boxes:supports});
  // Carriage boxes are relative to the chuck front (x = 0 at the jaws side).
  result.components.push({id:'chuck-carriage',kind:'boxes-relative-to-chuck-front',status:'estimated-from-photos-unless-measured',
   plate:{min:[-c.axialLength,-80,-g.topBelowTubeCenter],max:[-.56*c.axialLength,80,d.chuckCarriageTop]},
   handle:{min:[-.8*c.axialLength,0,-20],max:[-.6*c.axialLength,d.chuckHandleReach,45]}});
  Object.assign(p('chuck-front'),{center:[-c.nearestFrontToTangent,0,0],radius:c.outerDiameter/2,length:c.axialLength,frontCenter:[-c.nearestFrontToTangent,0,0],rearCenter:[-c.nearestFrontToTangent-c.axialLength,0,0],nearestFrontCenter:[-c.nearestFrontToTangent,0,0],farthestFrontCenter:[-c.farthestFrontToTangent,0,0],farthestRearCenter:[-c.farthestFrontToTangent-c.axialLength,0,0]});
  const bounds={min:[-w.maxWidth/2,2*radius,-h.belowTubeCenter],max:[w.maxWidth/2,a.reachFromRollAxis,h.aboveTubeCenter]};
  Object.assign(p('bending-head'),{boundsRelativeToRollAxis:bounds,min:bounds.min.map((v,i)=>v+C[i]),max:bounds.max.map((v,i)=>v+C[i])});
  Object.assign(p('bend-arm'),{length:a.reachFromRollAxis,width:w.armWidth,cylinderWidth:w.cylinderWidth,maxWidth:w.maxWidth,maxAngleDegrees:s.maxSwingAngle});
  Object.assign(p('bend-die'),{outerRadius:radius,center:C});p('bend-arm').position=C;
  if(machine.bendDirection==='counterclockwise'){
   const reflect=point=>[point[0],-point[1],point[2]];
   result.tooling.rollAxis=reflect(result.tooling.rollAxis);
   const reflectBox=(box,lo='min',hi='max')=>{if(!box?.[lo]||!box[hi])return;const min=box[lo],max=box[hi];box[lo]=[min[0],-max[1],min[2]];box[hi]=[max[0],-min[1],max[2]];};
   for(const component of result.components){
    reflectBox(component);reflectBox(component,'displayMin','displayMax');reflectBox(component.plate);reflectBox(component.handle);for(const box of [...(component.boxes||[]),...(component.displayBoxes||[])])reflectBox(box);    for(const field of ['center','position','frontCenter','rearCenter','nearestFrontCenter','farthestFrontCenter','farthestRearCenter','zeroVector'])if(component[field])component[field]=reflect(component[field]);
   }
  }
  result.armZeroAxisSense=machine.bendDirection==='counterclockwise'?'negative-Y':'positive-Y';
  return result;
 }
 window.RohrPlanMachines={getActive,list:()=>clone(state.machines),save,select,model,validate,detailFields:()=>clone(detailFields),resolveDetails,movingBounds,bendSign,chuckRotationDelta,rollCenter,chuckFront,chuckJawDepth,armTransform,bodyBounds,bodyBoxes,getTooling,setTooling,subscribeTooling:listener=>toolingListeners.add(listener),subscribe:listener=>listeners.add(listener),getLoadError:()=>loadError};
})();
