# Pianora — Kế hoạch xây dựng app học piano "Zero to Hero"

## Context
Thư mục `/Users/thanh.dinh3/Projects/pianora` đang trống, ta xây mới từ đầu. Mục tiêu là một web app (PWA) dạy piano cho người chưa biết gì cho đến khi tự đàn được hầu hết các bài: đi từ lý thuyết đến thực hành, đàn 88 phím, chấm điểm theo thời gian thực qua đàn MIDI (USB/Bluetooth). Giao diện song ngữ Việt/Anh. UI/UX theo skill **ui-ux-pro-max** (nextlevelbuilder).

Các quyết định người dùng đã chốt:
- Nền tảng: web app dạng PWA.
- Đầu vào: đàn MIDI. Đàn ảo 88 phím vẫn hiển thị để minh hoạ, và dùng được chuột/bàn phím máy tính làm phương án dự phòng.
- Stack: **chỉ Next.js** ở giai đoạn này. Chưa dựng NestJS và Postgres (lý do ở mục 2.0). Hướng mở rộng sau này là NestJS + Postgres.
- Ngôn ngữ: i18n, tiếng Việt mặc định, có English.

---

## 1. Nghiên cứu thị trường → Pianora lấy gì

| App | Điểm mạnh nên học | Điểm yếu cần tránh |
|---|---|---|
| Simply Piano | Onboarding cực nhanh, gamification, bài pop | Lý thuyết nông, ít chú trọng đọc nốt thật |
| Flowkey | **Wait Mode** (chờ người học bấm đúng nốt), video tay kèm sheet, lặp đoạn | Giáo trình kém hệ thống |
| Skoove | Lộ trình có cấu trúc, phản hồi AI, dạy đọc sheet | Ít bài, gamification yếu |
| Yousician | Tự điều chỉnh độ khó, động lực theo dạng game | Chủ yếu chơi theo nốt rơi, đọc nhạc kém |
| Playground Sessions | Phản hồi MIDI chi tiết (đúng/sớm/trễ), thống kê | UI cũ |
| Piano Marvel | **Bài test đọc nốt tại chỗ (SASR)**, thư viện kỹ thuật lớn | UX khó dùng |
| Synthesia | Nốt rơi trực quan | Khiến người học phụ thuộc, không bao giờ đọc được sheet |
| Pianote / Hoffman | Video kỹ thuật, tư thế, dạy theo kiểu sư phạm | Không chấm điểm tương tác |

**Khác biệt của Pianora:**
1. **Nốt rơi giảm dần (Fading falling notes)**: cấp thấp hiển thị nốt rơi kèm sheet, lên cấp thì nốt rơi mờ dần rồi tắt hẳn, để người học buộc phải đọc khuông nhạc.
2. **Lý thuyết đi kèm thực hành ở mọi bài**, không tách thành khoá học riêng.
3. **Tay trái được đầu tư ngang tay phải**, có bài tập riêng cho tay trái ở mọi cấp.
4. **Chấm điểm chi tiết**: cao độ, timing (sớm/trễ tính bằng ms), lực bấm (velocity), độ đều của ngón, kèm heatmap phím hay sai.
5. **Ôn tập ngắt quãng (spaced repetition)** cho đọc nốt, hợp âm và quãng.
6. **Chế độ luyện tập kiểu Flowkey**: Wait mode, lặp đoạn A–B, kéo tempo 40–120%, tách tay trái/phải, metronome.
7. **Checkpoint test cuối mỗi cấp**, đạt mới mở cấp tiếp (lấy ý tưởng từ SASR).

---

## 2. Kiến trúc kỹ thuật

### 2.0 Có cần backend và database không? → **Chưa cần**

