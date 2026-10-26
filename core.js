/* =============================================================================
 * core.js — SHOPHOUSE v2 · เครื่องยนต์กลาง   (เจ้าของไฟล์: Opus — คนอื่นห้ามแก้)
 * ลำดับโหลด: core.js → sprites_people.js → sprites_items.js → floor1.js … floor5.js
 * =============================================================================
 *
 *  ROUND 4 RELAYOUT NOTES — คนจัดผังชั้น 1-4 อ่านกล่องนี้ก่อน   (รอบ 4: สลับแกน 80 x 160 → fx สั้น / fy ยาว)
 *  ---------------------------------------------------------------------------
 *  อะไรเปลี่ยน (เทียบรอบ 3b)
 *    - สลับแกน: ตามแกน fx = Core.UX = 40 หน่วย (ผนังสั้น 80 px) · ตามแกน fy = Core.UY = 80 หน่วย (ผนังยาว 160 px)
 *      ผนังหลังซ้าย (ระนาบ fx=0) = ผนังยาว 160 px · ผนังหลังขวา (ระนาบ fy=0) = ผนังสั้น 80 px · ตึกกว้างบนจอ 240 px เท่าเดิม
 *    - FH = 136 เท่าเดิม · canvas 520 x 872 เท่าเดิม · OX 238 → 318 (ตัวตึกอยู่ตำแหน่งเดิมบนจอ)
 *    - สัญญา fx,fy,fz เหมือนเดิมทุกอย่าง (fx,fy = 0..1) และชื่อ helper ทุกตัวเหมือนเดิม — แต่ผังเดิมจะชน/ล้น ต้องจัดใหม่
 *    - ฉากหลัง: ป่าญี่ปุ่น 4 ชั้น + หมู่บ้าน + ศาลเจ้า งานปีใหม่ + พลุ + ลม (ไม่มี Lawson/เมืองแล้ว)
 *    - หน้าตึก (floor 0, id 'street_*'): ลานจอด Porsche 911 x3 + ป้าย P + เสาไฟ (ขวา-ล่าง) · ตู้กดน้ำ · จักรยาน · รถวิ่งผ่านบนถนน
 *    - รอบ 4b: ตู้กดน้ำ 4 ตู้ · สัญญาณไฟ · คนเดินผ่าน · ป้ายรถเมล์ · ตู้ไปรษณีย์ · ทางม้าลาย · ต้นบ๊วย · เสาไฟฟ้า+สาย (core วาดเอง)
 *    - ผนังนอก (core วาดเอง ไม่ต้องทำในไฟล์ชั้น): แอร์/ท่อ/มิเตอร์/ระเบียงตากผ้า/ป้ายแขวน โผล่ขวาตึก · ไม้เลื้อยมุมขวา
 *      กันสาด 1F ฝั่งถนน (ขอบหน้า-ซ้าย, fx .40-.95, z 106-124) + กระถาง/ตู้จดหมายหน้า 1F → ไฟล์ชั้น 1 อย่าวางของสำคัญสูง z>100 ชิดขอบหน้า-ซ้ายช่วงนั้น
 *    - คนใหญ่ขึ้น 2 เท่า: Core.PEOPLE_SCALE = 2 → ระยะห่างคนขั้นต่ำ fx ≥ 0.40 · fy ≥ 0.20 · คนนั่ง: ตัก ≈ fz + 16 px
 *  พิกัด → px บนจอ
 *    - fx +0.1 = 4 หน่วย = ขวา 8 px + ลง 4 px
 *    - fy +0.1 = 8 หน่วย = ซ้าย 16 px + ลง 8 px         ← ตอนนี้ fx "แน่น" กว่า fy 2 เท่า
 *    - fz +1   = ขึ้น 1 px
 *    - ขนาดกล่อง a,b ใน isoBox/boxBBox ยังเป็น "หน่วย" (1 หน่วย = 2 px แนวนอน) แต่แปลงเป็นสัดส่วนคนละตัว:
 *        ตาม fx: Core.ux(n) = n/40  (= Core.u)        ตาม fy: Core.uy(n) = n/80
 *      ⚠ โค้ดที่ทำ  const R = n => n/Core.U  แล้วใช้กับ fy จะผิด 2 เท่า → เปลี่ยนเป็น Core.uy
 *    - sprite ไม่ยืดตามพื้น: คน 16 px (1x) กินพื้นราว 0.20 ตาม fx หรือ 0.10 ตาม fy · ตอนนี้คนวาด 2x → 32 px กว้าง สูง ~44 px
 *  โซนที่ถูกบัง (พื้น+slab ของชั้นบนบังมุมหลัง)
 *    - ของที่สูงไม่เกิน 50 px จากพื้น ไม่ถูกบังเลยไม่ว่าวางตรงไหน ✔  (Core.SAFE = 0)
 *    - จุดถูกบังเมื่อ  fx < 1-(130-fz)/80  และ  fy < 1-(130-fz)/160  (ต้องจริงทั้งสองข้อ)
 *        fz=60 → fx<.13 & fy<.56 | fz=70 → fx<.25 & fy<.63 | fz=80 → fx<.38 & fy<.69
 *        fz=90 → fx<.50 & fy<.75 | fz=110 → fx<.75 & fy<.88
 *    - ของบนผนังยาว (ซ้าย, fx=0) ที่สูง z เห็นเมื่อ fy > 1-(130-z)/160   เช่น z=60 → fy>.56 · z=80 → fy>.69
 *      ของบนผนังสั้น (ขวา, fy=0) ที่สูง z เห็นเมื่อ fx > 1-(130-z)/80    เช่น z=60 → fx>.13 · z=80 → fx>.38
 *    - เช็คด้วย Core.visible(fx,fy,fz) · Core.hiddenEdge(fz) → {fx,fy} ขอบโซนบัง · หรือกด G (จุดแดง = ถูกบัง)
 *  ทริคจัดผัง
 *    - ของยาว (เคาน์เตอร์ โต๊ะยาว โซฟา ชั้นวาง เตียง) วางยาวตามแกน fy · ตามแกน fx มีที่แค่ 3 แถว
 *      แถว fx ≈ 0.10-0.25 (ชิดผนังยาว/ซ้าย) · 0.40-0.55 (กลาง) · 0.70-0.90 (หน้า)
 *    - ระยะห่างขั้นต่ำไม่ให้ sprite คนทับกัน (คน 1x): ตาม fx ≥ 0.20 · ตาม fy ≥ 0.10 · คน 2x (PEOPLE_SCALE=2, ค่าปัจจุบัน): fx ≥ 0.40 · fy ≥ 0.20
 *    - ตามแนว fy วางคน/ของขนาด 16 px ได้ราว 6-7 ตัวต่อแถว · ของใหญ่ (sprite > 70 px) ใส่ได้ 1 ชิ้นต่อแถว
 *    - sprite ที่วาดมา "ยาวตามแนวลงซ้าย" (เช่น izakaya_counter, sofa_l) ไม่ต้อง flip → ยาวตาม fy ชิดผนังยาว (ซ้าย)
 *      (รอบ 3 ต้อง flip=true · รอบ 4 กลับเป็น flip=false) · ของที่ flip จะยาวตาม fx (ผนังสั้น)
 *    - ของติดผนังที่สูง (โปสเตอร์ หน้าต่าง จอ ป้าย z 40-80) วางที่ผนังยาว fy > 0.7 หรือผนังสั้น fx > 0.4
 *    - โคมเพดาน (ตัวโคม z≈80) ต้องอยู่ fx > 0.38 หรือ fy > 0.69 · ของตั้งพื้นสูง ≤ 50 px วางได้ทุกที่
 *    - ซ้าย-หน้า (fx<0.22, fy>0.9) มองผ่านกระจกลิฟต์ (จางลงนิดหน่อย)
 *
 *  QUICK REFERENCE — อ่านแค่ส่วนนี้ก็เขียน floorN.js ได้
 *  ---------------------------------------------------------------------------
 *  [1] พิกัดพื้นห้อง  (พื้นทุกชั้น 1:2 → fx ยาว 40 หน่วย, fy ยาว 80 หน่วย, fx/fy อยู่ในช่วง 0..1)
 *
 *                      (0,0) มุมหลัง (บนสุดบนจอ)
 *                       /\
 *        +fy ↙         /   ‾‾‾‾‾‾‾‾‾---___        ↘ +fx
 *   ผนังยาว = ระนาบ fx=0                      ‾‾‾---___   ผนังสั้น = ระนาบ fy=0
 *            (0,1) <                                    > (1,0)
 *          มุมซ้าย   ‾‾‾---___                     /   มุมขวา
 *                              ‾‾‾---___         /
 *                                        ‾‾‾---\/ (1,1) มุมหน้า  ← ผนังหน้า 2 ด้านถูกตัดออก (cutaway)
 *
 *    fz, z0, z1, h = ความสูงเป็น px นับจากพื้นห้องของชั้นนั้น (เพดาน = Core.FH = 136)
 *    a, b          = ขนาดกล่องเป็น "หน่วย iso" (1 หน่วย = กว้าง 2 px บนจอ): a ตามแกน fx, b ตามแกน fy
 *                    พื้นเต็มห้อง = Core.UX x Core.UY = 40 x 80 หน่วย
 *                    แปลงหน่วย→สัดส่วน: Core.ux(12) === 12/40 (ตาม fx) · Core.uy(12) === 12/80 (ตาม fy) · Core.u = Core.ux
 *    ผลลัพธ์ทุกตัว = พิกัด canvas ภายใน (Core.W x Core.H = 520 x 872) — การย่อ/ขยายจอ core ทำเอง
 *    มุมหลังของพื้นชั้น n อยู่ที่ canvas (318, 712-136*(n-1)) · มุมหน้า (1,1) = -80 px (ไปซ้าย), +120 px ลง
 *
 *  [2] โซนที่ถูกบัง — ดูกล่อง ROUND 3 ด้านบน (ระดับพื้นไม่ถูกบังแล้ว, บังเฉพาะของสูงที่มุมหลัง)
 *    - ชั้น 5 ไม่มีอะไรบัง · ตอนผู้ใช้กดเลือกชั้น (X-RAY) ชั้นที่อยู่ข้างบนจะโปร่งใส เห็นทั้งห้อง
 *    - ปล่องลิฟต์แก้วอยู่นอกตึกที่มุมซ้าย: ของที่ fx<0.22 และ fy>0.9 จะมองผ่านกระจกลิฟต์ (ยังเห็นแต่จางลง)
 *
 *  [3] เทมเพลตไฟล์ชั้น (คัดลอกไปแก้ได้เลย)
 *
 *    window.FLOORS[2] = {
 *      name:'ออฟฟิศเทรด', nameJP:'トレード部屋', desc:'พนักงาน 4 คน จอกราฟหลายจอ',
 *      shell:{ wallL:'#262a3c', wallR:'#30354a', floor:'wood', floorC:'#8a6a52' },  // ไม่ใส่ = ค่า default
 *      ambient(ctx, t){                         // วาดหลังผนัง/พื้น ก่อน object ทุกตัว (หน้าต่าง โปสเตอร์ พรม)
 *        Core.quadY(0, 0.72,0.94, 40,80, '#4fc1c6', Core.PAL.ol);   // หน้าต่างบนผนังสั้น/ขวา (fx>0.7 ไม่ถูกบัง)
 *      },
 *      build(F){                                // เรียกครั้งเดียวตอนบูต → คืน array ของ object
 *        const desk = { id:'f2_desk', kind:'furniture', label:'โต๊ะเทรด',
 *          ...F.boxBBox(0.40,0.45,0, 28,8,14),             // ยาว 28 หน่วยตาม fx (= 0.70), ลึก 8 หน่วยตาม fy (= 0.10)
 *          draw(ctx,t,st){ Core.isoBox(0.40,0.45,0, 28,8,14, '#b5703c'); } };
 *        const trader = { id:'f2_trader', kind:'character', label:'เทรดเดอร์', hint:'คลิก: ทัก',
 *          ...F.spriteBBox(SPR_PEOPLE.worker_trader, 0.55,0.38),
 *          draw(ctx,t,st){ Core.drawSprite(SPR_PEOPLE.worker_trader, 0.55,0.38, Core.anim(2,3)); },
 *          onClick(){ Core.bubble('f2_trader','กำไรแล้ว!',1500); Core.log('เทรดเดอร์ดีใจ'); } };
 *        return [desk, trader];
 *      }
 *    };
 *
 *    object = { id (ไม่ซ้ำทั้งตึก), kind, label, hint?, x,y,w,h (bbox canvas px),
 *               draw(ctx,t,state), onClick()?, order? }
 *      - t = วินาที (float) วิ่งตลอดแม้หยุดเวลา · state = this.state (object เก็บค่าของตัวเอง)
 *      - ลำดับวาดในชั้น = เรียงตาม (y+h) น้อย→มาก (ใส่ order:ตัวเลข เพื่อบังคับเองได้)
 *      - มี onClick = คลิกได้ (เมาส์ชี้ → กรอบเหลือง + ชื่อขึ้นแผง)
 *      - ของที่ขยับ: อัปเดต bbox ใน draw เช่น  Object.assign(this, Core.spriteBBox(spr,fx,fy))
 *      - ถ้า draw() throw → core ปิด object นั้นทิ้ง + console.error ครั้งเดียว (ตึกไม่ล่ม)
 *
 *  [4] ฟังก์ชันที่ใช้ได้ (ทุกตัววาดลง ctx ที่ core กำลังใช้อยู่ — ใน draw() ใช้ตัวนี้ได้เลย)
 *    พิกัด/รูปทรงบนพื้นห้อง (ชั้นที่กำลังวาด; ใน build(F) ใช้ F.xxx ชื่อเดียวกัน):
 *      Core.iso(fx,fy,fz=0)                         → [x,y] (มี .x .y)    Core.iso(0.5,0.5,0).x
 *      Core.isoBox(fx,fy,fz, a,b,h, cTop,cL?,cR?,line?)  กล่อง iso ขอบดำ  a=ยาวตามแกน fx, b=ยาวตามแกน fy (หน่วย), h=px
 *                       cL = หน้าซ้าย-ล่าง (ระนาบ fy+b), cR = หน้าขวา-ล่าง (ระนาบ fx+a) · ไม่ใส่ = ไล่เฉดจาก cTop
 *                       Core.isoBox(0.6,0.5,0, 20,8,14, '#b5703c','#8a4b2a','#5a2e1c')
 *      Core.quadX(fx, fy0,fy1, z0,z1, fill,line?)    แผ่นตั้งขนานผนังสั้น/ซ้าย (ระนาบ fx คงที่)
 *      Core.quadY(fy, fx0,fx1, z0,z1, fill,line?)    แผ่นตั้งขนานผนังยาว/ขวา (ระนาบ fy คงที่)
 *      Core.quadZ(fz, fx0,fx1, fy0,fy1, fill,line?)  แผ่นนอน (พรม/ท็อปโต๊ะ)
 *      Core.wallL(fy0,fy1,z0,z1,fill,line?) = quadX(0,…)   Core.wallR(fx0,fx1,z0,z1,fill,line?) = quadY(0,…)
 *      Core.pool(fx,fy, rx,ry, color?,alpha?)       วงแสงบนพื้นแบบ dither (ไม่เกินขอบพื้น)
 *      Core.boxBBox(fx,fy,fz,a,b,h) → {x,y,w,h}      Core.spriteBBox(spr,fx,fy,fz=0) → {x,y,w,h}
 *      Core.visible(fx,fy,fz=0) → bool              จุดนี้ไม่ถูกชั้นบนบัง?
 *      Core.hiddenEdge(fz=0) → {fx,fy}               (ใหม่) ที่ความสูง fz ถูกบังเมื่อ fx<.fx และ fy<.fy
 *      Core.ux(n) / Core.uy(n)                       (ใหม่) หน่วย → สัดส่วน ตามแกน fx / fy   (Core.u = Core.ux)
 *    sprite (รูปแบบตาม BRIEF_v2: {w,h,pal,frames:[[rows]],anchor:'bottom-center'}):
 *      Core.drawSprite(spr, fx,fy, frame=0, flip=false, fz=0)   วางบนพื้นห้อง (จุด = กลางล่าง)
 *      Core.drawSprite(ctx, spr, x,y, frame=0, flip=false)      วางด้วยพิกัด canvas px (แบบ sprites_test.html)
 *      Core.anim(nFrames, fps=4, offset=0) → index เฟรมตอนนี้     Core.anim(2,3) → 0,1,0,1…
 *    pixel 2D (พิกัด canvas px):
 *      Core.px(x,y,c)  Core.rect(x,y,w,h,c)  Core.orect(x,y,w,h,fill,line=ol)  (กรอบ 1px อยู่ด้านใน)
 *      Core.line(x0,y0,x1,y1,c)  Core.fillPoly([[x,y]…],c)  Core.polyOutline(pts,c)  Core.ellipse(cx,cy,rx,ry,c)
 *      Core.glowRect(x,y,w,h,c)  (วงเรือง 2 ชั้นแบบ pixel ไม่ใช้ blur)
 *      Core.text(str,x,y,c,{scale:1,shear:0}) → width   ฟอนต์ pixel 3x5 (A-Z 0-9 . : - + / ! ? % $ ↑ ↓)
 *      Core.textJP(str,size,x,y,c,shear=0)             ญี่ปุ่น/ไทย ผ่าน DotGothic16 (threshold ให้คม)
 *                   shear: +1 = ไล่ลงขวา (บนผนังยาว/ขวา) · -1 = ไล่ขึ้นขวา (บนผนังสั้น/ซ้าย) · (x,y)=บนซ้ายตัวแรก
 *      Core.emit(()=>{…})  วาดสิ่งที่ "เรืองแสง" (จอ/โคม) — ไม่โดนหรี่ตอนปิดไฟ
 *      Core.shade(c,k) สีเข้มขึ้น (k<1)   Core.mix(c1,c2,t)   Core.rng(seed) → ฟังก์ชันสุ่มคงที่ 0..1
 *    สถานะ/เหตุการณ์:
 *      Core.time  = { phase:'morning'|'evening'|'night', t:0..1, sec:0..60, paused }  (อ่านอย่างเดียว)
 *      Core.lights[n] = true/false  ไฟห้อง (ปิด + ไม่ใช่ตอนเช้า → core หรี่สีทั้งห้องให้เอง)
 *      Core.lit(n?) → ควรวาดแสงโคมไหม (ไฟเปิด && ไม่ใช่เช้า)      Core.isDark(n?) → ห้องมืดไหม
 *      Core.snow = true/false   Core.xray = true/false   Core.grid = true/false   Core.fireworks = true/false (รอบ 4, ปุ่ม 🎆 / คีย์ F)   Core.wind (ลม, คีย์ W)
 *      Core.PEOPLE_SCALE = 2 (รอบ 4) sprite ใน SPR_PEOPLE วาดใหญ่ 2 เท่าอัตโนมัติ (drawSprite/spriteBBox) — ระยะห่างคนขั้นต่ำ x2:
 *                          fx ≥ 0.40 · fy ≥ 0.20 · คนนั่งเก้าอี้ให้ยก fz ตามความสูงเบาะ (ขนาดเฟอร์นิเจอร์ SPR_ITEMS ไม่เปลี่ยน)
 *      Core.bubble(objId,text,ms=1800)   Core.log(text)   Core.find(id)   Core.addObject(obj{floor})
 *      Core.on('phase'|'arrive'|'click'|'hover'|'hoverObj'|'log', cb)
 *      Core.elevator.goTo(n)   Core.elevator.pos (float ชั้น)   Core.setPhase(p)   Core.pause(bool)
 *    ค่าคงที่:  Core.W=520 Core.H=872 Core.UX=40 Core.UY=80 Core.U(=UX) Core.FH=136 Core.SLAB=6 Core.GY=700 (ขอบฟ้า)
 *               Core.PAL · Core.SAFE = 0 (ระดับพื้นไม่มีโซนบังแล้ว)
 *
 *  [5] ลำดับวาดทั้งภาพ
 *    ฉากหลัง (cache ต่อ phase แยกชั้น: ฟ้า+ฟูจิ+ป่าไกล / ป่ากลาง / ป่าใกล้ / หมู่บ้าน / ศาลเจ้า+ถนน) + ชั้นลม/พลุทุกเฟรม → ชั้น 1..5 [ผนังหลัง+พื้น → ambient → objects]
 *    → ของหน้าตึก (ลานจอด 911 ตู้กดน้ำ จักรยาน) → ปล่องลิฟต์+ตู้ → รถวิ่งผ่าน → ป้ายเลขชั้น → ไฮไลต์/กรอบ hover → หิมะ (หน้าสุด) → กล่องคำพูด (HTML)
 * ========================================================================== */
