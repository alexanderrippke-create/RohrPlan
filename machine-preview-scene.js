/* Shaded 3D scene of the bending machine for the model preview.
 * Measured values come from the machine profile. Proportions that are not
 * measured (control box, castors, clamp housing, pressure die) are schematic
 * and stay inside the measured envelopes. Uses the globals of the preview page.
 */
(()=>{
 'use strict';
 const renderer=window.RohrPlanView3D.create(),machines=window.RohrPlanMachines,el=id=>document.getElementById(id);
 const C={floor:'#e6ebe7',blue:'#3688cf',beige:'#d8d3bf',plate:'#c9d2d6',white:'#f3f5f4',red:'#c8392b',black:'#2c3033',dark:'#42484d',steelDark:'#687177',steel:'#8b949a',steelLight:'#aeb7bc',die:'#7c858b',dieCore:'#5d666c',ghost:'#b9c6d1',tube:'#1d9a68',tubeTurn:'#d48c14',tubeError:'#d63828'};
 let detailNote='';
 function thin(points,step){
  const out=[points[0]];
  for(let i=1;i<points.length-1;i++){const a=out.at(-1),b=points[i];if(Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])>=step)out.push(b);}
  out.push(points.at(-1));return out;
 }
 function tubeInfo(motion){
  if(sequence){
   let lowest=0;for(const p of motion.points)lowest=Math.min(lowest,p[2]);
   const clearance=sequence.height+lowest-sequence.diameter/2,turning=motion.message.includes('Futterdrehung'),status=el('sequenceStatus');
   status.textContent=motion.message+' · '+(clearance<=0?(turning?'Hinweis: Bodenkontakt beim Drehen · '+Math.abs(clearance).toFixed(1)+' mm':'Fehler: Bodenkontakt · in dieser Biegerichtung nicht biegbar · '+Math.abs(clearance).toFixed(1)+' mm'):'Bodenabstand '+clearance.toFixed(1)+' mm');
   status.style.color=clearance<=0?(turning?'#f3c46a':'#ff978b'):'';el('sequenceProgress').value=sequenceTime/sequence.duration*1000;
   return {points:motion.points,diameter:sequence.diameter,color:clearance<=0?(turning?C.tubeTurn:C.tubeError):C.tube};
  }
  const r=data.tooling.centerlineRadius,a=armAngle*Math.PI/180,feed=600,remaining=feed-r*a,steps=Math.max(1,Math.ceil(armAngle/2)),sign=machines.bendSign(data),points=[[-feed,0,0],[0,0,0]];
  for(let i=1;i<=steps;i++){const t=a*i/steps;points.push([r*Math.sin(t),-sign*r*(1-Math.cos(t)),0]);}
  const end=points.at(-1),tip=[end[0]+remaining*Math.cos(a),end[1]-sign*remaining*Math.sin(a),0];points.push(tip);
  return {points,diameter:data.tooling.tubeOuterDiameter,color:C.tube,tip};
 }
 function updateDetailNote(){
  const fields=machines.detailFields(),open=Object.entries(data.detailStatus||{}).filter(([,status])=>status!=='measured').map(([name])=>fields[name].label);
  const text=open.length?open.length+' Detailmaß(e) sind noch geschätzt oder offen: '+open.join(' · ')+'.':'Alle Detailmaße sind eingetragen.';
  if(text===detailNote)return;detailNote=text;
  const target=el('detailNote');if(!target)return;
  target.replaceChildren(document.createTextNode(text+' '));if(!open.length)return;
  if(document.body.classList.contains('embedded'))target.append('Eintragen unter Stammdaten → „Detailmaße eintragen“.');
  else{const link=document.createElement('a');link.href='./TUBOBEND_48_Detailmasse.html';link.textContent='Detailmaße eintragen';target.append(link);}
 }
 function draw(){
  const motion=sequence?sequenceGeometry(sequenceTime):null,radius=motion?.radius??data.tooling.centerlineRadius;
  const tube=tubeInfo(motion),tr=tube.diameter/2,s=machines.bendSign(data),F=p=>[p[0],s*p[1],p[2]];
  const part=id=>data.components.find(c=>c.id===id),m=data.collisionMeasurements.groups,d=data.details,floorZ=data.floorZ;
  const rs=Math.min(2,Math.max(1,ratio||1),Math.sqrt(1.6e6/Math.max(1,w*h))),scale=viewScale();
  renderer.begin(w*rs,h*rs,{yaw,pitch,scale:scale*rs,center:viewCenter(),originX:viewOrigin()[0]*rs,originY:viewOrigin()[1]*rs});

  const beam=part('guide-top');
  renderer.face([[beam.min[0]-300,-900,floorZ],[900,-900,floorZ],[900,900,floorZ],[beam.min[0]-300,900,floorZ]],C.floor);

  // Fixed body. y0…y1 is its range in the clockwise reference layout.
  const body=machines.bodyBounds(data,radius),y0=s>0?body.min[1]:-body.max[1],y1=s>0?body.max[1]:-body.min[1];
  const bx0=body.min[0],bx1=body.max[0],bz0=body.min[2],bz1=body.max[2],L=bx1-bx0,Wd=y1-y0,Hb=bz1-bz0;
  // Housing as on the photos, inside the measured outer box: full lower cabinet,
  // upper part without the rear corner towards the chuck and with the open
  // recess around the pedestal below the roll axis. Cut sizes are estimated.
  const housingPlanes=new Map(),split=bz1-d.housingNicheHeight;
  for(const column of machines.bodyBoxes(data,radius,'displayBoxes'))renderer.box(column.min,column.max,C.blue,undefined,housingPlanes);
  renderer.box([bx0+.06*L,y1,bz1-.55*Hb],[bx0+.46*L,y1+4,bz1-.04*Hb],C.beige,F);
  renderer.box([bx0+.58*L,y1,bz1-.3*Hb],[bx0+.92*L,y1+2,bz1-.08*Hb],C.plate,F);
  renderer.box([bx0+.05*L,y1-.3*Wd,bz1],[bx0+.4*L,y1-.04*Wd,bz1+5],C.beige,F);
  for(const x of [.52,.68])renderer.cylinder([bx0+x*L,y1-.17*Wd,0],2,Math.min(34,.065*L),bz1,bz1+8,C.white,F,20);
  renderer.cylinder([bx0+.3*L,y1-.1*Wd,0],2,14,bz1+5,bz1+24,C.red,F,16);
  const gap=bz0-floorZ;
  if(gap>25){
   const wheel=Math.min(100,gap/2);
   for(const x of [bx0+.14*L,bx1-.14*L])for(const y of [y0+.14*Wd,y1-.14*Wd]){
    renderer.cylinder([x,0,floorZ+wheel],1,wheel,y-22,y+22,C.black,F,20);
    renderer.box([x-.3*wheel,y-30,floorZ+wheel],[x+.3*wheel,y+30,bz0],C.steel,F);
   }
  }

  // Guide beam beside the tube axis, with the scale rail on the tube side.
  renderer.box(beam.displayMin,beam.displayMax,C.blue);
  const railY=s>0?beam.displayMin[1]:-beam.displayMax[1],beamTop=beam.displayMax[2];
  renderer.box([beam.min[0],railY,beamTop],[beam.max[0],railY+38,beamTop+5],C.steelLight,F);
  const supports=part('guide-supports').boxes;
  if(supports.length)for(const box of supports)renderer.box([box.min[0],box.min[1],floorZ],box.max,C.steel);
  else for(const x of [beam.min[0]+60,(beam.min[0]+beam.max[0])/2])renderer.box([x-35,beam.displayMin[1],floorZ],[x+35,beam.displayMax[1],beam.displayMin[2]],C.ghost);

  // Chuck with jaws, spindle neck and carriage with the clamping handle.
  const base=part('chuck-front'),length=base.length,rc=base.radius,rotation=motion?.rotation??0;
  const frontX=machines.chuckFront(data,tube.points[0][0]);
  // The measured front edge is the tip of the jaws, so nothing is drawn beyond frontX.
  const jawBack=frontX-machines.chuckJawDepth(data);
  renderer.cylinder([0,0,0],0,rc,frontX-.47*length,jawBack,C.steel);
  renderer.cylinder([0,0,0],0,rc*.6,frontX-.56*length,frontX-.47*length,C.steelDark);
  const jawInner=Math.max(.22*rc,tr+1);
  if(jawInner<.9*rc)for(let k=0;k<3;k++){
   const a=rotation+k*2*Math.PI/3,cos=Math.cos(a),sin=Math.sin(a);
   renderer.box([jawBack,-.14*rc,jawInner],[frontX,.14*rc,.95*rc],C.dark,p=>[p[0],p[1]*cos-p[2]*sin,p[1]*sin+p[2]*cos]);
  }
  const carriage=part('chuck-carriage'),plate=carriage.plate,handle=carriage.handle,top=plate.max[2];
  renderer.box([plate.min[0]+frontX,plate.min[1],plate.min[2]],[plate.max[0]+frontX,plate.max[1],.7*top],C.dark);
  const leverX=frontX+(plate.min[0]+plate.max[0])/2;
  renderer.box([leverX-8,-8,.7*top],[leverX+8,8,top-14],C.steel);renderer.box([leverX-8,-70,top-14],[leverX+8,70,top],C.steel);
  const handleX=frontX+(handle.min[0]+handle.max[0])/2,gripFrom=s>0?handle.max[1]-.45*(handle.max[1]-handle.min[1]):handle.min[1],gripTo=s>0?handle.max[1]:handle.min[1]+.45*(handle.max[1]-handle.min[1]);
  renderer.cylinder([handleX,0,12],1,11,handle.min[1],handle.max[1],C.steelLight,undefined,14);
  renderer.cylinder([handleX,0,12],1,17,gripFrom,gripTo,C.black,undefined,14);

  // Bending head. Local coordinates of the rotating parts: origin C, +Y along the arm.
  const A=machines.armTransform(data,radius,armAngle).toWorld;
  const reach=m.M1.reachFromRollAxis,maxW=m.M2.maxWidth,cylW=m.M2.cylinderWidth,armW=m.M2.armWidth,above=m.M3.aboveTubeCenter,below=m.M3.belowTubeCenter;
  const plateTop=-tr-6,clampEnd=radius+tr+55,cylStart=Math.min(Math.max(clampEnd+15,reach-d.clampCylinderLength),reach-30);
  if(split<-below)renderer.cylinder([0,-radius,0],2,85,split,-below,C.blue,F,28);
  if(-below<plateTop){
   renderer.cylinder([0,0,0],2,Math.max(radius+28,90),-below,plateTop,C.steelDark,A,36);
   renderer.box([-.45*maxW,0,-below],[.45*maxW,cylStart,plateTop],C.steel,A);
  }
  renderer.cylinder([0,0,0],2,radius,plateTop,-.55*tr,C.die,A,40);
  renderer.cylinder([0,0,0],2,Math.max(radius-.85*tr,.35*radius),-.55*tr,.55*tr,C.dieCore,A,40);
  renderer.cylinder([0,0,0],2,radius,.55*tr,tr+8,C.die,A,40);
  renderer.cylinder([0,0,0],2,Math.min(18,.4*radius),tr+8,tr+44,C.dark,A,16);
  const clampLength=Math.min(95,Math.max(55,2.2*tube.diameter)),cx=Math.min(clampLength/2+2,Math.max(0,maxW/2-cylW/2));
  renderer.box([2,radius+.25*tr,-tr-5],[2+clampLength,clampEnd,tr+14],C.dark,A);
  if(cylStart>clampEnd)renderer.box([cx-cylW/2-6,clampEnd,-46],[cx+cylW/2+6,cylStart,46],C.steelDark,A);
  renderer.cylinder([cx,0,0],1,cylW/2,cylStart,reach,C.steelLight,A,28);
  renderer.box([-armW/2,-22,tr+22],[armW/2,cylStart+15,tr+40],C.steelLight,A);
  // Fixed pressure die beside the tube, in front of the tangent point.
  renderer.box([-140,.25*tr,-tr-5],[-3,tr+62,tr+14],C.black,F);
  if(bz1<-tr-5)renderer.box([-140,.25*tr,bz1],[-.45*maxW-4,tr+150,-tr-5],C.steelDark,F);
  // The cover plate with the ball lever belongs to this fixed unit: it stands
  // on two posts on the chuck side of the roll axis and does not swing.
  if(above>tr+90){
   const plateZ=Math.max(tr+30,above-95),x0=-.45*maxW-70,x1=-.45*maxW-4,yPost=tr+185;
   for(const x of [x0+22,x1-22])renderer.cylinder([x,yPost,0],2,20,bz1,plateZ,C.steelDark,F,16);
   renderer.box([x0-5,tr+105,plateZ],[15,tr+265,plateZ+10],C.dark,F);
   renderer.cylinder([(x0+15)/2,tr+235,0],2,8,plateZ+10,above-34,C.steelDark,F,10);
   renderer.cylinder([(x0+15)/2,tr+235,0],2,19,above-38,above,C.dark,F,14);
  }

  renderer.tube(thin(tube.points,Math.max(2,tube.diameter/5)),tr,tube.color);
  ctx.clearRect(0,0,w,h);ctx.drawImage(renderer.finish(),0,0,w,h);

  // 2D overlays: axes, checked envelope and labels.
  ctx.save();ctx.globalAlpha=.65;poly([[beam.min[0]-100,0,0],[350,0,0]],'#2c7a45',false,[8,5]);poly([[0,0,0],[0,0,floorZ]],'#768776',false,[3,5]);ctx.restore();
  if(el('showEnvelope')?.checked){
   const bounds=machines.movingBounds(data,radius);
   ctx.save();ctx.globalAlpha=.8;if(bounds.cylinder)drawBox(bounds.cylinder.min,bounds.cylinder.max,'#bb6f1b',true,A);drawBox(bounds.arm.min,bounds.arm.max,'#bb6f1b',true,A);
   if(beam.min[1]!==beam.displayMin[1]||beam.max[1]!==beam.displayMax[1])drawBox(beam.min,beam.max,'#bb6f1b',true);ctx.restore();
  }
  label([0,0,0],'O');label(A([0,0,tr+44]),'C · Rollenachse');label(A([0,reach,above]),'W '+reach+' · Arm '+armAngle.toFixed(1)+'°');
  label([bx0,s*y1,bz0],'Bett '+[L,Wd,Hb].map(Math.round).join(' × '));label([-1100,beam.displayMax[1],beamTop],'Führungsbalken · Oberkante '+beamTop);
  label([frontX,0,rc],'Futter Ø '+2*rc+' · Vorderkante '+Math.round(-frontX)+' vor O');label([400,s*500,floorZ],'Boden');
  if(tube.tip)label(tube.tip,'Rohr Ø '+tube.diameter+' · '+armAngle.toFixed(1)+'°','#126b47');
  el('toolingSummary').textContent='Werkzeug R '+radius+' · Rollen-Ø '+2*radius+' · Rohr Ø '+tube.diameter+' mm · Biegen: '+(data.bendDirection==='clockwise'?'Uhrzeigersinn':'Gegen Uhrzeigersinn')+' · Futter +: '+(data.chuckRotationDirection==='clockwise'?'Uhrzeigersinn':'Gegen Uhrzeigersinn');
  updateDetailNote();
 }
 // window.draw is the page's draw including the collision overlay.
 el('showEnvelope')?.addEventListener('change',()=>window.draw());
 window.RohrPlanPreviewScene={draw};
})();