| Chức năng | Chạy ở đâu | Cần server? |
|---|---|---|
| Nhận MIDI, phát âm thanh, render khuông nhạc, nốt rơi | Trình duyệt (Web MIDI, Web Audio) | Không. Bắt buộc phải chạy ở client vì cần độ trễ thấp |
| Chấm điểm cao độ và timing | Trình duyệt (music-core) | Không |
| Nội dung giáo trình, bài nhạc | File JSON/MusicXML tĩnh, đóng gói cùng app | Không |
| Sample piano | File tĩnh, service worker cache lại | Không (CDN hoặc static hosting là đủ) |
| Tiến độ, XP, streak, SRS, lịch sử tập | IndexedDB (Dexie) trên máy | Không |
| Sao lưu và chuyển máy | Xuất/nhập file JSON | Không |
| **Tài khoản, đồng bộ nhiều thiết bị** | — | **Có** |
| **Bảng xếp hạng, social, giáo viên theo dõi học viên** | — | **Có** |
| **Thanh toán / premium, cập nhật nội dung không cần deploy** | — | **Có** |

Toàn bộ trải nghiệm học cốt lõi chạy được 100% ở client. Backend chỉ cần cho các tính năng tài khoản, xã hội và thương mại, mà những tính năng đó chưa nằm trong phạm vi hiện tại. Một app học piano offline-first còn có lợi thêm: tập được khi không có mạng và không tốn chi phí server.

**Quyết định:**
- Chỉ dùng Next.js. Deploy tĩnh lên Vercel hoặc `output: 'export'`.
- Mọi truy cập dữ liệu đi qua interface `ProgressRepository`. Bản cài đặt hiện tại là `IndexedDbProgressRepository`.
- Khi cần tài khoản hay đồng bộ thì chỉ thêm `ApiProgressRepository`, gọi tới NestJS + Postgres (hoặc dùng Next.js Route Handlers + Postgres nếu nhu cầu nhỏ). UI và engine không phải sửa.
- Schema dữ liệu local thiết kế sẵn để migrate thẳng lên Postgres: dùng UUID, `updatedAt` và cách giải quyết xung đột last-write-wins.

### 2.1 Cấu trúc dự án (một app Next.js)
```
pianora/
├─ src/
│  ├─ app/[locale]/        App Router: dashboard, path (lộ trình), lesson/[id], practice, tools, profile
│  ├─ components/          ui/ (shadcn), piano/ (Keyboard88, FallingNotes), notation/ (Staff, Score), lesson/
│  ├─ lib/
│  │  ├─ music-core/       Thuần TS: Note, Interval, Scale, Chord, Key, MIDI↔note, scoring (kèm unit test)
│  │  ├─ audio/            Tone.js sampler, metronome, transport
│  │  ├─ midi/             Web MIDI adapter, keyboard/mouse fallback, latency calibration
│  │  ├─ storage/          ProgressRepository + Dexie implementation, export/import JSON
│  │  └─ gamification/     XP, streak, badge, SRS (thuật toán SM-2)
│  ├─ content/curriculum/  Bài học dạng typed JSON + MusicXML (vi/en), validate bằng zod
│  ├─ stores/              Zustand
│  └─ i18n/messages/       vi.json, en.json (next-intl)
├─ public/samples/         Salamander piano (mp3/ogg)
├─ design-system/pianora/MASTER.md   (sinh từ ui-ux-pro-max)
└─ docs/  GUIDELINES.md, CURRICULUM.md, PRACTICE-NOTES.md
```

**Frontend**
- Âm thanh: **Tone.js** + sample piano Salamander Grand (88 phím, có nhiều mức velocity), load dần (lazy) theo dải phím.
- MIDI: **Web MIDI API** (Chrome/Edge/Opera). Safari và Firefox không hỗ trợ đầy đủ nên hiện banner hướng dẫn và cho dùng đàn ảo hoặc bàn phím máy tính.
- Khuông nhạc: **VexFlow** cho bài tập sinh động (động), **OpenSheetMusicDisplay** cho bài nhạc MusicXML.
- Đàn ảo 88 phím (A0–C8): SVG/Canvas, highlight nốt cần bấm và nốt đã bấm (đúng/sai), hiện số ngón, tô màu theo tay (trái/phải), zoom theo dải phím.
- Nốt rơi: Canvas 2D (requestAnimationFrame) đồng bộ với Tone.Transport.
- State: Zustand. Lưu dữ liệu: IndexedDB (Dexie) qua `ProgressRepository`.
- Kiến trúc màn hình chính: Dashboard (streak, mục tiêu hôm nay, tiếp tục bài) → Lộ trình (skill tree theo cấp) → Lesson Player → Practice Room (thư viện bài nhạc) → Tools (metronome, tra hợp âm/scale, luyện đọc nốt) → Profile/Stats.

