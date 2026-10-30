export function accountOrder(accounts,requested=[]){
  const available=new Set(accounts.map(a=>a.id)),seen=new Set(),ids=[];
  for(const id of Array.isArray(requested)?requested:[])if(available.has(id)&&!seen.has(id)){ids.push(id);seen.add(id)}
  for(const a of accounts)if(!seen.has(a.id)){ids.push(a.id);seen.add(a.id)}
  return ids;
}
export function orderedAccounts(accounts,requested){
  const ranks=new Map(accountOrder(accounts,requested).map((id,index)=>[id,index]));
  return [...accounts].sort((a,b)=>ranks.get(a.id)-ranks.get(b.id));
}

export function setupAccountSorting({container,save,render,canSort,announce}){
  let press=null,saving=false,frame=0;
  const rows=()=>[...container.querySelectorAll('[data-account-row]')];
  const ids=()=>rows().map(row=>row.dataset.accountRow);
  function clean(){
    if(!press)return;const current=press;press=null;clearTimeout(current.timer);cancelAnimationFrame(frame);frame=0;
    current.ghost?.remove();current.row?.classList.remove('account-sort-placeholder');
    container.classList.remove('account-sorting');document.body.classList.remove('account-dragging');
    try{if(container.hasPointerCapture(current.pointerId))container.releasePointerCapture(current.pointerId)}catch{}
    press=null;
  }
  function focusHandle(id){[...container.querySelectorAll('[data-drag-account]')].find(b=>b.dataset.dragAccount===id)?.focus({preventScroll:true})}
  async function commit(before,after,focusId){
    if(before.join('\n')===after.join('\n'))return;
    saving=true;container.setAttribute('aria-busy','true');announce('正在儲存帳戶順序…');
    try{await save(after);announce('帳戶順序已儲存，記帳選單已同步更新。')}
    catch(error){announce('排序未儲存：'+error.message)}
    finally{saving=false;container.removeAttribute('aria-busy');render();if(focusId)focusHandle(focusId)}
  }
  function place(y){
    if(!press?.active)return;
    const target=rows().find(row=>row!==press.row&&y<row.getBoundingClientRect().top+row.getBoundingClientRect().height/2);
    if(target)container.insertBefore(press.row,target);else container.append(press.row);
    press.ghost.style.top=(y-press.offsetY)+'px';
  }
  function autoScroll(){
    if(!press?.active)return;
    const nav=document.querySelector('aside'),navRect=nav?.getBoundingClientRect();
    const bottom=navRect&&navRect.top>0?navRect.top:innerHeight;
    const y=press.y;let delta=0;
    if(y<80)delta=-Math.min(16,(80-y)/4);
    else if(y>bottom-60)delta=Math.min(16,(y-bottom+60)/4);
    if(delta){window.scrollBy(0,delta);place(y)}
    frame=requestAnimationFrame(autoScroll);
  }
  function activate(){
    if(!press)return;
    press.active=true;const rect=press.row.getBoundingClientRect();press.offsetY=press.startY-rect.top;
    press.ghost=press.row.cloneNode(true);press.ghost.classList.add('account-drag-ghost');press.ghost.setAttribute('aria-hidden','true');
    for(const button of press.ghost.querySelectorAll('button'))button.tabIndex=-1;
    Object.assign(press.ghost.style,{top:rect.top+'px',left:rect.left+'px',width:rect.width+'px'});
    document.body.append(press.ghost);press.row.classList.add('account-sort-placeholder');
    document.body.classList.add('account-dragging');container.classList.add('account-sorting');
    announce('拖曳中，放開即可儲存。');place(press.y);frame=requestAnimationFrame(autoScroll);
  }
  container.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-drag-account]');if(!handle||saving||press||event.button!==0)return;
    if(!canSort()){announce('請等待雲端同步完成後再調整順序。');return}
    const row=handle.closest('[data-account-row]');if(!row)return;
    event.preventDefault();handle.focus({preventScroll:true});
    press={pointerId:event.pointerId,row,startY:event.clientY,startX:event.clientX,y:event.clientY,before:ids(),active:false};
    container.setPointerCapture(event.pointerId);
    if(event.pointerType==='mouse')activate();else press.timer=setTimeout(activate,220);
  });
  container.addEventListener('pointermove',event=>{
    if(!press||event.pointerId!==press.pointerId)return;press.y=event.clientY;
    if(!press.active){if(Math.hypot(event.clientX-press.startX,event.clientY-press.startY)>14)clean();return}
    event.preventDefault();place(event.clientY);
  });
  container.addEventListener('pointerup',event=>{
    if(!press||event.pointerId!==press.pointerId)return;
    const before=press.before,after=ids(),active=press.active;clean();
    if(active)void commit(before,after);else{render();announce('按住左側把手，再向上或向下拖曳。')}
  });
  const cancel=()=>{if(!press)return;clean();render();announce('已取消排序。')};
  container.addEventListener('pointercancel',cancel);
  container.addEventListener('lostpointercapture',()=>{if(press)cancel()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')cancel()});
  container.addEventListener('keydown',event=>{
    const handle=event.target.closest('[data-drag-account]');
    if(!handle||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
    event.preventDefault();if(saving||press||!canSort())return;
    const list=rows(),row=handle.closest('[data-account-row]'),index=list.indexOf(row),before=ids();
    if(event.key==='ArrowUp'&&index>0)container.insertBefore(row,list[index-1]);
    if(event.key==='ArrowDown'&&index<list.length-1)container.insertBefore(row,list[index+1].nextSibling);
    if(event.key==='Home')container.prepend(row);if(event.key==='End')container.append(row);
    void commit(before,ids(),handle.dataset.dragAccount);
  });
  return {get busy(){return !!press||saving}};
}
