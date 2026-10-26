/* =============================================================================
 * floor4.js — ชั้น 4 ห้องนอนเล็ก ๆ เรียบ ๆ (寝室)       เจ้าของไฟล์: Sonnet-B (รอบ 4: ห้อง 40x80 — สลับแกน fx สั้น / fy ยาว)
 * ของน้อยชิ้นตามสั่ง: เตียง+คนนอน, โคมข้างเตียง, ตู้เสื้อผ้า, หน้าต่าง, พรมเล็ก, ต้นไม้เล็ก 1 ต้น, ภาพวาดฟูจิบนผนัง
 *
 * LOGIC (ให้ตรวจ):
 *   - รอบ 4: เตียง flip ยาวตามแกน fx หัวเตียงชิดผนังยาว(ซ้าย fx=0) → sleeper (หัวซ้ายบน ตัวลงขวา) ใช้แบบไม่ flip
 *   - โซนบัง: ของสูงต้อง fx>~0.55 หรือ fy>~0.6 → เตียง/โคม/หน้าต่างอยู่ขวา fx 0.55-0.9, ตู้เสื้อผ้าอยู่ซ้ายหน้า fy 0.67-0.8
 *   - sleeper ต้องวาดหลังเตียง → กำหนด order = ลำดับเตียง + 0.2
 *   - โคม = สวิตช์ไฟห้อง Core.lights[4] : โคมติด → ห้องปกติ + pool อุ่น / โคมดับ → ห้องหรี่ (ตอนเย็น/คืน)
 *   - ตอนเช้า sleeper ลุกนั่ง (customer_sit ตัดเหลือครึ่งตัว + ก้อนผ้าห่ม) ทุก 20 วิ นาน 4.5 วิ
 *   - เฟสหน้าต่าง: เช้า/เย็น/คืน → frame 0/1/2 + แสงตกพื้นสีตามเฟส
 * ========================================================================== */
