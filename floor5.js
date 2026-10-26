/* =============================================================================
 * floor5.js — 5F Izakaya ดาดฟ้า (屋上居酒屋)   เจ้าของไฟล์: Opus   · รอบ 4: แกนสลับ 40 x 80 + เคาน์เตอร์ตัว U
 * เปิดโล่ง ไม่มีหลังคา: ผนังกันตกเตี้ย 16 px (shell.open ของ core) + ราวเหล็กด้านหน้า
 * โครงไม้ตามแนวผนังหลัง 2 ด้าน (เสา 3 ต้น + คานบน) ไว้แขวนโคมแดง + ป้ายไม้ やきとり
 *
 * ผัง (รอบ 4: fx = ผนังสั้น 40 หน่วย · fy = ผนังยาว 80 หน่วย · คน = 2 เท่า (Core.PEOPLE_SCALE))
 *   เคาน์เตอร์ U (หน่วย x = fx*40, y = fy*80):
 *     ขา A  x 9-14,  y 22-60   (ฝั่งผนังยาว)        ขา B  x 26-31, y 22-60   (ฝั่งหน้า-ขวา)
 *     ฐาน U x 9-31,  y 60-66   (ปิดด้านหน้า-ซ้าย)    ปากตัว U เปิดไปทางผนังสั้น (y < 22) = ทางเข้าของเชฟ
 *   กลาง U: เชฟ (20,32) หลังเตาย่าง x 16-24 y 38-44
 *   ลูกค้านั่ง "นอก" ตัว U หันหน้าเข้าหาเชฟ: ขา A x 4.5 (fy .40/.625) · ขา B x 35.5 (fy .40/.625) · ฐาน U (fx .5, fy .90)
 *   ผนังยาว (ซ้าย): โคม 4 ดวง fy .14-.68 + ป้ายแดง 居酒屋 fy .84 · ผนังสั้น (ขวา): ป้ายไม้ やきとり + ชั้นขวด + ถังเบียร์มุมขวา-หลัง
 *   มุมซ้าย-หน้า: ถังสาเก 菰樽 (มองผ่านกระจกลิฟต์)
 *   ลำดับวาด: ทุกชิ้นของ U ใช้ order = ความลึก (x+y) เอง เพราะกล่องยาว sort ด้วย bbox ไม่ได้
 * เวลา:  เช้า = เชฟเตรียมของ โคมดับ ไม่มีลูกค้า · เย็น = ลูกค้า 3 · คืน = ลูกค้า 5 + หิมะเกาะราว/คาน
 * ========================================================================== */
