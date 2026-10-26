/* =============================================================================
 * floor1.js — ชั้น 1 · คาเฟ่ 24 ชม. สไตล์ Minimal + บาร์กาแฟตัว L   (เจ้าของ: Sonnet-A)   [รอบ 4: ห้อง 40x80]
 *
 * ผังห้อง (fx,fy):  ผนังยาว = fx 0 (ซ้ายบนจอ, 160 px) · ผนังสั้น = fy 0 (ขวาบนจอ, 80 px)
 *   - บาร์ตัว L (วาดด้วยโค้ด): ขายาวขนานผนังยาว + ขาสั้นหันเข้าห้อง · บาริสต้ายืนในมุม L
 *     เคาน์เตอร์หลังชิดผนัง: เครื่องชงใหญ่+ถ้วยซ้อน · เครื่องบด · pour-over · ชั้นผนังถุงเมล็ด+โหลแก้ว · โคมแขวนเหนือบาร์
 *   - สตูล 5 ตัวด้านนอกบาร์ (ขายาว 3 · ขาสั้น 2) ลูกค้า 2x นั่งหันเข้าหาบาร์
 *   - ส่วนที่เหลือของห้องโล่ง: โต๊ะ 1 ชุด · ต้นไม้ 1 · แมว 1 · ป้าย 24H เล็ก · ประตูกระจกผนังขวา
 *   - ลูกค้า 2 slot (พร้อมกันสูงสุด 2): เดินเข้าประตู → นั่งที่บาร์ (~60%) หรือโต๊ะ → จิบ ~20 วิ → เดินออก
 *   - ลำดับการวาด (order) ของบาร์ตั้งเอง = base + (x+y หน่วย) เพื่อให้ลูกค้า/สตูลซ้อนกับขาบาร์ถูกด้าน
 * logic ทั้งหมดอยู่ใน sim(t) ฟังก์ชันเดียว (อัปเดตครั้งเดียวต่อเฟรม ไม่ว่า object ไหนถูกวาดก่อน)
 * ========================================================================== */
(function(){
'use strict';
const C = window.Core;
const PEO = () => window.SPR_PEOPLE || {};
const ITM = () => window.SPR_ITEMS || {};
const rnd = (a, b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const NOBOX = {x:0, y:0, w:0, h:0};

/* ------------------------------ ตำแหน่ง (หน่วย: fx 0-40, fy 0-80) ------------------------------ */
const X = n => C.ux(n), Y = n => C.uy(n);
const UX = () => C.UX, UY = () => C.UY;
const MAXCUST = 2;
/* บาร์ตัว L: ขายาว x 8-14, y 6-50 (4 ช่วงเรียงลำดับวาด) · ขาสั้น x 14-30, y 44-50 · เคาน์เตอร์หลัง x 0-4.5, y 5-51
 * BAR_H = สูงตัวบาร์ (px) + ท็อป 2 px = BAR_T */
const BAR_H = 20, BAR_T = BAR_H + 2, BK_H = 17, BK_T = BK_H + 2;
const LEG_SEGS = [[6, 18], [18, 30], [30, 42]];         // ช่วง y ของขายาว (ช่วงสุดท้ายต่อกับมุม L)
const BARISTA = {fx:6/40, fy:35/80};
const DOOR    = {fx:0.96, fy:0.02};      // ผนังสั้น (ขวา) flip
const SIGN    = {fx:0.0,  fy:0.84, fz:62};       // ผนังยาว ไม่ flip (ตัวอักษรไม่กลับด้าน)
const DOORSPOT = [0.80, 0.10];           // จุดที่ลูกค้าโผล่หน้าประตู
const TABLES = [ {a:0.86, b:0.40} ];
const PLANTS = [ {n:'plant_big', fx:0.12, fy:0.88} ];
const CAT_SPOTS = { a:[0.66, 0.14], b:[0.95, 0.62], c:[0.64, 0.80] };
const LAMP = {x:12, y:37, z:60};

/* ที่นั่ง: สตูลบาร์ (kind 'bar') + โต๊ะ (kind 'table')
 *   สตูลขายาว: นั่งที่ x=17.5 หันซ้ายล่าง (flip=true) เดินเข้าจากด้าน +fx
 *   สตูลขาสั้น: นั่งที่ y=53.5 หันขวาล่าง (flip=false) เดินเข้าจากด้าน +fy
 *   ord = ลำดับวาดของสตูล (ตั้งตอน build เพราะต้องใช้ base ของชั้น)
 *   โต๊ะ: chair1 หันไป +fx (flip=false) เดินเข้าจากด้าน +fy · chair2 หันไป +fy (flip=true) เดินเข้าจากด้าน +fx */
const SEATS = [];
[10, 24, 37].forEach((yy, i) => SEATS.push({kind:'bar', idx:SEATS.length, seat:[X(17.5), Y(yy)], app:[X(21.5), Y(yy)], flip:true, fz:-1, segEnd:LEG_SEGS[i][1], leg:'long', who:-1}));
[20, 29].forEach(xx => SEATS.push({kind:'bar', idx:SEATS.length, seat:[X(xx), Y(59.5)], app:[X(xx), Y(67)], flip:false, fz:-1, leg:'short', who:-1}));
TABLES.forEach((t, ti) => {
  SEATS.push({kind:'table', ti, seat:[t.a-X(8.4), t.b-Y(3.0)], app:[t.a-X(8.4), t.b+Y(3.8)], flip:false, fz:-6, who:-1});
  SEATS.push({kind:'table', ti, seat:[t.a-X(3.0), t.b-Y(8.4)], app:[t.a+X(3.8), t.b-Y(8.4)], flip:true,  fz:-6, who:-1});
});

/* สิ่งกีดขวางของ pathfinding [fx0,fx1,fy0,fy1] */
const BLOCK = TABLES.map(t => [t.a-X(11), t.a+X(3), t.b-Y(12), t.b+Y(3)]);
BLOCK.push([0.0, X(16), 0.0, Y(58)]);            // เคาน์เตอร์หลัง + บาริสต้า + ขายาว
BLOCK.push([X(14), X(31), Y(49), Y(57)]);        // ขาสั้นของ L
BLOCK.push([0.0, 0.30, 0.76, 0.96]);             // ต้นไม้

function segFree(a, b){
  // ก้าวละ ~0.8 หน่วย (คิดเป็นหน่วย ไม่ใช่สัดส่วน เพราะ fx/fy ไม่เท่ากัน)
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0]-a[0])*UX(), Math.abs(b[1]-a[1])*UY()) / 0.8));
  for (let i = 0; i <= n; i++){
    const x = a[0] + (b[0]-a[0])*i/n, y = a[1] + (b[1]-a[1])*i/n;
    for (const r of BLOCK) if (x > r[0] && x < r[1] && y > r[2] && y < r[3]) return false;
  }
  return true;
}
const plen = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.abs(p[i][0]-p[i-1][0])*UX() + Math.abs(p[i][1]-p[i-1][1])*UY(); return s; };
/* เส้นทางเดินตามแกน (iso แนวทแยง) หลบโต๊ะ/เคาน์เตอร์ → คืน array จุด */
function route(a, b){
  const cands = [[a, [b[0], a[1]], b], [a, [a[0], b[1]], b]];
  for (let m = 0.05; m <= 0.97; m += 0.04){
    cands.push([a, [m, a[1]], [m, b[1]], b]);
    cands.push([a, [a[0], m], [b[0], m], b]);
  }
  let best = null, bl = 1e9;
  for (const p of cands){
    let ok = true;
    for (let i = 1; i < p.length; i++) if (!segFree(p[i-1], p[i])){ ok = false; break; }
    if (!ok) continue;
    const l = plen(p); if (l < bl){ bl = l; best = p; }
  }
  return best || [a, b];
}