(function(){
'use strict';
const Core = window.Core;
if (!Core) { console.error('[floor4] Core ไม่มา'); return; }
const UX = Core.UX, UY = Core.UY;
const Rx = n => n / UX, Ry = n => n / UY;      // หน่วย iso -> สัดส่วนพื้น ตามแกน fx / fy (รอบ 4: UX=40 สั้น · UY=80 ยาว)
const At = (X, Y) => ({ fx: X / UX, fy: Y / UY });  // เขียนตำแหน่งเป็นหน่วย (รอบ 4: X 0..40 ตามผนังสั้น(ขวา), Y 0..80 ตามผนังยาว(ซ้าย))

/* ---------- helpers ภายในไฟล์ (ตรงกับ floor3 แต่แยกไฟล์ ไม่พึ่งกัน) ---------- */
const spr = n => (window.SPR_ITEMS && window.SPR_ITEMS[n]) || (window.SPR_PEOPLE && window.SPR_PEOPLE[n]) || null;
const _tight = new Map();
function tight(s){
  if (!s) return {x0:0,y0:0,x1:7,y1:11};
  let r = _tight.get(s); if (r) return r;
  r = {x0:1e9,y0:1e9,x1:-1,y1:-1};
  (s.frames || []).forEach(rows => rows.forEach((row,j) => { for (let i = 0; i < row.length; i++){
    const ch = row[i]; if (ch === '.' || ch === ' ') continue;
    if (i < r.x0) r.x0 = i; if (i > r.x1) r.x1 = i; if (j < r.y0) r.y0 = j; if (j > r.y1) r.y1 = j; } }));
  if (r.x1 < 0) r = {x0:0,y0:0,x1:(s.w||8)-1,y1:(s.h||12)-1};
  _tight.set(s, r); return r;
}
function tbox(iso, s, fx, fy, fz, flip){
  const w = s ? (s.w || 8) : 8, h = s ? (s.h || 12) : 12, b = tight(s), p = iso(fx, fy, fz || 0);
  const dx = Math.round(p.x - Math.floor(w/2)), dy = Math.round(p.y - h);
  return { x: dx + (flip ? (w-1-b.x1) : b.x0), y: dy + b.y0, w: b.x1-b.x0+1, h: b.y1-b.y0+1 };
}
const say = (id, txt, ms) => Core.bubble(id, txt, ms || 1800);
const phase = () => Core.time.phase;
const PH = { morning:0, evening:1, night:2 };

function item(F, o){
  const s = spr(o.sp), fz = o.fz || 0, flip = !!o.flip;
  const obj = Object.assign({ id:o.id, kind:o.kind || 'furniture', label:o.label, hint:o.hint, order:o.order, state:o.state ? Object.assign({}, o.state) : undefined }, tbox(F.iso, s, o.fx, o.fy, fz, flip));
  obj.draw = function(ctx, t, st){
    if (o.pre) o.pre.call(this, ctx, t, st);
    this._fr = o.frame ? o.frame.call(this, t, st) : 0;
    Core.drawSprite(s, o.fx, o.fy, this._fr, flip, fz);
    if (o.post) o.post.call(this, ctx, t, st);
  };
  if (o.click) obj.onClick = function(){ o.click.call(this, this.state); };
  return obj;
}

/* ---------- ตำแหน่ง (พิกัดพื้น) — รอบ 3: ห้อง 80x40 หน่วย ----------
 * footprint (a=ลึกตามแกน X, b=กว้างตามแกน Y เมื่อไม่ flip; flip = สลับกัน) · จุดอ้างอิง = มุมหน้าของฐาน → กล่อง X [Xf-a, Xf], Y [Yf-b, Yf]
 *   เตียง flip 18.5x9.5 · โต๊ะโคม 5x5 · ตู้เสื้อผ้า flip 12x6.5 · หน้าต่าง (ไม่ flip ผนังสั้น) 2x14 · พรม 10.5x14.5 · ต้นไม้เล็ก 4x4
 * แผนผัง: ผนังยาว (Y=0) ซ้าย→ขวา: โต๊ะโคม X27-32 · เตียง X33-51.5 (หัวเตียงซ้าย) · ตู้เสื้อผ้า X57.5-69.5 (+ภาพฟูจิเหนือตู้) · ต้นไม้ X73-77
 *                ผนังสั้น (X=0): หน้าต่าง Y16-30 · พรมหน้าเตียง · กลุ่มเตียงอยู่กลางผนังยาว ซ้าย-ขวามีหน้าต่าง/ตู้ถ่วง */
// รอบ 4 = รอบ 3 สลับแกน (X,Y)→(Y,X) + สลับ flip · เลขในคอมเมนต์ footprint ด้านบนเป็นแบบเก่า (X เก่า = fy ใหม่)
const BEDF  = true;                                           // เตียง flip = ยาวตามแกน X(fx) หัวเตียงชิดผนังยาว(ซ้าย fx=0) ยื่นเข้าห้อง
const BED   = At(18.7, 45);                                   // มุมหน้าของฐาน กินพื้น X 0.2-18.7 · Y 35.5-45
const NIGHT = At(5.2, 50.6);                                  // โต๊ะข้างเตียง ข้างหัวเตียง ชิดผนังยาว(ซ้าย) ไม่ flip
const WIN   = Object.assign({ fz: 28 }, At(30, 2.2));         // หน้าต่างบนผนังสั้น(ขวา fy=0, flip) — ผนังสั้นเห็นเต็มเมื่อ fx>.19 ที่ z 65
const WARD  = At(6.66, 69.5);                                 // ตู้เสื้อผ้าไม่ flip ชิดผนังยาว(ซ้าย) หันเข้าห้อง
const RUG   = At(30, 17);                                     // พรมใต้แสงหน้าต่าง (flip)
const PLANT = At(31, 4.4);
// หมอน: ศูนย์กลางตามหน่วยฐานเตียง → พิกัดพื้น (ไม่ flip: หัวเตียงอยู่ปลาย -Y, ลึกตาม X)
const PILLOW = BEDF ? { fx: BED.fx - Rx(15.4), fy: BED.fy - Ry(4.5), fz: 7.2 } : { fx: BED.fx - Rx(4.5), fy: BED.fy - Ry(15.4), fz: 7.2 };

/* ภาพวาดฟูจิบนผนังซ้าย: แต่ละคอลัมน์ = สีของแถวจากบนลงล่าง */
const FUJI = [
  '..........', '..........', '....WW....', '...WWWW...', '...MWWM...', '..MMMMMM..', '.MMMMMMMM.', 'MMMMMMMMMM'
];

window.FLOORS[4] = {
  name:'ห้องนอน', nameJP:'寝室',
  desc:'ห้องนอนรก ๆ ของเทรดเดอร์ · โต๊ะคอม+แล็ปท็อป ชั้นฟิกเกอร์ โปสเตอร์ ไฟราว กีตาร์ กองเสื้อผ้า หนังสือ ขนม พิซซ่า ถังขยะล้น แมว · คลิกได้เกือบทุกชิ้น',
  shell:{ wallL:'#3d3f66', wallR:'#4a4d78', floor:'wood', floorC:'#a8744c', floorC2:'#966440', trim:'#2a2b48' },

  ambient(ctx, t){
    // พรมผืนใหญ่ (แบนกับพื้น) กลางห้อง ใต้เตียง-ปลายเตียง — X 5-32 · Y 28-54 (หน่วย) ไม่ให้พื้นโล่ง แต่ยังเรียบ
    Core.quadZ(0.2, Rx(5), Rx(32), Ry(28), Ry(54), '#2f5a5c', Core.PAL.ol);
    Core.quadZ(0.2, Rx(6.5), Rx(30.5), Ry(29.5), Ry(52.5), '#4a8584');
    Core.quadZ(0.2, Rx(8.5), Rx(28.5), Ry(31.5), Ry(50.5), '#3d706f');
    // ภาพวาดฟูจิ ผนังยาว(ซ้าย fx=0) เหนือตู้เสื้อผ้า (Y 59.5-68.5, z 54-72 → เห็นเต็มเพราะ fy>.53) · คอลัมน์ i ไล่จากขวาจอ(fy น้อย)... ซ้ายจอ = fy มาก
    const y0 = Ry(59.5), y1 = Ry(68.5), z0 = 54, z1 = 72;
    Core.quadX(0, y0, y1, z0, z1, '#d9ccae', Core.PAL.ol);
    Core.quadX(0, y0+Ry(0.7), y1-Ry(0.7), z0+2, z1-2, '#7fb4dc');
    const cw = (y1-y0-Ry(2.8))/10, ch = (z1-z0-4)/8, yb = y1-Ry(1.4);      // ซ้ายจอ = fy มาก → คอลัมน์ 0 ที่ yb
    const col = (i) => [yb-(i+1)*cw, yb-i*cw];
    FUJI.forEach((row, j) => { for (let i = 0; i < 10; i++){ const c = row[i]; if (c === '.') continue;
      const [ya, yz] = col(i);
      Core.quadX(0, ya, yz, z1-2-(j+1)*ch, z1-2-j*ch, c === 'W' ? '#f6f8fc' : '#4b5d92'); } });
    { const [ya, yz] = col(1); Core.quadX(0, ya, yz, z1-2-3*ch, z1-2-2*ch, '#e8584c'); }   // ดวงอาทิตย์
  },

  build(F){
    const out = [];

    /* ---------- แสง: พื้นอุ่นจากโคม + แสงหน้าต่างตามเฟส (ล่างสุด) ---------- */
    out.push({ id:'f4_glow', kind:'light', label:'แสง', x:0, y:0, w:0, h:0, order:-100,
      draw(ctx, t){
        const ph = phase(), dk = Core.isDark(4);
        const wc = ph === 'morning' ? ['#fff3b0', .20] : ph === 'evening' ? ['#ff9a5a', .17] : ['#9fb8ff', dk ? .24 : .13];
        Core.pool(0.56, 0.17, 30, 15, wc[0], wc[1]);                              // แสงตกจากหน้าต่าง (ผนังสั้น)
        if (Core.lit(4)) Core.pool(NIGHT.fx + Rx(5), NIGHT.fy - Ry(1), 30, 15, '#ffd37a', dk ? .34 : .26);   // แสงโคม
      } });

    /* ---------- เตียง / พรม / โต๊ะโคม / ตู้ / หน้าต่าง / ต้นไม้ ---------- */
    out.push(item(F, { id:'f4_rug', sp:'rug_small', fx:RUG.fx, fy:RUG.fy, flip:true, kind:'decor', label:'พรมเล็ก', order:-120 }));
    const bed = item(F, { id:'f4_bed', sp:'bed_single', fx:BED.fx, fy:BED.fy, flip:BEDF, label:'เตียงเดี่ยว', hint:'คลิก: ลองจับผ้าห่ม',
      click(){ say('f4_sleeper', 'อย่าดึงผ้าห่ม…', 1500); } });
    out.push(bed);
    const bedOrder = bed.y + bed.h;
    if (BEDF){ bed.x += 14; bed.w -= 14; bed.y += 12; bed.h -= 12; } else { bed.w -= 14; bed.y += 12; bed.h -= 12; }                        // จุดคลิกเตียง = ส่วนผ้าห่ม (ไม่ทับโคมที่หัวเตียง) — y+h เท่าเดิม ลำดับวาดไม่เปลี่ยน

    const lampFrame = () => Core.lights[4] ? 0 : 1;
    out.push(item(F, { id:'f4_lamp', sp:'nightstand_lamp', fx:NIGHT.fx, fy:NIGHT.fy, label:'โคมข้างเตียง', hint:'คลิก: เปิด/ปิดไฟห้อง',
      frame: lampFrame,
      click(){ Core.lights[4] = !Core.lights[4]; say('f4_lamp', Core.lights[4] ? 'ไฟเปิด' : 'ปิดไฟ ราตรีสวัสดิ์', 1400); Core.log('4F โคมข้างเตียง ' + (Core.lights[4] ? 'ON' : 'OFF')); } }));

    /* ตู้เสื้อผ้า + ประตูเปิดกระพริบ */
    const wardSp = spr('wardrobe');
    const wardFy0 = WARD.fy - Ry(10.4), wardFy1 = WARD.fy - Ry(0.6);        // ด้านหน้าตู้ = ระนาบ fx คงที่ (ไม่ flip → ยาวตาม fy)
    out.push(item(F, { id:'f4_wardrobe', sp:'wardrobe', fx:WARD.fx, fy:WARD.fy, label:'ตู้เสื้อผ้า', hint:'คลิก: เปิดประตู',
      post(ctx, t, st){
        if (!(st.open && t < st.open)) return;
        const e = 1.7 - (st.open - t), on = e < 1.45 && !(e > 0.32 && e < 0.46) && !(e > 0.9 && e < 1.0);   // ประตูเปิด-กระพริบ-ปิด
        if (!on) return;
        const fx = WARD.fx + 0.0006;
        Core.quadX(fx, wardFy0 + Ry(0.9), wardFy1 - Ry(0.9), 3, 27, '#1a1226', Core.PAL.ol);          // ช่องภายใน
        const cl = ['#e8584c', '#f4efe2', '#4f7fd0', '#ffd37a', '#9db37a', '#c0526a'], n = 6, w = (wardFy1 - wardFy0 - Ry(3.4)) / n;
        for (let i = 0; i < n; i++){ const a = wardFy0 + Ry(1.7) + i*w;
          Core.quadX(fx, a, a + w*0.78, 8 + (i%3)*2, 24, cl[i]); Core.quadX(fx, a + w*0.28, a + w*0.5, 24, 25.6, '#8a8aa0'); }   // เสื้อแขวน + ไม้แขวน
        Core.quadX(fx, wardFy0 + Ry(0.9), wardFy1 - Ry(0.9), 25.6, 26.3, '#8a8aa0');                    // ราวแขวน
      },
      click(st){ st.open = Core.t + 1.7; say('f4_wardrobe', ['เสื้อยืดเต็มไปหมด','ผ้าห่มสำรองอยู่ชั้นบน','ชุดทำงานแขวนอยู่'][Math.floor(Core.t) % 3], 1700); Core.log('4F เปิดตู้เสื้อผ้า'); } }));

    out.push(item(F, { id:'f4_window', sp:'window_frame', fx:WIN.fx, fy:WIN.fy, fz:WIN.fz, flip:true, kind:'window', label:'หน้าต่าง', hint:'คลิก: ดูวิว',
      frame(){ return PH[phase()] || 0; },
      click(){
        const p = phase(), tx = p === 'morning' ? 'ฟูจิชัดมากเช้านี้' : p === 'evening' ? 'ฟ้าสีส้มสวยจัง ฟูจิเป็นเงาเลย' : 'ดึกแล้ว ดาวเต็มฟ้า';
        say('f4_window', tx, 2000); Core.log('4F มองวิวหน้าต่าง (' + p + ')');
      } }));
    out.push(item(F, { id:'f4_plant', sp:'plant_small', fx:PLANT.fx, fy:PLANT.fy, flip:true, label:'ต้นไม้เล็ก', hint:'คลิก: ทัก',
      click(){ say('f4_plant', 'รดน้ำเมื่อวานแล้วนะ', 1500); } }));

    /* ---------- คนนอน (sleeper) / ลุกนั่งตอนเช้า ---------- */
    const sl = spr('sleeper'), sit = spr('customer_sit');
    // ตำแหน่งวาดเป็น px (จุดอ้างอิง = หมอนบนเตียง): sleeper anchor = กลางล่างของ sprite → ต้องเลื่อนลงมาให้หัวอยู่บนหมอน
    const SLP = BEDF ? { dx: 5, dy: 14 } : { dx: -6, dy: 14 }, SIT = BEDF ? { dx: 4, dy: 7 } : { dx: -5, dy: 7 };   // ไม่ flip → sprite คน mirror (dx กลับด้าน -1 เพราะ sprite กว้างคู่)
    const lumpA = BEDF ? [BED.fx - Rx(12.8), BED.fy - Ry(8.2)] : [BED.fx - Rx(8.2), BED.fy - Ry(12.8)], lumpAB = BEDF ? [10.4, 7.4] : [7.4, 10.4];                          // มุมหลังของก้อนผ้าห่ม
    function sitting(t){ return phase() === 'morning' && (t % 20) > 14 && (t % 20) < 18.5; }
    function pbox(s0, x, y, fl){
      const w = s0.w, h = s0.h, b = tight(s0);
      return { x: Math.round(x - Math.floor(w/2)) + (fl ? (w-1-b.x1) : b.x0), y: Math.round(y - h) + b.y0, w: b.x1-b.x0+1, h: b.y1-b.y0+1 };
    }
    const sleeper = Object.assign({ id:'f4_sleeper', kind:'character', label:'คนนอนหลับ', hint:'คลิก: ปลุก' }, { x:0, y:0, w:22, h:20 }, {
      order: bedOrder + 0.2,
      draw(ctx, t, st){
        const up = sitting(t), base = Core.iso(PILLOW.fx, PILLOW.fy, PILLOW.fz), g = Core.ctx;
        if (up){
          const x = base.x + SIT.dx, y = base.y + SIT.dy;
          Object.assign(this, pbox(sit, x, y, !BEDF)); this.h = Math.min(this.h, 14);
          g.save(); g.beginPath(); g.rect(Math.round(x) - 20, Math.round(y) - 40, 40, 40 - 5); g.clip();     // ตัดเหลือครึ่งตัว
          Core.drawSprite(g, sit, x, y, Core.anim(2, 1.2), !BEDF);
          g.restore();
          Core.isoBox(lumpA[0], lumpA[1], 6.0, lumpAB[0], lumpAB[1], 3.4, '#6a5aa8', '#4e4286', '#3b3270');                    // ก้อนผ้าห่มคลุมขา
        } else {
          const x = base.x + SLP.dx, y = base.y + SLP.dy;
          Object.assign(this, pbox(sl, x, y, !BEDF));
          Core.drawSprite(g, sl, x, y, Core.anim(2, 0.8), !BEDF);
          Core.emit(() => { for (let i = 0; i < 3; i++){                                                          // Zzz ลอยขึ้น
            const k = (t*0.33 + i/3) % 1, zx = (BEDF ? this.x + 2 : this.x + this.w - 5) + k*12 + Math.sin(t*2 + i)*1.5, zy = this.y - 2 - k*16;
            Core.text('Z', Math.round(zx), Math.round(zy), i === 1 ? '#ffffff' : '#bcd0ff'); } });
        }
      },
      onClick(){
        const up = sitting(Core.t);
        say(this.id, up ? 'หืม… กี่โมงแล้ว' : ((this.state.n = (this.state.n|0) + 1) % 2 ? 'อีก 5 นาที…' : 'Zzz'), 1600);
        Core.log('4F แตะคนนอน');
      } });
    out.push(sleeper);

    /* =====================================================================
     * รอบ 6 (JUDUM สั่ง "ชั้น 4 แบบรก ๆ ดูมีอะไรเพิ่ม") — ของรก ๆ วาดด้วย Core primitives ไม่แตะไฟล์ sprite
     * โซน: ผนังยาว Y 4-26 = มุมโต๊ะคอม+ชั้นฟิกเกอร์+โปสเตอร์ · พื้นหน้าเตียง = กองเสื้อ/หนังสือ/ขนม/พิซซ่า
     *       Y 60-70 หน้าตู้ = ตะกร้าผ้า/ถังขยะ · ผนังสั้น = นาฬิกา · เพดานผนังยาว = ไฟราว
     * ===================================================================== */
    const P = Core.PAL, K = P.ol;
    const box = (X, Y, Z, a, b, h, cT, cL, cR) => Core.isoBox(X/UX, Y/UY, Z, a, b, h, cT, cL, cR);
    const bbx = (X, Y, Z, a, b, h) => Core.boxBBox(X/UX, Y/UY, Z, a, b, h);
    const ipt = (X, Y, Z) => Core.iso(X/UX, Y/UY, Z || 0);
    const obj = (id, label, hint, bb, draw, click, extra) => { const o = Object.assign({ id, kind:'furniture', label, hint }, bb, { draw }, extra || {}); if (click) o.onClick = function(){ click.call(this, this.state); }; out.push(o); return o; };
    const dk = () => Core.isDark(4);

    /* ---------- โต๊ะคอม + แล็ปท็อป + จอผนัง + เก้าอี้ (ผนังยาว Y 8-24) ---------- */
    const DESK = { X:0.3, Y:8, a:8, b:16, h:13 };
    const lapMode = { n:0 };                                                       // 0 = กราฟ · 1 = โค้ด · 2 = ปิด
    obj('f4_desk', 'โต๊ะคอม', 'คลิก: สลับหน้าจอแล็ปท็อป', bbx(DESK.X, DESK.Y, 0, DESK.a, DESK.b, DESK.h + 12),
      function(ctx, t){
        const d = DESK;
        box(d.X, d.Y, 0, d.a, d.b, d.h, '#9a6a44', '#7a5034', '#5e3c26');                              // โต๊ะไม้
        Core.quadZ(d.h + .3, (d.X + 1)/UX, (d.X + 6)/UX, (d.Y + 1.5)/UY, (d.Y + 5)/UY, '#eae0d0', K);  // กระดาษกอง
        Core.quadZ(d.h + .6, (d.X + 2)/UX, (d.X + 7)/UX, (d.Y + 2.5)/UY, (d.Y + 5.5)/UY, '#f4efe2', K);
        box(d.X + 1.5, d.Y + 7, d.h, 5, 7, 1, '#5a5a72', '#3e3e52', '#2e2e40');                        // ฐานแล็ปท็อป
        const on = lapMode.n !== 2, scr = lapMode.n === 0 ? '#0e2a1e' : '#101624';
        Core.quadX((d.X + 1.6)/UX, (d.Y + 7.2)/UY, (d.Y + 13.8)/UY, d.h + 1, d.h + 7.5, on ? scr : '#1a1a26', K);   // จอแล็ปท็อป (เอียงตามผนัง)
        if (on) Core.emit(() => {
          for (let i = 0; i < 6; i++){
            const fy = (d.Y + 7.9 + i)/UY;
            if (lapMode.n === 0){ const v = 2 + Math.round(2.5 + 2.4*Math.sin(t*1.3 + i*1.1)); Core.quadX((d.X + 1.65)/UX, fy, fy + .6/UY, d.h + 1.6, d.h + 1.6 + v, (i % 3 === 1) ? '#ff6f6f' : '#5fe39a'); }
            else { const w = ((i*7 + Math.floor(t*2)) % 5) + 1; Core.quadX((d.X + 1.65)/UX, fy, fy + .6/UY, d.h + 2 + (i % 2)*2.4, d.h + 2 + (i % 2)*2.4 + w*.9, ['#4fc1c6','#ffd37a','#eae0d0'][i % 3]); }
          }
          if (dk()) Core.pool((d.X + 6)/UX, (d.Y + 10)/UY, 10, 5, lapMode.n === 0 ? '#5fe39a' : '#4fc1c6', .18);
        });
        box(d.X + 6.4, d.Y + 1.6, d.h, 1.6, 1.6, 2.2, '#f4efe2', '#d8d0c0', '#bcb2a0');                 // แก้วกาแฟ
        Core.quadZ(d.h + 2.3, (d.X + 6.6)/UX, (d.X + 7.8)/UX, (d.Y + 1.8)/UY, (d.Y + 3)/UY, '#4a2a1a');
        box(d.X + 2, d.Y + 14.2, d.h, 1.4, 1.4, 1.2, '#2a2a34', '#1c1c24', '#1c1c24');                   // เมาส์
        // จอมอนิเตอร์แขวนผนัง + กราฟแท่งเทียน
        Core.quadX(0, (d.Y + 2)/UY, (d.Y + 14)/UY, 22, 34, '#0c0f1c', '#3a3a52');
        Core.emit(() => { for (let i = 0; i < 8; i++){ const fy = (d.Y + 3 + i*1.35)/UY, c = 24 + 4 + 3*Math.sin(i*.9 + Math.floor(t)*.3), up = Math.cos(i*.9 + Math.floor(t)*.3) > 0;
          Core.quadX(0.0005, fy, fy + .7/UY, c - 1.5, c + 1.5, up ? '#5fe39a' : '#ff6f6f'); Core.quadX(0.0005, fy + .25/UY, fy + .45/UY, c - 3, c + 3, up ? '#5fe39a' : '#ff6f6f'); } });
        // ขาตั้ง/สายไฟห้อยจากจอลงพื้น
        Core.quadX(0, (d.Y + 7.6)/UY, (d.Y + 8.2)/UY, d.h, 22, '#2a2a34');
      },
      function(st){ lapMode.n = (lapMode.n + 1) % 3; say('f4_desk', ['เปิดกราฟ BTC', 'เขียนโค้ดบอทต่อ…', 'ปิดจอ พักสายตา'][lapMode.n], 1500); Core.log('4F แล็ปท็อป: ' + ['กราฟ','โค้ด','ปิด'][lapMode.n]); });
    obj('f4_chair', 'เก้าอี้โต๊ะคอม', 'คลิก: หมุนเล่น', bbx(10, 11, 0, 4.5, 4.5, 12),
      function(ctx, t, st){
        const spin = st.until && t < st.until, k = spin ? (Math.floor(t*10) % 2) : 0;
        box(10 + k*.4, 11, 0, 4.5, 4.5, 6, '#3a3a4e', '#2a2a3a', '#1e1e2c');                             // เบาะ
        box(10 + k*.4, 11, 6, 1.2, 4.5, 6, '#4a4a60', '#2e2e40', '#262636');                              // พนักพิง (หันเข้าโต๊ะ)
        Core.quadZ(.2, 10.5/UX, 14.5/UX, 11.5/UY, 15.5/UY, '#1c1c24');                                      // ฐานล้อ
      },
      function(st){ st.until = Core.t + 1.2; say('f4_chair', 'หมุน ๆ ~', 1200); });
    /* สายไฟบนพื้น จากโต๊ะไปปลั๊กผนัง */
    out.push({ id:'f4_cable', kind:'decor', label:'สายไฟพันกัน', x:0, y:0, w:0, h:0, order:-110,
      draw(){ const a = ipt(8.5, 20), b = ipt(14, 26), c = ipt(9, 29), d = ipt(0.5, 30);
        Core.line(a.x, a.y, b.x, b.y, '#1c1c24'); Core.line(b.x, b.y, c.x, c.y, '#1c1c24'); Core.line(c.x, c.y, d.x, d.y, '#1c1c24');
        Core.quadX(0, 29.2/UY, 31/UY, 3, 5.4, '#eae0d0', K); } });

    /* ---------- ชั้นวางฟิกเกอร์ + โปสเตอร์ 2 แผ่น + ไฟราว (ผนังยาว) ---------- */
    const FIG = [['#d8363a','#f4efe2'], ['#4f7fd0','#ffd37a'], ['#5fe39a','#140b10'], ['#ffd37a','#d8363a'], ['#c0526a','#eae0d0'], ['#4fc1c6','#2b2238']];
    obj('f4_shelf', 'ชั้นวางฟิกเกอร์', 'คลิก: ดูของสะสม', { x:0, y:0, w:0, h:0, order:-6 },
      function(ctx, t){
        Core.quadX(0, 4/UY, 26/UY, 40, 41.6, '#8a4b2a', K); Core.quadX(0, 4/UY, 26/UY, 41.6, 42.3, '#b5703c');
        FIG.forEach((c, i) => { const Y = 5 + i*3.5; box(0.3, Y, 41.6, 2.2, 2.4, 3.6, c[0], Core.shade(c[0], .85), Core.shade(c[0], .7)); box(0.6, Y + .5, 45.2, 1.6, 1.5, 1.8, c[1], Core.shade(c[1], .88), Core.shade(c[1], .75)); Core.quadX(0.0004, (Y + 1.2)/UY, (Y + 1.8)/UY, 45.8, 46.3, K); });   // ตัว + หัว + ตา
        const p0 = ipt(0, 26, 42.3), p1 = ipt(0, 4, 40); Object.assign(this, { x: Math.min(p0.x, p1.x), y: p1.y - 8, w: Math.abs(p1.x - p0.x) + 2, h: p0.y - p1.y + 10 });
      },
      function(st){ say('f4_shelf', ['กาชาปองครบเซ็ตแล้ว', 'ตัวนี้หายาก ห้ามจับ', 'ยังขาดอีก 2 ตัว'][(st.n = (st.n|0) + 1) % 3], 1600); });
    obj('f4_posterA', 'โปสเตอร์จรวด', 'คลิก: TO THE MOON', { x:0, y:0, w:0, h:0, order:-7 },
      function(ctx, t, st){
        Core.quadX(0, 46.5/UY, 57/UY, 48, 66, '#1b1b33', K); Core.quadX(0, 47.5/UY, 56/UY, 49, 65, '#141428');
        Core.emit(() => { for (let i = 0; i < 7; i++) Core.quadX(0.0005, (48 + (i*3.7) % 8)/UY, (48.5 + (i*3.7) % 8)/UY, 50 + (i*5.3) % 14, 50.5 + (i*5.3) % 14, '#eae0d0'); });   // ดาว
        const z = st.go && t < st.go ? 52 + (t*14) % 12 : 52;
        Core.quadX(0.0005, 51/UY, 53/UY, z, z + 7, '#eae0d0'); Core.quadX(0.0005, 51.6/UY, 52.4/UY, z + 7, z + 9, '#d8363a'); Core.quadX(0.0005, 50.2/UY, 53.8/UY, z, z + 1.6, '#d8363a');  // จรวด
        Core.quadX(0.0005, 51.5/UY, 52.5/UY, z - 2.5, z, (Math.floor(t*8) % 2) ? '#ffd37a' : '#ff8a3a');                                                   // ไฟท้าย
        const p0 = ipt(0, 57, 66), p1 = ipt(0, 46.5, 48); Object.assign(this, { x: Math.min(p0.x, p1.x), y: p0.y, w: Math.abs(p1.x - p0.x) + 2, h: p1.y - p0.y + 2 });
      },
      function(st){ st.go = Core.t + 1.6; say('f4_posterA', 'TO THE MOON 🚀', 1500); });
    obj('f4_posterB', 'โปสเตอร์ไลฟ์', 'คลิก: ดูโปสเตอร์', { x:0, y:0, w:0, h:0, order:-7 },
      function(ctx, t){
        Core.quadX(0, 28/UY, 36/UY, 46, 58, '#d8363a', K); Core.quadX(0, 29/UY, 35/UY, 47, 57, '#4a1a2c');
        Core.quadX(0.0005, 30/UY, 34/UY, 52, 55.5, '#ffd37a'); Core.quadX(0.0005, 30.6/UY, 33.4/UY, 48.5, 51, '#eae0d0');
        const p0 = ipt(0, 36, 58), p1 = ipt(0, 28, 46); Object.assign(this, { x: Math.min(p0.x, p1.x), y: p0.y, w: Math.abs(p1.x - p0.x) + 2, h: p1.y - p0.y + 2 });
      },
      function(){ say('f4_posterB', 'LIVE ที่บูโดกัน ปีหน้าไปแน่', 1500); });
    out.push({ id:'f4_fairy', kind:'decor', label:'ไฟราวประดับ', x:0, y:0, w:0, h:0, order:-8,
      draw(ctx, t){
        const on = Core.time.phase !== 'morning' || Core.lights[4];
        let prev = null;
        for (let Y = 2; Y <= 78; Y += 2){ const sag = 3*Math.abs(Math.sin(Y/80*Math.PI*4)), p = ipt(0, Y, 104 - sag); if (prev) Core.line(prev.x, prev.y, p.x, p.y, '#2a2a34'); prev = p; }
        for (let i = 0; i < 20; i++){ const Y = 3.5 + i*3.9, sag = 3*Math.abs(Math.sin(Y/80*Math.PI*4)), p = ipt(0, Y, 103 - sag), c = ['#ffd37a','#ff6f6f','#5fe39a','#4fc1c6'][i % 4];
          if (on && ((Math.floor(t*2) + i) % 5) !== 0) Core.glowRect(p.x, p.y, 2, 2, c); else Core.rect(p.x, p.y, 2, 2, '#3a3a4e'); }
      } });

    /* ---------- กีตาร์พิงผนังยาว (Y 24-31) ---------- */
    obj('f4_guitar', 'กีตาร์', 'คลิก: ดีดเล่น', { x:0, y:0, w:0, h:0 },
      function(ctx, t, st){
        const b = ipt(1.8, 28.5, 5), n = ipt(0.6, 24.5, 26), strum = st.until && t < st.until;
        Core.ellipse(b.x, b.y, 5, 6, K); Core.ellipse(b.x, b.y, 4, 5, '#b5703c'); Core.ellipse(b.x + 1, b.y - 3, 3, 3, '#b5703c');
        Core.ellipse(b.x, b.y + 1, 1, 1, '#140b10');
        Core.line(b.x, b.y - 4, n.x, n.y, K); Core.line(b.x + 1, b.y - 4, n.x + 1, n.y, '#5e3019'); Core.rect(n.x - 1, n.y - 3, 4, 3, '#2a2a34');
        if (strum) Core.emit(() => Core.text('♪', b.x + 6 + Math.floor((t*3) % 3), b.y - 10 - Math.floor((t*6) % 6), '#ffd37a'));
        Object.assign(this, { x: b.x - 6, y: n.y - 4, w: 13, h: b.y - n.y + 11 });
      },
      function(st){ st.until = Core.t + 1.4; say('f4_guitar', ['เจิ้งงง~', 'ยังเล่นได้แค่ 3 คอร์ด', 'สายขาดไปเส้นนึง'][(st.n = (st.n|0) + 1) % 3], 1400); });

    /* ---------- พื้นหน้าเตียง: กองเสื้อผ้า / หนังสือ / รองเท้าแตะ / ถุงเท้า ---------- */
    obj('f4_clothes', 'กองเสื้อผ้า', 'คลิก: …ซักเมื่อไหร่', bbx(23, 40, 0, 8, 10, 4),
      function(){
        box(23, 42, 0, 6, 7, 1.6, '#4f7fd0', '#3a60a8', '#2d4c88');                                         // กางเกงยีนส์
        box(25.5, 40.5, 1.2, 5, 5.5, 1.6, '#d8363a', '#b02a2e', '#8c2024');                                 // เสื้อแดง
        box(24, 45, 1.4, 4.5, 4, 1.4, '#f4efe2', '#d8d0c0', '#bcb2a0');                                     // เสื้อยืดขาว
        box(27.5, 46, 2.4, 3, 3, 1.2, '#2b2238', '#201a2c', '#161220');                                     // ฮู้ดดี้
        Core.quadZ(.2, 21/UX, 23/UX, 46/UY, 48.5/UY, '#ffd37a', K); Core.quadZ(.2, 21.5/UX, 23.5/UX, 49/UY, 51.5/UY, '#ffd37a', K);   // รองเท้าแตะ
        Core.quadZ(.2, 30/UX, 32/UX, 38/UY, 39.5/UY, '#4fc1c6', K); Core.quadZ(.2, 31.5/UX, 33.5/UX, 41/UY, 42.5/UY, '#4fc1c6', K);   // ถุงเท้าคนละข้าง
      },
      function(st){ say('f4_clothes', ['เดี๋ยวซักพรุ่งนี้…', 'ตัวนี้ยังใส่ได้อีกวัน', 'ถุงเท้าอีกข้างอยู่ไหน'][(st.n = (st.n|0) + 1) % 3], 1600); });
    obj('f4_books', 'กองหนังสือ', 'คลิก: อ่านชื่อเล่ม', bbx(20, 28, 0, 5, 6, 8),
      function(){
        box(20, 28, 0, 5, 6, 1.6, '#4a1a2c', '#3a1422', '#2c0f1a'); box(20.4, 28.5, 1.6, 4.6, 5.6, 1.6, '#4f9a5a', '#3d7a46', '#2f6036');
        box(20.2, 28.2, 3.2, 4.8, 5.8, 1.6, '#ffd37a', '#d0ad60', '#a88a48'); box(20.8, 29, 4.8, 4, 5, 1.4, '#2f72e0', '#255ab4', '#1d468c');
        box(21.5, 29.5, 6.2, 3, 4, 1.4, '#eae0d0', '#c9b9a0', '#a89880');
      },
      function(st){ say('f4_books', ['Reminiscences of a Stock Operator', 'Trading in the Zone (อ่านค้างหน้า 80)', 'Market Wizards', 'คู่มือ Python ยืมมา 2 ปี'][(st.n = (st.n|0) + 1) % 4], 2000); });

    /* ---------- ขนม / น้ำอัดลม / กล่องพิซซ่า ---------- */
    obj('f4_snacks', 'ขนม + น้ำอัดลม', 'คลิก: หยิบกิน', bbx(8, 53, 0, 6, 5, 5),
      function(){
        box(8, 53.5, 0, 2.6, 1.8, 4.2, '#ffd37a', '#d8a84a', '#b08838'); Core.quadZ(4.3, 8.4/UX, 10.2/UX, 53.8/UY, 55/UY, '#d8363a');   // ถุงมันฝรั่ง
        box(11.2, 53, 0, 1.3, 1.3, 3, '#d8363a', '#b02a2e', '#8c2024'); box(12.8, 54.6, 0, 1.3, 1.3, 3, '#aeb4c6', '#7f869c', '#575c74');   // กระป๋อง 2
        box(10.6, 56.4, 0, 1.3, 1.3, 1.2, '#aeb4c6', '#7f869c', '#575c74');                                 // กระป๋องล้ม
      },
      function(st){ say('f4_snacks', ['กร้วม กร้วม', 'กระป๋องสุดท้ายแล้ว', 'กินตอนตี 2 อีกแล้ว'][(st.n = (st.n|0) + 1) % 3], 1400); });
    obj('f4_pizza', 'กล่องพิซซ่า', 'คลิก: เหลือกี่ชิ้น', bbx(27, 56, 0, 6.5, 6.5, 2),
      function(ctx, t, st){
        const open = st.until && t < st.until;
        box(27, 56, 0, 6.5, 6.5, 1.2, '#d9b27a', '#b89060', '#96744c');
        if (open){ Core.quadZ(1.3, 27.6/UX, 32.9/UX, 56.6/UY, 62.9/UY, '#e8b85a'); Core.quadZ(1.4, 28.5/UX, 30/UX, 57.5/UY, 59/UY, '#d8363a'); Core.quadZ(1.4, 31/UX, 32.3/UX, 60.5/UY, 62/UY, '#d8363a'); box(27, 56, 1.2, 6.5, .5, 5, '#d9b27a', '#b89060', '#96744c'); }
        else { Core.quadZ(1.3, 28/UX, 32.5/UX, 57/UY, 61.5/UY, '#c8a06a'); Core.quadZ(1.4, 29/UX, 31.5/UX, 58/UY, 60.5/UY, '#d8363a'); }
      },
      function(st){ st.until = Core.t + 2; say('f4_pizza', 'เหลือ 2 ชิ้น เย็นแล้วด้วย', 1600); });

    /* ---------- ถังขยะล้น + ตะกร้าผ้าล้น (หน้าตู้เสื้อผ้า) ---------- */
    obj('f4_trash', 'ถังขยะ (ล้น)', 'คลิก: เอาไปทิ้ง', bbx(34, 63, 0, 4, 4, 9),
      function(ctx, t, st){
        const empty = st.until && t < st.until;
        box(34, 63, 0, 4, 4, 7, '#5a5a72', '#3e3e52', '#2e2e40');
        if (!empty){ box(34.3, 63.3, 7, 1.6, 1.6, 1.5, '#f4efe2', '#d8d0c0', '#bcb2a0'); box(36, 64.6, 7, 1.6, 1.6, 1.3, '#eae0d0', '#c9b9a0', '#a89880'); box(34.8, 65.2, 8.3, 1.4, 1.4, 1.2, '#f4efe2', '#d8d0c0', '#bcb2a0');
          box(38.6, 61.5, 0, 1.5, 1.5, 1.2, '#f4efe2', '#d8d0c0', '#bcb2a0'); box(32.2, 67.2, 0, 1.5, 1.5, 1.2, '#eae0d0', '#c9b9a0', '#a89880'); }   // กระดาษขยำตกพื้น
      },
      function(st){ st.until = Core.t + 6; say('f4_trash', 'ทิ้งแล้ว (ชั่วคราว)', 1400); Core.log('4F เอาขยะไปทิ้ง'); });
    obj('f4_laundry', 'ตะกร้าผ้า (ล้น)', 'คลิก: …', bbx(8.5, 62, 0, 5.5, 5.5, 10),
      function(){
        box(8.5, 62, 0, 5.5, 5.5, 7, '#c8a06a', '#a68050', '#866640');
        for (let i = 0; i < 3; i++) Core.quadX((8.5 + 5.5)/UX, (62.4 + i*1.6)/UY, (62.4 + i*1.6 + .6)/UY, 1, 6.5, '#866640');   // ลายสาน
        box(8.8, 62.3, 7, 2.5, 2.4, 1.6, '#4f7fd0', '#3a60a8', '#2d4c88'); box(11, 64, 7, 2.6, 2.6, 1.8, '#f4efe2', '#d8d0c0', '#bcb2a0'); box(9.5, 65, 8.4, 2, 2, 1.4, '#d8363a', '#b02a2e', '#8c2024');
        box(14.2, 63.5, 0, 2, 2.2, 1, '#4fc1c6', '#3a9aa0', '#2c7a80');                                      // ผ้าหล่นข้างตะกร้า
      },
      function(st){ say('f4_laundry', ['เสาร์นี้ซักแน่ ๆ', 'ไม่มีเสื้อใส่แล้ว…'][(st.n = (st.n|0) + 1) % 2], 1500); });

    /* ---------- นาฬิกาแขวนผนังสั้น (ขวา) ---------- */
    obj('f4_clock', 'นาฬิกาแขวน', 'คลิก: กี่โมง', { x:0, y:0, w:0, h:0, order:-6 },
      function(ctx, t){
        Core.quadY(0, 12/UX, 18/UX, 58, 66, '#eae0d0', K); Core.quadY(0.0005, 12.6/UX, 17.4/UX, 59, 65, '#f6f8fc');
        const c = Core.iso(15/UX, 0, 62), d = new Date(), h = (d.getHours() % 12 + d.getMinutes()/60)/12*Math.PI*2, m = d.getMinutes()/60*Math.PI*2;
        Core.line(c.x, c.y, c.x + Math.round(Math.sin(h)*2.5), c.y - Math.round(Math.cos(h)*2.5), K);
        Core.line(c.x, c.y, c.x + Math.round(Math.sin(m)*4), c.y - Math.round(Math.cos(m)*4), '#d8363a');
        const p0 = Core.iso(12/UX, 0, 58), p1 = Core.iso(18/UX, 0, 66); Object.assign(this, { x: Math.min(p0.x, p1.x), y: p1.y - 2, w: Math.abs(p1.x - p0.x) + 2, h: p0.y - p1.y + 4 });
      },
      function(){ const d = new Date(); say('f4_clock', String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ' น. (เวลาจริง)', 1600); });

    /* ---------- แมวนอนขดบนพรม ---------- */
    const cat = spr('cat');
    out.push(Object.assign({ id:'f4_cat', kind:'character', label:'แมว', hint:'คลิก: ลูบ' }, { x:0, y:0, w:0, h:0 }, {
      draw(ctx, t, st){
        if (!cat){ Object.assign(this, { x:0, y:0, w:0, h:0 }); return; }
        const fx = 29/UX, fy = 24/UY, awake = st.until && t < st.until;
        Core.drawSprite(cat, fx, fy, awake ? Core.anim(cat.frames.length, 6) : Core.anim(Math.min(2, cat.frames.length), 1), true, 0);
        Object.assign(this, Core.spriteBBox(cat, fx, fy, 0));
        if (!awake && Core.time.phase !== 'morning') Core.emit(() => Core.text('z', this.x + this.w - 2 + Math.floor((t*2) % 2), this.y - 4 - Math.floor((t*3) % 4), '#bcd0ff'));
      },
      onClick(){ this.state.until = Core.t + 2; say('f4_cat', ['にゃー', 'กรน… กรน…', 'อย่ากวน'][(this.state.n = (this.state.n|0) + 1) % 3], 1400); Core.log('4F ลูบแมว'); }
    }));

    return out;
  }
};
})();
