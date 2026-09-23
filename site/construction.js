(() => {
  const section=document.querySelector('#ganha-forma'),canvas=section?.querySelector('#construction-sequence');
  const ctx=canvas?.getContext('2d',{alpha:false});if(!ctx)return;
  const sticky=section.querySelector('.construction-sticky'),input=section.querySelector('#construction-scrub');
  const status=section.querySelector('.construction-loading'),error=section.querySelector('.video-error');
  const play=section.querySelector('.construction-play'),video=section.querySelector('.construction-film');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width:760px)').matches;
  const size=mobile?{w:360,h:640,name:'mobile'}:{w:480,h:854,name:'desktop'};
  const stages=[['Fundação','Onde tudo começa.'],['Estrutura','Novas perspectivas, a cada andar.'],['O projeto ganha forma','Cada etapa aproxima um novo começo.']];
  canvas.width=size.w;canvas.height=size.h;
  let sheets=[],loading=false,ready=false,disposed=false,progress=0,raf=0,loadId=0,previous=-1;
  const cleanup=[];
  function on(el,type,fn,options){el.addEventListener(type,fn,options);cleanup.push(()=>el.removeEventListener(type,fn,options));}
  function sourceFrame(frame,alpha){const sheet=Math.floor(frame/15),cell=frame%15;ctx.globalAlpha=alpha;ctx.drawImage(sheets[sheet],cell%3*size.w,Math.floor(cell/3)*size.h,size.w,size.h,0,0,size.w,size.h);}
  function draw(){if(!ready||document.hidden)return;const position=progress*59;
    if(position===previous)return;previous=position;
    const first=Math.floor(position),mix=position-first;
    sourceFrame(first,1);if(mix>0&&first<59)sourceFrame(first+1,mix);ctx.globalAlpha=1;
    canvas.dataset.frame=String(Math.round(progress*119));canvas.dataset.position=position.toFixed(3);
    canvas.setAttribute('aria-busy','false');section.classList.add('sequence-ready');
  }
  // Four completely decoded image sheets. Scrolling only copies pixels:
  // there are no network requests, cache evictions or image decodes in draw().
  async function load(){if(loading||ready||disposed)return;loading=true;const generation=++loadId;
    status.hidden=false;status.textContent='Preparando a experiência…';error.hidden=true;let finished=0;
    try{const loaded=await Promise.all(Array.from({length:4},(_,index)=>new Promise((resolve,reject)=>{
      const image=new Image();const timer=setTimeout(()=>{image.src='';reject(Error('timeout'));},20000);
      image.onload=async()=>{clearTimeout(timer);try{if(image.decode)await image.decode();}catch{}finished++;status.textContent=`Preparando a experiência · ${finished}/4`;resolve(image);};
      image.onerror=()=>{clearTimeout(timer);reject(Error('image'))};image.src=`assets/video/atlas/${size.name}-${index}.jpg`;
    })));
      if(disposed||generation!==loadId)return;sheets=loaded;ready=true;status.hidden=true;previous=-1;update();
    }catch{if(!disposed){status.hidden=true;error.hidden=false;}}
    finally{loading=false;}
  }
  function update(){raf=0;if(disposed)return;
    const rect=section.getBoundingClientRect();
    if(!reduced.matches)progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,section.offsetHeight-sticky.offsetHeight)));
    const stage=progress<.18?0:progress<.7?1:2;
    section.querySelector('.construction-number').textContent=String(stage+1).padStart(2,'0');
    section.querySelector('.construction-counter').textContent=stages[stage][0];section.querySelector('.construction-detail').textContent=stages[stage][1];
    input.value=Math.round(progress*100);input.setAttribute('aria-valuetext',`${Math.round(progress*100)}% — ${stages[stage][0]}`);
    if(rect.top<innerHeight+2000&&rect.bottom>0)void load();
    if(rect.top<innerHeight&&rect.bottom>0)draw();
  }
  function schedule(){if(!raf&&!disposed)raf=requestAnimationFrame(update);}
  on(window,'scroll',schedule,{passive:true});on(document,'scroll',schedule,{passive:true,capture:true});on(window,'resize',schedule);
  on(window,'pageshow',schedule);on(document,'visibilitychange',()=>{if(!document.hidden){previous=-1;schedule();}});
  const observer=new ResizeObserver(schedule);observer.observe(document.body);observer.observe(section);cleanup.push(()=>observer.disconnect());document.fonts?.ready.then(schedule);
  on(input,'input',()=>{progress=Number(input.value)/100;
    // Manual control responds immediately even while the browser dispatches scroll.
    if(!reduced.matches)window.scrollTo({top:scrollY+section.getBoundingClientRect().top+(section.offsetHeight-sticky.offsetHeight)*progress,behavior:'instant'});
    draw();schedule();
  });
  on(error.querySelector('button'),'click',()=>void load());
  on(play,'click',async()=>{const film=section.classList.toggle('film-mode');play.textContent=film?'Voltar à rolagem':'Assistir ao vídeo';
    if(film){if(!video.src){video.src='assets/video/construction-mobile.mp4';video.load();}try{await video.play();}catch{video.controls=true;}}
    else{video.pause();previous=-1;schedule();}
  });
  function preference(){section.querySelector('.construction-timeline label').firstChild.textContent=reduced.matches?'Escolha a etapa ':'Role e acompanhe ';schedule();}on(reduced,'change',preference);preference();
  // Buffer once after the main page has loaded, well before most visitors reach the scene.
  const preload=()=>{const timer=setTimeout(()=>void load(),300);cleanup.push(()=>clearTimeout(timer));};
  if(document.readyState==='complete')preload();else on(window,'load',preload,{once:true});
  on(window,'pagehide',event=>{video.pause();if(event.persisted)return;disposed=true;loadId++;cancelAnimationFrame(raf);sheets.forEach(image=>image.src='');sheets=[];cleanup.forEach(fn=>fn());});
})();
