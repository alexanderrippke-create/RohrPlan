(async()=>{
 const canvas=document.getElementById('view'),ctx=canvas.getContext('2d'),axisCanvas=document.getElementById('axisView'),actx=axisCanvas.getContext('2d'),el=id=>document.getElementById(id);
 const dirs=[{name:'X',v:[1,0,0],color:'#ed9a84'},{name:'X',v:[-1,0,0],color:'#ed9a84'},{name:'Y',v:[0,1,0],color:'#83c5bb'},{name:'Y',v:[0,-1,0],color:'#83c5bb'},{name:'Z',v:[0,0,1],color:'#c0e36b'},{name:'Z',v:[0,0,-1],color:'#c0e36b'}];
 let reverseBendOrder=false;
 let yaw=Math.PI/4,pitch=Math.atan(1/Math.sqrt(2)),scale=34,zoom=1,pan=[0,0],target=[0,0,0],points=[[0,0,0]],segments=[],stepMeshes=[],stepFileName='',occtPromise=null,previousDir=null,offsetPreviousDir=null,continuationDir=null,mouse=[0,0],hover=null,dragging=false,dragMode='rotate',lastDrag=[0,0],offsetStage=0,offsetDir=null,offsetSideDir=null,offsetAnchor=null,offsetRSteps=1,offsetHSteps=1,ghostDir=dirs[0],ghostEnd=[1,0,0],ghostSteps=1,dimensionMode=false,drawingPaused=true,dimensionInputs=[],cw=800,ch=500,dpr=1,activeProfile=null,profiles=[],pendingPipeChange=false,projectDirectoryHandle=null,projectRootHandle=null,rememberedProjectHandle=null,projectIndex=null,currentIsometryProjectKey=null,currentIsometryId=null,undoHistory=[],redoHistory=[],pendingCanvasClick=null;
 const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],add=(a,b)=>a.map((x,i)=>x+b[i]),mul=(a,k)=>a.map(x=>x*k),near=(a,b)=>a.every((x,i)=>Math.abs(x-b[i])<1e-6),mid=(a,b)=>a.map((x,i)=>(x+b[i])/2);
 const cloneSegmentList=(list=segments)=>JSON.parse(JSON.stringify(list));
 function validOffsetAngle(angle){return Number.isFinite(angle)&&angle>0&&angle<90}
 function offsetIncomingDirection(s){const previous=segments[segments.indexOf(s)-1];if(!previous)return s?.runDir?.v||[1,0,0];if(previous.kind==='pipe')return previous.dir;const delta=add(add(mul(previous.runDir.v,previous.R||previous.drawR),mul(previous.sideDir.v,previous.H||previous.drawH)),mul(previous.vertDir.v,previous.V||previous.drawV||0)),length=Math.hypot(...delta);return delta.map(x=>x/(length||1))}
 function calculateOffsetR(h,v,angle,s){
  if(!(h>0)||!Number.isFinite(h)||v==null||v<0||!Number.isFinite(v)||!validOffsetAngle(angle))return null;
  const incoming=s?offsetIncomingDirection(s):[1,0,0],run=s?.runDir?.v||[1,0,0],side=s?.sideDir?.v||[0,1,0],vertical=s?.vertDir?.v||[0,0,1],c=Math.cos(angle*Math.PI/180),base=dot(incoming,run)*h+dot(incoming,vertical)*v,b=dot(incoming,side),A=b*b-c*c,B=2*base*b,C=base*base-c*c*(h*h+v*v),discriminant=B*B-4*A*C;
  const roots=Math.abs(A)<1e-12?(Math.abs(B)>1e-12?[-C/B]:[]):discriminant>=0?[(-B+Math.sqrt(discriminant))/(2*A),(-B-Math.sqrt(discriminant))/(2*A)]:[];
  const result=roots.find(r=>r>0&&Number.isFinite(r)&&Math.abs((base+b*r)/Math.hypot(h,r,v)-c)<1e-7);return result==null?null:Math.round(result*10)/10
 }
 function applyFixedOffset(s){
  if(s.kind!=='offset')return;s.fixedAngleError=null;if(s.fixedAngle==null)return;
  if(!validOffsetAngle(Number(s.fixedAngle)))throw new Error('Der Offset-Winkel muss zwischen 0° und 90° liegen.');
  const threeD=s.drawV>0,complete=s.R>0&&Number.isFinite(s.R)&&(!threeD||s.V!=null&&s.V>=0&&Number.isFinite(s.V));
  s.H=complete?calculateOffsetR(s.R,threeD?s.V:0,Number(s.fixedAngle),s):null;
  if(complete&&s.H==null){s.fixedAngleError='H, V und der Winkel passen nicht zur ankommenden Rohrrichtung. Bitte Maße oder Winkel anpassen.';return}
  if(complete){s.drawH=s.drawR*s.H/s.R;if(threeD)s.drawV=s.drawR*s.V/s.R}
  else{const side=calculateOffsetR(s.drawR,s.drawV||0,Number(s.fixedAngle),s);if(side!=null)s.drawH=side}
 }
 function refreshHistoryControls(){el('undo').disabled=undoHistory.length===0;el('redo').disabled=redoHistory.length===0;el('openSegments').disabled=!segments.length||stepMeshes.length>0}
 function rememberHistory(){undoHistory.push(cloneSegmentList());if(undoHistory.length>80)undoHistory.shift();redoHistory=[];refreshHistoryControls()}
 function restoreHistoryState(source,target,freeDirections=false){if(!source.length)return;target.push(cloneSegmentList());segments=cloneSegmentList(source.pop());stepMeshes=[];stepFileName='';offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=offsetPreviousDir=null;dimensionMode=false;dimensionInputs=[];el('dimensionFields').replaceChildren();el('dimension').querySelector('.ribbon-label').textContent=drawingPaused?'Weiterzeichnen':'Bemaßen';hover=null;const last=segments.at(-1);previousDir=!freeDirections&&last?directionFromVector(last.kind==='pipe'?last.dir:(last.drawV?last.vertDir.v:last.sideDir.v)):null;continuationDir=null;recalc();updatePrompt();render();refreshHistoryControls()}
 function undoSegments(){if(dimensionMode){stopDimensioning(true);return}if(offsetStage){offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=offsetPreviousDir=null;previousDir=continuationDir=null;updatePrompt();render();return}restoreHistoryState(undoHistory,redoHistory,true)}
 function redoSegments(){restoreHistoryState(redoHistory,undoHistory)}

 function project(p){const q=p.map((x,i)=>x-target[i]),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),xx=(q[0]*cy-q[1]*sy)*scale*zoom,yy=(q[0]*sp*sy+q[1]*sp*cy-q[2]*cp)*scale*zoom;return[cw/2+pan[0]+xx,ch*.56+pan[1]+yy]}
 function basis(v){const a=project([0,0,0]),b=project(v);return[b[0]-a[0],b[1]-a[1]]}
 function finishViewDrag(){if(!dragging)return;dragging=false;if(dragMode==='rotate'){yaw=Math.PI/4;pitch=Math.atan(1/Math.sqrt(2));hover=null;render()}}
 function resizeTarget(){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),zs=points.map(p=>p[2]);target=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2,(Math.min(...zs)+Math.max(...zs))/2];const oldScale=scale,oldZoom=zoom,oldPan=pan;scale=1;zoom=1;pan=[0,0];const xy=points.map(p=>project(p).map((v,i)=>v-(i===0?cw/2:ch*.56))),w=Math.max(1,...xy.map(p=>p[0]))-Math.min(-1,...xy.map(p=>p[0])),h=Math.max(1,...xy.map(p=>p[1]))-Math.min(-1,...xy.map(p=>p[1]));scale=oldScale;zoom=oldZoom;pan=oldPan;scale=Math.max(segments.some(s=>s.fixedAngle!=null)?0.005:4,Math.min(70,(cw-180)/w,(ch-130)/h))}
 function fitImportedModel(){if(!stepMeshes.length)return null;let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const mesh of stepMeshes){const a=mesh.attributes?.position?.array||[];for(let i=0;i+2<a.length;i+=3)for(let axis=0;axis<3;axis++){lo[axis]=Math.min(lo[axis],a[i+axis]);hi[axis]=Math.max(hi[axis],a[i+axis])}}if(!Number.isFinite(lo[0]))return null;target=lo.map((v,i)=>(v+hi[i])/2);points=Array.from({length:8},(_,mask)=>target.map((_,i)=>mask&(1<<i)?hi[i]:lo[i]));zoom=1;pan=[0,0];scale=1;const projected=points.map(project),w=Math.max(1,...projected.map(p=>p[0]))-Math.min(...projected.map(p=>p[0])),h=Math.max(1,...projected.map(p=>p[1]))-Math.min(...projected.map(p=>p[1]));scale=Math.max(.005,Math.min(70,(cw-150)/w,(ch-120)/h));return hi.map((v,i)=>v-lo[i])}
 function recognizeStepTube(text){const entities=new Map();for(const m of text.matchAll(/#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(([\s\S]*?)\)\s*;/gi))entities.set(m[1],{type:m[2].toUpperCase(),body:m[3]});const refs=value=>[...value.matchAll(/#(\d+)/g)].map(m=>m[1]),triplet=value=>{const m=value.match(/\(([^)]*)\)/);if(!m)return null;const v=m[1].split(',').map(Number);return v.length===3&&v.every(Number.isFinite)?v:null},points=new Map(),directions=new Map(),placements=new Map(),circles=new Map(),surfaces=new Map();for(const[id,e]of entities){if(e.type==='CARTESIAN_POINT'){const v=triplet(e.body);if(v)points.set(id,v)}if(e.type==='DIRECTION'){const v=triplet(e.body);if(v)directions.set(id,v)}}for(const[id,e]of entities)if(e.type==='AXIS2_PLACEMENT_3D'){const r=refs(e.body),origin=points.get(r[0]),axis=directions.get(r[1]);if(origin&&axis)placements.set(id,{origin,axis})}for(const[id,e]of entities){if(e.type==='CIRCLE'){const r=refs(e.body),placement=placements.get(r[0]),radius=Number(e.body.match(/,\s*([-+\d.E]+)\s*$/)?.[1]);if(placement&&radius>0)circles.set(id,{center:placement.origin,radius})}if(e.type==='CYLINDRICAL_SURFACE'||e.type==='TOROIDAL_SURFACE'){const r=refs(e.body),frame=placements.get(r[0]),values=[...e.body.matchAll(/,\s*([-+\d.E]+)(?=\s*(?:,|$))/g)].map(m=>Number(m[1]));if(frame&&values.length)surfaces.set(id,{kind:e.type==='CYLINDRICAL_SURFACE'?'line':'arc',frame,radius:values[0],minor:values[1]})}}const bendRadii=[...surfaces.values()].filter(s=>s.kind==='arc').map(s=>s.radius),tubeRadii=[];for(const s of surfaces.values()){if(s.kind==='line')tubeRadii.push(s.radius);else if(s.minor>0)tubeRadii.push(s.minor)}const outer=Math.max(...tubeRadii),inner=Math.min(...tubeRadii.filter(r=>r<outer-.01));if(!(bendRadii.length&&outer>inner&&inner>0))return null;const bounds=new Map(),orientedEdges=new Map(),edgeCurves=new Map(),loops=new Map(),faceBounds=new Map(),faces=[];for(const[id,e]of entities){const r=refs(e.body);if(e.type==='ORIENTED_EDGE'&&r.length)orientedEdges.set(id,r.at(-1));else if(e.type==='EDGE_CURVE'&&r.length>=3)edgeCurves.set(id,r.at(-1));else if(e.type==='EDGE_LOOP')loops.set(id,r);else if(e.type==='FACE_BOUND'||e.type==='FACE_OUTER_BOUND')faceBounds.set(id,r.at(0));else if(e.type==='ADVANCED_FACE'){const m=e.body.match(/,\s*\(([^)]*)\)\s*,\s*#(\d+)\s*,/s);if(m)faces.push({bounds:refs(m[1]),surface:m[2]})}}const nodes=[],features=[],snap=Math.max(.15,outer*.01),nodeFor=p=>{let i=nodes.findIndex(q=>Math.hypot(...q.map((v,k)=>v-p[k]))<=snap);if(i<0){i=nodes.length;nodes.push(p)}return i};for(const face of faces){const surface=surfaces.get(face.surface);if(!surface)continue;const circleCenters=[];for(const bound of face.bounds){const loop=faceBounds.get(bound);for(const oriented of loop?loops.get(loop)||[]:[]){const edge=edgeCurves.get(orientedEdges.get(oriented));const circle=edge&&circles.get(edge);if(circle&&(Math.abs(circle.radius-outer)<=snap||Math.abs(circle.radius-inner)<=snap)&&!circleCenters.some(p=>Math.hypot(...p.map((v,k)=>v-circle.center[k]))<=snap))circleCenters.push(circle.center)}}if(circleCenters.length!==2)continue;const a=nodeFor(circleCenters[0]),b=nodeFor(circleCenters[1]);if(a===b)continue;const delta=nodes[b].map((v,i)=>v-nodes[a][i]),length=Math.hypot(...delta)||1;if(surface.kind==='line'){if(Math.abs(dot(delta.map(v=>v/length),surface.frame.axis))<.98)continue}else{const radialA=nodes[a].map((v,i)=>v-surface.frame.origin[i]),radialB=nodes[b].map((v,i)=>v-surface.frame.origin[i]),radialLenA=Math.hypot(...radialA),radialLenB=Math.hypot(...radialB);if(Math.abs(radialLenA-surface.radius)>snap*2||Math.abs(radialLenB-surface.radius)>snap*2)continue}const key=[surface.kind,Math.min(a,b),Math.max(a,b),surface.kind==='arc'?surface.radius.toFixed(2):''].join(':');if(!features.some(f=>f.key===key))features.push({key,a,b,kind:surface.kind,center:surface.frame.origin,axis:surface.frame.axis,radius:surface.radius})}if(features.length<3)return null;const adjacent=Array.from({length:nodes.length},()=>[]);features.forEach((f,i)=>{adjacent[f.a].push(i);adjacent[f.b].push(i)});const ends=adjacent.map((edges,node)=>edges.length===1?node:-1).filter(node=>node>=0);if(ends.length!==2||adjacent.some(edges=>edges.length>2||edges.length===0))return null;let node=ends[0],previous=-1,ordered=[],visited=new Set();while(true){const edgeIndex=adjacent[node].find(i=>i!==previous&&!visited.has(i));if(edgeIndex===undefined)break;visited.add(edgeIndex);const feature=features[edgeIndex],next=feature.a===node?feature.b:feature.a;ordered.push({...feature,from:node,to:next});previous=edgeIndex;node=next}if(visited.size!==features.length||node!==ends[1])return null;const compressed=[];for(const edge of ordered){const last=compressed.at(-1);if(last&&last.kind===edge.kind&&last.to===edge.from&&(edge.kind==='line'?Math.abs(dot(nodes[last.to].map((v,i)=>v-nodes[last.from][i]).map(v=>v/(Math.hypot(...nodes[last.to].map((x,i)=>x-nodes[last.from][i]))||1)),edge.axis))>.98:Math.hypot(...last.center.map((v,i)=>v-edge.center[i]))<snap&&Math.abs(last.radius-edge.radius)<snap)){last.to=edge.to}else compressed.push(edge)}if(compressed.length<3)return null;const control=[nodes[compressed[0].from]],bends=[];for(let i=0;i<compressed.length;i++){const edge=compressed[i];if(edge.kind!=='arc')continue;const prev=compressed[i-1],next=compressed[i+1];if(!prev||!next||prev.kind!=='line'||next.kind!=='line')return null;const start=nodes[edge.from],end=nodes[edge.to],u=start.map((v,k)=>v-edge.center[k]),v=end.map((x,k)=>x-edge.center[k]),uLen=Math.hypot(...u)||1,vLen=Math.hypot(...v)||1,axisLen=Math.hypot(...edge.axis)||1,uN=u.map(x=>x/uLen),vN=v.map(x=>x/vLen),axis=edge.axis.map(x=>x/axisLen),signed=Math.atan2(dot(axis,cross(uN,vN)),dot(uN,vN)),angle=Math.abs(signed);if(angle<.01||angle>Math.PI-.01)return null;const tangentStart=mul(cross(axis,uN),Math.sign(signed)),tangentEnd=mul(cross(axis,vN),Math.sign(signed)),inDir=nodes[edge.from].map((_,k)=>nodes[edge.from][k]-nodes[prev.from][k]),inLen=Math.hypot(...inDir)||1,outDir=nodes[next.to].map((_,k)=>nodes[next.to][k]-nodes[edge.to][k]),outLen=Math.hypot(...outDir)||1,tangentDistance=edge.radius*Math.tan(angle/2),cornerA=start.map((x,k)=>x+tangentStart[k]*tangentDistance),cornerB=end.map((x,k)=>x-tangentEnd[k]*tangentDistance);if(dot(tangentStart,inDir.map(x=>x/inLen))<.9||dot(tangentEnd,outDir.map(x=>x/outLen))<.9||Math.hypot(...cornerA.map((x,k)=>x-cornerB[k]))>Math.max(1,snap*4))return null;const corner=cornerA.map((x,k)=>(x+cornerB[k])/2);control.push(corner);bends.push({cornerIndex:control.length-2,radius:edge.radius})}control.push(nodes[compressed.at(-1).to]);if(!bends.length)return null;const route=control.slice(1).map((p,i)=>{const delta=p.map((v,k)=>v-control[i][k]),length=Math.hypot(...delta);return{dir:delta.map(v=>v/(length||1)),length}});for(const bend of bends)if(bend.cornerIndex+1<route.length)route[bend.cornerIndex+1].bendRadius=bend.radius;const distinctR=bendRadii.filter(r=>r>0).sort((a,b)=>a-b),radius=distinctR[Math.floor(distinctR.length/2)];return{diameter:outer*2,wall:outer-inner,radius,route,bends}}
 function recognizeStepU(text,meshes){const pointsById=new Map(),directions=new Map(),placements=new Map(),torus=[],radii=[];for(const m of text.matchAll(/#(\d+)\s*=\s*CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(([^)]*)\)\s*\)\s*;/gi)){const p=m[2].split(',').map(Number);if(p.length===3&&p.every(Number.isFinite))pointsById.set(m[1],p)}for(const m of text.matchAll(/#(\d+)\s*=\s*DIRECTION\s*\(\s*'[^']*'\s*,\s*\(([^)]*)\)\s*\)\s*;/gi)){const v=m[2].split(',').map(Number);if(v.length===3&&v.every(Number.isFinite))directions.set(m[1],v)}for(const m of text.matchAll(/#(\d+)\s*=\s*AXIS2_PLACEMENT_3D\s*\(\s*'[^']*'\s*,\s*#(\d+)\s*,\s*#(\d+)\s*,\s*#(\d+)\s*\)\s*;/gi)){const origin=pointsById.get(m[2]),axis=directions.get(m[3]);if(origin&&axis)placements.set(m[1],{origin,axis})}for(const m of text.matchAll(/#\d+\s*=\s*TOROIDAL_SURFACE\s*\(\s*'[^']*'\s*,\s*#(\d+)\s*,\s*([-+\d.E]+)\s*,\s*([-+\d.E]+)\s*\)\s*;/gi)){const frame=placements.get(m[1]),major=Number(m[2]),minor=Number(m[3]);if(frame&&major>0&&minor>0){torus.push({...frame,major,minor});radii.push(minor)}}for(const m of text.matchAll(/#\d+\s*=\s*CYLINDRICAL_SURFACE\s*\(\s*'[^']*'\s*,\s*#(\d+)\s*,\s*([-+\d.E]+)\s*\)\s*;/gi)){const r=Number(m[2]);if(placements.has(m[1])&&r>0)radii.push(r)}if(!torus.length||!radii.length)return null;const unique=[];for(const t of torus)if(!unique.some(u=>Math.hypot(...u.origin.map((v,i)=>v-t.origin[i]))<.01&&Math.abs(u.major-t.major)<.01))unique.push(t);if(unique.length!==2||Math.abs(unique[0].major-unique[1].major)>.01)return null;const axis=unique[0].axis.map((v,i)=>v+unique[1].axis[i]),axisLength=Math.hypot(...axis)||1;if(Math.abs(axis[2]/axisLength)<.999)return null;const outer=Math.max(...radii),inner=Math.min(...radii.filter(r=>r<outer-.01)),bendRadius=unique[0].major;if(!(inner>0&&outer>inner&&bendRadius>0))return null;let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const mesh of meshes){const a=mesh.attributes?.position?.array||[];for(let i=0;i+2<a.length;i+=3)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],a[i+k]);hi[k]=Math.max(hi[k],a[i+k])}}const halfWallRadius=outer,x0=lo[0]+halfWallRadius,x1=hi[0]-halfWallRadius,y0=lo[1]+halfWallRadius,y1=hi[1]-halfWallRadius,tol=Math.max(3,outer*.25),centers=unique.map(t=>t.origin).sort((a,b)=>a[0]-b[0]);if(!centers.every(c=>Math.abs(c[2]-(lo[2]+hi[2])/2)<tol)||Math.abs(centers[0][0]-(x0+bendRadius))>tol||Math.abs(centers[1][0]-(x1-bendRadius))>tol||Math.abs(centers[0][1]-(y1-bendRadius))>tol||Math.abs(centers[1][1]-(y1-bendRadius))>tol||x1<=x0||y1<=y0||bendRadius*2>=Math.min(x1-x0,y1-y0))return null;return{diameter:2*outer,wall:outer-inner,radius:bendRadius,route:[{dir:[0,1,0],length:y1-y0},{dir:[1,0,0],length:x1-x0},{dir:[0,-1,0],length:y1-y0}],bends:[{cornerIndex:0,radius:bendRadius},{cornerIndex:1,radius:bendRadius}]}}
 let gridVisible=true;
 function resize(){const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;dpr=window.devicePixelRatio||1;cw=r.width;ch=r.height;canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const ar=axisCanvas.getBoundingClientRect();axisCanvas.width=Math.round(ar.width*dpr);axisCanvas.height=Math.round(ar.height*dpr);actx.setTransform(dpr,0,0,dpr,0,0);if(stepMeshes.length)fitImportedModel();render()}
 function allowedDirs(){if(offsetStage===1&&offsetDir)return dirs.filter(d=>dot(d.v,offsetDir.v)===0);if(offsetStage===2&&offsetDir&&offsetSideDir){const out=dirs.filter(d=>dot(d.v,offsetSideDir.v)===0);if(offsetPreviousDir)for(const d of dirs)if(Math.abs(dot(d.v,offsetPreviousDir.v))===1&&!out.includes(d))out.push(d);return out}if(!offsetStage&&segments.at(-1)?.kind==='offset'&&segments.at(-1).drawV>0)return dirs;if(!offsetStage&&previousDir){const out=dirs.filter(d=>dot(d.v,previousDir.v)===0||near(d.v,previousDir.v));if(continuationDir)for(const d of dirs)if(Math.abs(dot(d.v,continuationDir.v))===1&&!out.includes(d))out.push(d);return out}return dirs}
 function chooseDirection(dx,dy,choices=allowedDirs()){const mag=Math.hypot(dx,dy);if(!choices.length)return dirs[0];let best=choices[0],score=-Infinity;for(const d of choices){const [vx,vy]=basis(d.v),m=Math.hypot(vx,vy)||1,s=mag<2?0:(dx*vx+dy*vy)/(mag*m);if(s>score){score=s;best=d}}return best}
 function previewOrigin(){if(offsetStage===1)return add(offsetAnchor,mul(offsetDir.v,offsetRSteps));if(offsetStage===2)return add(add(offsetAnchor,mul(offsetDir.v,offsetRSteps)),mul(offsetSideDir.v,offsetHSteps));return points.at(-1)}
 function moveEnd(pos,thirdAxisOnly=false){mouse=pos;const o=project(previewOrigin()),dx=pos[0]-o[0],dy=pos[1]-o[1],choices=thirdAxisOnly&&offsetStage===2?dirs.filter(d=>dot(d.v,offsetDir.v)===0&&dot(d.v,offsetSideDir.v)===0):allowedDirs();ghostDir=chooseDirection(dx,dy,choices);const [vx,vy]=basis(ghostDir.v),vl=Math.hypot(vx,vy)||1;ghostSteps=Math.max(1,Math.min(30,Math.round((dx*vx+dy*vy)/(vl*vl))));ghostEnd=add(previewOrigin(),mul(ghostDir.v,ghostSteps));hover=pos;el('coordText').textContent=ghostEnd.map(v=>Math.round(v*10)/10).join(' · ');render()}
 function gridRange(){return Math.min(22,Math.max(7,...points.flatMap(p=>p.map(Math.abs)))+3)}
 function line(a,b,color,width=1,dash=[]){const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
 function renderGrid(){const n=gridRange(),start=-Math.floor(n/2)*2,c=target.map(Math.round),seen=new Set();ctx.save();for(let plane=0;plane<3;plane++)for(let a=start;a<=n;a+=2)for(let b=start;b<=n;b+=2){const p=plane===0?[c[0]+a,c[1]+b,c[2]]:plane===1?[c[0]+a,c[1],c[2]+b]:[c[0],c[1]+a,c[2]+b],[x,y]=project(p),key=`${Math.round(x)}:${Math.round(y)}`;if(seen.has(key)||x<0||x>cw||y<0||y>ch)continue;seen.add(key);ctx.fillStyle='rgba(142,170,192,.24)';ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill()}ctx.restore()}
 function renderAxes(){for(const d of dirs.filter(x=>x.v.some(v=>v>0))){line([0,0,0],mul(d.v,4),'#607268',1);const p=project(mul(d.v,4.5));ctx.fillStyle=d.color;ctx.font='11px Segoe UI';ctx.fillText(d.name,p[0],p[1])}}
 function drawImportedStep(){const camera=[Math.sin(yaw)*Math.cos(pitch),Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch)],light=[.35,-.45,.82],lightLen=Math.hypot(...light),triangles=[];for(const mesh of stepMeshes){const raw=mesh.attributes?.position?.array||[],vertices=Array.from({length:Math.floor(raw.length/3)},(_,i)=>{const p=[raw[i*3],raw[i*3+1],raw[i*3+2]];return{p,screen:project(p),depth:dot(p.map((v,k)=>v-target[k]),camera)}}),indices=mesh.index?.array||Array.from({length:vertices.length},(_,i)=>i),flat=Array.isArray(indices[0])?indices.flat():indices,base=Array.isArray(mesh.color)&&mesh.color.length>=3?mesh.color.slice(0,3).map(v=>Math.round(Math.max(0,Math.min(1,v))*255)):[111,190,157];for(let i=0;i+2<flat.length;i+=3){const a=vertices[flat[i]],b=vertices[flat[i+1]],c=vertices[flat[i+2]];if(!a||!b||!c)continue;const n=cross(b.p.map((v,k)=>v-a.p[k]),c.p.map((v,k)=>v-a.p[k])),nl=Math.hypot(...n)||1,diff=Math.max(0,dot(n.map(v=>v/nl),light.map(v=>v/lightLen))),shade=.4+.6*diff;triangles.push({a:a.screen,b:b.screen,c:c.screen,depth:(a.depth+b.depth+c.depth)/3,color:`rgb(${base.map(v=>Math.round(v*shade)).join(',')})`})}}triangles.sort((a,b)=>a.depth-b.depth);for(const t of triangles){ctx.beginPath();ctx.moveTo(...t.a);ctx.lineTo(...t.b);ctx.lineTo(...t.c);ctx.closePath();ctx.fillStyle=t.color;ctx.fill();ctx.strokeStyle='rgba(8,18,14,.28)';ctx.lineWidth=.35;ctx.stroke()}}
 function renderAxisWidget(){const r=axisCanvas.getBoundingClientRect(),w=r.width,h=r.height;actx.clearRect(0,0,w,h);actx.fillStyle='#303945e6';actx.strokeStyle='#566474';actx.beginPath();actx.roundRect(1,1,w-2,h-2,7);actx.fill();actx.stroke();const c=[w*.5,h*.51],len=Math.min(w,h)*.27;for(const d of dirs.filter(x=>x.v.some(v=>v>0))){const [bx,by]=basis(d.v),m=Math.hypot(bx,by)||1,x=c[0]+bx/m*len,y=c[1]+by/m*len;actx.beginPath();actx.moveTo(...c);actx.lineTo(x,y);actx.strokeStyle=d.color;actx.lineWidth=2;actx.stroke();actx.fillStyle=d.color;actx.beginPath();actx.arc(x,y,3,0,Math.PI*2);actx.fill();actx.font='9px Segoe UI';actx.fillText(d.name,x+4,y-3)}}
 function label(p,t,color){const [x,y]=project(p);ctx.font='700 13px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle='#000000';ctx.strokeText(t,x,y);ctx.fillStyle=color;ctx.fillText(t,x,y);ctx.textAlign='start';ctx.textBaseline='alphabetic'}
 function drawOffset(s){const R=s.drawR,H=s.drawH,V=s.drawV,rp=add(s.anchor,mul(s.runDir.v,R)),sp=add(rp,mul(s.sideDir.v,H)),end=add(sp,mul(s.vertDir.v,V));s.runPoint=rp;s.sidePoint=sp;s.to=end;line(s.anchor,rp,'#f06b27',3);line(rp,end,'#e52c2b',3);line(rp,sp,'#168dce',2,[5,4]);if(V)line(sp,end,'#23a45a',2,[5,4]);line(s.anchor,end,'#eb4f9a',5);label(mid(s.anchor,rp),s.R?`H ${Number(s.R.toFixed(2))} mm` :'H','#ff762e');label(mid(rp,sp),s.H?`R ${s.H} mm` :'R','#41b7fa');if(s.fixedAngle!=null&&!(s.R&&s.H&&(V===0||s.V)))label(end,s.fixedAngle+'°','#ff86c1');if(V)label(mid(sp,end),s.V?`V ${s.V} mm`:'V','#51dc82');if(s.R&&s.H&&(V===0||s.V)){const dh=s.H,dv=s.V||0,C=Math.hypot(dh,dv),angle=Math.acos(Math.max(-1,Math.min(1,dot(offsetIncomingDirection(s),add(add(mul(s.runDir.v,s.R),mul(s.sideDir.v,dh)),mul(s.vertDir.v,dv)))/Math.hypot(s.R,dh,dv))))*180/Math.PI,T=Math.hypot(s.R,C);if(V)label(mid(rp,end),`C ${C.toFixed(1)} mm`,'#ff4540');label(mid(s.anchor,end),`T ${T.toFixed(1)} mm`,'#ff86c1');label(end,`${angle.toFixed(1)}°`,'#ff86c1')}const lo=s.anchor.map((v,i)=>Math.min(v,end[i])),hi=s.anchor.map((v,i)=>Math.max(v,end[i]));for(let mask=0;mask<8;mask++)for(let axis=0;axis<3;axis++)if(!(mask&(1<<axis))){const a=lo.map((v,i)=>mask&(1<<i)?hi[i]:v),b=[...a];b[axis]=hi[axis];if(a.some((v,i)=>Math.abs(v-b[i])>1e-8))line(a,b,'#72859b',1,[3,5])}}
 function render(){if(!ctx||!cw)return;schedulePipeTabSave();ctx.clearRect(0,0,cw,ch);ctx.fillStyle='#252c36';ctx.fillRect(0,0,cw,ch);if(stepMeshes.length)drawImportedStep();else{if(gridVisible)renderGrid();renderAxes();for(const s of segments){if(s.kind==='offset'){drawOffset(s);continue}line(s.from,s.to,'#c0e36b',5);if(s.length)label(mid(s.from,s.to),`${s.length} mm`,'#e1f5b2');const p=project(s.to);ctx.beginPath();ctx.arc(...p,4,0,Math.PI*2);ctx.fillStyle='#d9f59a';ctx.fill()}if(hover&&!dimensionMode&&!drawingPaused){if(offsetStage===1)line(offsetAnchor,previewOrigin(),'#c0e36b',4);if(offsetStage===2){const rp=add(offsetAnchor,mul(offsetDir.v,offsetRSteps));line(offsetAnchor,rp,'#c0e36b',4);line(rp,previewOrigin(),'#c0e36b',4)}line(previewOrigin(),ghostEnd,offsetStage?'#83c5bb':'#dff5a9',3,[7,5]);const e=project(ghostEnd);ctx.beginPath();ctx.arc(e[0],e[1],5,0,Math.PI*2);ctx.fillStyle='#e5f8b9';ctx.fill()}const p0=project(points[0]);ctx.beginPath();ctx.arc(p0[0],p0[1],5,0,Math.PI*2);ctx.fillStyle='#f0f4ef';ctx.fill()}renderAxisWidget();if(dimensionMode)positionDimensionInputs()}
 function recalc(){stepMeshes=[];stepFileName='';el('dimension').disabled=false;let p=[0,0,0];points=[p];for(const s of segments){if(s.kind==='pipe'){s.from=[...p];s.to=add(p,mul(s.dir,s.drawLength));p=[...s.to]}else{applyFixedOffset(s);s.anchor=[...p];s.runPoint=add(p,mul(s.runDir.v,s.drawR));s.sidePoint=add(s.runPoint,mul(s.sideDir.v,s.drawH));s.to=add(s.sidePoint,mul(s.vertDir.v,s.drawV));s.from=[...p];p=[...s.to]}points.push([...p])}resizeTarget();updateSawLength();updateBendPositions();updateProjectControls();refreshHistoryControls()}
 function finishOffset(threeD){const s={kind:'offset',runDir:offsetDir,sideDir:offsetSideDir,vertDir:threeD?ghostDir:{v:[0,0,0]},drawR:offsetRSteps,drawH:offsetHSteps,drawV:threeD?ghostSteps:0,R:null,H:null,V:threeD?null:0,fixedAngle:null};rememberHistory();segments.push(s);continuationDir=threeD?null:offsetPreviousDir;previousDir=threeD?ghostDir:offsetSideDir;offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=offsetPreviousDir=null;recalc();updatePrompt();render()}
 function commit(kind){if(dimensionMode||drawingPaused||!activeProfile)return;if(!hover){const r=canvas.getBoundingClientRect();moveEnd([r.width*.64,r.height*.5])}if(kind==='pipe'){if(offsetStage){if(offsetStage===1){offsetSideDir=ghostDir;offsetHSteps=ghostSteps}finishOffset(false);if(hover)moveEnd(hover);return}if(hover)moveEnd(hover);if(near(points.at(-1),ghostEnd))return;rememberHistory();const last=segments.at(-1);if(last?.kind==='pipe'&&near(last.dir,ghostDir.v)){last.drawLength+=ghostSteps;last.length=null}else segments.push({kind:'pipe',dir:[...ghostDir.v],drawLength:ghostSteps,length:null});previousDir=ghostDir;continuationDir=null;recalc();updatePrompt();if(hover)moveEnd(hover);return}if(offsetStage===0){offsetAnchor=[...points.at(-1)];offsetPreviousDir=previousDir;offsetDir=ghostDir;offsetRSteps=ghostSteps;offsetStage=1;updatePrompt();render();return}if(offsetStage===1){offsetSideDir=ghostDir;offsetHSteps=ghostSteps;offsetStage=2;updatePrompt();render();return}finishOffset(true);if(hover)moveEnd(hover)}
 function editorField(labelText,input){const label=document.createElement('label');label.className='segment-edit-field';label.textContent=labelText;label.append(input);return label}
 function editorNumber(value,placeholder='',min='0.1'){const input=document.createElement('input');input.type='number';input.step='any';input.min=min;input.placeholder=placeholder;input.value=value??'';return input}
 function editorDirection(labelText,vector,optional=false){const label=document.createElement('label');label.className='segment-edit-field';label.textContent=labelText;const select=document.createElement('select');if(optional)select.add(new Option('Nicht verwendet',''));dirs.forEach((direction,index)=>{const axis=direction.v.findIndex(value=>value!==0),sign=direction.v[axis]>0?'+':'−';select.add(new Option(sign+'XYZ'[axis],String(index)))});const found=dirs.findIndex(direction=>vector&&near(direction.v,vector));select.value=found>=0?String(found):optional?'':'';label.append(select);return{label,select}}
 function renderSegmentEditor(){
  const list=el('segmentEditorList');list.replaceChildren();
  segments.forEach((segment,index)=>{
   const card=document.createElement('article');card.className='segment-edit-card';
   const heading=document.createElement('strong');heading.className='segment-edit-heading';heading.textContent='Strecke '+(index+1)+' · '+(segment.kind==='pipe'?'Gerade':'Offset');card.append(heading);
   const grid=document.createElement('div');grid.className='segment-edit-grid';
   const inputs={},selects={};let angleValue=null;
   const numberValue=input=>input.value.trim()===''?null:Number(input.value);
   const chosenAngle=()=>numberValue(angleValue);
   if(segment.kind==='pipe'){
    inputs.length=editorNumber(segment.length,'noch nicht bemaßt');grid.append(editorField('Länge · mm',inputs.length));
    const direction=editorDirection('Richtung',segment.dir);selects.dir=direction.select;grid.append(direction.label)
   }else{
    angleValue=editorNumber(segment.fixedAngle,'leer = freie Maße','0');angleValue.max='90';
    const angleField=editorField('Winkel · ° · optional',angleValue);grid.append(angleField);
    for(const key of ['R','H','V'])inputs[key]=editorNumber(segment[key],key==='V'?'optional':'noch nicht bemaßt',key==='V'?'0':'0.1');
    const rField=editorField('R · mm',inputs.H);grid.append(editorField('H · mm',inputs.R),rField,editorField('V · mm',inputs.V));
    for(const [key,labelText,vector]of [['runDir','Richtung H',segment.runDir?.v],['sideDir','Richtung R',segment.sideDir?.v],['vertDir','Richtung V',segment.vertDir?.v]]){
     const direction=editorDirection(labelText,vector,key==='vertDir');selects[key]=direction.select;grid.append(direction.label)
    }
    const updateDerived=()=>{
     const angle=chosenAngle(),fixed=angle!=null;inputs.H.readOnly=fixed;inputs.H.classList.toggle('derived-dimension',fixed);
     rField.firstChild.textContent=fixed?'R · mm · berechnet':'R · mm';
     if(fixed){const h=numberValue(inputs.R),v=numberValue(inputs.V),requiresV=segment.drawV>0&&v!==0||v>0,result=calculateOffsetR(h,requiresV?v:0,angle,segment);inputs.H.value=result==null?'':Number(result.toFixed(3))}
    };
    angleValue.addEventListener('input',updateDerived);inputs.R.addEventListener('input',updateDerived);inputs.V.addEventListener('input',updateDerived);updateDerived()
   }
   card.append(grid);
   const footer=document.createElement('div');footer.className='segment-edit-footer';
   const error=document.createElement('span');error.className='segment-edit-error';
   const save=document.createElement('button');save.type='button';save.className='button primary';save.textContent='Änderung übernehmen';
   save.onclick=()=>{
    error.textContent='';
    if(segment.kind==='pipe'){
     const length=numberValue(inputs.length);if(length!==null&&(!(length>0)||!Number.isFinite(length))){error.textContent='Länge muss größer als 0 sein.';return}
     rememberHistory();if(length!==null)segment.length=length;segment.dir=[...dirs[Number(selects.dir.value)].v]
    }else{
     const fixedAngle=chosenAngle();if(fixedAngle!=null&&!validOffsetAngle(fixedAngle)){error.textContent='Der Winkel muss größer als 0° und kleiner als 90° sein.';return}
     const values=Object.fromEntries(['R','H','V'].map(key=>[key,numberValue(inputs[key])]));
     if(['R','H'].some(key=>values[key]!==null&&(!(values[key]>0)||!Number.isFinite(values[key])))||values.V!==null&&(!(values.V>=0)||!Number.isFinite(values.V))){error.textContent='R und H müssen positiv, V darf 0 sein.';return}
     if(fixedAngle!=null&&values.R>0&&values.V!=null&&calculateOffsetR(values.R,values.V,fixedAngle,segment)==null){error.textContent='V ist für H und diesen Winkel zu groß.';return}const run=dirs[Number(selects.runDir.value)],side=dirs[Number(selects.sideDir.value)],vert=selects.vertDir.value===''?null:dirs[Number(selects.vertDir.value)],requiresV=values.V>0||segment.drawV>0&&values.V!==0;
     if(!run||!side||Math.abs(dot(run.v,side.v))>.001||requiresV&&(!vert||Math.abs(dot(run.v,vert.v))>.001||Math.abs(dot(side.v,vert.v))>.001)){error.textContent='Die Offset-Richtungen müssen senkrecht zueinander stehen.';return}
     rememberHistory();segment.fixedAngle=fixedAngle;
     if(values.R!==null)segment.R=values.R;if(values.H!==null)segment.H=values.H;if(values.V!==null)segment.V=values.V;
     segment.runDir=run;segment.sideDir=side;if(vert)segment.vertDir=vert;
     if(values.V===0){segment.V=0;segment.drawV=0}else if(values.V>0&&!segment.drawV)segment.drawV=1
    }
    const last=segments.at(-1);previousDir=last?directionFromVector(last.kind==='pipe'?last.dir:(last.drawV?last.vertDir.v:last.sideDir.v)):null;continuationDir=null;recalc();updatePrompt();render();renderSegmentEditor()
   };
   footer.append(error,save);card.append(footer);list.append(card)
  });
  if(!segments.length){const empty=document.createElement('p');empty.className='dialog-note';empty.textContent='Noch keine Strecken vorhanden.';list.append(empty)}
 }
 function dimensionItems(){const out=[];segments.forEach((s,i)=>{if(s.kind==='pipe')out.push({s,key:'length',label:'L'+(i+1),a:s.from,b:s.to});else{out.push({s,key:'fixedAngle',label:'Winkel · optional',angle:true,a:s.to,b:s.to},{s,key:'R',label:'H',a:s.anchor,b:s.runPoint},{s,key:'H',label:s.fixedAngle!=null?'R · berechnet':'R',readOnly:s.fixedAngle!=null,a:s.runPoint,b:s.sidePoint});if(s.drawV)out.push({s,key:'V',label:'V',a:s.sidePoint,b:s.to})}});return out}
 function findDimensionItemAt(pos,limit=30){let best=null,distance=limit;for(const item of dimensionItems()){if(!(Number(item.s[item.key])>0))continue;const p=project(mid(item.a,item.b)),d=Math.hypot(pos[0]-p[0],pos[1]-p[1]);if(d<distance){best=item;distance=d}}return best}
 function editDimensionAt(pos){
  if(!activeProfile||dimensionMode||stepMeshes.length)return false;const item=findDimensionItemAt(pos);if(!item||item.readOnly)return false;
  const input=document.createElement('input');input.className='dim-field';input.type='number';input.min=item.angle?'0':'0.1';if(item.angle)input.max='90';input.step='any';input.value=item.s[item.key];
  input.setAttribute('aria-label',item.label+(item.angle?' in Grad bearbeiten':' in Millimeter bearbeiten'));
  const p=project(mid(item.a,item.b));input.style.left=p[0]+'px';input.style.top=p[1]+'px';el('dimensionFields').append(input);input.focus();input.select();
  let finished=false;const finish=save=>{
   if(finished)return false;
   if(save){const value=item.angle&&input.value.trim()===''?null:Number(input.value),valid=item.angle?value==null||validOffsetAngle(value):value>0&&Number.isFinite(value);
    if(!valid){input.setCustomValidity(item.angle?'Winkel muss zwischen 0° und 90° liegen.':'Bitte ein positives Maß eingeben.');input.reportValidity();input.focus();return false}
    if(value!==item.s[item.key]){rememberHistory();item.s[item.key]=value;recalc();updatePrompt();render()}
   }finished=true;input.remove();return true
  };
  input.addEventListener('keydown',event=>{
   if(event.key==='Enter'||event.key==='Tab'){event.preventDefault();if(!finish(true))return;const items=dimensionItems(),index=items.findIndex(candidate=>candidate.s===item.s&&candidate.key===item.key),next=items.slice(index+1).find(candidate=>!candidate.readOnly&&Number(candidate.s[candidate.key])>0);if(next)requestAnimationFrame(()=>editDimensionAt(project(mid(next.a,next.b))))}
   else if(event.key==='Escape'){event.preventDefault();finish(false)}
  });
  input.addEventListener('input',()=>input.setCustomValidity(''));input.addEventListener('blur',()=>finish(false));return true
 }
 function positionDimensionInputs(){
  if(!dimensionMode)return;
  dimensionItems().forEach((item,i)=>{
   const input=dimensionInputs[i];if(!input)return;const p=project(mid(item.a,item.b)),wasReadOnly=input.readOnly;
   input.style.left=p[0]+'px';input.style.top=(p[1]+(item.angle?28:0))+'px';input.readOnly=!!item.readOnly;input.tabIndex=item.readOnly?-1:0;
   input.classList.toggle('derived-dimension',!!item.readOnly);input.placeholder=item.label+(item.angle?' · °':' · mm');
   input.title=item.s.fixedAngleError|| (item.angle?'Optional: Biegewinkel zur ankommenden Rohrrichtung. Leer lassen für freie Maße.':item.readOnly?'R wird aus H, V und dem Winkel berechnet.':'');
   if(item.readOnly||wasReadOnly&&!input.readOnly)input.value=item.s[item.key]==null?'':Number(item.s[item.key].toFixed(3))
  })
 }
 function startDimensioning(){
  if(!activeProfile){showProfileDialog();return}
  if(offsetStage===2)finishOffset(false);else if(offsetStage===1){offsetStage=0;offsetDir=offsetAnchor=null}
  drawingPaused=false;dimensionMode=true;hover=null;el('toolMode').textContent='BEMAẞEN';el('dimension').querySelector('.ribbon-label').textContent='Zeichnen';el('prompt').innerHTML='<b>Maße eingeben</b> · Optionalen Winkel am Offset eintragen: R wird aus H und V berechnet. Winkel leer lassen für freie Maße. Enter bestätigt.';
  const box=el('dimensionFields');box.replaceChildren();
  dimensionInputs=dimensionItems().map((item,i)=>{
   const input=document.createElement('input');input.className='dim-field';input.type='number';input.min=item.angle?'0':'0.1';if(item.angle)input.max='90';input.step='any';input.value=item.s[item.key]??'';input.readOnly=!!item.readOnly;
   input.setAttribute('aria-label',item.label+(item.angle?' in Grad':' in Millimeter'));
   input.addEventListener('keydown',e=>{
    if(input.readOnly)return;
    if(e.key==='Enter'||e.key==='Tab'){
     e.preventDefault();const value=item.angle&&input.value.trim()===''?null:Number(input.value),valid=item.angle?value==null||validOffsetAngle(value):value>0&&Number.isFinite(value);
     input.setCustomValidity(valid?'':item.angle?'Bitte einen Winkel größer als 0° und kleiner als 90° eingeben.':'Bitte ein positives Maß eingeben.');
     if(!valid){input.reportValidity();input.focus();return}
     if(item.s[item.key]!==value){rememberHistory();item.s[item.key]=value;recalc();render();positionDimensionInputs()}
     const next=dimensionInputs.slice(i+1).find(field=>!field.readOnly);if(next)next.focus();else stopDimensioning(true)
    }
   });
   input.addEventListener('input',()=>input.setCustomValidity(''));
   box.append(input);return input
  });
  positionDimensionInputs();dimensionInputs.find(input=>!input.readOnly)?.focus()
 }
 function stopDimensioning(pauseDrawing=true){dimensionMode=false;drawingPaused=pauseDrawing;hover=null;el('toolMode').textContent=pauseDrawing?'BEREIT':'ZEICHNEN · 3D';el('dimension').querySelector('.ribbon-label').textContent=pauseDrawing?'Weiterzeichnen':'Bemaßen';el('dimensionFields').replaceChildren();dimensionInputs=[];updatePrompt();updateSawLength();updateBendPositions();render()}
 function resumeDrawing(){if(!activeProfile){showProfileDialog();return}drawingPaused=false;hover=null;el('toolMode').textContent='ZEICHNEN · 3D';el('dimension').querySelector('.ribbon-label').textContent='Bemaßen';updatePrompt();render()}
 let machineSettings={centerHeight:1150,bendDirection:'clockwise',chuckRotationDirection:'clockwise',name:'TUBOBEND 48'};
 function loadMachineSettings(){const active=window.RohrPlanMachines.getActive();machineSettings={centerHeight:active.centerHeight,bendDirection:active.bendDirection,chuckRotationDirection:active.chuckRotationDirection,name:active.name};el('chuckDirectionNote').textContent='Futterdrehung: Positive Winkel '+(active.chuckRotationDirection==='clockwise'?'im Uhrzeigersinn':'gegen Uhrzeigersinn')+', vom Futter zur Biegerolle gesehen. Einstellung aus den Maschinen-Stammdaten; Drehbewegung auf dem kürzesten Weg.';}
 function floorCollisionReport(bends){const cut=sawLengthWithChuck();if(!cut||cut.error)return [];return window.rohrPlanFloorChecks(bends,cut.length,Number(activeProfile.diameter),machineSettings.centerHeight,machineSettings.bendDirection,machineSettings.chuckRotationDirection);}
 const profileStorageKey='rohrplan.pipe-profiles.v1';
 const pipeProfilesFileName='Rohrdatensaetze.json';
 const masterDataFolderName='Stammdaten';
 function decodePipeProfilesFile(contents){const data=JSON.parse(contents);if(data.format!=='rohrplan-pipe-profiles'||data.version!==1||!Array.isArray(data.profiles)||data.profiles.some(p=>!p||typeof p.id!=='string'||!p.id||![p.diameter,p.wall,p.radius,p.sampleLength].every(v=>Number.isFinite(v)&&v>0)||!Array.isArray(p.legs)||p.legs.length!==3||!p.legs.every(v=>Number.isFinite(v)&&v>0)))throw new Error('Ungültige Rohrdaten-Datei.');return data.profiles;}
 async function saveBrowserPipeProfiles(root,next){
  root=await root.getDirectoryHandle(masterDataFolderName,{create:true});
  let current=null;try{current=await(await(await root.getFileHandle(pipeProfilesFileName)).getFile()).text();decodePipeProfilesFile(current);}catch(error){if(!isMissingProjectFile(error))throw error;}
  async function write(name,contents){const file=await root.getFileHandle(name,{create:true}),writer=await file.createWritable();try{await writer.write(contents);await writer.close();}catch(error){await writer.abort().catch(()=>{});throw error;}}
  if(current!==null)await write(pipeProfilesFileName+'.bak',current);
  await write(pipeProfilesFileName,JSON.stringify({format:'rohrplan-pipe-profiles',version:1,profiles:next},null,2));
 }
 let profileStorageError='',profileSavePending=false;
 async function loadProfiles(){
  profileStorageError='';
  let saved=null,legacyError='';
  try{const raw=localStorage.getItem(profileStorageKey);if(raw){saved=JSON.parse(raw);if(!Array.isArray(saved))throw new Error('Ungültiger Rohrdatenspeicher.');}}catch(error){legacyError=error.message;}
  if(window.rohrPlanDesktop?.loadPipeProfiles){
   try{const stored=await window.rohrPlanDesktop.loadPipeProfiles();
    if(stored.profiles!==null){profiles=stored.profiles;return;}
    if(legacyError)throw new Error(legacyError);
    profiles=saved||[];
    if(saved)await window.rohrPlanDesktop.savePipeProfiles(saved);
   }catch(error){profiles=saved||[];profileStorageError=error.message;alert(`Die Rohrdaten-Datei konnte nicht geladen werden. Vorhandene Daten bleiben erhalten. ${error.message}`);}
  }else{
   profiles=saved||[];
   try{
    if(!projectRootHandle)projectRootHandle=await readRememberedProjectHandle('root');
    const root=await getProjectsRoot(false);
    if(root){try{const dataFolder=await root.getDirectoryHandle(masterDataFolderName);profiles=decodePipeProfilesFile(await(await(await dataFolder.getFileHandle(pipeProfilesFileName)).getFile()).text());}catch(error){if(!isMissingProjectFile(error))throw error;if(legacyError)throw new Error(legacyError);if(saved)await saveBrowserPipeProfiles(root,saved);}}
    else if(legacyError)throw new Error(legacyError);
   }catch(error){profileStorageError=error.message;alert('Die gespeicherten Rohrdaten konnten nicht gelesen werden. '+error.message);}
  }
 }
 async function persistProfiles(next){
  if(profileStorageError){alert('Rohrdaten können erst wieder gespeichert werden, wenn der Lesefehler behoben ist. '+profileStorageError);return false;}
  if(profileSavePending)return false;
  profileSavePending=true;
  try{
   if(window.rohrPlanDesktop?.savePipeProfiles){await window.rohrPlanDesktop.savePipeProfiles(next);try{localStorage.setItem(profileStorageKey,JSON.stringify(next));}catch{}}
   else{const root=await getProjectsRoot(false);if(root){await saveBrowserPipeProfiles(root,next);try{localStorage.setItem(profileStorageKey,JSON.stringify(next));}catch{}}else{if(projectRootHandle)throw new Error('Bitte unter Projekte den Standardordner erneut freigeben.');localStorage.setItem(profileStorageKey,JSON.stringify(next));}}
   profiles=next;return true;
  }catch(error){alert('Der Rohrdatensatz konnte nicht gespeichert werden. '+error.message);return false;}finally{profileSavePending=false;}
 }
 function profileName(p){return `Ø ${p.diameter} × ${p.wall} mm · R ${p.radius} mm`}
 function refreshProfileOptions(){const select=el('profileSelect'),old=select.value;select.replaceChildren(new Option('Bitte Datensatz wählen',''));[...profiles].sort((a,b)=>a.diameter-b.diameter||a.wall-b.wall||a.radius-b.radius).forEach(p=>select.add(new Option(profileName(p),p.id)));if(profiles.some(p=>p.id===old))select.value=old;el('profileEmpty').hidden=profiles.length>0;el('startPipe').disabled=!select.value}
 function renderProfileList(){const list=el('profileList');list.replaceChildren();if(!profiles.length){const empty=document.createElement('div');empty.className='dialog-note';empty.textContent='Noch keine Datensätze gespeichert.';list.append(empty);return}profiles.forEach(p=>{const row=document.createElement('div');row.className='profile-row';const info=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('small'),remove=document.createElement('button');title.textContent=profileName(p);const cal=calibration(p);detail.textContent=`Muster: ${p.sampleLength} mm gerade · Außenmaße ${p.legs.join(' / ')} mm · Korrektur ${cal.per90>=0?'+':''}${cal.per90.toFixed(2)} mm je 90°`;info.append(title,detail);remove.type='button';remove.className='button delete-profile';remove.textContent='Löschen';remove.setAttribute('aria-label',`${profileName(p)} löschen`);remove.dataset.profileId=p.id;row.append(info,remove);list.append(row)})}
 async function deleteProfile(id){const profile=profiles.find(p=>p.id===id);if(!profile||!confirm(`Rohrdatensatz „${profileName(profile)}“ wirklich löschen?`))return;if(!await persistProfiles(profiles.filter(p=>p.id!==id)))return;refreshProfileOptions();renderProfileList()}
 function makeDesktopDirectoryHandle(info){
  const api=window.rohrPlanDesktop;
  return {kind:'directory',name:info.name,path:info.path,
   getDirectoryHandle:async(name,options={})=>makeDesktopDirectoryHandle(await api.ensureDirectory(info.path,name,!!options.create)),
   getFileHandle:async name=>({kind:'file',name,getFile:async()=>new File([await api.readFile(info.path,name)],name,{type:'application/json'}),createWritable:async()=>{let contents='';return {write:async value=>{contents=typeof value==='string'?value:JSON.stringify(value)},close:async()=>api.writeFile(info.path,name,contents)};}}),
   async *entries(){for(const entry of await api.listDirectory(info.path))yield [entry.name,entry.kind==='directory'?makeDesktopDirectoryHandle({path:info.path+'\\'+entry.name,name:entry.name}):await this.getFileHandle(entry.name)];},
   removeEntry:name=>api.removeFile(info.path,name),queryPermission:async()=> 'granted',requestPermission:async()=> 'granted'};
 }
 const projectHandleDb='rohrplan-browser-storage',projectHandleStore='directory-handles';
 function openProjectHandleDb(){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){reject(new Error('IndexedDB nicht verfügbar'));return;}const request=indexedDB.open(projectHandleDb,1);request.onupgradeneeded=()=>request.result.createObjectStore(projectHandleStore);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
 async function saveRememberedProjectHandle(handle,key='active'){const db=await openProjectHandleDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction(projectHandleStore,'readwrite');tx.objectStore(projectHandleStore).put(window.rohrPlanDesktop?{desktopPath:handle.path,name:handle.name}:handle,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
 async function readRememberedProjectHandle(key='active'){const db=await openProjectHandleDb();try{const stored=await new Promise((resolve,reject)=>{const tx=db.transaction(projectHandleStore,'readonly'),request=tx.objectStore(projectHandleStore).get(key);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);});if(window.rohrPlanDesktop)return stored?.desktopPath?makeDesktopDirectoryHandle({path:stored.desktopPath,name:stored.name}):null;return stored?.kind==='directory'&&typeof stored.getDirectoryHandle==='function'?stored:null;}finally{db.close();}}
 let browserProjectsRootId='initial-root';try{browserProjectsRootId=localStorage.getItem('rohrplan.projects-root-id.v1')||browserProjectsRootId;}catch{}
 function projectKey(handle){return handle?.path?handle.path.toLocaleLowerCase():handle?.name?browserProjectsRootId+'/'+handle.name:null;}
 function updateProjectControls(){
  const hasDrawing=!!activeProfile&&segments.length>0;
  el('saveIsometry').disabled=!hasDrawing;el('saveCurrentToProject').disabled=!projectDirectoryHandle||!hasDrawing;
  el('projectCurrentStatus').textContent=projectDirectoryHandle?`Geöffnetes Projekt: ${projectDirectoryHandle.name} · Ordner: ${projectDirectoryHandle.path||'Dokumente\\RohrPlan\\'+projectDirectoryHandle.name}`:'Wähle einen Projektordner aus oder lege einen neuen an.';
  el('projectRootStatus').textContent=projectRootHandle?`Standardordner: ${projectRootHandle.path||'Dokumente\\RohrPlan'}`:window.rohrPlanDesktop?'Standardordner: Dokumente\\RohrPlan':typeof window.showDirectoryPicker==='function'?'Im Browser einmal Dokumente\\RohrPlan freigeben. Danach sind seine Unterordner deine Projekte.':'Dieser Browser erlaubt keinen Ordnerzugriff. Verwende die Windows-App oder einen Browser mit Ordnerfreigabe.';
  el('connectProjectsRoot').textContent=window.rohrPlanDesktop?'Ordner anzeigen':'Standardordner freigeben';
  el('connectProjectsRoot').disabled=!window.rohrPlanDesktop&&typeof window.showDirectoryPicker!=='function';
  el('projectFolderSelect').disabled=!projectRootHandle;
 }
 function safeFolderName(name){const clean=name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/,'');return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(clean)?'_'+clean:clean;}
 function isMissingProjectFile(error){return error?.name==='NotFoundError'||/\bENOENT\b|no such file/i.test(error?.message||'');}
 async function chooseBrowserProjectsRoot(){
  if(typeof window.showDirectoryPicker!=='function')throw Error('Ordnerzugriff ist in diesem Browser nicht verfügbar. Bitte die Windows-App verwenden.');
  const selected=await window.showDirectoryPicker({id:'rohrplan-projects-root',startIn:'documents',mode:'readwrite'});
  const root=selected.name.toLocaleLowerCase()==='rohrplan'?selected:await selected.getDirectoryHandle('RohrPlan',{create:true});
  const same=projectRootHandle&&await root.isSameEntry(projectRootHandle);
  if(!same){browserProjectsRootId=globalThis.crypto?.randomUUID?.()||String(Date.now());try{localStorage.setItem('rohrplan.projects-root-id.v1',browserProjectsRootId);}catch{}projectDirectoryHandle=null;projectIndex=null;rememberedProjectHandle=null;el('projectFolderSelect').replaceChildren();el('projectIsometryStatus').textContent='';renderProjectIsometries();}
  projectRootHandle=root;saveRememberedProjectHandle(root,'root').catch(()=>{});await loadProfiles();refreshProfileOptions();renderProfileList();return root;
 }
 async function getProjectsRoot(requestAccess=false){
  if(window.rohrPlanDesktop){if(!projectRootHandle)projectRootHandle=makeDesktopDirectoryHandle(await window.rohrPlanDesktop.getProjectsRoot());return projectRootHandle;}
  if(projectRootHandle){const permission=await projectRootHandle.queryPermission({mode:'readwrite'});if(permission==='granted')return projectRootHandle;if(requestAccess&&await projectRootHandle.requestPermission({mode:'readwrite'})==='granted')return projectRootHandle;}
  if(!requestAccess)return null;
  return chooseBrowserProjectsRoot();
 }
 async function refreshProjectFolders(requestAccess=false){
  const root=await getProjectsRoot(requestAccess),select=el('projectFolderSelect'),previous=select.value;
  if(!root){updateProjectControls();return false;}
  const names=[];for await(const [name,entry] of root.entries())if(entry.kind==='directory'&&name.toLocaleLowerCase()!==masterDataFolderName.toLocaleLowerCase())names.push(name);
  select.replaceChildren(new Option(names.length?'Projektordner auswählen':'Noch keine Projektordner vorhanden',''));
  for(const name of names.sort((a,b)=>a.localeCompare(b,'de')))select.add(new Option(name,name));
  const selected=projectDirectoryHandle?.name||previous;if(names.includes(selected))select.value=selected;
  updateProjectControls();return true;
 }
 async function activateProject(handle){
  const isometries=[],issues=[];
  for await(const [fileName,entry] of handle.entries()){
   if(entry.kind!=='file'||!fileName.toLocaleLowerCase().endsWith('.json')||fileName==='rohrplan-project.json')continue;
   try{const file=await entry.getFile(),data=JSON.parse(await file.text());
    if(data.formatVersion!==1||!Array.isArray(data.segments)||!data.profile){if(/\.rohrplan\.json$|^isometrie-.*\.json$/i.test(fileName))issues.push(fileName);continue;}
    isometries.push({id:fileName,fileName,name:typeof data.name==='string'&&data.name?data.name:fileName.replace(/(?:\.rohrplan)?\.json$/i,''),savedAt:typeof data.savedAt==='string'&&Number.isFinite(Date.parse(data.savedAt))?data.savedAt:new Date(file.lastModified).toISOString()});
   }catch{if(/\.rohrplan\.json$|^isometrie-.*\.json$/i.test(fileName))issues.push(fileName);}
  }
  if(currentIsometryProjectKey!==projectKey(handle)){currentIsometryId=null;currentIsometryProjectKey=null;}
  projectDirectoryHandle=handle;rememberedProjectHandle=handle;projectIndex={projectName:handle.name,isometries};
  saveRememberedProjectHandle(handle).catch(()=>{});renderProjectIsometries();updateProjectControls();
  el('projectIsometryStatus').textContent=issues.length?'Diese Isometrie-Dateien konnten nicht gelesen werden: '+issues.join(', '):'';
  return true;
 }
 async function restoreRememberedProject(){
  try{
   if(!window.rohrPlanDesktop)projectRootHandle=await readRememberedProjectHandle('root');
   if(!await refreshProjectFolders(false))return;
   rememberedProjectHandle=await readRememberedProjectHandle();if(!rememberedProjectHandle)return;
   const root=projectRootHandle,handle=rememberedProjectHandle;
   const belongs=window.rohrPlanDesktop?handle.path.toLocaleLowerCase().slice(0,handle.path.lastIndexOf('\\'))===root.path.toLocaleLowerCase():(await root.resolve(handle))?.length===1;
   if(belongs&&await handle.queryPermission({mode:'readwrite'})==='granted'){await activateProject(handle);el('projectFolderSelect').value=handle.name;}
  }catch(error){el('projectRootStatus').textContent='Projektordner konnte nicht wiederhergestellt werden: '+error.message;}
 }
 function openProjectsDialog(){renderProjectIsometries();updateProjectControls();el('projectDialog').showModal();refreshProjectFolders(false).catch(error=>{el('projectRootStatus').textContent='Ordnerliste konnte nicht geladen werden: '+error.message;});}
 async function connectProjectsRoot(){try{if(window.rohrPlanDesktop)await window.rohrPlanDesktop.showProjectsRoot();else await chooseBrowserProjectsRoot();await refreshProjectFolders(true);}catch(error){if(error.name!=='AbortError')el('projectRootStatus').textContent='Standardordner konnte nicht geöffnet werden: '+error.message;}}
 async function createProjectFolder(){
  const name=safeFolderName(el('newProjectName').value);if(!name){el('projectCurrentStatus').textContent='Bitte einen gültigen Ordnernamen eingeben.';return;}
  if(name.toLocaleLowerCase()===masterDataFolderName.toLocaleLowerCase()){el('projectCurrentStatus').textContent='Der Ordnername Stammdaten ist für die Rohrdaten reserviert. Bitte einen anderen Projektnamen wählen.';return;}
  try{const root=await getProjectsRoot(true),handle=await root.getDirectoryHandle(name,{create:true});await activateProject(handle);await refreshProjectFolders(false);el('newProjectName').value='';el('projectFolderSelect').value=name;}
  catch(error){if(error.name!=='AbortError')el('projectCurrentStatus').textContent='Projektordner konnte nicht erstellt werden: '+error.message;}
 }
 async function openProjectFolder(){
  try{const name=el('projectFolderSelect').value;if(!name){await refreshProjectFolders(true);el('projectCurrentStatus').textContent='Bitte einen Projektordner aus der Liste auswählen.';return;}
   const root=await getProjectsRoot(true),handle=await root.getDirectoryHandle(name);await activateProject(handle);
  }catch(error){if(error.name!=='AbortError')el('projectCurrentStatus').textContent='Projektordner konnte nicht geöffnet werden: '+error.message;}
 }
 function renderProjectIsometries(){
  const list=el('projectIsometryList');list.replaceChildren();if(!projectIndex?.isometries?.length){const empty=document.createElement('p');empty.className='project-empty';empty.textContent=projectDirectoryHandle?'In diesem Ordner sind noch keine Isometrien gespeichert.':'Wähle zuerst einen Projektordner.';list.append(empty);return;}
  for(const item of [...projectIndex.isometries].sort((a,b)=>b.savedAt.localeCompare(a.savedAt))){
   const row=document.createElement('div');row.className='project-isometry-row';const info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=item.name;meta.textContent=item.fileName+' · '+new Date(item.savedAt).toLocaleString('de-DE');info.append(name,meta);
   const actions=document.createElement('div'),load=document.createElement('button'),remove=document.createElement('button');load.type=remove.type='button';load.className='button primary';load.textContent='Laden';load.onclick=()=>loadProjectIsometry(item.id);remove.className='button clear';remove.textContent='Löschen';remove.onclick=()=>deleteProjectIsometry(item.id);actions.className='project-isometry-actions';actions.append(load,remove);row.append(info,actions);list.append(row);
  }
 }

 function serializeIsometry(name,id){return{formatVersion:1,id,name,savedAt:new Date().toISOString(),profile:JSON.parse(JSON.stringify(activeProfile)),reverseBendOrder,view:{yaw,pitch,zoom,pan:[...pan]},segments:segments.map(s=>s.kind==='pipe'?{kind:'pipe',dir:[...s.dir],drawLength:s.drawLength,length:s.length,bendRadius:s.bendRadius}:{kind:'offset',runDir:[...s.runDir.v],sideDir:[...s.sideDir.v],vertDir:[...s.vertDir.v],drawR:s.drawR,drawH:s.drawH,drawV:s.drawV,R:s.R,H:s.H,V:s.V,fixedAngle:s.fixedAngle??null})}}
 async function saveCurrentIsometry(){
  if(!activeProfile){alert('Bitte zuerst einen Rohrdatensatz auswählen.');pendingClosePipeId=null;return}
  if(dimensionMode)stopDimensioning(true);
  const dialog=el('saveIsometryDialog');el('saveIsometryName').value=el('currentIsometryName').value;dialog.returnValue='cancel';
  const choice=await new Promise(resolve=>{dialog.addEventListener('close',()=>resolve(dialog.returnValue),{once:true});dialog.showModal()});
  if(choice==='cancel'){pendingClosePipeId=null;return}
  const name=el('saveIsometryName').value.trim()||'Isometrie';el('currentIsometryName').value=name;renderPipeTabs();
  if(choice==='project'){await saveIsometryToProject();return}
  try{
   const data=serializeIsometry(name,null),contents=JSON.stringify(data,null,2),fileName=(safeFolderName(name)||'Isometrie')+'.rohrplan.json';
   if(window.rohrPlanDesktop?.saveIsometryFile){const result=await window.rohrPlanDesktop.saveIsometryFile(fileName,contents);if(result.canceled){pendingClosePipeId=null;return}}
   else if(window.showSaveFilePicker){const handle=await window.showSaveFilePicker({suggestedName:fileName,types:[{description:'RohrPlan-Isometrie',accept:{'application/json':['.json']}}]}),writer=await handle.createWritable();await writer.write(contents);await writer.close()}
   else{const blob=new Blob([contents],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
   markPipeSaved()
  }catch(error){pendingClosePipeId=null;if(error.name!=='AbortError')alert('Die Isometrie konnte nicht gespeichert werden: '+error.message)}
 }
 async function openIsometryFile(file){
  try{
   const payload=JSON.parse(await file.text());if(payload.formatVersion!==1||!Array.isArray(payload.segments)||!payload.profile)throw new Error('Die Datei ist keine RohrPlan-Isometrie.');
   if(activeProfile||segments.length||stepMeshes.length){pipeTabs[activePipeTab]=capturePipeTab();activePipeTab=pipeTabs.length;pipeTabs.push(null)}
   currentPipeTabId=globalThis.crypto?.randomUUID?.()||String(Date.now());savedPipeSignature=null;pendingClosePipeId=null;
   applyIsometryPayload(payload,{id:null,name:payload.name||file.name.replace(/(?:\.rohrplan)?\.json$/i,'')});markPipeSaved()
  }catch(error){alert('Die Isometrie konnte nicht geöffnet werden: '+error.message)}
 }
 async function saveIsometryToProject(){
  if(!projectDirectoryHandle){el('projectCurrentStatus').textContent='Bitte zuerst einen Projektordner auswählen.';if(!el('projectDialog').open)openProjectsDialog();return;}
  if(!activeProfile){alert('Diese Vorschau kann nicht als Rohr-Isometrie gespeichert werden. Der Tab bleibt geöffnet.');pendingClosePipeId=null;return;}
  if(dimensionMode)stopDimensioning(true);
  const handle=projectDirectoryHandle,index=projectIndex,pipeId=currentPipeTabId,name=el('currentIsometryName').value.trim()||'Isometrie';
  el('currentIsometryName').value=name;
  const snapshot=serializeIsometry(name,null),signature=pipeContentSignature();
  try{
   let item=currentIsometryProjectKey===projectKey(handle)?index.isometries.find(x=>x.id===currentIsometryId):null;
   if(!item){const used=new Set();for await(const [fileName]of handle.entries())used.add(fileName.toLocaleLowerCase());const stem=safeFolderName(name)||'Isometrie';let fileName=stem+'.rohrplan.json',suffix=2;while(used.has(fileName.toLocaleLowerCase()))fileName=stem+' ('+(suffix++)+').rohrplan.json';item={id:fileName,fileName};}
   const data={...snapshot,id:item.id},file=await handle.getFileHandle(item.fileName,{create:true}),writer=await file.createWritable();await writer.write(JSON.stringify(data,null,2));await writer.close();
   const saved={...item,name,savedAt:data.savedAt};index.isometries=index.isometries.filter(x=>x.id!==saved.id);index.isometries.unshift(saved);
   if(projectDirectoryHandle===handle){renderProjectIsometries();updateProjectControls();el('projectCurrentStatus').textContent='„'+name+'“ in Dokumente\\RohrPlan\\'+handle.name+' gespeichert.';}
   if(currentPipeTabId===pipeId){currentIsometryId=saved.id;currentIsometryProjectKey=projectKey(handle);if(pipeContentSignature()===signature)markPipeSaved();else{savedPipeSignature=signature;renderPipeTabs();saveOpenPipeTabs();}}
  }catch(error){el('projectCurrentStatus').textContent='Isometrie konnte nicht gespeichert werden: '+error.message;}
 }
 function directionFromVector(vector){return dirs.find(d=>near(d.v,vector))||{name:'',v:[...vector],color:'#83c5bb'}}
 function applyIsometryPayload(payload,item){reverseBendOrder=payload.reverseBendOrder===true;undoHistory=[];redoHistory=[];segments=payload.segments.map(s=>s.kind==='pipe'?{...s,dir:[...s.dir]}:{...s,runDir:directionFromVector(s.runDir),sideDir:directionFromVector(s.sideDir),vertDir:directionFromVector(s.vertDir)});activeProfile=payload.profile;currentIsometryId=item.id;currentIsometryProjectKey=item.id?projectKey(projectDirectoryHandle):null;el('currentIsometryName').value=item.name;el('activeProfileLabel').textContent=profileName(activeProfile);if(payload.view){yaw=Number(payload.view.yaw)||yaw;pitch=Number(payload.view.pitch)||pitch;zoom=Number(payload.view.zoom)||1;pan=Array.isArray(payload.view.pan)?payload.view.pan:[0,0]}dimensionMode=false;dimensionInputs=[];el('dimensionFields').replaceChildren();el('dimension').querySelector('.ribbon-label').textContent='Bemaßen';drawingPaused=false;offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=offsetPreviousDir=null;const last=segments.at(-1);previousDir=last?directionFromVector(last.kind==='pipe'?last.dir:(last.drawV?last.vertDir.v:last.sideDir.v)):null;continuationDir=null;recalc();updatePrompt();resize();render();updateProjectControls();renderPipeTabs()}
 async function loadProjectIsometry(id){
  const handle=projectDirectoryHandle,item=projectIndex?.isometries.find(x=>x.id===id);if(!item||!handle)return;pendingClosePipeId=null;
  if(segments.length&&!confirm('Die aktuelle Zeichnung wird durch die gespeicherte Isometrie ersetzt. Fortfahren?'))return;
  try{const payload=JSON.parse(await(await(await handle.getFileHandle(item.fileName)).getFile()).text());if(payload.formatVersion!==1||!Array.isArray(payload.segments)||!payload.profile)throw Error('Die Isometrie-Datei ist ungültig oder wird nicht unterstützt.');if(projectDirectoryHandle!==handle)return;applyIsometryPayload(payload,item);el('projectDialog').close();markPipeSaved();}
  catch(error){alert('Isometrie konnte nicht geladen werden: '+error.message);}
 }
 async function deleteProjectIsometry(id){
  const handle=projectDirectoryHandle,index=projectIndex,item=index?.isometries.find(x=>x.id===id);if(!item||!handle||!confirm('„'+item.name+'“ aus diesem Projektordner löschen?'))return;
  try{await handle.removeEntry(item.fileName);index.isometries=index.isometries.filter(x=>x.id!==id);if(currentIsometryId===id&&currentIsometryProjectKey===projectKey(handle)){currentIsometryId=null;currentIsometryProjectKey=null;}if(projectDirectoryHandle===handle){renderProjectIsometries();updateProjectControls();}}
  catch(error){alert('Isometrie konnte nicht gelöscht werden: '+error.message);}
 }
 function calibration(p){if(p.importedFromStep)return{theoretical:p.theoreticalSampleLength||0,per90:p.correctionPer90||0};const outsideTotal=p.legs.reduce((a,b)=>a+b,0),theoretical=outsideTotal-2*p.diameter-(4-Math.PI)*p.radius;return{theoretical,per90:(p.sampleLength-theoretical)/2}}
 function updateCalibrationPreview(){const p={diameter:Number(el('recordDiameter').value),radius:Number(el('recordRadius').value),sampleLength:Number(el('recordStartLength').value),legs:[1,2,3].map(i=>Number(el(`recordLeg${i}`).value))},out=el('calibrationPreview');if(![p.diameter,p.radius,p.sampleLength,...p.legs].every(x=>x>0)){out.textContent='Die Messwerte werden zur Kalibrierung für diesen Rohrdatensatz gespeichert.';return}const c=calibration(p);out.textContent=`Theoretische Mittellinien-Sägelänge des Musters: ${c.theoretical.toFixed(1)} mm. Daraus ermittelte Korrektur: ${c.per90>=0?'+':''}${c.per90.toFixed(2)} mm je 90°-Biegung.`}
 function manufacturingLegs(){
  const legs=[];
  for(const segment of segments){
   if(segment.kind==='pipe'){if(!(segment.length>0))return null;legs.push({dir:[...segment.dir],len:segment.length,bendRadius:segment.bendRadius})}
   else{if(!(segment.R>0&&segment.H>0)||segment.drawV>0&&!(segment.V>0))return null;const delta=add(add(mul(segment.runDir.v,segment.R),mul(segment.sideDir.v,segment.H)),mul(segment.vertDir.v,segment.V||0)),len=Math.hypot(...delta);legs.push({dir:delta.map(x=>x/len),len,offset:true})}
  }
  if(!reverseBendOrder)return legs;
  return [...legs].reverse().map((leg,index)=>({...leg,dir:mul(leg.dir,-1),bendRadius:index>0?legs[legs.length-index].bendRadius:undefined}))
 }
 function sawLength(){if(!activeProfile||!segments.length)return null;const legs=manufacturingLegs();if(!legs)return null;const cal=calibration(activeProfile),radius=activeProfile.radius;let total=legs.reduce((sum,l)=>sum+l.len,0),bends=0;for(let i=1;i<legs.length;i++){const d=Math.max(-1,Math.min(1,dot(legs[i-1].dir,legs[i].dir)));if(d<-.999999)return{error:'Eine 180°-Umlenkung ist mit dem U-Muster nicht kalibriert.'};const angle=Math.acos(d);if(angle<1e-6)continue;const bendRadius=legs[i].bendRadius??radius,tangentSetback=bendRadius*Math.tan(angle/2),arc=bendRadius*angle,empirical=cal.per90*angle/(Math.PI/2);/* Each drawn leg reaches the theoretical sharp corner, so remove the tangent setback from both legs meeting at this bend. */total+=arc-2*tangentSetback+empirical;bends++}return{length:total,bends}}
 function chuckExtension(){const legs=manufacturingLegs(),tail=legs?.at(-1)?.len;return tail>0?Math.max(0,305-tail):null}
 function sawLengthWithChuck(){const result=sawLength();if(!result||result.error)return result;const extension=chuckExtension();if(extension===null)return null;return{...result,length:result.length+extension,chuckExtension:extension}}
 function bendPositions(){if(!activeProfile||!segments.length)return null;const legs=manufacturingLegs();if(!legs)return null;const radius=activeProfile.radius,out=[];let virtualDistance=0,previousBendAdjustment=0;for(let i=1;i<legs.length;i++){virtualDistance+=legs[i-1].len;const d=Math.max(-1,Math.min(1,dot(legs[i-1].dir,legs[i].dir)));if(d<-.999999)return{error:'180°-Biegungen sind noch nicht abgebildet.'};const angle=Math.acos(d);if(angle<1e-6)continue;const bendRadius=legs[i].bendRadius??radius,tangentSetback=bendRadius*Math.tan(angle/2),position=virtualDistance+previousBendAdjustment-tangentSetback;if(position<0)return{error:'Die erste Biegeposition liegt vor dem Rohranfang.'};const normal=mul(cross(legs[i-1].dir,legs[i].dir),1/Math.sin(angle));let rotation=0;if(out.length){const previous=out.at(-1),axis=legs[i-1].dir,step=Math.atan2(dot(axis,cross(previous.plane,normal)),dot(previous.plane,normal))*180/Math.PI;rotation=(previous.rotation+step+360)%360;if(Math.abs(rotation-360)<1e-7||Math.abs(rotation)<1e-7)rotation=0}out.push({number:out.length+1,segmentIndex:reverseBendOrder?legs.length-i:i,routeIndex:i,angle,position,rotation,plane:normal,radius:bendRadius});previousBendAdjustment+=bendRadius*angle-2*tangentSetback}const cut=sawLengthWithChuck();if(!cut)return null;if(cut.error)return cut;return out.map(b=>({...b,position:cut.length-b.position}))}
 function drawBendSketch(bends){
  const svg=el('bendSketch');svg.replaceChildren();
  const ns='http://www.w3.org/2000/svg',make=(tag,attrs={},value)=>{const node=document.createElementNS(ns,tag);for(const [key,val]of Object.entries(attrs))node.setAttribute(key,val);if(value!=null)node.textContent=value;return node};
  const route=segments.length?[segments[0].from||[0,0,0],...segments.map(s=>s.to)]:[];
  if(!route.length){svg.append(make('text',{x:700,y:280,'text-anchor':'middle',class:'sketch-empty'},'Noch kein Rohrverlauf'));return}
  const iso=([x,y,z])=>[(x-y)*Math.sqrt(3)/2,(x+y)/2-z],width=1400,height=560,pad=78;
  const offsets=segments.filter(s=>s.kind==='offset').map(s=>{
   const components=[{key:'R',vector:mul(s.runDir.v,s.drawR),value:s.R},{key:'H',vector:mul(s.sideDir.v,s.drawH),value:s.H}];
   if(s.drawV)components.push({key:'V',vector:mul(s.vertDir.v,s.drawV),value:s.V});
   const corners=Array.from({length:1<<components.length},(_,mask)=>components.reduce((p,c,i)=>mask&(1<<i)?add(p,c.vector):p,[...s.anchor]));
   return{s,components,corners};
  });
  const projected=[...route,...offsets.flatMap(o=>o.corners)].map(iso),xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min((width-2*pad)/Math.max(maxX-minX,1),(height-2*pad)/Math.max(maxY-minY,1)),offsetX=(width-(maxX-minX)*scale)/2,offsetY=(height-(maxY-minY)*scale)/2;
  const screen=p=>{const q=iso(p);return{x:offsetX+(q[0]-minX)*scale,y:offsetY+(q[1]-minY)*scale}},points=route.map(screen);
  const path=(a,b,cls)=>make('path',{d:'M '+a.x+' '+a.y+' L '+b.x+' '+b.y,class:cls});
  const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
  const defs=make('defs'),hatch=make('pattern',{id:'offsetHatch',width:10,height:10,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'});
  hatch.append(make('path',{d:'M 0 0 V 10',class:'sketch-hatch-line'}));defs.append(hatch);svg.append(defs);
  const worldX=route.map(p=>p[0]),worldY=route.map(p=>p[1]),floorZ=Math.min(...route.map(p=>p[2])),span=Math.max(1,Math.max(...worldX)-Math.min(...worldX),Math.max(...worldY)-Math.min(...worldY)),worldPad=span*.15,gridStep=span/10;
  const bounds=[Math.min(...worldX)-worldPad,Math.max(...worldX)+worldPad,Math.min(...worldY)-worldPad,Math.max(...worldY)+worldPad],grid=make('g',{class:'sketch-grid'});
  for(let x=Math.ceil(bounds[0]/gridStep)*gridStep;x<=bounds[1];x+=gridStep)grid.append(path(screen([x,bounds[2],floorZ]),screen([x,bounds[3],floorZ]),'sketch-grid-line'));
  for(let y=Math.ceil(bounds[2]/gridStep)*gridStep;y<=bounds[3];y+=gridStep)grid.append(path(screen([bounds[0],y,floorZ]),screen([bounds[1],y,floorZ]),'sketch-grid-line'));
  svg.append(grid);
  const measures=[];
  for(const o of offsets){
   // Choose the construction side with the most room beside the neighbouring pipe.
   const orders=o.components.length===2?[[0,1],[1,0]]:[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
   const candidates=orders.map(order=>{
    let p=[...o.s.anchor];const chain=[p],items=[];
    for(const i of order){const next=add(p,o.components[i].vector);items.push({from:p,to:next,key:o.components[i].key,value:o.components[i].value});chain.push(next);p=next}
    const midpoints=items.map(m=>{const a=screen(m.from),b=screen(m.to);return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}),score=midpoints.reduce((sum,p)=>sum+Math.min(...points.slice(1).map((b,i)=>distance(p,points[i],b))),0);
    return{chain,items,score};
   }).sort((a,b)=>b.score-a.score),chosen=candidates[0];
   if(o.components.length===3){
    const box=make('g',{class:'sketch-offset-box'});
    for(let mask=0;mask<8;mask++)for(let axis=0;axis<3;axis++)if(!(mask&(1<<axis)))box.append(path(screen(o.corners[mask]),screen(o.corners[mask|(1<<axis)]),'sketch-box-edge'));
    svg.append(box);
   }else{
    const triangle=chosen.chain.map(screen);
    svg.append(make('polygon',{points:triangle.map(p=>p.x+','+p.y).join(' '),class:'sketch-offset-hatch'}));
   }
   measures.push(...chosen.items);
  }
  svg.append(make('path',{d:points.map((p,i)=>(i?'L':'M')+' '+p.x+' '+p.y).join(' '),class:'sketch-pipe'}));
  points.forEach(p=>svg.append(make('circle',{cx:p.x,cy:p.y,r:3.5,class:'sketch-node'})));
  const occupied=[],overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const placeLabel=(a,b,text,dimension=false)=>{
   const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=len?-dy/len:0,ny=len?dx/len:-1,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,w=text.length*8.2+12,h=23;
   let best=null;
   for(const offset of [28,-28,48,-48,70,-70,94,-94,120,-120]){
    const x=cx+nx*offset,y=cy+ny*offset,rect={x:x-w/2,y:y-h/2,w,h};
    let score=Math.abs(offset)*.15;
    if(rect.x<8||rect.x+w>width-8||rect.y<8||rect.y+h>height-8)score+=10000;
    score+=occupied.filter(r=>overlap(rect,r)).length*2000;
    for(let i=0;i<points.length-1;i++)for(let t=0;t<=1;t+=.2){const p={x:points[i].x+(points[i+1].x-points[i].x)*t,y:points[i].y+(points[i+1].y-points[i].y)*t};if(p.x>=rect.x-6&&p.x<=rect.x+w+6&&p.y>=rect.y-6&&p.y<=rect.y+h+6)score+=500}
    if(!best||score<best.score)best={x,y,rect,offset,score};
   }
   occupied.push(best.rect);
   if(dimension){
    const da={x:a.x+nx*best.offset,y:a.y+ny*best.offset},db={x:b.x+nx*best.offset,y:b.y+ny*best.offset};
    svg.append(path(a,da,'sketch-measure-extension'),path(b,db,'sketch-measure-extension'),path(da,db,'sketch-measure-line'));
    for(const p of [da,db])svg.append(path({x:p.x-nx*4,y:p.y-ny*4},{x:p.x+nx*4,y:p.y+ny*4},'sketch-measure-line'));
   }
   svg.append(make('text',{x:best.x,y:best.y+5,'text-anchor':'middle',class:'sketch-leg-label'},text));
  };
  const start=points[0],end=points.at(-1);
  for(const [p,label]of [[start,reverseBendOrder?'Rohrende':'Rohranfang'],[end,reverseBendOrder?'Rohranfang':'Rohrende']]){svg.append(make('circle',{cx:p.x,cy:p.y,r:7,class:'sketch-end'}));placeLabel(p,p,label)}
  if(Array.isArray(bends))for(const b of bends){const p=points[b.segmentIndex];if(p){svg.append(make('circle',{cx:p.x,cy:p.y,r:6,class:'sketch-bend'}));placeLabel(p,p,'B'+b.number)}}
  for(const m of measures)placeLabel(screen(m.from),screen(m.to),(m.key==='R'?'H':m.key==='H'?'R':m.key)+(m.value==null?' ?':' '+Number(m.value.toFixed(2))+' mm'),true);
  segments.forEach((s,i)=>{if(s.kind==='pipe')placeLabel(points[i],points[i+1],s.length==null?'L'+(i+1)+' ?':s.length+' mm',true)});
 }
 let recommendedBendOrder=null;
 function compareBendOrders(){
  const original=reverseBendOrder;
  try{return [false,true].map(reverse=>{reverseBendOrder=reverse;const bends=bendPositions();if(!Array.isArray(bends))return {reverse,valid:false,error:bends?.error||'Maße fehlen'};if(!bends.length)return {reverse,valid:false,error:'Keine Biegungen'};const checks=floorCollisionReport(bends);return {reverse,valid:true,collisions:checks.filter(x=>x.collision).length,turnRisks:checks.filter(x=>!x.collision&&x.turnRisk).length,clearance:Math.min(...checks.map(x=>x.clearance)),turnClearance:Math.min(...checks.map(x=>x.turnClearance))}})}finally{reverseBendOrder=original}
 }
 function updateBendOrderRecommendation(){
  const out=el('bendOrderRecommendation'),button=el('applyRecommendedBendOrder');recommendedBendOrder=null;button.disabled=true;button.hidden=true;
  if(!activeProfile||!segments.length){out.textContent='';return}
  const [forward,backward]=compareBendOrders();
  if(!forward.valid&&!backward.valid){out.textContent='Richtungsvergleich noch nicht möglich: '+forward.error+(backward.error!==forward.error?' / '+backward.error:'')+'.';return}
  let best=null;
  if(forward.valid&&!backward.valid)best=forward;else if(backward.valid&&!forward.valid)best=backward;
  else{for(const [key,ascending]of [['collisions',true],['turnRisks',true],['clearance',false],['turnClearance',false]]){const delta=forward[key]-backward[key];if(Math.abs(delta)<(key.includes('learance')?0.1:1))continue;best=(ascending?delta<0:delta>0)?forward:backward;break}}
  const describe=(label,item)=>label+': '+(item.valid?item.collisions+' Bodenwarnung(en), '+item.turnRisks+' Drehhinweis(e), kleinster Bodenabstand ca. '+item.clearance.toFixed(1)+' mm':item.error);
  out.textContent=(best?'Empfehlung: '+(best.reverse?'vom gezeichneten Rohrende':'vom gezeichneten Rohranfang')+' biegen. ':'Beide Biegefolgen sind nach der Bodenprüfung gleichwertig. ')+describe('Vom Anfang',forward)+' · '+describe('Vom Ende',backward)+'.';
  if(best){recommendedBendOrder=best.reverse;button.hidden=best.reverse===reverseBendOrder;button.disabled=best.reverse===reverseBendOrder;if(best.collisions||best.turnRisks)out.textContent+=' Auch die empfohlene Richtung enthält Warnungen; bitte die markierten Biegungen prüfen.'}
 }
 function checkBendDataMachine(){
  try{return window.RohrPlanBendDataCollision.run(currentSimulationPayload())}catch(error){el('machineCollisionSummary').textContent='Maschinenprüfung nicht möglich: '+error.message;return Promise.resolve(null)}
 }
 function updateBendPositions(){
  window.RohrPlanMachines.setTooling(activeProfile?{radius:Number(activeProfile.radius),tubeOuterDiameter:Number(activeProfile.diameter)}:null);
  window.RohrPlanBendDataCollision.reset();
  const status=el('bendDataStatus'),footer=el('bendDataFooterStatus'),rows=el('bendDataRows'),pdf=el('exportBendDataPdf'),cutLength=el('bendDataCutLength');rows.replaceChildren();updateBendOrderRecommendation();cutLength.textContent='Noch nicht berechnet';el('reverseBendOrder').textContent=reverseBendOrder?'Wieder vom ursprünglichen Anfang biegen':'Vom anderen Ende biegen';el('reverseBendOrder').setAttribute('aria-pressed',String(reverseBendOrder));el('bendOrderStatus').textContent=reverseBendOrder?'Biegefolge: vom gezeichneten Rohrende zum Rohranfang.':'Biegefolge: vom gezeichneten Rohranfang zum Rohrende.';el('reverseBendOrder').disabled=!activeProfile||segments.length<2;el('floorCollisionSummary').textContent='';
  if(stepMeshes.length&&(!activeProfile||!segments.length)){drawBendSketch(null);pdf.disabled=true;status.textContent='STEP-Datei als 3D-Vorschau geladen. Für diese Geometrie wurden noch keine Biegedaten erkannt.';footer.textContent='Biegedaten: STEP-Vorschau';return}
  if(!activeProfile||!segments.length){drawBendSketch(null);pdf.disabled=true;status.textContent='Zeichne zuerst ein Rohr mit mindestens einer Biegung.';footer.textContent='Biegedaten: noch nicht berechnet';return}
  const result=bendPositions();drawBendSketch(Array.isArray(result)?result:null);
  if(!result){pdf.disabled=true;cutLength.textContent='Maße fehlen';status.textContent=segments.find(s=>s.fixedAngleError)?.fixedAngleError||'Bitte zuerst alle Maße eingeben, damit die Biegedaten berechnet werden können.';footer.textContent='Biegedaten: Maße erforderlich';return}
  if(result.error){pdf.disabled=true;cutLength.textContent='Nicht berechenbar';status.textContent=result.error;footer.textContent='Biegedaten: Berechnung nicht möglich';return}
  const cut=sawLengthWithChuck();if(cut&&!cut.error)cutLength.textContent=`${cut.length.toFixed(1)} mm${cut.chuckExtension>0?` · Einspannzugabe +${cut.chuckExtension.toFixed(1)} mm`:''}`;else cutLength.textContent='Nicht berechenbar';
  if(!result.length){pdf.disabled=true;status.textContent='Die aktuelle Rohrform enthält keine Biegungen.';footer.textContent='Biegedaten: keine Biegungen';return}
  const floorChecks=floorCollisionReport(result),ordered=[...result].sort((a,b)=>a.number-b.number);for(const b of ordered){const row=document.createElement('tr');row.dataset.bendNumber=b.number;[ `Biegung ${b.number}`,`${b.position.toFixed(1)} mm`,`${(b.angle*180/Math.PI).toFixed(0)}°`,`${(b.radius??activeProfile.radius).toFixed(0)} mm`,`${b.rotation.toFixed(0)}°` ].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell)});const check=floorChecks.find(x=>x.number===b.number),floorCell=document.createElement('td');floorCell.dataset.floorCollision='';floorCell.className=check.collision?'floor-warning':check.turnRisk?'floor-turn-warning':'';floorCell.textContent=check.collision?'Fehler: Bodenkontakt beim Biegen · '+Math.abs(check.clearance).toFixed(1)+' mm · in dieser Biegerichtung nicht biegbar':check.turnRisk?'Hinweis: Bodenkontakt während der Drehung · '+Math.abs(check.turnClearance).toFixed(1)+' mm':'Bodenabstand ca. '+check.clearance.toFixed(1)+' mm';row.append(floorCell);const machineCell=document.createElement('td');machineCell.dataset.machineCollision='';machineCell.textContent='Wird geprüft …';row.append(machineCell);rows.append(row)}
  const floorWarnings=floorChecks.filter(x=>x.collision),turnWarnings=floorChecks.filter(x=>!x.collision&&x.turnRisk);el('floorCollisionSummary').textContent=machineSettings.name+' · Bodenprüfung · Rohrmittellinie '+machineSettings.centerHeight+' mm · waagerechte Biegeebene · '+(machineSettings.bendDirection==='clockwise'?'Biegung im Uhrzeigersinn':'Biegung gegen Uhrzeigersinn')+'. '+(floorWarnings.length?'Fehler: Bodenkontakt beim Biegen bei Biegung '+floorWarnings.map(x=>x.number).join(', ')+'. In dieser Biegerichtung kann das Rohr nicht gebogen werden. ':'Keine Bodenberührung im berechneten Bewegungsablauf erkannt. ')+(turnWarnings.length?'Hinweis: Beim Drehen für Biegung '+turnWarnings.map(x=>x.number).join(', ')+' wird der Boden berührt; die Drehbewegung muss angepasst werden. ':'')+'Prüfung des simulierten Ablaufs einschließlich Futterdrehung und Rohrdurchmesser; Bodenkontakt beim Drehen wird als Hinweis gewertet, beim Biegen als Fehler. Maschinenkontakte stehen in der Spalte Maschinenkontakte.';pdf.disabled=false;status.textContent=`${result.length} Biegung${result.length===1?'':'en'} · Futterstellung ab 0°; positive Winkel ${machineSettings.chuckRotationDirection==='clockwise'?'im Uhrzeigersinn':'gegen Uhrzeigersinn'}.`;footer.textContent=`Biegedaten: ${result.length} Biegung${result.length===1?'':'en'}`;if(el('bendDataDialog').open)checkBendDataMachine();
 }
 function updateSawLength(){const out=el('sawLengthResult'),hint=el('cutAllowanceResult');hint.textContent='';if(stepMeshes.length&&!activeProfile){out.textContent='STEP-Vorschau: CAD-Abmessungen siehe Hinweis';return}if(!activeProfile||!segments.length){out.textContent='Sägelänge: noch nicht berechnet';return}const result=sawLengthWithChuck();if(!result){out.textContent='Sägelänge: Maße vollständig eingeben';return}if(result.error){out.textContent=`Sägelänge: ${result.error}`;return}out.textContent=activeProfile.importedFromStep?`Sägelänge inkl. Einspannzugabe: ${result.length.toFixed(1)} mm · ${result.bends} Biegungen`:`Sägelänge: ${result.length.toFixed(1)} mm · ${result.bends} Biegungen (geschätzt)`;if(result.chuckExtension>0)hint.textContent=`Einspannzugabe +${result.chuckExtension.toFixed(1)} mm · Überstand nach dem Biegen abschneiden`}
 async function importStepFile(file){if(!file)return;if((segments.length||stepMeshes.length)&&!confirm('Die aktuelle Zeichnung wird durch die STEP-Datei ersetzt. Fortfahren?'))return;const prompt=el('prompt');prompt.textContent=`STEP-Datei wird eingelesen: ${file.name}`;try{if(typeof window.occtimportjs!=='function')throw new Error('Der STEP-Leser konnte nicht geladen werden.');if(!occtPromise){const options={locateFile:name=>new URL(`./vendor/occt-import-js/${name}`,document.baseURI).href};if(window.rohrPlanDesktop?.readStepRuntime)options.wasmBinary=await window.rohrPlanDesktop.readStepRuntime();occtPromise=window.occtimportjs(options)}const occt=await occtPromise,stepText=await file.text(),result=occt.ReadStepFile(new Uint8Array(await file.arrayBuffer()),{linearUnit:'millimeter',linearDeflectionType:'absolute_value',linearDeflection:.45,angularDeflection:.35}),meshes=(result?.meshes||[]).filter(mesh=>(mesh.attributes?.position?.array?.length||0)>=9&&(mesh.index?.array?.length||0)>=3);if(!result?.success||!meshes.length)throw new Error('In der Datei wurde keine darstellbare 3D-Geometrie gefunden.');reverseBendOrder=false;stepMeshes=meshes;stepFileName=file.name;undoHistory=[];redoHistory=[];const stepGeometry=recognizeStepTube(stepText)||recognizeStepU(stepText,meshes);if(stepGeometry){stepGeometry.wall=Math.round(stepGeometry.wall);stepGeometry.radius=Math.round(stepGeometry.radius)}const matchedProfile=stepGeometry&&profiles.find(profile=>Math.abs(Number(profile.diameter)-stepGeometry.diameter)<=.1&&Math.round(Number(profile.wall))===stepGeometry.wall&&Math.round(Number(profile.radius))===stepGeometry.radius&&(stepGeometry.bends||[]).every(bend=>Math.round(bend.radius)===Math.round(Number(profile.radius))));const recognized=matchedProfile?stepGeometry:null;segments=recognized?recognized.route.map(item=>({kind:'pipe',dir:item.dir,drawLength:item.length,length:item.length})):[];if(recognized)for(const bend of recognized.bends||[])if(segments[bend.cornerIndex+1])segments[bend.cornerIndex+1].bendRadius=bend.radius;activeProfile=matchedProfile?{...matchedProfile,wall:stepGeometry.wall,radius:stepGeometry.radius,theoreticalSampleLength:0,correctionPer90:0,importedFromStep:true}:null;if(recognized){let p=[0,0,0];points=[p];for(const segment of segments){segment.from=[...p];segment.to=add(p,mul(segment.dir,segment.drawLength));p=[...segment.to];points.push([...p])}}previousDir=offsetPreviousDir=continuationDir=null;offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=null;dimensionMode=false;dimensionInputs=[];el('dimensionFields').replaceChildren();drawingPaused=true;hover=null;currentIsometryId=null;el('toolMode').textContent=recognized?'STEP · ROHR':'STEP-VORSCHAU';el('activeProfileLabel').textContent=activeProfile?profileName(activeProfile):'CAD-Modell';el('modeText').textContent=recognized?'STEP-Rohr · Biegedaten erkannt':'STEP-3D-Vorschau';el('dimension').querySelector('.ribbon-label').textContent='Bemaßen';el('dimension').disabled=true;el('undo').disabled=true;const size=fitImportedModel();prompt.innerHTML=recognized?`<b>Rohr erkannt</b> · ${recognized.bends?.length||segments.length-1} Biegungen aus STEP übernommen und dem passenden Rohrdatensatz zugeordnet. Mittlere Maustaste dreht die Ansicht, Mausrad zoomt.`:stepGeometry?`<b>Keine Biegedaten erstellt</b> · Erkannte Maße Ø ${stepGeometry.diameter.toFixed(1)} × ${stepGeometry.wall} mm, Biegeradius ${stepGeometry.radius} mm. Lege zuerst einen passenden Rohrdatensatz an und lade die STEP-Datei erneut.`:'<b>STEP-Vorschau</b> · Mittlere Maustaste dreht die Ansicht, Mausrad zoomt. Aus dieser Geometrie konnten keine Rohr-Biegedaten erkannt werden.';el('progress').textContent=recognized?`STEP erkannt · Ø ${recognized.diameter.toFixed(1)} × ${recognized.wall} mm · R ${recognized.radius} mm · ${recognized.bends?.length||segments.length-1} Biegungen`:stepGeometry?`STEP · kein passender Rohrdatensatz · Ø ${stepGeometry.diameter.toFixed(1)} × ${stepGeometry.wall} mm · R ${stepGeometry.radius} mm`:`STEP-Datei · ${file.name}`;if(recognized)updateSawLength();else el('sawLengthResult').textContent=size?`CAD-Abmessungen X × Y × Z: ${size.map(v=>v.toFixed(1)).join(' × ')} mm`:`STEP-Datei geladen: ${file.name}`;updateBendPositions();updateProjectControls();refreshHistoryControls();render()}catch(error){prompt.textContent=`STEP-Import fehlgeschlagen: ${error.message}`;occtPromise=null;console.error('RohrPlan STEP import failed:',error)}finally{el('stepFileInput').value=''}}
 el('importStep').onclick=()=>el('stepFileInput').click();el('stepFileInput').addEventListener('change',event=>importStepFile(event.target.files?.[0]));el('clear').addEventListener('click',()=>{if(!stepMeshes.length)return;stepMeshes=[];stepFileName='';points=[[0,0,0]];target=[0,0,0];scale=34;zoom=1;pan=[0,0];el('toolMode').textContent='ROHR WÄHLEN';el('activeProfileLabel').textContent='Kein Rohr gewählt';el('modeText').textContent='Normales Rohrstück';el('dimension').disabled=false;el('undo').disabled=false},{capture:true});

 const pipeTabsStorageKey='rohrplan.open-pipes.v1';let pipeTabsReady=false,pipeTabSaveTimer=null,pipeTabSaveFailed=false;
 function schedulePipeTabSave(){if(!pipeTabsReady)return;clearTimeout(pipeTabSaveTimer);pipeTabSaveTimer=setTimeout(saveOpenPipeTabs,400)}
 function saveOpenPipeTabs(){
  if(!pipeTabsReady)return;clearTimeout(pipeTabSaveTimer);
  try{
   pipeTabs[activePipeTab]=pendingPipeSnapshot||capturePipeTab(false);
   const payload={version:1,activeTab:activePipeTab,tabs:pipeTabs};
   localStorage.setItem(pipeTabsStorageKey,JSON.stringify(payload,(_key,value)=>ArrayBuffer.isView(value)?Array.from(value):value));pipeTabSaveFailed=false
  }catch(error){if(!pipeTabSaveFailed){pipeTabSaveFailed=true;alert('Die offenen Rohr-Tabs konnten nicht automatisch gespeichert werden. Bitte die Zeichnungen über „Isometrie speichern“ sichern. '+error.message)}}
 }
 function restoreOpenPipeTabs(){
  try{
   const raw=localStorage.getItem(pipeTabsStorageKey);if(!raw)return false;const saved=JSON.parse(raw);
   if(saved.version!==1||!Array.isArray(saved.tabs)||!saved.tabs.length||!saved.tabs.every(tab=>tab&&typeof tab.name==='string'&&tab.data&&Array.isArray(tab.data.segments)&&Array.isArray(tab.data.points)&&Array.isArray(tab.data.undoHistory)&&Array.isArray(tab.data.redoHistory)&&tab.hud))return false;
   pipeTabs.splice(0,pipeTabs.length,...saved.tabs.map(tab=>({...tab,stepMeshes:tab.stepMeshes||[]})));
   if(saved.project?.formatVersion===1&&Array.isArray(saved.project.isometries)&&!localStorage.getItem('rohrplan.legacy-project-backup.v1'))localStorage.setItem('rohrplan.legacy-project-backup.v1',JSON.stringify(saved.project));
   const index=Number.isInteger(saved.activeTab)&&saved.activeTab>=0&&saved.activeTab<pipeTabs.length?saved.activeTab:0;
   switchPipeTab(index,true);return true
  }catch(error){console.warn('Rohr-Tabs konnten nicht wiederhergestellt werden:',error);return false}
 }
 const pipeTabs=[];let activePipeTab=0,pendingPipeSnapshot=null,currentPipeTabId=globalThis.crypto?.randomUUID?.()||String(Date.now()),savedPipeSignature=null,pendingClosePipeId=null;
 function capturePipeTab(finishDimensions=true){
  if(finishDimensions&&dimensionMode)stopDimensioning(true);
  return {tabId:currentPipeTabId,savedSignature:savedPipeSignature,data:JSON.parse(JSON.stringify({reverseBendOrder,yaw,pitch,scale,zoom,pan,target,points,segments,previousDir,offsetPreviousDir,continuationDir,offsetStage,offsetDir,offsetSideDir,offsetAnchor,offsetRSteps,offsetHSteps,ghostDir,ghostEnd,ghostSteps,drawingPaused,activeProfile,currentIsometryId,currentIsometryProjectKey,undoHistory,redoHistory,stepFileName})),stepMeshes,name:el('currentIsometryName').value,hud:Object.fromEntries(['toolMode','modeText','prompt','progress','sawLengthResult'].map(id=>[id,el(id).innerHTML]))}
 }
 function pipeContentSignature(){const data=serializeIsometry(el('currentIsometryName').value,null);return JSON.stringify({name:data.name,profile:data.profile,segments:data.segments,reverseBendOrder:data.reverseBendOrder})}
 function markPipeSaved(){savedPipeSignature=pipeContentSignature();pipeTabs[activePipeTab]=capturePipeTab(false);renderPipeTabs();saveOpenPipeTabs();if(pendingClosePipeId===currentPipeTabId){pendingClosePipeId=null;removeActivePipeTab()}}
 function removeActivePipeTab(){
  pipeTabs.splice(activePipeTab,1);pendingClosePipeId=null;
  if(!pipeTabs.length){
   const blank=capturePipeTab(false);blank.tabId=globalThis.crypto?.randomUUID?.()||String(Date.now());blank.savedSignature=null;blank.name='Rohr 1';blank.stepMeshes=[];
   Object.assign(blank.data,{reverseBendOrder:false,segments:[],points:[[0,0,0]],activeProfile:null,currentIsometryId:null,currentIsometryProjectKey:null,undoHistory:[],redoHistory:[],stepFileName:'',previousDir:null,offsetPreviousDir:null,continuationDir:null,offsetStage:0,offsetDir:null,offsetSideDir:null,offsetAnchor:null,drawingPaused:true,yaw:Math.PI/4,pitch:Math.atan(1/Math.sqrt(2)),scale:34,zoom:1,pan:[0,0],target:[0,0,0]});blank.hud.toolMode='ROHR WÄHLEN';pipeTabs.push(blank)
  }
  switchPipeTab(Math.min(activePipeTab,pipeTabs.length-1),true);saveOpenPipeTabs()
 }
 function requestPipeCloseChoice(){return new Promise(resolve=>{const dialog=el('closePipeDialog');dialog.returnValue='cancel';el('closePipeMessage').textContent='„'+el('currentIsometryName').value+'“ enthält ungespeicherte Änderungen. Möchtest du sie vor dem Schließen speichern?';dialog.addEventListener('close',()=>resolve(dialog.returnValue),{once:true});dialog.showModal()})}
 async function closePipeTab(index){
  if(el('closePipeDialog').open)return;switchPipeTab(index);if(dimensionMode)stopDimensioning(true);
  const changed=(segments.length>0||stepMeshes.length>0||savedPipeSignature!=null)&&pipeContentSignature()!==savedPipeSignature;
  if(changed){const choice=await requestPipeCloseChoice();if(choice==='cancel')return;if(choice==='save'){pendingClosePipeId=currentPipeTabId;await saveCurrentIsometry();return}}
  removeActivePipeTab()
 }
 function renderPipeTabs(){
  const list=el('pipeTabs');list.replaceChildren();
  pipeTabs.forEach((tab,index)=>{const name=index===activePipeTab?el('currentIsometryName').value:tab.name,wrap=document.createElement('div');wrap.className='pipe-tab-wrap';wrap.classList.toggle('active',index===activePipeTab);const button=document.createElement('button');button.type='button';button.className='pipe-tab';button.role='tab';button.setAttribute('aria-selected',String(index===activePipeTab));button.textContent=name;button.onclick=()=>switchPipeTab(index);const close=document.createElement('button');close.type='button';close.className='pipe-tab-close';close.textContent='×';close.title='Rohr schließen';close.setAttribute('aria-label',name+' schließen');close.onclick=()=>closePipeTab(index);wrap.append(button,close);list.append(wrap)});
  const add=document.createElement('button');add.type='button';add.className='pipe-tab-add';add.textContent='+ Neues Rohr';add.onclick=()=>showProfileDialog(true);list.append(add)
 }
 function switchPipeTab(index,restore=false){
  if(index===activePipeTab&&!restore)return;if(!restore)pipeTabs[activePipeTab]=capturePipeTab();activePipeTab=index;
  const tab=pipeTabs[index],d=JSON.parse(JSON.stringify(tab.data));currentPipeTabId=tab.tabId||(globalThis.crypto?.randomUUID?.()||String(Date.now()));savedPipeSignature=tab.savedSignature??null;
  reverseBendOrder=d.reverseBendOrder===true;({yaw,pitch,scale,zoom,pan,target,points,segments,previousDir,offsetPreviousDir,continuationDir,offsetStage,offsetDir,offsetSideDir,offsetAnchor,offsetRSteps,offsetHSteps,ghostDir,ghostEnd,ghostSteps,drawingPaused,activeProfile,currentIsometryId,currentIsometryProjectKey,undoHistory,redoHistory,stepFileName}=d);
  stepMeshes=tab.stepMeshes;dimensionMode=false;dimensionInputs=[];hover=null;dragging=false;el('dimensionFields').replaceChildren();el('currentIsometryName').value=tab.name;el('activeProfileLabel').textContent=activeProfile?profileName(activeProfile):stepMeshes.length?'CAD-Modell':'Kein Rohr gewählt';el('dimension').querySelector('.ribbon-label').textContent=drawingPaused?'Weiterzeichnen':'Bemaßen';el('dimension').disabled=stepMeshes.length>0;
  el('toolMode').innerHTML=tab.hud.toolMode;updatePrompt();updateSawLength();updateBendPositions();updateProjectControls();refreshHistoryControls();if(stepMeshes.length)for(const [id,value]of Object.entries(tab.hud))el(id).innerHTML=value;
  renderPipeTabs();render()
 }
 function showProfileDialog(newPipe=false){if(newPipe)pendingPipeSnapshot=capturePipeTab();pendingPipeChange=newPipe;hover=null;el('dimensionFields').replaceChildren();if(dimensionMode)stopDimensioning(false);drawingPaused=true;refreshProfileOptions();el('profileDialog').showModal();render()}
 function beginSelectedPipe(){const selected=profiles.find(p=>p.id===el('profileSelect').value);if(!selected)return;if(pendingPipeChange&&(activeProfile||segments.length||stepMeshes.length)){pipeTabs[activePipeTab]=pendingPipeSnapshot||capturePipeTab();activePipeTab=pipeTabs.length;pipeTabs.push(null)}pendingPipeSnapshot=null;currentPipeTabId=globalThis.crypto?.randomUUID?.()||String(Date.now());savedPipeSignature=null;reverseBendOrder=false;undoHistory=[];redoHistory=[];segments=[];stepMeshes=[];stepFileName='';points=[[0,0,0]];currentIsometryId=null;currentIsometryProjectKey=null;el('currentIsometryName').value=`Rohr ${activePipeTab+1}`;previousDir=offsetPreviousDir=continuationDir=null;offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=null;dimensionMode=false;dimensionInputs=[];activeProfile=selected;el('activeProfileLabel').textContent=profileName(selected);el('profileDialog').close();pendingPipeChange=false;drawingPaused=false;hover=null;el('toolMode').textContent='ZEICHNEN · 3D';yaw=Math.PI/4;pitch=Math.atan(1/Math.sqrt(2));zoom=1;pan=[0,0];recalc();updatePrompt();updateSawLength();render();pipeTabs[activePipeTab]=capturePipeTab();renderPipeTabs()}
 function updatePrompt(){const p=el('prompt'),m=el('modeText');const issue=segments.find(s=>s.fixedAngleError);if(issue){p.textContent=issue.fixedAngleError;m.textContent='Offset-Maße prüfen'}else if(dimensionMode){p.innerHTML='<b>Bemaßung</b> · Werte eingeben und mit Enter zum nächsten Feld.';m.textContent='Maße eingeben'}else if(drawingPaused&&!activeProfile){p.innerHTML='<b>Rohr auswählen</b> · Wähle zuerst den Datensatz für diese Zeichnung.';m.textContent='Rohrdatensatz wählen'}else if(drawingPaused){p.innerHTML='<b>Bemaßung abgeschlossen</b> · Maßzahl doppelklicken zum Ändern, „Weiterzeichnen“ setzt den Verlauf fort.';m.textContent='Bereit zum Weiterzeichnen'}else if(offsetStage===1){p.innerHTML='<b>Offset · 2D oder 3D</b> · Seitlichen Versatz wählen: Linksklick beendet 2D, Rechtsklick legt R fest und ergänzt V.';m.textContent='Offset · H'}else if(offsetStage===2){p.innerHTML='<b>Offset · dritte Achse</b> · Höhenversatz wählen: Rechtsklick beendet 3D, Linksklick beendet ohne V als 2D.';m.textContent='Offset · R / optional V'}else{p.innerHTML='<b>Zeichnen bereit</b> · Links klicken setzt eine Strecke; Maßzahl doppelklicken zum Ändern.';m.textContent='Normales Rohrstück'}el('progress').textContent=`Rohrstücke: ${segments.length}`}
 canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(drawingPaused||dimensionMode)return;if(offsetStage===2)moveEnd(mouse,true);commit('offset')});canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect(),pos=[e.clientX-r.left,e.clientY-r.top];if(dragging){if(dragMode==='pan'){pan[0]+=pos[0]-lastDrag[0];pan[1]+=pos[1]-lastDrag[1]}else{yaw+=(pos[0]-lastDrag[0])*.009;pitch=Math.max(.12,Math.min(1.35,pitch+(pos[1]-lastDrag[1])*.008))}lastDrag=pos;render();return}if(!dimensionMode&&!drawingPaused)moveEnd(pos)});canvas.addEventListener('pointerdown',e=>{if(e.button===1){e.preventDefault();dragging=true;dragMode=e.shiftKey?'pan':'rotate';lastDrag=[e.offsetX,e.offsetY];canvas.setPointerCapture(e.pointerId)}});canvas.addEventListener('pointerup',e=>{if(e.button===1)finishViewDrag()});canvas.addEventListener('pointercancel',finishViewDrag);canvas.addEventListener('lostpointercapture',finishViewDrag);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.35,Math.min(3,zoom*Math.exp(-e.deltaY*.001)));render()},{passive:false});canvas.addEventListener('pointerleave',()=>{if(!dragging&&!dimensionMode){if(!drawingPaused)hover=null;render()}});canvas.addEventListener('click',e=>{if(e.button!==0||e.detail>1)return;const rect=canvas.getBoundingClientRect(),pos=[e.clientX-rect.left,e.clientY-rect.top];if(!dimensionMode&&findDimensionItemAt(pos))return;commit('pipe')});canvas.addEventListener('dblclick',e=>{const rect=canvas.getBoundingClientRect(),pos=[e.clientX-rect.left,e.clientY-rect.top];if(editDimensionAt(pos))e.preventDefault()});
 el('openBendData').onclick=()=>{updateBendPositions();if(!el('bendDataDialog').open)el('bendDataDialog').showModal();if(!el('exportBendDataPdf').disabled)checkBendDataMachine()};el('applyRecommendedBendOrder').onclick=()=>{if(recommendedBendOrder==null)return;reverseBendOrder=recommendedBendOrder;updateSawLength();updateBendPositions();render();saveOpenPipeTabs()};el('reverseBendOrder').onclick=()=>{reverseBendOrder=!reverseBendOrder;updateSawLength();updateBendPositions();render();saveOpenPipeTabs()};el('closeBendData').onclick=()=>el('bendDataDialog').close();el('exportBendDataPdf').onclick=async()=>{if(el('exportBendDataPdf').disabled)return;const report=await checkBendDataMachine();if(!report||!el('bendDataDialog').open||el('exportBendDataPdf').disabled)return;const oldTitle=document.title;document.title='RohrPlan - Biegedaten';document.body.classList.add('print-bend-data');try{if(window.rohrPlanDesktop?.exportBendDataPdf){await window.rohrPlanDesktop.exportBendDataPdf()}else{window.addEventListener('afterprint',()=>{document.body.classList.remove('print-bend-data');document.title=oldTitle},{once:true});window.print()}}catch(error){alert(`PDF konnte nicht erstellt werden: ${error.message}`)}finally{document.body.classList.remove('print-bend-data');document.title=oldTitle}};el('dimension').onclick=()=>dimensionMode?stopDimensioning(true):drawingPaused?resumeDrawing():startDimensioning();el('undo').onclick=undoSegments;el('redo').onclick=redoSegments;el('openSegments').onclick=()=>{renderSegmentEditor();el('segmentEditDialog').showModal()};el('closeSegmentEditor').onclick=()=>el('segmentEditDialog').close();el('clear').onclick=()=>{if(segments.length)rememberHistory();segments=[];points=[[0,0,0]];previousDir=offsetPreviousDir=continuationDir=null;offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=null;if(dimensionMode)stopDimensioning(false);drawingPaused=!activeProfile;el('dimension').querySelector('.ribbon-label').textContent='Bemaßen';target=[0,0,0];scale=34;updatePrompt();updateSawLength();updateBendPositions();refreshHistoryControls();render()};
 el('profileSelect').addEventListener('change',()=>{el('startPipe').disabled=!el('profileSelect').value});el('profileList').addEventListener('click',e=>{const button=e.target.closest('.delete-profile');if(button)deleteProfile(button.dataset.profileId)});el('openManager').onclick=()=>{el('profileDialog').close();renderProfileList();el('manageDialog').showModal()};el('closeManager').onclick=()=>{el('manageDialog').close();refreshProfileOptions();if(!activeProfile&&!stepMeshes.length||pendingPipeChange)el('profileDialog').showModal()};el('addProfile').onclick=()=>{el('manageDialog').close();el('recordForm').reset();updateCalibrationPreview();el('recordDialog').showModal()};el('cancelRecord').onclick=()=>{el('recordDialog').close();renderProfileList();el('manageDialog').showModal()};el('cancelProfile').onclick=()=>el('profileDialog').close();el('profileDialog').addEventListener('close',()=>{if(pendingPipeSnapshot&&!el('manageDialog').open&&!el('recordDialog').open&&!el('profileDialog').open){drawingPaused=pendingPipeSnapshot.data.drawingPaused;pendingPipeSnapshot=null;pendingPipeChange=false;updatePrompt();render()}});el('startPipe').onclick=beginSelectedPipe;el('newPipe').onclick=()=>showProfileDialog(true);['recordDiameter','recordRadius','recordStartLength','recordLeg1','recordLeg2','recordLeg3'].forEach(id=>el(id).addEventListener('input',updateCalibrationPreview));
 el('recordForm').addEventListener('submit',async e=>{e.preventDefault();const v={diameter:Number(el('recordDiameter').value),wall:Number(el('recordWall').value),radius:Number(el('recordRadius').value),sampleLength:Number(el('recordStartLength').value),legs:[Number(el('recordLeg1').value),Number(el('recordLeg2').value),Number(el('recordLeg3').value)]};if(![v.diameter,v.wall,v.radius,v.sampleLength,...v.legs].every(Number.isFinite)||!v.legs.every(x=>x>0)||![v.diameter,v.wall,v.radius,v.sampleLength].every(x=>x>0)){alert('Bitte alle Werte größer als 0 eingeben.');return}if(profiles.some(p=>p.diameter===v.diameter&&p.wall===v.wall&&p.radius===v.radius)){alert('Für diesen Durchmesser, diese Wandstärke und diesen Biegeradius gibt es bereits einen Datensatz.');return}const cal=calibration(v),record={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`,...v,theoreticalSampleLength:cal.theoretical,correctionPer90:cal.per90,bendCount:2,bendAngle:90,createdAt:new Date().toISOString()};if(!await persistProfiles([...profiles,record]))return;refreshProfileOptions();renderProfileList();el('recordDialog').close();el('manageDialog').showModal()});
 function currentSimulationPayload(){const bends=bendPositions(),cut=sawLengthWithChuck();if(!Array.isArray(bends)||!bends.length||!cut||cut.error)throw new Error('Bitte zuerst ein Rohr mit vollständigen Maßen und mindestens einer Biegung erstellen.');return {format:'rohrplan-bend-simulation',version:1,name:el('currentIsometryName').value,tubeOuterDiameter:activeProfile.diameter,cutLength:cut.length,centerHeight:machineSettings.centerHeight,machineProfile:window.RohrPlanMachines.getActive(),tooling:window.RohrPlanMachines.getTooling(),reverseBendOrder,bends:bends.map(b=>({number:b.number,angleDegrees:b.angle*180/Math.PI,radius:b.radius,position:b.position,rotation:b.rotation}))};}
 el('exportSimulation').onclick=()=>{try{const payload=currentSimulationPayload(),url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=(payload.name||'Rohr')+'-Simulation.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){alert(error.message);}};
 function sendSimulationPayload(){const payload=currentSimulationPayload();el('simulationPipeName').textContent=payload.machineProfile.name+' · Biegen: '+(payload.machineProfile.bendDirection==='clockwise'?'Uhrzeigersinn':'Gegen Uhrzeigersinn')+' · Futter +: '+(payload.machineProfile.chuckRotationDirection==='clockwise'?'Uhrzeigersinn':'Gegen Uhrzeigersinn')+' · '+payload.name+' · Ø '+payload.tubeOuterDiameter+' mm · '+payload.bends.length+' Biegungen';el('simulationFrame').contentWindow.postMessage({type:'rohrplan-simulation-load',payload},'*');}
 el('openSimulation').onclick=()=>{try{currentSimulationPayload();const frame=el('simulationFrame');frame.onload=()=>{try{sendSimulationPayload();}catch(error){alert(error.message);}};frame.src='./TUBOBEND_48_Modellvorschau.html?embedded=1&version=chuck-20261006-1';el('simulationDialog').showModal();}catch(error){alert(error.message);}};
 window.addEventListener('message',event=>{if(event.source===el('simulationFrame').contentWindow&&event.data?.type==='rohrplan-simulation-close')el('simulationDialog').close();});
 el('closeSimulation').onclick=()=>el('simulationDialog').close();el('simulationDialog').addEventListener('close',()=>{el('simulationFrame').contentWindow?.postMessage({type:'rohrplan-simulation-stop'},'*');});
 el('openProjects').onclick=openProjectsDialog;el('closeProjectDialog').onclick=()=>el('projectDialog').close();el('projectDialog').addEventListener('close',()=>{pendingClosePipeId=null});el('createProjectFolder').onclick=createProjectFolder;el('openProjectFolder').onclick=openProjectFolder;el('connectProjectsRoot').onclick=connectProjectsRoot;el('refreshProjectFolders').onclick=()=>refreshProjectFolders(true).then(async()=>{if(projectDirectoryHandle)await activateProject(projectDirectoryHandle);}).catch(error=>{if(error.name!=='AbortError')el('projectRootStatus').textContent='Ordnerliste konnte nicht geladen werden: '+error.message;});el('saveCurrentToProject').onclick=saveIsometryToProject;el('saveIsometry').onclick=saveCurrentIsometry;el('openIsometryFile').onclick=()=>el('isometryFileInput').click();el('isometryFileInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(file)await openIsometryFile(file);e.target.value=''});el('projectIsometryList').addEventListener('click',e=>{const button=e.target.closest('[data-project-action]');if(!button)return;const id=button.dataset.id;if(button.dataset.projectAction==='load')loadProjectIsometry(id);if(button.dataset.projectAction==='delete')deleteProjectIsometry(id)});el('clear').addEventListener('click',()=>{currentIsometryId=null;currentIsometryProjectKey=null;updateProjectControls()});
 el('openShortcuts').onclick=()=>{if(!el('shortcutsDialog').open)el('shortcutsDialog').showModal();};el('closeShortcuts').onclick=()=>el('shortcutsDialog').close();
 window.addEventListener('keydown',e=>{if(e.defaultPrevented||e.repeat)return;if(e.key==='F1'){e.preventDefault();el('openShortcuts').click();return;}if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;if(e.target instanceof Element&&(e.target.closest('input,textarea,select,[contenteditable]')||document.querySelector('dialog[open]')))return;const actions={b:'dimension',d:'openBendData',s:'openSimulation',e:'openSegments',m:'openMasterData'};const key=e.key.toLowerCase();if(actions[key]){e.preventDefault();el(actions[key]).click();}else if(key==='i'){e.preventDefault();yaw=Math.PI/4;pitch=Math.atan(1/Math.sqrt(2));pan=[0,0];zoom=1;render();schedulePipeTabSave();}});
 window.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const key=e.key.toLowerCase(),isField=e.target instanceof Element&&e.target.matches('input,textarea,select,[contenteditable="true"]');if((key==='z'||key==='y')&&isField)return;if(key==='s'){e.preventDefault();el('saveIsometry').click()}else if(key==='o'){e.preventDefault();el('openProjects').click()}else if(key==='n'){e.preventDefault();el('newPipe').click()}else if(key==='z'){e.preventDefault();if(e.shiftKey)redoSegments();else undoSegments()}else if(key==='y'){e.preventDefault();redoSegments()}else if(key==='p'){e.preventDefault();el('openBendData').click();if(!el('exportBendDataPdf').disabled)el('exportBendDataPdf').click()}});

 el('viewISO').onclick=()=>{yaw=Math.PI/4;pitch=Math.atan(1/Math.sqrt(2));pan=[0,0];zoom=1;render();};
 el('fitView').onclick=()=>{pan=[0,0];zoom=1;if(stepMeshes.length)fitImportedModel();else resizeTarget();render();};
 el('zoomIn').onclick=()=>{zoom=Math.min(3,zoom*1.2);render();};
 el('zoomOut').onclick=()=>{zoom=Math.max(.35,zoom/1.2);render();};
 el('toggleGrid').onclick=()=>{gridVisible=!gridVisible;el('toggleGrid').setAttribute('aria-pressed',String(gridVisible));el('gridText').textContent=gridVisible?'Fangraster · X / Y / Z':'Raster ausgeblendet';render();};
 if(typeof ResizeObserver==='function')new ResizeObserver(resize).observe(el('stage'));
 pipeTabs.push(capturePipeTab());renderPipeTabs();el('currentIsometryName').addEventListener('input',renderPipeTabs);loadMachineSettings();window.RohrPlanMachines.subscribe(()=>{loadMachineSettings();updateBendPositions();if(el('simulationDialog').open){try{sendSimulationPayload();}catch(error){el('simulationDialog').close();alert(error.message);}}});el('openMasterData').onclick=()=>{renderProfileList();el('machineSettingsStatus').textContent=window.RohrPlanMachines.getLoadError();el('manageDialog').showModal()};await loadProfiles();refreshProfileOptions();renderProfileList();refreshHistoryControls();resize();updatePrompt();updateBendPositions();updateProjectControls();const tabsRestored=restoreOpenPipeTabs();pipeTabsReady=true;restoreRememberedProject();if(!tabsRestored||!activeProfile&&!stepMeshes.length)el('profileDialog').showModal();window.addEventListener('pagehide',saveOpenPipeTabs);window.addEventListener('beforeunload',saveOpenPipeTabs);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveOpenPipeTabs()});document.addEventListener('input',schedulePipeTabSave);window.addEventListener('resize',resize);window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.querySelector('dialog[open]'))return;if(dimensionMode)stopDimensioning(true);else if(offsetStage){offsetStage=0;offsetDir=offsetSideDir=offsetAnchor=offsetPreviousDir=null;updatePrompt();render()}}});
})();
