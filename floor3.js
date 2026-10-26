/* =============================================================================
 * floor3.js — ชั้น 3 ห้องพักเบรค (休憩室)            เจ้าของไฟล์: Sonnet-B (รอบ 4: ห้อง 40x80 — สลับแกน fx สั้น / fy ยาว)
 * ต้องมี: จอเบิ้มติดผนัง (วาดด้วยโค้ด)+PS5, โซฟา+คนเล่น, ตู้ arcade 2 ตู้ (+คนเล่น 1), ปิงปอง, บีนแบ็ก, ตู้เย็น, ชั้นขนม, ต้นไม้
 *
 * LOGIC (ให้ตรวจ):
 *   - ทิศ: sprite ของใช้งานหันขวา-ล่าง (+fx). TV ติดผนังซ้ายหันออกมาห้อง → คนดู "ยืน/นั่งหันหลังให้กล้อง"
 *     ซึ่ง gamer_sofa / gamer_arcade ถูกวาดจากด้านหลังอยู่แล้ว → โซฟา sofa_l หันหน้าเข้าหากล้อง ใช้นั่งเล่นกับคนดูไม่ได้
 *     จึงวาด "โซฟาด้านหลัง" (โครงกล่อง iso สี sofa_l) ตัวเดียวไว้ตรงหน้า TV ให้ gamer_sofa นั่ง
 *     ส่วน sofa_l ตัวจริงวางชิดผนังยาวมุมขวา (flip) เป็นโซฟารับแขก
 *   - รอบ 3: ของตั้งพื้นทุกชิ้นสูง ≤ 50 px → ไม่ถูกชั้นบนบัง วางได้ทุกที่ · ป้าย/โปสเตอร์บนผนังวางที่ z≥50 ใน fx>.6 (ผนังยาว) / fy>.2 (ผนังสั้น)
 *   - ผนังสั้น: ตู้ arcade 2 ตู้ + TV (+โซฟาหน้า TV) · ผนังยาว: ตู้เย็น ชั้นขนม ต้นไม้ sofa_l · กลางห้อง: ปิงปอง บีนแบ็ก
 *   - ลำดับวาด: โครงโซฟา < คนเล่น < พนักพิงโซฟา (กำหนด order เอง) ให้คนโผล่เหนือพนักพิง
 *   - เฟสเวลา: แสงจอ (pool) บนพื้นแสดงเมื่อไม่ใช่ตอนเช้า หรือไฟห้องปิด
 * ========================================================================== */