(function(){
'use strict';
const P = window.SPR_PEOPLE || {}, I = window.SPR_ITEMS || {};
const UXn = () => Core.UX || 40, UYn = () => Core.UY || 80;
const ux = n => n / UXn(), uy = n => n / UYn();                  // หน่วย → สัดส่วน ตาม fx / fy
const RAIL_Z = 74;                       // ความสูงคานไม้ (px จากพื้นดาดฟ้า)
const PARAPET = 16;                      // = shell.wallH
const WOOD = '#6e3b22', WOOD_L = '#8a4b2a', WOOD_D = '#4a2616';
const CH = 13;                           // ความสูงเคาน์เตอร์ (px)

function darkVariant(spr, k){
  if (!spr || !spr.pal) return spr;
  const pal = {}; for (const c in spr.pal) pal[c] = Core.mix(spr.pal[c], '#1a1020', k);
  return Object.assign({}, spr, {pal});
}
const LANT = I.lantern_red, LANT_OFF = darkVariant(LANT, .55);
const night = () => Core.time.phase === 'night';
const morning = () => Core.time.phase === 'morning';
const sp = (spr) => spr && spr.frames ? spr : null;

/* ชิ้นเคาน์เตอร์ (หน่วย): [x, y, a, b] */
const SEG = { A:[9,22,5,38], B:[26,22,5,38], BASE:[9,60,22,6] };
const GR = [16, 38, 8, 6];               // โต๊ะเตาย่างกลาง U
const CHEF_P = [20, 32];

window.FLOORS = window.FLOORS || {};
window.FLOORS[5] = {
  name:'Izakaya ดาดฟ้า', nameJP:'屋上居酒屋',
  desc:'เปิดโล่งไม่มีหลังคา · เคาน์เตอร์ตัว U ล้อมเชฟย่าง ลูกค้า 5 ที่นั่งรอบ · โคมแดง ป้าย 居酒屋 · เห็นฟูจิ + พลุปีใหม่',
  shell:{ wallL:'#4a4560', wallR:'#5a5470', floor:'deck', floorC:'#8a5a3a', floorC2:'#6e4630', trim:'#33304a', wallH:PARAPET, open:true },

  ambient(ctx, t){
    if (morning()) return;
    const fl = (night() ? .24 : .17) + .03*Math.sin(t*7);
    Core.pool(ux(20), uy(41), 30, 14, '#ffb04a', fl);              // เตาย่างกลาง U
    const lan = Core.find('f5_lanterns');
    if (lan) for (const L of lan.list) if (L.on) Core.pool(0.10, L.f, 16, 8, '#ff5a3a', night() ? .2 : .15);
  },

  build(F){
    const objs = [];
    const base = F.iso(0, 0, 0).y;
    const ord = (x, y) => base + x + y;                            // ความลึก (หน่วย) → order (px บนจอ)

    /* ---------- โครงไม้: เสา 3 ต้น + คานบน 2 แนว ---------- */
    objs.push({ id:'f5_frame', kind:'decor', label:'โครงไม้แขวนโคม', order:-1000, x:0, y:0, w:0, h:0,
      draw(){
        Core.isoBox(ux(-2), 0, RAIL_Z, 2, UYn(), 3, WOOD_L, WOOD, WOOD_D);            // คานผนังยาว (ซ้าย)
        Core.isoBox(0, uy(-2), RAIL_Z, UXn(), 2, 3, WOOD_L, WOOD, WOOD_D);            // คานผนังสั้น (ขวา)
        for (const [fx,fy] of [[ux(-2),uy(-2)], [ux(-2),1-uy(2)], [1-ux(2),uy(-2)]])
          Core.isoBox(fx, fy, 0, 2, 2, RAIL_Z+3, WOOD_L, WOOD, WOOD_D);
        if (Core.snow && night()){
          const k = Math.min(1, .4 + Core.time.t), S = Core.PAL.snow;
          Core.quadZ(RAIL_Z+3.5, ux(-2), 0, 0, 1, S); Core.quadZ(RAIL_Z+3.5, 0, 1, uy(-2), 0, S);
          Core.quadZ(PARAPET+0.5, ux(-3), 0, uy(-3), 1, S); Core.quadZ(PARAPET+0.5, 0, 1, uy(-3), 0, S);
          const r = Core.rng(55);
          for (let i = 0; i < 34*k; i++){
            const a = r(), p = r() < .6 ? Core.iso(ux(-1.5), a, PARAPET+1) : Core.iso(a, uy(-1.5), PARAPET+1);
            Core.rect(p.x-1, p.y-1, 3, 1, S);
          }
        }
      }
    });

    /* ---------- ป้ายไม้ やきとり แขวนคานผนังสั้น ---------- */
    const KB = [0.14, 0.86], KBY = uy(-1), KZ1 = RAIL_Z, KZ0 = RAIL_Z - 15;
    objs.push({ id:'f5_kanban', kind:'sign', label:'ป้ายไม้ やきとり', hint:'คลิก: อ่านป้าย', order:-950,
      ...F.boxBBox(KB[0], KBY, KZ0, (KB[1]-KB[0])*UXn(), 1, KZ1-KZ0),
      draw(){
        for (const f of [KB[0]+0.04, KB[1]-0.04]){ const a = Core.iso(f, KBY, KZ1), b = Core.iso(f, KBY, KZ1-3); Core.rect(a.x, a.y, 1, b.y-a.y+1, '#2a160e'); }
        Core.quadY(KBY, KB[0], KB[1], KZ0, KZ1-3, '#3a2216', '#140b10');
        Core.quadY(KBY+0.001, KB[0]+0.02, KB[1]-0.02, KZ0+1, KZ0+2, '#5a3422');
        const p = Core.iso(KB[0]+0.07, KBY, KZ1-5);
        const run = () => Core.textJP('やきとり', 11, p.x+1, p.y, morning() ? '#eae0d0' : '#ffd37a', 1);
        morning() ? run() : Core.emit(run);
      },
      onClick(){ Core.bubble(this.id, 'やきとり · 炭火焼き', 1300); }
    });

    /* ---------- โคมแดง ใต้คานผนังยาว (คลิก = เปิด/ปิด) ---------- */
    const lanterns = { id:'f5_lanterns', kind:'decor', label:'โคมแดง', order:-900, x:0, y:0, w:0, h:0,
      list: [.14, .32, .50, .68].map((f,i) => ({i, f, on:true})), draw(){} };
    objs.push(lanterns);
    for (const L of lanterns.list){
      const top = F.iso(ux(-1), L.f, RAIL_Z), h = LANT ? LANT.h : 29;
      const bx = top.x, by = top.y + h;
      objs.push({ id:'f5_lantern'+L.i, kind:'light', label:'โคมแดง (ちょうちん)', hint:'คลิก: เปิด/ปิดโคม', order:-800+L.i,
        x: bx-9, y: top.y, w: 18, h: h, ax: bx, ay: top.y+8,
        draw(ctx, t){
          const lit = !morning() && L.on, fr = Core.anim(2, 1.4, L.i*.37);
          if (lit) Core.emit(() => {
            const g = ctx.globalAlpha; ctx.globalAlpha = .13 + .03*Math.sin(t*3+L.i);
            Core.ellipse(bx, by-14, 13, 14, '#ff5a3a'); ctx.globalAlpha = .22;
            Core.ellipse(bx, by-14, 8, 9, '#ffb04a'); ctx.globalAlpha = g;
            Core.drawSprite(ctx, LANT, bx, by, fr, false);
          });
          else Core.drawSprite(ctx, morning() ? LANT : LANT_OFF, bx, by, fr, false);
        },
        onClick(){
          if (morning()){ Core.bubble(this.id, 'ยังไม่เปิดร้าน (เช้า)', 1200); return; }
          L.on = !L.on; Core.lights[5] = lanterns.list.some(q => q.on);
          Core.bubble(this.id, L.on ? 'ちょうちん ON' : '…off', 900); Core.log('5F โคม '+(L.i+1)+' '+(L.on ? 'ON' : 'OFF'));
        }
      });
    }

    /* ---------- ป้ายแดง 居酒屋 (ผนังยาว ปลายหน้า — เด่นสุด) ---------- */
    const BAN = I.banner_red, banF = [ux(1), 0.84], banZ = 14;
    objs.push({ id:'f5_banner', kind:'sign', label:'ป้ายแดง 居酒屋', hint:'คลิก: ป้ายพลิ้ว',
      ...F.spriteBBox(BAN, banF[0], banF[1], banZ), order:-700,
      draw(ctx, t, st){
        const burst = st.until && Core.t < st.until, fr = burst ? Core.anim(2, 8) : Core.anim(2, 1.1);
        if (!morning()) Core.emit(() => { const p = Core.iso(banF[0], banF[1], banZ), g = ctx.globalAlpha; ctx.globalAlpha = .12; Core.ellipse(p.x, p.y-18, 14, 20, '#ff5a3a'); ctx.globalAlpha = g; });
        const run = () => Core.drawSprite(BAN, banF[0], banF[1], fr, false, banZ);
        morning() ? run() : Core.emit(run);
      },
      onClick(){ this.state.until = Core.t + 1.6; Core.bubble(this.id, '居酒屋 営業中!', 1400); Core.log('ป้ายแดงพลิ้ว'); }
    });

    /* ---------- ชั้นขวด (ชิดผนังสั้น → flip) ---------- */
    const SHELF = I.bottle_shelf, shF = [0.40, uy(6)];
    objs.push({ id:'f5_shelf', kind:'furniture', label:'ชั้นขวดสาเก/วิสกี้', hint:'คลิก: ดูขวด',
      ...F.spriteBBox(SHELF, shF[0], shF[1]), order: ord(16, 5),
      draw(){ Core.drawSprite(SHELF, shF[0], shF[1], 0, true); },
      onClick(){ Core.bubble(this.id, ['獺祭','響 Hibiki','山崎','焼酎'][Math.floor(Core.t)%4], 1300); }
    });

    /* ---------- ถังเบียร์ 2 ใบ (มุมขวา-หลัง) ---------- */
    const KEG = I.beer_keg;
    [[0.86,0.06],[0.92,0.15]].forEach(([fx,fy],i) => {
      objs.push({ id:'f5_keg'+i, kind:'item', label:'ถังเบียร์', hint:'คลิก: ดูยี่ห้อ',
        ...F.spriteBBox(KEG, fx, fy),
        draw(){ Core.drawSprite(KEG, fx, fy, 0, i === 1); },
        onClick(){ Core.bubble(this.id, '🍺 Asahi', 1200); }
      });
    });

    /* ---------- กระถางต้นไม้ (มุมหลัง) ---------- */
    if (sp(I.plant_small)) objs.push({ id:'f5_plant', kind:'decor', label:'ต้นไม้', ...F.spriteBBox(I.plant_small, 0.10, 0.07),
      draw(){ Core.drawSprite(I.plant_small, 0.10, 0.07, 0, false); } });

    /* ---------- เคาน์เตอร์ตัว U (3 ชิ้น) ---------- */
    function counterSeg(x, y, a, b){
      const fx = ux(x), fy = uy(y), fyF = uy(y+b) + 0.002, fxR = ux(x+a) + 0.002;
      Core.isoBox(fx, fy, 0, a, b, CH, '#6e3b22', '#7a4428', '#4a2616');
      for (let k = x + 1.5; k < x + a - 1; k += 3) Core.quadY(fyF, ux(k), ux(k+1), 1.5, CH-2, '#5a2e1c');   // ซี่ koushi หน้าซ้าย
      for (let k = y + 1.5; k < y + b - 1; k += 3) Core.quadX(fxR, uy(k), uy(k+1), 1.5, CH-2, '#3a1e12');   // ซี่ koushi หน้าขวา
      Core.quadY(fyF, fx, ux(x+a), 0, 1.2, '#2a160e'); Core.quadX(fxR, fy, uy(y+b), 0, 1.2, '#1c0e08');
      Core.isoBox(ux(x-0.8), uy(y-0.8), CH, a+1.6, b+1.6, 2, '#c8834a', '#9a5a32', '#6e3b22');              // ท็อปไม้ยื่น
      Core.quadY(uy(y+b+0.8)+0.002, ux(x-0.8), ux(x+a+0.8), CH+1.2, CH+2, '#ffd37a');
    }
    function drinks(list){
      for (const [x, y, kind] of list){
        const p = Core.iso(ux(x), uy(y), CH+2);
        if (kind === 'beer'){ Core.orect(p.x-1, p.y-5, 4, 5, '#ffd37a', '#140b10'); Core.rect(p.x, p.y-5, 2, 1, '#f6f8fc'); }
        else if (kind === 'sake'){ Core.orect(p.x-1, p.y-7, 3, 7, '#eae0d0', '#140b10'); Core.px(p.x, p.y-4, '#4fc1c6'); Core.orect(p.x+3, p.y-2, 2, 2, '#eae0d0', '#140b10'); }
        else { Core.rect(p.x-3, p.y-1, 7, 1, '#eae0d0'); Core.rect(p.x-2, p.y-2, 5, 1, '#b5703c'); Core.px(p.x+2, p.y-3, '#d8363a'); }
      }
    }
    const MENU = ['ねぎま ¥180','つくね ¥200','生ビール ¥500','熱燗 ¥450'];
    const segObj = (id, s, order, items) => ({ id, kind:'furniture', label:'เคาน์เตอร์ตัว U', hint:'คลิก: สั่งอาหาร', order,
      ...F.boxBBox(ux(s[0]-0.8), uy(s[1]-0.8), 0, s[2]+1.6, s[3]+1.6, CH+2),
      draw(){ counterSeg(...s); drinks(items); },
      onClick(){ Core.bubble(this.id, MENU[Math.floor(Core.t*3)%4], 1300); } });
    objs.push(segObj('f5_counterA', SEG.A, ord(9, 41), [[11.5,30,'beer'],[11.5,36,'plate'],[11.5,48,'sake'],[11.5,54,'plate']]));
    objs.push(segObj('f5_counterB', SEG.B, ord(28, 46), [[28.5,30,'sake'],[28.5,36,'plate'],[28.5,48,'beer'],[28.5,54,'plate']]));
    objs.push(segObj('f5_counterU', SEG.BASE, ord(28, 50), [[17,63,'plate'],[22,63,'beer']]));

    /* ---------- เชฟย่าง (กลาง U) ---------- */
    const CHEF = P.chef_grill, chF = [ux(CHEF_P[0]), uy(CHEF_P[1])];
    objs.push({ id:'f5_chef', kind:'character', label:'เชฟย่าง (大将)', hint:'คลิก: ทัก',
      ...F.spriteBBox(CHEF, chF[0], chF[1]), order: ord(...CHEF_P),
      draw(){ Core.drawSprite(CHEF, chF[0], chF[1], morning() ? Core.anim(2, .8) : Core.anim(2, 3.5), false); },
      onClick(){ Core.bubble(this.id, morning() ? '仕込み中… (เตรียมของ)' : '焼き鳥 いかが?', 1600); Core.log('เชฟ: 焼き鳥 いかが?'); }
    });

    /* ---------- เตาย่างกลาง U ---------- */
    const grill = { id:'f5_grill', kind:'furniture', label:'เตาย่างถ่าน', hint:'คลิก: พลิกไม้', order: ord(GR[0]+GR[2], GR[1]),
      ...F.boxBBox(ux(GR[0]), uy(GR[1]), 0, GR[2], GR[3], 18),
      draw(ctx, t){
        const [x, y, a, b] = GR, gz = 12, on = !morning();
        Core.isoBox(ux(x), uy(y), 0, a, b, gz, '#4a4a5a', '#3a3a4a', '#2b2b38');
        Core.isoBox(ux(x+0.5), uy(y+0.5), gz, a-1, b-1, 4, '#3a3a4a', '#2b2238', '#1c1c28');
        const coal = () => { for (let i = 0; i < 12; i++){ const p = Core.iso(ux(x+1+(i%6)*1.1), uy(y+1.5+Math.floor(i/6)*2), gz+4.2); Core.px(p.x, p.y, (i + Math.floor(t*4)) % 3 ? '#ff7a2a' : '#ffd37a'); } };
        on ? Core.emit(coal) : coal();
        for (let i = 0; i < 4; i++){                                   // ไม้เสียบไก่
          const p0 = Core.iso(ux(x+1.2+i*1.8), uy(y), gz+5), p1 = Core.iso(ux(x+1.2+i*1.8), uy(y+b), gz+5);
          Core.line(p0.x, p0.y, p1.x, p1.y, '#eae0d0');
          const m = Core.iso(ux(x+1.2+i*1.8), uy(y+b/2), gz+5); Core.rect(m.x-1, m.y-1, 3, 2, i % 2 ? '#b5703c' : '#8a4b2a');
        }
      },
      onClick(){ Core.bubble(this.id, 'じゅ〜っ 🔥', 1000); }
    };
    objs.push(grill);
    const SMK = I.grill_smoke;
    objs.push({ id:'f5_smoke', kind:'fx', label:'ควันย่าง', order: grill.order + 0.5, x:0, y:0, w:0, h:0,
      draw(ctx, t){
        if (!SMK) return;
        const a = Core.iso(ux(GR[0]+GR[2]/2), uy(GR[1]+GR[3]/2), 22), g = ctx.globalAlpha;
        Core.emit(() => {
          for (let k = 0; k < 2; k++){
            const ph = ((t*.55) + k*.5) % 1;
            ctx.globalAlpha = (morning() ? .35 : .7) * (1 - ph) * Math.min(1, ph*5);
            Core.drawSprite(ctx, SMK, a.x - 2 + k*5 + Math.round(Math.sin(t*1.3+k)*1.5), a.y - Math.round(ph*18), Core.anim(3, 4, k), k === 1);
          }
        });
        ctx.globalAlpha = g;
      }
    });

    /* ---------- ลูกค้า 5 ที่ นอกตัว U หันหน้าเข้าหาเชฟ (เก้าอี้บาร์สูง 16 px → ตักพอดีเบาะเมื่อคน 2 เท่า) ---------- */
    const pats = [
      { id:'f5_patron_a', spr:P.patron_a,      u:[4.5, 32], flip:false, need:'evening', say:['乾杯!','อีกแก้ว!','うまい!'] },
      { id:'f5_patron_b', spr:P.patron_b,      u:[4.5, 50], flip:false, need:'night',   say:['もう一杯!','乾杯!','ฟูจิสวยมาก'] },
      { id:'f5_patron_c', spr:P.patron_cheers, u:[35.5, 32], flip:true, need:'evening', say:['乾杯!!','かんぱーい!','พลุสวย!'] },
      { id:'f5_patron_d', spr:P.patron_a,      u:[35.5, 50], flip:true, need:'night',   say:['หนาวแต่ฟิน','熱燗ください','あけおめ!'] },
      { id:'f5_patron_e', spr:P.patron_b,      u:[20, 71.5], flip:false, need:'evening', say:['ลังนี้นั่งสบาย','乾杯!','ことよろ!'] }
    ];
    const present = q => !morning() && (q.need === 'evening' || night());
    const SEAT = 15;
    function barStool(fx, fy){
      Core.isoBox(fx - ux(0.6), fy - uy(0.6), 0, 1.2, 1.2, SEAT, '#4a4a60', '#3a3a4e', '#2b2b38');
      Core.isoBox(fx - ux(2.2), fy - uy(2.2), 0, 4.4, 4.4, 1, '#3a3a4e', '#2b2b38', '#1c1c28');
      Core.isoBox(fx - ux(2), fy - uy(2), SEAT, 4, 4, 2, '#d8363a', '#a82b2f', '#7d1f24');
    }
    for (const q of pats){
      const fx = ux(q.u[0]), fy = uy(q.u[1]);
      const bb = F.spriteBBox(q.spr, fx, fy, 0), sb = F.boxBBox(fx - ux(2.2), fy - uy(2.2), 0, 4.4, 4.4, SEAT + 2);
      const x0 = Math.min(bb.x, sb.x), y0 = Math.min(bb.y, sb.y);
      const insideU = q.u[0] < SEG.A[0];                                             // ฝั่งขา A: อยู่หลังเคาน์เตอร์
      objs.push({ id:q.id, kind:'character', label:'ลูกค้า', hint:'คลิก: ชนแก้ว',
        x:x0, y:y0, w:Math.max(bb.x+bb.w, sb.x+sb.w)-x0, h:Math.max(bb.y+bb.h, sb.y+sb.h)-y0, ax: bb.x + bb.w/2, ay: bb.y,
        order: insideU ? ord(0, 30) + pats.indexOf(q) : ord(40, 62) + pats.indexOf(q),   // ฝั่ง A: ก่อนขา A (เคาน์เตอร์บังขา) · ฝั่ง B/ฐาน: หลังทุกชิ้น
        draw(ctx, t, st){
          barStool(fx, fy);
          if (!present(q)) return;
          const cheer = st.until && Core.t < st.until;
          const fr = cheer ? (q.spr === P.patron_cheers ? Core.anim(2, 6) : 1) : Core.anim(2, .7, q.u[1]*.3);
          Core.drawSprite(q.spr, fx, fy, fr, q.flip, 1);
        },
        onClick(){
          if (!present(q)){ Core.bubble(this.id, morning() ? 'ร้านยังไม่เปิด' : 'ที่ว่าง…', 1000); return; }
          this.state.until = Core.t + 1.6; this.state.n = (this.state.n || 0) + 1;
          const s = q.say[this.state.n % q.say.length];
          Core.bubble(this.id, s, 1500); Core.log('5F ลูกค้า: '+s);
        }
      });
    }

    /* ---------- ถังสาเกห่อฟาง (菰樽) มุมซ้าย-หน้า ---------- */
    objs.push({ id:'f5_komodaru', kind:'decor', label:'ถังสาเก (菰樽)', hint:'คลิก: ดู',
      ...F.boxBBox(0.04, 0.80, 0, 8, 14, 26),
      draw(){
        const barrel = (fx, fy, fz) => {
          const p = Core.iso(fx, fy, fz), x = p.x, y = p.y;
          Core.rect(x-7, y-13, 15, 12, '#140b10'); Core.ellipse(x, y-1, 7, 3, '#140b10');
          Core.rect(x-6, y-13, 13, 12, '#e8d8b0'); Core.ellipse(x, y-1, 6, 2, '#e8d8b0');
          Core.rect(x+2, y-13, 4, 12, '#c9b98e'); Core.ellipse(x+3, y-1, 3, 1, '#c9b98e');
          Core.rect(x-6, y-11, 13, 1, '#d8363a'); Core.rect(x-6, y-4, 13, 1, '#d8363a');
          Core.ellipse(x, y-13, 6, 2, '#b5a07a'); Core.ellipse(x, y-13, 4, 1, '#8a6a4a');
          Core.textJP('酒', 8, x-4, y-10, '#140b10');
        };
        barrel(0.12, 0.84, 0); barrel(0.14, 0.95, 0); barrel(0.13, 0.895, 13);
      },
      onClick(){ Core.bubble(this.id, '菰樽 · 鏡開き!', 1300); }
    });

    /* ---------- กองหิมะ (กลางคืน + หิมะเปิด) ---------- */
    const PILE = I.snow_pile;
    [[0.94,0.30]].forEach(([fx,fy],i) => {
      if (sp(PILE)) objs.push({ id:'f5_snowpile'+i, kind:'decor', label:'กองหิมะ', ...F.spriteBBox(PILE, fx, fy),
        draw(){ if (Core.snow && night() && Core.time.t > .15*i) Core.drawSprite(PILE, fx, fy, 0, i === 1); } });
    });

    /* ---------- โต๊ะร่มดาดฟ้า (ตามภาพ 6) มุมหน้า-ขวา ---------- */
    const UMB = [ux(32), uy(70.5)];
    objs.push({ id:'f5_umbrella', kind:'furniture', label:'โต๊ะร่ม', hint:'คลิก: กางร่ม', order: ord(40, 62) + 20,
      ...F.boxBBox(UMB[0]-ux(7), UMB[1]-uy(7), 0, 14, 14, 48),
      draw(ctx, t, st){
        const [fx, fy] = UMB, b = Core.iso(fx, fy, 0), top = Core.iso(fx, fy, 13), ap = Core.iso(fx, fy, 47), rim = Core.iso(fx, fy, 39);
        Core.rect(b.x - 1, top.y, 3, b.y - top.y, '#140b10'); Core.rect(b.x, top.y, 1, b.y - top.y - 1, '#8a8aa0');
        Core.ellipse(b.x, b.y, 5, 2, '#140b10'); Core.ellipse(top.x, top.y, 7, 3, '#140b10'); Core.ellipse(top.x, top.y, 6, 2, '#eae0d0');
        Core.orect(top.x - 4, top.y - 5, 3, 4, '#ffd37a'); Core.orect(top.x + 2, top.y - 6, 3, 5, '#eae0d0'); Core.px(top.x + 3, top.y - 4, '#4fc1c6');
        Core.rect(ap.x, ap.y, 1, top.y - ap.y, '#4a4a60');
        const open = !(st.until && Core.t < st.until), R = open ? 15 : 6, N = 8;
        const pts = []; for (let i = 0; i < N; i++){ const a = i/N*Math.PI*2 + .2; pts.push([rim.x + Math.round(Math.cos(a)*R), rim.y + Math.round(Math.sin(a)*R*.5) + (open ? 0 : 6)]); }
        for (let i = 0; i < N; i++) Core.fillPoly([[ap.x, ap.y], pts[i], pts[(i + 1) % N]], i % 2 ? '#f4ead8' : '#c8303a');
        Core.polyOutline(pts, '#140b10'); Core.px(ap.x, ap.y - 1, '#ffd37a');
        if (Core.snow && night()) Core.rect(ap.x - 4, ap.y + 1, 9, 1, Core.PAL.snow);
      },
      onClick(){ this.state.until = Core.t + 1.2; Core.bubble(this.id, 'パラソル 🌂', 1000); }
    });

    /* ---------- ไฟประดับสาย (string lights) จากเสาโครงไม้ → เสามุมหน้า (ตามภาพ 6) ---------- */
    objs.push({ id:'f5_stringlights', kind:'decor', label:'ไฟประดับ', order: 1e6 + 1, x:0, y:0, w:0, h:0,
      draw(ctx, t){
        const FC = [1 - ux(1), 1 - uy(1)], fp0 = Core.iso(FC[0], FC[1], 0), fp1 = Core.iso(FC[0], FC[1], 58);
        Core.rect(fp1.x - 1, fp1.y, 3, fp0.y - fp1.y, '#140b10'); Core.rect(fp1.x, fp1.y, 1, fp0.y - fp1.y - 1, WOOD_L);       // เสามุมหน้า
        const P0 = Core.iso(ux(-1), 1 - uy(1), RAIL_Z + 2), P1 = Core.iso(1 - ux(1), uy(-1), RAIL_Z + 2), PF = fp1;
        const lit = !morning() && Core.lights[5], cols = ['#ffd37a', '#ff7a4a', '#fff2c8', '#ff9ad8', '#7ad8ff'];
        const string = (a, b, sag, step, k0) => {
          let pv = null; const n = Math.max(8, Math.round(Math.abs(b.x - a.x)/2));
          for (let i = 0; i <= n; i++){ const u = i/n, x = a.x + (b.x - a.x)*u, y = a.y + (b.y - a.y)*u + 4*sag*u*(1 - u); if (pv) Core.line(pv[0], pv[1], x, y, '#2a1c18'); pv = [x, y]; }
          const len = Math.hypot(b.x - a.x, b.y - a.y), m = Math.floor(len/step);
          for (let i = 1; i < m; i++){ const u = i/m, x = Math.round(a.x + (b.x - a.x)*u), y = Math.round(a.y + (b.y - a.y)*u + 4*sag*u*(1 - u)) + 1, c = cols[(i + k0) % cols.length];
            if (lit){ const on = ((i + Math.floor(t*2.5)) % 7) !== 0; Core.emit(() => { if (on){ const g = ctx.globalAlpha; ctx.globalAlpha = .25; Core.rect(x - 1, y - 1, 3, 3, c); ctx.globalAlpha = g; } Core.px(x, y, on ? c : Core.shade(c, .5)); }); }
            else Core.px(x, y, Core.shade(c, .55)); }
        };
        string(P0, PF, 7, 6, 0); string(P1, PF, 7, 6, 2); string(P0, P1, 12, 7, 4);
      }
    });

    /* ---------- ราวกันตกด้านหน้า (เตี้ย โปร่ง) — วาดหน้าสุดของชั้น ---------- */
    objs.push({ id:'f5_railing', kind:'decor', label:'ราวกันตก', order:1e6, x:0, y:0, w:0, h:0,
      draw(){
        const M = '#8a8aa0', MD = '#4a4a60', H = 12, NX = 5, NY = 10;
        for (let k = 0; k < NX; k++){ const a = Core.iso(k/NX,1,0), b = Core.iso(k/NX,1,H); Core.rect(a.x, b.y, 1, a.y-b.y, MD); }
        for (let k = 0; k <= NY; k++){ const a = Core.iso(1,k/NY,0), b = Core.iso(1,k/NY,H); Core.rect(a.x, b.y, 1, a.y-b.y, MD); }
        for (const z of [H, H*.5]){
          const c = z === H ? M : MD, p0 = Core.iso(0,1,z), p1 = Core.iso(1,1,z), p2 = Core.iso(1,0,z);
          Core.line(p0.x, p0.y, p1.x, p1.y, c); Core.line(p2.x, p2.y, p1.x, p1.y, c);
        }
        if (!morning() && Core.lights[5]) Core.emit(() => {
          for (let k = 1; k < 18; k++){
            const f = k/18, on = ((k + Math.floor(Core.t*1.5)) % 3) !== 0, c = k % 2 ? '#ffd37a' : '#ff7a4a';
            const p = Core.iso(1,f,H-1); if (on) Core.px(p.x, p.y+1, c);
            if (k % 2 === 0){ const q = Core.iso(f,1,H-1); if (on) Core.px(q.x, q.y+1, c); }
          }
        });
        if (Core.snow && night()){ const S = Core.PAL.snow, p0 = Core.iso(0,1,H+1), p1 = Core.iso(1,1,H+1), p2 = Core.iso(1,0,H+1);
          Core.line(p0.x, p0.y, p1.x, p1.y, S); Core.line(p2.x, p2.y, p1.x, p1.y, S); }
      }
    });

    /* ---------- ตัวคุมบรรยากาศ: ลูกค้าพูดเองเป็นระยะ ---------- */
    objs.push({ id:'f5_ctrl', kind:'logic', label:'5F ctrl', x:0, y:0, w:0, h:0,
      draw(ctx, t, st){
        if (morning()){ st.next = t + 4; return; }
        if (!st.next) st.next = t + 5;
        if (t < st.next) return;
        st.next = t + 9 + (Math.floor(t*7) % 5);
        const av = pats.filter(present); if (!av.length) return;
        const q = av[Math.floor(t*13) % av.length], o = Core.find(q.id);
        if (o){ o.state.until = Core.t + 1.4; Core.bubble(q.id, q.say[Math.floor(t) % q.say.length], 1600); }
      }
    });

    return objs;
  }
};
})();
