import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const palette = {
  grass: 0x91bd83, grassLight: 0xa7ce91, earth: 0x9a765b, darkEarth: 0x7a644f,
  leaf: 0x729c75, leafLight: 0xa8bf81, pine: 0x568676, wood: 0x9c7656,
  cream: 0xffe6b0, flower: 0xf4c1c4, water: 0x83c6c4, stone: 0xc4bca6,
};
const material = (color, extra={}) => new THREE.MeshStandardMaterial({color, roughness:.92, flatShading:true, ...extra});
const mats = Object.fromEntries(Object.entries(palette).map(([k,v])=>[k, material(v)]));
const sizes = [4.4,5.35,6.3,7.25];
const plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
const pointer = new THREE.Vector2();
const temp = new THREE.Vector3();

function mesh(geometry, mat, x=0,y=0,z=0, parent=null){
  const obj=new THREE.Mesh(geometry,mat);obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;
  if(parent)parent.add(obj);return obj;
}
function ball(parent,r,x,y,z,mat,detail=0){return mesh(new THREE.IcosahedronGeometry(r,detail),mat,x,y,z,parent)}
function cylinder(parent,rt,rb,h,x,y,z,mat,segments=8){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat,x,y,z,parent)}
function flower(parent,x,z,color=mats.flower,scale=1){
  cylinder(parent,.025,.035,.28*scale,x,.18*scale,z,mats.leaf,5);
  ball(parent,.08*scale,x,.33*scale,z,mats.cream,0);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;ball(parent,.078*scale,x+Math.cos(a)*.11*scale,.32*scale,z+Math.sin(a)*.11*scale,color,0);
  }
}
function tree(parent,kind='apple'){
  cylinder(parent,.13,.18,1.25,0,.68,0,mats.wood,7);
  if(kind==='pine'){
    [0,1,2].forEach((i)=>cylinder(parent,.03,.65-i*.12,.9,0,1.05+i*.38,0,mats.pine,7));
  }else if(kind==='willow'){
    ball(parent,.91,0,1.83,0,mats.leaf,1);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(parent,.46,Math.cos(a)*.64,1.48,Math.sin(a)*.64,i%2?mats.leafLight:mats.leaf,0)}
  }else{
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      ball(parent,.53,Math.cos(a)*.41,1.55+Math.sin(a*2)*.12,Math.sin(a)*.41,i%2?mats.leaf:mats.leafLight,1);
    }
    ball(parent,.52,0,1.9,0,mats.leaf,1);
    for(let i=0;i<5;i++){let a=i*2.4;ball(parent,.075,Math.cos(a)*.65,1.54+(i%2)*.28,Math.sin(a)*.55,material(0xd88972))}
  }
}

export function makeObject(kind){
  const root=new THREE.Group();
  if(kind==='daisy'||kind==='tulips'){
    for(let i=0;i<5;i++){
      const a=i*2.399, r=.12+.15*(i%3);
      if(kind==='daisy')flower(root,Math.cos(a)*r,Math.sin(a)*r,i%2?mats.flower:material(0xf9f4e3),.85+(i%2)*.2);
      else{
        const x=Math.cos(a)*r,z=Math.sin(a)*r;
        cylinder(root,.025,.03,.35,x,.18,z,mats.leaf,5);
        ball(root,.13,x,.38,z,i%2?material(0xf5b5a8):material(0xecadbb),0);
      }
    }
  }else if(kind==='mushroom'){
    for(let i=0;i<3;i++){
      const x=(i-1)*.2,z=i%2?.13:-.1, h=i===1?.4:.28;
      cylinder(root,.07,.09,h,x,h/2,z,mats.cream,7);
      const cap=cylinder(root,.09,.23,h*.39,x,h+.01,z,material(i===1?0xcd866e:0xe1a37d),7);
      cap.rotation.z=.04;
      ball(root,.028,x+.05,h+.09,z+.03,mats.cream);
    }
  }else if(kind==='stones'){
    for(let i=0;i<5;i++){const a=i*2.3,r=.12+.15*(i%2);let s=ball(root,.16+(i%3)*.055,Math.cos(a)*r,.12,Math.sin(a)*r,i%2?mats.stone:material(0xadb4a5),0);s.scale.y=.48}
  }else if(kind==='shrub'){
    for(let i=0;i<5;i++)ball(root,.28,Math.cos(i*1.25)*.27,.31,Math.sin(i*1.25)*.25,i%2?mats.leaf:mats.leafLight,0);
  }else if(kind==='lantern'){
    cylinder(root,.055,.09,.83,0,.42,0,mats.wood,6);
    mesh(new THREE.BoxGeometry(.32,.33,.32),material(0xf8e2a6,{emissive:0x88662f,emissiveIntensity:.2}),0,.94,0,root);
    cylinder(root,.24,.24,.06,0,1.13,0,mats.darkEarth,4).rotation.y=Math.PI/4;
  }else if(kind==='bench'){
    mesh(new THREE.BoxGeometry(1.18,.12,.43),mats.wood,0,.43,0,root);
    mesh(new THREE.BoxGeometry(1.18,.47,.1),mats.wood,0,.67,-.25,root);
    for(let x of [-.43,.43])for(let z of [-.14,.14])mesh(new THREE.BoxGeometry(.1,.43,.1),mats.darkEarth,x,.23,z,root);
  }else if(['pine','apple','willow'].includes(kind))tree(root,kind);
  else if(kind==='pond'){
    let water=cylinder(root,.91,.83,.11,0,.07,0,material(palette.water,{metalness:.06,roughness:.33}),10);
    water.scale.z=.79;
    for(let i=0;i<9;i++){let a=i*2*Math.PI/9;let s=ball(root,.18,Math.cos(a)*.8,.13,Math.sin(a)*.66,mats.stone,0);s.scale.y=.45}
    for(let i=0;i<3;i++){let x=(i-1)*.38,z=i%2?.2:-.13;let lily=cylinder(root,.18,.18,.025,x,.143,z,mats.leaf,7);lily.scale.z=.65}
    flower(root,.24,.05,mats.flower,.55);
  }else if(kind==='gazebo'){
    cylinder(root,.83,.83,.12,0,.08,0,mats.stone,8);
    for(let i=0;i<6;i++){let a=i*Math.PI/3;cylinder(root,.065,.08,1.25,Math.cos(a)*.65,.77,Math.sin(a)*.65,mats.cream,6)}
    cylinder(root,.25,1.05,.58,0,1.72,0,material(0xb77d60),6);
    ball(root,.12,0,2.07,0,mats.cream);
  }
  return root;
}