**Practice/Scoring engine (src/lib/music-core)**
- Input: luồng `NoteOn/NoteOff {midi, velocity, timestamp}`, so khớp với chuỗi nốt kỳ vọng.
- Cửa sổ timing: Perfect ≤ ±50ms, Good ≤ ±120ms, Late/Early ≤ ±250ms, ngoài khoảng đó là Miss. Có bù latency hiệu chỉnh theo từng thiết bị (calibration).
- Hợp âm: các nốt cùng onset được nhóm trong cửa sổ 80ms.
- Chỉ số: độ chính xác cao độ, độ chính xác nhịp, độ đều velocity, tốc độ đạt được, các nốt hay sai.
- Chế độ: Wait / Play-along / Performance (không gợi ý) / Sight-reading (bài sinh ngẫu nhiên).

**Dữ liệu local (Dexie tables)**: `profile`, `lessonProgress`, `attempts` (score, accuracy, timingStats), `skillMastery`, `srsCards`, `streak`, `badges`, `settings` (MIDI device, latency offset, locale, theme). Bảng nào cũng có `id` (UUID) và `updatedAt` để sau này đồng bộ lên server.

**Khi nào mới thêm backend (để sau):** khi cần tài khoản/đồng bộ, bảng xếp hạng, giáo viên quản lý lớp hoặc thanh toán. Khi đó dựng NestJS + Prisma + Postgres với các module auth / progress / practice / gamification, rồi thêm `ApiProgressRepository`.

**UI/UX theo ui-ux-pro-max**
1. `npx ui-ux-pro-max-cli init --ai claude` (cài skill vào `.claude/skills/`).
2. `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "music education piano learning gamified app" --design-system --persist -p "Pianora"`, rồi tạo override cho từng trang (`--page lesson-player`, `practice-room`, `dashboard`).
3. Tra thêm: `--domain ux "keyboard navigation focus"`, `--stack nextjs`, `--domain typography`.
4. Áp dụng checklist của skill: icon SVG (Lucide, không dùng emoji), focus state rõ ràng, `prefers-reduced-motion`, dark mode (mặc định tối để ít chói khi tập), responsive ở 375/768/1024/1440. Ưu tiên tablet nằm ngang và desktop để đàn ảo đủ rộng.

---

## 3. Giáo trình "Zero to Hero" (11 cấp)

Mỗi cấp gồm nhiều Unit. Mỗi Unit có 5 loại bài: **Lý thuyết** (tương tác), **Drill** (đọc nốt, gõ nhịp, nghe), **Kỹ thuật** (luyện ngón), **Bài nhạc**, **Checkpoint**.

