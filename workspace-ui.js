/* Navigation and read-only context; drawing and manufacturing logic remain in zeichenfeld.js. */
(()=>{
 'use strict';
 const el=id=>document.getElementById(id),app=document.querySelector('.app');
 const tabs=[...document.querySelectorAll('[data-ribbon]')];
 function selectRibbon(name){
  for(const tab of tabs){const selected=tab.dataset.ribbon===name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;el(tab.getAttribute('aria-controls')).hidden=!selected;}
 }
 for(const tab of tabs){
  tab.addEventListener('click',()=>selectRibbon(tab.dataset.ribbon));
  tab.addEventListener('keydown',event=>{let index=tabs.indexOf(tab);if(event.key==='ArrowRight')index=(index+1)%tabs.length;else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;event.preventDefault();tabs[index].focus();selectRibbon(tabs[index].dataset.ribbon);});
 }
 document.addEventListener('click',event=>{const proxy=event.target.closest('[data-action]');if(!proxy)return;const target=el(proxy.dataset.action);if(target&&!target.disabled)target.click();});
 const smallScreen=window.matchMedia('(max-width:700px)');
 function syncOverview(){el('toggleOverview').setAttribute('aria-expanded',String(smallScreen.matches?app.classList.contains('sidebar-open'):!app.classList.contains('sidebar-collapsed')));}
 el('toggleOverview').addEventListener('click',()=>{app.classList.toggle(smallScreen.matches?'sidebar-open':'sidebar-collapsed');syncOverview();});
 smallScreen.addEventListener('change',syncOverview);syncOverview();
 function syncDocument(){
  const name=el('currentIsometryName').value.trim()||'Unbenannte Isometrie';
  el('workspaceName').textContent=name;el('documentTitle').textContent=name;
  el('workspaceName').title=name;el('documentTitle').title=name;
  for(const tab of el('pipeTabs').querySelectorAll('[role=tab]'))tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;
 }
 el('currentIsometryName').addEventListener('input',syncDocument);
 new MutationObserver(syncDocument).observe(el('pipeTabs'),{childList:true,subtree:true});syncDocument();
 el('pipeTabs').addEventListener('keydown',event=>{const target=event.target.closest('[role=tab]');if(!target)return;const buttons=[...el('pipeTabs').querySelectorAll('[role=tab]')];let index=buttons.indexOf(target);if(event.key==='ArrowDown')index=(index+1)%buttons.length;else if(event.key==='ArrowUp')index=(index+buttons.length-1)%buttons.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=buttons.length-1;else return;event.preventDefault();buttons[index].click();el('pipeTabs').querySelector('[aria-selected=true]')?.focus();});
 function syncProject(){const text=el('projectCurrentStatus').textContent;const match=text.match(/^Geöffnetes Projekt: (.*?) · Ordner:/);el('overviewProjectName').textContent=match?match[1]:'Projekt auswählen';el('overviewProjectName').title=match?text:'Projektordner öffnen oder anlegen';}
 new MutationObserver(syncProject).observe(el('projectCurrentStatus'),{childList:true,subtree:true,characterData:true});syncProject();
 function syncSawLength(){el('overviewSawLength').textContent=el('sawLengthResult').textContent;}
 new MutationObserver(syncSawLength).observe(el('sawLengthResult'),{childList:true,subtree:true,characterData:true});syncSawLength();
 function syncMachine(){el('overviewMachineName').textContent=window.RohrPlanMachines.getActive().name;}
 window.RohrPlanMachines.subscribe(syncMachine);syncMachine();
 for(const id of ['modeText','sawLengthResult','cutAllowanceResult','bendDataFooterStatus']){const node=el(id);const sync=()=>{node.title=node.textContent;};new MutationObserver(sync).observe(node,{childList:true,subtree:true,characterData:true});sync();}
 el('startPipe').addEventListener('click',()=>selectRibbon('draw'));
})();
