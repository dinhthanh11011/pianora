import type { LevelInput } from "./schema";
import { odeToJoy } from "./songs";

const TREBLE = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"];
const BASS = ["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];
const odeRH = odeToJoy.score.notes.filter((n) => n.hand === "R");

export const level2: LevelInput = {
  level: 2,
  title: { vi: "Đọc khuông nhạc", en: "Reading the staff" },
  goal: {
    vi: "Đọc 20 nốt khoá Sol và 20 nốt khoá Fa, mỗi phần trong 60 giây, chính xác ≥ 90%.",
    en: "Read 20 treble and 20 bass notes, each set within 60 s, with ≥ 90% accuracy.",
  },
  units: [
    {
      id: "l2-clefs",
      title: { vi: "Khoá nhạc & nốt mốc", en: "Clefs & landmarks" },
      lessons: [
        {
          id: "l2-staff",
          kind: "theory",
          title: { vi: "Khuông nhạc, khoá Sol, khoá Fa", en: "Staff, treble and bass clef" },
          summary: { vi: "5 dòng, 4 khe và khuông đôi", en: "5 lines, 4 spaces and the grand staff" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "Khuông nhạc", en: "The staff" },
              body: [
                { vi: "Khuông nhạc có 5 dòng kẻ và 4 khe. Nốt nằm càng cao trên khuông thì âm càng cao. Đi từ dòng lên khe kế tiếp là lên một bậc (một phím trắng).", en: "A staff has 5 lines and 4 spaces. The higher a note sits, the higher it sounds. Moving from a line to the next space is one step (one white key)." },
                { vi: "Khoá Sol (𝄞) cuộn quanh dòng 2 — đó là Sol4 (G4). Khoá Fa (𝄢) có hai chấm kẹp dòng 4 — đó là Fa3 (F3).", en: "The treble clef (𝄞) curls around line 2 — that's G4. The bass clef (𝄢) has two dots around line 4 — that's F3." },
                { vi: "Piano dùng khuông đôi: khoá Sol ở trên (thường cho tay phải), khoá Fa ở dưới (thường cho tay trái). Đô giữa nằm trên một dòng kẻ phụ ngay giữa hai khuông.", en: "Piano uses the grand staff: treble on top (usually right hand), bass below (usually left hand). Middle C sits on a ledger line right between them." },
              ],
            },
            {
              type: "quiz",
              prompt: { vi: "Khoá Sol cuộn quanh dòng nào?", en: "Which line does the treble clef curl around?" },
              options: [{ vi: "Dòng 2 — nốt Sol", en: "Line 2 — G" }, { vi: "Dòng 4 — nốt Fa", en: "Line 4 — F" }, { vi: "Dòng 1 — nốt Mi", en: "Line 1 — E" }],
              answer: 0,
            },
            {
              type: "quiz",
              prompt: { vi: "Đô giữa (C4) nằm ở đâu trên khuông đôi?", en: "Where is middle C on the grand staff?" },
              options: [{ vi: "Dòng trên cùng khoá Sol", en: "Top line of the treble staff" }, { vi: "Dòng kẻ phụ giữa hai khuông", en: "A ledger line between the staves" }, { vi: "Khe dưới cùng khoá Fa", en: "Bottom space of the bass staff" }],
              answer: 1,
            },
          ],
        },
        {
          id: "l2-landmarks",
          kind: "drill",
          title: { vi: "Nốt mốc", en: "Landmark notes" },
          summary: { vi: "C3, F3, C4, G4, C5", en: "C3, F3, C4, G4, C5" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "Học thuộc vài nốt mốc", en: "Memorise a few landmarks" },
              body: [
                { vi: "Thay vì đếm từng dòng, hãy nhớ các nốt mốc rồi đếm bậc từ đó: Đô giữa (C4), Sol khoá Sol (G4), Đô cao (C5, khe 3 khoá Sol), Fa khoá Fa (F3) và Đô thấp (C3, khe 2 khoá Fa).", en: "Rather than counting every line, memorise landmarks and count steps from them: middle C (C4), treble G (G4), treble C (C5, space 3), bass F (F3) and bass C (C3, space 2)." },
              ],
              keyboard: { from: "C3", to: "C5", labels: "white", highlight: ["C3", "F3", "C4", "G4", "C5"], demo: ["C3", "F3", "C4", "G4", "C5"] },
            },
            { type: "readNote", prompt: { vi: "Gọi tên nốt mốc", en: "Name the landmark" }, pool: ["C3", "F3", "C4", "G4", "C5"], rounds: 10, pass: 0.8 },
          ],
        },
        {
          id: "l2-treble",
          kind: "drill",
          title: { vi: "Đọc nốt khoá Sol", en: "Treble clef reading" },
          summary: { vi: "Từ Đô giữa đến Sol5", en: "Middle C up to G5" },
          minutes: 6,
          steps: [
            { type: "readNote", prompt: { vi: "Gọi tên nốt khoá Sol", en: "Name the treble note" }, pool: TREBLE, rounds: 15, pass: 0.8 },
            { type: "readNote", prompt: { vi: "Giờ bấm đúng phím trên đàn", en: "Now press the exact key" }, pool: TREBLE.slice(0, 8), rounds: 8, answer: "key", pass: 0.75 },
          ],
        },
        {
          id: "l2-bass",
          kind: "drill",
          title: { vi: "Đọc nốt khoá Fa", en: "Bass clef reading" },
          summary: { vi: "Từ Đô2 đến Đô giữa", en: "C2 up to middle C" },
          minutes: 6,
          steps: [
            { type: "readNote", prompt: { vi: "Gọi tên nốt khoá Fa", en: "Name the bass note" }, pool: BASS, rounds: 15, pass: 0.8 },
            { type: "readNote", prompt: { vi: "Giờ bấm đúng phím trên đàn", en: "Now press the exact key" }, pool: BASS.slice(7), rounds: 8, answer: "key", pass: 0.75 },
          ],
        },
      ],
    },
    {
      id: "l2-intervals",
      title: { vi: "Bậc liền, bậc nhảy & quãng", en: "Steps, skips & intervals" },
      lessons: [
        {
          id: "l2-steps-skips",
          kind: "theory",
          title: { vi: "Bậc liền và bậc nhảy", en: "Steps and skips" },
          summary: { vi: "Đọc theo hướng đi của nốt", en: "Read the direction of notes" },
          minutes: 4,
          steps: [
            {
              type: "theory",
              title: { vi: "Đọc theo hình dáng", en: "Read the shape" },
              body: [
                { vi: "Bậc liền (step): từ dòng sang khe kế bên, hay sang phím trắng ngay cạnh — như Đô → Rê. Bậc nhảy (skip): từ dòng lên dòng (hoặc khe lên khe), bỏ qua một phím — như Đô → Mi.", en: "A step goes from a line to the next space — the very next white key, like C → D. A skip goes line to line (or space to space), skipping one key — like C → E." },
                { vi: "Người đọc nhạc giỏi không gọi tên từng nốt; họ nhìn hướng đi lên/xuống và khoảng cách.", en: "Good readers don't name every note; they see the direction and the distance." },
              ],
              keyboard: { from: "C4", to: "C5", labels: "white", highlight: ["C4", "D4", "E4"], demo: ["C4", "D4", "C4", "E4"] },
            },
            {
              type: "quiz",
              prompt: { vi: "Mi → Sol là bậc liền hay bậc nhảy?", en: "Is E → G a step or a skip?" },
              options: [{ vi: "Bậc liền", en: "Step" }, { vi: "Bậc nhảy", en: "Skip" }],
              answer: 1,
              explain: { vi: "Mi → Sol bỏ qua Fa, nên là bậc nhảy (quãng 3).", en: "E → G skips over F, so it's a skip (a 3rd)." },
            },
          ],
        },
        {
          id: "l2-intervals-25",
          kind: "theory",
          title: { vi: "Quãng 2 đến quãng 5", en: "Intervals: 2nd to 5th" },
          summary: { vi: "Đếm cả nốt đầu và nốt cuối", en: "Count both the first and last note" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "Đếm quãng", en: "Counting intervals" },
              body: [
                { vi: "Quãng là khoảng cách giữa hai nốt, tính bằng số tên nốt, đếm cả nốt đầu và nốt cuối. Đô → Rê là quãng 2; Đô → Mi là quãng 3; Đô → Fa là quãng 4; Đô → Sol là quãng 5.", en: "An interval is the distance between two notes, counted in letter names including both ends. C → D is a 2nd; C → E a 3rd; C → F a 4th; C → G a 5th." },
                { vi: "Trên khuông: quãng 3 và quãng 5 là dòng → dòng (hoặc khe → khe); quãng 2 và quãng 4 là dòng → khe.", en: "On the staff: 3rds and 5ths go line → line (or space → space); 2nds and 4ths go line → space." },
              ],
              keyboard: { from: "C4", to: "C5", labels: "white", highlight: ["C4", "G4"], demo: [["C4", "D4"], ["C4", "E4"], ["C4", "F4"], ["C4", "G4"]] },
            },
            {
              type: "quiz",
              prompt: { vi: "Đô → Sol là quãng mấy?", en: "C → G is a…" },
              options: [{ vi: "Quãng 3", en: "3rd" }, { vi: "Quãng 4", en: "4th" }, { vi: "Quãng 5", en: "5th" }],
              answer: 2,
            },
            {
              type: "quiz",
              prompt: { vi: "Rê → Fa là quãng mấy?", en: "D → F is a…" },
              options: [{ vi: "Quãng 2", en: "2nd" }, { vi: "Quãng 3", en: "3rd" }, { vi: "Quãng 4", en: "4th" }],
              answer: 1,
            },
            {
              type: "quiz",
              prompt: { vi: "Hai nốt trên khuông cùng nằm trên dòng kẻ, cách một dòng. Đó là quãng mấy?", en: "Two notes both on lines, one line apart. What interval?" },
              options: [{ vi: "Quãng 2", en: "2nd" }, { vi: "Quãng 3", en: "3rd" }, { vi: "Quãng 4", en: "4th" }],
              answer: 1,
            },
          ],
        },
        {
          id: "l2-ode-rh",
          kind: "song",
          title: { vi: "Ode to Joy — đọc từ khuông", en: "Ode to Joy — from the staff" },
          summary: { vi: "Beethoven, tay phải", en: "Beethoven, right hand" },
          minutes: 7,
          steps: [
            {
              type: "theory",
              title: { vi: "Đọc trước khi đàn", en: "Read before you play" },
              body: [{ vi: "Nhìn khuông nhạc: giai điệu đi chủ yếu bằng bậc liền, ở thế tay Đô. Tìm chỗ nốt đen chấm dôi (ngân 1,5 phách) ở ô 4 và ô 8.", en: "Look at the staff: the tune moves mostly by steps, in C position. Spot the dotted quarter (1½ beats) in bars 4 and 8." }],
              tips: [{ vi: "Thử tắt nốt rơi để tập nhìn khuông.", en: "Try turning falling notes off to practise reading." }],
            },
            { type: "play", prompt: { vi: "Đàn chế độ Chờ", en: "Play in Wait mode" }, score: { id: "l2-ode-rh", bpm: 90, timeSignature: [4, 4], notes: odeRH }, mode: "wait", pass: 75 },
            { type: "play", prompt: { vi: "Đàn theo nhịp", en: "Play in time" }, score: { id: "l2-ode-rh-pa", bpm: 90, timeSignature: [4, 4], notes: odeRH }, mode: "playalong", pass: 65 },
          ],
        },
        {
          id: "l2-checkpoint",
          kind: "checkpoint",
          title: { vi: "Kiểm tra Cấp 2", en: "Level 2 checkpoint" },
          summary: { vi: "20 nốt khoá Sol + 20 nốt khoá Fa", en: "20 treble + 20 bass notes" },
          minutes: 5,
          steps: [
            { type: "readNote", prompt: { vi: "20 nốt khoá Sol trong 60 giây", en: "20 treble notes in 60 seconds" }, pool: TREBLE, rounds: 20, timeLimitSec: 60, pass: 0.9 },
            { type: "readNote", prompt: { vi: "20 nốt khoá Fa trong 60 giây", en: "20 bass notes in 60 seconds" }, pool: BASS, rounds: 20, timeLimitSec: 60, pass: 0.9 },
          ],
        },
      ],
    },
  ],
};
