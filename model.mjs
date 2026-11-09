import {samples} from './samples.mjs';
import {themes} from './themes.mjs';
export const triggerDescriptions={small:'小ヒントをランダムで1つ公開！',medium:'中ヒントをランダムで1つ公開！',free:'コメントでYes／Noで答えられる質問ができます！'};
export const answers={yes:'YES',no:'NO',unknown:'分からない',neither:'どちらともいえない'};
export function answerValue(v){if(v===true)return 'yes';if(v===false)return 'no';if(Object.hasOwn(answers,v))return v;throw Error('回答が不正です');}
export const uid=()=>crypto.randomUUID();
export const kinds={small:'小ヒント',medium:'中ヒント',free:'自由ヒント'};
const catalogVersion = 4;
const maxCoins = 1e9;
const extraDetails = [
 ['gold','金色が使われていますか？'],
 ['silver','銀色が使われていますか？'],
 ['stripe','しま模様がありますか？'],
 ['check','チェック柄がありますか？'],
 ['triangle','三角形が含まれていますか？'],
 ['crescent','三日月の形が含まれていますか？'],
 ['drop','しずくの形が含まれていますか？'],
 ['sparkle','光のきらめきが描かれていますか？'],
 ['wings','羽や翼が描かれていますか？'],
 ['rays','放射状に広がる線がありますか？'],
];
const extraMotifs = [
 ['gift-box','プレゼント箱が描かれていますか？'],
 ['music','楽器や音符が描かれていますか？'],
 ['building','建物が描かれていますか？'],
 ['weather','雲や雨など、天気に関するものが描かれていますか？'],
 ['space','惑星やロケットなど、宇宙に関するものが描かれていますか？'],
 ['sports','スポーツ用品が描かれていますか？'],
 ['stationery','文房具が描かれていますか？'],
 ['furniture','家具が描かれていますか？'],
 ['jewel','宝石が描かれていますか？'],
 ['electronics','スマートフォンやテレビなどの電化製品が描かれていますか？'],
 ['tableware','お皿やカップなどの食器が描かれていますか？'],
 ['landscape','山・海・川などの自然の風景が描かれていますか？'],
];
const catalog = [
 ['default-0','small','image','ハート形が含まれていますか？'],
 ['default-1','small','image','星形が含まれていますか？'],
 ['default-2','small','image','文字が描かれていますか？'],
 ['default-3','small','image','リボンが描かれていますか？'],
 ['default-4','small','image','赤色が使われていますか？'],
 ['default-5','small','image','青色が使われていますか？'],
 ...['黄色','緑色','オレンジ色','ピンク色','紫色','白色','黒色','茶色'].map((color, index) =>
  ['color-' + index, 'small', 'image', color + 'が使われていますか？']
 ),
 ['default-7','small','image','丸い形が含まれていますか？'],
 ['default-11','small','subjective','かわいいと思いますか？'],
 ['default-12','small','subjective','おいしそうに見えますか？'],
 ['default-13','small','subjective','強そうに見えますか？'],
 ['default-15','small','subjective','あたたかそうに見えますか？'],
 ...extraDetails.map(([id,text]) => ['detail-' + id,'small','image',text]),
 ['default-16','medium','image','生き物・キャラクターが描かれていますか？'],
 ['default-17','medium','image','食べ物・飲み物が描かれていますか？'],
 ['default-18','medium','image','身につけるものが描かれていますか？'],
 ['default-19','medium','image','乗り物が描かれていますか？'],
 ['default-20','medium','image','植物が描かれていますか？'],
 ['default-21','medium','image','人が描かれていますか？'],
 ...extraMotifs.map(([id,text]) => ['motif-' + id,'medium','image',text]),
 ...[2,3,4,5].map(digits => [
  digits === 3 ? 'default-9' : 'coin-digits-' + digits,
  'medium',
  'coin',
  'コイン数は' + digits + '桁ですか？',
  true,
 ]),
 ...[50,100,500,1000,2000,5000].map(coins => [
  coins === 500 ? 'default-23' : 'coin-at-most-' + coins,
  'medium',
  'coin',
  coins.toLocaleString('ja-JP') + 'コイン以下ですか？',
  true,
 ])
];
const standardQuestions = catalog.map(([id,kind,category,text]) => ({id,kind,category,text,n:0,enabled:true}));
const fixedCoinQuestions = new Map(catalog.filter(entry => entry[4]).map(([id,,,text]) => [id,text]));
export const isFixedCoinQuestion = q => fixedCoinQuestions.has(q.id);

