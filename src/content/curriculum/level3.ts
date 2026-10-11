import type { LevelInput } from "./schema";
import { line } from "./build";
import { odeToJoy } from "./songs";

// Hands take turns, one bar each.
const alternating = [
  ...line("R", [["C4", 1, 1], ["D4", 1, 2], ["E4", 1, 3], ["F4", 1, 4]]),
  ...line("L", [["G3", 1, 1], ["F3", 1, 2], ["E3", 1, 3], ["D3", 1, 4]], 4),
  ...line("R", [["G4", 1, 5], ["F4", 1, 4], ["E4", 1, 3], ["D4", 1, 2]], 8),
  ...line("L", [["C3", 4, 5]], 12),
];

// Parallel motion, both hands an octave apart.
const parallel = [
  ...line("R", [["C4", 1, 1], ["D4", 1, 2], ["E4", 1, 3], ["F4", 1, 4], ["G4", 2, 5], ["-", 2], ["G4", 1, 5], ["F4", 1, 4], ["E4", 1, 3], ["D4", 1, 2], ["C4", 4, 1]]),
  ...line("L", [["C3", 1, 5], ["D3", 1, 4], ["E3", 1, 3], ["F3", 1, 2], ["G3", 2, 1], ["-", 2], ["G3", 1, 1], ["F3", 1, 2], ["E3", 1, 3], ["D3", 1, 4], ["C3", 4, 5]]),
];

// Pianora original: 8-bar waltz in C position, melody over held bass notes.
const waltz = [
  ...line("R", [
    ["E4", 2, 3], ["F4", 1, 4], ["G4", 3, 5], ["F4", 2, 4], ["E4", 1, 3], ["D4", 3, 2],
    ["E4", 1, 3], ["D4", 1, 2], ["C4", 1, 1], ["D4", 2, 2], ["E4", 1, 3], ["D4", 3, 2], ["C4", 3, 1],
  ]),
  ...line("L", [["C3", 3, 5], ["E3", 3, 3], ["F3", 3, 2], ["G3", 3, 1], ["C3", 3, 5], ["G3", 3, 1], ["G3", 3, 1], ["C3", 3, 5]]),
];