(function(){
'use strict';
const Core = window.Core;
if (!Core) { console.error('[floor3] Core ไม่มา'); return; }
const UX = Core.UX, UY = Core.UY;
const Rx = n => n / UX, Ry = n => n / UY;      // หน่วย iso -> สัดส่วนพื้น ตามแกน fx / fy (รอบ 4: UX=40 สั้น · UY=80 ยาว)
const At = (X, Y) => ({ fx: X / UX, fy: Y / UY });  // เขียนตำแหน่งเป็นหน่วย (รอบ 4: X 0..40 ตามผนังสั้น(ขวา), Y 0..80 ตามผนังยาว(ซ้าย))

/* ---------- helpers ภายในไฟล์ ---------- */
const spr = n => (window.SPR_ITEMS && window.SPR_ITEMS[n]) || (window.SPR_PEOPLE && window.SPR_PEOPLE[n]) || null;
const _tight = new Map();
function tight(s){                       // ขอบเขตพิกเซลที่ไม่โปร่งใสจริง (รวมทุกเฟรม) → bbox คลิกไม่เกินตัวของ
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
const night = () => Core.time.phase !== 'morning' || Core.isDark(3);

/* sprite 1 ชิ้น → object (เรียกใน build) */
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

/* วาดซ้ำเฉพาะ "หน้าจอ" แบบเรืองแสง (ไม่โดนหรี่ตอนปิดไฟ) — poly = จุดสัมพัทธ์กับ anchor ของ sprite (px) */
function glowScreen(s, fx, fy, fz, frame, flip, polys){
  if (!Core.isDark(3)) return;
  const p = Core.iso(fx, fy, fz), g = Core.ctx;
  g.save(); g.beginPath();
  polys.forEach(q => q.forEach((pt, i) => { const x = Math.round(p.x + (flip ? -pt[0] : pt[0])), y = Math.round(p.y + pt[1]); i ? g.lineTo(x, y) : g.moveTo(x, y); }));
  g.clip();
  Core.emit(() => Core.drawSprite(s, fx, fy, frame, flip, fz));
  g.restore();
}
const ARC_SCREEN = [[-1,-12],[10,-17.6],[10,-23.6],[-1,-18]], ARC_MARQ = [[0,-18],[12,-24],[12,-30],[0,-24]];

/* ภาพ invader บนผนัง (ใช้ quadX ทีละเซลล์) */
const INV = ['..X...X..','...X.X...','..XXXXX..','.XX.X.XX.','XXXXXXXXX','X.XXXXX.X','X.X...X.X'];

/* ---------- ตำแหน่งหลัก (พิกัดพื้น) — รอบ 3: ห้อง 80x40 หน่วย ----------
 * footprint จริงของ sprite (วัดจาก pixel ที่ไม่โปร่งใส; a = ลึกตามแกน X, b = กว้างตามแกน Y เมื่อไม่ flip; flip = สลับกัน):
 *   TV 5.5x19.5 · ตู้ arcade 5.5x8.5 · ปิงปอง 11.5x19.5 (flip: 19.5x11.5) · บีนแบ็ก 5.5x5.5 · ตู้เย็น 5.5x6
 *   ชั้นขนม 4.5x12.5 (flip: 12.5x4.5) · ต้นไม้ใหญ่ 9x9 · sofa_l 7.5x28.5 (flip: 28.5x7.5) · โซฟาด้านหลัง (กล่อง iso) 10x18
 * จุดอ้างอิงของ sprite = มุมหน้าของฐาน → กล่อง X [Xf-a, Xf], Y [Yf-b, Yf]   (เช็คแล้วว่าไม่หลุดพื้น/ไม่ทะลุผนัง)
 * รอบ 4 = รอบ 3 สลับแกน (X,Y)→(Y,X) และสลับ flip (ผนังยาวเป็นซ้าย fx=0 ไม่ flip · ผนังสั้นเป็นขวา fy=0 flip) — เลขด้านล่างเป็น "แบบเก่า" เอาไว้เทียบ (X เก่า = fy ใหม่, Y เก่า = fx ใหม่)
 * แผนผังเดิม (X → ขวาลงตามผนังยาว, Y → ซ้ายลงตามผนังสั้น):
 *   ผนังสั้น (X=0): ตู้ arcade 2 ตู้ Y0.3-17.3 (หันเข้าห้อง) + คนยืนเล่น · TV Y17-36.5 · โซฟาหน้า TV X11-21 Y19.5-37.5
 *   ผนังยาว (Y=0):  ตู้เย็น X8.5-14.5 · ชั้นขนม X17-29.5 · ต้นไม้ X32.6-41.6 · สวิตช์ X44.5-49.5 · sofa_l X51-79.5
 *   กลางห้อง: บีนแบ็กข้างโซฟา X26-31.5 Y30-35.5 · โต๊ะปิงปอง X43-62.5 Y21-32.5 */
/* รอบ 4b: จอเบิ้มย้ายไปผนังยาวซ้าย (fx=0) · โซฟา+เกมเมอร์หันเข้าผนังนั้น (ไม่ flip เหมือนรอบ 3) · ตู้ arcade+ตู้เย็น+ชั้นขนม+ป้าย BREAK อยู่ผนังสั้นขวา (flip)
 * จอ: Y 45-77 (32 หน่วย = 0.40 ของผนัง · กว้างบนจอ ~64 px) · z 18-58 (40 px) → true 16:9 ≈ 1.8 · มุมบนซ้าย (Y45, z58): 45+36=81 > 80 พ้นโซนบังพอดี
 * (ใหญ่กว่านี้ไม่ได้: ยิ่งกว้างมุมจะเข้าโซนบังของ slab ชั้นบน หรือชนปล่องลิฟต์ Y>72) */
const TVY0 = 45, TVY1 = 77, TVZ0 = 18, TVZ1 = 58;
const SU = 10, SV = 18;                                           // โซฟาด้านหลัง: ลึกตาม fx 10 · ยาวตาม fy 18
const SOFA  = Object.assign({ a: SU, b: SV }, At(11, 52));      // มุมหลังของกล่อง (a ตาม fx, b ตาม fy) · กึ่งกลาง Y=61 ตรงกลางจอ
const BEAN  = At(28, 66);
const TABLE = At(30, 38);                                         // ไม่ flip: ยาวตามแกน fy
const CABA  = At(8.8, 5.7), CABB = At(17.3, 5.7);               // ตู้ arcade ชิดผนังสั้น(ขวา) หันออก · flip
const PLAYER = At(13.0, 10.4);
const SNACK = At(31, 4.7), FRIDGE = At(37.5, 5.7);               // ผนังสั้น(ขวา) flip ต่อจากตู้ arcade
const PLANT = At(39, 24), SOFAL = At(7.7, 40);                 // ต้นไม้มุมขวา · sofa_l ชิดผนังยาว(ซ้าย) ช่วง Y 11.5-40 (ไม่ flip)
const SEAT = { fx: SOFA.fx + Rx(3.6), fy: SOFA.fy + Ry(9), fz: 6 };
const SW_Y = 38 / UY;                                             // สวิตช์ไฟบนผนังยาว(ซ้าย) Y 38-43 (z42 พ้นโซนบัง Y>36)

window.FLOORS[3] = {
  name:'ห้องพักเบรค', nameJP:'休憩室',
  desc:'ตู้ Arcade 2 ตู้ · PS5 + TV ใหญ่ + โซฟา · ตู้เย็นขนม บีนแบ็ก โต๊ะปิงปอง',
  shell:{ wallL:'#33274c', wallR:'#3f2f5d', floor:'carpet', floorC:'#3d4f7c', floorC2:'#34436b', trim:'#221a33' },

  /* ผนัง: โปสเตอร์ invader ซ้าย + ป้ายนีออน BREAK ขวา */
  ambient(ctx, t){
    // พรมหน้าจอเบิ้ม (แบนกับพื้น วาดก่อนของทุกชิ้น) — X 6-27 · Y 46-78 (หน่วย)
    Core.quadZ(0.2, Rx(6), Rx(27), Ry(46), Ry(78), '#6a3a52', Core.PAL.ol);
    Core.quadZ(0.2, Rx(7.5), Rx(25.5), Ry(47.5), Ry(76.5), '#8a4a60');
    Core.quadZ(0.2, Rx(9.5), Rx(23.5), Ry(49.5), Ry(74.5), '#6a3a52');
    // โปสเตอร์ผนังขวา(สั้น)เหนือตู้ arcade (z 46-62 · X 7.5-15.5 → เห็นเต็มเพราะ X>6 ที่ z62)
    const x0 = Rx(7.5), x1 = Rx(15.5), z0 = 46, z1 = 62;
    Core.quadY(0, x0, x1, z0, z1, '#1b1a3a', Core.PAL.ol);
    Core.quadY(0, x0+Rx(0.4), x1-Rx(0.4), z0+2, z1-2, '#262552');
    const cw = (x1-x0-Rx(2))/9, ch = (z1-z0-5)/7;
    INV.forEach((row, j) => { for (let i = 0; i < 9; i++) if (row[i] === 'X')
      Core.quadY(0, x0+Rx(1)+i*cw, x0+Rx(1)+(i+1)*cw, z1-3-(j+1)*ch, z1-3-j*ch, '#7ee060'); });
    // ป้ายนีออนผนังสั้น(ขวา) เหนือชั้นขนม/ตู้เย็น — X 20-39, z 62 (พ้นโซนบัง X>6) · shear +1
    Core.emit(() => {
      const on = (Math.floor(t*1.6) % 11) !== 7;                    // กระพริบหายไปบางครั้ง
      const p = Core.iso(19/UX, 0, 66), c = on ? '#ff6ad5' : '#7a3a6a';
      Core.text('BREAK', Math.round(p.x), Math.round(p.y), c, { scale:2, shear:1 });
    });
  },

  build(F){
    const out = [];

    /* ---------- แสงจอบนพื้น (ล่างสุด) ---------- */
    out.push({ id:'f3_glow', kind:'light', label:'แสงจอ', x:0, y:0, w:0, h:0, order:-100,
      draw(ctx, t){
        if (!night()) return;
        const dk = Core.isDark(3), a = dk ? 0.42 : 0.30, fl = 1 + 0.06*Math.sin(t*9);
        const tv = Core.find('f3_tv'), m = tv ? tv.state.mode : 0;
        if (m !== 2) Core.pool(0.32, 0.76, 34, 16, m === 0 ? '#5fd6d6' : '#8fa4ff', a*fl);
        Core.pool(CABA.fx - Rx(4.2), CABA.fy + Ry(6), 15, 7, '#5a78e8', a*1.1);
        Core.pool(CABB.fx - Rx(4.2), CABB.fy + Ry(6), 15, 7, '#ff6a60', a*1.1);
      } });

    /* ---------- จอเบิ้มติดผนังยาวซ้าย + PS5 (วาดด้วย Core.quadX ทั้งหมด · เนื้อจอวาดใน Core.emit = สว่างแม้ปิดไฟ) ----------
     * จอ = ตารางเซลล์ COLS x ROWS บนระนาบ fx=0 · คอลัมน์ 0 = ซ้ายจอ = fy มาก (ผนังซ้ายไล่ลงซ้ายตาม +fy) */
    const COLS = 30, ROWS = 13, BZ = 0.8;                         // BZ = ขอบจอ (หน่วย)
    const sy0 = Ry(TVY0 + BZ), sy1 = Ry(TVY1 - BZ), sz0 = TVZ0 + 1.5, sz1 = TVZ1 - 1.5;
    const cw = (sy1 - sy0) / COLS, chh = (sz1 - sz0) / ROWS;
    const cell = (c, r, color, w = 1, h = 1) => Core.quadX(0, sy1 - (c+w)*cw - 0.0004, sy1 - c*cw + 0.0004, sz1 - (r+h)*chh - 0.15, sz1 - r*chh + 0.15, color);
    // ฉากเกมวิ่ง (side-scroll) — โลกวน PER คอลัมน์ · เลื่อน 3 fps
    const PER = 44, BRK = '#c84c0c';
    const worldCell = wc => {                                      // คืน [[row, color, h]...] ของคอลัมน์โลก wc
      const o = [[10, '#4ac04a', 1], [11, (wc & 1) ? '#a0602a' : '#8a4e20', 1], [12, (wc & 1) ? '#8a4e20' : '#a0602a', 1]];
      if (wc === 11 || wc === 14 || wc === 30 || wc === 33) o.push([7, '#27b04a', 1]);
      if (wc === 12 || wc === 13 || wc === 31 || wc === 32) o.push([7, '#38d060', 1], [8, '#1f9a3a', 2]);
      if (wc === 18 || wc === 20 || wc === 22) o.push([5, BRK, 1]); if (wc === 19 || wc === 21) o.push([5, '#f8b800', 1]);
      if (wc >= 3 && wc <= 5) o.push([1, '#ffffff', 1]); if (wc === 4) o.push([0, '#ffffff', 1]);
      if (wc >= 16 && wc <= 18) o.push([3, '#e8f0ff', 1]); if (wc >= 38 && wc <= 40) o.push([2, '#ffffff', 1]); if (wc === 39) o.push([1, '#ffffff', 1]);
      if (wc >= 7 && wc <= 9) o.push([9, '#2ea04a', 1]); if (wc === 8) o.push([8, '#2ea04a', 1]);
      if (wc >= 25 && wc <= 27) o.push([9, '#2ea04a', 1]); if (wc === 26) o.push([8, '#2ea04a', 1]);
      if (wc === 24 || wc === 36) o.push([4, '#ffd700', 1]);
      if (wc === 28) o.push([9, '#7a4a20', 1]);                     // ศัตรูตัวเล็ก
      return o;
    };
    const drawGame = t => {
      const sc = Math.floor(t * 3), k = (t % 3) / 0.9, jmp = k < 1 ? Math.round(3 * Math.sin(Math.PI * k)) : 0;
      for (let c = 0; c < COLS; c++) worldCell((c + sc) % PER).forEach(q => cell(c, q[0], q[1], 1, q[2]));
      const leg = (sc & 1) ? '#2040c0' : '#5a3a20', leg2 = (sc & 1) ? '#5a3a20' : '#2040c0';
      cell(4, 7 - jmp, '#e03030'); cell(5, 7 - jmp, '#f8c090'); cell(4, 8 - jmp, '#e03030'); cell(5, 8 - jmp, '#e03030');
      cell(4, 9 - jmp, jmp ? '#2040c0' : leg); cell(5, 9 - jmp, jmp ? '#2040c0' : leg2);
    };
    const TILES = ['#e8584c', '#4f9fe0', '#7ed860', '#ffd37a', '#c07ae8', '#40c8c0', '#ff9a5a', '#e86ab0'];
    const drawMenu = t => {
      cell(0, 0, '#1c2c6a', COLS, 1); cell(1, 0, '#ffffff', 3, 1); cell(5, 0, '#7ab8ff', 1, 1); cell(24, 0, '#8fa4ff', 5, 1);   // แถบบน + โลโก้
      const sel = Math.floor(t) % 8;
      for (let n = 0; n < 8; n++){ const c = 2 + (n % 4) * 7, r = n < 4 ? 2 : 7, on = n === sel;
        if (on) cell(c - 0.5, r - 0.5, '#ffffff', 7, 5);          // กรอบ highlight (ขยับตามเวลา)
        cell(c, r, TILES[n], 6, 4); cell(c, r + 3, '#0e1430', 6, 1); }
      cell(2, 12, '#8fa4ff', 10, 1); cell(16, 12, '#4f5a90', 12, 1);   // แถบล่าง
    };
    const drawOff = t => {
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++){
        const d = c + r * 1.4 - 10 + Math.sin(t * 0.4) * 3; if (d >= 0 && d < 4) cell(c, r, '#1b2233'); else if (d >= 6 && d < 8) cell(c, r, '#151b2a'); }
    };
    const tvBox = (() => { const pts = [F.iso(0, Ry(TVY0), TVZ1), F.iso(0, Ry(TVY1), TVZ1), F.iso(0, Ry(TVY0), 0), F.iso(0, Ry(TVY1), 0), F.iso(Rx(5.3), Ry(TVY0), 0), F.iso(Rx(5.3), Ry(TVY1), 0)];
      const x0 = Math.min(...pts.map(p => p.x)), x1 = Math.max(...pts.map(p => p.x)), y0 = Math.min(...pts.map(p => p.y)), y1 = Math.max(...pts.map(p => p.y));
      return { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) }; })();
    out.push({ id:'f3_tv', kind:'furniture', label:'จอเบิ้ม + PS5', hint:'คลิก: เปลี่ยนโหมด เกม / เมนู / ปิด', state:{ mode:0 }, ...tvBox,
      draw(ctx, t, st){
        const m = st.mode | 0;
        // ตู้วาง + PS5 ใต้จอ (ของตั้งพื้น วาดปกติ → หรี่ตามไฟห้อง)
        Core.isoBox(Rx(0.3), Ry(TVY0 + 0.5), 0, 5, TVY1 - TVY0 - 1, 12, '#8a5a38', '#4a3220', '#6b4a30');
        Core.isoBox(Rx(1.4), Ry(TVY0 + 0.5 + 21), 12, 3, 2.6, 5, '#f2f4fa', '#9aa2b4', '#c4cad6');
        // กรอบจอบาง + พื้นจอ
        Core.quadX(0, Ry(TVY0), Ry(TVY1), TVZ0, TVZ1, '#14141e', Core.PAL.ol);
        Core.emit(() => {
          Core.quadX(0, sy0, sy1, sz0, sz1, m === 0 ? '#5c94fc' : m === 1 ? '#101a40' : '#0a0c12');
          if (m === 0) drawGame(t); else if (m === 1) drawMenu(t); else drawOff(t);
          if (m === 2 && Math.floor(t) % 2 === 0) Core.quadX(0, Ry(TVY0 + 2.4), Ry(TVY0 + 3), TVZ0 + 0.3, TVZ0 + 1.1, '#ff4040');   // ไฟ standby
        });
      },
      onClick(){
        const st = this.state;
        st.mode = ((st.mode|0) + 1) % 3;
        const g = Core.find('f3_gamer');
        if (st.mode === 1){ say('f3_gamer', 'GG!', 1600); Core.log('3F จบเกม → เมนู PS5'); }
        else if (st.mode === 2){ say('f3_gamer', 'เดี๋ยวก่อน รอบสุดท้าย', 2000); Core.log('3F ปิด TV'); }
        else { say('f3_gamer', 'มาเลย รอบใหม่!', 1500); Core.log('3F เริ่มเกมใหม่'); }
        if (g) g.state.hop = Core.t;
      } });

    /* ---------- โซฟาด้านหลัง (โครง + พนักพิง แยก 2 object เพื่อให้คนอยู่ตรงกลางลำดับ) ---------- */
    const S0 = ['#3f7f93','#2f6275','#234c5d'], H0 = ['#5ca3b8','#3f7f93','#2f6275'];
    // SB(u, v, z, du, dv, h): u = ระยะลึกตาม fx จากมุมหลังโซฟา (ชิดจอ → ไกลจอ) · v = ระยะตาม fy · du,dv = ขนาดตาม fx,fy (หน่วย)
    const SB = (u, v, z, du, dv, h, c1, c2, c3) => Core.isoBox(SOFA.fx + Rx(u), SOFA.fy + Ry(v), z, du, dv, h, c1, c2, c3);
    const sbb = F.boxBBox(SOFA.fx, SOFA.fy, 0, SOFA.a, SOFA.b, 14);
    const sofaOrder = sbb.y + sbb.h;
    out.push({ id:'f3_sofa', kind:'furniture', label:'โซฟา', hint:'คลิก: ลองนั่ง', ...sbb, order:sofaOrder,
      draw(){
        SB(0, 0, 0.8, SU, SV, 3.4, S0[0], S0[1], S0[2]);                                         // ฐาน
        SB(0.4, 2.4, 4.2, 6.8, SV-4.8, 1.8, H0[0], H0[1], H0[2]);                                // เบาะนั่ง
        SB(0, 0, 4.2, SU, 2.4, 4.4, S0[0], S0[1], S0[2]);                                        // แขนไกล
        [[0.8,0.8],[0.8,SV-1.6],[SU-1.6,0.8],[SU-1.6,SV-1.6]].forEach(p =>
          SB(p[0], p[1], 0, 0.8, 0.8, 0.8, '#5e3019', '#5e3019', '#5e3019'));
      },
      onClick(){ say('f3_gamer', 'นุ่มจนไม่อยากลุก', 1600); } });
    out.push({ id:'f3_sofaback', kind:'furniture', label:'โซฟา (พนักพิง)', hint:'คลิก: ลองนั่ง',
      ...F.boxBBox(SOFA.fx + Rx(6.8), SOFA.fy, 4, 3.2, SV, 10), order:sofaOrder + 0.4,
      draw(){
        SB(6.8, 0, 4.2, 3.2, SV, 9.4, '#5ca3b8', S0[1], S0[2]);                                  // พนักพิง
        SB(6.8, 0, 13.4, 3.2, SV, 0.8, '#8fc7d6', '#8fc7d6', '#8fc7d6');                         // ขอบบนสว่าง
        SB(0, SV-2.4, 4.2, SU, 2.4, 4.4, S0[0], S0[1], S0[2]);                                   // แขนใกล้
        SB(7.4, 2.6, 13.0, 1.6, 4.4, 2.2, '#ffd37a', '#c99a45', '#8a6a2a');                      // หมอนอิง
      },
      onClick(){ say('f3_gamer', 'นุ่มจนไม่อยากลุก', 1600); } });

    /* ---------- คนเล่นบนโซฟา / บีนแบ็ก ---------- */
    const gs = spr('gamer_sofa');
    const gamer = { id:'f3_gamer', kind:'character', label:'เกมเมอร์ (PS5)', hint:'คลิก: ทัก', x:0, y:0, w:14, h:16,
      state:{ where:'sofa', until:0, hop:-9, nextSay:6 },
      draw(ctx, t, st){
        if (st.where === 'bean' && t > st.until){ st.where = 'sofa'; st.hop = t; }
        let fx = SEAT.fx, fy = SEAT.fy, fz = SEAT.fz;
        if (st.where === 'bean'){ fx = BEAN.fx - Rx(2.75); fy = BEAN.fy - Ry(2.75); fz = 9; }
        const k = (t - st.hop) / 0.4; if (k >= 0 && k < 1) fz += 7*Math.sin(Math.PI*k);          // กระโดดตอนย้ายที่/ตอบสนอง
        const tv = Core.find('f3_tv'), m = tv ? tv.state.mode : 0;
        const fr = (m === 0 && !(k >= 0 && k < 1)) ? Core.anim(2, 5) : 0;                         // กดปุ่มรัว ๆ ตอนเกมเดิน
        Object.assign(this, tbox(Core.iso, gs, fx, fy, fz, false));
        this.order = (st.where === 'bean' ? BEAN.y0 : sofaOrder) + 0.2;
        Core.drawSprite(gs, fx, fy, fr, false, fz);
        if (t > st.nextSay){ st.nextSay = t + 16 + (Math.sin(t*12.9)+1)*6;
          if (m === 0) say(this.id, ['ฮึบ!','อีกนิด…','ตายอีกแล้ว','ผ่านด่านแล้ว!'][Math.floor(t*7) % 4], 1400); }
      },
      onClick(){ say(this.id, this.state.where === 'bean' ? 'อย่ากวนน ดูหนังอยู่' : 'อย่ากวน กำลังจะชนะ', 1600); this.state.hop = Core.t; } };
    out.push(gamer);

    /* ---------- บีนแบ็ก ---------- */
    const bean = item(F, { id:'f3_bean', sp:'beanbag', fx:BEAN.fx, fy:BEAN.fy, label:'บีนแบ็ก', hint:'คลิก: เกมเมอร์ย้ายมานั่ง',
      click(){
        const g = Core.find('f3_gamer'); if (!g) return;
        if (g.state.where === 'bean'){ say('f3_bean', 'นั่งสบายสุด ๆ', 1400); return; }
        g.state.where = 'bean'; g.state.until = Core.t + 9; g.state.hop = Core.t;
        say('f3_gamer', 'ขอนอนเล่นแป๊บ', 1600); Core.log('3F เกมเมอร์ย้ายไปนั่งบีนแบ็ก');
      } });
    BEAN.y0 = bean.y + bean.h;                                       // ใช้เป็น order ของคนที่นั่งบีนแบ็ก
    out.push(bean);

    /* ---------- ตู้ arcade 2 ตู้ + คนเล่น ---------- */
    function cab(id, sp, CP, label, line){
      return item(F, { id, sp, fx:CP.fx, fy:CP.fy, flip:true, label, hint:'คลิก: เล่น!',
        frame(t, st){ return (st.burst && t < st.burst) ? Core.anim(2, 14) : Core.anim(2, 1.6, CP.fx*9); },
        post(ctx, t, st){
          glowScreen(spr(sp), CP.fx, CP.fy, 0, this._fr, true, [ARC_SCREEN, ARC_MARQ]);
          if (st.burst && t < st.burst){                               // ประกายตอนทำ high score
            const p = Core.iso(CP.fx - Rx(4), CP.fy + Ry(2), 30), n = Math.floor(t*12);
            Core.emit(() => { for (let i = 0; i < 5; i++){ const a = i*1.26 + n*0.7, r = 5 + (n+i)%4*2;
              Core.px(Math.round(p.x + Math.cos(a)*r*1.6), Math.round(p.y + Math.sin(a)*r), i%2 ? '#ffd37a' : '#ffffff'); } });
          }
        },
        click(st){ st.burst = Core.t + 1.3; say(id, 'HIGH SCORE!', 1500); Core.log('3F ' + line + ' ทำ HIGH SCORE'); } });
    }
    const ca = cab('f3_arcA', 'arcade_cabinet_a', CABA, 'ตู้ Arcade (Invaders)', 'ตู้ A');
    const cb = cab('f3_arcB', 'arcade_cabinet_b', CABB, 'ตู้ Arcade (Pac)', 'ตู้ B');
    out.push(ca, cb);
    const pl = spr('gamer_arcade'), plP = PLAYER;
    out.push({ id:'f3_player', kind:'character', label:'เกมเมอร์ (Arcade)', hint:'คลิก: ทัก', ...tbox(F.iso, pl, plP.fx, plP.fy, 0, true),
      order: cb.y + cb.h + 6,
      draw(ctx, t, st){
        const fr = (cb.state.burst && t < cb.state.burst) ? Core.anim(2, 10) : Core.anim(2, 3);
        Core.drawSprite(pl, plP.fx, plP.fy, fr, true, 0);
      },
      onClick(){ say(this.id, 'ห้ามกวน กำลังจะทำลายสถิติ', 1700); cb.state.burst = Core.t + 1.3; } });

    /* ---------- โต๊ะปิงปอง + ลูกเด้ง 3 วิ ---------- */
    out.push(item(F, { id:'f3_pingpong', sp:'pingpong_table', fx:TABLE.fx, fy:TABLE.fy, label:'โต๊ะปิงปอง', hint:'คลิก: ตีเล่น 3 วิ',
      post(ctx, t, st){
        if (!(st.ball && t < st.ball)) return;
        const e = 3 - (st.ball - t);                                   // วินาทีที่ผ่านไป
        const per = 0.62, ph = (e % per) / per, dir = Math.floor(e / per) % 2;
        const v = dir ? 17 - ph*14.5 : 2.5 + ph*14.5;                  // วิ่งตามแกนยาวของโต๊ะ (หน่วย)
        const u = 5.5 + 2.2*Math.sin(e*3.1);
        const z = 10.2 + 9*Math.sin(Math.PI*ph);                       // ส่วนโค้งของลูก
        const fy = TABLE.fy - Ry(v), fx = TABLE.fx - Rx(u);          // ไม่ flip → แกนยาว = fy
        const g = Core.iso(fx, fy, 9.6), b = Core.iso(fx, fy, z);
        Core.rect(g.x - 1, g.y, 2, 1, '#1b3b68');                      // เงาบนโต๊ะ
        const bx = Math.round(b.x), by = Math.round(b.y) - 1, ol = Core.PAL.ol;
        Core.rect(bx - 1, by - 2, 3, 1, ol); Core.rect(bx - 1, by + 2, 3, 1, ol); Core.rect(bx - 2, by - 1, 1, 3, ol); Core.rect(bx + 2, by - 1, 1, 3, ol);
        Core.rect(bx - 1, by - 1, 3, 3, '#ffffff'); Core.px(bx - 1, by - 1, '#ffd37a');
      },
      click(st){ st.ball = Core.t + 3; say('f3_pingpong', 'ตึก ตึก ตึก', 1300); Core.log('3F เล่นปิงปอง'); } }));

    /* ---------- ตู้เย็น / ชั้นขนม / sofa_l / ต้นไม้ ---------- */
    out.push(item(F, { id:'f3_fridge', sp:'mini_fridge', fx:FRIDGE.fx, fy:FRIDGE.fy, flip:true, label:'ตู้เย็นมินิ', hint:'คลิก: เปิดดู',
      click(){ say('f3_fridge', 'เหลือชาเขียว 2 ขวด', 1800); Core.log('3F เปิดตู้เย็น'); } }));
    out.push(item(F, { id:'f3_snack', sp:'snack_shelf', fx:SNACK.fx, fy:SNACK.fy, flip:true, label:'ชั้นขนม', hint:'คลิก: หยิบขนม',
      click(){ say('f3_snack', ['ป๊อกกี้หมดแล้ว','มีมันฝรั่งเหลือ','ขนมปลาหมึก 1 ห่อ'][Math.floor(Core.t) % 3], 1600); } }));
    out.push(item(F, { id:'f3_sofal', sp:'sofa_l', fx:SOFAL.fx, fy:SOFAL.fy, label:'โซฟารับแขก', hint:'คลิก: นั่งพัก',
      click(){ say('f3_sofal', 'พักสายตาแป๊บ…', 1500); } }));
    out.push(item(F, { id:'f3_plant', sp:'plant_big', fx:PLANT.fx, fy:PLANT.fy, label:'ต้นไม้', hint:'คลิก: รดน้ำ',
      click(){ say('f3_plant', 'ใบเขียวสดชื่น', 1400); } }));

    /* ---------- สวิตช์ไฟผนังซ้าย(ยาว) (ปิดไฟ = ดูแสงจอเด่น) ---------- */
    const sw = F.boxBBox(0, SW_Y, 34, 1, 5, 8);
    out.push({ id:'f3_switch', kind:'light', label:'สวิตช์ไฟห้อง', hint:'คลิก: เปิด/ปิดไฟ', ...sw, order:sw.y + sw.h + 200,   // สูงไว้ให้คลิกชนะ bbox ของจอเบิ้มที่คลุมทับ (สวิตช์อยู่ผนังไกลสุด ไม่มีอะไรบังหน้า)
     
      draw(){
        Core.quadX(0.002, SW_Y, SW_Y + Ry(5), 34, 42, '#eae0d0', Core.PAL.ol);
        Core.quadX(0.002, SW_Y + Ry(1.6), SW_Y + Ry(3.4), 36.5, 40, Core.lights[3] ? '#ffd37a' : '#6a6a80');
      },
      onClick(){ Core.lights[3] = !Core.lights[3]; say('f3_switch', Core.lights[3] ? 'ไฟเปิด' : 'ไฟปิด', 1100); Core.log('3F ไฟ ' + (Core.lights[3] ? 'ON' : 'OFF')); } });

    return out;
  }
};
})();