function migrateQuestions(questions, version) {
 const replaced = new Map([
  ['default-22','coin-at-most-100'],
  ['default-24','coin-at-most-1000'],
 ]);
 const removed = new Map([
  ['default-8','コイン数は偶数ですか？'],
  ['default-14','プレゼントでもらったら嬉しいですか？'],
 ]);
 const removedInVersionFour = new Map([
  ['default-6','顔が描かれていますか？'],
  ['detail-gradient','色がなめらかに変わる部分がありますか？'],
  ['detail-outline','モチーフに黒いふち取りがありますか？'],
 ]);
 const existing = new Map(questions.map(q => [q.id,q]));
 const result = questions.flatMap(q => {
  if (version < 4 && removedInVersionFour.get(q.id) === q.text) return [];
  if (q.id === 'default-10' && q.text === 'コイン数の末尾は0ですか？') return [];
  if (q.id === 'default-9') return [{...q,kind:'medium',category:'coin'}];
  if (version >= 1) return [q];
  if (removed.get(q.id) === q.text) return [];
  if (replaced.has(q.id)) {
   const id = replaced.get(q.id);
   return existing.has(id) ? [] : [{...q,id,text:fixedCoinQuestions.get(id)}];
  }
  if (q.id === 'default-16' && q.text === '生き物が描かれていますか？') {
   return [{...q,text:'生き物・キャラクターが描かれていますか？'}];
  }
  return [q];
 });
 const usedText = new Set(result.map(q => q.kind + ':' + normalizedQuestion(q.text)));
 for (const q of standardQuestions) {
  if (result.length >= 300) break;
  const addedInVersionOne = q.id.startsWith('color-') || ['coin-at-most-50','coin-at-most-2000','coin-at-most-5000'].includes(q.id);
  const addedInVersionTwo = q.id.startsWith('detail-') || q.id.startsWith('motif-');
  const addedInVersionThree = q.id.startsWith('coin-digits-');
  const shouldAdd = (version < 1 && addedInVersionOne) ||
   (version < 2 && addedInVersionTwo) || (version < 3 && addedInVersionThree);
  const key = q.kind + ':' + normalizedQuestion(q.text);
  if (shouldAdd && !existing.has(q.id) && !usedText.has(key)) {
   result.push({...q});
   usedText.add(key);
  }
 }
 // 標準の質問は新しい一覧順にし、追加された質問は元の順番を保つ。
 const order = new Map(standardQuestions.map((q,index) => [q.id,index]));
 return result.sort((a,b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
}
export function defaults(){return{version:1,theme:'simple',title:'ギフト当てチャレンジ',description:'リスナー協力型！\n5回クリアで新イラスト公開！',mode:'coop',target:{image:samples.gift,coins:100,note:''},shareAnswer:false,clears:0,goal:5,showProgress:true,round:1,complete:false,winner:'',triggers:Object.keys(kinds).map(kind=>({kind,type:'gift',image:samples[{small:'heart',medium:'star',free:'clover'}[kind]],coins:0,condition:'',text:triggerDescriptions[kind]})),questionCatalog:catalogVersion,questions:standardQuestions.map(q=>({...q})),history:[],pending:null};}
export function questionText(q){return q.text.replaceAll('{n}',String(q.n));}
function normalizedQuestion(text) {
 return text.normalize('NFKC').replace(/[\s?。]+/g, '');
}

function coinRange(question) {
 const digits = /^コイン数は([2-5])桁(?:ですか|か)?$/.exec(question);
 if (digits) {
  const count = Number(digits[1]);
  return [10 ** (count - 1), 10 ** count - 1];
 }
 const match = /^(?:コイン数は)?([\d,]+)(コイン)?(以上|以下|未満|超)(?:ですか|か)?$/.exec(question);
 if (!match || (!match[2] && !question.startsWith('コイン数は'))) return null;
 const coins = Number(match[1].replaceAll(',', ''));
 if (!Number.isSafeInteger(coins) || coins > maxCoins) return null;
 const comparison = match[3];
 if (comparison === '以上' || comparison === '超') return [coins + (comparison === '超' ? 1 : 0), maxCoins];
 return [0, coins - (comparison === '未満' ? 1 : 0)];
}

function filterCoinRanges(ranges, [min,max], yes) {
 // 桁数のNOは、その桁数より下と上の両方が候補に残る。
 return ranges.flatMap(([low,high]) => {
  const parts = yes
   ? [[Math.max(low,min),Math.min(high,max)]]
   : [[low,Math.min(high,min-1)],[Math.max(low,max+1),high]];
  return parts.filter(([start,end]) => start <= end);
 });
}

export function available(s,kind) {
 const used = new Set(s.history.map(h => h.questionId));
 const answered = new Set();
 let ranges = [[0,maxCoins]];
 for (const hint of s.history) {
  const answer = answerValue(hint.answer);
  if (answer !== 'yes' && answer !== 'no') continue;
  const question = normalizedQuestion(hint.text);
  answered.add(question);
  const range = coinRange(question);
  if (range) ranges = filterCoinRanges(ranges, range, answer === 'yes');
 }
 return s.questions.filter(q => {
  if (!q.enabled || q.kind !== kind || used.has(q.id)) return false;
  const question = normalizedQuestion(questionText(q));
  if (answered.has(question)) return false;
  const range = coinRange(question);
  if (!range || !ranges.length) return true;
  return filterCoinRanges(ranges, range, true).length > 0 &&
   filterCoinRanges(ranges, range, false).length > 0;
 });
}
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
 out.questions=s.questions.map(q=>{text(q.id,80);if(ids.has(q.id)||!['small','medium'].includes(q.kind)||!['image','coin','subjective'].includes(q.category))throw Error('質問が不正です');ids.add(q.id);return{id:q.id,kind:q.kind,category:q.category,text:fixedCoinQuestions.get(q.id)??text(questionText({...q,text:text(q.text,240),n:num(q.n??0)}),240),n:0,enabled:bool(q.enabled)};});
 const previousCatalog = Number.isInteger(s.questionCatalog) ? s.questionCatalog : 0;
 out.questionCatalog = catalogVersion;
 if (previousCatalog < catalogVersion) out.questions = migrateQuestions(out.questions, previousCatalog);
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
