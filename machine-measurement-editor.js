/* Use the existing dimensioned drawing as a machine editor in master data. */
(()=>{
 'use strict';
 if(new URLSearchParams(location.search).get('editor')!=='1')return;
 const api=window.RohrPlanMachines;let draft=null;
 document.body.classList.add('machine-editor');
 document.title='Maschine · Maßskizze';document.querySelector('h1').textContent='Maschinenmaße direkt in die Skizze eintragen';
 document.querySelector('.info').textContent='Jeder rote Pfeil zeigt eine Messstrecke. Trage die Maße der neuen Maschine in die roten Felder ein. Der Rollen-Ø wird automatisch aus dem ausgewählten Rohr berechnet: 2 × Biegeradius. Alle Längen in mm. Speichern übernimmt diese Maße für Simulation und Kollisionsprüfung.';
 document.querySelector('nav a[href="TUBOBEND_48_Modellvorschau.html"]')?.remove();
 document.querySelector('.hint.actions').textContent='Die Skizze gilt für eine waagerechte Biegemaschine in der gezeigten Ausrichtung. Jede Maschine wird mit eigenen Maßen gespeichert.';
 const details=document.createElement('section');details.className='card machine-identity';
 details.innerHTML='<h2>Maschine</h2><div class="machine-meta-grid"><label>Maschinenname<input id="editedMachineName" required maxlength="100" placeholder="z. B. Biegemaschine 2"></label><label>Hersteller (optional)<input id="editedMachineManufacturer" maxlength="100"></label><label>Rohrmittellinienhöhe über Boden · mm<input id="editedMachineHeight" type="number" min="0.1" step="any" required></label><label>Biegerichtung · von oben gesehen<select id="editedMachineDirection"><option value="clockwise">Im Uhrzeigersinn</option><option value="counterclockwise">Gegen Uhrzeigersinn</option></select></label><label>Futterdrehung bei positiven Winkeln<select id="editedChuckDirection"><option value="clockwise">Im Uhrzeigersinn</option><option value="counterclockwise">Gegen Uhrzeigersinn</option></select><small>Vom Futter zur Biegerolle gesehen. Gilt direkt für Simulation und Kollisionsprüfung.</small></label></div><p>Höhe vom Boden bis zur Rohrmitte an der Biegerolle. Die Biegerichtung wird für Simulation und Kollisionsprüfung übernommen. Die Maße beschreiben die gezeigte Grundanordnung; bei Gegen Uhrzeigersinn wird sie zur Rohrlinie gespiegelt. Die Futterdrehung folgt der eigenen Auswahl und nimmt den kürzesten Weg zur angegebenen Futterstellung.</p><button type="submit" class="save">Maschine speichern und auswählen</button><p id="machineEditorStatus" role="status" aria-live="polite">Maßskizze wird geladen …</p>';
 form.prepend(details);
 const el=id=>document.getElementById(id),saveButtons=[details.querySelector('button'),form.querySelector('.toolbar .save')];
 saveButtons[1].textContent='Maschine speichern und auswählen';saveButtons.forEach(button=>button.disabled=true);
 const style=document.createElement('style');style.textContent='.machine-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.machine-meta-grid label{display:flex;flex-direction:column;gap:6px}.machine-meta-grid input,.machine-meta-grid select{font:inherit;width:100%;padding:8px;border:1px solid #839d8c;border-radius:5px;background:white;color:#20372c}#machineEditorStatus{color:#24673e}.machine-editor .intro{margin-bottom:12px}@media(max-width:600px){.machine-meta-grid{grid-template-columns:1fr}}@media print{.machine-identity button{display:none}.machine-meta-grid input,.machine-meta-grid select{border:0}}';document.head.append(style);
 function feedback(text){status.textContent=text;el('machineEditorStatus').textContent=text;}
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||window.parent===window)return;
  if(event.data?.type==='rohrplan-machine-editor-error'){feedback(event.data.message);saveButtons.forEach(button=>button.disabled=false);return;}
  if(event.data?.type==='rohrplan-machine-editor-tooling'){showRollDiameter(event.data.tooling);return;}
  if(event.data?.type!=='rohrplan-machine-editor-load')return;
  draft=event.data.machine;
  el('editedMachineName').value=draft.name||'';el('editedMachineManufacturer').value=draft.manufacturer||'';
  el('editedMachineHeight').value=draft.centerHeight??'';el('editedMachineDirection').value=draft.bendDirection||'clockwise';el('editedChuckDirection').value=draft.chuckRotationDirection||'clockwise';
  for(const {input,group,name,factor,derived} of fields){if(derived)continue;const value=draft.measurements?.groups?.[group]?.[name];input.value=Number.isFinite(value)?value/factor:'';input.required=true;}
  showRollDiameter(event.data.tooling);
  feedback(draft.id?'Gespeicherte Maße geladen. Änderungen mit „Maschine speichern und auswählen“ übernehmen.':'Neue Maschine: Namen, Höhe und alle roten Maßfelder ausfüllen.');
  saveButtons.forEach(button=>button.disabled=false);
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!draft||!form.reportValidity())return;
  try{
   const machine=api.validate({id:draft.id,name:el('editedMachineName').value,manufacturer:el('editedMachineManufacturer').value,centerHeight:Number(el('editedMachineHeight').value),bendDirection:el('editedMachineDirection').value,chuckRotationDirection:el('editedChuckDirection').value,measurements:values()});
   feedback('Maschine wird gespeichert …');saveButtons.forEach(button=>button.disabled=true);
   window.parent.postMessage({type:'rohrplan-machine-editor-save',machine},'*');
  }catch(error){feedback(error.message);}
 });
 if(window.parent!==window)window.parent.postMessage({type:'rohrplan-machine-editor-ready'},'*');
})();
