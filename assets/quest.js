import * as THREE from './three.module.js';
import data from './quest-data.js';
const canvas=document.getElementById('quest-canvas');
const gl=canvas.getContext('webgl2',{alpha:true,antialias:false});
const fallback=gl?null:canvas.getContext('2d');
const renderer=gl?new THREE.WebGLRenderer({canvas,context:gl,alpha:true,antialias:false}):{
 ratio:1,setPixelRatio(r){this.ratio=r;},getPixelRatio(){return this.ratio;},
 setSize(w,h){canvas.width=w*this.ratio;canvas.height=h*this.ratio;},
 render(){const ctx=fallback,r=this.ratio,w=canvas.width/r,h=canvas.height/r,scale=w/800;
 ctx.setTransform(r,0,0,r,0,0);ctx.clearRect(0,0,w,h);
 for(let i=0;i<count;i++){const n=i*3,z=currentPosition[n+2];const x=currentPosition[n]+Math.sin(cloud.rotation.y)*z,y=currentPosition[n+1]+cloud.position.y;const scan=reduced?0:Math.exp(-Math.pow((y-(145-(elapsed*24)%290))/9,2));ctx.globalAlpha=Math.min(.9,brightness[i]*.95+scan*.15);ctx.fillStyle=i%4?'#00E5FF':'#008CFF';ctx.fillRect(w/2+x*scale,h/2-y*scale,1.1,1.1);}
 ctx.globalAlpha=1;
 }};
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-400,400,300,-300,.1,2000);
camera.position.z=700;
const count=innerWidth<640?8000:innerWidth<1024?18000:30000;
const originalPosition=new Float32Array(count*3),currentPosition=new Float32Array(count*3),velocity=new Float32Array(count*3),acceleration=new Float32Array(count*3),randomOffset=new Float32Array(count),brightness=new Float32Array(count);
for(let i=0;i<count;i++){for(let k=0;k<3;k++)originalPosition[i*3+k]=currentPosition[i*3+k]=data[i*4+k];brightness[i]=data[i*4+3];randomOffset[i]=Math.random()*6.28;}
const geometry=new THREE.BufferGeometry();
geometry.setAttribute('position',new THREE.BufferAttribute(currentPosition,3).setUsage(THREE.DynamicDrawUsage));
geometry.setAttribute('brightness',new THREE.BufferAttribute(brightness,1));
const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},pixelRatio:{value:renderer.getPixelRatio()}},vertexShader:`attribute float brightness; varying float light; uniform float time; uniform float pixelRatio; void main(){ light=brightness; float scan=exp(-pow((position.y-(145.-mod(time*24.,290.)))/9.,2.)); light+=scan*.22; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize=pixelRatio*(.85+brightness*.28+scan*.15); }`,fragmentShader:`varying float light; void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard; vec3 color=mix(vec3(0.,.549,1.),vec3(0.,.898,1.),clamp(light,0.,1.));gl_FragColor=vec4(color,clamp(light*.72,0.,.9)*smoothstep(.5,.18,d));}`});
const cloud=new THREE.Points(geometry,material);scene.add(cloud);
const pointer=new THREE.Vector3(10000,10000,0),ndc=new THREE.Vector2(),ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
let active=false,visible=true,last=performance.now(),elapsed=0,lastWave=0,touchTimer,previous=null;
const waves=[];
function resize(){const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);const h=800*r.height/r.width;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas.parentElement);resize();
function move(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);camera.updateMatrixWorld();cloud.updateMatrixWorld();ray.setFromCamera(ndc,camera);ray.ray.intersectPlane(plane,pointer);cloud.worldToLocal(pointer);const now=performance.now();if(previous&&Math.hypot(pointer.x-previous.x,pointer.y-previous.y)>16&&now-lastWave>100){waves.push({x:pointer.x,y:pointer.y,born:elapsed});lastWave=now;}previous={x:pointer.x,y:pointer.y};active=true;}
canvas.addEventListener('pointermove',move,{passive:true});
canvas.addEventListener('pointerleave',()=>{active=false;previous=null;});
canvas.addEventListener('pointerdown',e=>{move(e);waves.push({x:pointer.x,y:pointer.y,born:elapsed});if(e.pointerType!=='mouse'){clearTimeout(touchTimer);touchTimer=setTimeout(()=>active=false,160);}}, {passive:true});
canvas.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')active=false;});canvas.addEventListener('pointercancel',()=>active=false);
new IntersectionObserver(es=>{visible=es[0].isIntersecting;},{threshold:0}).observe(canvas);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.033);last=now;if(!visible||document.hidden)return;elapsed+=dt;const step=dt*60;material.uniforms.time.value=reduced?0:elapsed;
 cloud.rotation.y=reduced?0:Math.sin(elapsed*.35)*.028;cloud.rotation.x=reduced?0:Math.cos(elapsed*.3)*.018;cloud.position.y=reduced?0:Math.sin(elapsed*.6)*3;
 while(waves.length&&(elapsed-waves[0].born>1))waves.shift();if(waves.length>8)waves.splice(0,waves.length-8);
 for(let i=0;i<count;i++){const n=i*3;let x=currentPosition[n],y=currentPosition[n+1];let dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy),fx=0,fy=0,fz=0;
 if(active&&d<65){const force=(1-d/65)*2.5,inv=1/Math.max(d,1);fx=dx*inv*force-dy*inv*force*.22;fy=dy*inv*force+dx*inv*force*.22;fz=force*Math.sin(randomOffset[i]);}
 for(const w of waves){const age=elapsed-w.born,wx=originalPosition[n]-w.x,wy=originalPosition[n+1]-w.y,dist=Math.hypot(wx,wy);const force=Math.exp(-Math.pow((dist-age*180)/16,2))*(1-age)*.65;fx+=wx/Math.max(dist,1)*force;fy+=wy/Math.max(dist,1)*force;}
 for(let k=0;k<3;k++){const j=n+k;let noise=(!reduced&&k===2)?Math.sin(elapsed+randomOffset[i])*.3:0;acceleration[j]=(originalPosition[j]+noise-currentPosition[j])*.025+(k===0?fx:k===1?fy:fz);velocity[j]=(velocity[j]+acceleration[j]*step)*Math.pow(.86,step);currentPosition[j]+=velocity[j]*step;}
 }
 geometry.attributes.position.needsUpdate=true;renderer.render(scene,camera);
}
requestAnimationFrame(frame);
