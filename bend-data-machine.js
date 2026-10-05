/* Collision results in the bend-data table, including the printable report. */
(()=>{
 'use strict';
 let revision=0,job=null;const cache=new Map(),el=id=>document.getElementById(id);
 const limitation='Prüfung gegen die erfassten Außenhüllen. Genaue Spannbacken, Zylinderkonturen, Rahmenstützen und Armrücklauf sind noch nicht erfasst.';
 function reset(){revision++;job=null;el('machineCollisionSummary').textContent='';el('machineCollisionSummary').classList.remove('machine-warning-summary');}
 function paint(report){
  const events=report.events||[],machineEvents=events.filter(e=>e.id!=='floor');
  for(const row of el('bendDataRows').rows){
   const number=Number(row.dataset.bendNumber),cell=row.querySelector('[data-machine-collision]');if(!cell)continue;
   const hits=machineEvents.filter(e=>e.number===number);
   cell.classList.toggle('machine-warning',hits.length>0);
   cell.classList.toggle('machine-unchecked',!report.complete);
   const descriptions=[...new Set(hits.map(e=>e.label+' · '+e.phase))];
   cell.textContent=descriptions.length?'Möglicher Kontakt:\n'+descriptions.join('\n'):report.complete?'Keine Maschinenwarnung erkannt':'Nicht vollständig geprüft';
   if(descriptions.length&&!report.complete)cell.textContent+='\nPrüfung unvollständig';
   // Keep the original floor-distance report and add contacts found during the full sweep.
   const floorHits=events.filter(e=>e.number===number&&e.id==='floor');
   if(floorHits.length){
    const floorCell=row.querySelector('[data-floor-collision]');
    if(floorCell){floorCell.textContent+='\nAblaufprüfung: möglicher Bodenkontakt · '+[...new Set(floorHits.map(e=>e.phase))].join(', ');floorCell.classList.add('floor-turn-warning');}
   }
  }
  const affected=[...new Set(machineEvents.map(e=>e.number))];
  el('machineCollisionSummary').textContent='TUBOBEND 48 · Maschinenprüfung: '+(report.complete?(affected.length?'Warnungen bei Biegung '+affected.join(', ')+'. ':'Keine Maschinenwarnung im geprüften Ablauf erkannt. '):'Nicht abgeschlossen. '+(report.reason||'')+' ')+limitation;
  el('machineCollisionSummary').classList.toggle('machine-warning-summary',affected.length>0||!report.complete);
 }
 function run(payload,direction){
  const key=JSON.stringify([payload,direction]);
  if(job?.key===key)return job.promise;
  const id=revision;
  const promise=Promise.resolve().then(async()=>{
   try{
    if(id!==revision)return null;
    if(direction!=='clockwise')throw Error('Das gemessene Maschinenmodell gilt für die Biegung im Uhrzeigersinn. Maschinenkontakte in Gegenrichtung sind nicht geprüft.');
    if(!window.RohrPlanTubobend48Model||!window.RohrPlanBendSequence||!window.RohrPlanMachineCollision)throw Error('Die Dateien der Maschinenprüfung konnten nicht geladen werden. Bitte die Seite neu laden.');
    let report=cache.get(key);
    if(!report){
     el('machineCollisionSummary').textContent='Maschinenkontakte werden geprüft …';
     const model=JSON.parse(JSON.stringify(window.RohrPlanTubobend48Model)),sequence=window.RohrPlanBendSequence.createSequence(payload,model);model.floorZ=-sequence.height;
     report=await window.RohrPlanMachineCollision.analyze(sequence,model,time=>window.RohrPlanBendSequence.stateAt(sequence,time),{
      isCancelled:()=>id!==revision,
      onProgress:value=>{if(id===revision)el('machineCollisionSummary').textContent='Maschinenkontakte werden geprüft … '+Math.round(value*100)+' %';}
     });
     if(id!==revision||report.cancelled)return null;
     if(report.complete){cache.set(key,report);if(cache.size>8)cache.delete(cache.keys().next().value);}
    }
    if(id!==revision)return null;paint(report);return report;
   }catch(error){
    if(id!==revision)return null;const report={complete:false,events:[],reason:error.message};paint(report);return report;
   }
  });
  job={key,promise};return promise;
 }
 window.RohrPlanBendDataCollision={reset,run};
})();
