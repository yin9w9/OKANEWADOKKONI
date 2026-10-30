import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_UID,normalizeEmail,canUseCloud} from './access.js';
test('only owner or verified explicitly approved identity can use cloud',()=>{
 assert.equal(canUseCloud(null,{enabled:true}),false);
 assert.equal(canUseCloud({uid:OWNER_UID},null),true);
 const guest={uid:'another-user',email:'Guest@example.com',emailVerified:true};
 assert.equal(canUseCloud(guest,null),false);
 assert.equal(canUseCloud(guest,{enabled:false}),false);
 assert.equal(canUseCloud(guest,{enabled:'true'}),false);
 assert.equal(canUseCloud(guest,{enabled:true}),true);
 assert.equal(canUseCloud({...guest,emailVerified:false},{enabled:true}),false);
 assert.equal(canUseCloud({...guest,email:''},{enabled:true}),false);
 assert.equal(normalizeEmail(' Guest@Example.COM '),'guest@example.com');
});
