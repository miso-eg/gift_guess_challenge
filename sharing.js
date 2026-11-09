// mission_panel_makerの共有API（招待、期限、失効、revision競合検知）を流用。
import {publicState} from './model.mjs';
export class Sharing{
 constructor(app){this.app=app;this.room=null;this.token='';this.busy=false;this.status='未共有';this.origin=window.GIFT_API_ORIGIN||'';this.localTarget=null;}
 async request(path,options={}){const response=await fetch(this.origin+path,{...options,signal:AbortSignal.timeout(15000),cache:'no-store',headers:{'Content-Type':'application/json',...(this.token?{Authorization:'Bearer '+this.token}:{})}});let data;try{data=await response.json()}catch{throw Error('共有APIに接続できません。公開時は専用Workerの設定が必要です')}if(!response.ok)throw Object.assign(Error(data.error||'通信に失敗しました'),{status:response.status});return data;}
 accept(room){if(this.room?.id===room.id&&room.revision<this.room.revision)return;this.room=room;const next=structuredClone(room.board);if(room.role==='admin'&&!next.shareAnswer&&this.localTarget)next.target=structuredClone(this.localTarget);if(room.role==='admin')this.localTarget=structuredClone(next.target);this.app.apply(next,room.role==='admin');this.status='接続中 · 10秒ごとに同期';sessionStorage.setItem('gift-room',JSON.stringify({id:room.id,token:this.token}));}
 async sync(){if(!this.room||this.busy)return;this.busy=true;try{const d=await this.request('/api/rooms/'+this.room.id);if(d.room.revision!==this.room.revision)this.accept(d.room);this.status='接続中 · 10秒ごとに同期'}catch(e){this.status=e.message;if(e.status===410)this.app.toast('共有が終了しました。保存・共有から退出してください')}finally{this.busy=false;this.app.sharingStatus()}}
 async create(){if(this.busy)return;this.busy=true;try{this.localTarget=structuredClone(this.app.state.target);const d=await this.request('/api/rooms',{method:'POST',body:JSON.stringify({board:publicState(this.app.state)})});this.token=d.token;this.accept(d.room);this.app.render();this.showLink('管理用リンク（本人だけで保管）',this.token)}catch(e){this.app.toast(e.message)}finally{this.busy=false}}
 async mutate(op){if(this.busy){this.app.toast('同期完了を待ってください');return false}this.busy=true;try{
 const data={...op,revision:this.room.revision,requestId:crypto.randomUUID()};
 if(op.action==='settings'&&op.values.target){this.pendingTarget=structuredClone(op.values.target);if(!op.values.shareAnswer)data.values={...op.values,target:{image:'',coins:0,note:''}};}
 const result=await this.request('/api/rooms/'+this.room.id,{method:'POST',body:JSON.stringify(data)});
 if(this.pendingTarget){this.localTarget=this.pendingTarget;this.pendingTarget=null}if(op.action==='next')this.localTarget={image:'',coins:0,note:''};
 if(result.room)this.accept(result.room);return result;
 }catch(e){this.pendingTarget=null;this.app.toast(e.message);try{const fresh=await this.request('/api/rooms/'+this.room.id);this.accept(fresh.room)}catch{}return false}finally{this.busy=false;this.app.render()}}
 showLink(title,key){const url=new URL(location.href);url.hash=new URLSearchParams({room:this.room.id,key});document.getElementById('linkTitle').textContent=title;document.getElementById('linkValue').value=url.href;document.getElementById('linkDialog').showModal()}
 async invite(name){const d=await this.mutate({action:'invite',name});if(d?.token)this.showLink(name+'さんの招待リンク',d.token)}
 async end(){const d=await this.mutate({action:'end'});if(d?.ended){this.room=null;this.token='';sessionStorage.removeItem('gift-room');this.status='共有を終了しました';this.app.render()}}
 leave(){this.room=null;this.token='';sessionStorage.removeItem('gift-room');location.hash='';location.reload()}
 async init(){const p=new URLSearchParams(location.hash.slice(1));let saved;try{saved=JSON.parse(sessionStorage.getItem('gift-room')||'null')}catch{}const id=p.get('room')||saved?.id;this.token=p.get('key')||saved?.token||'';
 if(id&&this.token){history.replaceState(null,'',location.pathname+location.search);try{const d=await this.request('/api/rooms/'+id);this.accept(d.room)}catch(e){this.app.toast(e.message);this.status=e.message}}
 setInterval(()=>{if(!document.hidden)this.sync()},10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.sync()});}
}
