import {samples} from './samples.mjs';
import {themes} from './themes.mjs';
export const triggerDescriptions={small:'小ヒントをランダムで1つ公開！',medium:'中ヒントをランダムで1つ公開！',free:'コメントでYes／Noで答えられる質問ができます！'};
export const answers={yes:'YES',no:'NO',unknown:'分からない',neither:'どちらともいえない'};
export function answerValue(v){if(v===true)return 'yes';if(v===false)return 'no';if(Object.hasOwn(answers,v))return v;throw Error('回答が不正です');}
export const uid=()=>crypto.randomUUID();
export const kinds={small:'小ヒント',medium:'中ヒント',free:'自由ヒント'};
const initial=[
['small','image','ハート形が含まれていますか？'],['small','image','星形が含まれていますか？'],['small','image','文字が描かれていますか？'],['small','image','リボンが描かれていますか？'],['small','image','赤色が使われていますか？'],['small','image','青色が使われていますか？'],['small','image','顔が描かれていますか？'],['small','image','丸い形が含まれていますか？'],['small','coin','コイン数は偶数ですか？'],['small','coin','コイン数は3桁ですか？'],['small','coin','コイン数の末尾は0ですか？'],['small','subjective','かわいいと思いますか？'],['small','subjective','おいしそうに見えますか？'],['small','subjective','強そうに見えますか？'],['small','subjective','プレゼントでもらったら嬉しいですか？'],['small','subjective','あたたかそうに見えますか？'],
['medium','image','生き物が描かれていますか？'],['medium','image','食べ物・飲み物が描かれていますか？'],['medium','image','身につけるものが描かれていますか？'],['medium','image','乗り物が描かれていますか？'],['medium','image','植物が描かれていますか？'],['medium','image','人が描かれていますか？'],['medium','coin','コイン数は{n}以上ですか？',100],['medium','coin','コイン数は{n}以下ですか？',500],['medium','coin','コイン数は{n}以上ですか？',1000]
];
export function defaults(){return{version:1,theme:'simple',title:'ギフト当てチャレンジ',description:'リスナー協力型！\n5回クリアで新イラスト公開！',mode:'coop',target:{image:samples.gift,coins:100,note:''},shareAnswer:false,clears:0,goal:5,showProgress:true,round:1,complete:false,winner:'',triggers:Object.keys(kinds).map(kind=>({kind,type:'gift',image:samples[{small:'heart',medium:'star',free:'clover'}[kind]],coins:0,condition:'',text:triggerDescriptions[kind]})),questions:initial.map(([kind,category,text,n],i)=>({id:'default-'+i,kind,category,text,n:n||0,enabled:true})),history:[],pending:null};}
export function questionText(q){return q.text.replaceAll('{n}',String(q.n));}
export function available(s,kind){const used=new Set(s.history.map(h=>h.questionId));return s.questions.filter(q=>q.enabled&&q.kind===kind&&!used.has(q.id));}
export function publicState(s){const copy=structuredClone(s);if(!s.shareAnswer)copy.target={image:'',coins:0,note:''};return copy;}
const text=(v,max=2000)=>{if(typeof v!=='string'||v.length>max)throw Error('文字データが不正です');return v;};
const num=(v,max=1e9)=>{if(!Number.isSafeInteger(v)||v<0||v>max)throw Error('数値データが不正です');return v;};
const bool=v=>{if(typeof v!=='boolean')throw Error('設定値が不正です');return v;};
const image=v=>{text(v,180000);if(Object.values(samples).includes(v))return v;if(/^assets\/sample-(heart|star|gift|clover)\.svg$/.test(v))return v;if(v&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v))throw Error('画像形式が不正です');return v;};
function validateImageEdit(value){if(!value)return undefined;const source=image(value.source);if(source.length>90000)throw Error('編集用画像が大きすぎます');if(!Number.isFinite(value.zoom)||value.zoom<1||value.zoom>4||!Number.isFinite(value.x)||!Number.isFinite(value.y)||Math.abs(value.x)>100000||Math.abs(value.y)>100000||typeof value.whole!=='boolean')throw Error('画像の調整値が不正です');return{source,zoom:value.zoom,x:value.x,y:value.y,whole:value.whole};}
export function validate(s){
 if(!s||s.version!==1||!['coop','race'].includes(s.mode))throw Error('ギフト当てチャレンジのデータではありません');
 const out={version:1,theme:Object.hasOwn(themes,s.theme)?s.theme:'simple',title:text(s.title,80),description:text(s.description,1200),mode:s.mode,target:{image:image(s.target.image),...(s.target.imageEdit?{imageEdit:validateImageEdit(s.target.imageEdit)}:{}),coins:num(s.target.coins),note:text(s.target.note,200)},shareAnswer:bool(s.shareAnswer),clears:num(s.clears),goal:num(s.goal),showProgress:bool(s.showProgress),round:num(s.round),complete:bool(s.complete),winner:text(s.winner,80)};
 if(!Array.isArray(s.triggers)||s.triggers.length!==3)throw Error('発動条件が不正です');
 out.triggers=s.triggers.map((t,i)=>{if(t.kind!==Object.keys(kinds)[i])throw Error('ヒント種別が不正です');const type=t.type??'gift';if(!['gift','custom'].includes(type))throw Error('発動条件の種類が不正です');return{kind:t.kind,type,image:image(t.image),...(t.imageEdit?{imageEdit:validateImageEdit(t.imageEdit)}:{}),coins:num(t.coins??0),condition:text(t.condition??'',180),text:triggerDescriptions[t.kind]};});
 if(!Array.isArray(s.questions)||s.questions.length>300)throw Error('質問は300件までです');const ids=new Set();
 out.questions=s.questions.map(q=>{text(q.id,80);if(ids.has(q.id)||!['small','medium'].includes(q.kind)||!['image','coin','subjective'].includes(q.category))throw Error('質問が不正です');ids.add(q.id);return{id:q.id,kind:q.kind,category:q.category,text:text(q.text,240),n:num(q.n),enabled:bool(q.enabled)};});
 if(!Array.isArray(s.history)||s.history.length>1000)throw Error('履歴は1ラウンド1000件までです');
 out.history=s.history.map(h=>({id:text(h.id,80),questionId:text(h.questionId,80),kind:Object.hasOwn(kinds,h.kind)?h.kind:'free',text:text(h.text,240),answer:answerValue(h.answer),at:num(h.at,Number.MAX_SAFE_INTEGER)}));
 out.pending=s.pending?{id:text(s.pending.id,80),questionId:text(s.pending.questionId,80),kind:Object.hasOwn(kinds,s.pending.kind)?s.pending.kind:'free',text:text(s.pending.text,240)}:null;
 return out;
}
export function operate(input,op,role='admin'){
 const s=validate(input);
 if(op.action==='resetHints'){
  if(role!=='admin')throw Error('リセットは管理者のみ操作できます');s.history=[];s.pending=null;s.complete=false;s.winner='';
 }else if(op.action==='draw'){
  if(s.pending)throw Error('現在の質問を回答またはキャンセルしてください');
  const q=s.questions.find(q=>q.id===op.questionId);if(!q||!available(s,op.kind).some(x=>x.id===q.id))throw Error('この質問は抽選できません');s.pending={id:op.id,questionId:q.id,kind:q.kind,text:questionText(q)};
 }else if(op.action==='free'){
  if(s.pending)throw Error('現在の進行状態では質問を追加できません');if(!op.text?.trim())throw Error('質問を入力してください');s.pending={id:op.id,questionId:op.id,kind:'free',text:op.text.trim()};
 }else if(op.action==='answer'||op.action==='cancel'){
  if(!s.pending||s.pending.id!==op.pendingId)throw Error('質問が更新されました。最新状態を確認してください');
  if(op.action==='answer')s.history.push({...s.pending,answer:op.answer,at:Date.now()});s.pending=null;
 }else if(op.action==='edit'||op.action==='delete'){
  const h=s.history.find(h=>h.id===op.id);if(!h||h.text!==op.expectedText||h.answer!==answerValue(op.expectedAnswer))throw Error('履歴が更新されました');
  if(op.action==='delete')s.history=s.history.filter(h=>h.id!==op.id);else{h.text=op.text;h.answer=op.answer;}
 }else if(op.action==='clear'){
  if(s.complete)throw Error('このラウンドはクリア済みです');s.complete=true;s.clears++;s.winner=op.winner||'';s.pending=null;
 }else if(op.action==='next'){
  if(role!=='admin')throw Error('次のラウンドは管理者が開始してください');s.round++;s.history=[];s.pending=null;s.complete=false;s.winner='';s.target={image:'',coins:0,note:''};
 }else if(op.action==='settings'){
  if(role!=='admin')throw Error('設定は管理者のみ変更できます');
  for(const key of ['theme','title','description','mode','target','shareAnswer','goal','showProgress','triggers','questions','clears'])if(Object.hasOwn(op.values,key))s[key]=op.values[key];
 }else throw Error('操作が不正です');return validate(s);
}