/* ------------------------------ ตัวแปรเสื้อลูกค้า ------------------------------ */
const VARIANTS = [
  null,
  {a:'#3f5f9a', A:'#2c4372', h:'#1c1420'},
  {a:'#d8b25a', A:'#a8842a', h:'#5a3322'},
  {a:'#7a3a5a', A:'#552a42', h:'#d8b25a'},
  {a:'#3a9a96', A:'#2a7370', h:'#2b2238'}
];
const vcache = new Map();
function variant(name, vi){
  const base = PEO()[name]; if (!base || !vi) return base;
  const v = VARIANTS[vi]; if (!v) return base;
  const k = name + vi; let s = vcache.get(k);
  if (!s || s._base !== base){ s = Object.assign({}, base, {pal: Object.assign({}, base.pal, v)}); s._base = base; vcache.set(k, s); }
  if (C._internal && C._internal.PEOPLE) C._internal.PEOPLE.add(s);     // สำเนาสีเสื้อ ต้องลงทะเบียนเป็น sprite คน ไม่งั้นไม่ถูกขยาย 2x
  return s;
}

/* ------------------------------ สถานะรวม ------------------------------ */
const G = {
  last: null, simT: -1, doorUntil: 0, signOn: true, steamUntil: 0, greetAt: -99,
  tableObjs: [],
  cust: [0, 1].map(k => ({k, st:'wait', wait: k === 0 ? 2.0 : 13, fx:0, fy:0, path:null, pi:0, seat:null, flip:false, v:0, until:0, vis:false, dirFlip:false, frameT:0})),
  cat: {st:'lie', fx:CAT_SPOTS.c[0], fy:CAT_SPOTS.c[1], spot:'c', until:6, path:null, pi:0, flip:false, hopT:-9, vis:true}
};
const MAXC = () => Math.min(MAXCUST, {morning:1, evening:2, night:2}[C.time.phase] || 1);
const WALK_SPEED = 14, CAT_SPEED = 7;     // หน่วย/วินาที (1 หน่วย = 2 px แนวนอน) — คิดเป็นหน่วยเพื่อให้เดินแกน fx/fy เร็วเท่ากันบนจอ

function stepAlong(o, speed, dt){
  // เดินไปตาม o.path; คืน true เมื่อถึงปลายทาง   (speed = หน่วย/วิ; ระยะคิดเป็นหน่วย: dx*80, dy*40)
  let left = speed*dt;
  while (left > 1e-6 && o.pi < o.path.length){
    const tg = o.path[o.pi], dx = tg[0]-o.fx, dy = tg[1]-o.fy, d = Math.hypot(dx*UX(), dy*UY());
    if (d <= left){ o.fx = tg[0]; o.fy = tg[1]; o.pi++; left -= d; }
    else {
      const k = left/d; o.fx += dx*k; o.fy += dy*k; left = 0;
      // หันซ้าย/ขวาตามทิศบนจอ: จอ x = 2*(fx*UX - fy*UY) → +fx หรือ −fy = ขวา
      const sx = dx*UX() - dy*UY(); if (Math.abs(sx) > 1e-6) o.flip = sx < 0;
    }
  }
  return o.pi >= o.path.length;
}

