/* Small software renderer for the machine preview: shaded solids with a depth
 * buffer and outlined part edges. Orthographic, so screen x/y stay linear in
 * the model coordinates and the 2D overlays of the preview keep matching.
 */
(()=>{
 'use strict';
 const BACKGROUND=0xfff8faf7; // ABGR, #f7faf8
 function create(){
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  let W=0,H=0,image=null,pixels=null,depth=null,ids=null,view=null,nextId=1;
  const light=[-.38,-.55,.74];
  function begin(width,height,camera){
   width=Math.max(1,Math.round(width));height=Math.max(1,Math.round(height));
   if(width!==W||height!==H){
    W=width;H=height;canvas.width=W;canvas.height=H;image=context.createImageData(W,H);
    pixels=new Uint32Array(image.data.buffer);depth=new Float32Array(W*H);ids=new Uint16Array(W*H);
   }
   pixels.fill(BACKGROUND);depth.fill(-Infinity);ids.fill(0);nextId=1;
   const {yaw,pitch,scale,center,originX,originY}=camera,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
   // right, down and towards-viewer axes in model coordinates
   view={center,scale,originX,originY,right:[cy,-sy,0],down:[-sy*sp,-cy*sp,-cp],near:[-sy*cp,-cy*cp,sp]};
  }
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  function screen(p){
   const q=[p[0]-view.center[0],p[1]-view.center[1],p[2]-view.center[2]];
   return [view.originX+dot(q,view.right)*view.scale,view.originY+dot(q,view.down)*view.scale,dot(q,view.near)];
  }
  function shade(color,a,b,c){
   const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
   const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(n[0],n[1],n[2])||1;
   let nx=dot(n,view.right)/length,ny=dot(n,view.down)/length,nz=dot(n,view.near)/length;
   if(nz<0){nx=-nx;ny=-ny;nz=-nz;}
   const k=.5+.5*Math.max(0,nx*light[0]+ny*light[1]+nz*light[2]);
   return 0xff000000|Math.min(255,color[2]*k)<<16|Math.min(255,color[1]*k)<<8|Math.min(255,color[0]*k);
  }
  function fill(p0,p1,p2,value,id){
   const x0=p0[0],y0=p0[1],x1=p1[0],y1=p1[1],x2=p2[0],y2=p2[1];
   let area=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);if(Math.abs(area)<1e-9)return;
   const minX=Math.max(0,Math.floor(Math.min(x0,x1,x2))),maxX=Math.min(W-1,Math.ceil(Math.max(x0,x1,x2)));
   const minY=Math.max(0,Math.floor(Math.min(y0,y1,y2))),maxY=Math.min(H-1,Math.ceil(Math.max(y0,y1,y2)));
   if(minX>maxX||minY>maxY)return;
   const s=area<0?-1:1,inv=1/area;
   const dzdx=((p1[2]-p0[2])*(y2-y0)-(p2[2]-p0[2])*(y1-y0))*inv,dzdy=((p2[2]-p0[2])*(x1-x0)-(p1[2]-p0[2])*(x2-x0))*inv;
   const a0=-(y1-y0)*s,b0=(x1-x0)*s,a1=-(y2-y1)*s,b1=(x2-x1)*s,a2=-(y0-y2)*s,b2=(x0-x2)*s;
   const px=minX+.5,py=minY+.5;
   let r0=((x1-x0)*(py-y0)-(y1-y0)*(px-x0))*s,r1=((x2-x1)*(py-y1)-(y2-y1)*(px-x1))*s,r2=((x0-x2)*(py-y2)-(y0-y2)*(px-x2))*s,rz=p0[2]+dzdx*(px-x0)+dzdy*(py-y0);
   // Per row, the three edge functions bound the covered span directly, so
   // long thin triangles do not cost their whole bounding box.
   const span=maxX-minX;
   for(let y=minY;y<=maxY;y++,r0+=b0,r1+=b1,r2+=b2,rz+=dzdy){
    let lo=0,hi=span;
    if(a0>0)lo=Math.max(lo,Math.ceil(-r0/a0-1e-7));else if(a0<0)hi=Math.min(hi,Math.floor(-r0/a0+1e-7));else if(r0<0)continue;
    if(a1>0)lo=Math.max(lo,Math.ceil(-r1/a1-1e-7));else if(a1<0)hi=Math.min(hi,Math.floor(-r1/a1+1e-7));else if(r1<0)continue;
    if(a2>0)lo=Math.max(lo,Math.ceil(-r2/a2-1e-7));else if(a2<0)hi=Math.min(hi,Math.floor(-r2/a2+1e-7));else if(r2<0)continue;
    let z=rz+dzdx*lo,index=y*W+minX+lo;
    for(let x=lo;x<=hi;x++,z+=dzdx,index++)if(z>depth[index]){depth[index]=z;pixels[index]=value;ids[index]=id;}
   }
  }
  const rgb=color=>typeof color==='string'?[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16)]:color;
  // One outline id per flat face; a convex polygon is drawn as a fan.
  function face(points,color,id=nextId++){
   const c=rgb(color),value=shade(c,points[0],points[1],points[2]),s=points.map(screen);
   for(let i=2;i<s.length;i++)fill(s[0],s[i-1],s[i],value,id);
   return id;
  }
  // `planes` (a Map) lets several boxes of one body share the outline id of
  // faces lying in the same plane, so flush joints show no seam.
  function box(lo,hi,color,transform=p=>p,planes=null){
   const v=Array.from({length:8},(_,mask)=>transform(lo.map((value,i)=>mask&(1<<i)?hi[i]:value)));
   [[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]].forEach((f,index)=>{
    if(!planes){face(f.map(i=>v[i]),color);return;}
    const key=index+':'+(index%2?hi:lo)[[2,2,1,1,0,0][index]];
    planes.set(key,face(f.map(i=>v[i]),color,planes.get(key)??nextId++));
   });
  }
  // axis: 0 = x, 1 = y, 2 = z. The cylinder runs from `from` to `to` along it.
  function cylinder(center,axis,radius,from,to,color,transform=p=>p,segments=28){
   const c=rgb(color),a=(axis+1)%3,b=(axis+2)%3,ring=value=>Array.from({length:segments},(_,i)=>{
    const t=i*2*Math.PI/segments,p=[0,0,0];p[axis]=value;p[a]=center[a]+radius*Math.cos(t);p[b]=center[b]+radius*Math.sin(t);return transform(p);
   });
   const start=ring(from),end=ring(to),mantle=nextId++;
   for(let i=0;i<segments;i++){const j=(i+1)%segments;face([start[i],start[j],end[j],end[i]],c,mantle);}
   face(start,c);face(end,c);
  }
  // Swept tube along a polyline; rings are carried along without twisting.
  function tube(points,radius,color,sides=10){
   const c=rgb(color),path=[];
   for(const p of points){const last=path.at(-1);if(!last||Math.hypot(p[0]-last[0],p[1]-last[1],p[2]-last[2])>1e-6)path.push(p);}
   if(path.length<2)return;
   const sub=(p,q)=>[p[0]-q[0],p[1]-q[1],p[2]-q[2]],unit=p=>{const l=Math.hypot(p[0],p[1],p[2])||1;return [p[0]/l,p[1]/l,p[2]/l];};
   const id=nextId++;let normal=null,previous=null;
   for(let i=0;i<path.length;i++){
    const tangent=unit(sub(path[Math.min(path.length-1,i+1)],path[Math.max(0,i-1)]));
    if(!normal){const seed=Math.abs(tangent[2])<.9?[0,0,1]:[1,0,0];normal=seed;}
    const along=dot(normal,tangent);normal=unit([normal[0]-along*tangent[0],normal[1]-along*tangent[1],normal[2]-along*tangent[2]]);
    const binormal=[tangent[1]*normal[2]-tangent[2]*normal[1],tangent[2]*normal[0]-tangent[0]*normal[2],tangent[0]*normal[1]-tangent[1]*normal[0]];
    const ring=Array.from({length:sides},(_,k)=>{const t=k*2*Math.PI/sides,cs=Math.cos(t)*radius,sn=Math.sin(t)*radius;return [path[i][0]+normal[0]*cs+binormal[0]*sn,path[i][1]+normal[1]*cs+binormal[1]*sn,path[i][2]+normal[2]*cs+binormal[2]*sn];});
    if(previous)for(let k=0;k<sides;k++){const j=(k+1)%sides;face([previous[k],previous[j],ring[j],ring[k]],c,id);}
    if(i===0||i===path.length-1)face(ring,[c[0]*.75,c[1]*.75,c[2]*.75]);
    previous=ring;
   }
  }
  function finish(){
   // Outline wherever two different faces meet on screen.
   for(let y=0;y<H-1;y++){
    let index=y*W;
    for(let x=0;x<W-1;x++,index++){
     const id=ids[index];
     if(id!==ids[index+1]||id!==ids[index+W]){const p=pixels[index];pixels[index]=0xff000000|(p>>1&0x7f7f7f);}
    }
   }
   context.putImageData(image,0,0);return canvas;
  }
  return {begin,face,box,cylinder,tube,finish};
 }
 window.RohrPlanView3D={create};
})();
