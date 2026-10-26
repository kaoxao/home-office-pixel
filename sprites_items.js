/* ============================================================
   sprites_items.js  — SPR_ITEMS  (Sonnet-B, รอบ 2 เฟส 1)
   ของประกอบฉาก pixel-art iso 2:1 — มุมกล้องเดียวกับตึก
   (เห็น "หน้าซ้าย-ล่าง" + "หน้าขวา-ล่าง" + "ด้านบน", ขอบดำ 1 px)

   รูปแบบ: window.SPR_ITEMS = { name:{w,h,pal,frames:[[rows..]],anchor:'bottom-center'} }
   '.' = โปร่งใส · ทุกแถวยาว w ตัวอักษร · ทุกเฟรมสูง h แถว (ตรวจในโค้ด ถ้าผิดจะ throw)

   ทิศของ sprite (สำคัญสำหรับคนวางของ):
     - ค่าเริ่มต้น "ด้านหน้า/ด้านใช้งาน" ของของทุกชิ้น = หน้าขวา (หันไปทางขวา-ล่าง)
       → ใช้วางชิดผนังหลังซ้าย (ผนังที่วิ่งจากมุมซ้ายขึ้นไปมุมบน)
     - วางชิดผนังหลังขวา → ส่ง flip=true ให้ drawSprite (ด้านหน้าไปอยู่หน้าซ้าย)
     - anchor = กลางล่างของ sprite = มุมหน้าสุดของฐานของ (จุดล่างของ diamond)

   วิธีสร้าง: sprite ถูก "วาดด้วยโค้ด" ตอนโหลด (engine เล็ก ๆ ด้านล่าง: กล่อง iso,
   plane ติดผนัง, ellipse) แล้วแปลงเป็น rows ตัวอักษรตามสเปก — ผลลัพธ์เป็นข้อมูลล้วน
   window.SPR_ITEMS_QC = สรุปจำนวนสีเกิน/เฟรม สำหรับตรวจ
   ============================================================ */
