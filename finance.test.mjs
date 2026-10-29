import test from 'node:test';
import assert from 'node:assert/strict';
import {balanceOf,cardStatement,dateAt,tripTotals,settlementPlan,isCredit} from './finance.js';
test('credit card payment cancels liability without adding expense',()=>{
 const card={id:'card',type:'credit',name:'信用卡',opening:0};
 const entries=[{type:'expense',account:'card',amount:1000,date:'2026-10-05'},{type:'transfer',account:'bank',to:'card',amount:600,date:'2026-10-20'}];
 assert.equal(balanceOf(card,entries),-400);assert.equal(balanceOf({id:'bank',opening:2000},entries),1400);
 assert.equal(entries.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amount,0),1000);
 assert.ok(isCredit({id:'credit',name:'信用卡'}));assert.equal(isCredit({id:'bank',name:'信用卡備用款',type:'asset'}),false);
});
test('month ends, leap years, statement periods and partial repayment',()=>{
 assert.equal(dateAt(2026,1,31),'2026-02-28');assert.equal(dateAt(2028,1,31),'2028-02-29');
 const c={id:'c',closingDay:25,dueDay:10,opening:-100};
 const b=cardStatement(c,[{type:'expense',account:'c',amount:900,date:'2025-12-25'},{type:'expense',account:'c',amount:300,date:'2025-12-26'},{type:'transfer',account:'bank',to:'c',amount:400,date:'2026-01-05'}],'2026-01','2026-01-11');
 assert.equal(b.closing,'2025-12-25');assert.equal(b.outstanding,600);assert.equal(b.overdue,true);
 assert.equal(cardStatement({...c,closingDay:5,dueDay:25},[],'2026-10','2026-10-29').closing,'2026-10-05');
});
test('travel groups foreign expenses by payer and rounds once per record',()=>{
 const t={records:[{account:'a',amount:1000,rate:.22},{account:'b',amount:30,rate:32},{account:'a',amount:500,rate:.21}]};
 assert.deepEqual(tripTotals(t),{a:325,b:960});
});
test('two-card settlement and repeated actual-amount edits replace same records',()=>{
 const t={id:'trip',name:'東京',start:'2026-10-01',end:'2026-10-05',created:1,records:[{account:'a',amount:1000,rate:.22},{account:'b',amount:30,rate:32}]};
 const accounts=[{id:'a'},{id:'b'}];
 const first=settlementPlan(t,{a:223,b:970},'2026-10-29',accounts);
 const second=settlementPlan({...t,settled:true},{a:228,b:968},'2026-10-29',accounts);
 assert.deepEqual(first.map(o=>o.id),second.map(o=>o.id));
 const ledger=new Map();for(const o of [...first,...second,...second])ledger.set(o.id,o.value);
 assert.equal(ledger.size,2);assert.equal([...ledger.values()].reduce((s,e)=>s+e.amount,0),1196);
 assert.throws(()=>settlementPlan(t,{a:1},'2026-10-29',accounts));
 assert.throws(()=>settlementPlan(t,{a:1,b:-1},'2026-10-29',accounts));
 assert.throws(()=>settlementPlan(t,{a:1,b:2},'2026-10-04',accounts));
});
