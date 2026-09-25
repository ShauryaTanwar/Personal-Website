import { API_BASE } from './config.js';
import { IslandScene } from './scene.js';

const $=id=>document.getElementById(id);
const apiRoot=API_BASE.replace(/\/$/,'');
const sizeNames=['Little Meadow','Sunlit Grove','Wildflower Field','Skyward Garden'];
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={token:localStorage.getItem('bloom_token'),user:null,profile:null,catalog:null,
  items:[],inventory:[],session:null,visitor:null,panel:null,placing:null,editing:null,
  tutorial:-1,selectedMinutes:25,finishing:false,heartbeatBusy:false,serverOffset:0};
let island;
let toastTimer;

function toast(message){
  $('toast').textContent=message;$('toast').classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3700);
}
async function api(path, data){
  const options={method:data===undefined?'GET':'POST',headers:{}};
  if(state.token)options.headers.Authorization=`Bearer ${state.token}`;
  if(data!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data)}
  let response;
  try{response=await fetch(apiRoot+path,options)}catch{throw new Error('Cannot reach Bloom. Check your connection or API address.')}
  const content=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(content.error||'Something went wrong.'),{status:response.status});
  return content;
}
function setAuthMode(register){
  $('login-tab').classList.toggle('selected',!register);$('register-tab').classList.toggle('selected',register);
  $('auth-submit').innerHTML=register?'Create my island <span>↗</span>':'Enter your island <span>↗</span>';
  $('password').autocomplete=register?'new-password':'current-password';
  $('auth-error').textContent='';
}
function isRegister(){return $('register-tab').classList.contains('selected')}
function updateGameUi(){
  const playing=!!state.session,visiting=!!state.visitor,placing=!!state.placing,editing=!!state.editing;
  $('auth').hidden=!!state.user;$('game').hidden=!state.user;
  $('top-actions').hidden=!state.user||playing||visiting;
  $('dock').hidden=!state.user||playing||visiting||placing||editing;
  $('island-info').hidden=!state.user||playing;
  $('orbit-hint').hidden=!state.user||playing||placing;
  $('placement-bar').hidden=!placing;
  $('edit-bar').hidden=!editing;
  $('study-mode').hidden=!playing;
  $('visitor-banner').hidden=!visiting;
  $('panel').hidden=!state.panel||playing||placing||editing;
  $('island-label').textContent=state.user?(visiting?'another little corner of the sky':playing?'take your time':'a quiet place to grow'):'a quiet place to grow';
  if(state.profile){
    let hours=state.profile.total_minutes/60;
    $('hours-chip').textContent=`✦   ${hours<1?state.profile.total_minutes+'m':hours.toFixed(1)+'h'} studied`;
    $('size-name').textContent=sizeNames[state.visitor?.island_size??state.profile.island_size];
  }
  if(playing){$('focus-subject').textContent=state.session.subject}
}
async function restore(){
  if(!state.token)return;
  try{await loadPlayer(true)}catch(error){
    if(error.status===401){localStorage.removeItem('bloom_token');state.token=null;state.user=null;updateGameUi()}
    else toast(error.message);
  }
}
async function loadPlayer(enter=false){
  const [profile,garden,inventory]=await Promise.all([api('/api/profile'),api('/api/garden'),api('/api/inventory')]);
  state.profile=profile;state.catalog=profile.catalog;state.user=profile.user;
  state.items=[...garden.items,...inventory.items];state.inventory=inventory.items;
  state.session=profile.active_session;
  if(state.session)state.serverOffset=Date.parse(state.session.server_time)-Date.now();
  state.visitor=null;
  island.buildIsland(profile.island_size);island.setItems(state.items);
  if(enter){state.panel=null;updateGameUi();if(!profile.user.tutorial_completed&&!state.session)showTutorial(0)}
  updateGameUi();
}
async function authSubmit(event){
  event.preventDefault();$('auth-error').textContent='';
  const username=$('username').value.trim(),password=$('password').value;
  const button=$('auth-submit');button.disabled=true;
  try{
    const result=await api(isRegister()?'/api/register':'/api/login',{username,password});
    state.token=result.token;localStorage.setItem('bloom_token',state.token);
    $('password').value='';await loadPlayer(true);
    toast(isRegister()?'Welcome to your new island.':'Welcome back to your island.');
  }catch(error){$('auth-error').textContent=error.message}
  finally{button.disabled=false}
}
function openPanel(type){
  if(state.session||state.placing||state.editing||state.visitor&&type!=='community')return;
  state.panel=type;
  const names={study:['A FRESH START','Time to focus','A little time today, a little more life tomorrow.'],
    inventory:['YOUR COLLECTION','The little things','Every piece here came from time you made for yourself.'],
    stats:['THE STORY SO FAR','Your progress','Each session leaves a little trace.'],
    community:['AROUND THE SKY','Other islands','A peek at the worlds growing nearby.'],
    settings:['YOUR SPACE','Settings','A place to return whenever you need it.']};
  const [eyebrow,title,subtitle]=names[type];
  $('panel-eyebrow').textContent=eyebrow;$('panel-title').textContent=title;$('panel-subtitle').textContent=subtitle;
  $('panel-content').innerHTML='';updateGameUi();
  if(type==='study')renderStudyPanel();
  if(type==='inventory')renderInventoryPanel();
  if(type==='stats')renderStatsPanel();
  if(type==='community')renderCommunityPanel();
  if(type==='settings')renderSettingsPanel();
  if(type==='study'&&state.tutorial===2)showTutorial(3);
  if(type==='inventory'&&state.tutorial===4)showTutorial(5);
  if(type==='community'&&state.tutorial===8)showTutorial(9);
}
function closePanel(){state.panel=null;updateGameUi()}
function renderStudyPanel(){
  const parent=$('panel-content');
  const previousSubject=$('subject-input')?.value||'';
  parent.innerHTML=`<div class="panel-section-label">HOW LONG?</div><div class="durations" id="duration-options"></div>
    <div class="panel-section-label">WHAT ARE YOU WORKING ON? <span style="font-weight:400;letter-spacing:0">(OPTIONAL)</span></div>
    <input class="subject-input" id="subject-input" maxlength="50" placeholder="e.g. Calculus, Physics, Exam review">
    <button class="primary full panel-action" id="begin-study">Start studying <span>↗</span></button>
    <p class="panel-note">Keep this tab open and visible while you study. Short interruptions under two minutes are okay.</p>`;
  $('subject-input').value=previousSubject;
  for(const minutes of [15,25,45,60,90]){
    const b=document.createElement('button');b.className='duration'+(state.selectedMinutes===minutes?' active':'');
    b.innerHTML=`${minutes}<small>minutes</small>`;
    b.addEventListener('click',()=>{state.selectedMinutes=minutes;renderStudyPanel()});
    $('duration-options').append(b);
  }
  $('begin-study').onclick=startStudy;
}
async function startStudy(){
  const subject=$('subject-input').value.trim();const btn=$('begin-study');btn.disabled=true;
  try{
    const {session}=await api('/api/study/start',{duration_minutes:state.selectedMinutes,subject});
    state.session=session;state.serverOffset=Date.parse(session.server_time)-Date.now();
    closePanel();$('tutorial').hidden=true;state.tutorial=-1;updateGameUi();tick();
  }catch(error){toast(error.message);btn.disabled=false}
}
function tick(){
  if(!state.session)return;
  const remaining=Math.max(0,Date.parse(state.session.started_at)+state.session.duration_seconds*1000-(Date.now()+state.serverOffset));
  const seconds=Math.ceil(remaining/1000);
  $('countdown').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  $('timer-fill').style.width=`${Math.min(100,100*(1-remaining/(state.session.duration_seconds*1000)))}%`;
  if(remaining<=0&&!document.hidden&&!state.finishing)finishStudy();
}
async function heartbeat(){
  if(!state.session||document.hidden||state.heartbeatBusy||state.finishing)return;
  state.heartbeatBusy=true;
  try{
    const result=await api('/api/study/heartbeat',{session_id:state.session.id});
    state.serverOffset=Date.parse(result.server_time)-Date.now();
  }catch(error){
    if(error.status===409){toast(error.message);state.session=null;await loadPlayer();updateGameUi()}
    else toast('Connection interrupted. Trying again soon.');
  }finally{state.heartbeatBusy=false}
}
async function finishStudy(){
  state.finishing=true;
  try{
    const result=await api('/api/study/complete',{session_id:state.session.id});
    const oldSize=state.profile.island_size;
    state.session=null;await loadPlayer();
    if(result.island_size>oldSize)toast('Your island grew! More space has opened up.');
    $('reward-icon').textContent=state.catalog[result.item.kind].icon;
    $('reward-name').textContent=state.catalog[result.item.kind].name;
    $('reward').hidden=false;updateGameUi();
  }catch(error){
    if(error.status===409){toast(error.message);state.session=null;await loadPlayer();updateGameUi()}
    else{toast(error.message);setTimeout(()=>{state.finishing=false},8000)}
  }finally{if(!state.session)state.finishing=false}
}
async function cancelStudy(){
  if(!confirm('End this session? You will not receive a reward.'))return;
  try{await api('/api/study/cancel',{session_id:state.session.id});state.session=null;updateGameUi();toast('Session ended. Your island will be here when you return.')}
  catch(error){toast(error.message)}
}
function renderInventoryPanel(){
  const p=$('panel-content');p.innerHTML='';
  if(!state.inventory.length){p.innerHTML='<p class="empty-message">Nothing in your collection yet. Complete a study session to find something new for your island.</p>';return}
  const grid=document.createElement('div');grid.className='inventory-grid';
  for(const item of state.inventory){
    const def=state.catalog[item.kind],card=document.createElement('button');card.className='item-card';
    card.innerHTML=`<div class="item-art">${def.icon}</div><strong>${escapeHtml(def.name)}</strong><small>Place on island ↗</small>`;
    card.onclick=()=>startPlacement(item);grid.append(card);
  }
  p.append(grid);
}
function startPlacement(item){
  state.placing={...item};state.editing=null;closePanel();
  $('placement-name').textContent=state.catalog[item.kind].name;
  island.startPlacement(item);updateGameUi();
  if(state.tutorial===5)showTutorial(6);
  toast('Move your cursor over the island. Click a clear spot to place.');
}
function stopPlacement(){state.placing=null;island.stopPlacement();updateGameUi()}
async function placeItem(data){
  if(!state.placing)return;
  const updated=state.items.map(item=>item.id===data.id?{...item,x:data.x,z:data.z,rotation:data.rotation}:item);
  try{await api('/api/garden/save',{items:updated.map(({id,x,z,rotation})=>({id,x,z,rotation}))});
    stopPlacement();await loadPlayer();toast('A little more life for your island.');
    if(state.tutorial===6)showTutorial(7);
  }catch(error){toast(error.message)}
}
function selectItem(item){
  if(state.visitor||state.session||state.placing||state.tutorial>=0)return;
  closePanel();state.editing=item;$('edit-name').textContent=state.catalog[item.kind].name;updateGameUi();
}
async function removeItem(){
  if(!state.editing)return;
  const updated=state.items.map(item=>item.id===state.editing.id?{...item,x:null,z:null,rotation:0}:item);
  try{await api('/api/garden/save',{items:updated.map(({id,x,z,rotation})=>({id,x,z,rotation}))});
    state.editing=null;await loadPlayer();toast('Returned to your inventory.');
  }catch(error){toast(error.message)}
}
function renderStatsPanel(){
  const p=$('panel-content');p.innerHTML='<p class="empty-message">Gathering your study story...</p>';
  api('/api/stats').then(data=>{
    if(state.panel!=='stats')return;
    p.innerHTML=`<div class="stat-hero"><strong>${Math.floor(data.total_minutes/60)}h ${data.total_minutes%60}m</strong><span>of focused time</span></div>
      <div class="stat-row"><span>Sessions completed</span><strong>${data.completed_sessions}</strong></div>
      <div class="stat-row"><span>Average session</span><strong>${data.average_minutes} min</strong></div>
      <div class="stat-row"><span>Island size</span><strong>${sizeNames[data.island_size]}</strong></div>
      <div class="panel-section-label">TIME BY SUBJECT</div>`;
    const max=Math.max(1,...Object.values(data.subjects));
    for(const [subject,mins] of Object.entries(data.subjects)){
      const el=document.createElement('div');el.className='subject-bar';
      el.innerHTML=`<div class="subject-line"><span>${escapeHtml(subject)}</span><span>${mins} min</span></div><div class="bar-track"><span style="width:${mins/max*100}%"></span></div>`;
      p.append(el);
    }
    if(!Object.keys(data.subjects).length)p.insertAdjacentHTML('beforeend','<p class="empty-message">Your first session will begin this story.</p>');
    p.insertAdjacentHTML('beforeend','<div class="panel-section-label">RECENT SESSIONS</div>');
    for(const s of data.recent){
      const row=document.createElement('div');row.className='stat-row';
      row.innerHTML=`<span>${escapeHtml(s.subject)} · ${new Date(s.completed_at).toLocaleDateString()}</span><strong>${s.minutes} min</strong>`;
      p.append(row);
    }
  }).catch(e=>{p.textContent=e.message});
}
function renderCommunityPanel(){
  const p=$('panel-content');p.innerHTML='<p class="empty-message">Looking around the sky...</p>';
  api('/api/users').then(({users})=>{
    if(state.panel!=='community')return;p.innerHTML='';
    if(!users.length){p.innerHTML='<p class="empty-message">It is quiet up here for now. When someone else joins, their island will appear here.</p>';return}
    for(const user of users){
      const b=document.createElement('button');b.className='user-row';
      const name=document.createElement('span');name.textContent='✿  '+user.username;
      const arrow=document.createElement('span');arrow.textContent='↗';b.append(name,arrow);
      b.onclick=()=>visit(user);p.append(b);
    }
  }).catch(e=>{p.textContent=e.message});
}
async function visit(user){
  try{
    const garden=await api(`/api/users/${user.id}/garden`);
    state.visitor=garden;closePanel();
    island.buildIsland(garden.island_size);island.setItems(garden.items);
    $('visitor-name').textContent=garden.username;updateGameUi();
    if(state.tutorial===9)finishTutorial();
  }catch(error){toast(error.message)}
}
function renderSettingsPanel(){
  const p=$('panel-content');p.innerHTML='';
  const intro=document.createElement('p');intro.className='settings-entry';intro.textContent=`Logged in as ${state.user.username}. Your island and earned objects are saved to your account.`;
  const logout=document.createElement('button');logout.className='secondary';logout.textContent='Log out';logout.style.marginTop='16px';
  logout.onclick=async()=>{
    try{await api('/api/logout',{})}catch{}
    localStorage.removeItem('bloom_token');state.token=null;state.user=null;state.profile=null;state.panel=null;
    state.session=null;state.visitor=null;state.items=[];state.inventory=[];
    island.buildIsland(0);island.setItems([]);$('tutorial').hidden=true;updateGameUi();
  };p.append(intro,logout);
}