| Cấp | Chủ đề | Nội dung chính | Mục tiêu đo được (để mở cấp tiếp) |
|---|---|---|---|
| 0. Làm quen | Tư thế & bàn phím | Cách ngồi, độ cao ghế, cổ tay, dáng tay "cầm quả bóng", số ngón 1–5, bản đồ 88 phím (A0–C8), nhóm 2 và 3 phím đen, Đô giữa (C4), quãng tám | Tìm đúng mọi phím C/F trên 88 phím trong 30s; gọi tên 7 nốt trắng với độ chính xác ≥ 95% |
| 1. Nhịp cơ bản | Phách & trường độ | Phách, nốt tròn/trắng/đen, dấu lặng, 4/4, đếm to, metronome; thế tay Đô (C position) tay phải rồi tay trái | Gõ nhịp đúng ≥ 90% ở 80 BPM; đàn 5 nốt C–G mỗi tay đều, đúng số ngón |
| 2. Khuông nhạc | Đọc nốt | Khoá Sol, khoá Fa, khuông đôi (grand staff), nốt mốc (C4, G4, F3, C5, C3), bậc liền/bậc nhảy, quãng 2–5 | Đọc 20 nốt khoá Sol + 20 nốt khoá Fa trong 60s, chính xác ≥ 90% |
| 3. Hai tay | Phối hợp | Hai tay luân phiên rồi cùng lúc, 3/4, nốt trắng chấm dôi, dấu nối, cường độ p/f, legato | Bài 8 ô nhịp hai tay, điểm ≥ 85% ở tempo gốc |
| 4. Mở thế tay | Di chuyển | Thế Sol/Fa, luồn ngón cái (thumb-under), vắt ngón, gam Đô trưởng 1 quãng tám, nốt móc đơn, dấu thăng/giáng/bình, hoá biểu G và F | Gam C, G, F 1 quãng tám, hai tay riêng, 80 BPM nốt đen, đúng ngón |
| 5. Hợp âm | Hợp âm ba | Cấu tạo hợp âm trưởng/thứ, I–IV–V ở C/G/F, hợp âm khối và rải, đệm tay trái (rải, Alberti), ký hiệu hợp âm | Nhận diện và đàn 12 hợp âm trưởng + thứ cơ bản trong 2s mỗi hợp âm |
| 6. Chuyển hợp âm | Đảo phối & chuyển | Thể đảo 1 và 2, voice leading (di chuyển ngón tối thiểu), vòng pop I–V–vi–IV, đàn từ lead sheet, gam 2 quãng tám, nhịp đảo phách, 6/8 | Chuyển vòng C–G–Am–F liền mạch ở 90 BPM, dùng thể đảo, không ngắt nhịp |
| 7. Kỹ thuật | Độc lập ngón & pedal | Hanon 1–10, Czerny cơ bản, hợp âm rải, pedal vang (pedal legato), staccato/legato, 12 gam trưởng, gam thứ tự nhiên/hoà thanh | 12 gam trưởng 2 quãng tám hai tay ở 100 BPM nốt móc đơn; pedal sạch, không lẫn tiếng |
| 8. Trung cấp | Hoà âm & đọc thị tấu | Hợp âm 7, ii–V–I, móc kép, chùm ba, mọi hoá biểu, đọc thị tấu hằng ngày; Bach Minuet in G, Für Elise (phần A) | Sight-reading cấp 3 (theo thang Pianora) ≥ 80%; hoàn thành 3 bài repertoire ≥ 85% |
| 9. Nâng cao | Phong cách & ứng tấu | Chuyển giọng, hợp âm mở rộng (9, 11, sus), ngẫu hứng trên gam ngũ cung/blues, kiểu đệm ballad/waltz/bossa, đa nhịp 2:3, nốt hoa mỹ | Tự đệm một lead sheet lạ theo 2 phong cách; dịch giọng bài đơn giản sang 2 giọng khác |
| 10. Hero | Biểu diễn | Repertoire: Chopin Prelude Op.28 No.4, Nocturne Op.9 No.2, Clair de Lune (rút gọn), bản phối pop; đàn theo tai (nghe → tìm hợp âm); Performance mode | Hoàn thành bài cấp 10 ở Performance mode ≥ 90%; đàn theo tai giai điệu 8 ô nhịp |

**Track song song (mở dần theo cấp):** Luyện tai (quãng, hợp âm trưởng/thứ, nhịp), Lý thuyết sâu (vòng quãng năm, chức năng hoà âm), Daily Warm-up 5 phút (ngón độc lập, tay trái).

**Nguồn bài nhạc:** chỉ dùng tác phẩm public domain (Bach, Mozart, Beethoven, Chopin, Debussy, dân ca VN) và bản phối gốc của Pianora. Không đưa bài có bản quyền khi chưa có license.

---

