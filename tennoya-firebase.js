import {firebaseConfig} from './firebase-config.js';
const count=document.getElementById('visit-count');
const posts=document.getElementById('blog-posts');
if(!firebaseConfig.apiKey || !firebaseConfig.projectId){
  if(count)count.textContent='準備中';
  if(posts)posts.textContent='お知らせは準備中です。';
}else{
  try{
    const [{initializeApp},{getFirestore,doc,getDoc,setDoc,runTransaction,collection,query,orderBy,getDocs},{getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged}] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js')
    ]);
    const app=initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app);
    window.tennoyaDb={db,auth,doc,getDoc,setDoc,collection,query,orderBy,getDocs,signInWithEmailAndPassword,signOut,onAuthStateChanged};
    if(count){
      const ref=doc(db,'siteStats','visits');
      try{
        if(!sessionStorage.getItem('tennoya-visit-counted')){
          await runTransaction(db,async tx=>{const snap=await tx.get(ref); const current=snap.exists()?Number(snap.data().count||0):0;tx.set(ref,{count:current+1});});
          sessionStorage.setItem('tennoya-visit-counted','1');
        }
        const snap=await getDoc(ref);count.textContent=Number(snap.data()?.count||0).toLocaleString('ja-JP');
      }catch(e){count.textContent='集計中';console.warn('Counter:',e);}
    }
    if(posts){
      try{
        const snapshot=await getDocs(query(collection(db,'posts'),orderBy('createdAt','desc')));
        posts.replaceChildren();
        if(snapshot.empty)posts.textContent='新しいお知らせをお楽しみに。';
        snapshot.forEach(s=>{const d=s.data();const article=document.createElement('article');const h=document.createElement('h3');h.textContent=d.title||'';article.append(h);const t=document.createElement('time');t.textContent=d.createdAt?.toDate?.().toLocaleDateString('ja-JP')||'';article.append(t);if(d.image){const img=document.createElement('img');img.src=d.image;img.alt=d.title||'記事の写真';img.loading='lazy';article.append(img)}const body=document.createElement('p');body.textContent=d.body||'';article.append(body);posts.append(article)});
      }catch(e){posts.textContent='記事を読み込めませんでした。';console.warn(e)}
    }
  }catch(e){if(count)count.textContent='接続待ち';if(posts)posts.textContent='接続設定を確認してください。';console.error(e)}
}
