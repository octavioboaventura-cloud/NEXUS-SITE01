(()=>{
 const videos=[...document.querySelectorAll('.synchro-video')];
 const visible=new Set();
 function sync(){for(const v of videos){if(visible.has(v)&&!document.hidden){v.muted=true;v.play().catch(()=>{});}else v.pause();}}
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target));sync();},{threshold:.08});
 videos.forEach(v=>{v.muted=true;observer.observe(v);});
 document.addEventListener('visibilitychange',sync);
 document.addEventListener('pointerdown',sync,{passive:true});
})();