function openDoor(t, ms){ G.doorUntil = Math.max(G.doorUntil, t + (ms || 1.6)); }

function freeSeat(){
  const f = SEATS.filter(s => s.who < 0);
  if (!f.length) return null;
  const bar = f.filter(s => s.kind === 'bar');
  return (bar.length && Math.random() < 0.6) ? pick(bar) : pick(f);     // ชอบนั่งบาร์ ~60%
}

function simCust(c, t, dt){
  const phase = C.time.phase;
  if (c.st === 'wait'){
    c.vis = false;
    c.wait -= dt;
    if (c.wait <= 0){
      if (c.k >= MAXC()){ c.wait = 2; return; }
      const s = freeSeat(); if (!s){ c.wait = 3; return; }
      s.who = c.k; c.seat = s; c.v = Math.floor(Math.random()*VARIANTS.length);
      c.fx = DOORSPOT[0]; c.fy = DOORSPOT[1]; c.vis = true; c.flip = true;
      c.path = route([c.fx, c.fy], s.app).slice(1); c.path.push(s.seat); c.pi = 0;
      c.st = 'walkin'; openDoor(t, 1.8);
      C.bubble('f1_door', 'チリン♪', 1100);
      if (t - G.greetAt > 2){ C.bubble('f1_barista', 'いらっしゃいませ!', 1500); G.greetAt = t; }
    }
  } else if (c.st === 'walkin'){
    if (stepAlong(c, WALK_SPEED, dt)){ c.st = 'sit'; c.flip = c.seat.flip; c.until = t + rnd(17, 24); c.sip = rnd(0, 3); }
  } else if (c.st === 'sit'){
    c.fx = c.seat.seat[0]; c.fy = c.seat.seat[1]; c.flip = c.seat.flip;
    if (t >= c.until){
      c.path = [c.seat.app].concat(route(c.seat.app, DOORSPOT).slice(1)); c.pi = 0;
      c.seat.who = -1; c.st = 'walkout';
    }
  } else if (c.st === 'walkout'){
    if (stepAlong(c, WALK_SPEED, dt)){ c.st = 'exit'; c.until = t + 0.9; openDoor(t, 1.6); C.bubble('f1_door', 'チリン♪', 900); }
  } else if (c.st === 'exit'){
    if (t >= c.until){
      c.vis = false; c.st = 'wait';
      c.wait = phase === 'morning' ? rnd(9, 16) : phase === 'evening' ? rnd(5, 10) : rnd(4, 8);
    }
  }
}

function simCat(t, dt){
  const k = G.cat;
  if (k.st === 'lie' || k.st === 'sitIdle'){
    if (t >= k.until){
      if (k.st === 'lie'){
        const names = Object.keys(CAT_SPOTS).filter(n => n !== k.spot), n = pick(names), to = CAT_SPOTS[n];
        k.path = route([k.fx, k.fy], to).slice(1); k.pi = 0; k.st = 'walk'; k.target = n;
      } else { k.st = 'lie'; k.until = t + rnd(14, 28); }
    }
  } else if (k.st === 'walk'){
    if (stepAlong(k, CAT_SPEED, dt)){ k.spot = k.target; k.st = 'sitIdle'; k.until = t + rnd(2.5, 4); }
  }
}

function sim(t){
  if (G.simT === t) return;
  G.simT = t;
  const dt = G.last == null ? 0 : Math.max(0, Math.min(0.1, t - G.last));
  G.last = t;
  for (const c of G.cust) simCust(c, t, dt);
  simCat(t, dt);
}

/* ------------------------------ ตัวช่วยวาด ------------------------------ */
function drawItem(name, fx, fy, frame, flip, fz){
  const s = ITM()[name]; if (!s) return;
  C.drawSprite(s, fx, fy, frame||0, !!flip, fz||0);
}
function bboxOf(name, fx, fy, fz, src){
  const s = (src || ITM())[name]; return s ? C.spriteBBox(s, fx, fy, fz||0) : {x:0, y:0, w:0, h:0};
}
function pad(b, p){ return {x:b.x-p, y:b.y-p, w:b.w+2*p, h:b.h+2*p}; }
function steam(cx, cy, t, seed){
  // ไอน้ำ pixel ลอยขึ้น 5 ก้อน
  for (let i = 0; i < 5; i++){
    const ph = ((t*1.1 + i*0.2 + seed) % 1), y = cy - ph*16, x = cx + Math.round(Math.sin(ph*6 + i*2)*2);
    const a = 1 - ph;
    C.emit(() => { const ctx = C.ctx, g = ctx.globalAlpha; ctx.globalAlpha = g * a * 0.9; C.rect(x, y, 2, 2, '#eae0d0'); if (i%2) C.px(x+2, y+1, '#c9b9a0'); ctx.globalAlpha = g; });
  }
}
const CUST_LINES = ['ลาเต้อร่อยจัง', 'เปิดทั้งคืนเลยเนอะ', 'Wi-Fi แรงดี', 'ขออีกแก้วค่ะ', 'บรรยากาศดีจัง', 'ร้านนี้แมวน่ารัก', '...zzz', 'เช็ค BTC หน่อย'];