export class IslandScene {
  constructor(container, callbacks={}){
    this.container=container;this.callbacks=callbacks;this.size=0;this.island=new THREE.Group();this.placed=new THREE.Group();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xd8eee6);this.scene.fog=new THREE.FogExp2(0xd8eee6,.012);
    this.camera=new THREE.PerspectiveCamera(39,container.clientWidth/container.clientHeight,.1,150);
    this.camera.position.set(10,11.8,15.8);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));this.renderer.setSize(container.clientWidth,container.clientHeight);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.43;
    container.append(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.target.set(0,-.4,0);this.controls.enableDamping=true;this.controls.dampingFactor=.065;
    this.controls.enablePan=false;this.controls.minDistance=10;this.controls.maxDistance=30;
    this.controls.minPolarAngle=.28;this.controls.maxPolarAngle=1.37;
    this.controls.addEventListener('change',()=>{if(this.dragging)this.callbacks.onRotate?.()});
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x9cb9a4,2.15));
    const sun=new THREE.DirectionalLight(0xfff5d7,2.6);sun.position.set(-7,14,10);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-15;sun.shadow.camera.right=15;
    sun.shadow.camera.top=15;sun.shadow.camera.bottom=-15;sun.shadow.normalBias=.02;this.scene.add(sun);
    this.scene.add(this.island);this.island.add(this.placed);
    this.clouds=new THREE.Group();this.scene.add(this.clouds);this.addClouds();
    this.specks=new THREE.Group();this.scene.add(this.specks);this.addSpecks();
    this.raycaster=new THREE.Raycaster();this.ghost=null;this.selected=null;
    this.buildIsland(0);
    this.renderer.domElement.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};this.dragging=true});
    this.renderer.domElement.addEventListener('pointerup',e=>{
      this.dragging=false;
      if(this.down&&Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<6){
        this.pick(e);if(this.ghost&&this.valid)this.callbacks.onPlace?.(this.ghostData);
        else if(!this.ghost){const item=this.hitPlaced(e);if(item)this.callbacks.onSelect?.(item)}
      }
      this.down=null;
    });
    this.renderer.domElement.addEventListener('pointermove',e=>{if(this.ghost)this.pick(e)});
    window.addEventListener('resize',()=>this.resize());
    this.clock=new THREE.Clock();this.animate();
  }
  addClouds(){
    const clouds=[[-13,4,-14,1.5],[12,3,-16,1.8],[-18,-1,-7,1.2],[17,1,1,1.1],[-4,5,-26,2.7],[10,6,-22,1.5],[-20,5,-29,2.2]];
    for(const [x,y,z,s] of clouds){
      let group=new THREE.Group();group.position.set(x,y,z);group.userData.base=x;
      for(let i=0;i<4;i++){
        let m=ball(group,.7*s,(-1.1+i*.68)*s,(i%2)*.18*s,0,material(0xffffff,{transparent:true,opacity:.45}),1);
        m.scale.set(1.2,.39,.58);m.castShadow=false;
      }
      this.clouds.add(group);
    }
  }
  addSpecks(){
    const rng=i=>{let v=Math.sin(i*154.239)*43758.54;return v-Math.floor(v)};
    for(let i=0;i<40;i++){
      let x=(rng(i+1)-.5)*23,z=(rng(i+241)-.5)*22,y=(rng(i+110)-.5)*8+1;
      let point=ball(this.specks,.025+(rng(i+44)*.032),x,y,z,material(0xfff9d9,{emissive:0xffe6ad,emissiveIntensity:.25}),0);
      point.castShadow=false;point.userData.speed=rng(i+301)*.35;
    }
  }
  buildIsland(size){
    this.size=size;this.island.children.filter(child=>child!==this.placed).forEach(child=>this.island.remove(child));
    const r=sizes[size];
    const ground=cylinder(this.island,r*.99,r*.84,1.08,0,-.56,0,[mats.earth,mats.grass,mats.darkEarth],12);
    ground.castShadow=true;
    cylinder(this.island,r*.84,.18,2.05,0,-2.115,0,mats.earth,12);
    cylinder(this.island,r,r*.99,.17,0,-.045,0,mats.grass,12);
    cylinder(this.island,r*.83,r*.83,.018,0,.048,0,mats.grassLight,12);
    const ring=new THREE.Group();this.island.add(ring);
    const number=24+size*8;
    for(let i=0;i<number;i++){
      const angle=i*2.399963,radius=r*(.82+.075*(i%3));
      const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
      if(i%7===0){let bush=ball(ring,.16,x,.19,z,i%2?mats.leaf:mats.leafLight,0);bush.scale.y=.65}
      else if(i%3===0)flower(ring,x,z,i%2?mats.flower:mats.cream,.41);
      else for(let j=0;j<2;j++){
        let blade=mesh(new THREE.ConeGeometry(.05,.23,3),i%2?mats.leaf:mats.leafLight,x+j*.09,.15,z,ring);
        blade.rotation.z=j?-.25:.2;
      }
    }
  }
  setItems(items){
    this.placed.clear();this.placedItems=items;
    for(const item of items){
      if(item.x===null)continue;
      const object=makeObject(item.kind);
      object.position.set(item.x*.75,.052,item.z*.75);
      object.rotation.y=item.rotation*Math.PI/2;object.userData.itemId=item.id;
      this.placed.add(object);
    }
  }
  startPlacement(item){
    this.stopPlacement();this.ghost=makeObject(item.kind);this.ghost.rotation.y=item.rotation*Math.PI/2;
    this.ghost.traverse(child=>{if(child.isMesh){child.material=child.material.clone();child.material.transparent=true;child.material.opacity=.65;child.castShadow=false}});
    this.island.add(this.ghost);this.ghost.visible=false;this.ghostData={...item};this.controls.enabled=false;
  }
  stopPlacement(){if(this.ghost)this.island.remove(this.ghost);this.ghost=null;this.ghostData=null;this.controls.enabled=true}
  rotateGhost(){if(!this.ghost)return;this.ghostData.rotation=(this.ghostData.rotation+1)%4;this.ghost.rotation.y=this.ghostData.rotation*Math.PI/2}
  pick(e){
    const rect=this.renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(pointer,this.camera);
    plane.constant=-this.island.position.y-.05;
    const at=this.raycaster.ray.intersectPlane(plane,temp);
    if(!at||!this.ghost)return;
    const x=Math.round(at.x/.75),z=Math.round(at.z/.75),radii={daisy:.4,tulips:.4,mushroom:.38,stones:.4,shrub:.5,lantern:.48,bench:.75,pine:.68,apple:.74,willow:.95,pond:1.08,gazebo:1.2};
    const item=this.ghostData,r=radii[item.kind],px=x*.75,pz=z*.75;
    this.valid=Math.hypot(px,pz)+r<=sizes[this.size]-.35 &&
      !(this.placedItems||[]).some(other=>other.x!==null&&other.id!==item.id&&Math.hypot(px-other.x*.75,pz-other.z*.75)<r+radii[other.kind]-.08);
    this.ghost.visible=Math.hypot(at.x,at.z)<sizes[this.size]+.7;
    this.ghost.position.set(px,.06,pz);
    this.ghostData.x=x;this.ghostData.z=z;
    this.ghost.traverse(child=>{if(child.isMesh){child.material.opacity=this.valid?.7:.37;child.material.emissive.setHex(this.valid?0x000000:0x752525)}});
  }
  hitPlaced(e){
    const rect=this.renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.placed.children,true);
    if(!hits.length)return null;
    let parent=hits[0].object;
    while(parent&&!parent.userData.itemId)parent=parent.parent;
    return (this.placedItems||[]).find(item=>item.id===parent?.userData.itemId)||null;
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h)}
  animate(){
    requestAnimationFrame(()=>this.animate());
    const t=this.clock.getElapsedTime();
    this.island.position.y=Math.sin(t*.8)*.085;
    this.island.rotation.y=Math.sin(t*.22)*.011;
    for(const [i,cloud] of this.clouds.children.entries())cloud.position.x=cloud.userData.base+Math.sin(t*.12+i)*.55;
    for(const [i,speck] of this.specks.children.entries())speck.position.y+=Math.sin(t*.7+i)*.0008;
    this.controls.update();this.renderer.render(this.scene,this.camera);
  }
}
