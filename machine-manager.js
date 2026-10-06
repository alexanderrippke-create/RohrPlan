/* Machine management belongs to master data; drawings are edited in a dialog. */
(()=>{
 'use strict';
 const machines=window.RohrPlanMachines,el=id=>document.getElementById(id);
 let draft=null;
 function render(){
  const active=machines.getActive(),select=el('machineSelect');select.replaceChildren();
  for(const machine of machines.list())select.add(new Option(machine.name,machine.id));select.value=active.id;
  el('selectedMachineInfo').textContent=(active.manufacturer?active.manufacturer+' · ':'')+'Rohrmitte '+active.centerHeight+' mm · Biegen: '+(active.bendDirection==='clockwise'?'Uhrzeigersinn':'Gegen Uhrzeigersinn')+' · Futterdrehung bei positiven Winkeln: '+(active.chuckRotationDirection==='clockwise'?'Uhrzeigersinn':'Gegen Uhrzeigersinn');
  el('machineSettingsStatus').textContent=machines.getLoadError();
 }
 function openEditor(isNew){
  draft=isNew?{id:'',name:'',manufacturer:'',centerHeight:null,bendDirection:'clockwise',chuckRotationDirection:'clockwise',measurements:{groups:{}}}:machines.getActive();
  el('machineEditorTitle').textContent=isNew?'Neue Maschine anlegen':'Maschine bearbeiten · '+draft.name;
  const frame=el('machineMeasurementFrame');
  frame.src='./TUBOBEND_48_Kollisionsmessung.html?editor=1&version=chuck-20261006';el('machineEditorDialog').showModal();
 }
 el('machineSelect').onchange=()=>{try{machines.select(el('machineSelect').value);el('machineSettingsStatus').textContent='Ausgewählte Maschine wird für Biegedaten und Simulation verwendet.';}catch(error){render();el('machineSettingsStatus').textContent='Auswahl konnte nicht gespeichert werden: '+error.message;}};
 el('addMachine').onclick=()=>openEditor(true);el('editMachine').onclick=()=>openEditor(false);
 el('closeMachineEditor').onclick=()=>el('machineEditorDialog').close();
 el('machineEditorDialog').addEventListener('close',()=>{draft=null;el('machineMeasurementFrame').src='about:blank';});
 window.addEventListener('message',event=>{
  const frame=el('machineMeasurementFrame');if(event.source!==frame.contentWindow||!draft||!el('machineEditorDialog').open)return;
  if(event.data?.type==='rohrplan-machine-editor-ready'){frame.contentWindow.postMessage({type:'rohrplan-machine-editor-load',machine:draft,tooling:machines.getTooling()},'*');return;}
  if(event.data?.type!=='rohrplan-machine-editor-save')return;
  try{
   const saved=machines.save({...event.data.machine,id:draft.id});el('machineEditorDialog').close();
   el('machineSettingsStatus').textContent='„'+saved.name+'“ gespeichert und ausgewählt. Die neuen Maße gelten für Simulation und Kollisionsprüfung.';
  }catch(error){frame.contentWindow.postMessage({type:'rohrplan-machine-editor-error',message:'Maschine konnte nicht gespeichert werden: '+error.message},'*');}
 });
 machines.subscribeTooling(tooling=>{
  const frame=el('machineMeasurementFrame');
  if(draft&&el('machineEditorDialog').open)frame.contentWindow.postMessage({type:'rohrplan-machine-editor-tooling',tooling},'*');
 });
 machines.subscribe(render);render();
})();
