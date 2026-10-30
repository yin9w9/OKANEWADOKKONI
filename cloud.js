import {OWNER_UID,normalizeEmail,canUseCloud} from './access.js';

export function setupCloud(ctx){
  const {$,status,toast,render}=ctx;
  let sdk=null,loading=null,revision=0,stops=[],accessMessage='';
  const stop=()=>{for(const fn of stops)fn();stops=[]};
  function localMode(message=''){
    stop();ctx.setUser(null);ctx.setReady(false);ctx.setData(structuredClone(ctx.getLocal()));
    $('#login').hidden=false;$('#logout').hidden=true;$('#cloud-access-panel').hidden=true;
    $('#cloud-access-list').replaceChildren();$('#user-info').textContent='目前使用本機帳本。';
    $('#cloud-access-note').textContent=message||'雲端同步限核准帳號使用；未核准也可繼續本機記帳。';
    render();status('本機模式');
  }
  async function block(message){
    accessMessage=message;localStorage.removeItem('okane-cloud-enabled');localMode(message);toast(message);
    if(sdk?.auth.currentUser)await sdk.signOut(sdk.auth);
  }
  async function authorize(identity){
    const current=++revision;stop();ctx.setReady(false);
    if(!identity){localMode(accessMessage);return}
    try{
      const owner=identity.uid===OWNER_UID,email=normalizeEmail(identity.email);
      let grant=null,grantRef=null;
      if(!owner&&identity.emailVerified&&email){
        grantRef=sdk.doc(sdk.db,'cloudAccess',email);
        const snapshot=await sdk.getDoc(grantRef);grant=snapshot.exists()?snapshot.data():null;
      }
      if(current!==revision)return;
      if(!canUseCloud(identity,grant))return block('此帳號尚未獲准使用雲端，已切回本機記帳；本機資料保留。');
      accessMessage='';localStorage.setItem('okane-cloud-enabled','1');ctx.setUser(identity);
      $('#login').hidden=true;$('#logout').hidden=false;$('#cloud-access-panel').hidden=!owner;
      $('#user-info').textContent=`已登入：${identity.email}`;
      $('#cloud-access-note').textContent=owner?'你是專案管理者，可在下方核准或撤銷其他帳號。':'此帳號已獲准使用雲端同步。';
      ctx.setData({entries:[],accounts:[],categories:[],budgets:{},trips:[]});render();status('正在載入雲端帳本…');
      if(grantRef)stops.push(sdk.onSnapshot(grantRef,snapshot=>{
        if(current===revision&&!canUseCloud(identity,snapshot.exists()?snapshot.data():null))void block('雲端使用授權已撤銷，已切回本機記帳。');
      },()=>{if(current===revision)void block('無法確認雲端授權，已切回本機記帳。')}));
      if(owner)stops.push(sdk.onSnapshot(sdk.collection(sdk.db,'cloudAccess'),snapshot=>{
        if(current!==revision)return;
        $('#cloud-access-list').innerHTML=snapshot.docs.length?snapshot.docs.map(d=>`<div class="grant-row"><div><strong>${ctx.esc(d.id)}</strong><small>${d.data().enabled?'已核准':'已撤銷'}</small></div><button data-grant-email="${ctx.esc(d.id)}" data-grant-enable="${d.data().enabled?'false':'true'}">${d.data().enabled?'撤銷授權':'重新核准'}</button></div>`).join(''):'<p class="muted">尚未核准其他帳號，目前只有你可使用雲端。</p>';
      },error=>toast('授權清單讀取失敗：'+error.message)));
      const loaded=new Set(),failed=new Set();
      for(const kind of ['entries','accounts','categories','budgets','trips'])stops.push(sdk.onSnapshot(sdk.collection(sdk.db,'users',identity.uid,kind),snapshot=>{
        if(current!==revision)return;const list=snapshot.docs.map(d=>({...d.data(),id:d.id}));
        ctx.getData()[kind]=kind==='budgets'?Object.fromEntries(list.map(x=>[x.id,x])):list;
        loaded.add(kind);if(loaded.size===5&&failed.size===0){ctx.setReady(true);status('雲端已同步')}render();
      },error=>{
        if(current!==revision)return;failed.add(kind);ctx.setReady(false);
        if(error.code==='permission-denied')void block('雲端存取遭拒，已切回本機記帳。');
        else{status('雲端連線失敗');toast(error.message)}
      }));
      const meta=sdk.doc(sdk.db,'users',identity.uid),snapshot=await sdk.getDoc(meta);
      if(current!==revision)return;
      if(!snapshot.exists()){
        const batch=sdk.writeBatch(sdk.db),base=ctx.defaults();
        for(const kind of ['accounts','categories'])for(const item of base[kind])batch.set(sdk.doc(sdk.db,'users',identity.uid,kind,item.id),item);
        batch.set(meta,{initialized:true});await batch.commit();
      }
    }catch(error){if(current===revision)await block('雲端授權或連線檢查失敗，已保留本機記帳功能。')}
  }
  async function initialize(){
    if(sdk)return sdk;if(loading)return loading;
    loading=(async()=>{
      const config=ctx.getConfig();if(!config)throw Error('尚未設定雲端專案');status('正在連接 Firebase…');
      if(ctx.loadClient){sdk=await ctx.loadClient(config);ctx.setCloud(sdk);sdk.onAuthStateChanged(sdk.auth,identity=>void authorize(identity));return sdk}
      const [app,auth,db]=await Promise.all([
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
      ]);
      const instance=app.initializeApp(config);sdk={...auth,...db,auth:auth.getAuth(instance),db:db.getFirestore(instance)};
      ctx.setCloud(sdk);auth.onAuthStateChanged(sdk.auth,identity=>void authorize(identity));return sdk;
    })();
    try{return await loading}catch(error){loading=null;localMode('目前無法連接雲端，仍可使用本機記帳。');throw error}
  }
  $('#login').onclick=async()=>{
    const button=$('#login');button.disabled=true;
    try{accessMessage='';const client=await initialize();if(client.auth.currentUser)await authorize(client.auth.currentUser);else await client.signInWithPopup(client.auth,new client.GoogleAuthProvider())}
    catch(error){toast('登入未完成：'+error.message)}finally{button.disabled=false}
  };
  $('#logout').onclick=async()=>{accessMessage='';localStorage.removeItem('okane-cloud-enabled');if(sdk)await sdk.signOut(sdk.auth);localMode();toast('已切回本機帳本')};
  async function setGrant(email,enabled){
    if(sdk?.auth.currentUser?.uid!==OWNER_UID)throw Error('只有管理者可變更授權');
    email=normalizeEmail(email);if(!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email)||email.length>254)throw Error('請輸入有效的 Google 電子郵件');
    await sdk.setDoc(sdk.doc(sdk.db,'cloudAccess',email),{enabled,updatedAt:Date.now()});
  }
  $('#cloud-access-form').onsubmit=async event=>{
    event.preventDefault();const button=$('#approve-account');button.disabled=true;
    try{await setGrant(event.target.elements.email.value,true);event.target.reset();toast('帳號已核准；對方可登入同步自己的帳本。')}
    catch(error){toast(error.message)}finally{button.disabled=false}
  };
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-grant-email]');if(!button)return;button.disabled=true;
    try{await setGrant(button.dataset.grantEmail,button.dataset.grantEnable==='true');toast(button.dataset.grantEnable==='true'?'已重新核准':'已撤銷雲端存取；資料仍保留')}
    catch(error){toast(error.message)}finally{button.disabled=false}
  });
  return {initialize};
}
