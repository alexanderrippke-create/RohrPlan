(()=>{
 const rx=(p,a)=>[p[0],p[1]*Math.cos(a)-p[2]*Math.sin(a),p[1]*Math.sin(a)+p[2]*Math.cos(a)];
 const rz=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]];
 window.rohrPlanFloorChecks=(bends,cutLength,diameter,height)=>{
 let shape=[[0,0,0]],previous=null,previousRotation=0,errorBound=0;
 return bends.map(b=>{const angle=b.angle,r=b.radius,feed=previous?previous.position-b.position-previous.radius*previous.angle:cutLength-b.position;
 if(!Number.isFinite(feed)||feed<-.1)return {number:b.number,clearance:-Infinity,turnClearance:-Infinity,collision:true,turnRisk:true,invalid:true};
 shape=[[0,0,0],...shape.map(p=>[p[0]+Math.max(0,feed),p[1],p[2]])];
 const delta=-((b.rotation-previousRotation+540)%360-180)*Math.PI/180,lo=Math.min(0,delta),hi=Math.max(0,delta);let minZ=0,reach=0;
 for(const p of shape){reach=Math.max(reach,Math.hypot(p[1],p[2]));minZ=Math.min(minZ,p[2],rx(p,delta)[2]);const base=Math.atan2(p[1],p[2])+Math.PI;for(let k=-2;k<=2;k++){const t=base+2*Math.PI*k;if(t>=lo&&t<=hi)minZ=Math.min(minZ,rx(p,t)[2]);}}
 shape=shape.map(p=>rx(p,delta));let bendMinZ=0;for(const p of shape)bendMinZ=Math.min(bendMinZ,p[2]);const end=[r*Math.sin(angle),r*(1-Math.cos(angle)),0],steps=Math.max(1,Math.ceil(angle/(Math.PI/360))),arc=Array.from({length:steps+1},(_,i)=>{const t=angle*i/steps;return [r*Math.sin(t),r*(1-Math.cos(t)),0]});
 shape=[...arc,...shape.slice(1).map(p=>rz(p,angle).map((v,i)=>v+end[i]))];
 const clearance=height+bendMinZ-diameter/2-errorBound,turnClearance=height+minZ-diameter/2-errorBound;
 errorBound+=r*(1-Math.cos(angle/(2*steps)));previous=b;previousRotation=b.rotation;
 return {number:b.number,clearance,turnClearance,collision:clearance<=0,turnRisk:turnClearance<=0};
 });
 };
})();
