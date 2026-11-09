const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,rooms=new Map(),limits=new Map();
const clone=x=>structuredClone(x);
const store={
 async get(id){return clone(rooms.get(id)||null)},async count(){return rooms.size},async create(room){rooms.set(room.id,clone(room))},async giftImages(){return{}},
 async cas(room,revision){if(rooms.get(room.id)?.revision!==revision)return false;rooms.set(room.id,clone(room));return true},
 async remove(id,revision){if(revision!==undefined&&rooms.get(id)?.revision!==revision)return false;return rooms.delete(id)},
 async expired(now){return [...rooms.values()].filter(r=>r.expires<=now).map(r=>r.id)},
 async rate(key,now,limit){const minute=Math.floor(now/60000),old=limits.get(key);const count=old?.minute===minute?old.count+1:1;limits.set(key,{minute,count});return count<=limit}
};
const port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://127.0.0.1:'+port);
 if(url.pathname.startsWith('/api/')){
  const {api}=await import('./sharing-backend/shared-api.mjs');const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>1024*1024){res.writeHead(413);return res.end('{"error":"データが大きすぎます"}')}chunks.push(c)}
  const request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
  const result=await api(request,store,'http://127.0.0.1:'+port);res.writeHead(result.status,Object.fromEntries(result.headers));return res.end(Buffer.from(await result.arrayBuffer()));
 }
 const pathname=decodeURIComponent(url.pathname);let file=path.resolve(root,'.'+pathname);if(file===root)file=path.join(root,'index.html');
 const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(p=>p.startsWith('.'))||relative.startsWith('sharing-backend')){res.writeHead(403);return res.end('Forbidden')}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)});
 }catch{res.writeHead(500);res.end('Server error')}
}).listen(port,'127.0.0.1',()=>console.log('ギフト当てチャレンジ: http://127.0.0.1:'+port));
