/* Saved machines and the common model used by preview and collision checks. */
(()=>{
 'use strict';
 const key='rohrplan.machines.v1',clone=value=>JSON.parse(JSON.stringify(value));
 const template=window.RohrPlanTubobend48Model,listeners=new Set(),toolingListeners=new Set();
 let tooling=null;
 const fields=Object.fromEntries(Object.entries(template.collisionMeasurements.groups).map(([group,values])=>[group,Object.keys(values).filter(name=>group!=='M2'||name!=='dieWidth')]));
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
 function validate(input){
  if(!input||typeof input.name!=='string'||!input.name.trim())throw Error('Bitte einen Maschinennamen eingeben.');
  if(input.name.trim().length>100)throw Error('Der Maschinenname darf höchstens 100 Zeichen haben.');
  if(!Number.isFinite(input.centerHeight)||input.centerHeight<=0)throw Error('Die Rohrmittellinienhöhe muss größer als 0 mm sein.');
  if(!['clockwise','counterclockwise'].includes(input.bendDirection))throw Error('Bitte eine Biegerichtung auswählen.');
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
  return {id:typeof input.id==='string'?input.id:'',name:input.name.trim(),manufacturer:String(input.manufacturer||'').trim().slice(0,100),centerHeight:input.centerHeight,bendDirection:input.bendDirection,measurements:{...clone(template.collisionMeasurements),machine:input.name.trim(),groups}};
 }
 function defaultMachine(){return validate({id:'tubobend-48',name:'TUBOBEND 48',manufacturer:'Tracto-Technik',centerHeight:template.centerHeight,bendDirection:template.bendDirection,measurements:clone(template.collisionMeasurements)});}
 let state={version:1,activeId:'tubobend-48',machines:[defaultMachine()]},loadError='';
 try{
  const stored=localStorage.getItem(key);
  if(stored){
   const saved=JSON.parse(stored);
   if(saved.version!==1||!Array.isArray(saved.machines)||!saved.machines.length)throw Error('Ungültige Maschinenliste');
   const machines=saved.machines.map(validate),ids=new Set(machines.map(m=>m.id));
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
  result.machine=machine.name;result.machineProfileId=machine.id;result.centerHeight=machine.centerHeight;result.floorZ=-machine.centerHeight;result.bendDirection=machine.bendDirection;
  result.collisionMeasurements=clone(machine.measurements);result.measurementSource='saved-machine-profile';result.measurements=null;result.measurementNotes=[];
  result.collisionMeasurements.groups.M2.dieWidth=2*radius;
  Object.assign(p('body'),{min:[-b.leftFromRollAxis,C[1]-b.downFromRollAxis,b.bottomZFromTubeCenter],max:[b.rightFromRollAxis,C[1]+b.upFromRollAxis,b.topZFromTubeCenter]});
  Object.assign(p('guide-top'),{min:[-g.endToTangent,-g.width/2,-g.topBelowTubeCenter],max:[-g.startToTangent,g.width/2,-g.topBelowTubeCenter]});
  Object.assign(p('chuck-front'),{center:[-c.nearestFrontToTangent,0,0],radius:c.outerDiameter/2,length:c.axialLength,frontCenter:[-c.nearestFrontToTangent,0,0],rearCenter:[-c.nearestFrontToTangent-c.axialLength,0,0],nearestFrontCenter:[-c.nearestFrontToTangent,0,0],farthestFrontCenter:[-c.farthestFrontToTangent,0,0],farthestRearCenter:[-c.farthestFrontToTangent-c.axialLength,0,0]});
  const bounds={min:[-w.maxWidth/2,2*radius,-h.belowTubeCenter],max:[w.maxWidth/2,a.reachFromRollAxis,h.aboveTubeCenter]};
  Object.assign(p('bending-head'),{boundsRelativeToRollAxis:bounds,min:bounds.min.map((v,i)=>v+C[i]),max:bounds.max.map((v,i)=>v+C[i])});
  Object.assign(p('bend-arm'),{length:a.reachFromRollAxis,width:w.armWidth,cylinderWidth:w.cylinderWidth,maxWidth:w.maxWidth,maxAngleDegrees:s.maxSwingAngle});
  Object.assign(p('bend-die'),{outerRadius:radius,center:C});p('bend-arm').position=C;
  return result;
 }
 window.RohrPlanMachines={getActive,list:()=>clone(state.machines),save,select,model,validate,movingBounds,getTooling,setTooling,subscribeTooling:listener=>toolingListeners.add(listener),subscribe:listener=>listeners.add(listener),getLoadError:()=>loadError};
})();