const tutorialSteps=[
  ['A little world of your own','This floating island belongs to you. Every study session can help it grow.','tutorial-next'],
  ['Take a look around','Click and drag the island to see it from another angle.',''],
  ['Make time for a little progress','Tap Study to choose how long to focus.','study-button'],
  ['Time turns into treasures','Once a session is complete, you get a random object to keep. You can explore the timer later.','tutorial-next'],
  ['See what you have','Open Inventory. We left you a little welcome gift.','inventory-button'],
  ['Your first little flower','Choose the Daisy Patch in your inventory.',''],
  ['Find its place','Move over the grass and click an open spot. Press R if you want to turn it.',''],
  ['There is room to grow','Your island expands as your lifetime study time passes 2, 5, and 10 hours.','tutorial-next'],
  ['Visit a neighbor','The Community button lets you view other islands without changing them.','community-button'],
  ['You are all set','Your world is ready. Come back whenever you want to focus.','tutorial-next']
];
function showTutorial(step){
  if(!state.user||state.profile?.user?.tutorial_completed)return;
  state.tutorial=step;
  document.querySelectorAll('.tutorial-target').forEach(el=>el.classList.remove('tutorial-target'));
  const [title,body,target]=tutorialSteps[step];
  $('tutorial-title').textContent=title;$('tutorial-body').textContent=body;
  $('tutorial-count').textContent=`· ${step+1}/${tutorialSteps.length}`;
  $('tutorial-next').hidden=target!=='tutorial-next';$('tutorial').hidden=false;
  if(target&&target!=='tutorial-next')$(target)?.classList.add('tutorial-target');
}
async function finishTutorial(){
  if(state.tutorial<0)return;
  document.querySelectorAll('.tutorial-target').forEach(el=>el.classList.remove('tutorial-target'));
  $('tutorial').hidden=true;state.tutorial=-1;
  try{await api('/api/tutorial/complete',{});state.profile.user.tutorial_completed=true}
  catch(error){toast(error.message)}
}
function tutorialContinue(){
  if(state.tutorial===0)showTutorial(1);
  else if(state.tutorial===3){closePanel();showTutorial(4)}
  else if(state.tutorial===7)showTutorial(8);
  else if(state.tutorial===9)finishTutorial();
}

