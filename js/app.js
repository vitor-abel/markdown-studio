(function(){
  var $=function(s){return document.querySelector(s)};
  var ta=$('#ta'),gut=$('#gut'),pv=$('#pv'),out=$('#out'),split=$('#split'),ed=$('#ed');
  var KEY='mdedit.v1';
  var sample=[
    '# Bem-vindo ao editor','',
    'Escreva à esquerda e veja o resultado **em tempo real** à direita. Use a barra de ferramentas ou os atalhos `Ctrl+B`, `Ctrl+I` e `Ctrl+K`.','',
    '## O que funciona','',
    '- Títulos, listas e citações',
    '- *Itálico*, **negrito** e ~~tachado~~',
    '- [Links](https://www.markdownguide.org) e imagens',
    '- Tabelas e blocos de código','',
    '### Tarefas','',
    '- [x] Abrir o editor',
    '- [ ] Escrever o primeiro texto',
    '- [ ] Criar outro arquivo no explorador','',
    '> Um bom texto começa com uma frase simples.','',
    '| Atalho | Ação |','| --- | --- |','| Ctrl+B | Negrito |','| Ctrl+I | Itálico |','| Tab | Recuar |','',
    '```js','function saudacao(nome) {','  return `Olá, ${nome}!`;','}','```',''
  ].join('\n');

  var st=null;
  try{st=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  var files=(st&&st.files&&st.files.length)?st.files:[
    {id:1,name:'bem-vindo.md',content:sample},
    {id:2,name:'notas.md',content:'# Notas\n\nComece a escrever aqui.\n'}
  ];
  var openIds=(st&&st.openIds&&st.openIds.length)?st.openIds:files.map(function(f){return f.id});
  var activeId=(st&&st.activeId)||files[0].id;
  var seq=files.reduce(function(m,f){return Math.max(m,f.id)},0)+1;
  var theme=null;try{theme=localStorage.getItem(KEY+'.theme')}catch(e){}
  if(theme)document.documentElement.setAttribute('data-theme',theme);

  function cur(){return files.filter(function(f){return f.id===activeId})[0]||files[0]}
  function esc(t){return t.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}

  if(window.DOMPurify){DOMPurify.addHook('afterSanitizeAttributes',function(n){if(n.tagName==='A'){n.setAttribute('target','_blank');n.setAttribute('rel','noopener noreferrer')}})}
  function render(text){
    if(!text.trim())return '<p class="empty">Nada para mostrar ainda. Comece a escrever no editor.</p>';
    if(window.marked&&window.DOMPurify)return DOMPurify.sanitize(marked.parse(text,{gfm:true}));
    return '<pre>'+esc(text)+'</pre>';
  }

  var saveT=null;
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify({files:files,openIds:openIds,activeId:activeId}))}catch(e){}
    $('#stSave').textContent='Salvo';
  }
  function queueSave(){$('#stSave').textContent='Salvando…';clearTimeout(saveT);saveT=setTimeout(persist,400)}

  var raf=0;
  function refresh(){
    var t=ta.value,n=t.split('\n').length,a=[];
    for(var i=1;i<=n;i++)a.push(i);
    gut.textContent=a.join('\n');
    out.innerHTML=render(t);
    var w=(t.trim().match(/\S+/g)||[]).length;
    $('#stCount').textContent=w+' palavras · '+t.length+' caracteres';
    pos();
  }
  function pos(){
    var v=ta.value,s=ta.selectionStart,before=v.slice(0,s).split('\n');
    $('#stPos').textContent='Ln '+before.length+', Col '+(before[before.length-1].length+1);
  }

  function renderTabs(){
    var box=$('#tabs');box.textContent='';
    openIds.forEach(function(id){
      var f=files.filter(function(x){return x.id===id})[0];if(!f)return;
      var d=document.createElement('div');d.className='tab'+(id===activeId?' on':'');d.setAttribute('role','tab');
      var ic=document.createElement('span');ic.className='md-ico';ic.textContent='M↓';
      var nm=document.createElement('span');nm.textContent=f.name;
      var x=document.createElement('button');x.className='x';x.textContent='×';x.title='Fechar';x.setAttribute('aria-label','Fechar '+f.name);
      x.onclick=function(e){e.stopPropagation();closeTab(id)};
      d.onclick=function(){activate(id)};
      d.appendChild(ic);d.appendChild(nm);d.appendChild(x);box.appendChild(d);
    });
  }
  function renderFiles(){
    var ul=$('#files');ul.textContent='';
    files.forEach(function(f){
      var li=document.createElement('li');if(f.id===activeId)li.className='on';
      var ic=document.createElement('span');ic.className='md-ico';ic.textContent='M↓';
      var nm=document.createElement('span');nm.className='nm';nm.textContent=f.name;
      var rm=document.createElement('button');rm.className='rm';rm.textContent='×';rm.title='Excluir arquivo';rm.setAttribute('aria-label','Excluir '+f.name);
      rm.onclick=function(e){e.stopPropagation();removeFile(f.id)};
      li.onclick=function(){activate(f.id)};
      li.appendChild(ic);li.appendChild(nm);li.appendChild(rm);ul.appendChild(li);
    });
  }
  function activate(id){
    activeId=id;if(openIds.indexOf(id)<0)openIds.push(id);
    var f=cur();ta.value=f.content;ta.scrollTop=0;pv.scrollTop=0;
    document.title=f.name+' — Markdown Studio';$('#title').textContent=f.name+' — Markdown Studio';
    renderTabs();renderFiles();refresh();persist();
    if(window.innerWidth<=760)$('#side').classList.add('hide');
  }
  function closeTab(id){
    openIds=openIds.filter(function(x){return x!==id});
    if(!openIds.length)openIds=[files[0].id];
    if(id===activeId)activate(openIds[openIds.length-1]);else{renderTabs();persist()}
  }
  function removeFile(id){
    if(files.length<2)return;
    files=files.filter(function(f){return f.id!==id});
    openIds=openIds.filter(function(x){return x!==id});
    if(!openIds.length)openIds=[files[0].id];
    if(id===activeId)activate(openIds[0]);else{renderTabs();renderFiles();persist()}
  }
  function newFile(){
    $('#side').classList.remove('hide');
    var ul=$('#files'),li=document.createElement('li'),inp=document.createElement('input');
    inp.id='newname';inp.placeholder='nome-do-arquivo.md';inp.setAttribute('aria-label','Nome do novo arquivo');
    li.appendChild(inp);ul.appendChild(li);inp.focus();
    var done=false;
    function finish(ok){
      if(done)return;done=true;
      var v=inp.value.trim();li.remove();
      if(!ok||!v)return;
      if(!/\.(md|markdown|txt)$/i.test(v))v+='.md';
      var f={id:seq++,name:v,content:'# '+v.replace(/\.[^.]+$/,'')+'\n\n'};
      files.push(f);activate(f.id);ta.focus();
    }
    inp.onkeydown=function(e){if(e.key==='Enter')finish(true);else if(e.key==='Escape')finish(false)};
    inp.onblur=function(){finish(!!inp.value.trim())};
  }

  /* edição */
  function insert(text){
    ta.focus();
    var ok=false;try{ok=document.execCommand('insertText',false,text)}catch(e){}
    if(!ok){ta.setRangeText(text,ta.selectionStart,ta.selectionEnd,'end');ta.dispatchEvent(new Event('input'))}
  }
  function wrap(b,a,ph){
    var s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||ph;
    insert(b+sel+a);ta.setSelectionRange(s+b.length,s+b.length+sel.length);
  }
  function lines(fn){
    var v=ta.value,s=ta.selectionStart,e=ta.selectionEnd;
    var ls=v.lastIndexOf('\n',s-1)+1,le=v.indexOf('\n',e);if(le<0)le=v.length;
    ta.focus();ta.setSelectionRange(ls,le);
    var block=v.slice(ls,le).split('\n').map(fn).join('\n');
    insert(block);ta.setSelectionRange(ls,ls+block.length);
  }
  var actions={
    h1:function(){lines(function(l){return '# '+l.replace(/^#+\s*/,'')})},
    h2:function(){lines(function(l){return '## '+l.replace(/^#+\s*/,'')})},
    h3:function(){lines(function(l){return '### '+l.replace(/^#+\s*/,'')})},
    bold:function(){wrap('**','**','negrito')},
    italic:function(){wrap('*','*','itálico')},
    strike:function(){wrap('~~','~~','tachado')},
    code:function(){wrap('`','`','código')},
    ul:function(){lines(function(l){return '- '+l})},
    ol:function(){var i=0;lines(function(l){i++;return i+'. '+l})},
    task:function(){lines(function(l){return '- [ ] '+l})},
    quote:function(){lines(function(l){return '> '+l})},
    link:function(){
      var s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||'texto do link';
      insert('['+sel+'](https://)');
      var p=s+sel.length+3;ta.setSelectionRange(p,p+8);
    },
    block:function(){wrap('```\n','\n```','código')},
    table:function(){insert('\n| Coluna 1 | Coluna 2 |\n| --- | --- |\n| Valor | Valor |\n')},
    hr:function(){insert('\n\n---\n\n')}
  };
  $('#bar').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.dataset.a&&actions[b.dataset.a])actions[b.dataset.a]();
  });

  ta.addEventListener('input',function(){
    cur().content=ta.value;cancelAnimationFrame(raf);raf=requestAnimationFrame(refresh);queueSave();
  });
  ta.addEventListener('keyup',pos);ta.addEventListener('click',pos);
  ta.addEventListener('keydown',function(e){
    var k=e.key.toLowerCase();
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey){
      if(k==='b'){e.preventDefault();actions.bold();return}
      if(k==='i'){e.preventDefault();actions.italic();return}
      if(k==='k'){e.preventDefault();actions.link();return}
      if(k==='s'){e.preventDefault();clearTimeout(saveT);persist();return}
    }
    if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();insert('  ');return}
    if(e.key==='Enter'&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey&&ta.selectionStart===ta.selectionEnd){
      var v=ta.value,s=ta.selectionStart,ls=v.lastIndexOf('\n',s-1)+1,line=v.slice(ls,s);
      var m=line.match(/^(\s*)([-*+]|\d+\.)\s(\[[ xX]\]\s)?/);
      if(m){
        e.preventDefault();
        if(line.length===m[0].length){ta.setSelectionRange(ls,s);insert('');return}
        var mk=m[2];if(/\d/.test(mk))mk=(parseInt(mk,10)+1)+'.';
        insert('\n'+m[1]+mk+' '+(m[3]?'[ ] ':''));
      }
    }
  });

  /* rolagem sincronizada */
  var sync=true,lock=false;
  function ratio(el){var m=el.scrollHeight-el.clientHeight;return m>0?el.scrollTop/m:0}
  function setRatio(el,r){el.scrollTop=r*(el.scrollHeight-el.clientHeight)}
  ta.addEventListener('scroll',function(){
    gut.scrollTop=ta.scrollTop;
    if(!sync||lock||split.dataset.view!=='split')return;
    lock=true;setRatio(pv,ratio(ta));requestAnimationFrame(function(){lock=false});
  });
  pv.addEventListener('scroll',function(){
    if(!sync||lock||split.dataset.view!=='split')return;
    lock=true;setRatio(ta,ratio(pv));requestAnimationFrame(function(){lock=false});
  });
  var bs=$('#btnSync');bs.style.background='var(--hover)';
  bs.onclick=function(){sync=!sync;bs.style.background=sync?'var(--hover)':'none'};

  /* modos de exibição */
  document.querySelectorAll('.seg button').forEach(function(b){
    b.onclick=function(){
      split.dataset.view=b.dataset.v;
      document.querySelectorAll('.seg button').forEach(function(x){x.classList.toggle('on',x===b)});
      if(b.dataset.v!=='preview')ta.focus();
    };
  });

  /* divisor arrastável */
  var dv=$('#div');
  dv.addEventListener('pointerdown',function(e){
    dv.setPointerCapture(e.pointerId);dv.classList.add('drag');
    function mv(ev){
      var r=split.getBoundingClientRect(),col=getComputedStyle(split).flexDirection==='column';
      var p=col?(ev.clientY-r.top)/r.height:(ev.clientX-r.left)/r.width;
      p=Math.min(.85,Math.max(.15,p));ed.style.flex='0 0 '+(p*100)+'%';
    }
    function up(){dv.classList.remove('drag');dv.removeEventListener('pointermove',mv);dv.removeEventListener('pointerup',up)}
    dv.addEventListener('pointermove',mv);dv.addEventListener('pointerup',up);
  });

  /* barra lateral, tema, copiar */
  $('#btnSide').onclick=function(){
    var s=$('#side');s.classList.toggle('hide');
    $('#btnSide').classList.toggle('on',!s.classList.contains('hide'));
  };
  $('#btnNew').onclick=newFile;
  $('#btnTheme').onclick=function(){
    var r=document.documentElement,dark=r.getAttribute('data-theme')?r.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
    var n=dark?'light':'dark';r.setAttribute('data-theme',n);
    try{localStorage.setItem(KEY+'.theme',n)}catch(e){}
  };
  $('#btnCopy').onclick=function(){
    var done=function(){var s=$('#stSave');s.textContent='Markdown copiado';setTimeout(function(){s.textContent='Salvo'},1500)};
    try{navigator.clipboard.writeText(ta.value).then(done,function(){ta.select();document.execCommand('copy');done()})}
    catch(e){ta.select();try{document.execCommand('copy')}catch(x){}done()}
  };

  if(window.innerWidth<=760){$('#side').classList.add('hide');$('#btnSide').classList.remove('on')}
  activate(cur().id);
})();