## 4. Guideline & lưu ý sư phạm (hiển thị trong app và `docs/PRACTICE-NOTES.md`)
- Tập **15–30 phút mỗi ngày** hiệu quả hơn tập dồn 3 giờ một lần. App nhắc thời gian và gợi ý nghỉ sau 25 phút.
- **Chậm trước, nhanh sau**: tập ở 60% tempo, đạt ≥ 90% điểm thì app tự tăng tempo 5–10%.
- **Tay riêng → tay chung**: mỗi bài mới bắt buộc qua bước tay phải, rồi tay trái, rồi hai tay.
- **Thả lỏng**: vai hạ, cổ tay ngang phím, không gồng. Đau thì dừng (hiện cảnh báo chấn thương).
- **Đúng số ngón ngay từ đầu.** Bài có ghi số ngón, và ở cấp thấp app nhắc khi người học bỏ qua số ngón.
- **Không phụ thuộc nốt rơi**: nốt rơi chỉ là bánh xe phụ, sẽ tự tắt dần theo cấp.
- **Đếm to và dùng metronome** cho mọi bài có nhịp mới.
- **Ghi âm, nghe lại**: Performance mode lưu file MIDI và cho phát lại.
- **Ôn tập**: mỗi ngày dành 5 phút ôn thẻ SRS (đọc nốt, hợp âm).

---

## 5. Gamification & động lực
XP cho mỗi bài, sao (1–3) theo điểm, streak hằng ngày (có "streak freeze"), mục tiêu ngày (phút tập hoặc số bài), badge (VD: "Tay trái thép", "12 gam trưởng"), skill tree mở khoá dần, thống kê tiến bộ (chart độ chính xác và tempo theo thời gian).

---

## 6. Lộ trình triển khai

1. **Foundation**: tạo Next.js 15 (TS, Tailwind, shadcn/ui), next-intl vi/en, cài ui-ux-pro-max và sinh `MASTER.md`, design tokens, layout chính, dark/light mode.
2. **Music core**: `src/lib/music-core` (note/interval/scale/chord/key, MIDI mapping) kèm unit test (Vitest); đàn ảo 88 phím; Tone.js sampler; kết nối Web MIDI và calibration latency; metronome.
3. **Notation + Practice engine**: render VexFlow/OSMD, nốt rơi, scoring engine, các chế độ Wait/Play-along/Performance, lặp A–B, kéo tempo, tách tay.
4. **Lesson Player + nội dung Cấp 0–3**: schema bài học (zod) trong `src/content/curriculum`, các loại bài (theory/drill/technique/song/checkpoint), drill đọc nốt và gõ nhịp.
5. **Tiến độ & động lực**: Dexie + `ProgressRepository`, XP, streak, badge, SRS, trang thống kê, xuất/nhập JSON.
6. **Nội dung Cấp 4–10**, luyện tai, sight-reading sinh bài tự động, thư viện bài nhạc, PWA (service worker, cache sample), polish UX theo checklist của skill.
7. **Docs**: `docs/GUIDELINES.md` (guideline sản phẩm + mục tiêu), `docs/CURRICULUM.md` (giáo trình chi tiết), `docs/PRACTICE-NOTES.md`.

Giai đoạn 1–5 tạo ra **MVP hoàn chỉnh** (Cấp 0–3, lưu tiến độ local). Giai đoạn 6 mở rộng nội dung. Backend chỉ thêm khi có nhu cầu tài khoản hoặc đồng bộ (xem 2.0).

---

## 7. Verification
- `pnpm test`: unit test cho music-core (dựng hợp âm, gam, MIDI↔tên nốt, chấm timing với timestamp giả lập).
- `pnpm build`: build phải sạch lỗi type và lint.
- `pnpm dev`: chạy app. Dùng Chrome DevTools MCP để mở app, chụp màn hình ở 375/768/1440, kiểm tra console sạch, chạy Lighthouse (PWA, a11y ≥ 90).
- Test MIDI: cắm đàn thật, hoặc giả lập bằng một mock MIDI input (inject NoteOn qua `evaluate_script`). Kiểm tra highlight phím, âm thanh, điểm và Wait mode.
- Chạy hết Cấp 0 từ đầu đến cuối: onboarding → bài lý thuyết → drill → checkpoint → mở Cấp 1. Reload trang và tắt mạng, kiểm tra tiến độ vẫn còn trong IndexedDB. Thử xuất/nhập JSON.
- Chuyển ngôn ngữ vi/en trên mọi màn hình.
