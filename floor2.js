/* =============================================================================
 * floor2.js — ชั้น 2 · ออฟฟิศเทรดสไตล์ชิล คนรุ่นใหม่ 4 คน   (เจ้าของ: Sonnet-A)   [รอบ 4: ห้อง 40x80]
 *
 * ผังห้อง (fx,fy):  ผนังสั้น = fx 0 (ซ้ายบนจอ) · ผนังยาว = fy 0 (ขวาบนจอ)
 *   ผนังสั้น : โต๊ะ A (desk_open_2) เทรดเดอร์ + นักวิเคราะห์ · โปสเตอร์วัวเหนือโต๊ะ
 *   ผนังยาว : โต๊ะ B (devops + เก้าอี้ว่าง) · มุมกาแฟ · บอร์ดราคา (วาดเอง อ่านตัวเลขได้ ไม่กลับด้าน)
 *   กลางห้อง : คน 2 คนยืนคุยหน้ามุมกาแฟ · พรม · บีนแบ็ก · ต้นไม้
 *   เวลาคืน : เหลือเทรดเดอร์ (OT) + devops · นักวิเคราะห์/คนคุยกลับบ้าน (เก้าอี้ว่างยังอยู่)
 * ========================================================================== */
(function(){
'use strict';
const C = window.Core;
const PEO = () => window.SPR_PEOPLE || {};
const ITM = () => window.SPR_ITEMS || {};
const pick = a => a[Math.floor(Math.random()*a.length)];
const NOBOX = {x:0, y:0, w:0, h:0};

/* ------------------------------ ตำแหน่ง ------------------------------
 * รอบ 4: ห้อง 40x80 หน่วย (fx สั้น / fy ยาว) · fx +0.1 = 4 หน่วย · fy +0.1 = 8 หน่วย
 *   (ผังรอบ 3 ถูก "สลับแกน" ตรง ๆ: fx<->fy, flip กลับด้าน)
 *   ผนังสั้น (ขวา, fy=0): โต๊ะ A (flip) เทรดเดอร์ + นักวิเคราะห์ · โปสเตอร์กระทิงเหนือโต๊ะ
 *   ผนังยาว (ซ้าย, fx=0): โต๊ะ B (ไม่ flip) devops + เก้าอี้ว่าง · มุมกาแฟ · บอร์ดราคา (วาดเอง อ่านตัวเลขได้ ไม่กลับด้าน)
 *   พื้นกลาง/หน้า: คน 2 คนยืนคุยหน้ามุมกาแฟ · พรม · บีนแบ็ก · ต้นไม้ 2
 */
const X = n => C.ux(n), Y = n => C.uy(n);
const DESK_A  = {fx:0.794, fy:0.203, alt:false, flip:true};         // ผนังสั้น (โต๊ะยาวตาม fx)
const DESK_B  = {fx:0.40,  fy:0.61,  alt:true,  flip:false};        // ผนังยาว (โต๊ะยาวตาม fy)
const COFFEE  = {fx:0.225, fy:0.925};
const BOARD   = {f0:0.62, f1:0.88, z0:40, z1:68};                  // บอร์ดราคา (procedural) บนผนังยาว (ซ้าย) ช่วง fy
const POSTER  = {fx:0.76,  fy:0.0,   fz:56};                       // ผนังสั้น (ขวา) flip
const SEAT = {
  trader:  {fx:0.65,  fy:0.265, flip:false},                       // โต๊ะ A สถานี 1
  analyst: {fx:0.30,  fy:0.58,  flip:true},                        // โต๊ะ B สถานี 1 (รอบ 4: คน 2x ต้องห่างกัน fy>=0.20 → ย้ายมาโต๊ะ B)
  devops:  {fx:0.30,  fy:0.36,  flip:true},                        // โต๊ะ B สถานี 0
  empty:   {fx:0.65,  fy:0.265, flip:false}                        // โต๊ะ A สถานี 0 (เก้าอี้ว่างถาวร)
};
const CHAT_A = {fx:0.80, fy:0.88, flip:true}, CHAT_B = {fx:0.40, fy:0.88, flip:true};   // ห่างกัน (คน 2x)
const RUG = {fx:0.58, fy:0.88};
const BEAN = {fx:0.92, fy:0.45};
const PLANTS = [ {n:'plant_big', fx:0.95, fy:0.62}, {n:'plant_small', fx:0.95, fy:0.12} ];

const BANTER = [
  ['A', 'BTC ทะลุแล้ว'], ['B', 'ตั้ง SL ยัง?'], ['A', 'ตั้งแล้ว เมื่อกี้'], ['B', 'ชาเขียวไหม'],
  ['A', 'เอา 2 แก้ว ☕'], ['B', 'ทองลงอีกแล้ว'], ['A', 'DCA ต่อ ไม่ต้องกลัว'], ['B', 'ETH ตามมามั้ย'],
  ['A', 'รอ FOMC คืนนี้'], ['B', 'พักสายตาก่อน 555'], ['A', 'กราฟสวยจัด'], ['B', 'วันนี้ปิดเขียวแน่']
];
const ANALYST = ['RSI เกิน 70 แล้ว', 'EMA 200 ยังยืนอยู่', 'แนวรับอยู่ตรงนี้', 'volume เริ่มมา'];
const DEVOPS  = ['server ปกติ ✓', 'บอทเทรด รันอยู่', 'deploy เสร็จแล้ว', 'restart ก่อนตลาดเปิด'];
const OT_LINES = ['OT อีกแล้ว...', 'OT ☕', 'ตลาดอเมริกาเปิดแล้ว', 'อีกนิดเดียว...', 'ขอกาแฟหน่อย'];

const G = {
  bull:true, cheerUntil:0, steamUntil:0,
  deskAlt:{A:DESK_A.alt, B:DESK_B.alt}, deskObj:{},
  slot:-1, speakUntil:0, speaker:'A',
  otNext:5, otWho:0
};
const phase = () => C.time.phase;
const isNight = () => phase() === 'night';

/* ------------------------------ รอบ 6: feed ข้อมูลเทรด (อนาคต = บอทจริง) ------------------------------
 * ชั้น 2 ดึง JSON ชุดเดียวกับ terminal.html (schema shophouse-terminal/1) ทุก 10 วิ:
 *   ?feed=URL → localStorage['terminal_feed'] → ./terminal_demo.json
 * ใช้ทำ: บอร์ดราคาโชว์ equity/กำไรวันนี้ · จอผนัง TERMINAL วาด equity curve · เทรดเดอร์ดีใจ/เศร้าตามกำไรวันนี้
 * ดึงไม่ได้ (เช่นเปิดจาก file://) → ใช้ค่าสุ่มเดิม ไม่พัง */
const FEED = { url: null, data:null, ok:false, t:0 };
try { FEED.url = new URLSearchParams(location.search).get('feed') || localStorage.getItem('terminal_feed') || 'terminal_demo.json'; } catch(e){ FEED.url = 'terminal_demo.json'; }
async function fetchFeed(){
  try {
    const r = await fetch(FEED.url + (FEED.url.includes('?') ? '&' : '?') + '_=' + Date.now(), {cache:'no-store'});
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json(); if (!j || !j.account) throw new Error('schema');
    const first = !FEED.data; FEED.data = j; FEED.ok = true; FEED.t = Date.now();
    if (typeof j.account.today_pnl === 'number') G.bull = j.account.today_pnl >= 0;
    if (first) C.log('2F ต่อ feed แล้ว: ' + (j.bot && j.bot.name || FEED.url) + (j.demo ? ' (demo)' : ''));
  } catch(e){ FEED.ok = false; }
}
fetchFeed(); setInterval(fetchFeed, 10000);
const openTerminal = () => { if (window.openTerminal){ window.openTerminal(); return true; } return false; };

function drawItem(name, fx, fy, frame, flip, fz){
  const s = ITM()[name]; if (!s) return;
  C.drawSprite(s, fx, fy, frame||0, !!flip, fz||0);
}
function bboxOf(name, fx, fy, fz, src){
  const s = (src || ITM())[name]; return s ? C.spriteBBox(s, fx, fy, fz||0) : {x:0, y:0, w:0, h:0};
}
function steam(cx, cy, t, seed){
  for (let i = 0; i < 4; i++){
    const ph = ((t*1.0 + i*0.25 + seed) % 1), y = cy - ph*14, x = cx + Math.round(Math.sin(ph*6 + i*2)*2), a = 1 - ph;
    C.emit(() => { const ctx = C.ctx, g = ctx.globalAlpha; ctx.globalAlpha = g * a * 0.9; C.rect(x, y, 2, 2, '#eae0d0'); ctx.globalAlpha = g; });
  }
}
function ticker(){
  const f = (v, d) => v.toLocaleString('en-US', {minimumFractionDigits:d, maximumFractionDigits:d});
  const ch = () => { const c = (Math.random()*3.4 - 1.5); return (c >= 0 ? '+' : '') + c.toFixed(1) + '%'; };
  const rows = [['BTC', 67000 + Math.random()*3000, 0], ['ETH', 3400 + Math.random()*200, 0], ['GOLD', 2650 + Math.random()*60, 1], ['USDJPY', 149 + Math.random()*2, 2], ['SET', 1380 + Math.random()*30, 1]];
  const r = rows.sort(() => Math.random() - 0.5).slice(0, 3);
  return r.map(x => x[0] + ' ' + f(x[1], x[2]) + ' ' + ch()).join('  |  ');
}

/* ------------------------------ ตัวละครนั่งโต๊ะ ------------------------------ */
function seatedWorker(id, label, spriteName, seat, deskKey, opts){
  const o = { id, kind:'character', label, hint:opts.hint, ...NOBOX,
    draw(ctx, t){
      const P = PEO(), spr = P[spriteName]; if (!spr){ Object.assign(this, NOBOX); return; }
      const d = G.deskObj[deskKey];
      if (d) this.order = d.y + d.h + 0.5;
      const absent = opts.leavesAtNight && isNight();
      if (absent){
        // เก้าอี้ว่างยังอยู่
        const ch = ITM().chair_office; if (ch) C.drawSprite(ch, seat.fx, seat.fy, 0, seat.flip, 0);
        Object.assign(this, NOBOX); return;
      }
      const frame = opts.frame.call(this, t);
      C.drawSprite(spr, seat.fx, seat.fy, frame, seat.flip, 0);
      Object.assign(this, C.spriteBBox(spr, seat.fx, seat.fy, 0));
    },
    onClick(){ opts.click.call(this); }
  };
  return o;
}

/* ============================================================================ */
window.FLOORS = window.FLOORS || {};
window.FLOORS[2] = {
  name:'ออฟฟิศเทรด', nameJP:'トレード部屋',
  desc:'ออฟฟิศเทรด · คลิกบอร์ดราคาหรือจอ TERMINAL → เปิด pop-up Trading Terminal (ตอนนี้ demo · อนาคตต่อบอทจริง) · คน 4 คน มุมกาแฟ · คืน: เหลือคน OT',
  shell:{ wallL:'#262a3c', wallR:'#30354a', floor:'wood', floorC:'#7d6250', floorC2:'#6a5242', trim:'#1b1d2a' },

  ambient(ctx, t){
    const rg = ITM().rug_small; if (rg) C.drawSprite(rg, RUG.fx, RUG.fy, 0, false, 0);   // พรมโซนกาแฟ
    const a = C.lit(2) ? 0.2 : 0.08;
    C.pool(0.52, 0.84, 26, 12, C.PAL.warm, a);                     // มุมกาแฟอุ่น ๆ
    const n = isNight() ? 0.2 : 0.1;                               // แสงจอบนพื้นหน้าโต๊ะ
    C.pool(0.52, 0.30, 22, 10, C.PAL.screen, n);
    C.pool(0.27, 0.46, 24, 11, C.PAL.screen, n);
  },

  build(F){
    const out = [];
    const bb = (n, fx, fy, fz, src) => bboxOf(n, fx, fy, fz, src);
    const deskName = d => (G.deskAlt[d] ? 'desk_open_2_alt' : 'desk_open_2');

    /* ---------- โต๊ะ ---------- */
    [['A', DESK_A], ['B', DESK_B]].forEach(([k, d], i) => {
      const o = { id:'f2_desk' + k, kind:'furniture', label:'โต๊ะทำงานเปิด ' + k, hint:'คลิก: สลับสีกราฟ',
        ...bb('desk_open_2', d.fx, d.fy, 0),
        draw(ctx, t){
          drawItem(deskName(k), d.fx, d.fy, C.anim(3, 0.9, i*1.3), d.flip, 0);
        },
        onClick(){
          G.deskAlt[k] = !G.deskAlt[k];
          C.bubble(this.id, G.deskAlt[k] ? 'กราฟ: ทอง/ฟ้า' : 'กราฟ: เขียว/แดง', 1100);
          C.log('2F สลับสีกราฟโต๊ะ ' + k);
        } };
      G.deskObj[k] = o; out.push(o);
    });

    /* ---------- ของติดผนัง ---------- */
    /* บอร์ดราคา: วาดเองบนผนังยาว (sprite price_board กว้าง 90px เกินส่วนผนังที่มองเห็น) · ตัวอักษร shear ตามผนัง อ่านออก */
    const bd = BOARD, bTL = F.iso(0, bd.f1, bd.z1), bBR = F.iso(0, bd.f0, bd.z0);
    const NAMES = ['BTC', 'ETH', 'GLD'];
    out.push({ id:'f2_board', kind:'sign', label:'บอร์ดราคา', hint:'คลิก: ดูราคาล่าสุด',
      x:bTL.x - 1, y:bTL.y - 1, w:bBR.x - bTL.x + 2, h:bBR.y - bTL.y + 2, order:-5,
      draw(ctx, t){
        C.quadX(0, bd.f0, bd.f1, bd.z0, bd.z1, '#171b2b', '#8c9bd6');
        C.quadX(0, bd.f0 + 0.012, bd.f1 - 0.012, bd.z0 + 2, bd.z1 - 2, '#0c0f1c', '#0c0f1c');
        const up = '#5fe39a', dn = '#ff6f6f';
        C.emit(() => {
          NAMES.forEach((nm, i) => {
            const zt = bd.z1 - 5 - i*7.5, p = C.iso(0, bd.f1 - 0.016, zt);
            C.text(nm, p.x, p.y, '#9fb0e8', {shear:-1});
            // แท่งราคาแกว่งตามเวลา (เขียว = ขึ้น · แดง = ลง) วาดด้วย quadY ให้เอียงตามผนังพอดี
            const ph = t*0.7 + i*2.1, v = 0.5 + 0.5*Math.sin(ph), dir = Math.cos(ph) >= 0;
            const x0 = bd.f1 - 0.11, len = 0.02 + 0.10*v;
            C.quadX(0, x0 - len, x0, zt - 4, zt - 1, dir ? up : dn, dir ? up : dn);
          });
          const q = C.iso(0, bd.f0 + 0.02, bd.z1 - 4);                        // ไฟ LIVE กะพริบ
          if (Math.floor(t*1.6) % 2) C.rect(q.x, q.y, 2, 2, '#ff5a5a');
          // รอบ 6: แถวล่าง = equity จาก feed (ถ้ามี) สีตามกำไรวันนี้
          const a = FEED.data && FEED.data.account;
          if (a){ const p = C.iso(0, bd.f1 - 0.016, bd.z0 + 4), pnl = a.today_pnl || 0;
            C.text('EQ ' + Math.round(a.equity).toLocaleString('en-US'), p.x, p.y, pnl >= 0 ? up : dn, {shear:-1}); }
        });
      },
      onClick(){
        // คลิก = เปิด pop-up Trading Terminal (อนาคต = หน้าบอทจริง) · ถ้าเปิดเดี่ยวโดยไม่มี index.html ก็โชว์ ticker เหมือนเดิม
        if (openTerminal()){ C.bubble(this.id, 'เปิด Trading Terminal ▶', 1200); C.log('2F คลิกบอร์ดราคา → Terminal'); }
        else { C.bubble(this.id, ticker(), 3200); C.log('2F ดูบอร์ดราคา'); }
      } });

    /* ---------- รอบ 6: จอผนัง TERMINAL (ผนังสั้น ขวา) = ประตูเข้า pop-up + วาด equity curve จาก feed ---------- */
    const TV = { x0:0.22, x1:0.52, z0:44, z1:66 };
    { const pA = F.iso(TV.x0, 0, TV.z0), pB = F.iso(TV.x1, 0, TV.z1);
      out.push({ id:'f2_terminal', kind:'sign', label:'จอ TRADING TERMINAL', hint:'คลิก: เปิดหน้า Terminal (pop-up)', order:-5,
        x:Math.min(pA.x, pB.x) - 1, y:Math.min(pA.y, pB.y) - 1, w:Math.abs(pB.x - pA.x) + 3, h:Math.abs(pA.y - pB.y) + 3,
        draw(ctx, t){
          C.quadY(0, TV.x0, TV.x1, TV.z0, TV.z1, '#171b2b', '#8c9bd6');
          C.quadY(0, TV.x0 + 0.012, TV.x1 - 0.012, TV.z0 + 2, TV.z1 - 2, '#0a0d1a', '#0a0d1a');
          C.emit(() => {
            const eq = (FEED.data && FEED.data.equity_curve) || null, n = 16;
            const vs = eq && eq.length > 1 ? eq.slice(-n).map(e => +e.v) : Array.from({length:n}, (_, i) => 100 + 10*Math.sin(i*.6 + t*.4));
            const lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo) || 1, upc = vs[vs.length-1] >= vs[0];
            const X0 = TV.x0 + 0.03, X1 = TV.x1 - 0.03, Z0 = TV.z0 + 8.5, Z1 = TV.z1 - 7;        // กราฟแท่งอยู่กลางจอ · บรรทัดบน TERMINAL · บรรทัดล่าง กำไรวันนี้
            for (let i = 0; i < vs.length; i++){ const fx = X0 + (X1 - X0)*i/(vs.length - 1), z = Z0 + (vs[i] - lo)/pad*(Z1 - Z0);
              C.quadY(0.0005, fx, fx + (X1 - X0)/vs.length*0.6, Z0 - 1, z, upc ? '#163a2a' : '#3a1620'); C.quadY(0.0005, fx, fx + (X1 - X0)/vs.length*0.6, z, z + 1, upc ? '#5fe39a' : '#ff6f6f'); }
            const p = C.iso(TV.x0 + 0.02, 0, TV.z1 - 3.5); C.text('TERMINAL', p.x, p.y, '#4fc1c6', {shear:1});
            const a = FEED.data && FEED.data.account; if (a){ const q = C.iso(TV.x0 + 0.02, 0, TV.z0 + 2.5); C.text('TODAY ' + (a.today_pnl >= 0 ? '+' : '') + Math.round(a.today_pnl), q.x, q.y, a.today_pnl >= 0 ? '#5fe39a' : '#ff6f6f', {shear:1}); }
            if (Math.floor(t*2) % 2) C.rect(pB.x - 4, pB.y + 3, 2, 2, FEED.ok ? '#5fe39a' : '#ff5a5a');   // LED: เขียว = feed มา · แดง = ดึงไม่ได้
          });
        },
        onClick(){ if (openTerminal()){ C.bubble(this.id, 'เปิด Terminal ▶', 1200); C.log('2F คลิกจอผนัง → Terminal'); } else C.bubble(this.id, 'เปิดจาก index.html ถึงจะมี pop-up', 1600); } });
    }
    out.push({ id:'f2_poster', kind:'decor', label:'โปสเตอร์กระทิง',
      ...bb('poster_bull', POSTER.fx, POSTER.fy, POSTER.fz),
      draw(){ drawItem('poster_bull', POSTER.fx, POSTER.fy, 0, true, POSTER.fz); } });

    /* ---------- มุมกาแฟ ---------- */
    const cf = bb('coffee_corner', COFFEE.fx, COFFEE.fy, 0);
    out.push({ id:'f2_coffee', kind:'furniture', label:'มุมกาแฟ', hint:'คลิก: ต้มกาแฟ (ไอน้ำ)', ...cf,
      draw(ctx, t){
        drawItem('coffee_corner', COFFEE.fx, COFFEE.fy, 0, false, 0);
        const p = C.iso(COFFEE.fx, COFFEE.fy, 0);
        // กาต้มน้ำอยู่ราว (+? ,-?) จากจุด anchor (flip แล้วกลับด้าน x)
        const kx = p.x + 3, ky = p.y - 26;
        steam(kx, ky, t, 0.1);
        if (t < G.steamUntil){ steam(kx + 1, ky - 6, t*1.5, 0.4); steam(kx - 1, ky - 12, t*1.2, 0.7); }
      },
      onClick(){ G.steamUntil = C.t + 2.4; C.bubble(this.id, 'ปรู๊ด~ กาแฟร้อน ☕', 1400); C.log('2F มุมกาแฟพ่นไอน้ำ'); } });

    /* ---------- บีนแบ็กมุมพักสายตา ---------- */
    out.push({ id:'f2_beanbag', kind:'furniture', label:'บีนแบ็ก', hint:'คลิก: ลองนั่ง', ...bb('beanbag', BEAN.fx, BEAN.fy, 0),
      draw(){ drawItem('beanbag', BEAN.fx, BEAN.fy, 0, false, 0); },
      onClick(){ C.bubble(this.id, pick(['นุ่มมม~', 'ขอพักสายตา 5 นาที', 'zzz...']), 1400); C.log('2F ลองนั่งบีนแบ็ก'); } });

    /* ---------- ต้นไม้ ---------- */
    PLANTS.forEach((p, i) => out.push({ id:'f2_plant' + i, kind:'decor', label:'ต้นไม้', ...bb(p.n, p.fx, p.fy, 0),
      draw(){ drawItem(p.n, p.fx, p.fy, 0, false, 0); } }));

    /* ---------- คนนั่งโต๊ะ ---------- */
    out.push(seatedWorker('f2_trader', 'เทรดเดอร์', 'worker_trader', SEAT.trader, 'A', {
      hint:'คลิก: ทัก (สลับ เขียว/แดง)', leavesAtNight:false,
      frame(t){
        if (t < G.cheerUntil) return 2;
        if (G.bull && Math.floor(t/7) % 3 === 2 && (t % 7) < 0.9) return 2;     // ตอนพอร์ตเขียว ชูแขนเป็นช่วง ๆ
        return C.anim(2, 3);
      },
      click(){
        G.bull = !G.bull;
        G.cheerUntil = G.bull ? C.t + 1.8 : 0;
        C.bubble(this.id, G.bull ? 'เขียวทั้งพอร์ต 🚀' : 'ติดลบ T_T', 2000);
        C.log('2F เทรดเดอร์: ' + (G.bull ? 'พอร์ตเขียว' : 'พอร์ตแดง'));
      } }));
    out.push(seatedWorker('f2_analyst', 'นักวิเคราะห์', 'worker_analyst', SEAT.analyst, 'B', {
      hint:'คลิก: ถามความเห็น', leavesAtNight:true,
      frame(t){ return C.anim(2, 1.6); },
      click(){ C.bubble(this.id, pick(ANALYST), 1800); C.log('2F นักวิเคราะห์ให้ความเห็น'); } }));
    out.push(seatedWorker('f2_devops', 'ดูแลระบบ (devops)', 'worker_devops', SEAT.devops, 'B', {
      hint:'คลิก: ถามสถานะระบบ', leavesAtNight:false,
      frame(t){ return C.anim(2, 4, 1); },
      click(){ C.bubble(this.id, pick(DEVOPS), 1800); C.log('2F devops รายงานสถานะ'); } }));

    /* ---------- คนยืนคุย + จังหวะบทสนทนา ---------- */
    const chatter = (id, label, sprName, pos, who) => ({ id, kind:'character', label, hint:'คลิก: ชวนคุย', ...NOBOX,
      draw(ctx, t){
        const spr = PEO()[sprName];
        if (!spr || isNight()){ Object.assign(this, NOBOX); return; }
        // บทสนทนาสลับกันทุก ~3.4 วิ (ทำครั้งเดียวต่อ slot — ให้ตัว A เป็นคนตรวจ)
        if (who === 'A'){
          const slot = Math.floor(t / 3.4);
          if (slot !== G.slot){
            G.slot = slot;
            const line = BANTER[slot % BANTER.length];
            G.speaker = line[0]; G.speakUntil = t + 2.7;
            C.bubble(line[0] === 'A' ? 'f2_chatA' : 'f2_chatB', line[1], 2700);
          }
        }
        const talking = G.speaker === who && t < G.speakUntil;
        const frame = talking ? C.anim(2, 4) : 0;
        C.drawSprite(spr, pos.fx, pos.fy, frame, pos.flip, 0);
        Object.assign(this, C.spriteBBox(spr, pos.fx, pos.fy, 0));
      },
      onClick(){ C.bubble(this.id, pick(BANTER)[1], 1800); C.log('2F ชวนคุยที่มุมกาแฟ'); } });
    out.push(chatter('f2_chatA', 'พนักงาน (ยืนคุย)', 'worker_chat',   CHAT_A, 'A'));
    out.push(chatter('f2_chatB', 'พนักงาน (ยืนคุย)', 'worker_chat_b', CHAT_B, 'B'));

    /* ---------- OT บับเบิลตอนกลางคืน (ตัวควบคุมไม่มีภาพ) ---------- */
    out.push({ id:'f2_ot', kind:'decor', label:'', ...NOBOX,
      draw(ctx, t){
        if (!isNight()){ G.otNext = t + 4; return; }
        if (t >= G.otNext){
          G.otNext = t + 6 + Math.random()*5; G.otWho ^= 1;
          C.bubble(G.otWho ? 'f2_trader' : 'f2_devops', pick(OT_LINES), 2200);
        }
      } });

    return out;
  }
};
})();