(function () {
  'use strict';

  /* ---------- สี ---------- */
  var K = '#140b10';
  var BRIEF = ['#141428', '#22223a', '#e9c46a', '#4a1a2c', '#2b2238', '#b5703c', '#8a4b2a',
    '#140b10', '#ffd37a', '#4fc1c6', '#d8363a', '#eae0d0', '#4f9a5a', '#9db37a'];
  var WOOD = '#b5703c', WOODD = '#8a4b2a', WOODX = '#5e3019';
  var WARM = '#ffd37a', SCR = '#4fc1c6', RED = '#d8363a', CREAM = '#eae0d0', LEAF = '#4f9a5a', TAT = '#9db37a';
  var WALL = '#4a1a2c', WALL2 = '#2b2238', BLD = '#22223a', SKY = '#141428', WIN = '#e9c46a';
  var CR2 = '#c2b6a2', CR3 = '#968b7c';                 // เงาของ cream
  var M1 = '#aeb4c6', M2 = '#7f869c', M3 = '#575c74';   // โลหะ สว่าง/กลาง/เข้ม
  var LEAFD = '#2f6b3d', LEAFL = '#7ec27a';

  /* ---------- Grid + engine iso ---------- */
  var GW = 130, GH = 130, CX = 65, BY = 118;

  function Grid() {
    this.W = GW; this.H = GH; this.cx = CX; this.by = BY;
    this.m = new Array(GW * GH).fill(null);   // ชั้นหลัก (มีขอบดำ)
    this.f = new Array(GW * GH).fill(null);   // ชั้น fx (ควัน/ไอ/แสง — ไม่มีขอบ วางทับ)
    this.fx = false;
  }
  var G = Grid.prototype;
  G.set = function (x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    (this.fx ? this.f : this.m)[y * this.W + x] = c;
  };
  G.get = function (x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return null;
    return (this.fx ? this.f : this.m)[y * this.W + x];
  };
  G.clear = function (x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return;
    this.m[y * this.W + x] = null;
  };
  G.rect = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c);
  };
  // จุด (u,v,z) ของพิกัดฐาน → พิกัดจอ (ต่อเนื่อง). u = แกนไปซ้ายบน, v = แกนไปขวาบน, z = สูง
  G.P = function (u, v, z) { return [this.cx - 2 * u + 2 * v, this.by - u - v - z]; };
  G.line = function (x0, y0, x1, y1, c) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.floor(x1); y1 = Math.floor(y1);
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  };
  // plane ติดผนัง: 'R' = ระนาบ u=k (หน้าขวา) ช่วง v∈[a0,a1) ; 'L' = ระนาบ v=k (หน้าซ้าย) ช่วง u∈[a0,a1)
  G.quad = function (pl, k, a0, a1, z0, z1, c) {
    var cs = pl === 'R' ? [this.P(k, a0, z0), this.P(k, a1, z0), this.P(k, a0, z1), this.P(k, a1, z1)]
      : [this.P(a0, k, z0), this.P(a1, k, z0), this.P(a0, k, z1), this.P(a1, k, z1)];
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, i;
    for (i = 0; i < 4; i++) { x0 = Math.min(x0, cs[i][0]); x1 = Math.max(x1, cs[i][0]); y0 = Math.min(y0, cs[i][1]); y1 = Math.max(y1, cs[i][1]); }
    for (var y = Math.floor(y0); y <= Math.ceil(y1); y++) for (var x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      var xc = x + 0.5, yc = y + 0.5, a, z;
      if (pl === 'R') { a = (xc - this.cx + 2 * k) / 2; z = this.by - k - a - yc; }
      else { a = (this.cx + 2 * k - xc) / 2; z = this.by - a - k - yc; }
      if (a < a0 || a >= a1 || z < z0 || z >= z1) continue;
      this.set(x, y, c);
    }
  };
  // ระนาบนอน z=k ช่วง u∈[u0,u1) v∈[v0,v1)
  G.tq = function (z, u0, u1, v0, v1, c) {
    var cs = [this.P(u0, v0, z), this.P(u1, v0, z), this.P(u0, v1, z), this.P(u1, v1, z)];
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, i;
    for (i = 0; i < 4; i++) { x0 = Math.min(x0, cs[i][0]); x1 = Math.max(x1, cs[i][0]); y0 = Math.min(y0, cs[i][1]); y1 = Math.max(y1, cs[i][1]); }
    for (var y = Math.floor(y0); y <= Math.ceil(y1); y++) for (var x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      var s = this.by - z - (y + 0.5), d = (x + 0.5 - this.cx) / 2, u = (s - d) / 2, v = (s + d) / 2;
      if (u < u0 || u >= u1 || v < v0 || v >= v1) continue;
      this.set(x, y, c);
    }
  };
  // กล่อง iso: ฐานเริ่มที่ (ou,ov,oz) ขนาด A(ลึกแกนซ้าย) B(ยาวแกนขวา) H(สูง)
  G.box = function (ou, ov, oz, A, B, H, cT, cL, cR, o) {
    o = o || {};
    this.quad('L', ov, ou, ou + A, oz, oz + H, cL);
    this.quad('R', ou, ov, ov + B, oz, oz + H, cR);
    this.tq(oz + H, ou, ou + A, ov, ov + B, cT);
    if (o.rim) {
      this.tq(oz + H, ou, ou + A, ov, ov + 0.6, o.rim);
      this.tq(oz + H, ou, ou + 0.6, ov, ov + B, o.rim);
    }
    if (o.edge) this.quad('L', ov, ou, ou + 0.5, oz, oz + H, o.edge);
  };
  G.ell = function (xc, yc, rx, ry, c) {
    for (var y = Math.floor(yc - ry); y <= Math.ceil(yc + ry); y++) for (var x = Math.floor(xc - rx); x <= Math.ceil(xc + rx); x++) {
      var dx = (x + 0.5 - xc) / rx, dy = (y + 0.5 - yc) / ry;
      if (dx * dx + dy * dy <= 1) this.set(x, y, c);
    }
  };
  G.ring = function (xc, yc, rx, ry, c, th) {   // วงแหวนบาง
    th = th || 1;
    for (var y = Math.floor(yc - ry - 1); y <= Math.ceil(yc + ry + 1); y++) for (var x = Math.floor(xc - rx - 1); x <= Math.ceil(xc + rx + 1); x++) {
      var dx = (x + 0.5 - xc) / rx, dy = (y + 0.5 - yc) / ry, d = dx * dx + dy * dy;
      var ix = (rx - th) / rx, iy = (ry - th) / ry, di = ((x + 0.5 - xc) / (rx - th)) * ((x + 0.5 - xc) / (rx - th)) + ((y + 0.5 - yc) / (ry - th)) * ((y + 0.5 - yc) / (ry - th));
      if (d <= 1 && (rx - th <= 0 || ry - th <= 0 || di >= 1)) this.set(x, y, c);
    }
  };
  G.rell = function (xc, yc, rx, ry, ang, c) {   // ellipse เอียง (ใบไม้)
    var ca = Math.cos(ang), sa = Math.sin(ang), R = Math.max(rx, ry) + 1;
    for (var y = Math.floor(yc - R); y <= Math.ceil(yc + R); y++) for (var x = Math.floor(xc - R); x <= Math.ceil(xc + R); x++) {
      var px = x + 0.5 - xc, py = y + 0.5 - yc;
      var a = (px * ca + py * sa) / rx, b = (-px * sa + py * ca) / ry;
      if (a * a + b * b <= 1) this.set(x, y, c);
    }
  };
  // ทรงกระบอก: ศูนย์กลางฐาน (x,y) จอ รัศมี rx(px) สูง h ; ข้างซ้าย/ขวา
  G.cyl = function (x, y, rx, h, cT, cL, cR, o) {
    o = o || {};
    var ry = rx / 2;
    for (var i = Math.floor(x - rx); i < Math.ceil(x + rx); i++) {
      var dx = i + 0.5 - x; if (Math.abs(dx) > rx) continue;
      var t = ry * Math.sqrt(1 - (dx / rx) * (dx / rx));
      var yt = y - h - t, yb = y + t, col = dx < 0 ? cL : cR;
      if (o.hl && dx > -rx * 0.55 && dx < -rx * 0.3) col = o.hl;
      for (var j = Math.floor(yt + 0.5); j < Math.floor(yb + 0.5); j++) this.set(i, j, col);
    }
    this.ell(x, y - h, rx, ry, cT);
    if (o.rim) this.ring(x, y - h, rx, ry, o.rim, 1);
  };
  // เส้นในระนาบผนัง (a,z) — plane 'R' a=v ; 'L' a=u
  G.pline = function (pl, k, a1, z1, a2, z2, c) {
    var n = Math.ceil(Math.max(Math.abs(a2 - a1) * 2, Math.abs(z2 - z1)) * 4) + 1;
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = a1 + (a2 - a1) * t, z = z1 + (z2 - z1) * t;
      var p = pl === 'R' ? this.P(k, a, z) : this.P(a, k, z);
      this.set(Math.floor(p[0]), Math.floor(p[1] - 0.0001), c);
    }
  };
  // ภาพ rows บนระนาบผนัง (คอลัมน์ละ 1px, เฉียง 1px ทุก 2 คอลัมน์ ตาม iso 2:1)
  // 'R': เริ่มที่ v=a0 ไปทางขวา ; 'L': เริ่มที่ u=a0 (ซ้ายสุด) ไปทางขวา. ztop = สูงของแถวบน
  G.pimg = function (pl, k, a0, ztop, rows, map) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      var ch = rows[j][i]; if (ch === '.' || ch === ' ') continue;
      var c = typeof map === 'string' ? map : map[ch]; if (!c) continue;
      if (pl === 'R') this.quad('R', k, a0 + i * 0.5, a0 + (i + 1) * 0.5, ztop - j - 1, ztop - j, c);
      else this.quad('L', k, a0 - (i + 1) * 0.5, a0 - i * 0.5, ztop - j - 1, ztop - j, c);
    }
  };

  // ข้อความตั้งตรง ขั้นบันไดตามตัวอักษร (อ่านง่ายกว่า shear ทีละคอลัมน์) — plane 'R' เท่านั้น
  G.stext = function (k, a0, ztop, str, c) {
    var rows = textRows(str), n = rows[0].length;
    var p0 = this.P(k, a0, ztop), x0 = Math.floor(p0[0]);
    var i = 0;
    for (var s = 0; s < str.length; s++) {
      var gl = FONT[str[s]]; if (!gl) continue;
      var gw = gl[0].length, off = Math.floor((i + gw / 2) / 2);          // ยกทั้งตัวอักษรขึ้นตามตำแหน่งกลางตัว
      var y0 = Math.floor(p0[1]) - off;
      for (var r = 0; r < 5; r++) for (var q = 0; q < gw; q++) if (gl[r][q] === 'X') this.set(x0 + i + q, y0 + r, c);
      i += gw + 1;
    }
  };

  /* ---------- ฟอนต์จิ๋ว 3x5 (ตัวอักษรอังกฤษ/เลข) ---------- */
  var FONT = {
    '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'],
    'H': ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'], 'L': ['X..', 'X..', 'X..', 'X..', 'XXX'],
    'A': ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'], 'S': ['XXX', 'X..', 'XXX', '..X', 'XXX'],
    'O': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], 'N': ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'],
    'W': ['X...X', 'X...X', 'X.X.X', 'XX.XX', 'X...X'], 'E': ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
    'P': ['XX.', 'X.X', 'XX.', 'X..', 'X..'], 'T': ['XXX', '.X.', '.X.', '.X.', '.X.'],
    'B': ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'], 'U': ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
    'R': ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'], 'D': ['XX.', 'X.X', 'X.X', 'X.X', 'XX.'],
    '1': ['.X.', 'XX.', '.X.', '.X.', 'XXX'], '+': ['...', '.X.', 'XXX', '.X.', '...'], '-': ['...', '...', 'XXX', '...', '...'], ' ': ['.', '.', '.', '.', '.']
  };
  function textRows(str) {
    var rows = ['', '', '', '', ''];
    for (var i = 0; i < str.length; i++) {
      var g = FONT[str[i]]; if (!g) continue;
      for (var r = 0; r < 5; r++) rows[r] += g[r].replace(/X/g, 'X') + (i < str.length - 1 ? '.' : '');
    }
    return rows;
  }

  /* ---------- สร้าง + ตรวจ + แปลงเป็นตัวอักษร ---------- */
  var OUT = {}, QC = {};
  var POOL = 'abcdefghijlmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function def(name, n, build, opt) {
    opt = opt || {};
    var gs = [], f, x, y;
    for (f = 0; f < n; f++) {
      var g = new Grid(); build(g, f); gs.push(g);
    }
    // เส้นขอบดำนอก (4-neighbour) แล้ววาง fx ทับ
    var comps = gs.map(function (g) {
      var out = g.m.slice(), W = g.W, H = g.H;
      if (!opt.noOutline) {
        for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
          if (g.m[y * W + x]) continue;
          if ((x > 0 && g.m[y * W + x - 1]) || (x < W - 1 && g.m[y * W + x + 1]) ||
            (y > 0 && g.m[(y - 1) * W + x]) || (y < H - 1 && g.m[(y + 1) * W + x])) out[y * W + x] = K;
        }
      }
      for (var i = 0; i < out.length; i++) if (g.f[i]) out[i] = g.f[i];
      return out;
    });
    // จำกัดสีนอก palette กลางไม่เกิน 6 (ตามสเปก): สีที่ใช้น้อยสุดถูกแมปไปสีใกล้สุด
    (function () {
      var use = {};
      comps.forEach(function (c) { c.forEach(function (v) { if (v) use[v] = (use[v] || 0) + 1; }); });
      var ex = Object.keys(use).filter(function (h) { return BRIEF.indexOf(h) < 0; });
      if (ex.length <= 6) return;
      function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
      function dist(a, b) { var p = rgb(a), q = rgb(b); return (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]) + (p[2] - q[2]) * (p[2] - q[2]); }
      ex.sort(function (a, b) { return use[b] - use[a]; });
      var keep = ex.slice(0, 6), map = {};
      var usedBrief = Object.keys(use).filter(function (h) { return BRIEF.indexOf(h) >= 0; });
      ex.slice(6).forEach(function (h) {
        var best = null, bd = 1e12;
        keep.concat(usedBrief).forEach(function (k) { var d = dist(h, k); if (d < bd) { bd = d; best = k; } });
        map[h] = best;
      });
      comps.forEach(function (c) { for (var i = 0; i < c.length; i++) if (c[i] && map[c[i]]) c[i] = map[c[i]]; });
    })();
    // bbox รวมทุกเฟรม; กว้างให้สมมาตรรอบ cx เพื่อให้ anchor กลางล่างตรง
    var minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
    comps.forEach(function (c) {
      for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) if (c[y * GW + x]) {
        if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
    });
    if (maxx < 0) throw new Error('SPR_ITEMS.' + name + ': empty sprite');
    var half = Math.max(CX - minx, maxx + 1 - CX), w = half * 2, h = maxy - miny + 1;
    // สี → ตัวอักษร
    var pal = {}, rev = {}, pi = 0, extras = {};
    function letter(hex) {
      if (rev[hex]) return rev[hex];
      var ch = hex === K ? 'k' : POOL[pi++];
      if (!ch) throw new Error('SPR_ITEMS.' + name + ': too many colours');
      rev[hex] = ch; pal[ch] = hex;
      if (BRIEF.indexOf(hex) < 0) extras[hex] = 1;
      return ch;
    }
    var frames = comps.map(function (c) {
      var rows = [];
      for (var yy = miny; yy <= maxy; yy++) {
        var s = '';
        for (var xx = CX - half; xx < CX + half; xx++) { var v = c[yy * GW + xx]; s += v ? letter(v) : '.'; }
        rows.push(s);
      }
      return rows;
    });
    var spr = { w: w, h: h, pal: pal, frames: frames, anchor: 'bottom-center' };
    // ตรวจรูปแบบ
    frames.forEach(function (fr, fi) {
      if (fr.length !== h) throw new Error('SPR_ITEMS.' + name + ' frame ' + fi + ' rows ' + fr.length + ' != ' + h);
      fr.forEach(function (row, ri) { if (row.length !== w) throw new Error('SPR_ITEMS.' + name + ' frame ' + fi + ' row ' + ri + ' len ' + row.length + ' != ' + w); });
    });
    OUT[name] = spr;
    QC[name] = { w: w, h: h, frames: n, colours: Object.keys(pal).length, extras: Object.keys(extras).length, extraList: Object.keys(extras) };
  }

  // วัสดุ: [top, left, right]
  var MAT = {
    wood: [WOOD, WOODD, WOODX],
    cream: [CREAM, CR2, CR3],
    metal: [M1, M2, M3],
    leaf: [LEAFL, LEAF, LEAFD]
  };

  /* ================= ชั้น 1 : คาเฟ่ ================= */

  def('cafe_counter', 2, function (g, f) {
    // เคาน์เตอร์ยาวไปทางขวา-บน (B=18) หน้าใช้งานคือหน้าขวา
    g.box(0, 0, 0, 5, 18, 11, WOOD, WOOD, WOODD);
    for (var v = 1.5; v < 18; v += 3) g.quad('R', 0, v, v + 0.5, 1, 10.5, WOODX);   // ร่องไม้
    g.quad('R', 0, 0, 18, 0, 1, WOODX);                                              // ขอบล่าง
    g.box(-0.6, -0.6, 11, 6.2, 19.2, 2, CREAM, CR2, CR3);                            // หน้าหินอ่อน
    // เครื่องชงกาแฟ
    g.box(1.0, 1.0, 13, 3.2, 7, 7.5, M1, M2, M3);
    g.pimg('R', 1.0, 1.0, 20.5, [
      'llllllllllllll',
      'lSS.llll...rl.',
      '..............',
      '...kk....kk...',
      '...kk....kk...',
      '...cc....cc...',
      '..............'
    ], { l: M2, S: SCR, r: RED, k: K, c: CREAM });
    // ถ้วย + จานรอง + โดมเค้ก
    g.box(1.0, 9.4, 13, 2, 2, 2.4, CREAM, CR2, CR3);
    g.box(1.0, 12.0, 13, 2, 2, 2.4, RED, '#a82b2f', '#7d1f24');
    g.box(0.8, 14.6, 13, 3.6, 3.6, 0.6, CREAM, CR2, CR3);
    var d = g.P(2.6, 16.4, 13.6);
    g.ell(d[0], d[1] - 2.8, 3.4, 3.2, SCR);
    g.ell(d[0], d[1] - 1.6, 2.6, 1.6, WOOD);
    g.ell(d[0], d[1] - 2.4, 2.2, 0.9, CREAM);
    g.set(d[0] - 2, d[1] - 4.5, CREAM); g.set(d[0] - 1, d[1] - 5, CREAM);
    // ไอน้ำ (fx)
    g.fx = true;
    var s = g.P(2.6, 4.2, 20.6), sx = Math.floor(s[0]), sy = Math.floor(s[1]);
    if (f === 0) { g.set(sx, sy - 2, CREAM); g.set(sx + 1, sy - 4, CR2); g.set(sx, sy - 6, CREAM); g.set(sx + 1, sy - 8, CR2); }
    else { g.set(sx + 1, sy - 3, CREAM); g.set(sx, sy - 5, CR2); g.set(sx + 1, sy - 7, CREAM); g.set(sx, sy - 9, CR2); }
    g.fx = false;
  });

  function chair(g, u, v, face, seatC, seatL, seatR) {
    // เก้าอี้ไม้ + เบาะ; face 'u' = หันไป -u (หลังพิงอยู่ด้าน u สูง), 'v' = หันไป -v
    var S = 3.2, lg = 0.7, i;
    var corners = [[S - lg, S - lg], [S - lg, 0], [0, S - lg], [0, 0]];
    for (i = 0; i < 4; i++) g.box(u + corners[i][0], v + corners[i][1], 0, lg, lg, 3.6, WOOD, WOODD, WOODX);
    if (face === 'u') {
      g.box(u + S - 0.8, v, 4.0, 0.8, S, 6.0, WOOD, WOODD, WOODX);
      g.quad('R', u + S - 0.8, v + 0.5, v + S - 0.5, 6.6, 8.8, WOODD); g.quad('R', u + S - 0.8, v + S / 2 - 0.25, v + S / 2 + 0.25, 6.0, 9.6, WOODX);
    } else {
      g.box(u, v + S - 0.8, 4.0, S, 0.8, 6.0, WOOD, WOODD, WOODX);
      g.quad('L', v + S - 0.8, u + 0.5, u + S - 0.5, 6.6, 8.8, WOODD); g.quad('L', v + S - 0.8, u + S / 2 - 0.25, u + S / 2 + 0.25, 6.0, 9.6, WOODX);
    }
    g.box(u, v, 3.6, S, S, 0.9, WOOD, WOODD, WOODX);
    g.box(u + 0.7, v + 0.7, 4.5, S - 1.5, S - 1.5, 0.6, seatC, seatL, seatR);
  }

  def('cafe_table_set', 1, function (g) {
    var RL = '#a82b2f', RR = '#7d1f24';
    chair(g, 6.8, 1.4, 'u', RED, RL, RR);
    chair(g, 1.4, 6.8, 'v', RED, RL, RR);
    var c = g.P(3, 3, 0), x = c[0], y = c[1];
    g.ell(x, y - 0.5, 3.8, 1.9, WOODX);
    g.cyl(x, y - 0.5, 1.3, 8, WOOD, WOODD, WOODX);
    g.cyl(x, y - 8.5, 8, 1.8, WOOD, WOODD, WOODX, { rim: WARM });
    g.cyl(x - 2.5, y - 10.3, 1.7, 1.8, CREAM, CR2, CR3);
    g.set(x - 4.5, y - 12.2, K);
    g.cyl(x + 3, y - 10, 1.3, 1.4, CREAM, CR2, CR3);
    g.rect(Math.floor(x) + 2, Math.floor(y) - 12, 2, 1, WARM);
  });

  def('cafe_armchair', 1, function (g) {
    var CL = '#a82b2f', CR_ = '#7d1f24';
    g.box(0.6, 0.6, 0, 0.9, 0.9, 2, WOOD, WOODD, WOODX);
    g.box(0.6, 5.5, 0, 0.9, 0.9, 2, WOOD, WOODD, WOODX);
    g.box(5.2, 0.6, 0, 0.9, 0.9, 2, WOOD, WOODD, WOODX);
    g.box(5.2, 5.5, 0, 0.9, 0.9, 2, WOOD, WOODD, WOODX);
    g.box(5.0, 0, 2, 2, 7, 11, RED, CL, CR_, { rim: '#f06a60' });          // พนักพิง
    g.box(0, 0, 2, 5.0, 1.8, 6.5, RED, CL, CR_, { rim: '#f06a60' });          // แขนซ้ายหน้า
    g.box(0, 5.2, 2, 5.0, 1.8, 6.5, RED, CL, CR_, { rim: '#f06a60' });
    g.box(0, 1.8, 2, 5.0, 3.4, 2.8, RED, CL, CR_, { rim: '#f06a60' });          // เบาะ
    g.box(3.6, 2.6, 4.8, 1.5, 3.0, 1.2, CREAM, CR2, CR3);                      // หมอนหนุน
  });

  def('cafe_shelf_mugs', 1, function (g) {
    // ชั้นติดผนัง 2 ชั้น + แก้วมัค (ผนังอยู่ด้าน u สูง)
    g.box(2.0, 0, 0, 0.6, 15, 19, WOODX, WOODX, WOODX);
    g.box(0, 0, 0.0, 2.6, 15, 1, WOOD, WOODD, WOODX, { rim: WARM });
    g.box(0, 0, 9.0, 2.6, 15, 1, WOOD, WOODD, WOODX, { rim: WARM });
    g.box(0, 0, 18.0, 2.6, 15, 1, WOOD, WOODD, WOODX, { rim: WARM });
    var mugs = [[1.5, CREAM, CR2, CR3], [4.2, RED, '#a82b2f', '#7d1f24'], [6.9, SCR, '#2f8d92', '#1d5d62'], [9.6, WARM, '#c99a45', '#8a6a2a'], [12.3, CREAM, CR2, CR3]];
    mugs.forEach(function (m, i) {
      var p = g.P(1.2, m[0] + 0.7, 1);
      g.cyl(p[0], p[1], 2.2, 3.2, m[1], m[2], m[3]);
      g.set(p[0] + 2, p[1] - 3, m[3]); g.set(p[0] + 3, p[1] - 3, m[3]);
      var q = g.P(1.2, m[0] + 0.7, 10);
      if (i % 2 === 0) g.cyl(q[0], q[1], 2.2, 2.6, m[1], m[2], m[3]);
      else g.cyl(q[0], q[1], 2.6, 4.6, CREAM, CR2, CR3), g.rect(Math.floor(q[0]) - 2, Math.floor(q[1]) - 4, 4, 1, m[1]);
    });
  });

  def('sign_24h', 2, function (g, f) {
    var on = f === 0;
    g.box(0, 0, 0, 1, 10, 9, WALL2, WALL2, WALL2);
    g.quad('R', 0, 0, 10, 0, 1, RED); g.quad('R', 0, 0, 10, 8, 9, RED);
    g.quad('R', 0, 0, 0.5, 0, 9, RED); g.quad('R', 0, 9.5, 10, 0, 9, RED);
    g.quad('R', 0, 0.5, 9.5, 1, 8, '#1a1020');
    var rows = textRows('24H');
    g.stext(0, 1.3, 7, '24H', on ? WARM : '#7a5a3a');
    g.quad('L', 0, 0, 1, 0, 9, RED);
    if (on) { g.fx = true; var p = g.P(0, 5, 9); g.set(p[0] - 5, p[1] - 3, WARM); g.set(p[0] + 4, p[1] - 3, WARM); g.fx = false; }
  });

  function potted(g, x, y, rx, h, pc, pl, pr) {
    g.cyl(x, y, rx, h, '#3a2418', pl, pr);                       // กระถาง
    g.cyl(x, y - h, rx + 0.5, 1.2, pc, pl, pr);
  }
  def('plant_big', 1, function (g) {
    var c = g.P(2, 2, 0), x = c[0], y = c[1];
    g.cyl(x, y, 5, 7, '#3a2418', WOODD, WOODX);
    g.cyl(x, y - 7, 5.6, 1.5, WOOD, WOODD, WOODX);
    var lv = [[-9, -18, 0.5, 5, 9], [8, -20, -0.5, 5, 9], [-4, -26, 0.15, 5, 9], [5, -29, -0.2, 5, 9], [-12, -10, 1.1, 4, 7], [12, -11, -1.1, 4, 7], [0, -17, 0, 4, 8]];
    lv.forEach(function (l) {
      g.line(x, y - 8, x + l[0] * 0.8, y - 8 + l[1] * 0.45, LEAFD);
      g.rell(x + l[0], y + l[1], l[3], l[4] / 1.6 + 1, l[2], LEAF);
      g.rell(x + l[0] + (l[0] > 0 ? 1 : -1) * 0.8, y + l[1] - 1, l[3] - 2, l[4] / 2.2 + 1, l[2], LEAFL);
    });
  });
  def('plant_small', 1, function (g) {
    var c = g.P(1.2, 1.2, 0), x = c[0], y = c[1];
    g.cyl(x, y, 3.4, 4.2, '#3a2418', WOODD, WOODX);
    g.cyl(x, y - 4.2, 3.8, 1.1, WOOD, WOODD, WOODX);
    [[-4, -9, 1.0], [4, -9, -1.0], [-2, -12, 0.45], [2, -13, -0.45], [0, -9, 0]].forEach(function (l) {
      g.line(x, y - 5, x + l[0] * 0.6, y - 5 + l[1] * 0.5, LEAFD);
      g.rell(x + l[0], y + l[1], 2.0, 4.0, l[2], LEAF); g.rell(x + l[0] + 0.4, y + l[1] - 0.8, 1.0, 2.4, l[2], LEAFL);
    });
  });

  def('glass_door', 2, function (g, f) {
    var open = f === 1, DOOR_H = 29, W = 9;
    var GL = '#2f8d92', GD = '#1d5d62';
    // วงกบ
    g.box(0, 0, 0, 1.4, 1.2, DOOR_H, WOODD, WOODD, WOODX);
    g.box(0, W - 1.2, 0, 1.4, 1.2, DOOR_H, WOODD, WOODD, WOODX);
    g.box(0, 0, DOOR_H - 1.5, 1.4, W, 1.5, WOODD, WOODD, WOODX);
    // ช่องประตู
    g.quad('R', 0.3, 1.2, W - 1.2, 0, DOOR_H - 1.5, open ? '#1a1228' : SCR);
    if (!open) {
      g.quad('R', 0.3, 1.2, W - 1.2, 0, 1.5, WOODD);
      for (var i = 0; i < 4; i++) { g.pline('R', 0.3, 1.6 + i * 1.4, 3, 2.4 + i * 1.4, 12, '#9fe0e2'); }
      g.quad('R', 0.3, W - 2.2, W - 1.8, 11, 17, WARM);      // มือจับ
      g.quad('R', 0.3, 1.2, W - 1.2, DOOR_H - 4.5, DOOR_H - 3.5, WOODD);
    } else {
      // บานประตูผลักออกมาหาเรา (ระนาบ v=1.2)
      g.quad('L', 1.2, -5.5, 0.3, 0, DOOR_H - 1.5, GL);
      g.quad('L', 1.2, -5.5, 0.3, 0, 1.5, WOODD);
      g.quad('L', 1.2, -5.5, 0.3, DOOR_H - 4.5, DOOR_H - 3.5, WOODD);
      g.quad('L', 1.2, -5.5, -5, 0, DOOR_H - 1.5, WOODD);
      for (var j = 0; j < 3; j++) g.pline('L', 1.2, -1 - j * 1.6, 3, -2 - j * 1.6, 14, '#9fe0e2');
      g.quad('L', 1.2, -5.0, -4.2, 11, 15, WARM);
    }
    // กระดิ่ง
    var b = g.P(0.3, 4.2, DOOR_H - 1.5), bx = Math.floor(b[0]), by_ = Math.floor(b[1]);
    g.set(bx, by_, K); g.set(bx, by_ + 1, K);
    g.rect(bx - 1 + (open ? 1 : 0), by_ + 2, 3, 2, WARM);
    g.set(bx + (open ? 1 : 0), by_ + 4, WARM);
    if (open) { g.fx = true; g.set(bx - 3, by_ + 2, WARM); g.set(bx + 4, by_ + 3, WARM); g.fx = false; }
  });

  /* ================= ชั้น 2 : ออฟฟิศเทรด ================= */

  // ชุดข้อมูลแท่งเทียน (สุ่มแบบ deterministic)
  function candles(seed, n, rowsH) {
    var out = [], p = rowsH / 2, st = seed;
    function rnd() { st = (st * 1103515245 + 12345) & 0x7fffffff; return st / 0x7fffffff; }
    for (var i = 0; i < n; i++) {
      var o = p, c = Math.max(0.5, Math.min(rowsH - 1.5, o + (rnd() - 0.47) * 3.2));
      var hi = Math.min(rowsH - 1, Math.max(o, c) + rnd() * 1.4), lo = Math.max(0, Math.min(o, c) - rnd() * 1.4);
      out.push({ o: o, c: c, hi: hi, lo: lo }); p = c;
    }
    return out;
  }
  function chartRows(seed, f, cols, rowsH) {
    var data = candles(seed, 16, rowsH), rows = [], r, c;
    for (r = 0; r < rowsH; r++) { var s = ''; for (c = 0; c < cols; c++) s += (c % 4 === 3 && r === 2) ? 'g' : '.'; rows.push(s.split('')); }
    var n = Math.floor((cols + 1) / 2);
    for (var i = 0; i < n; i++) {
      var d = data[(i + f + 3 * (seed % 3)) % data.length], col = i * 2, up = d.c >= d.o;
      var b0 = Math.min(d.o, d.c), b1 = Math.max(d.o, d.c);
      for (r = 0; r < rowsH; r++) {
        var y = rowsH - 1 - r;           // แถวล่าง = ค่าต่ำ
        if (y >= d.lo - 0.01 && y <= d.hi + 0.5) rows[r][col] = up ? 'w' : 'x';
        if (y >= b0 - 0.5 && y <= b1 + 0.5) rows[r][col] = up ? 'U' : 'D';
      }
    }
    return rows.map(function (a) { return a.join(''); });
  }
  function monitor(g, v0, seed, f, cs) {
    g.box(2.4, v0 + 1.9, 10, 0.8, 1.0, 2.2, M3, M3, M3);                          // ขาตั้ง
    g.box(2.0, v0 + 0.2, 11.6, 1.0, 4.8, 7.8, M1, M2, M3);                       // ตัวจอ (ขอบเทา)
    g.quad('R', 2.0, v0 + 0.5, v0 + 4.7, 12.4, 18.8, SKY);
    g.pimg('R', 2.0, v0 + 0.55, 18.6, chartRows(seed, f, 8, 6), { w: cs.uw, U: cs.u, x: cs.dw, D: cs.d, g: BLD });
  }
  function deskOpen(g, f, alt) {
    var cs = alt ? { u: WARM, uw: '#a8742a', d: SCR, dw: '#2f8d92' } : { u: LEAFL, uw: LEAF, d: RED, dw: '#8c2326' };
    var tp = alt ? [WOOD, WOODD, WOODX] : [CREAM, CR2, CR3];
    [0.3, 11.5, 22.7].forEach(function (v) { g.box(0.8, v, 0, 5.4, 1.0, 8.4, BLD, WALL2, SKY); });   // ขาโต๊ะ
    g.box(0, 0, 8.4, 7, 24, 1.8, tp[0], tp[1], tp[2], { rim: alt ? WARM : '#fff6e6' });
    var s, m;
    for (s = 0; s < 2; s++) for (m = 0; m < 2; m++) monitor(g, 0.9 + s * 11.6 + m * 5.7, 3 + s * 7 + m * 11 + (alt ? 5 : 0), f, cs);
    [0, 1].forEach(function (s_) {
      g.box(0.4, 3.0 + s_ * 11.6, 10.2, 1.6, 4.4, 0.5, M2, M3, WALL2);             // คีย์บอร์ด
      g.box(0.6, 8.2 + s_ * 11.6, 10.2, 0.9, 0.7, 0.4, M1, M2, M3);                // เมาส์
    });
    var c = g.P(4.6, 11.6, 10.2);
    g.cyl(c[0], c[1], 2.5, 3, '#3a2418', WOODD, WOODX);                              // กระถางเล็กกลางโต๊ะ
    g.rell(c[0], c[1] - 6, 2, 2.6, 0.5, LEAF); g.rell(c[0] + 2, c[1] - 6, 1.6, 2.6, -0.5, LEAFL); g.rell(c[0] - 2, c[1] - 6, 1.6, 2.4, 0.9, LEAFL);
    var mg = g.P(2.6, 22.2, 10.2);
    g.cyl(mg[0], mg[1], 1.8, 2.4, alt ? RED : CREAM, alt ? '#a82b2f' : CR2, alt ? '#7d1f24' : CR3);
  }
  def('desk_open_2', 3, function (g, f) { deskOpen(g, f, false); });
  def('desk_open_2_alt', 3, function (g, f) { deskOpen(g, f, true); });

  def('chair_office', 1, function (g) {
    var c = g.P(2.2, 2.2, 0);
    g.ell(c[0], c[1] - 0.5, 5.5, 2.2, WALL2);
    g.cyl(c[0], c[1] - 1, 0.9, 4.5, M3, M3, M3);
    g.box(0.2, 0.2, 5, 4, 4, 1.6, '#3b3560', WALL2, BLD);
    g.box(3.4, 0.2, 6.6, 0.8, 4, 6.4, '#3b3560', WALL2, BLD);
    g.quad('R', 3.4, 0.9, 3.5, 6.6, 13, RED); g.quad('R', 3.4, 3.4, 4.0, 6.6, 13, RED);
  });

  var TK = {
    sA: ['CCC', 'C.C', 'C.C'], sB: ['CC.', 'CCC', 'C.C'], sC: ['CCC', 'C..', 'CCC'], sD: ['CCC', '.C.', '.C.'],
    nA: ['WW.W', 'W.WW', 'WWWW'], nB: ['WWW', 'W.W', 'WWW'], nC: ['W.WW', 'WWW.', 'W.WW'],
    up: ['.G.', 'GGG', '...'], dn: ['...', 'RRR', '.R.'], g: ['.', '.', '.']
  };
  function tickerStrip(seq) {
    var rows = ['', '', ''];
    seq.forEach(function (k) { for (var r = 0; r < 3; r++) rows[r] += TK[k][r]; });
    return rows;
  }
  def('price_board', 3, function (g, f) {
    var B = 22;
    g.box(0, 0, 0, 1, B, 11, M3, M3, M3);
    g.quad('R', 0, 0.4, B - 0.4, 0.8, 10.2, SKY);
    var seqA = ['sA', 'g', 'nA', 'g', 'up', 'g', 'g', 'sB', 'g', 'nB', 'g', 'dn', 'g', 'g', 'sC', 'g', 'nC', 'g', 'up', 'g', 'g', 'sD', 'g', 'nA', 'g', 'dn', 'g', 'g'];
    var seqB = ['sD', 'g', 'nB', 'g', 'dn', 'g', 'g', 'sC', 'g', 'nC', 'g', 'up', 'g', 'g', 'sB', 'g', 'nA', 'g', 'dn', 'g', 'g', 'sA', 'g', 'nB', 'g', 'up', 'g', 'g'];
    var cols = 40, map = { C: CREAM, W: WARM, G: LEAFL, R: RED };
    [[seqA, 0, 9.4], [seqB, 17, 5.2]].forEach(function (L) {
      var st = tickerStrip(L[0]), P = st[0].length, off = (L[1] + f * 7) % P, win = ['', '', ''];
      for (var r = 0; r < 3; r++) for (var c = 0; c < cols; c++) win[r] += st[r][(c + off) % P];
      g.pimg('R', 0, 0.9, L[2], win, map);
    });
  });

  def('coffee_corner', 1, function (g) {
    g.box(0, 0, 0, 5, 11, 10, WOOD, WOOD, WOODD);
    g.quad('R', 0, 0, 11, 0, 1, WOODX);
    [0.7, 6.0].forEach(function (v) {
      g.quad('R', 0, v, v + 4.2, 1.6, 8.4, WOODX);
      g.quad('R', 0, v + 0.3, v + 3.9, 1.9, 8.1, WOODD);
      g.quad('R', 0, v + 3.2, v + 3.7, 4, 5.6, WARM);
    });
    g.box(-0.5, -0.5, 10, 6, 12, 1.6, CREAM, CR2, CR3);
    var k = g.P(2.5, 3, 11.6);
    g.cyl(k[0], k[1], 3.6, 5.4, RED, '#a82b2f', '#7d1f24', { hl: '#f06a60' });         // กาต้มน้ำสีแดง
    g.cyl(k[0], k[1] - 5.4, 2.0, 1.0, CREAM, CR2, CR3);                               // ฝา
    g.set(k[0], k[1] - 8, K); g.set(k[0], k[1] - 7, CREAM);
    g.line(k[0] + 3, k[1] - 4, k[0] + 6, k[1] - 8, '#a82b2f'); g.line(k[0] + 3, k[1] - 5, k[0] + 6, k[1] - 9, '#a82b2f');   // พวย
    g.ring(k[0] - 4.5, k[1] - 4, 2.0, 2.6, K, 1);                                     // หู
    var j = g.P(2.4, 7.6, 11.6);
    g.cyl(j[0], j[1], 2.4, 3.4, CREAM, CR2, CR3); g.rect(Math.floor(j[0]) - 2, Math.floor(j[1]) - 3, 4, 1, WOODD);
    g.box(1.2, 9.4, 11.6, 1.6, 1.6, 2, CREAM, CR2, CR3);
  });

  def('poster_bull', 1, function (g) {
    var rows = [
      'FFFFFFFFFFFFFFFF',
      'F..............F',
      'F.W..........W.F',
      'F.WW........WW.F',
      'F..WW......WW..F',
      'F..WWWWWWWWWW..F',
      'F...BBBBBBBB...F',
      'F..BBBBBBBBBB..F',
      'F..BkBBBBBBkB..F',
      'F..BBBBBBBBBB..F',
      'F...BBBBBBBB...F',
      'F....PPPPPP....F',
      'F....PkPPkP....F',
      'F....PPPPPP....F',
      'F..............F',
      'F.........GG...F',
      'F.......GG..G..F',
      'F..G..GG...GG..F',
      'F..GGGG........F',
      'F..............F',
      'FFFFFFFFFFFFFFFF'];
    g.box(0, 0, 0, 0.6, 8.2, 21, WOODD, WOODD, WOODX);
    g.quad('R', 0, 0.1, 8.1, 0, 21, WALL2);
    g.pimg('R', 0, 0.1, 21, rows, { F: WARM, W: CREAM, B: WOOD, P: '#e08a7a', k: K, G: LEAFL });
  });

  def('whiteboard_kanban', 1, function (g) {
    var B = 17;
    g.box(0, 0, 0, 0.8, B, 17, CR3, CR3, M3);
    g.quad('R', 0, 0.4, B - 0.4, 0.6, 16.4, CREAM);
    [5.9, 11.3].forEach(function (v) { g.quad('R', 0, v, v + 0.5, 0.6, 14.2, CR3); });
    var cols = [[0.9, [RED, WARM, SCR]], [6.4, [WARM, LEAFL]], [11.8, [LEAFL, SCR, RED, WARM]]];
    cols.forEach(function (c, ci) {
      g.quad('R', 0, c[0], c[0] + 4.2, 13.2, 14.2, [RED, WARM, LEAFL][ci]);
      c[1].forEach(function (cl, i) {
        g.quad('R', 0, c[0] + 0.3, c[0] + 3.8, 10.2 - i * 3.4, 12.6 - i * 3.4, cl);
        g.quad('R', 0, c[0] + 0.8, c[0] + 2.8, 11.4 - i * 3.4, 11.9 - i * 3.4, WALL2);
      });
    });
    g.box(-0.9, 2, 0, 1.0, 12, 0.7, M2, M2, M3);                                       // ถาดปากกา
    g.box(-0.5, 3, 0.7, 0.4, 1.6, 0.4, RED, RED, RED); g.box(-0.5, 5.5, 0.7, 0.4, 1.6, 0.4, SCR, SCR, SCR);
  });

  /* ================= ชั้น 3 : ห้องพักเบรค ================= */

  var SETR = [RED, '#a82b2f', '#7d1f24'], SETB = ['#3f55c0', '#2f3f94', '#222e70'];

  function arcade(g, f, body, acc, game, word) {
    var A = 5, B = 6.4;
    g.box(0, 0, 0, A, B, 8.4, body[0], body[1], body[2]);                              // ตัวล่าง
    g.quad('R', 0, 0, B, 0, 1, WALL2);                                                 // แผ่นกันเตะ
    g.quad('R', 0, 0.8, B - 0.8, 1.8, 6.2, WALL2);                                     // ช่องหยอดเหรียญ
    g.quad('R', 0, 1.4, 2.4, 4.0, 5.4, WARM); g.quad('R', 0, B - 2.4, B - 1.4, 4.0, 5.4, RED);
    g.quad('R', 0, 2.8, B - 2.8, 2.6, 3.4, M3);
    // ลายข้างตู้ (แถบเฉียง)
    g.pline('L', 0, 0.4, 7.4, 4.6, 2.2, acc); g.pline('L', 0, 0.4, 6.4, 4.6, 1.2, acc);
    g.pline('L', 0, 0.4, 5.4, 4.6, 0.2, CREAM);
    g.box(1.0, 0, 8.4, A - 1.0, B, 9.2, body[0], body[1], body[2]);                    // ส่วนจอ (ถอยหลัง)
    g.quad('R', 1.0, 0.5, B - 0.5, 9.6, 17.4, WALL2);
    g.quad('R', 1.0, 0.9, B - 0.9, 10.2, 16.8, SKY);
    g.pimg('R', 1.0, 1.1, 16.6, game(f), { G: LEAFL, g: LEAF, Y: WARM, R: RED, B: SCR, W: CREAM, s: M2, o: WARM, b: '#2f6fd0' });
    g.box(-1.9, 0.3, 7.4, 2.9, B - 0.6, 1.4, M1, M2, M3);                               // แผงควบคุมยื่นออกมา
    g.box(-1.5, 1.2, 8.8, 0.9, 0.9, 0.5, K, K, K);
    var js = g.P(-1.05, 1.65, 9.3);
    g.set(js[0], js[1] - 1, K); g.set(js[0], js[1] - 2, K); g.rect(Math.floor(js[0]) - 1, Math.floor(js[1]) - 4, 2, 2, RED);
    g.box(-1.7, 2.9, 8.8, 1.0, 1.0, 0.5, WARM, '#c99a45', '#8a6a2a');
    g.box(-1.7, 4.2, 8.8, 1.0, 1.0, 0.5, SCR, '#2f8d92', '#1d5d62');
    g.box(-1.7, 5.5, 8.8, 1.0, 1.0, 0.5, RED, '#a82b2f', '#7d1f24');
    g.box(0, 0, 17.6, A, B, 7, body[0], body[1], body[2]);                              // ป้ายบน (marquee ยื่นหน้า)
    var on = f === 0;
    g.quad('R', 0, 0.4, B - 0.4, 18.0, 24.0, on ? WARM : CREAM);
    var dk = acc === WARM ? RED : '#a82b2f';
    g.quad('R', 0, 0.4, B - 0.4, 23.0, 24.0, dk); g.quad('R', 0, 0.4, B - 0.4, 18.0, 19.0, dk);
    g.pimg('R', 0, 1.6, 22.0, ['.X.X.X.X.', 'XXXXXXXXX', '.X.X.X.X.'].map(function (r) { return r; }), { X: dk });
  }
  var INV = [[
    '.G.....G.', '..G...G..', '.GGGGGGG.', 'GG.GGG.GG', 'GGGGGGGGG', 'G.GGGGG.G', 'G.G...G.G'
  ], [
    '.G.....G.', 'G.G...G.G', 'GGGGGGGGG', 'GG.GGG.GG', 'GGGGGGGGG', '..GGGGG..', '.G.....G.'
  ]];
  var PAC = [[
    'bbbbbbbbb', '.........', '.YYY..RRR', 'YYYYo.RWR', 'YYY...RRR', '.........', 'bbbbbbbbb'
  ], [
    'bbbbbbbbb', '.........', '.YYY..RRR', 'YY..o.RWR', 'Y.....RRR', '.......R.', 'bbbbbbbbb'
  ]];
  def('arcade_cabinet_a', 2, function (g, f) { arcade(g, f, SETB, WARM, function (ff) { return INV[ff]; }, '1UP'); });
  def('arcade_cabinet_b', 2, function (g, f) { arcade(g, f, SETR, SCR, function (ff) { return PAC[ff]; }, 'TOP'); });

  function tvRows(frame) {
    var W = 32, H = 11, a = [], x, y;
    for (y = 0; y < H; y++) { a.push([]); for (x = 0; x < W; x++) a[y].push('.'); }
    function r(x0, y0, w, h, c) { for (var j = y0; j < y0 + h; j++) for (var i = x0; i < x0 + w; i++) if (a[j] && i < W) a[j][i] = c; }
    if (frame === 0) {
      r(0, 0, W, 8, 's'); r(0, 8, W, 2, 'l'); r(0, 10, W, 1, 'd');
      r(4, 1, 6, 2, 'c'); r(5, 0, 3, 1, 'c'); r(21, 2, 5, 1, 'c');
      r(13, 4, 7, 2, 'b'); r(16, 4, 1, 2, 'q');
      r(8, 5, 2, 1, 'k'); r(8, 6, 2, 2, 'r'); r(7, 8, 1, 1, 'k'); r(10, 8, 1, 1, 'k');
      r(22, 3, 1, 2, 'q'); r(25, 5, 4, 3, 'p'); r(24, 5, 6, 1, 'p');
    } else if (frame === 1) {
      r(0, 0, W, 11, 'a'); r(0, 0, W, 1, 'g');
      var cs = ['r', 'q', 's', 'G'];
      for (var i = 0; i < 4; i++) { r(2 + i * 7, 3, 6, 5, cs[i]); if (i === 1) { r(1 + i * 7, 2, 8, 1, 'c'); r(1 + i * 7, 8, 8, 1, 'c'); r(1 + i * 7, 2, 1, 7, 'c'); r(8 + i * 7, 2, 1, 7, 'c'); } }
      r(4, 10, 24, 1, 'g');
    } else {
      r(0, 0, W, 11, 'a');
      for (var k = 0; k < 6; k++) { a[1 + k][5 + k * 2] = 'm'; a[1 + k][6 + k * 2] = 'm'; }
      for (k = 0; k < 4; k++) { a[4 + k][14 + k * 2] = 'm'; }
    }
    return a.map(function (q) { return q.join(''); });
  }

  def('tv_big_ps5', 3, function (g, f) {
    var B = 19;
    // ตู้วางทีวี: ขา + ชั้นบน + ชั้นล่าง
    g.box(0.4, 0.3, 0, 4.2, 1.0, 9, WOODD, WOODD, WOODX);
    g.box(0.4, B - 1.3, 0, 4.2, 1.0, 9, WOODD, WOODD, WOODX);
    g.box(0.4, 0.3, 0.6, 4.2, B - 0.6, 0.8, WOOD, WOODD, WOODX);
    g.box(0, 0, 8.2, 5, B, 1.4, WOOD, WOODD, WOODX, { rim: WARM });
    // PS5 ตั้งตรง (ขาว + แถบดำ + LED ฟ้า)
    g.box(1.2, 7.4, 1.4, 1.8, 4.4, 6.4, CREAM, CR2, CR3);
    g.quad('R', 1.2, 8.7, 9.4, 1.8, 7.6, K);
    g.quad('R', 1.2, 9.6, 10.1, 2.2, 7.2, CR3);
    g.quad('R', 1.2, 9.0, 9.4, 2.2, 7.2, M3);
    g.quad('R', 1.2, 9.0, 9.4, 6.2, 7.0, SCR);
    g.box(1.8, 13.2, 1.4, 1.6, 2.6, 0.8, K, WALL2, K);                                  // จอยเกมวางข้าง ๆ
    g.box(1.8, 2.5, 1.4, 1.6, 3.2, 1.0, M3, M3, WALL2); g.box(1.8, 3.2, 2.4, 1.0, 0.8, 0.3, SCR, SCR, SCR);
    // ทีวี
    g.box(2.0, 1.0, 9.6, 1.0, B - 2, 13, M3, WALL2, SKY);
    g.box(2.2, 8, 9.6, 1.2, 3, 1.0, M3, M3, M3);
    g.quad('R', 2.0, 1.4, B - 1.4, 10.6, 21.8, SKY);
    g.pimg('R', 2.0, 1.5, 21.4, tvRows(f), { s: SCR, l: LEAF, d: WOODD, c: CREAM, b: WOOD, q: WARM, k: K, r: RED, p: LEAFD, a: BLD, g: M3, G: LEAFL, m: M3 });
    if (f !== 2) {
      g.fx = true;
      var p = g.P(2.0, 1.2, 21.8);
      for (var i = 0; i < 8; i++) g.set(p[0] + 2 + i * 4, p[1] - 3 - i * 2 + (i % 2), f === 0 ? '#9fe0e2' : CREAM);
      g.fx = false;
    }
  });

  def('sofa_l', 1, function (g) {
    var S = ['#3f7f93', '#2f6275', '#234c5d'], H = ['#5ca3b8', '#3f7f93', '#2f6275'];
    g.box(5.0, 0, 0.8, 2.2, 20, 12.5, S[0], S[1], S[2], { rim: H[0] });                       // พนักพิงหลัง
    g.box(0, 0, 0.8, 5, 20, 3.4, S[0], S[1], S[2]);                                            // ฐานตัวหลัก
    g.box(-8, 12, 0.8, 8, 8, 3.4, S[0], S[1], S[2]);                                           // ฐาน chaise
    g.box(-8, 18.2, 0.8, 13, 1.8, 8.2, S[0], S[1], S[2], { rim: H[0] });                       // แขนขวา
    g.box(0.2, 1.8, 4.2, 4.8, 5.1, 1.8, H[0], H[1], H[2], { rim: '#8fc7d6' });                 // เบาะ
    g.box(0.2, 6.9, 4.2, 4.8, 5.1, 1.8, H[0], H[1], H[2], { rim: '#8fc7d6' });
    g.box(-7.8, 12, 4.2, 13, 6.2, 1.8, H[0], H[1], H[2], { rim: '#8fc7d6' });
    [2.2, 7.5, 12.8].forEach(function (v) { g.box(4.0, v, 6.0, 1.2, 5, 5.4, H[0], H[1], H[2]); });   // หมอนพิง
    g.box(0, 0, 0.8, 5, 1.8, 7.4, S[0], S[1], S[2], { rim: H[0] });                            // แขนซ้าย
    g.box(-7.2, 13.2, 6.0, 2.2, 2.8, 2.4, WARM, '#c99a45', '#8a6a2a');                         // หมอนอิง
    g.box(1.4, 3.0, 6.0, 1.6, 2.6, 2.2, RED, '#a82b2f', '#7d1f24');
    [[0.8, 0.8], [0.8, 18.8], [-7.6, 18.8]].forEach(function (p) { g.box(p[0], p[1], 0, 0.8, 0.8, 0.8, WOODX, WOODX, WOODX); });
  });

  def('beanbag', 1, function (g) {
    var c = g.P(2.5, 2.5, 0), x = c[0], y = c[1];
    var D = '#7d1f24', M = '#a82b2f', L = '#f06a60';
    g.ell(x, y - 3, 10.5, 4.4, D);
    g.ell(x, y - 5.2, 10, 5.6, M);
    g.ell(x - 0.5, y - 8.6, 8, 5.2, RED);
    g.ell(x - 1, y - 11.6, 5.6, 3.2, RED);
    for (var j = Math.floor(y - 16); j < Math.floor(y); j++) for (var i = Math.floor(x + 1); i < Math.floor(x + 12); i++) {
      if (g.get(i, j) === RED && i > x + 4 - Math.max(0, (y - 9 - j)) * 0.6) g.set(i, j, M);   // เงาด้านขวา
    }
    g.ell(x - 4, y - 9, 1.6, 2.6, L);                                         // ไฮไลต์
    g.ell(x - 1, y - 12.6, 3.4, 1.5, D);                                      // ที่ยุบสำหรับนั่ง
    g.ell(x - 1, y - 12.2, 2.6, 1.0, M);
    g.line(x + 5, y - 4, x + 7, y - 8, D); g.line(x - 6, y - 4, x - 5, y - 7, D);
    g.ring(x + 5, y - 14, 1.8, 1.4, D, 1);                                    // หูหิ้ว
  });

  def('mini_fridge', 1, function (g) {
    g.box(0, 0, 0.8, 5, 5.6, 17, '#fff6e6', CREAM, CR2);
    g.box(0.2, 0.4, 0, 0.8, 0.8, 0.8, M3, M3, M3); g.box(0.2, 4.4, 0, 0.8, 0.8, 0.8, M3, M3, M3);
    g.quad('R', 0, 0, 5.6, 12.0, 12.5, CR3);                                  // รอยแบ่งช่องฟรีซ
    g.quad('R', 0, 4.6, 5.0, 5.0, 9.0, M3); g.quad('R', 0, 4.6, 5.0, 13.4, 15.6, M3);   // มือจับ
    g.quad('R', 0, 1.0, 1.8, 6.6, 7.8, RED); g.quad('R', 0, 2.2, 3.0, 4.6, 5.4, WARM); // แม่เหล็ก
    g.box(1.2, 1.0, 17.8, 1.6, 1.6, 2.4, RED, RED, '#a82b2f');                        // กระป๋อง
    g.box(1.4, 3.0, 17.8, 1.6, 1.6, 2.4, WARM, WARM, '#c99a45');
  });

  def('pingpong_table', 1, function (g) {
    var T = ['#2f67b3', '#244f8a', '#1b3b68'];
    [[0.9, 0.9], [0.9, 17.9], [9.2, 0.9], [9.2, 17.9]].forEach(function (p) { g.box(p[0], p[1], 0, 0.9, 0.9, 8.4, M2, M2, M3); });
    g.box(0, 0, 8.4, 11, 19, 1.2, T[0], T[1], T[2]);
    var z = 9.6;
    g.tq(z, 0, 11, 0, 0.5, CREAM); g.tq(z, 0, 11, 18.5, 19, CREAM); g.tq(z, 0, 0.5, 0, 19, CREAM); g.tq(z, 10.5, 11, 0, 19, CREAM);
    g.tq(z, 0, 11, 9.25, 9.75, CREAM); g.tq(z, 5.25, 5.75, 0, 9.25, CREAM); g.tq(z, 5.25, 5.75, 9.75, 19, CREAM);
    g.box(-0.4, 9.2, 9.6, 11.8, 0.6, 2.6, '#cfd8e8', '#aab3c8', M2);                          // เน็ต
    g.box(-0.6, 8.9, 9.6, 0.6, 0.6, 3.0, M3, M3, M3); g.box(10.9, 8.9, 9.6, 0.6, 0.6, 3.0, M3, M3, M3);
    var p = g.P(3, 4, 9.6);
    g.cyl(p[0], p[1], 2.2, 0.6, RED, '#a82b2f', '#7d1f24'); g.rect(Math.floor(p[0]) + 2, Math.floor(p[1]) - 1, 3, 1, WOODD);   // ไม้
    g.set(p[0] + 8, p[1] - 3, CREAM); g.set(p[0] + 9, p[1] - 3, CREAM);                           // ลูก
  });

  def('snack_shelf', 1, function (g) {
    var B = 12, i;
    var items = [
      [RED, '#a82b2f', '#7d1f24'], [WARM, '#c99a45', '#8a6a2a'], [SCR, '#2f8d92', '#1d5d62'],
      [CREAM, CR2, CR3], [LEAFL, LEAF, LEAFD]
    ];
    g.box(3.0, 0, 0, 0.8, B, 21, WOODX, WOODX, WOODX);                         // แผ่นหลัง
    g.box(0, B - 0.8, 0, 3.8, 0.8, 21, WOOD, WOODD, WOODX);                    // แผ่นข้างขวา
    [0.5, 7.2, 13.9].forEach(function (z, zi) {
      g.box(0, 0, z, 3.8, B, 0.7, WOOD, WOODD, WOODX, { rim: WARM });
      for (i = 0; i < 4; i++) {
        var it = items[(i + zi * 2) % items.length], h = 3.4 + ((i * 3 + zi) % 3) * 0.9;
        g.box(0.6, 1.2 + i * 2.5, z + 0.7, 2.2, 2.0, h, it[0], it[1], it[2]);
      }
    });
    g.box(0, 0, 20.6, 3.8, B, 0.9, WOOD, WOODD, WOODX, { rim: WARM });
    g.box(0, 0, 0, 3.8, 0.8, 21.5, WOOD, WOODD, WOODX);                         // แผ่นข้างซ้าย (ใกล้กล้อง)
  });

  /* ================= ชั้น 4 : ห้องนอน ================= */

  def('bed_single', 1, function (g) {
    var BL = ['#6a5aa8', '#4e4286', '#3b3270'];
    g.box(0, 17, 0.8, 9, 1.1, 11.5, WOOD, WOODD, WOODX, { rim: WARM });                          // หัวเตียง
    g.box(0, 0, 0.8, 9, 18, 3.0, WOOD, WOODD, WOODX);                                           // โครง
    [[0.3, 0.3], [0.3, 17.1], [8.1, 0.3], [8.1, 17.1]].forEach(function (p) { g.box(p[0], p[1], 0, 0.7, 0.7, 0.9, WOODX, WOODX, WOODX); });
    g.box(0.4, 0.4, 3.8, 8.2, 16.8, 1.6, CREAM, CR2, CR3);                                       // ที่นอน
    g.box(0.2, 0.2, 4.6, 8.6, 11.8, 1.6, BL[0], BL[1], BL[2]);                                   // ผ้าห่ม
    g.tq(6.2, 0.2, 8.8, 10.4, 12.0, CREAM);                                                      // ขอบผ้าปู
    g.box(0.9, 14.0, 5.4, 7.2, 3.0, 1.8, CREAM, CR2, CR3);                                       // หมอน
    g.box(0, 0, 0.8, 9, 0.9, 6.0, WOOD, WOODD, WOODX, { rim: WARM });                           // ปลายเตียง
  });

  function glow(g, xc, yc, rx, ry, c) {                 // แสงเรืองแบบ dither (ชั้น fx)
    g.fx = true;
    for (var y = Math.floor(yc - ry); y <= Math.ceil(yc + ry); y++) for (var x = Math.floor(xc - rx); x <= Math.ceil(xc + rx); x++) {
      var dx = (x + 0.5 - xc) / rx, dy = (y + 0.5 - yc) / ry;
      if (dx * dx + dy * dy <= 1 && (x + y) % 2 === 0) { g.fx = false; var occ = g.get(x, y); g.fx = true; if (!occ) g.set(x, y, c); }
    }
    g.fx = false;
  }

  def('nightstand_lamp', 2, function (g, f) {
    var on = f === 0;
    g.box(0, 0, 0, 4.6, 4.6, 8, WOOD, WOODD, WOODX, { rim: WARM });
    g.quad('R', 0, 0.5, 4.1, 4.2, 7.3, WOODX); g.quad('R', 0, 0.8, 3.8, 4.5, 7.0, WOODD); g.quad('R', 0, 1.7, 2.9, 5.3, 5.9, WARM);
    g.quad('R', 0, 0.5, 4.1, 0.8, 3.9, WOODX); g.quad('R', 0, 0.8, 3.8, 1.1, 3.6, WOODD); g.quad('R', 0, 1.7, 2.9, 1.9, 2.5, WARM);
    g.quad('L', 0, 0.7, 3.9, 0.9, 7.1, WOODX);
    var c = g.P(2.3, 2.3, 8), x = c[0], y = c[1];
    g.cyl(x, y, 2.2, 1.2, M1, M2, M3);                                                           // ฐานโคม
    g.cyl(x, y - 1.2, 0.7, 4.2, M1, M2, M3);
    var A = on ? WARM : CR3, Bc = on ? '#e0aa4e' : '#6f685c', i, dx;
    for (i = 0; i <= 6; i++) {                                                                   // ฝาโคม (กรวยตัด)
      var rx = 4.2 - i * 0.28, yy = y - 5.2 - i;
      g.ell(x, yy, rx, rx / 2, A);
    }
    for (i = 0; i <= 6; i++) {
      var rx2 = 4.2 - i * 0.28, yy2 = y - 5.2 - i;
      for (dx = 0; dx <= rx2; dx++) for (var dy = -rx2 / 2 - 1; dy <= rx2 / 2 + 1; dy++) {
        var px_ = Math.floor(x + dx), py_ = Math.floor(yy2 + dy);
        if (g.get(px_, py_) === A && dx > rx2 * 0.35 && i < 6) g.set(px_, py_, Bc);
      }
    }
    g.ell(x, y - 11.2, 2.2, 1.1, on ? CREAM : '#b8b0a0');
    if (on) { glow(g, x, y - 8.5, 8, 6.5, WARM); glow(g, x, y - 1, 6, 3, WARM); }
  });

  def('wardrobe', 1, function (g) {
    var B = 11;
    g.box(0, 0, 0.8, 5.5, B, 28, WOOD, WOODD, WOODX);
    g.box(-0.3, -0.3, 28.4, 6.1, B + 0.6, 1.4, WOOD, WOODD, WOODX, { rim: WARM });               // บัว
    g.box(-0.2, -0.2, 0, 5.9, B + 0.4, 0.9, WOODX, WOODX, WOODX);                                // ฐาน
    [0.6, 5.7].forEach(function (v) {
      g.quad('R', 0, v, v + 4.7, 2.2, 27, WOODD);
      g.quad('R', 0, v + 0.8, v + 3.9, 3.0, 12.6, WOODX); g.quad('R', 0, v + 0.8, v + 3.9, 15.2, 25.8, WOODX);
      g.quad('R', 0, v + 1.0, v + 3.7, 3.4, 12.2, WOODD); g.quad('R', 0, v + 1.0, v + 3.7, 15.6, 25.4, WOODD);
    });
    g.quad('R', 0, 4.7, 5.1, 12.4, 16.6, WARM); g.quad('R', 0, 5.9, 6.3, 12.4, 16.6, WARM);
    g.quad('L', 0, 0.8, 4.7, 3.0, 26.4, WOODD); g.quad('L', 0, 1.2, 4.3, 3.6, 25.8, WOOD);
  });

  def('window_frame', 3, function (g, f) {
    var B = 10.4, sk = [['#5aa9d6', '#a9dcf0'], ['#7a3f78', '#f2a05a'], [SKY, '#2a2a52']][f];
    g.box(0, 0, 0, 0.9, B, 23, '#fff6e6', CR2, CREAM);
    g.quad('R', 0, 0.9, B / 2 - 0.35, 1.8, 11.0, sk[1]); g.quad('R', 0, B / 2 + 0.35, B - 0.9, 1.8, 11.0, sk[1]);
    g.quad('R', 0, 0.9, B / 2 - 0.35, 11.7, 21.6, sk[0]); g.quad('R', 0, B / 2 + 0.35, B - 0.9, 11.7, 21.6, sk[0]);
    if (f === 0) {
      g.pimg('R', 0, 1.1, 16.4, ['.XXX.', 'XXXXX'], { X: CREAM }); g.pimg('R', 0, 6.4, 8.8, ['..XX.', '.XXXX'], { X: CREAM });
    } else if (f === 1) {
      g.pimg('R', 0, 1.2, 6.8, ['..XXXX..', '.XXXXXX.'], { X: WARM });
      g.pimg('R', 0, 6.2, 17.0, ['.XXX.'], { X: '#c0526a' });
    } else {
      g.pimg('R', 0, 1.2, 19.5, ['X.....X.', '.....X..', '..X.....'], { X: WARM });
      g.pimg('R', 0, 6.6, 17.5, ['.XX.', 'XXX.', 'XXXX', '.XX.'].map(function (r) { return r; }), { X: CREAM });
      g.pimg('R', 0, 8.4, 9.5, ['X...X', '..X..'], { X: WARM });
    }
    [0.9, B / 2 + 0.35].forEach(function (v) { g.pline('R', 0, v + 0.6, 2.4, v + 1.8, 9.6, '#ffffff'); });
    g.box(-0.9, -0.5, 0, 1.9, B + 1.0, 1.1, '#fff6e6', CR2, CREAM);                              // ขอบหน้าต่างล่าง
  });

  def('rug_small', 1, function (g) {
    var A = 10, B = 14, D = '#a82b2f';
    g.box(0, 0, 0, A, B, 0.6, D, '#7d1f24', '#7d1f24');
    g.tq(0.6, 0.7, A - 0.7, 0.7, B - 0.7, CREAM);
    g.tq(0.6, 1.3, A - 1.3, 1.3, B - 1.3, RED);
    g.tq(0.6, 3.0, A - 3.0, 4.0, B - 4.0, '#7d1f24');
    g.tq(0.6, 3.6, A - 3.6, 4.6, B - 4.6, WARM);
    g.tq(0.6, 4.4, A - 4.4, 5.6, B - 5.6, RED);
  });

  /* ================= ชั้น 5 : Izakaya ================= */

  function bandStrip(g, x, y, rx, z0, z1, c) {
    var ry = rx / 2;
    for (var i = Math.floor(x - rx); i < Math.ceil(x + rx); i++) {
      var dx = i + 0.5 - x; if (Math.abs(dx) > rx) continue;
      var t = ry * Math.sqrt(1 - (dx / rx) * (dx / rx));
      for (var j = Math.floor(y - z1 + t + 0.5); j < Math.floor(y - z0 + t + 0.5); j++) g.set(i, j, c);
    }
  }
  def('beer_keg', 1, function (g) {
    var c = g.P(3, 3, 0), x = c[0], y = c[1];
    g.cyl(x, y, 6, 13, M1, M2, M3, { hl: CREAM });
    bandStrip(g, x, y, 6, 1.5, 3.0, M3); bandStrip(g, x, y, 6, 10.0, 11.5, M3);
    bandStrip(g, x, y, 6, 4.8, 8.2, RED);
    bandStrip(g, x, y, 6, 5.8, 6.4, CREAM);
    g.ell(x, y - 13, 3.4, 1.7, M3); g.ell(x, y - 13, 2.2, 1.1, M1);
    g.cyl(x, y - 13.5, 1.1, 1.8, M2, M2, M3);
  });

  function bottle(g, u, v, z, col, label) {
    var p = g.P(u, v, z), x = p[0], y = p[1];
    g.cyl(x, y, 1.9, 5, col[0], col[0], col[1]);
    g.cyl(x, y - 5, 0.9, 2.8, col[0], col[0], col[1]);
    g.rect(Math.floor(x) - 1, Math.floor(y) - 8, 2, 1, WARM);
    if (label) g.rect(Math.floor(x) - 1, Math.floor(y) - 3, 3, 2, label);
  }
  def('bottle_shelf', 1, function (g) {
    var B = 15, GRN = [LEAF, LEAFD], AMB = [WOOD, WOODD], CLR = [SCR, '#2f8d92'], RDB = [RED, '#a82b2f'], CRM = [CREAM, CR2];
    g.box(2.2, 0, 0, 0.7, B, 27, WOODX, WOODX, WOODX);
    [0, 9, 18].forEach(function (z) { g.box(0, 0, z, 2.9, B, 0.8, WOOD, WOODD, WOODX, { rim: WARM }); });
    g.box(0, 0, 26.2, 2.9, B, 0.8, WOOD, WOODD, WOODX, { rim: WARM });
    var s1 = [GRN, AMB, CLR, GRN, RDB, AMB], s2 = [CLR, GRN, AMB, CRM, GRN, RDB], i;
    for (i = 5; i >= 0; i--) bottle(g, 1.2, 1.6 + i * 2.2, 0.8, s1[i], i % 2 ? CREAM : null);
    for (i = 5; i >= 0; i--) bottle(g, 1.2, 1.6 + i * 2.2, 9.8, s2[i], i % 3 === 0 ? CREAM : null);
    for (i = 4; i >= 0; i--) {
      var p = g.P(1.3, 2.2 + i * 2.7, 18.8);
      g.cyl(p[0], p[1], 2.2, 2.6, i % 2 ? CREAM : WARM, i % 2 ? CR2 : '#c99a45', i % 2 ? CR3 : '#8a6a2a');
    }
  });

  def('izakaya_counter', 2, function (g, f) {
    var B = 22, v;
    g.box(0, 0, 0, 6, B, 11, WOODD, WOODD, WOODX);
    for (v = 0.6; v < B - 0.5; v += 1.5) g.quad('R', 0, v, v + 0.7, 1.2, 10.2, WOODD);          // ซี่ไม้ (koushi)
    g.quad('R', 0, 0, B, 5.4, 6.0, WOODD);
    g.quad('R', 0, 0, B, 0, 1, K);
    g.box(-0.8, -0.5, 11, 7.4, B + 1, 1.6, WOOD, WOODD, WOODX, { rim: WARM });
    // เตาย่าง
    g.box(1.4, 3, 12.6, 3.8, 8.6, 3.0, M3, WALL2, SKY);
    g.tq(15.6, 1.9, 4.7, 3.5, 11.1, f ? '#a82b2f' : RED);
    for (var i = 0; i < 6; i++) { var cp = g.P(2.2 + (i % 3) * 0.9, 4 + i * 1.3, 15.6); g.set(cp[0], cp[1] - 1, (i + f) % 2 ? WARM : '#f06a60'); }
    for (i = 0; i < 5; i++) {                                                                  // ไม้เสียบ
      var p1 = g.P(0.9, 4.3 + i * 1.6, 16.2), p2 = g.P(5.6, 4.3 + i * 1.6, 16.2);
      g.line(p1[0], p1[1], p2[0], p2[1], CREAM);
      var m1 = g.P(2.3, 4.3 + i * 1.6, 16.3), m2 = g.P(4.3, 4.3 + i * 1.6, 16.3);
      g.line(m1[0], m1[1] - 1, m2[0], m2[1] - 1, i % 2 ? WOOD : WOODD);
    }
    // ขวด ถ้วย จาน ด้านขวา
    var tk = g.P(2.8, 14.4, 12.6); g.cyl(tk[0], tk[1], 2.4, 3.6, CREAM, CR2, CR3); g.cyl(tk[0], tk[1] - 3.6, 1.0, 1.8, CREAM, CR2, CR3);
    bottle(g, 2.8, 17.2, 12.6, [LEAF, LEAFD], CREAM);
    var cu = g.P(2.0, 19.6, 12.6); g.cyl(cu[0], cu[1], 1.4, 1.6, WARM, '#c99a45', '#8a6a2a');
    g.box(3.6, 20.6, 12.6, 1.6, 1.6, 0.5, CREAM, CR2, CR3);
    g.fx = true;                                                                               // ควัน
    var sp = g.P(3.3, 7.4, 17), sx = Math.floor(sp[0]), sy = Math.floor(sp[1]);
    var wisps = f === 0 ? [[0, -1, CREAM], [1, -3, CR2], [-1, -5, CREAM], [0, -8, CR2], [-2, -11, CR3]] : [[1, -1, CR2], [0, -3, CREAM], [1, -6, CR2], [-1, -9, CREAM], [0, -12, CR3]];
    wisps.forEach(function (w) { g.set(sx + w[0] - 3, sy + w[1], w[2]); g.set(sx + w[0] + 3, sy + w[1] - 1, w[2]); g.set(sx + w[0], sy + w[1] - 1, w[2]); });
    g.fx = false;
  });

  def('lantern_red', 2, function (g, f) {
    var x = Math.floor(g.cx), y = g.by, o = f ? 1 : 0, D = '#a82b2f', L = '#f06a60';
    g.rect(x, y - 27, 1, 6, WOODX);
    g.set(x + o, y - 22, WOODX);
    g.rect(x - 2 + o, y - 21, 5, 2, WALL2); g.set(x - 1 + o, y - 21, M3);
    g.ell(x + 0.5 + o, y - 12.5, 6, 6.8, RED);
    var i, j;
    for (j = y - 20; j < y - 5; j++) for (i = x + o + 1; i < x + o + 8; i++) if (g.get(i, j) === RED && i > x + o + 2.2 - (Math.abs(j - (y - 12.5)) > 5 ? 3 : 0)) g.set(i, j, D);
    g.ell(x - 2 + o, y - 15, 1.2, 3, L);
    [-4.5, -1, 2.5].forEach(function (dy) { for (i = x - 7 + o; i < x + 8 + o; i++) if (g.get(i, y - 12 + dy) === RED || g.get(i, y - 12 + dy) === D) g.set(i, y - 12 + dy, '#7d1f24'); });
    g.rect(x - 1 + o, y - 14, 3, 1, WARM); g.rect(x + o, y - 13, 1, 3, WARM); g.rect(x - 1 + o, y - 11, 3, 1, WARM);
    g.rect(x - 2 + o, y - 6, 5, 2, WALL2);
    g.rect(x + o, y - 4, 1, 3, WARM); g.set(x - 1 + o * 2, y - 2, WARM); g.set(x + 1 + o * 2, y - 2, WARM); g.set(x + o * 2, y - 1, WARM);
  });

  var KJ = {
    ju: ['.XXXXXXXX', '.X......X', '.XXXXXXXX', '.X...X...', '.XXXXXXXX', 'X....X...', 'X..XXXXX.', 'X..X...X.', 'X..X...X.', 'X..XXXXX.'],
    shu: ['X..XXXXXX', '.X..X..X.', '...XXXXXX', 'X..X.XX.X', '.X.XXXXXX', 'X..X.XX.X', '.X.XXXXXX', '...X....X', '...XXXXXX', '.........'],
    oku: ['.XXXXXXXX', '.X......X', '.XXXXXXXX', '.X.XXXXXX', '.X..X.X..', 'X...XXXX.', '....X....', '..XXXXXXX', '....X....', '..XXXXXXX']
  };
  def('banner_red', 2, function (g, f) {
    var C = 15, rows = [], r, c, DK = '#a82b2f', rw;
    function blank(ch) { var s = ''; for (var i = 0; i < C; i++) s += ch; return s.split(''); }
    for (r = 0; r < 46; r++) { rw = blank('r'); rw[0] = 'c'; rw[C - 1] = 'c'; rows.push(rw); }
    rows[0] = blank('d'); rows[1] = blank('d'); rows[44] = blank('d'); rows[43] = blank('d');
    [KJ.ju, KJ.shu, KJ.oku].forEach(function (gl, gi) {
      var r0 = 4 + gi * 12;
      for (r = 0; r < gl.length; r++) for (c = 0; c < 9; c++) if (gl[r][c] === 'X') rows[r0 + r][3 + c] = 'c';
    });
    [[5, 45], [9, 45], [5, 44], [9, 44], [4, 45], [6, 45], [8, 45], [10, 45]].forEach(function (p) { rows[p[1]][p[0]] = '.'; });
    [4, 5, 6, 8, 9, 10].forEach(function (cc) { rows[45][cc] = '.'; });
    rows[45] = rows[45].map(function (ch, i) { return (i >= 4 && i <= 10) ? '.' : ch; });
    var t = new Grid();
    t.pimg('R', 0.3, 0.1, 46, rows.map(function (q) { return q.join(''); }), { r: RED, c: CREAM, d: DK });
    // โยกเอียงตามระยะจากคาน
    var sh = new Array(GH).fill(0), top = Infinity, bot = -1, y, x;
    for (y = 0; y < GH; y++) for (x = 0; x < GW; x++) if (t.m[y * GW + x]) { top = Math.min(top, y); bot = Math.max(bot, y); }
    for (y = top; y <= bot; y++) {
      var fr = (y - top) / (bot - top);
      sh[y] = f === 0 ? -Math.round(fr * 1.2) : Math.round(fr * 1.8);
    }
    for (y = top; y <= bot; y++) for (x = 0; x < GW; x++) { var cv = t.m[y * GW + x]; if (cv) g.m[y * GW + x + sh[y]] = cv; }
    var tp = g.P(0.3, 0.1, 46);
    g.box(-0.3, -0.9, 46, 1.0, 9.0, 1.3, WOOD, WOODD, WOODX);                                     // คานแขวน
    g.ell(g.P(0.2, -0.9, 46.6)[0], g.P(0.2, -0.9, 46.6)[1], 1.5, 1.5, WARM);
    g.ell(g.P(0.2, 8.1, 46.6)[0], g.P(0.2, 8.1, 46.6)[1], 1.5, 1.5, WARM);
  });

  def('stool', 1, function (g) {
    [[2.0, 2.0], [2.0, 0.2], [0.2, 2.0], [0.2, 0.2]].forEach(function (p) { g.box(p[0], p[1], 0, 0.6, 0.6, 6.4, WOOD, WOODD, WOODX); });
    g.box(0.2, 0.2, 2.6, 2.4, 0.4, 0.4, WOODD, WOODD, WOODX);
    var c = g.P(1.3, 1.3, 6.4);
    g.cyl(c[0], c[1], 5, 1.8, RED, '#a82b2f', '#7d1f24', { rim: '#f06a60' });
  });

  def('grill_smoke', 3, function (g, f) {
    var x0 = Math.floor(g.cx), yb = g.by;
    for (var t = 0; t < 30; t++) {
      var w = 1.5 + t * 0.15, cxm = x0 + Math.sin(t * 0.3 - f * 2.094) * (0.6 + t * 0.09);
      var col = t < 10 ? CREAM : (t < 20 ? CR2 : CR3), y = yb - t;
      var dens = t < 3 ? 3 : t < 6 ? 2 : t < 17 ? 1 : t < 25 ? 2 : 3;     // 1 = เต็ม, 2 = checker, 3 = เบาบาง
      for (var i = Math.floor(cxm - w); i <= Math.ceil(cxm + w); i++) {
        var dx = Math.abs(i + 0.5 - cxm);
        if (dx > w) continue;
        var edge = dx > w - 1.4, ok;
        if (dens === 1) ok = !edge || (i + y + f) % 2 === 0;
        else if (dens === 2) ok = (i + y + f) % 2 === 0;
        else ok = (i + 2 * y + f) % 3 === 0;
        if (ok) g.set(i, y, col);
      }
    }
  }, { noOutline: true });

  /* ================= นอกอาคาร ================= */

  var BOTTLE = ['..XX..', '..XX..', '.XXXX.', 'XXXXXX', 'XXXXXX', 'XXXXXX', 'XXXXXX', '.XXXX.'];
  def('lawson_sign', 2, function (g, f) {
    var lit = f === 1, B = 20.5;
    var P = lit ? ['#7ab4ff', '#2d6fd0', '#3d8aef'] : ['#3d82dc', '#154a96', '#1f66c2'];
    g.box(0, 0, 0, 1.6, B, 10.4, P[0], P[1], P[2]);
    var W = lit ? '#ffffff' : CREAM;
    g.quad('R', 0, 0, B, 0, 0.8, W); g.quad('R', 0, 0, B, 9.6, 10.4, W);
    g.quad('R', 0, 0, 0.5, 0, 10.4, W); g.quad('R', 0, B - 0.5, B, 0, 10.4, W);
    g.pimg('R', 0, 1.0, 9.2, BOTTLE, { X: W });
    g.stext(0, 4.6, 7.4, 'LAWSON', W);
    g.quad('R', 0, 4.6, 4.6 + 13, 1.2, 1.7, RED);
    if (lit) {
      g.fx = true;
      for (var i = 0; i < 10; i++) {
        var p = g.P(0, 1 + i * 2, 11.4);
        g.set(p[0], p[1] - 1 - (i % 2), i % 2 ? CREAM : '#ffffff');
      }
      g.fx = false;
    }
  });

  def('vending_machine', 2, function (g, f) {
    var B = 6.6, can = [CREAM, SCR, WARM, LEAFL, CREAM, SCR];
    g.box(0, 0, 0.6, 4.6, B, 25, '#f06a60', '#a82b2f', RED);
    g.box(0.4, 0.4, 0, 0.8, 0.8, 0.7, K, K, K); g.box(0.4, B - 1.2, 0, 0.8, 0.8, 0.7, K, K, K);
    g.quad('R', 0, 0.4, B - 0.4, 21.6, 24.4, f ? WARM : CREAM);
    g.quad('R', 0, 0.5, 4.2, 9.0, 20.8, M3);
    g.quad('R', 0, 0.8, 3.9, 9.4, 20.4, SKY);
    [10.0, 13.8, 17.4].forEach(function (z, zi) {
      for (var i = 0; i < 4; i++) {
        g.quad('R', 0, 0.9 + i * 0.7, 1.35 + i * 0.7, z, z + 2.6, can[(i + zi * 2) % can.length]);
        g.quad('R', 0, 0.9 + i * 0.7, 1.35 + i * 0.7, z + 2.6, z + 3.1, i % 2 ? '#a82b2f' : CREAM);
      }
    });
    g.quad('R', 0, 4.5, 6.1, 9.0, 20.8, M3);
    g.quad('R', 0, 4.8, 5.8, 18.0, 19.6, f ? LEAFL : LEAFD);
    [[4.8, 14.8], [5.4, 14.8], [4.8, 12.6], [5.4, 12.6]].forEach(function (p, i) { g.quad('R', 0, p[0], p[0] + 0.45, p[1], p[1] + 1.2, i < 2 ? WARM : CREAM); });
    g.quad('R', 0, 4.8, 5.8, 10.0, 11.0, SKY);
    g.quad('R', 0, 0.6, 4.2, 1.8, 6.4, SKY); g.quad('R', 0, 0.9, 3.9, 2.0, 2.8, M3);
    g.quad('L', 0, 0.8, 3.8, 10.0, 19.6, CREAM); g.quad('L', 0, 1.2, 3.4, 11.4, 18.2, RED);
    g.quad('L', 0, 1.8, 2.8, 12.6, 17.0, CREAM);
  });

  def('bicycle', 1, function (g) {
    // วาดมุมข้าง (ไม่เฉียง) เพื่อให้อ่านออกว่าเป็นจักรยาน — พื้นที่ล้อ 2 วง + เฟรม + แฮนด์ + ตะกร้า
    var x0 = Math.floor(g.cx) - 13, yb = g.by - 1;         // ซ้ายล่างของ sprite
    function W(cx) { g.ring(x0 + cx, yb - 6, 6, 6, M2, 1.4); g.set(x0 + cx - 1, yb - 7, WARM); g.set(x0 + cx, yb - 6, WARM); }
    function L(ax, ay, bx, by_, c) { g.line(x0 + ax, yb - ay, x0 + bx, yb - by_, c); g.line(x0 + ax + 1, yb - ay, x0 + bx + 1, yb - by_, c); }
    // ตะกร้า
    g.rect(x0 + 22, yb - 17, 6, 4, WOODD); g.rect(x0 + 23, yb - 16, 4, 2, WOOD); g.rect(x0 + 24, yb - 16, 1, 2, WOODD);
    W(6); W(22);
    L(6, 6, 12, 4, RED); L(6, 6, 9, 14, RED); L(12, 4, 9, 14, RED);          // ท้าย-ล่าง, ท้าย-เบาะ, ท่อนั่ง
    L(12, 4, 20, 14, '#a82b2f'); L(9, 14, 20, 14, RED);                        // ท่อล่าง, ท่อบน
    L(20, 14, 22, 6, M1);                                                       // โช๊คหน้า
    g.line(x0 + 7, yb - 16, x0 + 12, yb - 16, K); g.line(x0 + 7, yb - 17, x0 + 11, yb - 17, K);   // เบาะ
    g.line(x0 + 9, yb - 15, x0 + 9, yb - 14, M3);
    g.line(x0 + 20, yb - 15, x0 + 20, yb - 17, M3); g.line(x0 + 19, yb - 18, x0 + 23, yb - 17, K); // แฮนด์
    g.line(x0 + 12, yb - 3, x0 + 14, yb - 1, M3);                               // บันได
  });

  def('snow_pile', 1, function (g) {
    var x = Math.floor(g.cx), y = g.by - 1, SH = '#cfd8ea', SD = '#9fb0d0', W = '#f4f8ff';
    g.ell(x, y - 1, 10, 3.6, SD);
    g.ell(x - 1, y - 3, 8.6, 4.4, SH);
    g.ell(x + 5, y - 2.6, 5, 3, SH);
    g.ell(x - 1.5, y - 4.4, 7.4, 3.6, W);
    g.ell(x + 4.6, y - 3.8, 4.2, 2.2, W);
    g.rect(x - 6, y - 2, 4, 1, SH); g.rect(x + 2, y - 1, 5, 1, SD);
    g.set(x - 3, y - 7, CREAM); g.set(x + 2, y - 6, CREAM);
  });

  /*__SPRITES__*/

  /* ---------- ส่งออก ---------- */
  window.SPR_ITEMS = OUT;
  window.SPR_ITEMS_QC = QC;
})();
