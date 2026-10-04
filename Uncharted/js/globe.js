import * as THREE from "three";
import { OrbitControls } from "../vendor/OrbitControls.js";

const radians = Math.PI / 180;
export function position(lat, lon, radius = 1) {
  return new THREE.Vector3(
    radius * Math.cos(lat * radians) * Math.cos(lon * radians),
    radius * Math.sin(lat * radians),
    -radius * Math.cos(lat * radians) * Math.sin(lon * radians),
  );
}

export class World {
  constructor(element, onSelect, onReady, onError) {
    this.element = element;
    this.onSelect = onSelect;
    this.markers = new Map();
    this.discoveries = [];
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.paused = false;
    this.flight = null;
    this.reveal = null;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.copy(position(22, 32, 3.5));
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.append(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.65;
    this.controls.maxDistance = 5;
    this.controls.autoRotate = !this.reduced;
    this.controls.autoRotateSpeed = 0.23;
    this.controls.addEventListener("start", () => {
      if (this.flight) {
        this.flight.resolve();
        this.flight = null;
      }
    });
    this.scene.add(new THREE.AmbientLight(0xb9d6df, 0.6));
    this.sun = new THREE.DirectionalLight(0xfff1d6, 1.9);
    this.scene.add(this.sun);
    const geometry = new THREE.SphereGeometry(1, 96, 64);
    this.earth = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 8,
        specular: 0x1b363d,
      }),
    );
    this.scene.add(this.earth);
    this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = 2048;
    this.maskCanvas.height = 1024;
    this.maskContext = this.maskCanvas.getContext("2d");
    this.maskTexture = new THREE.CanvasTexture(this.maskCanvas);
    this.maskTexture.wrapS = THREE.RepeatWrapping;
    this.paintMask();
    this.cloudMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        clouds: { value: null },
        revealed: { value: this.maskTexture },
        time: { value: 0 },
        sun: { value: new THREE.Vector3(1, 1, 1) },
      },
      vertexShader: `
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vObject;
        void main(){vUv=uv;vObject=position;vNormal=normalize(normalMatrix*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform sampler2D clouds; uniform sampler2D revealed;
        uniform float time; uniform vec3 sun;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vObject;
        float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
        float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        float field(vec3 p){return noise(p)*.57+noise(p*2.03)*.28+noise(p*4.07)*.15;}
        void main(){
          vec3 p=normalize(vObject);
          vec2 uv=vec2(fract(vUv.x+time),vUv.y);
          float satellite=texture2D(clouds,uv).a;
          float billow=field(p*10.+vec3(time*90.,0.,0.));
          float detail=field(p*30.+billow*2.);
          float density=smoothstep(.19,.81,billow*.66+satellite*.36+detail*.18);
          float ridge=smoothstep(.32,.72,detail);
          vec3 light=normalize(sun);
          float daylight=smoothstep(-.28,.65,dot(normalize(vNormal),light));
          float shade=.20+.80*daylight;
          vec3 valleys=vec3(.52,.58,.67);
          vec3 crests=vec3(.96,.95,.91);
          vec3 color=mix(valleys,crests,density*.74+ridge*.10+.14)*shade;
          color+=vec3(.035,.045,.065)*(1.-daylight);
          float mask=texture2D(revealed,vUv).r;
          // A nearly opaque weather deck hides terrain. Only discovery holes
          // become transparent; texture detail affects shading, not coverage.
          float edge=mask+(density-.5)*.24*smoothstep(.02,.2,mask)*(1.-smoothstep(.8,.98,mask));
          float coverage=1.-smoothstep(.05,.93,edge);
          float rim=pow(max(0.,1.-abs(vNormal.z)),3.);
          color+=vec3(.13,.20,.30)*rim*.25;
          gl_FragColor=vec4(color,.996*coverage);
        }`,
    });
    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.027, 128, 96),
      this.cloudMaterial,
    );
    this.scene.add(this.clouds);
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.058, 64, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
        fragmentShader: `varying vec3 n;varying vec3 v;void main(){float a=pow(1.-abs(dot(n,v)),3.);gl_FragColor=vec4(.20,.35,.63,a*.28);}`,
      }),
    );
    this.scene.add(atmosphere);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    let down = null;
    element.addEventListener("pointerdown", (e) => {
      down = { x: e.clientX, y: e.clientY };
    });
    element.addEventListener("pointerup", (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7)
        return;
      const rect = element.getBoundingClientRect();
      this.pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(
        [this.earth, ...[...this.markers.values()].map((m) => m.dot)],
        false,
      );
      if (hits[0]?.object.userData.place)
        this.onSelect(hits[0].object.userData.place);
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(element);
    this.resize();
    const loader = new THREE.TextureLoader();
    Promise.all([
      loader.loadAsync(new URL("../assets/earth.jpg", import.meta.url).href),
      loader.loadAsync(new URL("../assets/clouds.png", import.meta.url).href),
    ])
      .then(([earth, clouds]) => {
        earth.colorSpace = THREE.SRGBColorSpace;
        earth.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        this.earth.material.map = earth;
        this.earth.material.needsUpdate = true;
        clouds.wrapS = THREE.RepeatWrapping;
        this.cloudMaterial.uniforms.clouds.value = clouds;
        onReady();
      })
      .catch(onError);
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      onError(
        new Error(
          "Globe graphics were interrupted. Reload to restore the globe. Your passport is safe.",
        ),
      );
    });
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame());
  }
  resize() {
    const { width, height } = this.element.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    // Preserve horizontal globe framing in tall phone viewports.
    this.camera.fov =
      (2 *
        Math.atan(Math.tan(19 * radians) / Math.min(1, this.camera.aspect))) /
      radians;
    this.camera.updateProjectionMatrix();
  }
  paintMask(active = null, progress = 1) {
    const ctx = this.maskContext;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 2048, 1024);
    for (const p of this.discoveries) {
      const fraction = active?.id === p.id ? progress : 1;
      if (fraction <= 0) continue;
      const x = ((p.lon + 180) / 360) * 2048,
        y = ((90 - p.lat) / 180) * 1024,
        ry = 68 * fraction,
        rx = ry / Math.max(0.25, Math.cos(p.lat * radians));
      for (const shift of [-2048, 0, 2048]) {
        ctx.save();
        ctx.translate(x + shift, y);
        ctx.scale(rx, ry);
        const gradient = ctx.createRadialGradient(0, 0, 0.25, 0, 0, 1);
        gradient.addColorStop(0, "white");
        gradient.addColorStop(0.62, "rgba(255,255,255,.98)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
      }
    }
    this.maskTexture.needsUpdate = true;
  }
  setPlaces(places) {
    this.discoveries = places;
    for (const p of places) {
      if (this.markers.has(p.id)) continue;
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.017, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xf4d5a1 }),
      );
      dot.position.copy(position(p.lat, p.lon, 1.025));
      dot.userData.place = p;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.026, 0.033, 32),
        new THREE.MeshBasicMaterial({
          color: 0xe9c68d,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.55,
        }),
      );
      ring.position.copy(position(p.lat, p.lon, 1.022));
      ring.lookAt(position(p.lat, p.lon, 2));
      this.scene.add(dot, ring);
      this.markers.set(p.id, { dot, ring });
    }
    for (const [id, m] of this.markers) {
      if (!places.some((p) => p.id === id)) {
        this.scene.remove(m.dot, m.ring);
        m.dot.geometry.dispose();
        m.dot.material.dispose();
        m.ring.geometry.dispose();
        m.ring.material.dispose();
        this.markers.delete(id);
      }
    }
    this.paintMask();
  }
  async discover(place, isNew) {
    await this.flyTo(place);
    if (isNew && !this.reduced) {
      await new Promise((resolve) => {
        this.reveal = { place, start: performance.now(), resolve };
      });
    } else this.paintMask();
  }
  flyTo(place) {
    if (this.flight) {
      this.flight.resolve();
      this.flight = null;
    }
    if (this.reduced) {
      this.camera.position.copy(position(place.lat, place.lon, 2.65));
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.flight = {
        start: performance.now(),
        from: this.camera.position.clone(),
        to: position(place.lat, place.lon, 2.65),
        resolve,
      };
    });
  }
  setFullEarth(enabled) {
    // Hide only the cloud mesh. Discovered patches and markers stay intact.
    this.clouds.visible = !enabled;
  }
  setMotion(reduced) {
    this.reduced = reduced;
    this.controls.autoRotate = !reduced && !this.paused;
  }
  toggleRotation() {
    this.paused = !this.paused;
    this.controls.autoRotate = !this.paused && !this.reduced;
    return this.paused;
  }
  zoom(factor) {
    this.camera.position.multiplyScalar(factor);
    this.controls.update();
  }
  home() {
    return this.flyTo({ lat: 22, lon: 32 });
  }
  frame() {
    const now = performance.now(),
      delta = Math.min(this.clock.getDelta(), 0.1);
    if (document.hidden) return;
    this.controls.autoRotate =
      !this.paused && !this.reduced && !this.flight && !this.reveal;
    if (this.flight) {
      const f = this.flight,
        t = Math.min(1, (now - f.start) / 1800),
        e = t * t * (3 - 2 * t);
      const from = f.from.clone().normalize(),
        to = f.to.clone().normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(from, to);
      const qi = new THREE.Quaternion().slerp(q, e);
      this.camera.position.copy(
        from
          .applyQuaternion(qi)
          .multiplyScalar(
            THREE.MathUtils.lerp(f.from.length(), f.to.length(), e),
          ),
      );
      if (t === 1) {
        this.flight = null;
        f.resolve();
      }
    }
    this.controls.update(delta);
    if (this.reveal) {
      const r = this.reveal,
        t = Math.min(1, (now - r.start) / 1300);
      this.paintMask(r.place, t);
      const marker = this.markers.get(r.place.id);
      if (marker) {
        marker.ring.scale.setScalar(1 + Math.sin(t * Math.PI) * 2);
        marker.ring.material.opacity = 0.8;
      }
      if (t === 1) {
        this.reveal = null;
        r.resolve();
      }
    }
    if (!this.reduced)
      this.cloudMaterial.uniforms.time.value += delta * 0.00045;
    this.sun.position.copy(
      new THREE.Vector3(-4, 3, 2).applyQuaternion(this.camera.quaternion),
    );
    this.cloudMaterial.uniforms.sun.value.copy(
      this.sun.position
        .clone()
        .transformDirection(this.camera.matrixWorldInverse),
    );
    this.renderer.render(this.scene, this.camera);
  }
}