export const level3: LevelInput = {
  level: 3,
  title: { vi: "Hai tay phối hợp", en: "Hands together" },
  goal: {
    vi: "Đàn một bài 8 ô nhịp bằng hai tay, đạt ≥ 85 điểm ở tempo gốc.",
    en: "Play an 8-bar piece hands together at full tempo with a score of ≥ 85.",
  },
  units: [
    {
      id: "l3-coordination",
      title: { vi: "Phối hợp hai tay", en: "Coordinating both hands" },
      lessons: [
        {
          id: "l3-alternating",
          kind: "technique",
          title: { vi: "Hai tay luân phiên", en: "Hands taking turns" },
          summary: { vi: "Một ô tay phải, một ô tay trái", en: "One bar right, one bar left" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "Từng tay một, nhưng không ngắt nhịp", en: "One hand at a time, without stopping" },
              body: [
                { vi: "Đặt cả hai tay ở thế tay Đô: tay phải từ C4, tay trái từ C3. Bài này hai tay thay phiên nhau mỗi ô nhịp — tay nghỉ vẫn giữ nguyên trên phím, sẵn sàng.", en: "Put both hands in C position: right hand from C4, left from C3. Here the hands alternate each bar — the resting hand stays on its keys, ready." },
              ],
              tips: [{ vi: "Luôn tập tay riêng trước, rồi mới hai tay.", en: "Always practise hands separately first, then together." }],
            },
            { type: "play", prompt: { vi: "Luân phiên (chế độ Chờ)", en: "Alternate (Wait mode)" }, score: { id: "l3-alt", bpm: 72, timeSignature: [4, 4], notes: alternating }, mode: "wait", pass: 70 },
            { type: "play", prompt: { vi: "Luân phiên theo nhịp", en: "Alternate in time" }, score: { id: "l3-alt-pa", bpm: 72, timeSignature: [4, 4], notes: alternating }, mode: "playalong", pass: 65 },
          ],
        },
        {
          id: "l3-together",
          kind: "technique",
          title: { vi: "Hai tay cùng lúc", en: "Both hands at once" },
          summary: { vi: "Chuyển động song song", en: "Parallel motion" },
          minutes: 6,
          steps: [
            {
              type: "theory",
              title: { vi: "Cùng đi lên, cùng đi xuống", en: "Up together, down together" },
              body: [
                { vi: "Hai tay đàn cùng tên nốt, cách nhau một quãng tám. Chú ý: tay phải dùng ngón 1→5, còn tay trái dùng ngón 5→1 — số ngón khác nhau dù nốt giống nhau.", en: "Both hands play the same note names an octave apart. Note: the right hand uses fingers 1→5 while the left uses 5→1 — different numbers for the same notes." },
                { vi: "Hãy tập thật chậm. Nếu bị rối, chỉnh tempo xuống 60% trong bảng điều khiển.", en: "Go very slowly. If it gets confusing, lower the tempo to 60% in the controls." },
              ],
              keyboard: { from: "C3", to: "C5", highlight: ["C3", "D3", "E3", "F3", "G3", "C4", "D4", "E4", "F4", "G4"], fingers: { C3: 5, D3: 4, E3: 3, F3: 2, G3: 1, C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 }, demo: [["C3", "C4"], ["D3", "D4"], ["E3", "E4"], ["F3", "F4"], ["G3", "G4"]] },
            },
            { type: "play", prompt: { vi: "Hai tay (chế độ Chờ)", en: "Hands together (Wait mode)" }, score: { id: "l3-par", bpm: 66, timeSignature: [4, 4], notes: parallel }, mode: "wait", pass: 70 },
            { type: "play", prompt: { vi: "Hai tay theo nhịp", en: "Hands together in time" }, score: { id: "l3-par-pa", bpm: 66, timeSignature: [4, 4], notes: parallel }, mode: "playalong", pass: 65 },
          ],
        },
        {
          id: "l3-ode",
          kind: "song",
          title: { vi: "Ode to Joy — hai tay", en: "Ode to Joy — hands together" },
          summary: { vi: "Giai điệu + bè trầm nốt tròn", en: "Melody over whole-note bass" },
          minutes: 8,
          steps: [
            {
              type: "theory",
              title: { vi: "Tay trái giữ nốt dài", en: "Left hand holds long notes" },
              body: [{ vi: "Tay trái chỉ đàn Đô và Sol thấp, mỗi nốt ngân cả ô nhịp, trong khi tay phải chơi giai điệu bạn đã biết. Tập tay trái riêng trước bằng nút chọn tay.", en: "The left hand plays only low C and G, holding each for a full bar, while the right hand plays the tune you know. Practise the left hand alone first with the hand selector." }],
            },
            { type: "play", prompt: { vi: "Hai tay (chế độ Chờ)", en: "Hands together (Wait mode)" }, score: { ...odeToJoy.score, id: "l3-ode" }, mode: "wait", pass: 75 },
            { type: "play", prompt: { vi: "Hai tay theo nhịp", en: "Hands together in time" }, score: { ...odeToJoy.score, id: "l3-ode-pa" }, mode: "playalong", pass: 70 },
          ],
        },
      ],
    },
    {
      id: "l3-expression",
      title: { vi: "Nhịp 3/4, cường độ & legato", en: "3/4, dynamics & legato" },
      lessons: [
        {
          id: "l3-three-four",
          kind: "theory",
          title: { vi: "Nhịp 3/4 và nốt chấm dôi", en: "3/4 time and dotted notes" },
          summary: { vi: "Một-hai-ba, một-hai-ba", en: "One-two-three, one-two-three" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "Nhịp valse", en: "Waltz time" },
              body: [
                { vi: "Nhịp 3/4 có 3 phách mỗi ô nhịp, phách 1 mạnh nhất: MỘT-hai-ba. Đây là nhịp của điệu valse.", en: "3/4 time has 3 beats per bar, with beat 1 strongest: ONE-two-three. It's the waltz rhythm." },
                { vi: "Dấu chấm sau nốt cộng thêm một nửa trường độ: nốt trắng chấm dôi = 2 + 1 = 3 phách, vừa đủ một ô 3/4. Dấu nối (đường cong nối hai nốt cùng cao độ) nghĩa là chỉ bấm một lần và giữ cho cả hai.", en: "A dot adds half the value: a dotted half = 2 + 1 = 3 beats, a full bar of 3/4. A tie (a curve joining two notes of the same pitch) means press once and hold through both." },
              ],
            },
            {
              type: "quiz",
              prompt: { vi: "Nốt trắng chấm dôi ngân mấy phách?", en: "How many beats does a dotted half note last?" },
              options: [{ vi: "2", en: "2" }, { vi: "2,5", en: "2.5" }, { vi: "3", en: "3" }],
              answer: 2,
            },
            { type: "rhythm", prompt: { vi: "Gõ nhịp 3/4", en: "Tap in 3/4" }, pattern: [1, 1, 1, 2, 1, 3, 1, 1, 1, 3], bpm: 84, timeSignature: [3, 4], pass: 0.75 },
          ],
        },
        {
          id: "l3-dynamics",
          kind: "theory",
          title: { vi: "Cường độ và legato", en: "Dynamics and legato" },
          summary: { vi: "p, mf, f và đàn liền tiếng", en: "p, mf, f and smooth playing" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "To, nhỏ và liền tiếng", en: "Loud, soft and connected" },
              body: [
                { vi: "Ký hiệu cường độ cho biết đàn to hay nhỏ: p (piano) = nhỏ, mf (mezzo forte) = vừa, f (forte) = to. Âm lượng đến từ tốc độ bấm phím và sức nặng của cánh tay, không phải từ việc gồng ngón.", en: "Dynamic marks say how loud to play: p (piano) = soft, mf (mezzo forte) = medium, f (forte) = loud. Volume comes from key speed and arm weight, not from squeezing your fingers." },
                { vi: "Legato nghĩa là liền tiếng: chỉ nhấc ngón trước lên đúng lúc ngón sau bấm xuống, không để khoảng trống. Trên bản nhạc, dấu luyến (đường cong trên nhiều nốt khác cao độ) báo hiệu đàn legato.", en: "Legato means smoothly connected: lift the previous finger exactly as the next one goes down, with no gap. A slur (a curve over several different notes) asks for legato." },
              ],
              tips: [{ vi: "Màn hình kết quả có chỉ số “Độ đều lực bấm” — hãy cố đạt trên 80%.", en: "The result screen shows “velocity evenness” — aim for above 80%." }],
              keyboard: { from: "C4", to: "C5", hand: "R", highlight: ["C4", "D4", "E4", "F4", "G4"], fingers: { C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 }, demo: ["C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4", "C4"] },
            },
            {
              type: "quiz",
              prompt: { vi: "Ký hiệu “p” nghĩa là gì?", en: "What does “p” mean?" },
              options: [{ vi: "Đàn nhỏ", en: "Play softly" }, { vi: "Đàn to", en: "Play loudly" }, { vi: "Nhấn pedal", en: "Press the pedal" }],
              answer: 0,
            },
            {
              type: "quiz",
              prompt: { vi: "Legato là gì?", en: "What is legato?" },
              options: [{ vi: "Đàn ngắt từng nốt", en: "Short, detached notes" }, { vi: "Đàn liền tiếng, không khoảng trống", en: "Smooth and connected, no gaps" }, { vi: "Đàn thật nhanh", en: "Very fast" }],
              answer: 1,
            },
          ],
        },
        {
          id: "l3-waltz",
          kind: "song",
          title: { vi: "Valse nhỏ ở thế tay Đô", en: "Little Waltz in C" },
          summary: { vi: "Bản gốc Pianora, 3/4, hai tay", en: "Pianora original, 3/4, hands together" },
          minutes: 8,
          steps: [
            {
              type: "theory",
              title: { vi: "Đếm “MỘT-hai-ba”", en: "Count “ONE-two-three”" },
              body: [{ vi: "Tay trái giữ một nốt trắng chấm dôi mỗi ô; tay phải hát giai điệu legato. Đàn phách 1 hơi nhấn để nghe ra nhịp valse.", en: "The left hand holds one dotted half per bar; the right hand sings a legato melody. Lean slightly into beat 1 to bring out the waltz feel." }],
            },
            { type: "play", prompt: { vi: "Hai tay (chế độ Chờ)", en: "Hands together (Wait mode)" }, score: { id: "l3-waltz", bpm: 96, timeSignature: [3, 4], notes: waltz }, mode: "wait", pass: 75 },
            { type: "play", prompt: { vi: "Hai tay theo nhịp", en: "Hands together in time" }, score: { id: "l3-waltz-pa", bpm: 96, timeSignature: [3, 4], notes: waltz }, mode: "playalong", pass: 70 },
          ],
        },
        {
          id: "l3-checkpoint",
          kind: "checkpoint",
          title: { vi: "Kiểm tra Cấp 3", en: "Level 3 checkpoint" },
          summary: { vi: "8 ô nhịp hai tay ở tempo gốc", en: "8 bars hands together at tempo" },
          minutes: 6,
          steps: [
            { type: "rhythm", prompt: { vi: "Tiết tấu 3/4", en: "A 3/4 rhythm" }, pattern: [2, 1, 3, 1, 1, 1, 3], bpm: 90, timeSignature: [3, 4], pass: 0.85 },
            { type: "play", prompt: { vi: "Ode to Joy hai tay, tempo gốc", en: "Ode to Joy hands together, full tempo" }, score: { ...odeToJoy.score, id: "l3-cp-ode" }, mode: "playalong", pass: 85 },
          ],
        },
      ],
    },
  ],
};