function connectEvents(){
  $('login-tab').onclick=()=>setAuthMode(false);$('register-tab').onclick=()=>setAuthMode(true);
  $('auth-form').onsubmit=authSubmit;
  $('study-button').onclick=()=>openPanel('study');$('inventory-button').onclick=()=>openPanel('inventory');
  $('stats-button').onclick=()=>openPanel('stats');$('community-button').onclick=()=>openPanel('community');
  $('settings-button').onclick=()=>openPanel('settings');$('panel-close').onclick=closePanel;
  $('return-button').onclick=()=>{state.visitor=null;island.buildIsland(state.profile.island_size);island.setItems(state.items);updateGameUi()};
  $('rotate-button').onclick=()=>island.rotateGhost();$('cancel-placement').onclick=stopPlacement;
  $('move-button').onclick=()=>{const item=state.editing;state.editing=null;startPlacement(item)};
  $('remove-button').onclick=removeItem;$('close-edit').onclick=()=>{state.editing=null;updateGameUi()};
  $('cancel-study').onclick=cancelStudy;
  $('claim-reward').onclick=()=>{$('reward').hidden=true;openPanel('inventory')};
  $('tutorial-next').onclick=tutorialContinue;$('skip-tutorial').onclick=finishTutorial;
  window.addEventListener('keydown',e=>{
    if(e.key.toLowerCase()==='r'&&state.placing&&!e.repeat){island.rotateGhost();e.preventDefault()}
    if(e.key==='Escape'){
      if(state.placing)stopPlacement();else if(state.editing){state.editing=null;updateGameUi()}else closePanel();
    }
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&state.session){heartbeat().then(tick)}
  });
  setInterval(tick,1000);setInterval(heartbeat,30000);
}
try{
  island=new IslandScene($('scene'),{
    onRotate:()=>{if(state.tutorial===1)showTutorial(2)},
    onPlace:placeItem,onSelect:selectItem
  });
  connectEvents();restore();
}catch(error){
  console.error(error);
  $('auth-error').textContent='Your browser could not start the 3D island. Please enable WebGL or try another browser.';
}
