import test from 'node:test';
import assert from 'node:assert/strict';
import {setupCloud} from './cloud.js';
import {OWNER_UID} from './access.js';

function fixture(identity,grant){
 const elements=new Map(),$=key=>{if(!elements.has(key))elements.set(key,{hidden:false,disabled:false,textContent:'',innerHTML:'',replaceChildren(){this.innerHTML=''}});return elements.get(key)};
 const storage=new Map();globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 globalThis.document={addEventListener(){}};
 let reads=[],subscriptions=[],authCallback,cloud,user=null,ready=false,data={entries:[{id:'local-record'}],accounts:[],categories:[],budgets:{},trips:[]},lastStatus='',loads=0;
 const local=structuredClone(data);
 const client={
  auth:{currentUser:identity},db:{},
  onAuthStateChanged(auth,callback){authCallback=callback;queueMicrotask(()=>callback(auth.currentUser))},
  doc:(db,...parts)=>parts.join('/'),collection:(db,...parts)=>parts.join('/'),
  async getDoc(path){reads.push(path);return {exists:()=>path.startsWith('cloudAccess/')?!!grant:true,data:()=>grant}},
  onSnapshot(path,callback){const item={path,callback,stopped:false};subscriptions.push(item);return ()=>{item.stopped=true}},
  async signOut(auth){auth.currentUser=null;authCallback(null)},
  async signInWithPopup(){authCallback(identity)},GoogleAuthProvider:class{},
 };
 const ctx={$,status:s=>lastStatus=s,toast(){},render(){},esc:String,defaults:()=>local,getLocal:()=>local,getData:()=>data,setData:s=>{data=s},setUser:u=>{user=u},setReady:r=>{ready=r},setCloud:c=>{cloud=c},getConfig:()=>({projectId:'test'}),async loadClient(){loads++;return client}};
 const controller=setupCloud(ctx);
 return {$,controller,client,subscriptions,reads,storage,get user(){return user},get ready(){return ready},get data(){return data},get loads(){return loads},get lastStatus(){return lastStatus}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('visitor starts locally with zero cloud client initialization',()=>{
 const f=fixture(null,null);assert.equal(f.loads,0);assert.deepEqual(f.reads,[]);assert.deepEqual(f.subscriptions,[]);assert.equal(f.data.entries[0].id,'local-record');
});
test('unapproved verified identity falls back before accessing any ledger',async()=>{
 const f=fixture({uid:'visitor',email:'Visitor@example.invalid',emailVerified:true},null);
 await f.controller.initialize();await flush();
 assert.equal(f.user,null);assert.equal(f.client.auth.currentUser,null);assert.equal(f.lastStatus,'本機模式');
 assert.deepEqual(f.reads,['cloudAccess/visitor@example.invalid']);assert.equal(f.subscriptions.length,0);
 assert.equal(f.data.entries[0].id,'local-record');assert.equal(f.$('#cloud-access-panel').hidden,true);
});
test('approved member uses own ledger and revocation restores local data',async()=>{
 const f=fixture({uid:'member',email:'member@example.invalid',emailVerified:true},{enabled:true});
 await f.controller.initialize();await flush();
 assert.equal(f.user.uid,'member');assert.equal(f.$('#cloud-access-panel').hidden,true);
 const ledger=f.subscriptions.filter(s=>s.path.startsWith('users/member/'));assert.equal(ledger.length,5);
 for(const subscription of ledger)subscription.callback({docs:[]});assert.equal(f.ready,true);
 f.subscriptions.find(s=>s.path==='cloudAccess/member@example.invalid').callback({exists:()=>true,data:()=>({enabled:false})});await flush();
 assert.equal(f.user,null);assert.equal(f.ready,false);assert.equal(f.data.entries[0].id,'local-record');assert.ok(f.subscriptions.every(s=>s.stopped));
});
test('owner requires no grant lookup and alone sees authorization management',async()=>{
 const f=fixture({uid:OWNER_UID,email:'owner@example.invalid',emailVerified:true},null);
 await f.controller.initialize();await flush();assert.equal(f.user.uid,OWNER_UID);assert.equal(f.$('#cloud-access-panel').hidden,false);
 assert.ok(!f.reads.some(path=>path.startsWith('cloudAccess/')));assert.ok(f.subscriptions.some(s=>s.path==='cloudAccess'));
});