(function(){
'use strict';

/* ============================== CONFIG ============================== */
const W = 520, H = 872;           // ความละเอียด canvas ภายใน (รอบ 3: เดิม 600x784)
const UX = 40, UY = 80;           // รอบ 4: สลับแกน — fx = ผนังสั้น 40 หน่วย (80 px) · fy = ผนังยาว 80 หน่วย (160 px) · กว้างบนจอ 2(UX+UY) = 240 px
const U = UX;                     // (ชื่อเดิม) Core.U = UX — ใช้แปลงหน่วยตามแกน fx เท่านั้น
const FH = 136;                   // ความสูงชั้น (px) (รอบ 3: เดิม 100)
const SLAB = 6, WALL = 3;         // ความหนาพื้น (px) / ผนัง (หน่วย)
const OX = 318, OY = 712;         // มุมหลังของพื้นชั้น 1 บน canvas (รอบ 4: เดิม 238 — เลื่อนขวา 80 ให้ตึกอยู่ที่เดิมบนจอ)
const GY = OY - 12;               // เส้นขอบฟ้า (พื้นดินในฉากหลังเริ่มที่ y นี้)
const PHASE_SEC = 60;
const PHASES = ['morning','evening','night'];
const SAFE = 0;                   // รอบ 3: ระดับพื้นไม่มีอะไรถูกบังแล้ว (FH-SLAB=130 > 2*min(UX,UY)=80) — ดู hiddenEdge()
const DRAW_FPS = 30;
// ปล่องลิฟต์ (หน่วยโลก): นอกตึก ติดมุมซ้าย
const SX0 = -WALL, SX1 = 9, SY0 = UY, SY1 = UY + 8, SZ0 = -SLAB, SZ1 = 4*FH + 44;
// ฟูจิ (พิกัด canvas): ยอดอยู่กลางหลังตึก เหนือดาดฟ้า
const FUJI_CX = 272, FUJI_TOP = 38;

const PAL = {
  ol:'#140b10', sky:'#141428', city:'#22223a', cityWin:'#e9c46a',
  wall:'#4a1a2c', wall2:'#2b2238', wallSh:'#3a1422',
  wood:'#b5703c', dwood:'#8a4b2a', wood3:'#5a2e1c',
  warm:'#ffd37a', screen:'#4fc1c6', red:'#d8363a',
  cream:'#eae0d0', creamSh:'#c9b9a0', leaf:'#4f9a5a', tatami:'#9db37a', tatamiSh:'#7a8f5c',
  metal:'#8a8aa0', metalD:'#5a5a72', skin:'#e8a87c', white:'#f6f8fc',
  concrete:'#4a4560', concreteSh:'#37334a', glass:'#9fe0f0',
  lawson:'#2a64c8', lawsonLt:'#5aa0ff', snow:'#f4f6fb'
};

/* ฉากหลังแต่ละเฟรมเวลา */
const PP = {
  // ฟูจิ: rL/rM/rS/rD/rE = หิน สว่าง/กลาง/เงา/เงาลึก/ขอบ · sHi/sL/sM/sS/sD = หิมะ ไฮไลต์/สว่าง/กลาง/เงา/ร่องเงา
  //       haze = สีหมอกที่ฐานเขา · lightL = แสงมาจากซ้าย · cloud* = แถบเมฆพาดเขา · hillFar/hill/hill2 = เนินหน้าเขา
  morning:{
    fNear:'#2c5a3c', fNearSh:'#1c3f2c', fNearHi:'#8cc48a', fHaze:'#a9c4cf', fMist:'#f2f6f4', fSnow:null, lightDir:-1, hiAll:true, trunk:'#4a3226',
    vRoof:'#4a5a78', vRoofHi:'#8ea0c0', vWall:'#eee6d6', vWood:'#6a4632', vThatch:'#b0925a', vGround:'#7e9a5e', vLane:'#d6caa6', water:'#7ab8d8', winLit:0,
    forFar:'#6f9a94', forMid:'#4d7a6c', forNear:'#335c50', forEdge:'#8ab8a2', sunL:1, red:'#e0383a', redSh:'#a8262e',
    roof:'#4f7f78', roofSh:'#365e5a', roofHi:'#86b6aa', wallW:'#6a4632', stone:'#b8b2a8', gravel:'#d8cfbc', gravelDot:'#b8ad96',
    cord:'#3a2a2a', hair:'#2a1c18', lanLit:0, stallLit:0,
    sky:[[0,'#5ea6d6'],[96,'#7bbbe0'],[180,'#a2d0e6'],[240,'#d2e4e2'],[282,'#f4e2c4'],[390,'#f8e8d0']],
    rL:'#7690c8', rM:'#6178b2', rS:'#4f649e', rD:'#42538b', rE:'#35447a', lightK:[.62,.62], rim:'#93aadb',
    sHi:'#ffffff', sL:'#f2f6fd', sM:'#d3def2', sS:'#b2c2e3', sD:'#95a8d0', haze:'#b4d6ea', lightL:1,
    cloud:'#ffffff', cloudM:'#eef5fb', cloudSh:'#c4d8ea',
    hillFar:'#8eaccc', hill:'#6c9496', hill2:'#557c78', hillTree:'#466a63',
    cityFar:'#a3b6ca', cityNear:'#8296b0', cityNearSh:'#71849e',
    win:'#cfe8f2', winOff:'#6e8199', lit:0, ground:'#8e8a96', walk:'#bdb7ad', walkLine:'#a7a198',
    road:'#5c5c69', roadLine:'#ece6d4', curb:'#d3cdc3', lawGlass:'#a9c6d6', lawLit:0, signLit:0
  },
  evening:{
    fNear:'#2a3a30', fNearSh:'#1a2420', fNearHi:'#ff9a5a', fHaze:'#b87a96', fMist:'#f6b8a8', fSnow:null, lightDir:1, hiAll:true, trunk:'#3a2226',
    vRoof:'#3e3a54', vRoofHi:'#e08a6a', vWall:'#d8a8a0', vWood:'#4a2a2a', vThatch:'#8a5a4a', vGround:'#5a4a4e', vLane:'#9a7478', water:'#d88a8a', winLit:.85,
    forFar:'#6a3a5e', forMid:'#4a2a4c', forNear:'#33203e', forEdge:'#b4566a', sunL:0, red:'#e8483a', redSh:'#a8303a',
    roof:'#4a3550', roofSh:'#33243e', roofHi:'#d07a5a', wallW:'#4a2a2a', stone:'#8a7480', gravel:'#806470', gravelDot:'#665060',
    cord:'#1c1218', hair:'#1c1218', lanLit:.75, stallLit:1,
    sky:[[0,'#2a2150'],[74,'#4a2a62'],[150,'#7c3566'],[226,'#b84a5e'],[296,'#e0704f'],[362,'#f4a35a'],[430,'#f8c870']],
    rL:'#c65a3e', rM:'#a24244', rS:'#7a324a', rD:'#5a2645', rE:'#441c3a', lightK:[.5,.66], rim:'#ec9058',
    sHi:'#fff2de', sL:'#ffd4b6', sM:'#f2aa98', sS:'#ca8aa2', sD:'#a46e90', haze:'#c95a5a', lightL:0,
    cloud:'#ffd2b0', cloudM:'#f6a493', cloudSh:'#c56c8a',
    hillFar:'#8e4466', hill:'#5a2f58', hill2:'#3f2448', hillTree:'#33203e',
    cityFar:'#553563', cityNear:'#2f2240', cityNearSh:'#271c36',
    win:'#ffcf7a', winOff:'#3b2b4f', lit:.2, ground:'#3a3042', walk:'#71616f', walkLine:'#5f515e',
    road:'#2e2838', roadLine:'#d8b890', curb:'#87768a', lawGlass:'#fff1d4', lawLit:1, signLit:1
  },
  night:{
    fNear:'#12201f', fNearSh:'#0a1414', fNearHi:'#6a7aaa', fHaze:'#262a50', fMist:'#3c4274', fSnow:'#d4dcf0', lightDir:-1, hiAll:false, trunk:'#1a1418',
    vRoof:'#22263c', vRoofHi:'#4a5280', vWall:'#4a4a64', vWood:'#22181e', vThatch:'#3a3440', vGround:'#1c2032', vLane:'#34344c', water:'#2a3a6a', winLit:1,
    forFar:'#1a1d38', forMid:'#14162e', forNear:'#0e1024', forEdge:'#2a2e56', sunL:1, red:'#c8303a', redSh:'#82202e',
    roof:'#24263e', roofSh:'#1a1c30', roofHi:'#3e4270', wallW:'#2a1c22', stone:'#4e4a62', gravel:'#34304a', gravelDot:'#28253c',
    cord:'#0c0810', hair:'#0c0810', lanLit:1, stallLit:1,
    sky:[[0,'#0c0c1f'],[120,'#111127'],[240,'#161631'],[360,'#1c1c3b']],
    rL:'#383f75', rM:'#2e3466', rS:'#252a57', rD:'#1d2148', rE:'#16193a', lightK:[.55,.55], rim:'#4c5592',
    sHi:'#e6ecff', sL:'#c3cdee', sM:'#a3aedb', sS:'#8490c4', sD:'#6c77ad', haze:'#1e1f40', lightL:1,
    cloud:'#4e558c', cloudM:'#383e70', cloudSh:'#2a2f5c',
    hillFar:'#22244a', hill:'#191b36', hill2:'#14152c', hillTree:'#101126',
    cityFar:'#1b1b35', cityNear:'#22223a', cityNearSh:'#1b1b30',
    win:'#e9c46a', winOff:'#2b2b45', lit:.38, ground:'#1b1a2c', walk:'#35314b', walkLine:'#2a2740',
    road:'#17162b', roadLine:'#8a8460', curb:'#4b4661', lawGlass:'#eaf6ff', lawLit:1, signLit:1
  }
};

const DEFAULT_META = {
  1:{name:'คาเฟ่ 24 ชม.',      nameJP:'24時間カフェ',   desc:'คาเฟ่ cozy home · บาริสต้าหลังเคาน์เตอร์ ลูกค้าเดินเข้ามานั่ง แมว 1 ตัว'},
  2:{name:'ออฟฟิศเทรด',        nameJP:'トレード部屋',   desc:'ออฟฟิศชิลคนรุ่นใหม่ · พนักงาน 4 คน จอกราฟหลายจอ บอร์ดราคา'},
  3:{name:'ห้องพักเบรค',       nameJP:'休憩室',         desc:'ตู้ Arcade 2 ตู้ · PS5 + TV + โซฟา · ตู้เย็นขนม บีนแบ็ก'},
  4:{name:'ห้องนอน',           nameJP:'寝室',           desc:'ห้องนอนเล็ก ๆ เรียบ ๆ · เตียง โคมข้างเตียง ตู้เสื้อผ้า คนนอน 1 คน'},
  5:{name:'Izakaya ดาดฟ้า',    nameJP:'屋上居酒屋',     desc:'เปิดโล่งไม่มีหลังคา · เคาน์เตอร์เหล้า โคมแดง ป้าย 居酒屋 เห็นฟูจิ'}
};
/* โครงห้อง default (ไฟล์ชั้นใส่ shell:{…} ทับบางค่าได้)
   wallL/wallR = สีผนังหลังซ้าย/ขวา · floor = 'wood'|'tile'|'carpet'|'deck'|'concrete'|'tatami'|function(F)
   floorC/floorC2 = สีพื้นหลัก/รอง · trim = บัวเชิงผนัง · wallH = ความสูงผนัง px · open = ไม่มีเพดาน */
const DEFAULT_SHELL = {
  1:{wallL:'#cdb08a', wallR:'#e0cba4', floor:'wood',   floorC:'#b5703c', floorC2:'#9a5c30', trim:'#8a4b2a', wallH:FH},
  2:{wallL:'#262a3c', wallR:'#30354a', floor:'wood',   floorC:'#7d6250', floorC2:'#6a5242', trim:'#1b1d2a', wallH:FH},
  3:{wallL:'#33274c', wallR:'#3f2f5d', floor:'carpet', floorC:'#3d4f7c', floorC2:'#34436b', trim:'#221a33', wallH:FH},
  4:{wallL:'#3a1422', wallR:'#4a1a2c', floor:'wood',   floorC:'#9a5a32', floorC2:'#83492a', trim:'#2a0f18', wallH:FH},
  5:{wallL:'#4a4560', wallR:'#5a5470', floor:'deck',   floorC:'#8a5a3a', floorC2:'#6e4630', trim:'#33304a', wallH:16, open:true}
};

/* ============================== STATE ============================== */
let canvas = null, mainCtx = null, ctx = null, layer = null, layerCtx = null, bubbleLayer = null;
let DIM = 0, EMIT = 0, CUR = 1;
const time = { phase:'morning', t:0, sec:0, paused:false };
const lights = {1:true, 2:true, 3:true, 4:true, 5:true};
const S = { t:0, hl:null, hoverFloor:null, hoverObj:null, bubbles:[], booted:false };
const listeners = {};
const FLOORS = window.FLOORS = (window.FLOORS && typeof window.FLOORS === 'object') ? window.FLOORS : {};
window.SPR_PEOPLE = window.SPR_PEOPLE || {};          // กันไฟล์ชั้นพังถ้าไฟล์ sprite ยังไม่มา (ไฟล์จริงโหลดทีหลังจะเขียนทับ)
window.SPR_ITEMS  = window.SPR_ITEMS  || {};
const floorInfo = {};                    // n → {def, meta, shell, placeholder}
const floorObjs = {0:[],1:[],2:[],3:[],4:[],5:[]};
const ALL = [];                          // ทุก object (SceneAPI.objects)
let drawn = [];                          // object ที่วาดในเฟรมล่าสุด (เรียงตามลำดับวาด) → hit-test
let seq = 0;

function on(ev, cb){ (listeners[ev] = listeners[ev] || []).push(cb); }
function fire(ev, ...a){ (listeners[ev] || []).forEach(cb => { try { cb(...a); } catch(e){ console.error('[core] listener '+ev, e); } }); }

/* ============================== COLOR ============================== */
function hexRGB(c){
  if (typeof c !== 'string' || c[0] !== '#') return null;
  let h = c.slice(1); if (h.length === 3) h = h.split('').map(q => q+q).join('');
  if (h.length !== 6) return null; const n = parseInt(h,16); return [n>>16&255, n>>8&255, n&255];
}
const toHex = (r,g,b) => '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
function mix(a,b,t){ const A = hexRGB(a), B = hexRGB(b); if (!A || !B) return a; return toHex(...A.map((v,i) => Math.round(v+(B[i]-v)*t))); }
function shade(c,k){ const A = hexRGB(c); if (!A) return c; return toHex(...A.map(v => Math.max(0, Math.min(255, Math.round(v*k))))); }
const dimMap = new Map();
function dimHex(c){ let d = dimMap.get(c); if (d === undefined){ d = hexRGB(c) ? mix(c,'#141428',.58) : c; dimMap.set(c,d); } return d; }
const col = c => (DIM && !EMIT) ? dimHex(c) : c;
function emit(fn){ const e = EMIT; EMIT = 1; try { return fn(); } finally { EMIT = e; } }
function rng(seed){ let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* ============================== PIXEL PRIMITIVES ============================== */
function mk(w,h){ const c = document.createElement('canvas'); c.width = Math.max(1, w|0); c.height = Math.max(1, h|0); c.getContext('2d').imageSmoothingEnabled = false; return c; }
function rect(x,y,w,h,c){ ctx.fillStyle = col(c); ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function px(x,y,c){ ctx.fillStyle = col(c); ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
function orect(x,y,w,h,fill,line=PAL.ol){
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (fill) rect(x,y,w,h,fill);
  if (line){ rect(x,y,w,1,line); rect(x,y+h-1,w,1,line); rect(x,y,1,h,line); rect(x+w-1,y,1,h,line); }
}
function fillPoly(p,c){
  let y0 = Infinity, y1 = -Infinity;
  for (const q of p){ if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
  y0 = Math.max(y0, -2); y1 = Math.min(y1, H + 2);
  ctx.fillStyle = col(c);
  const n = p.length, xs = [];
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++){
    const yc = y + .5; xs.length = 0;
    for (let i = 0; i < n; i++){
      const a = p[i], b = p[(i+1)%n];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    xs.sort((u,v) => u-v);
    for (let k = 0; k+1 < xs.length; k += 2){ const l = Math.round(xs[k]), r = Math.round(xs[k+1]); if (r > l) ctx.fillRect(l,y,r-l,1); }
  }
}
function line(x0,y0,x1,y1,c){
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  ctx.fillStyle = col(c);
  const dx = x1-x0, dy = y1-y0;
  if (dx === 0){ ctx.fillRect(x0, Math.min(y0,y1), 1, Math.abs(dy)||1); return; }
  if (dy === 0){ ctx.fillRect(Math.min(x0,x1), y0, Math.abs(dx)||1, 1); return; }
  if (Math.abs(dx) === 2*Math.abs(dy)){             // เส้น iso 2:1 สะอาด
    const sx = Math.sign(dx), sy = Math.sign(dy), n = Math.abs(dy);
    for (let i = 0; i < n; i++) ctx.fillRect(sx > 0 ? x0+2*i : x0-2*i-2, sy > 0 ? y0+i : y0-1-i, 2, 1);
    return;
  }
  let ax = Math.abs(dx), ay = -Math.abs(dy), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = ax+ay, x = x0, y = y0;
  for (let k = 0; k < 6000; k++){ ctx.fillRect(x,y,1,1); if (x === x1 && y === y1) break; const e2 = 2*err; if (e2 >= ay){ err += ay; x += sx; } if (e2 <= ax){ err += ax; y += sy; } }
}
const seg = (p,q,c) => line(p[0],p[1],q[0],q[1],c);
function polyOutline(p,c){
  let cx = 0, cy = 0; for (const q of p){ cx += q[0]; cy += q[1]; } cx /= p.length; cy /= p.length;
  for (let i = 0; i < p.length; i++){
    const a = p[i], b = p[(i+1)%p.length];
    const ax = Math.round(a[0]), bx = Math.round(b[0]), ay = Math.round(a[1]), by = Math.round(b[1]);
    if (ax === bx){ const x = ax > cx ? ax-1 : ax; rect(x, Math.min(ay,by), 1, Math.abs(by-ay)+1, c); }
    else if (ay === by){ const y = ay > cy ? ay-1 : ay; rect(Math.min(ax,bx), y, Math.abs(bx-ax), 1, c); }
    else seg(a,b,c);
  }
}
function expand(p,r){
  let cx = 0, cy = 0; for (const q of p){ cx += q[0]; cy += q[1]; } cx /= p.length; cy /= p.length;
  return p.map(q => [q[0]+Math.sign(Math.round(q[0]-cx))*r, q[1]+Math.sign(Math.round(q[1]-cy))*r]);
}
function ellipse(cx,cy,rx,ry,c){
  for (let dy = -ry; dy <= ry; dy++){ const hw = Math.round(rx*Math.sqrt(Math.max(0, 1-(dy*dy)/(ry*ry||1)))); rect(cx-hw, cy+dy, 2*hw+1, 1, c); }
}
function glowRect(x,y,w,h,c){ emit(() => { const a = ctx.globalAlpha; ctx.globalAlpha = a*.14; rect(x-2,y-2,w+4,h+4,c); ctx.globalAlpha = a*.28; rect(x-1,y-1,w+2,h+2,c); ctx.globalAlpha = a; rect(x,y,w,h,c); }); }
function glowPoly(p,c){ emit(() => { const a = ctx.globalAlpha; ctx.globalAlpha = a*.13; fillPoly(expand(p,2),c); ctx.globalAlpha = a*.26; fillPoly(expand(p,1),c); ctx.globalAlpha = a; }); }

/* ============================== ISO (หน่วยโลก) ============================== */
// x = แกน fx*UX, y = แกน fy*UY, z = px จากพื้นชั้น 1
const WP = (x,y,z=0) => [OX + 2*(x-y), OY + (x+y) - z];
function P2(x,y){ const p = [x,y]; p.x = x; p.y = y; return p; }
function wqX(x,y0,y1,z0,z1,c,l){ const p = [WP(x,y0,z1),WP(x,y1,z1),WP(x,y1,z0),WP(x,y0,z0)]; if (c) fillPoly(p,c); if (l) polyOutline(p,l); return p; }
function wqY(y,x0,x1,z0,z1,c,l){ const p = [WP(x0,y,z1),WP(x1,y,z1),WP(x1,y,z0),WP(x0,y,z0)]; if (c) fillPoly(p,c); if (l) polyOutline(p,l); return p; }
function wqZ(z,x0,x1,y0,y1,c,l){ const p = [WP(x0,y0,z),WP(x1,y0,z),WP(x1,y1,z),WP(x0,y1,z)]; if (c) fillPoly(p,c); if (l) polyOutline(p,l); return p; }
function wbox(x,y,z,a,b,h,cT,cL,cR,ol=PAL.ol){
  const t0 = WP(x,y,z+h), t1 = WP(x+a,y,z+h), t2 = WP(x+a,y+b,z+h), t3 = WP(x,y+b,z+h);
  const b1 = WP(x+a,y,z), b2 = WP(x+a,y+b,z), b3 = WP(x,y+b,z);
  if (h > 0){ fillPoly([t3,t2,b2,b3], cL); fillPoly([t2,t1,b1,b2], cR); }
  fillPoly([t0,t1,t2,t3], cT);
  if (ol){
    polyOutline(h > 0 ? [t0,t1,b1,b2,b3,t3] : [t0,t1,t2,t3], ol);
    if (h > 0){ seg(t3,t2,ol); seg(t2,t1,ol); rect(t2[0], t2[1], 1, b2[1]-t2[1], ol); }
  }
}
function wbbox(x,y,z,a,b,h){
  const pts = [WP(x,y,z+h),WP(x+a,y,z+h),WP(x+a,y+b,z+h),WP(x,y+b,z+h),WP(x+a,y,z),WP(x+a,y+b,z),WP(x,y+b,z)];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [a2,b2] of pts){ x0 = Math.min(x0,a2); y0 = Math.min(y0,b2); x1 = Math.max(x1,a2); y1 = Math.max(y1,b2); }
  return {x:Math.floor(x0), y:Math.floor(y0), w:Math.ceil(x1-x0)+1, h:Math.ceil(y1-y0)+1};
}

/* ============================== ISO (พิกัดพื้นห้อง ของชั้น CUR) ============================== */
const zOf = n => (n-1)*FH;
const u = n => n / UX;                   // หน่วย → สัดส่วนตามแกน fx (ชื่อเดิม)
const ux = u, uy = n => n / UY;          // ตามแกน fx / ตามแกน fy
function iso(fx,fy,fz=0){ const p = WP(fx*UX, fy*UY, zOf(CUR)+fz); return P2(p[0], p[1]); }
function isoBox(fx,fy,fz,a,b,h,cT,cL,cR,ol=PAL.ol){
  if (cL == null) cL = shade(cT,.78); if (cR == null) cR = shade(cT,.6);
  wbox(fx*UX, fy*UY, zOf(CUR)+fz, a, b, h, cT, cL, cR, ol);
}
function boxBBox(fx,fy,fz,a,b,h){ return wbbox(fx*UX, fy*UY, zOf(CUR)+fz, a, b, h); }
function quadX(fx,fy0,fy1,z0,z1,c,l){ const zb = zOf(CUR); return wqX(fx*UX, fy0*UY, fy1*UY, zb+z0, zb+z1, c, l); }
function quadY(fy,fx0,fx1,z0,z1,c,l){ const zb = zOf(CUR); return wqY(fy*UY, fx0*UX, fx1*UX, zb+z0, zb+z1, c, l); }
function quadZ(fz,fx0,fx1,fy0,fy1,c,l){ return wqZ(zOf(CUR)+fz, fx0*UX, fx1*UX, fy0*UY, fy1*UY, c, l); }
const wallL = (fy0,fy1,z0,z1,c,l) => quadX(0,fy0,fy1,z0,z1,c,l);
const wallR = (fx0,fx1,z0,z1,c,l) => quadY(0,fx0,fx1,z0,z1,c,l);
/* โซนบัง: พื้น(+slab)ของชั้นบนบังจุด (fx,fy,fz) เมื่อ fx*UX+d <= UX และ fy*UY+d <= UY พร้อมกัน, d = (FH-SLAB-fz)/2 */
function visible(fx,fy,fz=0){ if (CUR >= 5 || CUR < 1) return true; const d = (FH - SLAB - fz)/2; return fx*UX + d > UX || fy*UY + d > UY; }
function hiddenEdge(fz=0){ const d = (FH - SLAB - fz)/2; return {fx: Math.max(0, 1 - d/UX), fy: Math.max(0, 1 - d/UY)}; }
function pool(fx,fy,rx,ry,c=PAL.warm,a=.22){
  const zb = zOf(CUR); const [cx,cy] = WP(fx*UX, fy*UY, zb);
  emit(() => {
    const a0 = ctx.globalAlpha; ctx.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++){
      const k = 1-(dy/ry)**2, hw = Math.floor(rx*Math.sqrt(Math.max(0,k)));
      for (let dx = -hw; dx <= hw; dx++){
        const sx = cx+dx, sy = cy+dy, uu = (sx-OX)/2, v = sy-OY+zb, x = (v+uu)/2, y = (v-uu)/2;
        if (x < 0.5 || y < 0.5 || x > UX-0.5 || y > UY-0.5) continue;
        const inner = (dx*dx)/(rx*rx)+(dy*dy)/(ry*ry) < .35;
        if (inner || ((sx+sy)&1) === 0){ ctx.globalAlpha = a0*(inner ? a*.9 : a); ctx.fillRect(sx,sy,1,1); }
      }
    }
    ctx.globalAlpha = a0;
  });
}

/* ============================== SPRITES ============================== */
const sprCache = new WeakMap();
function sprFrames(spr){ return (spr && spr.frames && spr.frames.length) ? spr.frames : (spr && spr.rows ? [spr.rows] : null); }
function sprRaw(spr){ const f = sprFrames(spr); if (!f) return {w:8,h:12}; return {w: spr.w || Math.max(...f[0].map(r => r.length)), h: spr.h || f[0].length}; }
function sprSize(spr){ const r = sprRaw(spr), k = sprScale(spr); return k === 1 ? r : {w: r.w*k, h: r.h*k}; }   // ขนาดบนจอ (รวม PEOPLE_SCALE)
function sprCanvas(spr, frame, flip, dim){
  const frames = sprFrames(spr); if (!frames) return null;
  let m = sprCache.get(spr); if (!m){ m = new Map(); sprCache.set(spr, m); }
  const fi = (((frame|0) % frames.length) + frames.length) % frames.length;
  const key = fi + '|' + (flip ? 1 : 0) + '|' + dim;
  let c = m.get(key); if (c) return c;
  const rows = frames[fi] || [], {w,h} = sprRaw(spr), pal = spr.pal || {};
  c = mk(w,h); const g = c.getContext('2d');
  for (let j = 0; j < Math.min(h, rows.length); j++){
    const row = rows[j] || '';
    for (let i = 0; i < Math.min(w, row.length); i++){
      const ch = row[i]; if (ch === '.' || ch === ' ') continue;
      let cc = pal[ch]; if (!cc) continue; if (dim) cc = dimHex(cc);
      g.fillStyle = cc; g.fillRect(flip ? w-1-i : i, j, 1, 1);
    }
  }
  m.set(key, c); return c;
}
function missingSprite(g,x,y){
  x = Math.round(x); y = Math.round(y);
  g.fillStyle = PAL.ol; g.fillRect(x-4, y-12, 8, 12); g.fillStyle = '#ff4fd8'; g.fillRect(x-3, y-11, 6, 10);
  g.fillStyle = PAL.ol; g.fillRect(x-1, y-9, 2, 1); g.fillRect(x+1, y-8, 1, 2); g.fillRect(x, y-6, 1, 1); g.fillRect(x, y-4, 1, 1);
}
/* รอบ 4: ตัวละครใหญ่ขึ้น — sprite ทุกตัวใน window.SPR_PEOPLE ถูกขยาย Core.PEOPLE_SCALE เท่า (จำนวนเต็ม, nearest-neighbour)
   anchor ยังเป็นกลางล่าง → ไฟล์ชั้นไม่ต้องแก้พิกัด · spriteBBox/sprSize คืนขนาดที่ขยายแล้ว (hit box + bubble ตามเอง) */
const PEOPLE = new Set();
function collectPeople(){ PEOPLE.clear(); const P = window.SPR_PEOPLE || {}; for (const k in P){ const v = P[k]; if (v && typeof v === 'object' && (v.frames || v.rows)) PEOPLE.add(v); } }
const sprScale = spr => (spr && PEOPLE.has(spr)) ? Math.max(1, Math.round(Core.PEOPLE_SCALE) || 1) : 1;
function drawSpritePx(g, spr, x, y, frame=0, flip=false){
  g = g || ctx;
  const c = spr ? sprCanvas(spr, frame, flip, (DIM && !EMIT) ? 1 : 0) : null;
  if (!c){ missingSprite(g,x,y); return; }
  const k = sprScale(spr), cw = c.width*k, ch = c.height*k;
  const an = spr.anchor || 'bottom-center';
  let dx, dy;
  if (an === 'top-left'){ dx = x; dy = y; }
  else if (an === 'center'){ dx = x - Math.floor(cw/2); dy = y - Math.floor(ch/2); }
  else { dx = x - Math.floor(cw/2); dy = y - ch; }
  if (k === 1) g.drawImage(c, Math.round(dx), Math.round(dy));
  else { g.imageSmoothingEnabled = false; g.drawImage(c, Math.round(dx), Math.round(dy), cw, ch); }
}
/* drawSprite รับได้ 2 แบบ: (spr,fx,fy,frame,flip,fz)  หรือ  (ctx,spr,x,y,frame,flip) */
function drawSprite(a, ...r){
  if (a && typeof a.drawImage === 'function') return drawSpritePx(a, ...r);
  const [fx, fy, frame=0, flip=false, fz=0] = r; const p = iso(fx, fy, fz);
  return drawSpritePx(ctx, a, p.x, p.y, frame, flip);
}
function spriteBBox(spr, fx, fy, fz=0){ const p = iso(fx,fy,fz), {w,h} = sprSize(spr); return {x:Math.round(p.x - Math.floor(w/2)), y:Math.round(p.y - h), w, h}; }
const anim = (n, fps=4, off=0) => Math.floor(S.t*fps + off) % Math.max(1,n);

/* ============================== TEXT ============================== */
const F35 = {
  A:'.#. #.# ### #.# #.#', B:'##. #.# ##. #.# ##.', C:'.## #.. #.. #.. .##', D:'##. #.# #.# #.# ##.',
  E:'### #.. ##. #.. ###', F:'### #.. ##. #.. #..', G:'.## #.. #.# #.# .##', H:'#.# #.# ### #.# #.#',
  I:'### .#. .#. .#. ###', J:'..# ..# ..# #.# .#.', K:'#.# #.# ##. #.# #.#', L:'#.. #.. #.. #.. ###',
  M:'#.# ### ### #.# #.#', N:'##. #.# #.# #.# #.#', O:'.#. #.# #.# #.# .#.', P:'##. #.# ##. #.. #..',
  Q:'.#. #.# #.# ##. .##', R:'##. #.# ##. #.# #.#', S:'.## #.. .#. ..# ##.', T:'### .#. .#. .#. .#.',
  U:'#.# #.# #.# #.# ###', V:'#.# #.# #.# #.# .#.', W:'#.# #.# ### ### #.#', X:'#.# #.# .#. #.# #.#',
  Y:'#.# #.# .#. .#. .#.', Z:'### ..# .#. #.. ###',
  '0':'### #.# #.# #.# ###', '1':'.#. ##. .#. .#. ###', '2':'##. ..# .#. #.. ###', '3':'##. ..# .#. ..# ##.',
  '4':'#.# #.# ### ..# ..#', '5':'### #.. ##. ..# ##.', '6':'.## #.. ### #.# ###', '7':'### ..# .#. .#. .#.',
  '8':'### #.# ### #.# ###', '9':'### #.# ### ..# ##.',
  ' ':'... ... ... ... ...', '.':'... ... ... ... .#.', ':':'... .#. ... .#. ...', '-':'... ... ### ... ...',
  '+':'... .#. ### .#. ...', '/':'..# ..# .#. #.. #..', '!':'.#. .#. .#. ... .#.', '?':'##. ..# .#. ... .#.',
  '%':'#.# ..# .#. #.. #.#', '$':'.## ##. .#. .## ##.', '↑':'.#. ### .#. .#. .#.', '↓':'.#. .#. .#. ### .#.',
  '(':'.#. #.. #.. #.. .#.', ')':'.#. ..# ..# ..# .#.', ',':'... ... ... .#. #..', "'":'.#. .#. ... ... ...',
  '*':'... #.# .#. #.# ...', '=':'... ### ... ### ...', '<':'..# .#. #.. .#. ..#', '>':'#.. .#. ..# .#. #..',
  '#':'#.# ### #.# ### #.#', '_':'... ... ... ... ###'
};
function glyphRows(str){
  const rows = ['','','','',''];
  [...String(str).toUpperCase()].forEach((ch,k) => { const g = (F35[ch] || F35['?']).split(' '); for (let j = 0; j < 5; j++) rows[j] += (k ? '.' : '') + g[j]; });
  return rows.map(r => r.replace(/#/g,'X'));
}
const maskCache = new Map();
function maskCanvas(key, rows, color, scale, shear){
  const k = key+'|'+color+'|'+scale+'|'+shear;
  let c = maskCache.get(k); if (c) return c;
  if (maskCache.size > 800) maskCache.clear();
  const w = Math.max(1, (rows[0] || '').length*scale), h = rows.length*scale, ex = shear ? Math.floor((w-1)/2) : 0;
  c = mk(w, h+ex); const g = c.getContext('2d'); g.fillStyle = color;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++){
    if (rows[j][i] !== 'X') continue;
    for (let s = 0; s < scale; s++){ const X = i*scale+s; const off = shear > 0 ? Math.floor(X/2) : shear < 0 ? Math.floor((w-1-X)/2) : 0; g.fillRect(X, j*scale+off, 1, scale); }
  }
  c._ex = ex; maskCache.set(k, c); return c;
}
function text(str,x,y,c=PAL.cream,o={}){
  const scale = o.scale || 1, shear = o.shear || 0, rows = glyphRows(str);
  const m = maskCanvas('T:'+str, rows, col(c), scale, shear);
  ctx.drawImage(m, Math.round(x), Math.round(y) - (shear < 0 ? m._ex : 0));
  return rows[0].length*scale;
}
const textWidth = (str, scale=1) => (String(str).length*4 - 1)*scale;
const jpRows = new Map();
function jpMask(str,size,thr=110){
  const k = str+'|'+size; if (jpRows.has(k)) return jpRows.get(k);
  const c = mk(4,4), g = c.getContext('2d'), font = `${size}px "DotGothic16", "MS Gothic", monospace`;
  g.font = font; const w = Math.max(2, Math.ceil(g.measureText(str).width) + 2);
  c.width = w; c.height = size + 6; g.font = font; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText(str, 1, 1);
  const d = g.getImageData(0,0,w,size+6).data; let rows = [];
  for (let y = 0; y < size+6; y++){ let r = ''; for (let x = 0; x < w; x++) r += d[(y*w+x)*4+3] > thr ? 'X' : '.'; rows.push(r); }
  while (rows.length > 1 && !rows[0].includes('X')) rows.shift();
  while (rows.length > 1 && !rows[rows.length-1].includes('X')) rows.pop();
  let l = 0, r = rows[0].length-1;
  while (l < r && rows.every(q => q[l] === '.')) l++;
  while (r > l && rows.every(q => q[r] === '.')) r--;
  rows = rows.map(q => q.slice(l, r+1));
  jpRows.set(k, rows); return rows;
}
function textJP(str,size,x,y,c=PAL.cream,shear=0){
  const rows = jpMask(String(str), size);
  const m = maskCanvas('J:'+str+'|'+size, rows, col(c), 1, shear);
  ctx.drawImage(m, Math.round(x), Math.round(y) - (shear < 0 ? m._ex : 0));
  return {w: rows[0].length, h: rows.length};
}

/* ============================== TIME / LIGHT ============================== */
const isDark = (n=CUR) => !lights[n] && time.phase !== 'morning';
const lit = (n=CUR) => !!lights[n] && time.phase !== 'morning';
function setPhase(p){
  if (!PHASES.includes(p)) return;
  const changed = p !== time.phase;
  time.phase = p; time.sec = 0; time.t = 0;
  if (changed){ fire('phase', p); log('เวลา → '+({morning:'เช้า 朝',evening:'เย็น 夕',night:'กลางคืน 夜'})[p]); }
}
function pause(b){ time.paused = (b === undefined) ? !time.paused : !!b; fire('pause', time.paused); }
function updateTime(dt){
  if (time.paused) return;
  time.sec += dt;
  if (time.sec >= PHASE_SEC){ const nx = PHASES[(PHASES.indexOf(time.phase)+1) % 3]; const rest = time.sec - PHASE_SEC; setPhase(nx); time.sec = Math.min(rest, PHASE_SEC-0.01); }
  time.t = time.sec / PHASE_SEC;
}

/* ============================== BACKGROUND (cache ต่อ phase) ============================== */
const BG = {}; const STARS = []; const BLINKS = [];
const BAYER = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function skyBands(bands){
  for (let i = 0; i < bands.length; i++){ const y0 = bands[i][0], y1 = i+1 < bands.length ? bands[i+1][0] : H; rect(0, y0, W, y1-y0, bands[i][1]); }
  for (let i = 1; i < bands.length; i++){
    const b = bands[i][0], cA = bands[i-1][1], cB = bands[i][1];
    for (let r = -6; r < 6; r++){ const yy = b+r, f = (r+6.5)/12;
      for (let x = 0; x < W; x++){ const useB = (BAYER[yy&3][x&3]+.5)/16 < f; const want = useB ? cB : cA, cur = r < 0 ? cA : cB; if (want !== cur) px(x, yy, want); } }
  }
}
function cloud(x,y,w,c,cs){
  const r = rng(x*7+y);
  const blobs = []; let cx = x;
  while (cx < x+w){ const rr = 4 + Math.floor(r()*6); blobs.push([cx, y - Math.floor(r()*4), rr]); cx += rr + 2; }
  for (const [bx,by,rr] of blobs) ellipse(bx, by, rr+1, Math.ceil(rr*.6)+1, cs);
  for (const [bx,by,rr] of blobs) ellipse(bx, by-1, rr, Math.ceil(rr*.6), c);
  rect(x-2, y+2, w+4, 2, cs);
}
/* ---------- ฟูจิ (รอบ 3 วาดใหม่) ----------
   - ทรงลาดเว้า (ชันใกล้ยอด ลาดออกที่ฐาน) ไม่สมมาตร: ซ้ายลาดยาวกว่า ขวาชันกว่า + ไหล่ Hōei-zan
   - ยอดแบนมีปากปล่อง (หยัก 1px) · หิมะขอบล่างเป็น "นิ้ว" ไหลตามร่องเขา (แนวรัศมี) + ขอบเข้ม 1px
   - แสง 2-3 โทนต่อด้าน (ด้านรับแสง/ด้านเงา/ร่อง) · ฐานเขาจางเข้าหมอกด้วย dither (ไม่มี gradient/blur)
   - วาดลง ImageData ตรง ๆ → pixel ล้วน, cache ต่อ phase                                             */
const FUJI_CRATER = [1,1,0,0,0,1,1,0,0,0,0,1,1,2,1,1,0,0,0,0,0,1,0,0,0,1,1];   // d = -13..13 → ต่ำกว่ายอดกี่ px
function fujiRidge(d){
  const ad = Math.abs(d), FLAT = 13;
  if (ad <= FLAT) return FUJI_TOP + FUJI_CRATER[Math.round(d) + FLAT];
  const left = d < 0, L = left ? 470 : 395, s0 = left ? 0.94 : 1.03;
  const t = ad - FLAT, te = t < 8 ? t*t/16 : t - 4;                        // ไหล่ยอดโค้งมน
  let y = FUJI_TOP + 1 + s0*L*(1 - Math.exp(-te/L));                        // ลาดเว้า
  if (!left){ const q = (t - 132)/48; if (q > 0 && q < 1) y -= 4*Math.sin(Math.PI*q)**2; }   // ไหล่ Hōei-zan (ขวา)
  return y;
}
const hash2 = (x,y) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function drawFuji(g, P){
  const cx = FUJI_CX, top = FUJI_TOP, APEX = 64, SB = 70, BOT = 440, lightL = !!P.lightL;
  // นิ้วหิมะ (len>0) + สันหินแทรกขึ้นในหิมะ (len<0) — พิกัด u = แนวรัศมีจากจุดเหนือยอด
  const r = rng(31337), fingers = [];
  for (let c = -1.1; c <= 1.1; ){
    const big = r() < .3;
    fingers.push([c, big ? 24 + r()*30 : 6 + r()*15, big ? .010 + r()*.010 : .014 + r()*.018]);
    if (r() < .55) fingers.push([c + .02 + r()*.018, -(4 + r()*12), .007 + r()*.009]);
    c += .045 + r()*.05;
  }
  const gullies = fingers.filter(f => f[1] > 12).map(f => f[0]);   // ร่องใหญ่: มีเส้นเงาในหิมะ + ร่องหินต่อลงไป
  const minor = fingers.filter(f => f[1] > 0 && f[1] <= 12).map(f => f[0] + .006);   // ร่องเล็ก: ลายลมบนหิมะ (จาง ๆ)
  const snowY = u => {
    let m = 0, n = 0;
    for (const [c,len,w] of fingers){ const k = 1 - Math.abs(u-c)/w; if (k > 0){ if (len > 0) m = Math.max(m, len*k); else n = Math.min(n, len*k); } }
    return top + SB + 22*Math.abs(u) + 5*Math.sin(u*11 + 1.3) + m + n;
  };
  // แสง: ความสว่างตามทิศของลาด (u ≈ ทิศรอบกรวย) → ไล่ 4 โทน, รอยต่อโทนเป็น checker 1px (pixel ล้วน)
  const RR = [P.rD, P.rS, P.rM, P.rL], SR = [P.sD, P.sS, P.sM, P.sL], [LB, LG] = P.lightK;
  // รอยต่อโทน: 75% แรกของช่วงเป็นสีเดียว แล้วค่อย ๆ ผสม 25% → checker → สีถัดไป (dither แคบ ไม่เป็นลายทั้งผืน)
  const dstep = (f, x, y) => f > .93 || (f > .84 && ((x + y) & 1) === 0) || (f > .74 && (x & 1) === 0 && (y & 1) === 0);
  const tone = (ramp, b, x, y, dk) => {
    const t = Math.max(0, Math.min(1, b))*(ramp.length - 1); let i = Math.floor(t); const f = t - i;
    if (dstep(f, x, y)) i++;
    return ramp[Math.max(0, Math.min(ramp.length - 1, i - (dk || 0)))];
  };
  const img = g.getImageData(0, 0, W, BOT), D = img.data;
  const rgbC = new Map(), rgb = c => { let v = rgbC.get(c); if (!v){ v = hexRGB(c); rgbC.set(c, v); } return v; };
  const hzC = new Map(), hz = (c, lv) => { if (!lv) return c; const k = c+lv; let v = hzC.get(k); if (!v){ v = mix(c, P.haze, lv*.17); hzC.set(k, v); } return v; };
  const HZ0 = 176, HZ1 = 300;
  for (let x = 0; x < W; x++){
    const y0 = Math.round(fujiRidge(x - cx));
    for (let y = Math.max(0, y0); y < BOT; y++){
      const den = y - top + APEX, u = (x - cx)/den, sy = snowY(u), chk = ((x + y) & 1) === 0;
      const ub = u + 0.03*Math.sin(u*41 + y*0.045);                    // สันเล็ก ๆ ทำให้รอยต่อแสงเป็นลอน
      const bri = LB + LG*(lightL ? -ub : ub);
      let gd = 99; for (const c of gullies){ const q = Math.abs(u - c)*den; if (q < gd) gd = q; }
      const gl = gd < 0.7, dep = y - y0, ab = sy - y;                  // ab = ระยะเหนือแนวหิมะ
      const glS = gl && dep > 10 && ab < 34 && hash2(x, y) < 1.15 - ab/34;   // เส้นร่องในหิมะ: เฉพาะช่วงล่าง ขาด ๆ
      let c;
      if (y < sy){                                                     // ---- หิมะ
        let mn = false;
        if (!glS && dep > 16 && ab > 4){ for (const c2 of minor) if (Math.abs(u - c2)*den < 0.6){ mn = hash2(x, y) < .45; break; } }
        if (bri > .55 && (dep < 1 || (dep < 3 && chk))) c = P.sHi;     // ขอบสันรับแสง
        else c = tone(SR, bri, x, y, (glS || mn) ? 1 : 0);
      } else if (y < sy + 1){ c = P.rE; }                              // ขอบล่างหิมะเข้ม 1px (ギザギザ)
      else {                                                           // ---- หิน
        const b = y - sy, hsh = hash2(x, y);
        if (gd < 1.2 && b < 30 && hsh < 0.8 - b/36) c = tone(SR, bri - .25, x, y);          // หิมะหลงในร่อง (ไหลเป็นจุด)
        else if (b < 6 && hsh < 0.2 - b*0.03) c = tone(SR, bri - .25, x, y);                // เกล็ดใต้แนวหิมะ
        else if (dep < 1 && bri > .62) c = P.rim;                                           // ขอบเขาด้านรับแสง (rim light)
        else c = tone(RR, bri, x, y, (gl && b < 70 && hsh < 1 - b/70) ? 1 : 0);             // หิน (+ร่องเข้มขึ้น 1 โทน)
      }
      if (y > HZ0){ const t = Math.min(1, (y - HZ0)/(HZ1 - HZ0))*3; let lv = Math.floor(t); if (dstep(t - lv, x, y)) lv++; c = hz(c, Math.min(3, lv)); }
      const v = rgb(c), i = (y*W + x)*4; D[i] = v[0]; D[i+1] = v[1]; D[i+2] = v[2]; D[i+3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  // แถบเมฆบาง ๆ พาดลาดเขา
  for (const [x,y,w,sd] of [[cx-200,150,118,1],[cx+46,174,146,2],[cx-330,214,200,3],[cx+176,236,160,4]]) cloudBand(x, y, w, P, sd);
}
function cloudBand(x, y, w, P, seed){          // เมฆแผ่นบางพาดเขา: ก้อนแบน ๆ ต่อกัน (เงาล่าง/ตัว/ไฮไลต์บน)
  const r = rng(seed*97 + 5); let sx = x;
  while (sx < x + w){
    const L = 10 + Math.floor(r()*22), yy = y + Math.floor(r()*4) - 2, th = r() < .55 ? 2 : 3, mx = Math.round(sx + L/2);
    ellipse(mx, yy + 1, Math.round(L/2) + 1, th, P.cloudSh);
    ellipse(mx, yy, Math.round(L/2), th - 1, P.cloudM);
    rect(sx + 3, yy - th + 1, Math.max(1, L - 6), 1, P.cloud);
    sx += Math.floor(L*0.7) + (r() < .25 ? 6 + Math.floor(r()*10) : 0);
  }
}
function hillLayer(y0, amp, fr, ph, c, soft, tree, seed){
  const r = rng(seed); let bump = 0;
  for (let x = 0; x < W; x++){
    if (tree && x % 3 === 0) bump = Math.floor(r()*3);
    const y = Math.round(y0 + amp*Math.sin(x*fr + ph) + amp*.45*Math.sin(x*fr*2.7 + ph*1.7)) - (tree ? bump : 0);
    rect(x, y, 1, H - y, c);
    if (soft && (x & 1) === 0) px(x, y - 1, c);
  }
}
/* ---------- รอบ 4: ป่าญี่ปุ่นสไตล์อนิเมะ + ศาลเจ้า งานปีใหม่ (初詣) + ลม — ฉากหลังเท่านั้น ไม่มี object ให้คลิก ----------
   ชั้นความลึก (canvas y, ไกล→ใกล้)  — สีไล่หมอก (atmospheric perspective): ไกล = ฟ้าเทาหม่น, ใกล้ = เขียวเข้มอิ่ม
     L0 ไกลสุด  ฐาน 352  ต้นเตี้ยกลม ๆ ปนยอดแหลมห่าง ๆ              (cache: sky)
     L1 ไกล    ฐาน 408  สลับยอดแหลม/พุ่มกลม                       (cache: sky)
     L2 กลาง   ฐาน 470 + แถวรอง 506 ยอดแหลมซีดาร์เด่น + เจดีย์        (cache: mid — โยกตามลมเบา ๆ)
     L3 ใกล้   ฐาน 628 พุ่มกลมใหญ่ + ซีดาร์ เห็นลำต้น ขอบดำ             (cache: near — โยกตามลม)
     ศาลเจ้า (cache: front): บันไดหินจากโทริอิขึ้นไปในป่า · ศาลหลักบนลานหิน + บันได · แผงลอย · สายโคม
     แถบหมอกบาง 1-2 px (dither) คั่นทุกชั้น · แสงขอบ: เช้า = เย็นฟ้าจากซ้าย · เย็น = rim ส้มจากขวา · คืน = ขอบแสงจันทร์ประปราย + หิมะบนยอด
   ของที่ขยับ (วาดทุกเฟรมทับ cache): เมฆลอย · นก · พลุ · ยอดไม้โยก · ธง 初詣/奉納 · ผ้า 謹賀新年 · โคมบนสาย · 紙垂 โทริอิ · ควันแผงลอย      */
const LAYER_F = [.64, .44, .2, 0];          // สัดส่วนผสมหมอกต่อชั้น
function fcol(P, k){ const f = LAYER_F[k]; return { c:mix(P.fNear, P.fHaze, f), sh:mix(P.fNearSh, P.fHaze, f), hi:mix(P.fNearHi, P.fHaze, f*1.1), snow:(P.fSnow && k >= 2) ? mix(P.fSnow, P.fHaze, f*.6) : null }; }
function spire(x, base, h, w, C, P, r, hiOn){        // ซีดาร์/ฮิโนกิ: ยอดแหลมสูง ขอบเป็นชั้นนุ่ม ๆ
  x = Math.round(x); base = Math.round(base);
  const L = P.lightDir, top = base - h;
  px(x, top - 1, C.c);
  for (let dy = 0; dy < h; dy++){
    const t = (dy + 1)/h, notch = (dy % 7 === 6) ? 1 : 0;
    const hw = Math.max(0, Math.round((w/2)*Math.pow(t, .8)) - notch), y = top + dy;
    rect(x - hw, y, 2*hw + 1, 1, C.c);
    // ด้านเงา (ฝั่งตรงข้ามแสง) + รอยต่อ dither 1 px
    const s0 = L < 0 ? x + 1 : x - hw, s1 = L < 0 ? x + hw : x - 1;
    if (s1 >= s0){ rect(s0, y, s1 - s0 + 1, 1, C.sh); if ((dy & 1) === 0) px(L < 0 ? x + 1 : x - 1, y, C.c); }
    if (hiOn && hw > 0 && (dy % 7) >= 1 && (dy % 7) <= 3){ px(L < 0 ? x - hw : x + hw, y, C.hi); if ((dy % 7) === 2 && hw > 2) px(L < 0 ? x - hw + 1 : x + hw - 1, y, C.hi); }
    if (C.snow && (dy < 2 || ((dy % 7) === 0 && hw > 1 && r() < .4))) rect(dy < 2 ? x - Math.min(hw, 1) : (L < 0 ? x - hw : x + 1), y, dy < 2 ? Math.min(2*hw + 1, 3) : Math.min(hw, 2), 1, C.snow);
  }
}
function dome(x, base, h, w, C, P, r, hiOn){         // ไม้ใบกว้าง: พุ่มกลมซ้อนกันแบบดอกกะหล่ำ
  x = Math.round(x); base = Math.round(base);
  const L = P.lightDir, rx = Math.max(3, Math.round(w/2)), ry = Math.max(3, Math.round(h/2));
  const puffs = [[0, -ry, rx, ry]];
  const n = 2 + Math.floor(r()*3);
  for (let i = 0; i < n; i++){ const a = (i/(n - 1 || 1) - .5)*1.6; puffs.push([Math.round(a*rx*.7), -Math.round(ry*(1.1 + r()*.35)), Math.round(rx*(.42 + r()*.18)), Math.round(ry*(.45 + r()*.15))]); }
  puffs.sort((a, b) => (b[1] - a[1]));                                    // ล่าง → บน (บนทับล่าง)
  for (const [dx, dy, prx, pry] of puffs){
    const cx = x + dx, cy = base + dy;
    ellipse(cx, cy, prx, pry, C.sh);                                     // เงาเต็มพุ่ม
    if (hiOn) ellipse(cx + L, cy - 1, Math.max(1, prx - 1), Math.max(1, pry - 1), C.hi);   // เสี้ยวรับแสง (ขอบด้านแสง)
    ellipse(cx + (hiOn ? 0 : L), cy + (hiOn ? 0 : -1), Math.max(1, prx - 1), Math.max(1, pry - 1), C.c);
    if (hiOn && prx > 4){ const hx = cx + L*Math.round(prx*.4), hy = cy - Math.round(pry*.45); px(hx, hy, C.hi); px(hx - L, hy - 1, C.hi); }
    if (C.snow && dy < -ry) rect(cx - Math.round(prx*.5), cy - pry, Math.max(1, prx), 1, C.snow);
  }
}
function forestRow(k, base, n0, hMin, hMax, gap, pSpire, P, seed, o){
  o = o || {}; const C = fcol(P, k), r = rng(seed);
  const yb = x => Math.round(base + 2*Math.sin(x*.045 + seed) + 1.5*Math.sin(x*.12 + seed*2));
  if (o.fill !== false) for (let x = 0; x < W; x++){ const y = yb(x); rect(x, y, 1, (o.fillTo || H) - y, C.c); }
  const trees = [];
  for (let x = -8; x < W + 10; x += gap*(.6 + r()*.8)){
    const sp = r() < pSpire, h0 = hMin + r()*(hMax - hMin), hh = sp ? h0 : h0*.7, ww = sp ? hh*(.3 + r()*.12) : hh*(.62 + r()*.3), seedT = r();
    if (o.skip && o.skip(x)) continue;
    let h = hh; if (o.cap) h = Math.min(h, o.cap(x));
    trees.push({x, sp, h:Math.round(h), w:Math.round(ww*(h/hh)), s:seedT, tr: o.trunk ? Math.round((sp ? 3 : 7) + r()*(sp ? 4 : 8)) : 0});
  }
  trees.sort((a, b) => b.h - a.h);                                        // ต้นสูงอยู่หลัง ต้นเตี้ยทับหน้า → มีมิติ
  for (const t of trees){
    const rr = rng(Math.floor(t.s*1e6) + 7), hiOn = P.hiAll || rr() < .35;
    const b = yb(t.x) + 2 - t.tr;
    if (t.tr){ const tc = P.trunk; rect(t.x - 1, b - 2, 3, t.tr + 3, tc); rect(t.x + (P.lightDir < 0 ? 1 : -1), b - 2, 1, t.tr + 3, shade(tc, .7)); }
    (t.sp ? spire : dome)(t.x, b, t.h, t.w, C, P, rr, hiOn);
  }
}
function mistBand(y, w0, w1, c, a){                   // หมอกบาง 1-2 px แบบ dither
  const g = ctx.globalAlpha;
  ctx.globalAlpha = a; for (let x = w0; x < w1; x += 2) px(x + (y & 1), y, c);
  ctx.globalAlpha = a*.75; rect(w0, y + 1, w1 - w0, 1, c);
  ctx.globalAlpha = a*.5; for (let x = w0; x < w1; x += 2) px(x + ((y + 1) & 1), y + 2, c);
  ctx.globalAlpha = g;
}
function outlineCanvas(c, col){                       // ขอบดำ 1 px รอบซิลูเอตต์ (ชั้นใกล้สุดเท่านั้น)
  const g = c.getContext('2d'), w = c.width, h = c.height, im = g.getImageData(0, 0, w, h), d = im.data, A = new Uint8Array(w*h), rgbv = hexRGB(col);
  for (let i = 0; i < w*h; i++) A[i] = d[i*4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = y*w + x; if (A[i]) continue;
    if ((x > 0 && A[i - 1]) || (x < w - 1 && A[i + 1]) || (y > 0 && A[i - w]) || (y < h - 1 && A[i + w])){ d[i*4] = rgbv[0]; d[i*4 + 1] = rgbv[1]; d[i*4 + 2] = rgbv[2]; d[i*4 + 3] = 255; }
  }
  g.putImageData(im, 0, 0);
}
function stoneLantern(x, base, P, lit){   // 灯籠
  const st = P.stone, sd = shade(P.stone, .72);
  orect(x - 4, base - 3, 9, 3, sd); orect(x - 1, base - 11, 3, 8, st);
  orect(x - 3, base - 13, 7, 2, sd);
  orect(x - 3, base - 19, 7, 6, st);
  if (lit) glowRect(x - 1, base - 17, 3, 3, '#ffcf6a'); else rect(x - 1, base - 17, 3, 3, PAL.ol);
  fillPoly([[x - 5, base - 19], [x, base - 24], [x + 6, base - 19]], sd); rect(x - 5, base - 20, 11, 1, PAL.ol);
  px(x, base - 25, sd);
}
function chochin(x, y, lit, c){            // โคมกระดาษเล็ก 3x4 บนสายโคม
  c = c || PAL.red;
  if (lit) emit(() => { ctx.globalAlpha = .22*lit; rect(x - 2, y - 1, 7, 7, '#ff9a4a'); ctx.globalAlpha = 1; });
  rect(x, y, 3, 4, lit ? mix(c, '#ffd37a', .25) : shade(c, .8)); rect(x, y + 1, 3, 1, lit ? '#fff2c8' : '#e8dcc0');
  px(x + 1, y - 1, PAL.ol); px(x + 1, y + 4, PAL.ol);
}
function lanternString(x0, y0, x1, y1, sag, step, P, alt, out){   // สาย (cache) + จุดโคม (out → วาดทุกเฟรมตามลม)
  const n = Math.max(2, Math.round((x1 - x0)/2));
  let prev = null;
  for (let i = 0; i <= n; i++){
    const t = i/n, x = x0 + (x1 - x0)*t, y = y0 + (y1 - y0)*t + 4*sag*t*(1 - t);
    if (prev) line(prev[0], prev[1], x, y, P.cord); prev = [x, y];
  }
  for (let x = x0 + step/2, k = 0; x < x1 - 1; x += step, k++){
    const t = (x - x0)/(x1 - x0), y = y0 + (y1 - y0)*t + 4*sag*t*(1 - t);
    out.push([Math.round(x) - 1, Math.round(y) + 1, alt && k % 2 ? '#f6f8fc' : PAL.red, out.length]);
  }
}
const TORII = {cx:66, base:640};
function toriiShide(){ const {cx} = TORII, top = TORII.base - 72; return [cx - 12, cx, cx + 12].map(x => [x, top + 15 + Math.round(3*Math.sin(Math.PI*(x - cx + 22)/44))]); }
function torii(P){
  const {cx, base} = TORII, R = P.red, RS = P.redSh, K = '#1c1218';
  for (const x of [cx - 28, cx + 24]){                                    // เสา 2 ต้น (ฐานดำ 根巻)
    rect(x - 1, base - 66, 6, 66, PAL.ol); rect(x, base - 66, 4, 66, R); rect(x + 3, base - 66, 1, 66, RS); rect(x - 1, base - 6, 6, 6, K);
  }
  orect(cx - 34, base - 52, 68, 4, R); rect(cx - 33, base - 49, 66, 1, RS);   // นุกิ
  orect(cx - 3, base - 63, 7, 11, R); rect(cx - 2, base - 62, 5, 9, K);         // 額
  emit(() => { px(cx, base - 60, '#ffd37a'); px(cx, base - 57, '#ffd37a'); });
  const top = base - 72;
  fillPoly([[cx - 46, top - 3], [cx - 38, top + 1], [cx + 38, top + 1], [cx + 46, top - 3], [cx + 44, top + 3], [cx - 44, top + 3]], R);
  rect(cx - 40, top + 3, 80, 3, R); rect(cx - 40, top + 5, 80, 1, RS);
  fillPoly([[cx - 47, top - 5], [cx - 38, top - 1], [cx + 38, top - 1], [cx + 47, top - 5], [cx + 46, top - 2], [cx - 46, top - 2]], K);
  polyOutline([[cx - 47, top - 5], [cx - 38, top - 1], [cx + 38, top - 1], [cx + 47, top - 5], [cx + 44, top + 6], [cx - 44, top + 6]], PAL.ol);
  for (let x = cx - 22; x <= cx + 22; x++){ const y = top + 13 + Math.round(3*Math.sin(Math.PI*(x - cx + 22)/44)); px(x, y, '#d8c27a'); px(x, y + 1, '#a8924a'); }   // 注連縄 (紙垂 วาดในชั้นลม)
}
function pagoda(cx, base, P){             // 五重塔
  const R = P.red, RS = P.redSh, roof = P.roof, rs = P.roofSh;
  let y = base;
  orect(cx - 16, y - 4, 32, 4, P.stone); y -= 4;
  for (let i = 0; i < 5; i++){
    const bw = Math.round(22 - i*2.5), rw = bw + 16 - i, bx = Math.round(cx - bw/2);
    orect(bx, y - 8, bw, 8, P.wallW); rect(bx + 1, y - 7, 1, 6, R); rect(bx + bw - 2, y - 7, 1, 6, R);
    rect(cx - 1, y - 6, 3, 5, P.lanLit ? '#ffcf6a' : RS);
    y -= 8;
    const L = Math.round(cx - rw/2), Rr = Math.round(cx + rw/2);
    const rp = [[L - 2, y - 1], [L + 4, y - 5], [Rr - 4, y - 5], [Rr + 2, y - 1], [Rr, y + 1], [L, y + 1]];
    fillPoly(rp, roof); rect(L, y, Rr - L, 1, rs); polyOutline(rp, PAL.ol);
    if (P.fSnow) rect(L + 4, y - 5, Rr - L - 8, 1, P.fSnow);
    y -= 5;
  }
  rect(cx - 1, y - 20, 2, 20, '#8a7a4a'); rect(cx, y - 20, 1, 20, '#c8a85a');
  for (let k = 0; k < 6; k++) rect(cx - 2, y - 4 - k*3, 5, 1, '#c8a85a');
  px(cx, y - 22, '#ffd37a');
}
const HALL = {x0:412, x1:516, base:626};
function hall(P){                          // 拝殿 บนลานหิน + บันได (ผ้า 謹賀新年 วาดในชั้นลม)
  const {x0, x1, base} = HALL, R = P.red, RS = P.redSh, roof = P.roof, rs = P.roofSh, rh = P.roofHi, w = x1 - x0, cx = Math.round((x0 + x1)/2);
  // ลานหินยกพื้น + บันไดกลาง
  orect(x0 - 10, base, w + 20, 14, P.stone);
  for (let y = base + 3; y < base + 14; y += 4) for (let x = x0 - 8 + ((y >> 2) & 1)*5; x < x1 + 8; x += 10) rect(x, y, 1, 3, shade(P.stone, .8));
  for (let i = 0; i < 5; i++){ const yy = base + 2 + i*3, hw = 12 + i*2; orect(cx - hw, yy, 2*hw, 4, shade(P.stone, 1.08 - i*.03)); }
  orect(x0 - 6, base - 6, w + 12, 6, P.stone); rect(x0 - 5, base - 5, w + 10, 1, shade(P.stone, 1.12));
  rect(x0, base - 32, w, 26, P.wallW);
  for (let k = 0; k < 4; k++){
    const dx = Math.round(x0 + 6 + k*(w - 8)/4), dw = Math.round((w - 8)/4) - 6;
    if (P.lanLit) glowRect(dx, base - 28, dw, 20, '#ffcf7a'); else rect(dx, base - 28, dw, 20, '#e8dcc0');
    for (let gx = dx + 3; gx < dx + dw; gx += 4) rect(gx, base - 28, 1, 20, P.lanLit ? '#c8803a' : '#8a6a4a');
    for (let gy = base - 25; gy < base - 8; gy += 5) rect(dx, gy, dw, 1, P.lanLit ? '#c8803a' : '#8a6a4a');
  }
  for (let k = 0; k <= 4; k++){ const x = Math.round(x0 + k*(w - 4)/4); rect(x - 1, base - 32, 5, 26, PAL.ol); rect(x, base - 32, 3, 26, R); rect(x + 2, base - 32, 1, 26, RS); }
  rect(x0 - 2, base - 34, w + 4, 3, R); rect(x0 - 2, base - 32, w + 4, 1, RS);
  const e = base - 34, top = base - 64;
  const roofP = [[x0 - 18, e - 5], [x0 - 6, e - 14], [x0 + 16, top + 6], [x0 + 22, top], [x1 - 22, top], [x1 - 16, top + 6], [x1 + 6, e - 14], [x1 + 18, e - 5], [x1 + 14, e], [x0 - 14, e]];
  fillPoly(roofP, roof);
  for (let x = x0 - 6; x < x1 + 6; x += 4){ const mid = (x0 + x1)/2; line(x, e - 2, x + (x < mid ? 4 : -4), e - 11, rs); }
  rect(x0 - 14, e - 2, w + 28, 2, rs); line(x0 - 18, e - 5, x0 - 6, e - 14, rh); line(x0 - 6, e - 14, x0 + 16, top + 6, rh);
  polyOutline(roofP, PAL.ol);
  orect(x0 + 18, top - 3, w - 36, 4, rs);
  if (P.fSnow){ rect(x0 + 19, top - 4, w - 38, 1, P.fSnow); line(x0 - 6, e - 15, x0 + 16, top + 5, P.fSnow); line(x1 + 6, e - 15, x1 - 16, top + 5, P.fSnow); }
  for (const x of [x0 + 18, x1 - 18]){ line(x - 3, top - 8, x + 3, top - 1, PAL.ol); line(x + 3, top - 8, x - 3, top - 1, PAL.ol); }
  for (let x = x0 + 8; x <= x1 - 8; x++){ const y = base - 30 + Math.round(3*Math.sin(Math.PI*(x - x0 - 8)/(w - 16))); px(x, y, '#d8c27a'); px(x, y + 1, '#a8924a'); }
  rect(cx - 2, base - 27, 5, 4, '#e0b040'); rect(cx, base - 23, 1, 12, '#d84a4a'); rect(cx + 1, base - 23, 1, 12, '#f6f8fc');
  for (const x of [x0 + 10, x1 - 16]){
    const lit = P.lanLit;
    if (lit) emit(() => { ctx.globalAlpha = .2; ellipse(x + 3, base - 22, 7, 8, '#ff8a4a'); ctx.globalAlpha = 1; });
    orect(x, base - 28, 7, 10, lit ? '#ff6a4a' : PAL.red); rect(x + 1, base - 25, 5, 1, '#1c1218'); rect(x + 1, base - 22, 5, 1, '#1c1218');
  }
}
const STALLS = [['たこ焼き','#d8363a'],['わたあめ','#e86aa8'],['金魚','#3a7ad8'],['焼きそば','#d8363a'],['りんご飴','#d8363a']];
function stall(x, base, w, k, P){          // 屋台
  const [name, cc] = STALLS[k % STALLS.length], lit = P.stallLit;
  rect(x, base - 30, 2, 30, PAL.ol); rect(x + w - 2, base - 30, 2, 30, PAL.ol);
  rect(x + 2, base - 23, w - 4, 11, lit ? '#ffcf7a' : shade(P.wallW, 1.3));
  if (lit) glowRect(x + 4, base - 22, w - 8, 3, '#fff2c8');
  const r = rng(k*17 + 3);
  for (let i = 0; i < (w - 8)/3; i++) px(x + 4 + i*3, base - 14, [PAL.red, '#ffd37a', '#7ad8ff', '#f6f8fc'][Math.floor(r()*4)]);
  orect(x + 1, base - 12, w - 2, 12, '#8a4b2a'); rect(x + 2, base - 11, w - 4, 1, '#b5703c');
  for (let i = 0; i < w; i += 4) rect(x + i, base - 31, Math.min(4, w - i), 8, (i/4) % 2 ? '#f6f8fc' : cc);
  for (let i = 0; i < w; i += 4) rect(x + i + 1, base - 23, 2, 1, (i/4) % 2 ? '#f6f8fc' : cc);
  rect(x - 1, base - 32, w + 2, 1, PAL.ol);
  orect(x + 3, base - 43, w - 6, 12, '#f6f0e0', PAL.ol);
  textJP(name, 9, x + 5, base - 41, cc);
  if (lit) emit(() => { px(x + Math.round(w/2), base - 22, '#ffffff'); ctx.globalAlpha = .18; rect(x - 3, base, w + 6, 3, '#ffcf7a'); ctx.globalAlpha = 1; });
}
const NOBORI = [[2, 594, '初詣'], [126, 596, '奉納']];
function crowd(P){
  const r = rng(777), kim = ['#d8363a','#3a7ad8','#e86aa8','#f6f8fc','#4f9a5a','#e0b040','#6a4a8a'];
  const zones = [[4, 136], [404, 516]];
  for (let i = 0; i < 26; i++){
    const z = zones[i % 2], x = Math.round(z[0] + r()*(z[1] - z[0])), y = Math.round(650 + r()*8), body = kim[Math.floor(r()*kim.length)];
    rect(x, y - 6, 3, 2, P.hair); rect(x, y - 4, 3, 4, P.lanLit ? shade(body, .75) : body); px(x + 1, y - 5, PAL.skin);
  }
}
function warmSpill(x, y, rx, ry, a){       // แสงโคมสาดลงต้นไม้รอบ ๆ (เย็น/คืน) — วงซ้อน 2 ชั้น ไม่ blur
  const g = ctx.globalAlpha; ctx.globalAlpha = a*.5; ellipse(x, y, rx, ry, '#ff9a4a'); ctx.globalAlpha = a; ellipse(x, y, Math.round(rx*.55), Math.round(ry*.55), '#ffb060'); ctx.globalAlpha = g;
}
function shrineFront(P, A){
  // ลานกรวด
  rect(0, 640, W, GY - 640, P.gravel);
  { const r = rng(91); for (let i = 0; i < 420; i++) px(Math.floor(r()*W), 640 + Math.floor(r()*(GY - 640)), P.gravelDot); }
  rect(0, 640, W, 1, shade(P.gravel, .8));
  if (P.lanLit){ warmSpill(66, 618, 44, 26, .10*P.lanLit); warmSpill(464, 604, 66, 34, .10*P.lanLit); warmSpill(68, 672, 76, 22, .08); warmSpill(462, 672, 64, 22, .08); }
  // บันไดหินจากโทริอิขึ้นไปในป่า (参道の石段) + โคมหินข้างบันได
  for (let i = 0; i < 9; i++){ const y = 638 - i*4, hw = 15 - i; orect(TORII.cx - hw, y, 2*hw, 4, shade(P.stone, 1.05 - i*.05), shade(P.stone, .62)); }
  stoneLantern(TORII.cx - 14, 606, P, P.lanLit); stoneLantern(TORII.cx + 14, 606, P, P.lanLit);
  // ทางเดินกรวดลงมาหน้าแผงลอย
  fillPoly([[52, 641], [80, 641], [92, GY], [40, GY]], shade(P.gravel, 1.12));
  for (let y = 646; y < GY; y += 6) line(52 - (y - 640)/5, y, 80 + (y - 640)/5, y, P.gravelDot);
  hall(P);
  torii(P);
  stoneLantern(14, 646, P, P.lanLit); stoneLantern(120, 646, P, P.lanLit);
  for (const [x, top] of NOBORI) rect(x - 1, top - 2, 1, 50, '#4a3a2a');                 // เสาธง (ผ้าวาดในชั้นลม)
  crowd(P);
  lanternString(0, 664, 136, 662, 6, 9, P, true, A.lan);
  lanternString(404, 662, 520, 664, 6, 9, P, true, A.lan);
  stall(2, 700, 42, 0, P); stall(47, 700, 42, 1, P); stall(92, 700, 42, 2, P);
  stall(408, 700, 46, 3, P); stall(460, 700, 52, 4, P);
  // พื้นถนน/ทางเท้ารอบตึก
  rect(0,GY,W,H-GY,P.ground);
  wqZ(-SLAB, -36, UX+80, -60, UY+12, P.walk);
  for (let x = -36; x <= UX+80; x += 8) seg(WP(x,-60,-SLAB), WP(x,UY+12,-SLAB), P.walkLine);
  for (let y = -60; y <= UY+12; y += 8) seg(WP(-36,y,-SLAB), WP(UX+80,y,-SLAB), P.walkLine);
  wqZ(-SLAB, -300, 400, UY+12, UY+46, P.road);
  seg(WP(-300,UY+12,-SLAB), WP(400,UY+12,-SLAB), P.curb); seg(WP(-300,UY+13,-SLAB), WP(400,UY+13,-SLAB), P.curb);
  for (let x = -300; x < 400; x += 12) seg(WP(x,UY+29,-SLAB), WP(x+6,UY+29,-SLAB), P.roadLine);
  ctx.globalAlpha = .25; wqZ(-SLAB, UX, UX+6, -WALL, UY, PAL.ol); ctx.globalAlpha = 1;
  drawLot(P);                                    // ลานจอดรถ 911 (ขวา-ล่าง)
}
/* ---------- ชั้นลม: เฟรมคำนวณล่วงหน้า (ธง/ผ้า) ---------- */
function paintCanvas(w, h, fn){ const c = mk(w, h), g = c.getContext('2d'), pc = ctx, pd = DIM, pe = EMIT; ctx = g; DIM = 0; EMIT = 0; try { fn(g); } finally { ctx = pc; DIM = pd; EMIT = pe; } return c; }
function paintBand(y0, h, fn){ return paintCanvas(W, h, g => { g.setTransform(1,0,0,1,0,-y0); fn(g); g.setTransform(1,0,0,1,0,0); }); }
function flagFrames(txt){                 // ธงตั้ง: คอลัมน์ยิ่งห่างเสายิ่งพลิ้ว (ขึ้น-ลง)
  const base = paintCanvas(9, 30, () => { orect(0, 0, 9, 30, '#f6f8fc'); rect(1, 1, 7, 2, PAL.red); rect(1, 27, 7, 2, PAL.red); for (let i = 0; i < txt.length; i++) textJP(txt[i], 8, 1, 5 + i*10, '#c8202a'); });
  const out = [];
  for (const amp of [1, 2]){ const set = []; for (let k = 0; k < 4; k++){ const c = mk(9, 30 + 2*amp), g = c.getContext('2d'); for (let i = 0; i < 9; i++){ const dy = Math.round(Math.sin(i*.75 - k*Math.PI/2)*amp*(i/8)); g.drawImage(base, i, 0, 1, 30, i, amp + dy, 1, 30); } set.push(c); } out.push(set); }
  return out;
}
function bannerFrames(){                  // ผ้า 謹賀新年 ใต้ชายคา: แถวล่างพลิ้วซ้าย-ขวา
  const base = paintCanvas(50, 14, () => { orect(0, 0, 50, 14, '#c8202a'); rect(1, 1, 48, 1, '#e84a4a'); textJP('謹賀新年', 10, 3, 2, '#fff6dc'); });
  const out = [];
  for (const amp of [1, 2]){ const set = []; for (let k = 0; k < 4; k++){ const c = mk(50 + 2*amp, 14), g = c.getContext('2d'); for (let j = 0; j < 14; j++){ const dx = Math.round(Math.sin(j*.45 - k*Math.PI/2)*amp*(j/13)); g.drawImage(base, 0, j, 50, 1, amp + dx, j, 50, 1); } set.push(c); } out.push(set); }
  return out;
}
function cloudSprites(P, phase){
  const spec = phase === 'night' ? [[46,52,1.6],[128,70,1.1],[196,44,1.4]] : phase === 'evening' ? [[40,60,2.4],[112,46,1.8],[176,72,1.4],[226,40,2.0]] : [[28,44,3.0],[86,64,2.2],[150,50,2.6],[210,70,1.7]];
  const r = rng(phase.length*31);
  return spec.map(([y, w, sp], i) => ({ c: paintCanvas(w + 12, 20, () => cloud(6, 12, w, P.cloud, P.cloudSh)), y: y - 12, x0: r()*(W + w), sp, a: phase === 'night' ? .55 : .92 }));
}
/* ---------- หมู่บ้านญี่ปุ่น (ระหว่างศาลเจ้ากับป่า) ----------
   7 แถวไล่ขึ้นเนิน (ฐาน y 506 → 618) · หลังไกล = เล็ก/ซีดตามหมอก · หน้าใกล้ = ใหญ่ มีขอบดำ
   ชนิดบ้าน: kawara หลังคาปั้นหยา / จั่วหันหน้า / มุงจาก (kayabuki) / machiya 2 ชั้น · noren · ต้นพลับ · ต้นไม้แซม
   ทางเดินคดเคี้ยว 2 ฝั่ง + โคมทาง · ลำธาร + สะพานแดง · หอดูไฟ 火の見櫓 · เจดีย์อยู่กลางหมู่บ้านฝั่งขวา              */
function vcol(P, d){ const f = d*.55, m = c => mix(c, P.fHaze, f); return { roof:m(P.vRoof), roofSh:m(shade(P.vRoof, .72)), roofHi:m(P.vRoofHi), wall:m(P.vWall), wallSh:m(shade(P.vWall, .8)), wood:m(P.vWood), thatch:m(P.vThatch), thatchSh:m(shade(P.vThatch, .72)), snow: P.fSnow ? m(P.fSnow) : null, ol: d <= .3 ? PAL.ol : null, win: P.winLit ? mix('#ffcf6a', P.fHaze, f*.4) : m('#e8dcc0') }; }
function house(x, base, w, kind, d, P, r){
  const C = vcol(P, d); x = Math.round(x); base = Math.round(base); w = Math.round(w);
  const two = kind === 'machiya', hW = Math.round(w*.32) + (two ? 9 : 4), rH = Math.round(w*.34) + 3, wy = base - hW;
  // ผนัง + โครงไม้
  rect(x, wy, w, hW, C.wall); rect(x + w - 2, wy, 2, hW, C.wallSh);
  for (let bx = x + 4 + (r()*3|0); bx < x + w - 2; bx += 5 + (r()*3|0)) rect(bx, wy, 1, hW, C.wood);
  rect(x, base - 2, w, 2, C.wood); if (two) rect(x, wy + Math.round(hW*.45), w, 1, C.wood);
  // หน้าต่าง/ประตู
  const nw = Math.max(1, Math.floor(w/9));
  for (let i = 0; i < nw; i++){
    const wx = x + 3 + Math.round(i*(w - 7)/Math.max(1, nw)) + (r()*2|0), wh = d > .6 ? 1 : 2, wyy = two ? wy + 2 : wy + Math.max(1, Math.round(hW*.3));
    const lit = P.winLit && r() < .7;
    if (lit){ emit(() => { const g = ctx.globalAlpha; ctx.globalAlpha = .22*P.winLit; rect(wx - 1, wyy - 1, 5, wh + 2, '#ffb050'); ctx.globalAlpha = g; rect(wx, wyy, 3, wh, C.win); }); }
    else rect(wx, wyy, 3, wh, P.winLit ? shade(C.wood, .7) : C.win);
  }
  if (d < .6 && r() < .45){ const nx = x + Math.round(w*.55), c = ['#2a4a8a','#c8202a','#3a2a5a'][r()*3|0]; rect(nx, base - 6, 5, 4, mix(c, P.fHaze, d*.5)); px(nx + 2, base - 5, '#f6f8fc'); }   // noren
  if (kind !== 'thatch' && d < .75 && r() < .6){                                                            // ระแนงไม้ (koshi) ครึ่งล่าง
    const ly = wy + Math.round(hW*.5), lh = Math.max(1, hW - Math.round(hW*.5) - 2);
    for (let lx = x + 2; lx < x + w - 2; lx += 2) rect(lx, ly, 1, lh, C.wood);
    rect(x + 1, ly - 1, w - 2, 1, C.wood);
  }
  if (C.ol){ rect(x - 1, wy, 1, hW, C.ol); rect(x + w, wy, 1, hW, C.ol); }
  const lantern = d < .8 && r() < .4;
  // หลังคา
  let rp;
  if (kind === 'gable'){
    rp = [[x - 2, wy + 1], [x + Math.round(w/2), wy - rH - 2], [x + w + 2, wy + 1]];
    fillPoly(rp, C.roof); fillPoly([[x + Math.round(w/2), wy - rH - 2], [x + w + 2, wy + 1], [x + Math.round(w/2), wy + 1]], C.roofSh);
    fillPoly([[x + 2, wy + 1], [x + Math.round(w/2), wy - rH + 2], [x + w - 2, wy + 1]], C.wall);              // หน้าจั่ว
    rect(x + Math.round(w/2) - 1, wy - Math.round(rH*.4), 3, 2, C.wood);
    line(x - 2, wy + 1, x + Math.round(w/2), wy - rH - 2, P.lightDir < 0 ? C.roofHi : C.roofSh);
  } else if (kind === 'thatch'){
    const tH = Math.round(rH*1.35);
    rp = [[x - 3, wy + 2], [x + Math.round(w*.26), wy - tH], [x + Math.round(w*.74), wy - tH], [x + w + 3, wy + 2]];
    fillPoly(rp, C.thatch);
    for (let sx = x - 2; sx < x + w + 2; sx += 2) if (r() < .6) line(sx, wy + 1, sx + (sx < x + w/2 ? 1 : -1), wy - Math.round(tH*.6), C.thatchSh);
    rect(x - 3, wy, w + 6, 2, C.thatchSh);
    orect(x + Math.round(w*.26) - 1, wy - tH - 2, Math.round(w*.48) + 2, 3, C.roofSh, null);                   // ตัวครอบสันหลังคา
  } else {                                                                                                     // kawara ปั้นหยา (+machiya)
    rp = [[x - 3, wy + 1], [x + Math.round(rH*.9), wy - rH], [x + w - Math.round(rH*.9), wy - rH], [x + w + 3, wy + 1]];
    fillPoly(rp, C.roof);
    for (let ty = wy - rH + 2; ty < wy; ty += 2) line(x + 1, ty, x + w - 1, ty, C.roofSh);
    rect(x - 3, wy, w + 6, 1, C.roofSh); rect(x + Math.round(rH*.9) - 1, wy - rH - 1, w - Math.round(rH*1.8) + 2, 2, C.roofSh);
    for (const ex of [x + Math.round(rH*.9) - 2, x + w - Math.round(rH*.9)]){ rect(ex, wy - rH - 3, 2, 3, C.roofSh); px(ex + (ex < x + w/2 ? -1 : 2), wy - rH - 3, C.roofSh); }   // onigawara งอนปลายสัน
    if (P.lightDir < 0) line(x - 3, wy + 1, x + Math.round(rH*.9), wy - rH, C.roofHi); else line(x + w + 3, wy + 1, x + w - Math.round(rH*.9), wy - rH, C.roofHi);
    if (two){ rect(x - 2, wy + Math.round(hW*.45) - 1, w + 4, 2, C.roof); }                                  // ชายคากลาง machiya
  }
  if (C.snow){ const top = kind === 'gable' ? null : rp[1][1]; if (top != null) rect(rp[1][0], top, rp[2][0] - rp[1][0] + 1, 1, C.snow); else { px(rp[1][0], rp[1][1], C.snow); line(rp[1][0] - 2, rp[1][1] + 1, rp[1][0] + 2, rp[1][1] + 1, C.snow); } }
  if (C.ol) polyOutline(rp, C.ol);
  if (lantern){                                                                                               // โคมกระดาษใต้ชายคา
    const lx = r() < .5 ? x + 1 : x + w - 3, ly = wy + 2;
    if (P.lanLit) emit(() => { const g = ctx.globalAlpha; ctx.globalAlpha = .25*P.lanLit; rect(lx - 2, ly - 1, 6, 6, '#ff9a4a'); ctx.globalAlpha = g; rect(lx, ly, 2, 3, '#ff7a4a'); px(lx, ly + 1, '#ffe0a0'); });
    else { rect(lx, ly, 2, 3, mix('#d8363a', P.fHaze, d*.4)); px(lx, ly + 1, '#f6f0e0'); }
  }
}
function persimmon(x, base, d, P){
  const c = mix('#4a3226', P.fHaze, d*.55), f = mix('#f07a2a', P.fHaze, d*.4);
  rect(x, base - 10, 1, 10, c); line(x, base - 7, x - 4, base - 12, c); line(x, base - 8, x + 4, base - 13, c); line(x, base - 10, x - 1, base - 15, c);
  for (const [dx, dy] of [[-4,-12],[3,-13],[-1,-15],[-2,-10],[2,-9],[4,-11]]) px(x + dx, base + dy, f);
  if (P.fSnow) px(x - 1, base - 16, P.fSnow);
}
function lanePts(pts){                       // เส้นทางเดินคดเคี้ยว → จุดทุก 1 px (y → x)
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++){ const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.abs(y1 - y0)); for (let k = 0; k < n; k++) out.push([x0 + (x1 - x0)*k/n, y0 + (y1 - y0)*k/n]); }
  return out;
}
const LANES = [ [[66,606],[54,594],[46,582],[34,570],[28,556],[40,542],[32,526],[22,508]],
                [[404,572],[420,560],[442,552],[460,538],[486,526],[506,510]] ];
function fireTower(x, base, d, P){          // 火の見櫓
  const c = mix('#3a2a22', P.fHaze, d*.5), top = base - 46;
  line(x - 6, base, x - 2, top, c); line(x + 6, base, x + 2, top, c);
  for (let y = base - 8; y > top + 4; y -= 9){ const k = (base - y)/46; const a = Math.round(6 - 4*k); line(x - a, y, x + a - 1, y - 8, c); line(x + a, y, x - a + 1, y - 8, c); }
  rect(x - 5, top, 11, 1, c); rect(x - 5, top - 4, 1, 4, c); rect(x + 5, top - 4, 1, 4, c); rect(x - 5, top - 4, 11, 1, c);
  fillPoly([[x - 6, top - 5], [x, top - 11], [x + 6, top - 5]], mix(P.vRoof, P.fHaze, d*.5)); px(x, top - 12, c);
  rect(x - 1, top - 3, 2, 2, '#d8b040');
  if (P.fSnow) line(x - 4, top - 6, x, top - 10, P.fSnow);
}
function village(P){
  const r = rng(4242), gC = P.vGround;
  // พื้นเนินเป็นขั้น (แถวละ 1 terrace) + กำแพงหินกันดิน
  const rows = [[506,1,10,13],[522,.84,11,16],[538,.68,13,19],[556,.52,15,22],[574,.38,17,25],[594,.22,19,28],[616,.06,22,32]];
  const wave = (x, s) => Math.round(2.5*Math.sin(x*.03 + s) + 1.5*Math.sin(x*.07 + s*2));
  for (let x = 0; x < W; x++){ const y = 496 + wave(x, 1); rect(x, y, 1, 642 - y, mix(gC, P.fHaze, .5)); }
  rows.forEach(([y, d], i) => {
    const c = mix(gC, P.fHaze, d*.5), wl = mix(P.stone, P.fHaze, d*.55);
    for (let x = 0; x < W; x++){ const yy = y - 12 + wave(x, i); rect(x, yy, 1, 642 - yy, c); }
    for (let x = 0; x < W; x++){ const yy = y + 1 + wave(x, i + 1); px(x, yy, wl); if ((x + i) % 3 === 0) px(x, yy + 1, shade(wl, .8)); }
  });
  // ลำธาร + สะพานแดง (ระหว่างแถว 4-5)
  const sw = mix(P.water, P.fHaze, .2);
  for (let x = 0; x < W; x++){ const y = 583 + Math.round(2*Math.sin(x*.05)); rect(x, y, 1, 3, sw); if ((x + Math.floor(x/7)) % 5 === 0) px(x, y + 1, mix(sw, '#ffffff', .45)); }
  // ทางเดินคดเคี้ยว
  for (const L of LANES){ const pts = lanePts(L); for (const [x, y] of pts){ const k = (y - 500)/120, hw = Math.round(1 + 2*k); rect(Math.round(x) - hw, Math.round(y), 2*hw + 1, 1, mix(P.vLane, P.fHaze, (1 - k)*.45)); } }
  { const bx = 40, by = 584; fillPoly([[bx - 9, by + 2], [bx - 4, by - 2], [bx + 4, by - 2], [bx + 9, by + 2], [bx + 7, by + 3], [bx - 7, by + 3]], '#c8303a'); rect(bx - 8, by - 4, 17, 1, '#e04a3a'); for (const dx of [-7, -3, 2, 6]) rect(bx + dx, by - 4, 1, 3, '#c8303a'); }
  // บ้าน (ไกล → ใกล้) + ต้นไม้แซม + เจดีย์ + หอดูไฟ
  const kinds = ['kawara','kawara','gable','thatch','machiya','kawara','gable'];
  const nearLane = (x, y, w) => LANES.some(L => L.some(([lx, ly], j) => j + 1 < L.length && y >= Math.min(ly, L[j + 1][1]) - 2 && y <= Math.max(ly, L[j + 1][1]) + 2 && Math.abs(lx - (x + w/2)) < w/2 + 4));
  rows.forEach(([y, d, w0, w1], i) => {
    if (i === 3) pagoda(474, 552, P);
    if (i === 4) fireTower(432, 572, d, P);
    for (let x = -6 + r()*8; x < W; ){
      const w = Math.round(w0 + r()*(w1 - w0)), yy = y + wave(x, i), kd = kinds[(r()*kinds.length)|0];
      if (!nearLane(x, yy, w) && !(i >= 3 && x > 452 && x < 498) && !(i === 4 && x > 420 && x < 444)) house(x, yy, w, kd, d, P, r);
      x += w + 3 + r()*8;
      const t = r();
      if (t < .2 && i > 1){ persimmon(Math.round(x), yy, d, P); x += 8; }
      else if (t < .46){                                                                      // ต้นไม้แซม: 60% ใบส้มฤดูใบไม้ร่วง (ตามภาพ 13)
        const lk = P.fSnow ? .42 : P.lanLit ? .8 : 1, au = r() < .6, m = c => mix(shade(c, lk), P.fHaze, d*.5);
        const C = au ? { c:m('#e0782a'), sh:m('#a8481e'), hi:m('#ffc060'), snow: P.fSnow ? mix(P.fSnow, P.fHaze, d*.4) : null } : fcol(P, d > .5 ? 2 : 3);
        dome(Math.round(x + 3), yy, Math.round(8 + r()*9*(1 - d*.5)), Math.round(8 + r()*7), C, P, r, true); x += 9; }
    }
  });
  // โคมทาง (คืน/เย็น จุดเรือง)
  for (const L of LANES){ const pts = lanePts(L); for (let i = 6; i < pts.length; i += 14){ const [x, y] = pts[i], X = Math.round(x) + 4, Y = Math.round(y); rect(X, Y - 6, 1, 6, '#3a2a22'); if (P.lanLit){ emit(() => { const g = ctx.globalAlpha; ctx.globalAlpha = .25; rect(X - 2, Y - 9, 5, 5, '#ff9a4a'); ctx.globalAlpha = g; rect(X - 1, Y - 8, 3, 3, '#ffcf6a'); }); } else rect(X - 1, Y - 8, 3, 3, '#e8dcc0'); } }
}

/* ---------- สร้าง cache ทั้งชุดของ 1 เฟรมเวลา ---------- */
const BAND = { mid:[376, 186], near:[416, 146], vill:[484, 160], front:[556, H - 556] };
function buildBG(phase){
  const P = PP[phase], L = {};
  const r = rng(phase === 'night' ? 11 : phase === 'evening' ? 22 : 33);
  L.sky = paintCanvas(W, H, g => {
    skyBands(P.sky);
    if (phase === 'night'){
      STARS.length = 0;
      for (let i = 0; i < 150; i++){ const x = Math.floor(r()*W), y = Math.floor(r()*330); const tw = r() < .2; if (y > fujiRidge(x - FUJI_CX) - 2) continue; STARS.push([x,y,tw]); px(x, y, r() < .2 ? PAL.cityWin : PAL.creamSh); }
      for (const [x,y] of [[40,40],[300,16],[150,110],[560,58],[24,180],[470,20],[372,24],[236,30]]){ px(x,y,PAL.cream); px(x-1,y,PAL.creamSh); px(x+1,y,PAL.creamSh); px(x,y-1,PAL.creamSh); px(x,y+1,PAL.creamSh); }
      ctx.globalAlpha = .10; ellipse(92,64,17,17,PAL.cream); ctx.globalAlpha = .18; ellipse(92,64,15,15,PAL.cream); ctx.globalAlpha = 1;
      ellipse(92,64,12,12,PAL.cream); ellipse(86,60,10,10,P.sky[0][1]);
      for (const [x,y] of [[97,68],[100,60],[95,74]]) px(x,y,PAL.creamSh);
    } else if (phase === 'morning'){
      // 初日の出: พระอาทิตย์แรกของปี เหนือเนินไกลฝั่งซ้าย + แสงทองเป็นแถบ
      ctx.globalAlpha = .10; ellipse(64,272,34,30,'#ffd08a'); ctx.globalAlpha = .18; ellipse(64,272,24,22,'#ffc070'); ctx.globalAlpha = .3; ellipse(64,272,17,17,'#ffb860'); ctx.globalAlpha = 1;
      ellipse(64,272,13,13,'#ff9a4a'); ellipse(63,270,11,11,'#ffc36a'); ellipse(62,269,7,7,'#fff0c0');
      for (const [y,w] of [[240,70],[248,96],[256,60]]){ ctx.globalAlpha = .35; rect(64-w/2, y, w, 1, '#ffe0a0'); } ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = .14; ellipse(484,178,22,22,'#ffb04a'); ctx.globalAlpha = .26; ellipse(484,178,17,17,'#ffc070'); ctx.globalAlpha = 1;
      ellipse(484,178,13,13,'#ffb24a'); rect(473,180,23,1,'#f08a3a'); rect(475,184,19,1,'#f08a3a');
      for (const [x,y,w] of [[10,92,90],[50,97,50],[360,58,110],[390,63,60],[120,128,70]]){ rect(x,y,w,1,'#c2577a'); rect(x+8,y+1,w-16,1,'#9a3f6a'); }
      for (const [x,y] of [[80,30],[240,14],[520,36]]) px(x,y,'#f6d9b0');
    }
    drawFuji(g, P);
    hillLayer(300, 10, .014, 1.2, P.hillFar, true, false, 1);
    mistBand(318, 0, W, P.fMist, .45);
    forestRow(0, 352, 0, 7, 16, 7, .3, P, 5);
    mistBand(346, 0, W, P.fMist, .55);
    forestRow(1, 408, 0, 12, 30, 10, .5, P, 6);
    mistBand(400, 0, W, P.fMist, .5);
  });
  L.mid = paintBand(...BAND.mid, () => {
    forestRow(2, 448, 0, 22, 54, 12, .62, P, 8, {fillTo: 562});
    mistBand(440, 0, W, P.fMist, .35);
    forestRow(2, 478, 0, 16, 34, 13, .4, P, 9, {fill:false});
  });
  L.near = paintBand(...BAND.near, () => {
    forestRow(3, 506, 0, 40, 84, 15, .42, P, 10, {trunk:true, fillTo: 562});
    mistBand(500, 0, W, P.fMist, .3);
  });
  outlineCanvas(L.near, PAL.ol);
  L.vill = paintBand(...BAND.vill, () => village(P));
  L.A = { lan:[] };
  L.front = paintBand(...BAND.front, () => { shrineFront(P, L.A); streetBG(P, phase); });
  L.ext = paintBand(100, 680, () => exteriorBack(P, phase));     // ของติดผนังนอก (หลังตึก)
  L.extF = paintBand(380, H - 380, () => exteriorFront(P, phase)); // ไม้เลื้อย กันสาด ป้ายแขวน กระถาง เสาไฟฟ้า (หน้าตึก)
  L.A.flags = NOBORI.map(([x, top, txt]) => ({ x, y:top, f:flagFrames(txt) }));
  L.A.banner = bannerFrames();
  L.A.clouds = cloudSprites(P, phase);
  return L;
}
/* ---------- ลม: สถานะ + วาดทุกเฟรม (ต้นทุน ~20-40 drawImage + โคม ~26 ดวง) ---------- */
const WIND = { gNext:12, gStart:-99, birds:[], bNext:6 };
function windEnv(){ const d = S.t - WIND.gStart; return d >= 0 && d < 3 ? Math.sin(Math.PI*d/3) : 0; }
function updateWind(dt){
  if (Core.wind){ WIND.gNext -= dt; if (WIND.gNext <= 0){ WIND.gStart = S.t; WIND.gNext = 10 + Math.random()*10; } }
  WIND.bNext -= dt;
  if (WIND.bNext <= 0){
    WIND.bNext = 14 + Math.random()*12;
    if (time.phase !== 'night'){ const ltr = Math.random() < .5, y = 110 + Math.random()*110; WIND.birds.push({x: ltr ? -10 : W + 10, y, v: (ltr ? 1 : -1)*(28 + Math.random()*10), ph: Math.random()*6}); WIND.birds.push({x: ltr ? -24 : W + 24, y: y + 6, v: (ltr ? 1 : -1)*(28 + Math.random()*10), ph: Math.random()*6}); }
  }
  for (let i = WIND.birds.length - 1; i >= 0; i--){ const b = WIND.birds[i]; b.x += b.v*dt; if (b.x < -40 || b.x > W + 40) WIND.birds.splice(i, 1); }
}
const BIRD = [['x...x','.x.x.','..x..'], ['.....','.xxx.','x.x.x']];
function drawSkyLife(L){
  const g = ctx, a0 = g.globalAlpha, gust = Core.wind ? windEnv() : 0;
  for (const c of L.A.clouds){ const span = W + c.c.width, x = Math.round(((c.x0 + S.t*c.sp*(1 + gust*.8)) % span) - c.c.width); g.globalAlpha = c.a; g.drawImage(c.c, x, c.y); }
  g.globalAlpha = a0;
  const bc = time.phase === 'evening' ? '#2a1424' : '#2a2a3a';
  g.fillStyle = bc;
  for (const b of WIND.birds){ const f = BIRD[Math.floor(S.t*5 + b.ph) % 2], bx = Math.round(b.x) - 2, by = Math.round(b.y + Math.sin(S.t*2 + b.ph)*2); for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) if (f[j][(b.v > 0 ? i : 4 - i)] === 'x') g.fillRect(bx + i, by + j, 1, 1); }
}
function drawSway(c, y0, slices, dx){
  let s = 0;
  for (const [h, k] of slices){ const d = Math.round(dx*k); ctx.drawImage(c, 0, s, W, h, d, y0 + s, W, h); s += h; }
  if (s < c.height) ctx.drawImage(c, 0, s, W, c.height - s, 0, y0 + s, W, c.height - s);
}
function drawForestAndShrine(L){
  const on = Core.wind, gust = on ? windEnv() : 0, amp = on ? 1 + 1.4*gust : 0;
  const sw = Math.sin(S.t*.9) * amp;
  drawSway(L.mid, BAND.mid[0], [[34, .6], [22, .3]], sw);              // ยอด L2 (y 376-432)
  drawSway(L.near, BAND.near[0], [[40, 1], [24, .5]], Math.sin(S.t*1.1 + .8) * amp);   // ยอด L3 (y 416-480)
  ctx.drawImage(L.vill, 0, BAND.vill[0]);
  ctx.drawImage(L.front, 0, BAND.front[0]);
  // ผ้าที่พลิ้ว
  const set = gust > .35 ? 1 : 0, k = on ? Math.floor(S.t*(3 + 5*gust)) % 4 : 0;
  for (const f of L.A.flags){ const fr = f.f[set][k]; ctx.drawImage(fr, f.x, f.y - (set + 1)); }
  { const cx = Math.round((HALL.x0 + HALL.x1)/2), e = HALL.base - 34, fr = L.A.banner[set][(k + 1) % 4]; ctx.drawImage(fr, cx - 25 - (set + 1), e - 27); }
  // 紙垂 โทริอิ
  toriiShide().forEach(([x, y], i) => {
    const w1 = on ? Math.round(Math.sin(S.t*4 + i*1.7)*.6*amp) : 0, w2 = on ? Math.round(Math.sin(S.t*4 + i*1.7 - .8)*amp) : 0;
    rect(x, y, 2, 2, '#f6f8fc'); rect(x + 1 + w1, y + 2, 2, 2, '#f6f8fc'); rect(x + w2, y + 4, 2, 2, '#f6f8fc');
  });
  // โคมบนสาย (โยกสลับเฟส)
  const P = PP[time.phase];
  for (const [x, y, c, i] of L.A.lan){ const d = on ? Math.round(Math.sin(S.t*2.2 + i*.7)*amp*.9) : 0; chochin(x + d, y, P.lanLit, c); }
  // ควันจากแผงลอย たこ焼き / 焼きそば
  const sc = time.phase === 'morning' ? '#eef2f4' : time.phase === 'evening' ? '#d8b8c4' : '#6a6888', a0 = ctx.globalAlpha;
  for (const [sx, sy] of [[34, 656], [440, 656]]) for (let i = 0; i < 5; i++){
    const p = (S.t*.32 + i/5) % 1, st = Math.min(3, Math.floor(p*4));
    const x = Math.round(sx + p*(4 + 10*gust) + Math.sin(S.t*1.7 + i*2)*1.2), y = Math.round(sy - p*36), z = p > .45 ? 3 : 2;
    ctx.globalAlpha = [.55, .42, .28, .14][st]; rect(x, y, z, 2, sc);
  }
  ctx.globalAlpha = a0;
}
function skyAnim(){
  if (time.phase === 'night'){
    const sb = PP.night.sky; const bandAt = y => { let c = sb[0][1]; for (const [y0,cc] of sb) if (y >= y0) c = cc; return c; };
    STARS.forEach(([x,y,tw],i) => { if (tw && ((Math.floor(S.t*6)+i*5) % 30) < 3) px(x, y, bandAt(y)); });
    const on = (Math.floor(S.t*2) % 2) === 0;
    for (const [x,y] of BLINKS){ if (on){ ctx.globalAlpha = .3; rect(x-1,y-1,3,3,PAL.red); ctx.globalAlpha = 1; px(x,y,PAL.red); } else px(x,y,PAL.wallSh); }
  } else if (time.phase === 'evening'){
    const on = (Math.floor(S.t*2) % 2) === 0;
    if (on) for (const [x,y] of BLINKS) px(x,y,PAL.red);
  }
}

/* ============================== FIREWORKS (รอบ 4) ==============================
   - ยิงทุก 2-5 วิ (เช้า 3.5-6.5 วิ จางกว่า) จาก "ข้างตึก" 2 ฝั่ง หรือหลังตึก (ระเบิดเหนือดาดฟ้า)
   - หาง pixel ไต่ขึ้น → ระเบิด 12-20 เม็ด 2-3 สี · จางเป็น 4 ขั้น (alpha 1/.8/.55/.28, 2x2 px → 1x1 ขั้นสุดท้าย) ไม่มี blur
   - วาดหลัง BG ก่อนตึก → ตึกบังพลุเอง (ไม่ทับห้อง ไม่ทับแผง UI ที่เป็น HTML) · Core.fireworks = เปิด/ปิด          */
const FW = { rockets:[], parts:[], flashes:[], next:1.2 };
const FW_SETS = [['#ff5a5a','#ffd37a','#ffffff'],['#7ad8ff','#ffffff','#b48aff'],['#9cff7a','#ffe36a'],['#ff8ad8','#ffd37a','#7ad8ff'],['#ffb04a','#ff5a3a'],['#ffffff','#ffd37a','#ff8ad8']];
const FW_STEP = [1, .8, .55, .28];
function fwLaunch(){
  const R = Math.random, side = R() < .68;
  let x, ty, y0;
  if (side){ x = R() < .5 ? 18 + R()*104 : 420 + R()*86; ty = 70 + R()*210; y0 = 560; }
  else { x = 170 + R()*210; ty = 36 + R()*86; y0 = ty + 140; }
  FW.rockets.push({ x, y:y0, vy: -(150 + R()*50), ty, cols: FW_SETS[Math.floor(R()*FW_SETS.length)], trail:[] });
}
function fwBurst(r){
  const R = Math.random, n = 12 + Math.floor(R()*9), sp = 34 + R()*18, nc = r.cols.length, ring = R() < .35;
  for (let i = 0; i < n; i++){
    const a = i/n*Math.PI*2 + R()*.25, v = sp*(ring ? 1 : .7 + R()*.4);
    FW.parts.push({ x:r.x, y:r.y, vx:Math.cos(a)*v, vy:Math.sin(a)*v - 6, life:0, max:1.9 + R()*.8, c:r.cols[i % nc] });
  }
  FW.flashes.push({ x:r.x, y:r.y, t:0 });
}
function updateFireworks(dt){
  if (!Core.fireworks){ FW.rockets.length = FW.parts.length = FW.flashes.length = 0; return; }
  FW.next -= dt;
  if (FW.next <= 0){ fwLaunch(); const m = time.phase === 'morning'; FW.next = m ? 3.5 + Math.random()*3 : 2 + Math.random()*3; if (time.phase === 'night' && Math.random() < .25) fwLaunch(); }
  for (let i = FW.rockets.length - 1; i >= 0; i--){
    const r = FW.rockets[i];
    r.trail.push([r.x, r.y]); if (r.trail.length > 6) r.trail.shift();
    r.y += r.vy*dt; r.vy += 30*dt; r.x += Math.sin(r.y*.08)*.15;
    if (r.y <= r.ty || r.vy > -40){ fwBurst(r); FW.rockets.splice(i, 1); }
  }
  for (let i = FW.parts.length - 1; i >= 0; i--){
    const p = FW.parts[i], d = Math.max(0, 1 - 1.3*dt);
    p.px = p.x; p.py = p.y; p.vx *= d; p.vy = p.vy*d + 16*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life += dt;
    if (p.life >= p.max) FW.parts.splice(i, 1);
  }
  for (let i = FW.flashes.length - 1; i >= 0; i--){ FW.flashes[i].t += dt; if (FW.flashes[i].t > .12) FW.flashes.splice(i, 1); }
}
function drawFireworks(){
  if (!Core.fireworks) return;
  const g = ctx, A = time.phase === 'morning' ? .55 : time.phase === 'evening' ? .85 : 1, a0 = g.globalAlpha;
  for (const r of FW.rockets){
    r.trail.forEach(([x,y],k) => { g.globalAlpha = A*FW_STEP[Math.min(3, r.trail.length - 1 - k)]; g.fillStyle = '#ffd37a'; g.fillRect(Math.round(x), Math.round(y), 1, 1); });
    g.globalAlpha = A; g.fillStyle = '#ffffff'; g.fillRect(Math.round(r.x), Math.round(r.y), 1, 2);
  }
  for (const f of FW.flashes){ g.globalAlpha = A*.8; g.fillStyle = '#ffffff'; g.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 3, 3); g.globalAlpha = A*.25; g.fillRect(Math.round(f.x) - 3, Math.round(f.y) - 3, 7, 7); }
  for (const p of FW.parts){
    const st = Math.min(3, Math.floor(p.life/p.max*4)), x = Math.round(p.x), y = Math.round(p.y);
    g.fillStyle = p.c;
    if (st === 0 && time.phase !== 'morning'){ g.globalAlpha = A*.18; g.fillRect(x - 1, y - 1, 3, 3); }
    g.globalAlpha = A*FW_STEP[st]; const z = st < 3 ? 2 : 1; g.fillRect(x, y, z, z);          // 2x2 → 1x1 ตามขั้นจาง
    if (st < 2 && p.px != null){ g.globalAlpha = A*FW_STEP[st + 2]; g.fillRect(Math.round(p.px*2 - p.x), Math.round(p.py*2 - p.y), 1, 1); }   // หางสั้น 1 px
  }
  g.globalAlpha = a0;
}

/* ============================== FLOOR SHELL (ผนังหลัง + พื้น) ============================== */
const shellCache = {};
function paintFloor(n, sh){
  const z0 = zOf(n), c1 = sh.floorC, c2 = sh.floorC2 || shade(c1,.85), kind = sh.floor;
  if (typeof kind === 'function'){ wqZ(z0,0,UX,0,UY,c1); kind(makeF(n)); return; }
  wqZ(z0, 0, UX, 0, UY, c1);
  if (kind === 'wood'){                     // ไม้กระดานวิ่งตามแกนยาว (รอบ 4: fy)
    for (let x = 4; x < UX; x += 4) seg(WP(x,0,z0), WP(x,UY,z0), c2);
    for (let r = 0, x = 0; x < UX; x += 4, r++) for (let y = (r%3)*7+5; y < UY; y += 21) seg(WP(x,y,z0), WP(x+4,y,z0), c2);
  } else if (kind === 'deck'){
    for (let x = 5; x < UX; x += 5) seg(WP(x,0,z0), WP(x,UY,z0), c2);
    for (let x = 0, k = 0; x < UX; x += 5, k++) for (let y = (k%2)*14+9; y < UY; y += 28) px(...WP(x+2.5,y,z0), shade(c1,.7));
  } else if (kind === 'tile'){
    for (let i = 0; i < UX/6; i++) for (let j = 0; j < UY/6; j++) if ((i+j)%2) wqZ(z0, i*6, Math.min(UX,i*6+6), j*6, Math.min(UY,j*6+6), c2);
  } else if (kind === 'carpet'){
    const r = rng(n*97); for (let k = 0; k < 260; k++){ const x = r()*UX, y = r()*UY; px(...WP(x,y,z0), c2); }
    wqZ(z0, 4, UX-4, 4, UY-4, null, c2);
  } else if (kind === 'concrete'){
    const r = rng(n*31); for (let k = 0; k < 120; k++){ const x = r()*UX, y = r()*UY; px(...WP(x,y,z0), c2); }
    for (const t of [UX/4, UX/2, 3*UX/4]) seg(WP(t,0,z0), WP(t,UY,z0), c2);
    seg(WP(0,UY/2,z0), WP(UX,UY/2,z0), c2);
  } else if (kind === 'tatami'){
    for (let y = 0; y <= UY; y += 14) seg(WP(0,y,z0), WP(UX,y,z0), c2);
    for (let r = 0, y = 0; y < UY; y += 14, r++) for (let x = (r%2)*14; x <= UX; x += 28) seg(WP(x,y,z0), WP(x,Math.min(UY,y+14),z0), c2);
  }
}
function drawShell(n){
  const sh = floorInfo[n].shell, z0 = zOf(n), wh = sh.wallH || FH, z1 = z0 + wh;
  const slabL = n === 1 ? '#3c3852' : PAL.concrete, slabR = n === 1 ? '#2e2a42' : PAL.concreteSh;
  // พื้นหนา (slab) หน้าตัด 2 ด้าน
  wqY(UY, -WALL, UX, z0-SLAB, z0, slabL, PAL.ol);
  wqX(UX, -WALL, UY, z0-SLAB, z0, slabR, PAL.ol);
  for (let x = 2; x < UX; x += 8) seg(WP(x,UY,z0-SLAB+2), WP(x+3,UY,z0-SLAB+2), shade(slabL,.8));
  // ผนังหลัง 2 ด้าน (รอบ 4: ซ้าย = ยาว ระนาบ fx=0 · ขวา = สั้น ระนาบ fy=0)
  wqX(0, 0, UY, z0, z1, sh.wallL);
  wqY(0, 0, UX, z0, z1, sh.wallR);
  // แถบเงาใต้เพดาน (ชั้นมีเพดาน)
  if (!sh.open){ wqX(0.02, 0, UY, z1-4, z1, shade(sh.wallL,.85)); wqY(0.02, 0, UX, z1-4, z1, shade(sh.wallR,.85)); }
  // พื้น
  paintFloor(n, sh);
  // บัวเชิงผนัง + เส้นมุม
  wqY(0.03, 0, UX, z0, z0+3, sh.trim); wqX(0.03, 0, UY, z0, z0+3, sh.trim);
  const bc = WP(0,0,z1); rect(bc[0]-1, bc[1], 2, wh, PAL.ol);
  seg(WP(0,0,z0), WP(UX,0,z0), PAL.ol); seg(WP(0,0,z0), WP(0,UY,z0), PAL.ol);
  // หน้าตัดผนัง (cutaway) ซ้าย/ขวา
  wqY(UY, -WALL, 0, z0, z1, PAL.concrete, PAL.ol);
  wqX(UX, -WALL, 0, z0, z1, PAL.concreteSh, PAL.ol);
  if (sh.open){   // ผนังเตี้ย/ราว: เห็นสันบน
    wqZ(z1, -WALL, 0, -WALL, UY, shade(PAL.concrete,1.15), PAL.ol);
    wqZ(z1, 0, UX, -WALL, 0, shade(PAL.concrete,1.15), PAL.ol);
  }
}
function shellCanvas(n, dim){
  const k = n+'|'+dim; if (shellCache[k]) return shellCache[k];
  const sh = floorInfo[n].shell, wh = sh.wallH || FH, z0 = zOf(n);
  const bx = Math.floor(OX - 2*(UY+WALL) - 4), bw = Math.ceil(2*(UX+UY+2*WALL) + 8);
  const by = Math.floor(OY - z0 - wh - 2*WALL - 6), bh = Math.ceil(wh + 2*WALL + UX + UY + SLAB + 14);
  const c = mk(bw, bh), g = c.getContext('2d');
  const pc = ctx, pd = DIM, pcur = CUR; ctx = g; DIM = dim; CUR = n;
  g.setTransform(1,0,0,1,-bx,-by);
  try { drawShell(n); } catch(e){ console.error('[core] shell '+n, e); }
  g.setTransform(1,0,0,1,0,0);
  ctx = pc; DIM = pd; CUR = pcur;
  return shellCache[k] = {c, x:bx, y:by};
}

/* ============================== FLOOR REGISTRY ============================== */
const F_FUNCS = ['iso','isoBox','boxBBox','spriteBBox','quadX','quadY','quadZ','wallL','wallR','pool','visible','hiddenEdge','drawSprite'];
function withFloor(n, fn){ const p = CUR; CUR = n; try { return fn(); } finally { CUR = p; } }
function makeF(n){
  const F = { n, z0:zOf(n), U, UX, UY, FH, SAFE, meta: floorInfo[n] ? floorInfo[n].meta : DEFAULT_META[n] };
  for (const name of F_FUNCS) F[name] = (...a) => withFloor(n, () => Core[name](...a));
  return F;
}
function normalize(o, n){
  o.floor = n; o.state = o.state || {}; o.kind = o.kind || 'decor';
  o.label = o.label || o.name || o.id; o.name = o.name || o.label;
  for (const k of ['x','y','w','h']) if (typeof o[k] !== 'number' || !isFinite(o[k])) o[k] = 0;
  o._i = seq++;
  return o;
}
function addObject(o){
  if (!o || typeof o !== 'object') return null;
  const n = (o.floor >= 1 && o.floor <= 5) ? (o.floor|0) : 0;
  normalize(o, n); floorObjs[n].push(o); ALL.push(o); return o;
}
function removeObject(id){
  for (const n in floorObjs){ const a = floorObjs[n], i = a.findIndex(q => q.id === id); if (i >= 0) a.splice(i,1); }
  const j = ALL.findIndex(q => q.id === id); if (j >= 0) ALL.splice(j,1);
}
const find = id => ALL.find(q => q.id === id) || null;

const LAMP_ON  = {w:9,h:6,anchor:'bottom-center',pal:{o:PAL.ol,W:PAL.dwood,h:PAL.warm},frames:[['...ooo...','..oWWWo..','.oWWWWWo.','oWWWWWWWo','oohhhhhoo','..ooooo..']]};
const LAMP_OFF = {w:9,h:6,anchor:'bottom-center',pal:{o:PAL.ol,W:PAL.dwood,h:PAL.wood3},frames:[['...ooo...','..oWWWo..','.oWWWWWo.','oWWWWWWWo','oohhhhhoo','..ooooo..']]};
const LANTERN  = {w:7,h:10,anchor:'bottom-center',pal:{o:PAL.ol,r:PAL.red,h:PAL.warm,k:PAL.wall2},frames:[['..ooo..','.okkko.','orrhrro','orhhhro','orrhrro','orhhhro','orrhrro','.okkko.','..ooo..','...o...']]};
function makePlaceholder(n){
  const meta = DEFAULT_META[n];
  return {
    name: meta.name, nameJP: meta.nameJP, desc: meta.desc, placeholder: true,
    build(F){
      const p = F.iso(0.8, 0.8, 0), bh = 32, by = Math.round(p.y - 56);
      const sign = { id:'ph_sign'+n, kind:'sign', label:n+'F ป้ายชั่วคราว', hint:'floor'+n+'.js ยังไม่มา — โครงห้องพร้อมแล้ว',
        x:p.x-36, y:by, w:72, h:p.y-by, ax:p.x, ay:by,
        draw(){
          const jw = jpMask(meta.nameJP, 12)[0].length, bw = Math.max(70, jw + 10), bx = Math.round(p.x - bw/2);
          this.x = bx; this.w = bw;
          rect(p.x-1, by+bh, 3, p.y-by-bh, PAL.ol); rect(p.x, by+bh, 1, p.y-by-bh-1, PAL.metal); rect(p.x-6, p.y-2, 13, 2, PAL.ol);
          orect(bx, by, bw, bh, '#22223a', PAL.ol); rect(bx+1, by+1, bw-2, 1, '#3a3a5c');
          emit(() => { text(n+'F', bx+4, by+4, PAL.warm, {scale:2}); textJP(meta.nameJP, 12, bx+5, by+17, PAL.cream); });
          text('PLACEHOLDER', bx+22, by+6, PAL.metal);
        },
        onClick(){ bubble(this.id, 'floor'+n+'.js ยังไม่มา', 1800); }
      };
      let lamp;
      if (n < 5){
        // โคมตั้งพื้น (โคมเพดานจะถูกพื้นชั้นบนบังเกือบหมด — ดู [2] ด้านบน)
        const lf = [0.9, 0.5], b = F.iso(lf[0], lf[1], 0), top = F.iso(lf[0], lf[1], 40);
        lamp = { id:'ph_lamp'+n, kind:'light', label:'โคมไฟ '+n+'F', hint:'คลิก: เปิด/ปิดไฟห้อง',
          x:b.x-6, y:top.y-7, w:13, h:b.y-top.y+8,
          draw(){
            if (lit(n)) pool(lf[0], lf[1], 20, 9);
            rect(b.x-3, b.y-2, 7, 2, PAL.ol); rect(b.x-1, top.y, 3, b.y-top.y-1, PAL.ol); rect(b.x, top.y, 1, b.y-top.y-2, PAL.metal);
            drawSpritePx(ctx, lights[n] ? LAMP_ON : LAMP_OFF, b.x, top.y+1, 0, false);
            if (lit(n)) emit(() => { ctx.globalAlpha = .28; rect(b.x-5, top.y+1, 11, 3, PAL.warm); ctx.globalAlpha = 1; });
          },
          onClick(){ lights[n] = !lights[n]; bubble(this.id, lights[n] ? 'เปิดไฟ' : 'ปิดไฟ', 1000); log(n+'F ไฟ '+(lights[n] ? 'ON' : 'OFF')); }
        };
      } else {
        const lf = [0.86, 0.5], b = F.iso(lf[0], lf[1], 0);
        lamp = { id:'ph_lamp5', kind:'light', label:'โคมแดง 5F', hint:'คลิก: เปิด/ปิดโคม',
          x:b.x-5, y:b.y-52, w:11, h:53,
          draw(){
            if (lit(5)) pool(lf[0], lf[1], 18, 8, PAL.red, .18);
            rect(b.x-1, b.y-42, 3, 42, PAL.ol); rect(b.x, b.y-42, 1, 41, PAL.dwood);
            const run = () => drawSpritePx(ctx, LANTERN, b.x, b.y-32, 0, false);
            lit(5) ? emit(() => { ctx.globalAlpha = .18; ellipse(b.x, b.y-37, 7, 8, PAL.red); ctx.globalAlpha = 1; run(); }) : run();
          },
          onClick(){ lights[5] = !lights[5]; bubble(this.id, lights[5] ? 'ちょうちん ON' : '…', 1000); log('5F โคม '+(lights[5] ? 'ON' : 'OFF')); }
        };
      }
      return [sign, lamp];
    }
  };
}
function resolveFloor(n){
  let def = FLOORS[n], placeholder = false, err = null;
  if (!def || typeof def !== 'object'){ def = makePlaceholder(n); placeholder = true; }
  const meta = { id:n, name: def.name || DEFAULT_META[n].name, nameJP: def.nameJP || DEFAULT_META[n].nameJP,
                 desc: def.desc || DEFAULT_META[n].desc, placeholder, file:'floor'+n+'.js' };
  const shell = Object.assign({}, DEFAULT_SHELL[n], (def.shell && typeof def.shell === 'object') ? def.shell : {});
  floorInfo[n] = { def, meta, shell, placeholder };
  let objs = [];
  try { objs = withFloor(n, () => (typeof def.build === 'function' ? def.build(makeF(n)) : [])) || []; if (!Array.isArray(objs)) objs = []; }
  catch(e){
    err = e; console.error('[core] floor'+n+'.js build() error → ใช้ placeholder แทน', e);
    def = makePlaceholder(n); placeholder = true; meta.placeholder = true; meta.error = String(e && e.message || e);
    floorInfo[n] = { def, meta, shell: Object.assign({}, DEFAULT_SHELL[n]), placeholder };
    objs = withFloor(n, () => def.build(makeF(n)));
  }
  floorObjs[n] = [];
  for (const o of objs) if (o && typeof o === 'object'){ normalize(o, n); floorObjs[n].push(o); ALL.push(o); }
  return err;
}

/* ============================== ELEVATOR ============================== */
const elevator = {
  id:'elevator', kind:'elevator', label:'ลิฟต์แก้ว', name:'ลิฟต์แก้ว', hint:'คลิก: ขึ้นชั้นถัดไป',
  floor:0, x:0, y:0, w:0, h:0, state:{}, pos:1, target:1, mode:'open', door:1,
  goTo(f){
    f = Math.max(1, Math.min(5, Math.round(+f || 1)));
    this.target = f;
    if (this.mode === 'moving') return;
    if (Math.abs(this.pos - f) < 1e-4){ this.pos = f; if (this.mode !== 'open') this.mode = 'opening'; return; }
    this.mode = this.door > 0 ? 'closing' : 'moving';
    log('ลิฟต์ → '+f+'F');
  },
  get dir(){ return this.mode === 'moving' ? Math.sign(this.target - this.pos) : 0; },
  get at(){ return Math.round(this.pos); },
  draw(){},
  onClick(){
    if (this.mode === 'moving'){ bubble('elevator', 'กำลังวิ่ง… → '+this.target+'F', 1000); return; }
    const nx = this.at >= 5 ? 1 : this.at + 1; bubble('elevator', 'ติ๊ง! ไป '+nx+'F', 1000); this.goTo(nx);
  }
};
function updateElevator(dt){
  const e = elevator;
  if (e.mode === 'closing'){ e.door -= dt/0.45; if (e.door <= 0){ e.door = 0; e.mode = Math.abs(e.pos - e.target) > 1e-4 ? 'moving' : 'closed'; } }
  else if (e.mode === 'moving'){
    const d = e.target - e.pos, step = dt * 1;           // 1 ชั้น/วินาที
    if (Math.abs(d) <= step){ e.pos = e.target; e.mode = 'opening'; fire('arrive', e.target); log('ลิฟต์ถึง '+e.target+'F'); }
    else e.pos += Math.sign(d) * step;
  }
  else if (e.mode === 'opening'){ e.door += dt/0.45; if (e.door >= 1){ e.door = 1; e.mode = 'open'; } }
}
function drawShaft(){
  const pc = CUR, pd = DIM; CUR = 1; DIM = 0;
  const glassA = time.phase === 'morning' ? .22 : .16;
  // ผนังกระจกด้านหลัง (จาง) + ราง
  ctx.globalAlpha = .10; wqX(SX0, SY0, SY1, SZ0, SZ1, PAL.glass); wqY(SY0, SX0, SX1, SZ0, SZ1, PAL.glass); ctx.globalAlpha = 1;
  const bp = WP(SX0, SY0, SZ1), bpb = WP(SX0, SY0, SZ0); rect(bp[0], bp[1], 1, bpb[1]-bp[1], PAL.metalD);
  for (const yy of [SY0+2, SY1-2]){ const a = WP(SX0, yy, SZ1), b = WP(SX0, yy, SZ0); rect(a[0], a[1], 1, b[1]-a[1], '#3a3a52'); }
  // ตู้
  drawCab();
  // กระจกหน้า 2 ด้าน
  ctx.globalAlpha = glassA; wqY(SY1, SX0, SX1, SZ0, SZ1, PAL.glass); wqX(SX1, SY0, SY1, SZ0, SZ1, PAL.glass); ctx.globalAlpha = 1;
  ctx.globalAlpha = .45;
  for (let z = 10; z < SZ1-20; z += 37){ seg(WP(SX0+2, SY1, z), WP(SX0+5, SY1, z+9), PAL.white); seg(WP(SX0+3.5, SY1, z+1), WP(SX0+5.5, SY1, z+7), PAL.white); }
  for (let z = 28; z < SZ1-20; z += 53) seg(WP(SX1, SY0+2, z), WP(SX1, SY0+4, z+10), PAL.white);
  ctx.globalAlpha = 1;
  // คานรับทุกชั้น
  for (let n = 1; n <= 5; n++){ const z0 = zOf(n); wqY(SY1, SX0, SX1, z0-SLAB, z0, PAL.concrete, PAL.ol); wqX(SX1, SY0, SY1, z0-SLAB, z0, PAL.concreteSh, PAL.ol); }
  // เสามุม
  for (const [x,y] of [[SX0,SY1],[SX1,SY1],[SX1,SY0]]){ const a = WP(x,y,SZ1), b = WP(x,y,SZ0); rect(a[0]-1, a[1], 2, b[1]-a[1], PAL.ol); rect(a[0]-1, a[1], 1, b[1]-a[1], PAL.metal); }
  // ฐาน + ห้องเครื่องบนหัว
  wbox(SX0-0.5, SY0, SZ0, 12.5+0.5, 8.5, 3, PAL.concrete, PAL.concrete, PAL.concreteSh);
  wbox(SX0-0.5, SY0-0.5, SZ1, 13, 9, 10, '#5a5470', '#45405a', '#37334a');
  // ไฟเลขชั้น (หันหน้าตรง)
  const lp = WP(SX0+6.5, SY0+4.5, SZ1+10);
  const e = elevator, dir = e.dir;
  const bx = Math.round(lp[0]-10), by = Math.round(lp[1]-14);
  rect(bx+9, by+11, 2, 4, PAL.ol);
  orect(bx, by, 21, 11, '#1a0e14', PAL.ol);
  emit(() => { text((dir > 0 ? '↑' : dir < 0 ? '↓' : ' ') + e.at + 'F', bx+3, by+3, dir ? PAL.red : PAL.warm); });
  CUR = pc; DIM = pd;
}
function drawCab(){
  const e = elevator, cz = zOf(1) + (e.pos-1)*FH, ch = 40;
  const cx0 = SX0+1, cx1 = SX1-1, cy0 = SY0+1, cy1 = SY1-1, cw = cx1-cx0, cd = cy1-cy0;
  // สลิง
  const c1 = WP((cx0+cx1)/2, (cy0+cy1)/2, cz+ch), c2 = WP((cx0+cx1)/2, (cy0+cy1)/2, SZ1);
  rect(c1[0], c2[1], 1, c1[1]-c2[1], PAL.ol);
  wbox(cx0, cy0, cz, cw, cd, ch, '#d8d4e0', '#a29eb6', '#7c7892');
  // ประตูด้านซ้าย-ล่าง (ระนาบ cy1)
  const d0 = cx0+1, d1 = cx1-1, half = (d1-d0)/2, op = e.door*e.door*(3-2*e.door), pw = half*(1-op*.9);
  const night = time.phase !== 'morning';
  wqY(cy1+0.01, d0, d1, cz+2, cz+32, night ? '#ffd9a0' : '#e8c890');
  wqY(cy1+0.015, d0, d1, cz+2, cz+11, night ? '#e0a860' : '#c8a070');
  wqY(cy1+0.02, d0, d0+pw, cz+2, cz+32, '#c4c2d4', PAL.ol);
  wqY(cy1+0.02, d1-pw, d1, cz+2, cz+32, '#b4b2c6', PAL.ol);
  if (op > .3 && night) emit(() => { ctx.globalAlpha = .18*op; wqZ(cz, d0-1, d1+1, cy1, cy1+5, PAL.warm); ctx.globalAlpha = 1; });
  // แถบไฟบนประตู + หน้าต่างข้าง
  wqY(cy1+0.02, d0+1, d1-1, cz+34, cz+36, PAL.ol);
  emit(() => { const q = WP(d0+3+((Math.floor(S.t*4))%4), cy1+0.03, cz+36); px(q[0], q[1], e.dir ? PAL.red : PAL.leaf); });
  wqX(cx1+0.02, cy0+1.5, cy1-1.5, cz+14, cz+32, PAL.glass, PAL.ol);
  Object.assign(e, wbbox(cx0, cy0, cz, cw, cd, ch));
  e.ax = WP((cx0+cx1)/2, cy1, cz+ch)[0]; e.ay = e.y;
}
function drawFloorTags(){
  for (let n = 1; n <= 5; n++){
    const p = WP(SX0, SY1, zOf(n)+60), x = Math.round(p[0]) - 21, y = Math.round(p[1]) - 6;
    const here = elevator.at === n && elevator.mode !== 'moving', hl = S.hl === n;
    orect(x, y, 17, 11, hl ? PAL.wall : '#1a1a30', hl ? PAL.warm : PAL.ol);
    emit(() => text(n+'F', x+4, y+3, here ? PAL.warm : (hl ? PAL.cream : PAL.metal)));
    if (here) emit(() => { rect(x+17, y+4, 2, 3, PAL.warm); });
  }
}

/* ============================== SNOW ============================== */
const FLAKES = [];
function initSnow(){ const r = rng(2026); FLAKES.length = 0; for (let i = 0; i < 52; i++) FLAKES.push({x:r()*W, y:r()*H, v:10+r()*16, ph:r()*6.28, big:r() < .22}); }
function updateSnow(dt){ for (const f of FLAKES){ f.y += f.v*dt; f.x += Math.sin(S.t*0.9 + f.ph)*5*dt - 2*dt; if (f.y > H+2){ f.y = -3; f.x = Math.random()*W; } if (f.x < -3) f.x += W+6; } }
function drawSnow(){
  const c = time.phase === 'night' ? '#e4eaff' : time.phase === 'evening' ? '#fbe8e4' : '#ffffff';
  ctx.fillStyle = c; ctx.globalAlpha = .9;
  for (const f of FLAKES){ const x = Math.round(f.x), y = Math.round(f.y); if (f.big){ ctx.fillRect(x, y, 2, 2); } else ctx.fillRect(x, y, 1, 1); }
  ctx.globalAlpha = 1;
}

/* ============================== BUBBLES (HTML overlay) ============================== */
function bubble(id, text, ms=1800){
  S.bubbles = S.bubbles.filter(b => { if (b.id === id){ b.el && b.el.remove(); return false; } return true; });
  S.bubbles.push({id, text:String(text), until:performance.now() + ms, el:null});
}
function updateBubbles(){
  if (!bubbleLayer) return;
  const now = performance.now(), rc = canvas.getBoundingClientRect(), sc = rc.width / W;
  S.bubbles = S.bubbles.filter(b => {
    const o = find(b.id) || (b.id === 'elevator' ? elevator : null);
    if (b.until < now || !o){ b.el && b.el.remove(); return false; }
    if (!b.el){ b.el = document.createElement('div'); b.el.className = 'bubble'; b.el.textContent = b.text; bubbleLayer.appendChild(b.el); }
    const ax = o.ax != null ? o.ax : o.x + o.w/2, ay = o.ay != null ? o.ay : o.y;
    b.el.style.left = (ax*sc) + 'px'; b.el.style.top = ((ay-2)*sc - 10) + 'px';
    return true;
  });
}

/* ============================== LOG ============================== */
const LOG = [];
function log(s){ const d = new Date(); const line = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0')+' '+s; LOG.unshift(line); if (LOG.length > 30) LOG.length = 30; fire('log', line, LOG); }

/* ============================== RENDER ============================== */
function band(n){ const z0 = zOf(n), z1 = z0+FH; return [WP(0,UY,z0-SLAB),WP(UX,UY,z0-SLAB),WP(UX,0,z0-SLAB),WP(UX,0,z1),WP(UX,UY,z1),WP(0,UY,z1)]; }
function silhouette(n, top){ const z0 = zOf(n), z1 = z0+(top != null ? top : FH); return [WP(-WALL,UY,z0-SLAB),WP(UX,UY,z0-SLAB),WP(UX,-WALL,z0-SLAB),WP(UX,-WALL,z1),WP(-WALL,-WALL,z1),WP(-WALL,UY,z1)]; }
function inPoly(p,x,y){ let c = false; for (let i = 0, j = p.length-1; i < p.length; j = i++){ const a = p[i], b = p[j]; if (((a[1] > y) !== (b[1] > y)) && (x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) c = !c; } return c; }
const ghostFrom = () => (S.hl && Core.xray) ? S.hl + 1 : 99;
function drawFloor(n, ghost){
  CUR = n; DIM = isDark(n) ? 1 : 0;
  const sc = shellCanvas(n, DIM); ctx.drawImage(sc.c, sc.x, sc.y);
  const info = floorInfo[n];
  if (info.def && typeof info.def.ambient === 'function' && !info._ambErr){
    try { info.def.ambient.call(info.def, ctx, S.t); } catch(e){ info._ambErr = true; console.error('[core] floor'+n+' ambient() error (ปิดทิ้ง)', e); }
  }
  const list = floorObjs[n].slice().sort((a,b) => ((a.order != null ? a.order : a.y+a.h) - (b.order != null ? b.order : b.y+b.h)) || (a._i - b._i));
  for (const o of list){
    if (o.hidden || o._dead) continue;
    if (typeof o.draw === 'function'){
      try { o.draw.call(o, ctx, S.t, o.state); }
      catch(e){ o._dead = true; console.error('[core] object "'+o.id+'" draw() error (ปิดทิ้ง)', e); }
    }
    if (!ghost) drawn.push(o);
  }
  DIM = 0; ctx.globalAlpha = 1;
}
function render(){
  ctx = mainCtx; ctx.globalAlpha = 1; drawn = [];
  const BGL = BG[time.phase];
  ctx.drawImage(BGL.sky, 0, 0, W, 460, 0, 0, W, 460);   // ฟ้า ฟูจิ ป่าไกล (cache) — ใต้ y 460 ถูกชั้นป่ากลาง/ใกล้/หมู่บ้านทับหมด
  skyAnim(); drawSkyLife(BGL); drawFireworks();  // เมฆลอย นก พลุ (ทุกเฟรม)
  drawForestAndShrine(BGL);                     // ป่ากลาง/ใกล้ (โยก) → หมู่บ้าน → ศาลเจ้า → ผ้า/โคม/ควัน ตามลม
  ctx.drawImage(BGL.ext, 0, 100);               // แอร์ ระเบียง แท็งก์น้ำ ป้ายดาดฟ้า (หลังตึก)
  const gf = ghostFrom(); let ghostUsed = false;
  for (let n = 1; n <= 5; n++){
    const ghost = n >= gf;
    if (ghost && !ghostUsed){ layerCtx.setTransform(1,0,0,1,0,0); layerCtx.globalAlpha = 1; layerCtx.clearRect(0,0,W,H); ghostUsed = true; }
    ctx = ghost ? layerCtx : mainCtx;
    drawFloor(n, ghost);
  }
  ctx = mainCtx; CUR = 1;
  if (ghostUsed){
    ctx.globalAlpha = .2; ctx.drawImage(layer, 0, 0); ctx.globalAlpha = 1;
    for (let n = gf; n <= 5; n++){ const sh = floorInfo[n].shell; ctx.globalAlpha = .55; polyOutline(sh && sh.open ? silhouette(n, (sh.wallH || 16) + 2) : silhouette(n), PAL.metal); ctx.globalAlpha = 1; }
  }
  // world objects (floor 0) — ตู้กดน้ำ/จักรยานข้างตึก (Lawson เป็นภาพใน BG อย่างเดียว)
  for (const o of floorObjs[0]){
    if (o.hidden || o._dead) continue;
    if (typeof o.draw === 'function'){ try { o.draw.call(o, ctx, S.t, o.state); } catch(e){ o._dead = true; console.error('[core] object "'+o.id+'" draw() error', e); } }
    drawn.push(o);
  }
  drawShaft(); drawn.push(elevator);
  ctx.drawImage(BGL.extF, 0, 380);              // ไม้เลื้อย กันสาด ป้ายแขวน กระถาง เสาไฟฟ้า+สาย
  drawStreetLife();                              // คนเดินผ่าน + กลีบบ๊วย
  drawTraffic();                                 // รถวิ่งผ่านบนถนนหน้าตึก (อยู่หน้าตึก/ปล่องลิฟต์เสมอ)
  drawFloorTags();
  // ไฮไลต์ชั้น
  const showF = (n, strong) => {
    // ชั้นเปิดโล่ง (5F ดาดฟ้า): กรอบไฮไลต์สูงแค่ราวกันตก — ไม่มีเส้นขอบ "หลังคา" ลอยบนฟ้า
    const sh = floorInfo[n] && floorInfo[n].shell, open = sh && sh.open;
    const poly = open ? silhouette(n, (sh.wallH || 16) + 2) : ((strong && Core.xray) || n === 5 ? silhouette(n) : band(n));
    ctx.globalAlpha = strong ? .09 : .05; fillPoly(poly, PAL.warm); ctx.globalAlpha = 1;
    polyOutline(poly, strong ? PAL.warm : PAL.cityWin);
  };
  if (S.hl) showF(S.hl, true);
  if (S.hoverFloor && S.hoverFloor !== S.hl) showF(S.hoverFloor, false);
  const o = S.hoverObj;
  if (o){ const x0 = o.x-2, y0 = o.y-2, x1 = o.x+o.w+1, y1 = o.y+o.h+1, c = PAL.warm, L = 3;
    for (const [x,y,dx,dy] of [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]]){ rect(Math.min(x,x+dx*(L-1)), y, L, 1, c); rect(x, Math.min(y,y+dy*(L-1)), 1, L, c); } }
  if (Core.grid) drawGrid();
  if (Core.snow) drawSnow();
}
function drawGrid(){
  for (let n = 1; n <= 5; n++){
    CUR = n;
    if (n >= ghostFrom()) continue;
    for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++){
      const fx = i/10, fy = j/10, p = iso(fx, fy, 0);
      const vis = visible(fx, fy, 0) || (S.hl === n && Core.xray);
      px(p.x, p.y, vis ? (i === 5 || j === 5 ? PAL.warm : PAL.screen) : PAL.red);
    }
    const a = iso(1.04, 0, 0), b = iso(0, 1.04, 0);
    text('FX', a.x+2, a.y-2, PAL.screen); text('FY', b.x-10, b.y-2, PAL.screen);
  }
  CUR = 1;
}

/* ============================== INPUT ============================== */
function toCanvas(e){ const r = canvas.getBoundingClientRect(); return [(e.clientX-r.left)*W/r.width, (e.clientY-r.top)*H/r.height]; }
function hitObj(x,y){ for (let i = drawn.length-1; i >= 0; i--){ const o = drawn[i]; if (typeof o.onClick === 'function' && x >= o.x && x < o.x+o.w && y >= o.y && y < o.y+o.h) return o; } return null; }
function hitFloor(x,y){
  if (S.hl && Core.xray && inPoly(silhouette(S.hl), x, y)) return S.hl;
  if (inPoly(silhouette(5), x, y)) return 5;
  for (let n = 4; n >= 1; n--) if (inPoly(band(n), x, y)) return n;
  return null;
}
function setHoverObj(o){ if (o !== S.hoverObj){ S.hoverObj = o; fire('hoverObj', o); } }
function setHoverFloor(f){ if (f !== S.hoverFloor){ S.hoverFloor = f; fire('hover', f); } }
function bindInput(){
  canvas.addEventListener('mousemove', e => {
    const [x,y] = toCanvas(e); const o = hitObj(x,y), f = hitFloor(x,y);
    canvas.style.cursor = o ? 'pointer' : (f ? 'crosshair' : 'default');
    setHoverObj(o); setHoverFloor(f);
  });
  canvas.addEventListener('mouseleave', () => { setHoverObj(null); setHoverFloor(null); canvas.style.cursor = 'default'; });
  canvas.addEventListener('click', e => {
    const [x,y] = toCanvas(e); const o = hitObj(x,y);
    if (o){ try { o.onClick.call(o); } catch(err){ console.error('[core] onClick "'+o.id+'"', err); } fire('click', o.id, o); return; }
    const f = hitFloor(x,y);
    if (f){ highlight(f); elevator.goTo(f); } else highlight(null);
  });
}
function highlight(id){ id = (id >= 1 && id <= 5) ? (id|0) : null; if (id !== S.hl){ S.hl = id; fire('highlight', id); } }

/* ============================== LOOP ============================== */
let lastTs = 0, acc = 0, lastTick = 0; const STATS = { renderMs:0, frames:0 };
function frame(ts){
  requestAnimationFrame(frame);
  tick(ts);
}
function tick(ts){
  lastTick = performance.now();
  const now = ts/1000; let dt = lastTs ? now - lastTs : 0; lastTs = now; if (dt > 1) dt = 1; if (dt < 0) dt = 0;   // แท็บถูกพัก → ไม่กระโดดเกิน 1 วิ
  S.t += dt; updateTime(dt); updateElevator(dt); if (Core.snow) updateSnow(dt); updateFireworks(dt); updateWind(dt); updateTraffic(dt); updateStreetLife(dt);
  acc += dt; if (acc < 1/DRAW_FPS - 0.002) return; acc = 0;
  const r0 = performance.now();
  try { render(); } catch(e){ console.error('[core] render', e); }
  STATS.renderMs = STATS.renderMs*.9 + (performance.now()-r0)*.1; STATS.frames++;
  updateBubbles();
  fire('frame', time);
}

/* ============================== BOOT ============================== */
function boot(o={}){
  if (S.booted) return; S.booted = true;
  canvas = o.canvas; canvas.width = W; canvas.height = H;
  mainCtx = canvas.getContext('2d'); mainCtx.imageSmoothingEnabled = false; ctx = mainCtx;
  layer = mk(W,H); layerCtx = layer.getContext('2d');
  bubbleLayer = o.bubbles || null;
  const qs = new URLSearchParams(location.search);
  if (PHASES.includes(qs.get('phase'))) time.phase = qs.get('phase');
  if (qs.get('grid') === '1') Core.grid = true;
  if (qs.get('snow') === '0') Core.snow = false;
  if (qs.get('fw') === '0') Core.fireworks = false;
  if (/^[1-4]$/.test(qs.get('ps') || '')) Core.PEOPLE_SCALE = +qs.get('ps');
  collectPeople();                               // ต้องก่อน resolveFloor (spriteBBox ของคนจะขยายตาม PEOPLE_SCALE)
  for (const p of PHASES) BG[p] = buildBG(p);
  const errs = [];
  for (let n = 1; n <= 5; n++){ const e = resolveFloor(n); if (e) errs.push(n); }
  Core.floors.length = 0;
  for (let n = 1; n <= 5; n++) Core.floors.push(floorInfo[n].meta);
  addStreet();                                   // ทางเท้าหน้าตึก: ตู้กดน้ำ + จักรยาน (Lawson ย้ายไปเป็นฉากหลังแล้ว)
  ALL.push(elevator);
  initSnow(); bindInput();
  addEventListener('keydown', e => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'g'){ Core.grid = !Core.grid; fire('toggle','grid',Core.grid); }
    else if (k === 'p'){ pause(); }
    else if (k === 's'){ Core.snow = !Core.snow; fire('toggle','snow',Core.snow); }
    else if (k === 'w'){ Core.wind = !Core.wind; fire('toggle','wind',Core.wind); }
    else if (k === 'f'){ Core.fireworks = !Core.fireworks; fire('toggle','fireworks',Core.fireworks); }
    else if (k === 'x'){ Core.xray = !Core.xray; fire('toggle','xray',Core.xray); }
    else if (k >= '1' && k <= '5'){ highlight(+k); elevator.goTo(+k); }
  });
  if (document.fonts && document.fonts.load){
    Promise.all([document.fonts.load('12px "DotGothic16"','屋上居酒屋'), document.fonts.load('16px "DotGothic16"','休憩室')])
      .then(() => { jpRows.clear(); maskCache.clear(); for (const p of PHASES) BG[p] = buildBG(p); }).catch(() => {});   // ฉากหลังมีป้ายญี่ปุ่น → วาดใหม่หลังฟอนต์มา
  }
  const ph = floorInfo, nPh = [1,2,3,4,5].filter(n => ph[n].placeholder).length;
  log('ระบบพร้อม · 5 ชั้น' + (nPh ? ' (placeholder '+nPh+')' : ''));
  if (errs.length) log('⚠ build error ชั้น '+errs.join(', ')+' → ใช้ placeholder');
  // วาดเฟรมแรกทันที (ไม่รอ requestAnimationFrame — แท็บ/แพนที่ถูกซ่อนอาจไม่ยิง rAF เลย → จอดำ 1-2 วิ)
  try { render(); updateBubbles(); STATS.frames++; } catch(e){ console.error('[core] first render', e); }
  requestAnimationFrame(frame);
  // watchdog: ถ้า rAF เงียบ > 0.4 วิ (แท็บพื้นหลัง/preview pane) เดินเวลาเองด้วย timer (เบราว์เซอร์อาจหน่วงเหลือ ~1 ครั้ง/วิ ก็ไม่เป็นไร)
  setInterval(() => { if (performance.now() - lastTick > 400){ acc = 1; tick(performance.now()); } }, 250);
  fire('ready');
}

/* ============================== EXTERIOR + STREET LIFE (รอบ 4b ตามภาพอ้างอิง 7-14) ==============================
   หน่วยโลก: ตึก x 0..40 · y 0..80 · ผนังหลังด้านนอก = x -3 / y -3 · ชั้น n เริ่ม z (n-1)*136 · พื้นถนน z = -SLAB
   ชั้น cache ต่อเฟรมเวลา:
     L.ext  (วาดก่อนตึก)  ของติด "ผนังด้านนอกฝั่งขวา-หลัง" ที่โผล่พ้นขอบตึก: แอร์ + ท่อน้ำทิ้ง + กล่องสาย/มิเตอร์ (2F 4F),
                          ระเบียง + ราวตากผ้า (3F), แท็งก์น้ำ + เสาอากาศ + ป้ายนีออนบนดาดฟ้า (5F)
     L.extF (วาดหลังตึก)  ไม้เลื้อยมุมขวา · กันสาดลายทาง + ป้ายแขวน カフェ (1F หน้าถนน) · กระถางต้นไม้ + ตู้จดหมาย · เสาไฟฟ้า+หม้อแปลง+สายระโยง
     front (BG)          ทางม้าลาย · ป้ายรถเมล์ · ตู้ไปรษณีย์ · กรวย · ต้นบ๊วย (ume) ข้างป้ายรถเมล์
   ทุกเฟรม: ตู้กดน้ำ 4 ตู้ (floor 0, คลิกได้) · สัญญาณไฟจราจร (สลับสี) · คนเดินผ่าน (customer_walk 2x) · กลีบบ๊วยร่วงตามลม     */
const EXT_DIM = { morning:1, evening:.78, night:.55 };
function acUnit(x, y, z, P, k){                         // แอร์คอยล์ร้อน + ขายึด + ท่อ
  const c = shade('#dcdce2', k), cs = shade('#b8b8c4', k), cd = shade('#8a8a9a', k);
  wbox(x, y, z, 8, 6, 12, shade('#ececf0', k), cs, c, PAL.ol);
  const f = WP(x + 8, y + 2.6, z + 6); ellipse(f[0], f[1], 3, 4, cd); ellipse(f[0], f[1], 2, 3, shade('#5a5a6a', k)); px(f[0], f[1], cs);
  for (let i = 0; i < 3; i++){ const a = WP(x + 8, y + 5 - i*.5, z + 3 + i*3), b = WP(x + 8, y + 5 - i*.5, z + 4 + i*3); seg(a, b, cd); }
  seg(WP(x + 1, y + 6, z - 1), WP(x + 7, y + 6, z - 1), PAL.ol); seg(WP(x + 7, y + 6, z - 1), WP(x + 7, y + 3, z - 4), PAL.ol);   // ขายึด
  const p0 = WP(x + 3, y + 6, z + 8), p1 = WP(39.6, -3.4, z + 8); seg(p0, p1, shade('#e8e0d0', k));                              // ท่อน้ำยา (หุ้มขาว)
}
function dripPipe(z0, z1, k, x = 39.5, y = -3.6){
  const a = WP(x, y, z1), b = WP(x, y, z0); rect(a[0], a[1], 2, b[1] - a[1], shade('#9a9aa8', k)); rect(a[0] + 1, a[1], 1, b[1] - a[1], shade('#6a6a7a', k));
  for (let z = z0 + 30; z < z1; z += 40){ const q = WP(x, y, z); rect(q[0] - 1, q[1], 4, 1, PAL.ol); }
}
function meterBox(x, y, z, k){ wbox(x, y, z, 2, 3, 9, shade('#c8ccd0', k), shade('#a8acb4', k), shade('#b8bcc4', k), PAL.ol); const q = WP(x + 2, y + 1.5, z + 6); rect(q[0] - 1, q[1], 2, 2, shade('#2a2a3a', k)); px(q[0], q[1] + 3, '#e8b020'); }
function exteriorBack(P, phase){
  const k = EXT_DIM[phase], Z = n => (n - 1)*FH;
  // 1F: มิเตอร์ไฟ + มิเตอร์แก๊ส + ท่อ
  meterBox(37.5, -6.2, 34, k); meterBox(37.5, -6.2, 50, k);
  dripPipe(-SLAB, Z(2) + 22, k);                                              // ท่อน้ำทิ้งแอร์ 2F ลงพื้น
  dripPipe(-SLAB, Z(4) + 22, k, 38.2, -3.8);                                  // ท่อจาก 4F
  // 2F: แอร์ + กล่องสาย (สายไฟจากเสาเข้าตรงนี้)
  acUnit(31, -11, Z(2) + 20, P, k); meterBox(37, -6, Z(2) + 52, k);
  // 3F: ระเบียง + ราวตากผ้า + กระถาง
  { const z = Z(3) + 2, sl = shade('#8a8aa0', k);
    wbox(24, -16, z - 3, 16, 13, 3, shade('#b0aab8', k), shade('#8a8498', k), shade('#7a7488', k), PAL.ol);
    for (let yy = -16; yy <= -3; yy += 2.6){ const a = WP(40, yy, z), b = WP(40, yy, z + 14); rect(a[0], b[1], 1, a[1] - b[1], sl); }
    for (let xx = 24; xx <= 40; xx += 3.2){ const a = WP(xx, -16, z), b = WP(xx, -16, z + 14); rect(a[0], b[1], 1, a[1] - b[1], sl); }
    seg(WP(40, -16, z + 14), WP(40, -3, z + 14), shade('#c8c8d8', k)); seg(WP(24, -16, z + 14), WP(40, -16, z + 14), shade('#c8c8d8', k));
    seg(WP(25, -11, z + 34), WP(40, -11, z + 34), shade('#d8d8e0', k));                                  // ราวตากผ้า
    const cl = ['#f6f8fc', '#4a7ad8', '#e85a5a', '#f6f8fc', '#e8c040'];
    cl.forEach((c, i) => { const x0 = 27 + i*2.6; wqY(-11, x0, x0 + 2, z + 22 + (i % 2)*3, z + 33.5, shade(c, k), PAL.ol); });
    const pp = WP(37, -14, z); rect(pp[0] - 2, pp[1] - 4, 5, 4, shade('#b5703c', k)); ellipse(pp[0], pp[1] - 7, 3, 3, shade('#4f9a5a', k)); }
  // 4F: แอร์ + จานดาวเทียม
  acUnit(30, -11, Z(4) + 24, P, k); meterBox(37, -6, Z(4) + 60, k);
  { const d = WP(38, -9, Z(4) + 80); ellipse(d[0], d[1], 4, 5, shade('#e8e8ee', k)); ellipse(d[0] + 1, d[1], 2, 4, shade('#c8c8d0', k)); seg([d[0] + 1, d[1]], [d[0] - 4, d[1] + 3], PAL.ol); }
  // 5F ดาดฟ้า: แท็งก์น้ำบนขาตั้ง + เสาอากาศ (มุมหลัง) · ป้ายนีออนหลังผนังยาว
  { const z = Z(5), legs = [[-11, -11], [-3, -11], [-11, -3], [-3, -3]];
    for (const [x, y] of legs){ const a = WP(x, y, z), b = WP(x, y, z + 50); rect(a[0], b[1], 1, a[1] - b[1], shade('#6a6a7a', k)); }
    for (const zz of [z + 18, z + 36]){ seg(WP(-11, -3, zz), WP(-3, -3, zz), shade('#6a6a7a', k)); seg(WP(-3, -11, zz), WP(-3, -3, zz), shade('#6a6a7a', k)); }
    const c = WP(-7, -7, z + 50), tw = 9, th = 16, tc = shade('#9ab0c8', k);
    rect(c[0] - tw, c[1] - th, 2*tw + 1, th, tc); rect(c[0] + 3, c[1] - th, tw - 3, th, shade('#7a90aa', k));
    ellipse(c[0], c[1], tw, 3, shade('#7a90aa', k)); ellipse(c[0], c[1] - th, tw, 3, shade('#c4d4e4', k));
    rect(c[0] - tw - 1, c[1] - th, 1, th, PAL.ol); rect(c[0] + tw + 1, c[1] - th, 1, th, PAL.ol);
    for (const yy of [c[1] - th + 5, c[1] - 5]) rect(c[0] - tw, yy, 2*tw + 1, 1, shade('#6a809a', k));
    if (P.fSnow) ellipse(c[0], c[1] - th - 1, tw - 2, 1, P.fSnow);
    const at = c[1] - th - 3; rect(c[0] + 4, at - 20, 1, 20, PAL.ol);                               // เสาอากาศ yagi
    for (let i = 0; i < 4; i++){ const yy = at - 18 + i*4, w = 7 - i; seg([c[0] + 4 - w, yy + 2], [c[0] + 4 + w, yy - 2], shade('#4a4a5a', k)); }
    // ป้ายนีออนบนดาดฟ้า (ระนาบขนานผนังยาว หลังคานโคม)
    const y0 = 34, y1 = 70, zb = z + 84, zt = z + 104, lit = phase !== 'morning';
    for (const y of [y0 + 1, y1 - 1]){ const a = WP(-6, y, z), b = WP(-6, y, zb); rect(a[0], b[1], 1, a[1] - b[1], PAL.ol); }
    wqX(-6, y0, y1, zb, zt, '#1c1a2a', PAL.ol); wqX(-5.9, y0 + .6, y1 - .6, zt - 2, zt - 1, '#ff5aa8');
    const tp = WP(-5.8, y1 - 2, zt - 4), run = () => textJP('居酒屋ビル', 11, tp[0], tp[1], lit ? '#ff8ad8' : '#e8a8c8', -1);
    lit ? emit(() => { const g = ctx.globalAlpha; ctx.globalAlpha = .16; wqX(-6.1, y0 - 1, y1 + 1, zb - 3, zt + 3, '#ff5aa8'); ctx.globalAlpha = g; run(); }) : run(); }
}
function vine(P, k){                                    // ไม้เลื้อยมุมขวา (ขอบผนังตัด x = UX) จากพื้นขึ้นถึงกลาง 3F
  const r = rng(808), L = ['#2a5a2a', '#3a7a3a', '#5aa04a', '#86c060'].map(c => shade(c, k));
  for (let s = 0; s < 3; s++){
    let y = -1.5 + s*.6, z = -SLAB;
    const top = 150 + s*70 + r()*30;
    while (z < top){
      const p = WP(40, y, z); px(p[0], p[1], shade('#4a3a22', k));
      if (r() < .55){ const c = L[(r()*4)|0], dx = (r()*5|0) - 2; rect(p[0] + dx, p[1] - 1, 2, 2, c); if (r() < .4) px(p[0] + dx + 2, p[1], L[3]); }
      y = Math.max(-3, Math.min(0, y + (r() - .5)*.8)); z += 1.5;
    }
  }
  for (let i = 0; i < 30; i++){ const z = r()*150, p = WP(40, -3, z); rect(p[0] + 1 + (r()*6|0), p[1] - (r()*3|0), 2, 2, L[(r()*4)|0]); }   // ใบลามไปข้างระเบียง/ท่อ
}
function awning(P, k, lit){                             // กันสาดลายทาง + ป้ายผ้า COFFEE·24H (1F ฝั่งถนน y = UY)
  const x0 = 16, x1 = 38, zt = 124, zb = 112, yo = UY + 9, s = 2.2, red = shade('#c8303a', k), crm = shade('#f4ead8', k);
  for (let x = x0, i = 0; x < x1; x += s, i++){ const xe = Math.min(x1, x + s); fillPoly([WP(x, UY, zt), WP(xe, UY, zt), WP(xe, yo, zb), WP(x, yo, zb)], i % 2 ? crm : red); }
  fillPoly([WP(x1, UY, zt), WP(x1, yo, zb), WP(x1, UY, zb)], shade('#8a2028', k));
  wqY(yo, x0, x1, zb - 7, zb, red, PAL.ol);
  for (let x = x0 + 1; x < x1; x += 2){ const p = WP(x, yo, zb - 7); px(p[0], p[1], crm); }
  polyOutline([WP(x0, UY, zt), WP(x1, UY, zt), WP(x1, yo, zb), WP(x0, yo, zb)], PAL.ol);
  const tp = WP(x0 + 2.5, yo, zb - 1.5), run = () => text('COFFEE 24H', tp[0], tp[1], '#fff6dc', {shear:1});
  lit ? emit(run) : run();
  if (P.fSnow) seg(WP(x0, UY + .5, zt + 1), WP(x1, UY + .5, zt + 1), P.fSnow);
}
function hangSign(P, k, lit){                           // ป้ายแขวนแนวตั้งมุมหน้า (2F) カフェ
  const p = WP(UX + 3, -1.5, 196), x = p[0] - 4, y = p[1] - 56;   // ยื่นจากมุมขวา-หลัง (ไม่บังห้อง cutaway)
  seg(WP(UX, -1.5, 258), WP(UX + 3, -1.5, 258), PAL.ol); rect(p[0], y - 5, 1, 5, PAL.ol);
  if (lit) emit(() => { const g = ctx.globalAlpha; ctx.globalAlpha = .18; rect(x - 3, y - 3, 15, 62, '#ffe6b0'); ctx.globalAlpha = g; });
  orect(x, y, 9, 56, lit ? '#fff6e0' : shade('#f2ead8', k), PAL.ol); rect(x + 1, y + 1, 7, 2, '#c8303a'); rect(x + 1, y + 53, 7, 2, '#c8303a');
  const run = () => { ['カ', 'フ', 'ェ'].forEach((ch, i) => textJP(ch, 8, x + 1, y + 5 + i*11, '#7a2a1a')); text('24', x + 1, y + 41, '#c8303a'); };
  lit ? emit(run) : run();
}
function shopFront(P, k){                               // กระถางต้นไม้ + ตู้จดหมาย หน้า 1F
  const pot = (x, y, s) => { const p = WP(x, y, -SLAB); rect(p[0] - 3, p[1] - 5, 7, 5, shade('#b5603c', k)); rect(p[0] - 3, p[1] - 5, 7, 1, shade('#d88a5a', k));
    for (let i = 0; i < 6 + s*3; i++){ const a = i*1.3, rr = 2 + s*2; rect(p[0] + Math.round(Math.cos(a)*rr) - 1, p[1] - 8 - s*3 + Math.round(Math.sin(a)*rr*.8), 2, 2, shade(i % 3 ? '#3a8a4a' : '#5ab05a', k)); } };
  pot(33, UY + 4, 1); pot(37, UY + 5, 0); pot(29, UY + 4, 0);
  const m = WP(24, UY + 4, -SLAB); rect(m[0], m[1] - 18, 1, 18, PAL.ol); orect(m[0] - 3, m[1] - 25, 7, 7, shade('#7a8a9a', k), PAL.ol); rect(m[0] - 2, m[1] - 22, 5, 1, PAL.ol); px(m[0] + 2, m[1] - 24, '#e8b020');
}
const POLE = [46, -16], POLE_H = 200;
function utilityPole(P, k){                             // เสาไฟฟ้า + หม้อแปลง + สายระโยงเข้าตึก
  const b = WP(POLE[0], POLE[1], -SLAB), t = b[1] - POLE_H, c = shade('#a8a8b4', k);
  rect(b[0] - 2, t, 4, POLE_H, PAL.ol); rect(b[0] - 1, t, 2, POLE_H, c); rect(b[0] + 1, t, 1, POLE_H, shade('#7a7a8a', k));
  for (let y = b[1] - 14; y < b[1]; y += 4) rect(b[0] - 1, y, 3, 2, '#e8c020');                     // แถบเหลือง-ดำ
  for (let y = t + 30; y < b[1] - 30; y += 9) rect(b[0] + 2, y, 2, 1, PAL.ol);                       // หมุดปีน
  const arms = [[t + 6, 13], [t + 16, 10]];
  for (const [y, w] of arms){ seg([b[0] - w, y + Math.round(w/2)], [b[0] + w, y - Math.round(w/2)], PAL.ol); for (const d of [-w, -w/2, w/2, w]) px(b[0] + d, y - Math.round(d/2) - 1, '#f6f8fc'); }
  const tr = t + 34; orect(b[0] + 2, tr, 8, 13, shade('#8a8a9a', k), PAL.ol); rect(b[0] + 3, tr + 1, 2, 11, shade('#b8b8c8', k)); ellipse(b[0] + 6, tr, 4, 1, shade('#6a6a7a', k));
  const sag = (x0, y0, x1, y1, s, col) => { let pv = null; for (let i = 0; i <= 40; i++){ const u = i/40, x = x0 + (x1 - x0)*u, y = y0 + (y1 - y0)*u + 4*s*u*(1 - u); if (pv) line(pv[0], pv[1], x, y, col); pv = [x, y]; } };
  const wc = shade('#2a2a36', k), bx = WP(37.5, -6, 2*FH - 80), cb = WP(37, -6, FH + 52);
  sag(b[0] - 13, t + 12, bx[0], bx[1], 6, wc); sag(b[0] - 7, t + 9, cb[0], cb[1] - 8, 8, wc); sag(b[0] - 10, t + 21, cb[0] + 1, cb[1] - 4, 10, wc); sag(b[0] + 6, tr + 6, cb[0] + 2, cb[1], 12, wc);
  sag(b[0] + 13, t, W + 2, t - 22, 9, wc); sag(b[0] + 10, t + 11, W + 2, t - 8, 10, wc); sag(b[0] + 6, t + 3, W + 2, t + 14, 7, wc);
  sag(b[0] - 13, t + 12, 404, t - 40, 6, wc);                                                       // สายพาดผ่านหลังมุมตึก
}
function exteriorFront(P, phase){
  const k = EXT_DIM[phase], lit = phase !== 'morning';
  vine(P, k); awning(P, k, lit); hangSign(P, k, lit); shopFront(P, k); utilityPole(P, k);
}
function streetBG(P, phase){                            // ของถนนที่นิ่ง (อยู่ใน cache front)
  const k = EXT_DIM[phase];
  // ทางม้าลาย (ขวางถนน y 94-124) ที่ x -16..-6
  for (let y = 94; y < 125; y += 4) wqZ(-SLAB + .01, -16, -6, y, y + 2, shade('#e8e8ec', Math.max(.6, k)));
  // ป้ายรถเมล์ + ม้านั่ง + ป้ายวงกลม
  { const gl = '#9fd8ec', a = ctx.globalAlpha;
    ctx.globalAlpha = .35; wqY(84, -54, -40, -SLAB, 26, gl); ctx.globalAlpha = a;
    seg(WP(-54, 84, 26), WP(-40, 84, 26), PAL.ol);
    for (const x of [-54, -40]){ const p = WP(x, 84, -SLAB), q = WP(x, 84, 28); rect(p[0], q[1], 1, p[1] - q[1], PAL.ol); }
    wbox(-52, 85, -SLAB + 7, 10, 2.5, 2, shade('#b5703c', k), shade('#8a4b2a', k), shade('#6e3b22', k), PAL.ol);
    wbox(-55, 83, 26, 16, 7, 2, shade('#d8dce4', k), shade('#a8acb8', k), shade('#8a8e9a', k), PAL.ol);
    const s = WP(-37, 90.5, -SLAB); rect(s[0], s[1] - 34, 1, 34, PAL.ol); ellipse(s[0], s[1] - 37, 4, 4, PAL.ol); ellipse(s[0], s[1] - 37, 3, 3, '#d8202a'); ellipse(s[0], s[1] - 37, 2, 2, '#f6f8fc'); px(s[0], s[1] - 37, '#2a64c8');
    orect(s[0] - 3, s[1] - 26, 6, 9, '#f6f8fc', PAL.ol); for (let i = 0; i < 3; i++) rect(s[0] - 2, s[1] - 24 + i*2, 4, 1, '#8a8a9a'); }
  // ตู้ไปรษณีย์แดง (ทรงกระบอก)
  { const p = WP(-30, 89, -SLAB); rect(p[0] - 4, p[1] - 15, 9, 15, PAL.ol); rect(p[0] - 3, p[1] - 14, 7, 14, '#d8202a'); rect(p[0] + 2, p[1] - 14, 2, 14, '#a8181e');
    ellipse(p[0], p[1] - 15, 4, 2, PAL.ol); ellipse(p[0], p[1] - 15, 3, 1, '#e84a4a'); rect(p[0] - 2, p[1] - 11, 5, 1, PAL.ol); rect(p[0] - 1, p[1] - 7, 3, 2, '#f6f8fc'); }
  // ตู้กดน้ำ 4 ตู้ + ถังขยะรีไซเคิล (cache · object คลิกได้อยู่ใน addStreetLife)
  { const lit = phase !== 'morning';
    for (const v of VM_ROW){ if (lit) emit(() => { const a = ctx.globalAlpha; ctx.globalAlpha = .12; wqZ(-SLAB, 47, 54, v.y, v.y + 6, '#eaf6ff'); ctx.globalAlpha = a; }); vendingMachine(v, lit); }
    wbox(43, -21.5, -SLAB, 3, 3, 10, '#eef0f2', '#c8ccd4', '#dde0e6', PAL.ol); const q = WP(46, -20, -SLAB + 7); rect(q[0] - 1, q[1], 2, 2, PAL.ol); }
  // กรวยจราจร
  for (const [x, y] of [[86, 27], [89, 24], [50, 31]]){ const p = WP(x, y, -SLAB); rect(p[0] - 3, p[1] - 1, 7, 2, PAL.ol); fillPoly([[p[0] - 3, p[1] - 1], [p[0], p[1] - 11], [p[0] + 1, p[1] - 11], [p[0] + 4, p[1] - 1]], '#f07a2a'); rect(p[0] - 1, p[1] - 7, 3, 2, '#f6f8fc'); }
  // ต้นบ๊วย (ume) ดอกชมพู — กลีบร่วงวาดในชั้นลม
  { const p = WP(UME[0], UME[1], -SLAB), tc = shade('#4a3226', k);
    rect(p[0], p[1] - 22, 2, 22, tc); line(p[0], p[1] - 14, p[0] - 7, p[1] - 24, tc); line(p[0] + 1, p[1] - 18, p[0] + 9, p[1] - 28, tc); line(p[0], p[1] - 22, p[0] - 2, p[1] - 32, tc);
    const r = rng(2601), pk = ['#f6b8cc', '#ffd8e4', '#e88aa8', '#ffffff'].map(c => shade(c, Math.max(.65, k)));
    line(p[0] - 7, p[1] - 24, p[0] - 13, p[1] - 27, tc); line(p[0] + 9, p[1] - 28, p[0] + 15, p[1] - 30, tc); line(p[0] - 2, p[1] - 32, p[0] + 3, p[1] - 38, tc);
    const blobs = [[-9,-28,8],[0,-33,9],[10,-30,8],[-3,-25,7],[6,-24,6],[15,-27,5],[-14,-26,5]];
    for (const [bx, by, br] of blobs) for (let i = 0; i < br*7; i++){ const a = r()*6.28, rr = Math.sqrt(r())*br; const x = p[0] + bx + Math.round(Math.cos(a)*rr), y = p[1] + by + Math.round(Math.sin(a)*rr*.75); px(x, y, pk[(r()*4)|0]); if (r() < .25) px(x + 1, y, pk[2]); }
    if (P.fSnow) for (let i = 0; i < 8; i++) px(p[0] - 8 + i*2, p[1] - 38 + (i % 3), P.fSnow); }
}
const UME = [-68, 86];
/* ---------- ตู้กดน้ำ 4 ตู้เรียงกัน (คลิกได้) ---------- */
const VM_ROW = [
  { y:-46, body:'#2a4aa0', acc:'#e8eef8', label:'ASAHI', say:['ガコン! 三ツ矢','あったか〜い','¥130'] },
  { y:-40, body:'#eef0f2', acc:'#d8202a', label:'KIRIN', say:['ガコン! 午後の紅茶','¥150','つめた〜い'] },
  { y:-34, body:'#f4b0c8', acc:'#ffffff', label:'MILK',  say:['いちごミルク ¥120','ガコン!','あまい〜'] },
  { y:-28, body:'#f0d020', acc:'#2a8a4a', label:'LEMON', say:['レモンティー ¥140','ガコン!','すっぱ!'] } ];
function vendingMachine(v, lit){
  const x = 42, y0 = v.y, y1 = v.y + 6, z0 = -SLAB, h = 31, b = v.body;
  wbox(x, y0, z0, 5, 6, h, shade(b, 1.1), shade(b, .78), b, PAL.ol);
  const F = 47.03;
  wqX(F, y0 + .4, y1 - .4, z0 + h - 6, z0 + h - 1, v.acc);
  const tp = WP(F, y1 - .8, z0 + h - 2.2); text(v.label, tp[0], tp[1], v.acc === '#ffffff' || v.acc === '#e8eef8' ? b : '#ffffff', {shear:-1});
  const win = lit ? '#fffbe8' : '#e8eef4';
  const run = () => {
    wqX(F, y0 + .6, y1 - .6, z0 + 12, z0 + h - 7, win, PAL.ol);
    const r = rng(Math.abs(v.y)*13), pr = ['#d8202a','#2a64c8','#f0a020','#3a9a5a','#8a4b2a','#f6f8fc','#e86aa8'];
    for (const zz of [z0 + h - 9, z0 + h - 12.5, z0 + 16]){ for (let yy = y0 + 1; yy < y1 - .8; yy += .9){ const p = WP(F, yy, zz); rect(p[0], p[1] - 1, 1, 2, pr[(r()*pr.length)|0]); } const s0 = WP(F, y0 + .6, zz - 1), s1 = WP(F, y1 - .6, zz - 1); seg(s0, s1, '#9aa0b0'); }
    for (let yy = y0 + 1; yy < y1 - .8; yy += .9){ const p = WP(F, yy, z0 + 13.5); px(p[0], p[1], r() < .5 ? '#ff4a3a' : '#4aff8a'); }
  };
  lit ? emit(run) : run();
  wqX(F, y0 + .6, y0 + 2, z0 + 6, z0 + 11, shade(b, .6)); { const c = WP(F, y0 + 1.3, z0 + 9); px(c[0], c[1], '#e8c020'); }
  wqX(F, y0 + 2.4, y1 - .6, z0 + 2, z0 + 5, '#1c1c24');
}
function addStreetLife(){
  VM_ROW.forEach((v, i) => addObject({ id:'street_vend'+i, floor:0, kind:'item', label:'ตู้กดน้ำ '+v.label+' (自販機)', hint:'คลิก: กดน้ำ', x:0, y:0, w:0, h:0,
    draw(ctx, t, st){                                                          // ตัวตู้อยู่ใน cache ฉากหน้า — ที่นี่แค่ hit box + ไฟกะพริบตอนกด
      const b = wbbox(42, v.y, -SLAB, 5, 6, 31); Object.assign(this, b, {ax: b.x + b.w/2, ay: b.y});
      if (st.until && S.t < st.until) emit(() => { const a = ctx.globalAlpha; ctx.globalAlpha = .35; wqX(47.05, v.y + .6, v.y + 5.4, -SLAB + 12, -SLAB + 24, '#ffffff'); ctx.globalAlpha = a; });
    },
    onClick(){ this.state.n = (this.state.n || 0) + 1; this.state.until = S.t + .25; bubble(this.id, v.say[this.state.n % v.say.length], 1300); log('กดน้ำ '+v.label); } }));
  // สัญญาณไฟจราจร (หัวมุมทางม้าลาย) — เขียว 8 วิ · เหลือง 2 วิ · แดง 8 วิ
  addObject({ id:'street_signal', floor:0, kind:'decor', label:'สัญญาณไฟจราจร', hint:'คลิก: ดูไฟ', x:0, y:0, w:0, h:0,
    draw(){
      const p = WP(-21, 91, -SLAB), t = S.t % 18, st = t < 8 ? 0 : t < 10 ? 1 : 2, top = p[1] - 60;
      rect(p[0] - 1, top, 3, 60, PAL.ol); rect(p[0], top, 1, 59, PAL.metal);
      rect(p[0], top + 2, 14, 2, PAL.ol);
      orect(p[0] + 6, top - 2, 17, 7, '#3a3a4a', PAL.ol);
      const cols = ['#3aff8a', '#ffd020', '#ff3a2a'], dk = ['#1a4a2a', '#4a4020', '#4a1a1a'];
      for (let i = 0; i < 3; i++){ const cx = p[0] + 9 + i*5, on = i === st; on ? emit(() => { const a = ctx.globalAlpha; ctx.globalAlpha = .3; rect(cx - 2, top - 1, 5, 5, cols[i]); ctx.globalAlpha = a; rect(cx - 1, top, 3, 3, cols[i]); }) : rect(cx - 1, top, 3, 3, dk[i]); }
      orect(p[0] - 5, top + 20, 6, 12, '#3a3a4a', PAL.ol);                                       // ไฟคนข้าม
      const pg = st === 2; emit(() => { rect(p[0] - 4, top + 21, 4, 4, pg ? '#3aff8a' : '#2a3a2a'); rect(p[0] - 4, top + 26, 4, 4, pg ? '#3a1a1a' : '#ff3a2a'); });
      Object.assign(this, {x:p[0] - 6, y:top - 3, w:30, h:64, ax:p[0] + 10, ay:top - 3});
    },
    onClick(){ bubble('street_signal', ['とまれ','すすめ','ちゅうい'][Math.floor(S.t % 18 < 8 ? 1 : S.t % 18 < 10 ? 2 : 0)], 1000); } });
}
/* ---------- คนเดินผ่าน + กลีบบ๊วยร่วง (ทุกเฟรม) ---------- */
const PED = { list:[], next:3 }, PETALS = [];
function updateStreetLife(dt){
  PED.next -= dt;
  if (PED.next <= 0 && PED.list.length < 2){
    PED.next = 6 + Math.random()*8;
    const dir = Math.random() < .5 ? 1 : -1;
    PED.list.push({ x: dir > 0 ? -80 : 56, y: 90 + Math.random()*1.5, dir, v: 5 + Math.random()*2.5, ph: Math.random()*3 });
  }
  for (let i = PED.list.length - 1; i >= 0; i--){ const p = PED.list[i]; p.x += p.dir*p.v*dt; if (p.x > 60 || p.x < -84) PED.list.splice(i, 1); }
  const gust = Core.wind ? windEnv() : 0;
  if (PETALS.length < 14 && Math.random() < dt*3){ const b = WP(UME[0], UME[1], -SLAB); PETALS.push({ x: b[0] + (Math.random() - .5)*30, y: b[1] - 30 + (Math.random() - .5)*14, vy: 6 + Math.random()*6, ph: Math.random()*6 }); }
  for (let i = PETALS.length - 1; i >= 0; i--){ const q = PETALS[i]; q.y += q.vy*dt; q.x += (Math.sin(S.t*2 + q.ph)*6 + (Core.wind ? 6 + 18*gust : 0))*dt; if (q.y > WP(UME[0], UME[1], -SLAB)[1] + 26 || q.x > W) PETALS.splice(i, 1); }
}
function drawStreetLife(){
  const spr = window.SPR_PEOPLE && SPR_PEOPLE.customer_walk, n = (sprFrames(spr) || [0]).length;
  PED.list.sort((a, b) => a.y - b.y);
  for (const p of PED.list){ const q = WP(p.x, p.y, -SLAB); drawSpritePx(ctx, spr, q[0], q[1], Math.floor(S.t*6 + p.ph) % n, p.dir < 0); }
  ctx.fillStyle = time.phase === 'night' ? '#c8a0b8' : '#f6b8cc';
  for (const q of PETALS) ctx.fillRect(Math.round(q.x), Math.round(q.y), (Math.floor(S.t*4 + q.ph) % 2) + 1, 1);
}

/* ============================== STREET (floor 0) รอบ 4: ลานจอดรถ Porsche 911 + ตู้กดน้ำ + จักรยาน + รถวิ่งผ่าน ==============================
   หน่วยโลก (x = แกน fx*UX, y = แกน fy*UY, ตึก = x 0..40 · y 0..80)
   - ลานจอด  x 54-86 · y -19..23 (ขวา-ล่างของตึก) ช่องจอด 3 ช่อง กว้าง 14 · ป้าย P · เสาไฟ (ติดเย็น/คืน)
   - ถนน     y 92..126 (หน้าตึกฝั่งซ้าย-ล่าง) รถวิ่งตามแกน x ทีละคัน ทุก 12-25 วิ · อยู่หน้าตึกเสมอ → วาดหลังปล่องลิฟต์
   - รถทุกคัน = heightfield iso (คอลัมน์ 1x1 หน่วย) วาดครั้งเดียวลง sprite cache ต่อ (ชนิด, สี, ทิศ, เฟรมเวลา, เฟรมล้อ) + ขอบดำ 1 px   */
const pl = (pts, u) => { if (u <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]){ const [a, b] = [pts[i-1], pts[i]]; return a[1] + (b[1] - a[1])*(u - a[0])/((b[0] - a[0]) || 1); } return pts[pts.length-1][1]; };
const CAR_T = {
  p911:  { L:20, Wd:9, m:1.6, clr:2, wheels:[3.5, 16.5], prof:[[0,5.5],[1.2,7.2],[3,9],[6.8,13.4],[9.8,13.6],[11.4,13],[13,8],[18.6,7.2],[20,5.2]],
           belt:u => (u > 1.2 && u < 6.6) ? 9 : (u > 14.5 && u < 19.4) ? 8 : 7.6, hood:13, hoodZ:7,
           glassTop:(u,v,W) => (u > 11.4 && u < 13.1) || (u > 3.4 && u < 6.4), sideWin:u => u > 6 && u < 11.8 },
  taxi:  { L:19, Wd:8, m:1, clr:2, wheels:[3.5, 15.5], prof:[[0,6.5],[3,7.6],[4.6,12],[12.4,12],[14,8],[19,6.6]], belt:() => 8,
           glassTop:u => (u > 12.4 && u < 14) || (u > 3 && u < 4.8), sideWin:u => u > 5 && u < 12.2, andon:true },
  kei:   { L:14, Wd:7, m:1, clr:2, wheels:[2.5, 11.5], prof:[[0,7.5],[9.9,7.5],[10,13],[13.2,13],[14,10]], belt:u => u < 10 ? 7.5 : 9,
           bed:true, glassTop:u => u > 13.1, sideWin:u => u > 10.6 && u < 13 },
  hatch: { L:15, Wd:8, m:1, clr:2, wheels:[2.8, 12], prof:[[0,7.5],[0.6,11.6],[9,12],[11,8],[15,6.6]], belt:() => 8,
           glassTop:u => u > 9 && u < 11, sideWin:u => u > 1.4 && u < 9 },
  bus:   { L:34, Wd:10, m:0, clr:3, wheels:[5, 28], prof:[[0,20],[0.8,22],[33.2,22],[34,20]], belt:() => 11,
           glassTop:() => false, sideWin:u => u > 1.5 && u < 32.5 && (Math.floor(u) % 4) !== 0, frontWin:true },
  /* รอบ 5 "รถเท่ ๆ": ตัวเตี้ย (clr ต่ำ) ล้อใหญ่ (wr) ปีกหลัง (wing) ลายคาดกลาง (stripe) ช่องดักลมข้าง (sideDark) หลังคาคาร์บอน (roofDark) ท่อคู่ (exhaust) */
  gt3rs: { L:22, Wd:10, m:1.6, clr:1.4, wr:3.5, wheels:[4, 18], prof:[[0,6],[1,8.2],[4,9.6],[7,13.4],[9.5,14],[12,13.6],[14.5,8.6],[21,7.6],[22,5.4]],
           belt:u => (u > 1 && u < 7.4) ? 9.8 : (u > 14.8 && u < 21.2) ? 9.2 : 8, hood:14.6, hoodZ:7.2,
           glassTop:u => (u > 12 && u < 14.6) || (u > 7 && u < 9.4), sideWin:u => u > 9.4 && u < 12.3,
           wing:{u0:.6, u1:3.2, z:15.5, ins:1.2, c:'body'}, stripe:'#1a1a22', sideDark:u => u > 5.4 && u < 7.2, exhaust:true },
  wedge: { L:24, Wd:10, m:1.4, clr:1.2, wr:3.5, wheels:[4, 19.5], prof:[[0,7],[2,8.2],[5,8.6],[8,12.4],[10,13],[12.5,12.8],[17,7.2],[23,5],[24,4]],
           belt:u => u < 8.6 ? 8.6 : 8,
           glassTop:u => (u > 12.5 && u < 17), sideWin:u => u > 9 && u < 12.5,
           wing:{u0:.4, u1:2.6, z:13.2, ins:1, c:'#23232b'}, roofDark:u => u > 8 && u < 12.5, sideDark:u => u > 4.6 && u < 8.2, exhaust:true, slimLight:true },
  jdm:   { L:21, Wd:10, m:1.5, clr:1.6, wr:3.5, wheels:[3.8, 17.2], prof:[[0,6.5],[1,10],[6,10.6],[8,14],[10,14.5],[13,14],[16,9.6],[20,9],[21,6.5]],
           belt:u => (u > 14.5 && u < 20.5) ? 9.6 : 9.4,
           glassTop:u => (u > 13 && u < 16.3) || (u > 6 && u < 8.2), sideWin:u => u > 8.2 && u < 13,
           wing:{u0:.5, u1:2.7, z:15.6, ins:1.3, c:'#23232b'}, stripe:'#f6f8fc', roofDark:u => u > 8.2 && u < 13, sideDark:u => u > 4 && u < 5.6, exhaust:true }
};
const GLASS = { morning:['#3e5e80','#cfe8f8'], evening:['#4a3048','#ffc89a'], night:['#121834','#4a5890'] };   // กระจกเข้ม + เส้นสะท้อนสีฟ้าตามเวลา
const carCache = new Map();
function carSprite(type, color, dir, phase, fr){
  const k = type + color + dir + phase + fr; let c = carCache.get(k); if (c) return c;
  const T = CAR_T[type], {L, Wd} = T, maxH = 24, ox = 2*Wd + 3, oy = maxH + 3;
  const [gl, gh] = GLASS[phase], body = color, top = shade(body, 1.12), side = shade(body, .8), end = shade(body, .62);
  c = paintCanvas(2*(L + Wd) + 6, L + Wd + maxH + 6, g => {
    g.setTransform(1, 0, 0, 1, ox - OX, oy - OY);
    const cells = [];
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) cells.push([i, j]);
    cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    for (const [i, j] of cells){
      const x = i, u = dir > 0 ? i + .5 : L - i - .5, v = j + .5;           // u = ตามตัวรถ (0 = ท้าย, L = หัว)
      const edge = v < T.m || v > Wd - T.m;
      let h = pl(T.prof, u), belt = T.belt(u);
      if (T.hood && u > T.hood && !edge) h = Math.min(h, T.hoodZ);           // 911: ฝากระโปรงต่ำกว่าบังโคลน → ไฟหน้ากลมโผล่
      if (edge) h = Math.min(h, belt);
      if (T.bed && u < 10 && !edge && u > 1) h = 4.5;                         // กระบะ
      if (T.andon && u > 8 && u < 10 && v > 3 && v < 5) h = 14;              // ไฟหลังคาแท็กซี่
      const z0 = T.clr, zb = Math.min(h, belt);
      const lastX = i === L - 1, frontEnd = lastX && dir > 0, rearEnd = lastX && dir < 0;
      let cR = end, cL = side;
      const stripeC = T.stripe && Math.abs(v - Wd/2) < 1.05 ? T.stripe : null;    // ลายคาดกลางตัวรถ
      const intake = T.sideDark && T.sideDark(u) && !edge && j === Wd - 1;      // ช่องดักลมข้างลำตัว (ฝั่งที่มองเห็น) = ช่องบาง 3 px ช่วงบนของสีข้าง
      if (frontEnd && edge && zb > 4) cR = '#fff6d8';                         // ไฟหน้า
      if (frontEnd && T.slimLight && !edge && zb > 3.5) cR = (j % 3 === 1) ? '#fff6d8' : shade(end, 1.2);   // ไฟหน้าเส้นบาง (รถทรงลิ่ม)
      if (rearEnd && zb > 4) cR = (j % 2) ? '#ff4a3a' : '#c8202a';           // ไฟท้ายเต็มแถบ
      if (rearEnd && T.exhaust && (j === 2 || j === Wd - 3)) cR = '#c8c8d0';  // ท่อไอเสียคู่
      if (intake && zb - z0 > 4){ wbox(x, j, z0, 1, 1, zb - 3 - z0, top, cL, cR, null); wbox(x, j, zb - 3, 1, 1, 3, stripeC || top, '#15151c', cR, null); }
      else wbox(x, j, z0, 1, 1, zb - z0, stripeC || top, cL, cR, null);
      if (h > belt + .2){
        const glassT = T.glassTop(u, v, Wd), sideW = T.sideWin(u) && (v + 1 > Wd - T.m || j === Wd - 1), andonC = T.andon && h >= 14;
        const roofD = T.roofDark && T.roofDark(u) && !glassT;
        const cT = andonC ? '#f0c020' : glassT ? ((i + j) % 5 === 0 ? gh : gl) : roofD ? ((i + j) % 2 ? '#262630' : '#1c1c24') : (stripeC || top);
        wbox(x, j, belt, 1, 1, h - belt, cT, sideW ? ((i % 3) === 0 ? gh : gl) : (roofD ? '#1c1c24' : side), (T.frontWin && lastX) || (glassT && lastX) ? gl : (T.glassTop(u, v, Wd) ? gl : end), null);
      }
    }
    if (type === 'bus'){ wqY(Wd + .01, 0, L, 9, 10.5, '#3a9a5a'); wqY(Wd + .01, 0, L, 3, 4, '#3a9a5a'); }
    if (type === 'taxi') wqY(Wd + .01, 2, L - 2, 6, 6.8, '#e8b020');
    if (T.wing){                                                              // ปีกหลัง: เสาค้ำ 2 ต้น + แผ่นปีกกว้างเกือบเต็มตัวรถ
      const w = T.wing, um = (w.u0 + w.u1)/2, x0 = dir > 0 ? w.u0 : L - w.u1, xs = dir > 0 ? um - .4 : L - um - .4, zb = pl(T.prof, um);
      const wc = w.c === 'body' ? body : w.c, wTop = shade(wc, 1.1), wSide = shade(wc, .75), wEnd = shade(wc, .6);
      for (const vv of [w.ins + .6, Wd - w.ins - 1.6]) wbox(xs, vv, zb, .8, 1, w.z - zb, '#2a2a34', '#1c1c24', '#1c1c24', null);
      wbox(x0, w.ins, w.z, w.u1 - w.u0, Wd - 2*w.ins, 1.3, wTop, wSide, wEnd, null);
      wbox(x0, w.ins, w.z + 1.3, .6, Wd - 2*w.ins, .7, wEnd, wEnd, wEnd, null);  // ขอบปีกยกขึ้น (gurney flap)
    }
    // ล้อ (ฝั่งที่มองเห็น y = Wd) + ล้อแม็กซี่ + ดุมล้อสลับเฟรม
    for (const wu of T.wheels){
      const wx = dir > 0 ? wu : L - wu, p = WP(wx, Wd, 2), r = T.wr || 3;
      ellipse(p[0], p[1], r, r, '#141418');
      if (r >= 3.5){ ellipse(p[0], p[1], 2, 2, '#b8b8c4'); px(p[0] + (fr ? 1 : -1), p[1] + (fr ? 1 : -1), '#141418'); px(p[0] - (fr ? 1 : -1), p[1] - (fr ? 1 : -1), '#141418'); px(p[0], p[1], '#5a5a66'); }
      else { px(p[0] + (fr ? 1 : -1), p[1] - (fr ? 1 : 0), '#9a9aa8'); px(p[0], p[1], '#5a5a66'); }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  });
  outlineCanvas(c, PAL.ol);
  c.ox = ox; c.oy = oy; carCache.set(k, c); return c;
}
function drawCar(type, color, dir, x, y, fr, lights, flash, glow){
  const c = carSprite(type, color, dir, time.phase, fr), T = CAR_T[type], p = WP(x, y, -SLAB);
  if (glow && time.phase !== 'morning') emit(() => {                          // ไฟนีออนใต้ท้องรถ (เย็น/คืน) กะพริบช้า ๆ ไม่ blur
    const a = ctx.globalAlpha, k = time.phase === 'night' ? 1 : .55;
    ctx.globalAlpha = (.16 + .06*Math.sin(S.t*2.5))*k; wqZ(-SLAB, x - 4.5, x + T.L + 4.5, y - 3.5, y + T.Wd + 3.5, glow);
    ctx.globalAlpha = (.34 + .08*Math.sin(S.t*2.5))*k; wqZ(-SLAB, x - 2.5, x + T.L + 2.5, y - 2, y + T.Wd + 2, glow); ctx.globalAlpha = a;
  });
  if (lights || flash){                                                      // แสงไฟหน้าบนพื้น (ไม่ blur: พื้นผิว 2 ชั้น)
    const ax = dir > 0 ? x + T.L : x - 16, bx = dir > 0 ? x + T.L + 16 : x, a = ctx.globalAlpha;
    emit(() => { ctx.globalAlpha = flash ? .32 : .13; wqZ(-SLAB, ax, bx, y + 1, y + T.Wd - 1, '#fff2c8'); ctx.globalAlpha = a; });
  }
  { const a = ctx.globalAlpha; ctx.globalAlpha = .3; wqZ(-SLAB, x - .5, x + T.L + .5, y + .5, y + T.Wd + .5, PAL.ol); ctx.globalAlpha = a; }   // เงาใต้รถ
  ctx.drawImage(c, Math.round(p[0] - c.ox), Math.round(p[1] - c.oy));
  if (lights || flash) emit(() => {                                            // จุดไฟหน้า/ท้ายเรือง
    const hx = dir > 0 ? x + T.L : x, tx = dir > 0 ? x : x + T.L, a = ctx.globalAlpha;
    for (const vy of [y + 1.2, y + T.Wd - 1.2]){ const h = WP(hx, vy, -SLAB + T.clr + 4), t = WP(tx, vy, -SLAB + T.clr + 4);
      ctx.globalAlpha = .35; rect(h[0] - 2, h[1] - 2, 5, 4, '#fff6d8'); rect(t[0] - 1, t[1] - 1, 3, 3, '#ff3a2a'); ctx.globalAlpha = a; px(h[0], h[1], '#ffffff'); px(t[0], t[1], '#ff5a4a'); }
  });
}
const LOT = { cars:[ {id:'street_911a', bay:-17, dir:1,  type:'gt3rs', color:'#f2c21a', glow:'#ff50c0', name:'911 GT3 RS · Racing Yellow', say:['GT3 RS 🏁','ブォン! ブォォン!','フラット6 ♪']},
                     {id:'street_911b', bay:-3,  dir:-1, type:'wedge', color:'#52cc3a', glow:'#b0ff40', name:'V10 Super Wedge · Verde',   say:['V10 🔥','ヴォーン!!','ドアが上に開く ↑']},
                     {id:'street_911c', bay:11,  dir:1,  type:'jdm',   color:'#2f68d8', glow:'#40e8ff', name:'GT-R Nismo · Bayside Blue', say:['GT-R 🇯🇵','ゴジラ!','VR38 ターボ ♪']} ], x0:60 };
function drawLot(P){                                                            // พื้นลานจอด (อยู่ใน cache ฉากหลัง)
  const asph = mix('#3a3a46', P.ground, .3), line = P.lanLit ? '#b8b8c4' : '#eeeef2';
  wqZ(-SLAB, 52, 88, -21, 25, asph);
  { const r = rng(5150); for (let i = 0; i < 160; i++){ const p = WP(52 + r()*36, -21 + r()*46, -SLAB); px(p[0], p[1], shade(asph, r() < .5 ? .85 : 1.15)); } }
  for (const y of [-19, -5, 9, 23]) seg(WP(56, y, -SLAB), WP(86, y, -SLAB), line);
  seg(WP(56, -19, -SLAB), WP(56, 23, -SLAB), line);
  for (let y = -17; y < 22; y += 3){ const a = WP(86, y, -SLAB), b = WP(86, y + 1.5, -SLAB); seg(a, b, '#e8c040'); }   // เส้นเหลืองประขอบลาน
}
function addStreet(){
  const BK = [44, 34], LAMP = [52, -26], PS = [52, 27];
  addObject({ id:'street_lamp', floor:0, kind:'decor', label:'เสาไฟลานจอด', x:0, y:0, w:0, h:0,
    draw(){
      const p = WP(LAMP[0], LAMP[1], -SLAB), on = time.phase !== 'morning';
      if (on) emit(() => { const a = ctx.globalAlpha; ctx.globalAlpha = .12; wqZ(-SLAB, 54, 80, -22, 6, '#ffe6a8'); ctx.globalAlpha = .08; wqZ(-SLAB, 60, 74, -18, -2, '#fff2c8'); ctx.globalAlpha = a; });
      rect(p[0] - 1, p[1] - 56, 3, 56, PAL.ol); rect(p[0], p[1] - 56, 1, 55, PAL.metal);
      rect(p[0], p[1] - 57, 9, 2, PAL.ol); orect(p[0] + 6, p[1] - 56, 6, 3, PAL.metalD);
      if (on) emit(() => { rect(p[0] + 7, p[1] - 53, 4, 1, '#fff6d8'); const a = ctx.globalAlpha; ctx.globalAlpha = .25; rect(p[0] + 4, p[1] - 54, 10, 5, '#ffe6a8'); ctx.globalAlpha = a; });
    } });
  for (const car of LOT.cars){                                                  // วาดหลัง→หน้า (y น้อย→มาก)
    const T = CAR_T[car.type];
    addObject({ id:car.id, floor:0, kind:'item', label:car.name, hint:'คลิก: สตาร์ทเครื่อง', x:0, y:0, w:0, h:0,
      draw(ctx, t, st){
        const flash = st.until && S.t < st.until && Math.floor(S.t*8) % 2 === 0;
        drawCar(car.type, car.color, car.dir, LOT.x0, car.bay, 0, false, flash, car.glow);
        const b = wbbox(LOT.x0, car.bay, -SLAB, T.L, T.Wd, 17); Object.assign(this, b, {ax: b.x + b.w/2, ay: b.y});
      },
      onClick(){ this.state.until = S.t + 1.2; const s = car.say[(this.state.n = (this.state.n || 0) + 1) % 3]; bubble(this.id, s, 1400); log(car.name+' · '+s); }
    });
  }
  addObject({ id:'street_psign', floor:0, kind:'sign', label:'ป้ายที่จอดรถ P', hint:'คลิก: ดูป้าย', x:0, y:0, w:0, h:0,
    draw(){
      const p = WP(PS[0], PS[1], -SLAB);
      rect(p[0] - 1, p[1] - 30, 3, 30, PAL.ol); rect(p[0], p[1] - 30, 1, 29, PAL.metal);
      orect(p[0] - 6, p[1] - 42, 13, 13, '#2a64c8', PAL.ol); rect(p[0] - 5, p[1] - 41, 11, 1, '#5aa0ff');
      const run = () => text('P', p[0] - 2, p[1] - 39, PAL.white, {scale:2});
      time.phase !== 'morning' ? emit(run) : run();
      Object.assign(this, {x:p[0] - 7, y:p[1] - 43, w:15, h:44, ax:p[0], ay:p[1] - 43});
    },
    onClick(){ bubble('street_psign', 'P · 3台 · 1h ¥300', 1300); } });
  addObject({ id:'street_bike', floor:0, kind:'decor', label:'จักรยาน', x:0, y:0, w:0, h:0,
    draw(){
      const spr = window.SPR_ITEMS && SPR_ITEMS.bicycle, p = WP(BK[0], BK[1], -SLAB);
      drawSpritePx(ctx, spr, p[0], p[1], 0, false);
      if (Core.snow && time.phase === 'night'){ const {w,h} = sprSize(spr); rect(p[0]-Math.floor(w/2)+6, p[1]-h+5, 6, 1, PAL.snow); }
    }
  });
  addStreetLife();                               // ตู้กดน้ำ 4 ตู้ + สัญญาณไฟ
}
/* ---------- รถวิ่งผ่าน (ทีละคัน ทุก 12-25 วิ) ---------- */
const TRAF = { car:null, next:5 };
const TRAF_TYPES = [['taxi', '#20242c', .30], ['kei', '#eef0f2', .26], ['hatch', '#4a8ad8', .12], ['hatch', '#7ad0b0', .12], ['bus', '#eaeef0', .08], ['wedge', '#ff6a1a', .06], ['gt3rs', '#f6f8fc', .06]];   // รอบ 5: ซูเปอร์คาร์วิ่งผ่านบ้างนาน ๆ ที
function updateTraffic(dt){
  const c = TRAF.car;
  if (!c){
    TRAF.next -= dt;
    if (TRAF.next <= 0){
      let r = Math.random(), t = TRAF_TYPES[0]; for (const q of TRAF_TYPES){ if (r < q[2]){ t = q; break; } r -= q[2]; }
      const dir = Math.random() < .5 ? 1 : -1, L = CAR_T[t[0]].L;
      TRAF.car = { type:t[0], color:t[1], dir, y: dir > 0 ? 110 : 96, x: dir > 0 ? -110 - L : 110, v: (t[0] === 'bus' ? 18 : 24) + Math.random()*8 };
    }
    return;
  }
  c.x += c.dir*c.v*dt;
  if ((c.dir > 0 && c.x > 110) || (c.dir < 0 && c.x < -110 - CAR_T[c.type].L)){ TRAF.car = null; TRAF.next = 12 + Math.random()*13; }
}
function drawTraffic(){
  const c = TRAF.car; if (!c) return;
  drawCar(c.type, c.color, c.dir, c.x, c.y, Math.floor(S.t*8) % 2, time.phase !== 'morning', false);
}

/* ============================== EXPORT ============================== */
const Core = window.Core = {
  // ค่าคงที่
  W, H, U, UX, UY, FH, SAFE, SLAB, GY, PAL, PHASES, PHASE_SEC,
  // วาด pixel
  px, rect, orect, line, fillPoly, polyOutline, ellipse, glowRect, glowPoly, emit, text, textJP, textWidth,
  shade, mix, rng,
  // iso พื้นห้อง
  iso, isoBox, boxBBox, quadX, quadY, quadZ, wallL, wallR, pool, visible, hiddenEdge, u, ux, uy,
  drawSprite, spriteBBox, anim,
  // สถานะ
  time, lights, snow:true, xray:true, grid:false, fireworks:true, wind:true, PEOPLE_SCALE:2, elevator,
  get ctx(){ return ctx; }, get cur(){ return CUR; }, get t(){ return S.t; },
  floors: [], isDark, lit, setPhase, pause,
  bubble, say: bubble, log, on, find, addObject, removeObject,
  floorInfo: n => floorInfo[n], floorObjects: n => floorObjs[n] || [], getLog: () => LOG.slice(),
  boot,
  stats: STATS,
  _internal: { FW, fwLaunch, PEOPLE, WIND, TRAF, carSprite, PED, WP, wbox, wqX, wqY, wqZ, S, BG, render: () => render(), step: dt => { S.t += dt; updateTime(dt); updateElevator(dt); updateSnow(dt); updateFireworks(dt); updateWind(dt); updateTraffic(dt); updateStreetLife(dt); render(); updateBubbles(); fire('frame', time); } }
};

window.SceneAPI = {
  floors: Core.floors,
  objects: ALL,
  highlight(id){ highlight(id); },
  onHover(cb){ on('hover', cb); },
  onClick(cb){ on('click', cb); },
  addObject(o){ return addObject(o); },
  say(id, text, ms){ bubble(id, text, ms); },
  state: S
};
})();