/* ============================================================================ */
window.FLOORS = window.FLOORS || {};
window.FLOORS[1] = {
  name:'คาเฟ่ 24 ชม.', nameJP:'24時間カフェ',
  desc:'คาเฟ่มินิมอล · บาร์กาแฟตัว L มีสตูล 5 ตัว + บาริสต้า เครื่องชงใหญ่ ชั้นเมล็ดกาแฟ โคมแขวน · โต๊ะ 1 ชุด แมว 1 ตัว ลูกค้าเดินเข้ามานั่ง (สูงสุด 2 คน) · คลิก: บาริสต้า/เครื่องชง/เครื่องบด/ถุงเมล็ด/โหลแก้ว/ลูกค้า/แมว/ป้าย/ประตู',
  shell:{ wallL:'#ece4d2', wallR:'#f8f4ea', floor:'wood', floorC:'#e2c99c', floorC2:'#d4b987', trim:'#c9bfa8' },

  ambient(ctx, t){
    const lit = C.lit(1), a = lit ? 0.22 : 0.09;
    TABLES.forEach(tb => C.pool(tb.a-X(4.5), tb.b-Y(4.5), 26, 12, C.PAL.warm, a));
    // กองแสงโคมแขวนเหนือบาร์ (วงใหญ่นุ่ม + วงในเข้ม)
    C.pool(X(LAMP.x + 4), Y(LAMP.y), 34, 15, '#ffd48a', lit ? 0.22 : 0.20);
    C.pool(X(LAMP.x + 5), Y(LAMP.y), 20, 9, '#ffe2a8', lit ? 0.22 : 0.24);
  },

  build(F){
    const out = [];
    const bb = (n, fx, fy, fz, src) => bboxOf(n, fx, fy, fz, src);

    /* ---------- ประตูกระจก (ผนังสั้น/ขวา, flip) ---------- */
    const door = { id:'f1_door', kind:'furniture', label:'ประตูกระจก', hint:'คลิก: เปิดประตู (กระดิ่ง)',
      ...bb('glass_door', DOOR.fx, DOOR.fy, 0),
      draw(ctx, t){ sim(t); drawItem('glass_door', DOOR.fx, DOOR.fy, t < G.doorUntil ? 1 : 0, true, 0); },
      onClick(){ openDoor(C.t, 2.2); C.bubble(this.id, 'チリン♪ ประตูเปิด', 1200); C.log('1F เปิดประตู'); } };
    out.push(door);

    /* ---------- ป้าย 24H กะพริบ ---------- */
    const sign = { id:'f1_sign', kind:'sign', label:'ป้าย 24H', hint:'คลิก: เปิด/ปิดไฟป้าย',
      ...bb('sign_24h', SIGN.fx, SIGN.fy, SIGN.fz),
      draw(ctx, t){
        sim(t);
        let f = G.signOn ? 0 : 1;
        if (G.signOn){ const q = t % 4.2; if (q > 3.9 && q < 4.0 || q > 4.1) f = 1; }   // นีออนกะพริบ
        drawItem('sign_24h', SIGN.fx, SIGN.fy, f, false, SIGN.fz);
      },
      onClick(){ G.signOn = !G.signOn; C.bubble(this.id, G.signOn ? '24H เปิดไฟ' : 'ปิดป้าย', 1000); C.log('1F ป้าย 24H ' + (G.signOn ? 'ON' : 'OFF')); } };
    out.push(sign);

    /* ---------- ตัวช่วยวาดกล่อง (หน่วย → สัดส่วน) ---------- */
    const base = F.iso(0, 0, 0).y;                  // y บนจอของมุมหลังพื้น → ตั้ง order = base + x + y (หน่วย)
    const key = (x, y) => base + x + y;
    const B = (x, y, z, a, b, h, c1, c2, c3) => C.isoBox(X(x), Y(y), z, a, b, h, c1, c2, c3);
    const WOODT = ['#fffaf0', '#e6d9bd', '#f0e4c8'];                 // ท็อปหินขาว
    const BODY  = ['#f4ead4', '#d9c8a2', '#ecdcb9'];                 // ตัวบาร์ไม้อ่อน
    const glass = fn => { const g = C.ctx.globalAlpha; C.ctx.globalAlpha = g * 0.3; fn(); C.ctx.globalAlpha = g; };
    const bbox = (x, y, z, a, b, h) => F.boxBBox(X(x), Y(y), z, a, b, h);
    const mug = (x, y, z) => { B(x, y, z, 1.5, 1.5, 2.2, '#ffffff', '#e3e8ee', '#cfd6df'); B(x + 0.3, y + 0.3, z + 2.2, 0.9, 0.9, 0.3, '#7a4a2a', '#7a4a2a', '#7a4a2a'); };
    const plate = (x, y, z, c) => { B(x, y, z, 2.6, 2.6, 0.6, '#ffffff', '#e3e8ee', '#cfd6df'); B(x + 0.6, y + 0.6, z + 0.6, 1.4, 1.4, 0.9, c || '#c47a3c'); };
    // ลำดับวาดของสตูล/ลูกค้า: หลังช่วงบาร์ที่ติดกัน (ขายาว: key(14, ปลายช่วง) · ขาสั้น: key(30, 56))
    SEATS.forEach(s => { s.ord = (s.leg === 'long') ? key(14, s.segEnd) + 0.4 : (s.leg === 'short') ? key(30, 56) + 0.4 : undefined; });

    /* ---------- เมนูกระดานดำบนผนังยาว (ต่อจากชั้นวางของ) ---------- */
    const MB = {f0:0.53, f1:0.76, z0:34, z1:58};
    const mTL = F.iso(0, MB.f1, MB.z1), mBR = F.iso(0, MB.f0, MB.z0);
    const MENU = [['LATTE', '80'], ['MOCHA', '90'], ['DRIP', '70']];
    out.push({ id:'f1_menu', kind:'sign', label:'เมนูกาแฟ', hint:'คลิก: ดูเมนู',
      x:mTL.x - 1, y:mTL.y - 1, w:mBR.x - mTL.x + 2, h:mBR.y - mTL.y + 2, order:-5,
      draw(){
        C.quadX(0, MB.f0, MB.f1, MB.z0, MB.z1, '#2e2a24', '#d9c7a4');
        MENU.forEach((m, i) => { const p = C.iso(0, MB.f1 - 0.016, MB.z1 - 4 - i*7.2); C.text(m[0] + ' ' + m[1], p.x, p.y, i === 0 ? '#f3ead8' : '#cbbfa6', {shear:-1}); });
      },
      onClick(){ C.bubble(this.id, 'LATTE 80 · MOCHA 90 · DRIP 70', 2200); C.log('1F ดูเมนู'); } });

    /* ---------- เคาน์เตอร์หลัง (ชิดผนัง) + ชั้นผนัง + บาริสต้า ---------- */
    const ordBack = key(0, 0) + 20;
    function drawBack(t){
      B(0, 5, 0, 4.5, 46, BK_H, BODY[0], BODY[1], BODY[2]);
      for (let k = 6.5; k < 49; k += 4) C.quadX(X(4.5) + 0.002, Y(k), Y(k + 0.8), 2.5, BK_H - 2.5, '#d3bf93');
      C.quadX(X(4.5) + 0.002, Y(5), Y(51), 0, 1.6, '#8a7352');
      B(0, 5, BK_H, 4.5, 46, 2, WOODT[0], WOODT[1], WOODT[2]);
      // เครื่องชงใหญ่ + ถ้วยบนเครื่อง
      B(0.4, 6.5, BK_T, 3.8, 11, 9, '#cfd5de', '#a9b1be', '#bcc4d0');
      B(0.9, 7.5, BK_T + 9, 2.8, 9, 3, '#e8ecf2', '#b6bec9', '#cdd4de');
      [8, 11, 14].forEach(yy => mug(1.4, yy, BK_T + 12));
      C.quadX(X(4.2) + 0.002, Y(7.5), Y(16.5), BK_T + 2, BK_T + 6, '#2a2f3a');
      B(4.2, 9.5, BK_T + 0.5, 1.2, 1.2, 2.4, '#3a3f4a', '#3a3f4a', '#3a3f4a'); B(4.2, 13.5, BK_T + 0.5, 1.2, 1.2, 2.4, '#3a3f4a', '#3a3f4a', '#3a3f4a');
      B(4.2, 8, BK_T, 1.0, 9, 0.8, '#8a9099', '#8a9099', '#8a9099');
      const lp = C.iso(X(4.3), Y(11.7), BK_T + 6); C.rect(lp.x, lp.y, 1, 1, Math.floor(t*1.5) % 2 ? '#ff6a4a' : '#ffb04a');
      // ถ้วยกระดาษซ้อน 2 ชุด
      [18.8, 21.2].forEach((yy, k) => { for (let i = 0; i < (k ? 3 : 4); i++) B(1.2, yy, BK_T + i*2.2, 1.8, 1.8, 2.2, i % 2 ? '#e8edf2' : '#ffffff', '#cfd6df', '#bfc8d2'); });
      // เครื่องบดกาแฟ
      B(0.7, 23.6, BK_T, 2.8, 2.8, 5, '#4a4038', '#3a322c', '#2e2824');
      B(1.0, 23.9, BK_T + 5, 2.2, 2.2, 5, '#e0b878', '#c89c5c', '#b08848');
      B(1.0, 23.9, BK_T + 10, 2.2, 2.2, 1.2, '#2e2824', '#2e2824', '#2e2824');
      // pour-over
      B(1.0, 41, BK_T, 3, 6.5, 1, '#b98a58', '#9a6f40', '#7d5a32');
      B(1.6, 42, BK_T + 1, 1.8, 1.8, 4, '#fffaf0', '#e6dccb', '#d3c8b4');
      B(1.6, 45, BK_T + 1, 1.8, 1.8, 3, '#cfeff5', '#a6d8e2', '#8fc6d3');
      // ชั้นผนัง: ถุงเมล็ดกาแฟ 3 ถุง + โหลแก้ว 3 ใบ
      B(0, 5, 33, 3, 38, 1.2, '#d8b98a', '#b8955f', '#9a7a4a');
      [[7, '#d2a974', '#b88c55', '#c49a63'], [13.5, '#c9a06a', '#a88050', '#b88f58'], [20, '#d8b07a', '#bd9460', '#cba26c']].forEach(([yy, c1, c2, c3]) => {
        B(0.3, yy, 34.2, 2.2, 5, 13, c1, c2, c3);
        B(0.3, yy, 47.2, 2.2, 5, 1.2, '#e8cc9a', '#cfae78', '#dcc08a');
        C.quadX(X(2.5) + 0.002, Y(yy + 0.7), Y(yy + 4.3), 38, 44, '#f3e6c8');
        C.quadX(X(2.5) + 0.002, Y(yy + 1.4), Y(yy + 3.6), 41, 42, '#7a5630');
        C.quadX(X(2.5) + 0.002, Y(yy + 1.4), Y(yy + 3.6), 39.2, 40.2, '#7a5630');
      });
      [29, 33.5, 38].forEach((yy, i) => {
        B(0.5, yy, 34.2, 2.4, 3.2, 5.5, i === 1 ? '#c98a4a' : '#7a4a2a', i === 1 ? '#a8703a' : '#5e3820', i === 1 ? '#b87c42' : '#6b4126');
        glass(() => { C.quadX(X(2.9) + 0.003, Y(yy), Y(yy + 3.2), 34.2, 40.5, '#cfeff5', '#ffffff'); C.quadY(Y(yy + 3.2) + 0.003, X(0.5), X(2.9), 34.2, 40.5, '#cfeff5', '#ffffff'); });
        B(0.5, yy, 39.7, 2.4, 3.4, 1.5, '#e9e4d6', '#c9c2ae', '#d8d2c0');
      });
      // ไอน้ำ
      const m = C.iso(X(2.3), Y(12), BK_T + 16);
      steam(m.x, m.y, t, 0);
      if (t < G.steamUntil){ steam(m.x - 1, m.y - 6, t*1.6, 0.37); steam(m.x + 1, m.y - 12, t*1.3, 0.71); }
      const k = C.iso(X(2.5), Y(46), BK_T + 5); steam(k.x, k.y, t*0.8, 0.5);
    }
    out.push({ id:'f1_back', kind:'furniture', label:'เคาน์เตอร์หลัง (เครื่องชง+ชั้นเมล็ดกาแฟ)', hint:'คลิก: ดูเมนู', ...bbox(0, 5, 0, 5, 46, 50), order:ordBack,
      draw(ctx, t){
        sim(t);
        drawBack(t);
        const b = PEO().barista;
        if (b){ const fr = (Math.floor(t*0.75) % 4 === 3) ? 1 : 0; C.drawSprite(b, BARISTA.fx, BARISTA.fy, fr, false, 0); }
      },
      onClick(){ C.bubble(this.id, pick(['เมนูวันนี้: LATTE · MOCHA · DRIP', 'เมล็ดคั่วสดทุกเช้า ☕', 'เปิด 24 ชม. นะ!']), 1600); C.log('1F คลิกเคาน์เตอร์'); } });

    /* ---------- บาร์ตัว L: ขายาว 3 ช่วง + มุม/ขาสั้น (order ตั้งเอง) ---------- */
    function legSeg(y0, y1){
      B(8, y0, 0, 6, y1 - y0, BAR_H, BODY[0], BODY[1], BODY[2]);
      for (let k = y0 + 1.5; k < y1 - 1; k += 4) C.quadX(X(14) + 0.002, Y(k), Y(k + 0.8), 2.5, BAR_H - 2.5, '#d3bf93');
      C.quadX(X(14) + 0.002, Y(y0), Y(y1), 0, 1.6, '#8a7352');
      B(8, y0, BAR_H, 6, y1 - y0, 2, WOODT[0], WOODT[1], WOODT[2]);
    }
    function corner(){
      legSeg(42, 56);
      B(14, 50, 0, 16, 6, BAR_H, BODY[0], BODY[1], BODY[2]);
      for (let k = 15.5; k < 29; k += 4) C.quadY(Y(56) + 0.002, X(k), X(k + 0.8), 2.5, BAR_H - 2.5, '#d3bf93');
      C.quadY(Y(56) + 0.002, X(14), X(30), 0, 1.6, '#8a7352');
      B(14, 50, BAR_H, 16, 6, 2, WOODT[0], WOODT[1], WOODT[2]);
      plate(18.5, 51.2, BAR_T, '#c47a3c'); mug(26, 51.5, BAR_T); mug(22.5, 52, BAR_T);
    }
    const tops = [
      () => { mug(10.5, 9, BAR_T); mug(10.5, 14, BAR_T); },
      () => {      // ตู้โดมขนม
        B(9.2, 21, BAR_T, 3.6, 6, 1, '#fffaf0', '#e6d9bd', '#f0e4c8');
        [[22, '#d99a4e'], [24, '#e8a8b0'], [26, '#c47a3c']].forEach(([yy, c]) => B(9.8, yy, BAR_T + 1, 2.2, 1.6, 1.2, c, c, c));
        glass(() => {
          C.quadX(X(12.8) + 0.003, Y(21), Y(27), BAR_T + 1, BAR_T + 7, '#cfeff5', '#ffffff');
          C.quadY(Y(27) + 0.003, X(9.2), X(12.8), BAR_T + 1, BAR_T + 7, '#cfeff5', '#ffffff');
          C.quadZ(BAR_T + 7, X(9.2), X(12.8), Y(21), Y(27), '#ffffff');
        });
        mug(10.5, 17, BAR_T);
      },
      () => { plate(9.6, 33, BAR_T, '#e8a8b0'); mug(10.5, 38, BAR_T); }
    ];
    const barClick = function(){ C.bubble(this.id, pick(['นั่งบาร์เลยค่ะ', 'ขนมอบสดทุกเช้า 🥐', 'เปิด 24 ชม. นะ!']), 1500); C.log('1F คลิกบาร์'); };
    LEG_SEGS.forEach((sg, i) => {
      out.push({ id:'f1_counter' + i, kind:'furniture', label:'บาร์กาแฟ', hint:'คลิก: ทัก', ...bbox(8, sg[0], 0, 6, sg[1] - sg[0], BAR_T + 8), order:key(14, sg[1]),
        draw(){ legSeg(sg[0], sg[1]); tops[i](); }, onClick:barClick });
    });
    out.push({ id:'f1_counterL', kind:'furniture', label:'บาร์กาแฟ (มุม L)', hint:'คลิก: ทัก', ...bbox(14, 50, 0, 16, 6, BAR_T + 6), order:key(30, 56),
      draw(){ corner(); }, onClick:barClick });

    /* ---------- ของคลิกได้บนเคาน์เตอร์หลัง (ไม่วาดเอง — order สูงกว่าบาร์ที่บังอยู่หน้า) ---------- */
    const hot = (id, label, hint, box, ord, fn) => out.push({ id, kind:'furniture', label, hint, ...box, order:ord, draw(){}, onClick:fn });
    hot('f1_machine', 'เครื่องชงกาแฟใหญ่', 'คลิก: ไอน้ำ', bbox(0.4, 6.5, BK_T, 3.8, 11, 15), key(14, 42) + 0.3,
      function(){ G.steamUntil = C.t + 2.4; C.bubble(this.id, 'ปรู๊ดดด ☕ ไอน้ำ!', 1400); C.log('1F เครื่องชงกาแฟพ่นไอน้ำ'); });
    hot('f1_grinder', 'เครื่องบดกาแฟ', 'คลิก: บดเมล็ด', bbox(0.7, 23.6, BK_T, 2.8, 2.8, 12), key(14, 42) + 0.3,
      function(){ C.bubble(this.id, 'ครืดดด~ บดเมล็ดสด', 1400); C.log('1F เครื่องบดกาแฟ'); });
    hot('f1_beans', 'ถุงเมล็ดกาแฟ', 'คลิก: ดูเมล็ด', bbox(0.3, 7, 34, 2.2, 24, 15), key(14, 42) + 0.25,
      function(){ C.bubble(this.id, pick(['COFFEE BEANS ☕', 'คั่วกลาง หอมถั่ว']), 1400); C.log('1F ถุงเมล็ดกาแฟ'); });
    hot('f1_jars', 'โหลแก้ว', 'คลิก: ดูโหล', bbox(0.5, 29, 34, 2.4, 13, 8), key(14, 42) + 0.3,
      function(){ C.bubble(this.id, pick(['คุกกี้ 🍪', 'เมล็ดกาแฟ']), 1400); C.log('1F โหลแก้ว'); });
    hot('f1_pour', 'สถานี pour-over', 'คลิก: ดริปกาแฟ', bbox(1.0, 41, BK_T, 3, 6.5, 6), key(14, 42) + 0.3,
      function(){ C.bubble(this.id, 'ดริปมือ หอมมม~', 1400); C.log('1F pour-over'); });
    hot('f1_barista', 'บาริสต้า', 'คลิก: ทักทาย', (PEO().barista ? C.spriteBBox(PEO().barista, BARISTA.fx, BARISTA.fy, 0) : NOBOX), key(14, 42) + 0.1,
      function(){ C.bubble(this.id, pick(['いらっしゃいませ!', 'いらっしゃいませ!', 'ลาเต้ร้อนไหมคะ?', 'เปิด 24 ชม. นะ!']), 1700); C.log('1F บาริสต้าทัก'); });

    /* ---------- สตูลบาร์ 5 ตัว ---------- */
    SEATS.filter(s => s.kind === 'bar').forEach((s, i) => {
      const sx = s.seat[0] * C.UX, sy = s.seat[1] * C.UY;      // หน่วย — สตูลวาดด้วยโค้ด (ไม้อ่อน + เบาะครีม)
      s.obj = { id:'f1_stool' + i, kind:'furniture', label:'สตูลบาร์', ...bbox(sx - 1.5, sy - 1.5, 0, 3, 3, 14), order:s.ord,
        draw(){
          [[-1.5, -1.5], [0.9, -1.5], [-1.5, 0.9], [0.9, 0.9]].forEach(([dx, dy]) => B(sx + dx, sy + dy, 0, 0.6, 0.6, 11.5, '#a8885c', '#8a6a44', '#6e5233'));
          B(sx - 1.5, sy - 1.5, 5, 3, 3, 0.6, '#c9ad7c', '#a8885c', '#8a6a44');
          B(sx - 1.5, sy - 1.5, 11.5, 3, 3, 2.5, '#f4e6c4', '#cdb58a', '#e0cba0');
        } };
      out.push(s.obj);
    });

    /* ---------- โคมแขวนเหนือบาร์ (วาดทับสุด) ---------- */
    const lampP = F.iso(X(LAMP.x), Y(LAMP.y), LAMP.z);
    out.push({ id:'f1_lamp', kind:'decor', label:'โคมแขวน', hint:'คลิก: ดูโคม', x:lampP.x - 8, y:lampP.y - 12, w:16, h:18, order:key(40, 80) + 50,
      draw(ctx, t){
        const p = C.iso(X(LAMP.x), Y(LAMP.y), LAMP.z), sway = Math.round(Math.sin(t*0.7));
        C.rect(p.x, p.y - 72, 2, 62, '#5a4636');                                  // สายแขวน
        C.rect(p.x - 1 + sway, p.y - 11, 3, 3, '#3a2c22');
        C.rect(p.x - 3 + sway, p.y - 9, 7, 3, '#f6d688'); C.rect(p.x - 5 + sway, p.y - 6, 11, 3, '#f0c070'); C.rect(p.x - 7 + sway, p.y - 3, 15, 3, '#e0a850');
        C.rect(p.x - 8 + sway, p.y, 17, 1, '#3a2c22'); C.rect(p.x - 4 + sway, p.y - 8, 2, 2, '#fff2c8');
        C.emit(() => { const g = C.ctx.globalAlpha; C.ctx.globalAlpha = g * 0.5; C.rect(p.x - 6 + sway, p.y + 1, 13, 4, '#ffe8a8'); C.ctx.globalAlpha = g * 0.9; C.rect(p.x - 2 + sway, p.y + 1, 5, 1, '#fff6d8'); C.ctx.globalAlpha = g; });
      },
      onClick(){ C.bubble(this.id, 'โคมอุ่น ๆ 💡', 1200); C.log('1F โคมแขวน'); } });

    /* ---------- ต้นไม้ต้นเดียว ---------- */
    PLANTS.forEach((p, i) => out.push({ id:'f1_plant' + i, kind:'decor', label:'ต้นไม้', ...bb(p.n, p.fx, p.fy, 0),
      draw(){ drawItem(p.n, p.fx, p.fy, 0, false, 0); } }));

    /* ---------- โต๊ะ 2 ชุด ---------- */
    TABLES.forEach((tb, i) => {
      const o = { id:'f1_table' + i, kind:'furniture', label:'โต๊ะคาเฟ่', ...bb('cafe_table_set', tb.a, tb.b, 0),
        draw(){ drawItem('cafe_table_set', tb.a, tb.b, 0, false, 0); } };
      G.tableObjs[i] = o; out.push(o);
    });

    /* ---------- ลูกค้า 2 slot ---------- */
    G.cust.forEach((c, k) => {
      out.push({ id:'f1_cust' + k, kind:'character', label:'ลูกค้า', hint:'คลิก: คุยด้วย',
        ...NOBOX,
        draw(ctx, t){
          sim(t);
          if (!c.vis){ Object.assign(this, NOBOX); this.order = undefined; return; }
          const sitting = c.st === 'sit';
          const spr = sitting ? variant('customer_sit', c.v) : variant('customer_walk', c.v);
          if (!spr){ Object.assign(this, NOBOX); return; }
          let frame, fz = 0;
          if (sitting){
            fz = c.seat.fz;
            frame = ((t + c.sip) % 3.2) > 2.3 ? 1 : 0;        // จิบเป็นช่วง ๆ
            if (c.seat.kind === 'bar') this.order = c.seat.ord + 0.2; else { const tb = G.tableObjs[c.seat.ti]; this.order = tb ? tb.y + tb.h + 0.5 : undefined; }
          } else {
            frame = [0, 1, 2, 1][Math.floor(t*7) % 4];
            if (c.st === 'exit') frame = 1;
            this.order = undefined;
          }
          C.drawSprite(spr, c.fx, c.fy, frame, c.flip, fz);
          Object.assign(this, pad(C.spriteBBox(spr, c.fx, c.fy, fz), 1));
        },
        onClick(){
          if (c.st === 'sit') C.bubble(this.id, pick(CUST_LINES), 1800); else C.bubble(this.id, pick(['สวัสดีครับ', 'ขอที่นั่งหน่อย', 'หอมกาแฟจัง']), 1500);
          C.log('1F คุยกับลูกค้า');
        } });
    });

    /* ---------- แมว ---------- */
    const cat = G.cat;
    out.push({ id:'f1_cat', kind:'character', label:'แมว', hint:'คลิก: ลูบแมว (にゃー)',
      ...bb('cat', cat.fx, cat.fy, 0, PEO()),
      draw(ctx, t){
        sim(t);
        const P = PEO();
        let spr, frame, hop = 0;
        const since = t - cat.hopT;
        if (since >= 0 && since < 0.5) hop = Math.round(Math.sin(since/0.5*Math.PI) * 7);
        if (cat.st === 'walk'){ spr = P.cat_walk; frame = Math.floor(t*5) % 2; }
        else if (cat.st === 'sitIdle'){ spr = P.cat; frame = 2; }
        else { spr = P.cat; frame = Math.floor(t*0.8) % 2; }
        if (!spr) return;
        C.drawSprite(spr, cat.fx, cat.fy, frame, cat.flip, hop);
        Object.assign(this, pad(C.spriteBBox(spr, cat.fx, cat.fy, hop), 3));
        if (cat.st === 'lie' && frame === 1 && Math.floor(t) % 9 === 4){ /* zzz */
          C.text('Z', this.x + this.w - 3, this.y - 6 - Math.floor((t*3)%4), '#c9b9a0');
        }
      },
      onClick(){
        cat.hopT = C.t; C.bubble(this.id, pick(['にゃー', 'にゃー♪', 'ミャウ']), 1300); C.log('1F ลูบแมว');
        if (cat.st === 'lie') cat.until = Math.max(cat.until, C.t + 6);   // โดนปลุกแล้วไม่รีบเดิน
      } });

    return out;
  }
};
})();
