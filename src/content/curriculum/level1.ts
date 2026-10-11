import type { LevelInput } from "./schema";
import { line } from "./build";

const fiveFingerRH = line("R", [
  ["C4", 1, 1], ["D4", 1, 2], ["E4", 1, 3], ["F4", 1, 4], ["G4", 2, 5], ["-", 2],
  ["G4", 1, 5], ["F4", 1, 4], ["E4", 1, 3], ["D4", 1, 2], ["C4", 4, 1],
]);
const fiveFingerLH = line("L", [
  ["C3", 1, 5], ["D3", 1, 4], ["E3", 1, 3], ["F3", 1, 2], ["G3", 2, 1], ["-", 2],
  ["G3", 1, 1], ["F3", 1, 2], ["E3", 1, 3], ["D3", 1, 4], ["C3", 4, 5],
]);

// "Mary Had a Little Lamb" — traditional (public domain).
const mary = line("R", [
  ["E4", 1, 3], ["D4", 1, 2], ["C4", 1, 1], ["D4", 1, 2],
  ["E4", 1, 3], ["E4", 1, 3], ["E4", 2, 3],
  ["D4", 1, 2], ["D4", 1, 2], ["D4", 2, 2],
  ["E4", 1, 3], ["G4", 1, 5], ["G4", 2, 5],
  ["E4", 1, 3], ["D4", 1, 2], ["C4", 1, 1], ["D4", 1, 2],
  ["E4", 1, 3], ["E4", 1, 3], ["E4", 1, 3], ["E4", 1, 3],
  ["D4", 1, 2], ["D4", 1, 2], ["E4", 1, 3], ["D4", 1, 2],
  ["C4", 4, 1],
]);

export const level1: LevelInput = {
  level: 1,
  title: { vi: "Nhịp cơ bản & thế tay Đô", en: "Basic rhythm & C position" },
  goal: {
    vi: "Gõ nhịp đúng ≥ 90% ở 80 BPM; đàn 5 nốt Đô–Sol mỗi tay đều và đúng số ngón.",
    en: "Tap rhythms ≥ 90% accurate at 80 BPM; play C–G evenly with each hand using the right fingers.",
  },
  units: [
    {
      id: "l1-rhythm",
      title: { vi: "Phách & trường độ", en: "Pulse & note values" },
      lessons: [
        {
          id: "l1-pulse",
          kind: "theory",
          title: { vi: "Phách và tempo", en: "Beat and tempo" },
          summary: { vi: "Nhịp tim của âm nhạc", en: "The heartbeat of music" },
          minutes: 4,
          steps: [
            {
              type: "theory",
              title: { vi: "Phách là nhịp tim của bản nhạc", en: "The beat is the music's heartbeat" },
              body: [
                {
                  vi: "Phách (beat) là những nhịp đều đặn bạn có thể vỗ tay theo. Tempo là tốc độ của phách, đo bằng BPM — số phách mỗi phút. 60 BPM là một phách mỗi giây.",
                  en: "The beat is the steady pulse you can clap along to. Tempo is how fast it goes, measured in BPM — beats per minute. 60 BPM is one beat per second.",
                },
                {
                  vi: "Hãy luôn đếm to “1, 2, 3, 4” và dùng metronome khi học một nhịp mới.",
                  en: "Always count out loud “1, 2, 3, 4” and use a metronome when learning a new rhythm.",
                },
              ],
            },
            {
              type: "rhythm",
              prompt: { vi: "Gõ đều theo từng phách", en: "Tap steadily on every beat" },
              pattern: [1, 1, 1, 1, 1, 1, 1, 1], bpm: 70, pass: 0.7,
            },
          ],
        },
        {
          id: "l1-note-values",
          kind: "theory",
          title: { vi: "Nốt tròn, nốt trắng, nốt đen", en: "Whole, half and quarter notes" },
          summary: { vi: "Mỗi nốt ngân bao lâu", en: "How long each note lasts" },
          minutes: 6,
          steps: [
            {
              type: "theory",
              title: { vi: "Trường độ", en: "Note values" },
              body: [
                { vi: "Nốt đen (♩) ngân 1 phách. Nốt trắng (đầu rỗng, có đuôi) ngân 2 phách. Nốt tròn (đầu rỗng, không đuôi) ngân 4 phách.", en: "A quarter note (♩) lasts 1 beat. A half note (hollow head with a stem) lasts 2 beats. A whole note (hollow, no stem) lasts 4 beats." },
                { vi: "Khi gõ nốt trắng hay nốt tròn, bạn gõ một lần rồi giữ trong khi vẫn đếm thầm các phách còn lại.", en: "For half and whole notes you tap once and hold while silently counting the remaining beats." },
              ],
            },
            {
              type: "quiz",
              prompt: { vi: "Nốt trắng ngân mấy phách?", en: "How many beats does a half note last?" },
              options: [{ vi: "1", en: "1" }, { vi: "2", en: "2" }, { vi: "4", en: "4" }],
              answer: 1,
            },
            {
              type: "quiz",
              prompt: { vi: "Một nốt tròn bằng bao nhiêu nốt đen?", en: "A whole note equals how many quarter notes?" },
              options: [{ vi: "2", en: "2" }, { vi: "3", en: "3" }, { vi: "4", en: "4" }],
              answer: 2,
            },
            { type: "rhythm", prompt: { vi: "Nốt trắng và nốt đen", en: "Half and quarter notes" }, pattern: [2, 2, 1, 1, 2], bpm: 70, pass: 0.7 },
            { type: "rhythm", prompt: { vi: "Có cả nốt tròn", en: "With a whole note" }, pattern: [1, 1, 2, 4], bpm: 70, pass: 0.7 },
          ],
        },
        {
          id: "l1-rests",
          kind: "drill",
          title: { vi: "Dấu lặng và nhịp 4/4", en: "Rests and 4/4 time" },
          summary: { vi: "Im lặng cũng có trường độ", en: "Silence has length too" },
          minutes: 6,
          steps: [
            {
              type: "theory",
              title: { vi: "Dấu lặng & ô nhịp", en: "Rests & bars" },
              body: [
                { vi: "Dấu lặng là khoảng im lặng có độ dài: lặng đen 1 phách, lặng trắng 2 phách, lặng tròn cả ô nhịp. Khi gặp dấu lặng, không gõ nhưng vẫn đếm.", en: "A rest is a measured silence: a quarter rest lasts 1 beat, a half rest 2 beats, a whole rest the full bar. Don't tap on rests — but keep counting." },
                { vi: "Nhịp 4/4: mỗi ô nhịp có 4 phách, mỗi phách là một nốt đen. Vạch nhịp chia bản nhạc thành các ô.", en: "4/4 time: four beats per bar, each beat a quarter note. Bar lines divide the music into bars." },
              ],
            },
            {
              type: "quiz",
              prompt: { vi: "Nhịp 4/4 có mấy phách trong một ô nhịp?", en: "How many beats are in one bar of 4/4?" },
              options: [{ vi: "2", en: "2" }, { vi: "3", en: "3" }, { vi: "4", en: "4" }],
              answer: 2,
            },
            { type: "rhythm", prompt: { vi: "Gõ, nghỉ, gõ, nghỉ", en: "Tap, rest, tap, rest" }, pattern: [1, -1, 1, -1, 2, -2], bpm: 75, pass: 0.75 },
            { type: "rhythm", prompt: { vi: "Kết hợp", en: "Mix it up" }, pattern: [1, 1, 2, -1, 1, 2], bpm: 75, pass: 0.75 },
          ],
        },
      ],
    },
    {
      id: "l1-c-position",
      title: { vi: "Thế tay Đô", en: "C position" },
      lessons: [
        {
          id: "l1-c-position-rh",
          kind: "technique",
          title: { vi: "Thế tay Đô — tay phải", en: "C position — right hand" },
          summary: { vi: "Ngón 1 trên Đô giữa", en: "Thumb on middle C" },
          minutes: 6,
          steps: [
            {
              type: "theory",
              title: { vi: "Năm ngón, năm phím", en: "Five fingers, five keys" },
              body: [
                { vi: "Đặt ngón 1 tay phải lên Đô giữa (C4); các ngón 2, 3, 4, 5 lần lượt nằm trên Rê, Mi, Fa, Sol. Mỗi ngón “phụ trách” một phím, tay không cần di chuyển.", en: "Put right-hand finger 1 on middle C (C4); fingers 2, 3, 4, 5 rest on D, E, F, G. Each finger owns one key, so the hand doesn't move." },
                { vi: "Đàn chậm, đều tay, nghe xem các nốt có to đều nhau không.", en: "Play slowly and evenly, and listen whether every note is the same loudness." },
              ],
              keyboard: { from: "C3", to: "C6", hand: "R", highlight: ["C4", "D4", "E4", "F4", "G4"], fingers: { C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 }, demo: ["C4", "D4", "E4", "F4", "G4"] },
            },
            {
              type: "play",
              prompt: { vi: "Đô–Sol tay phải (chế độ Chờ)", en: "C–G right hand (Wait mode)" },
              score: { id: "l1-5f-rh", bpm: 72, timeSignature: [4, 4], notes: fiveFingerRH },
              mode: "wait", pass: 70,
            },
            {
              type: "play",
              prompt: { vi: "Giờ đàn theo nhịp", en: "Now play in time" },
              score: { id: "l1-5f-rh-pa", bpm: 72, timeSignature: [4, 4], notes: fiveFingerRH },
              mode: "playalong", pass: 60,
            },
          ],
        },
        {
          id: "l1-c-position-lh",
          kind: "technique",
          title: { vi: "Thế tay Đô — tay trái", en: "C position — left hand" },
          summary: { vi: "Ngón 5 trên Đô thấp", en: "Little finger on low C" },
          minutes: 6,
          steps: [
            {
              type: "theory",
              title: { vi: "Tay trái bắt đầu bằng ngón út", en: "The left hand starts with finger 5" },
              body: [
                { vi: "Tay trái đặt ngón 5 (út) lên Đô thấp (C3), ngón 4 trên Rê, 3 trên Mi, 2 trên Fa, ngón cái 1 trên Sol. Thứ tự ngón ngược với tay phải.", en: "Put left-hand finger 5 on low C (C3), 4 on D, 3 on E, 2 on F and thumb 1 on G. The finger order mirrors the right hand." },
              ],
              tips: [{ vi: "Ngón út và ngón áp út thường yếu — đừng để chúng xẹp xuống, giữ dáng tay cong.", en: "Fingers 4 and 5 are usually weak — don't let them collapse; keep the curved shape." }],
              keyboard: { from: "C2", to: "C5", hand: "L", highlight: ["C3", "D3", "E3", "F3", "G3"], fingers: { C3: 5, D3: 4, E3: 3, F3: 2, G3: 1 }, demo: ["C3", "D3", "E3", "F3", "G3"] },
            },
            {
              type: "play",
              prompt: { vi: "Đô–Sol tay trái (chế độ Chờ)", en: "C–G left hand (Wait mode)" },
              score: { id: "l1-5f-lh", bpm: 72, timeSignature: [4, 4], notes: fiveFingerLH },
              mode: "wait", pass: 70,
            },
            {
              type: "play",
              prompt: { vi: "Giờ đàn theo nhịp", en: "Now play in time" },
              score: { id: "l1-5f-lh-pa", bpm: 72, timeSignature: [4, 4], notes: fiveFingerLH },
              mode: "playalong", pass: 60,
            },
          ],
        },
        {
          id: "l1-mary",
          kind: "song",
          title: { vi: "Mary Had a Little Lamb", en: "Mary Had a Little Lamb" },
          summary: { vi: "Bài đầu tiên ở thế tay Đô", en: "Your first song in C position" },
          minutes: 6,
          steps: [
            {
              type: "theory",
              title: { vi: "Bài nhạc đầu tiên", en: "Your first song" },
              body: [{ vi: "Bài dân ca này chỉ dùng Đô, Rê, Mi và Sol ở tay phải. Nghe mẫu trước, sau đó đàn chế độ Chờ rồi theo nhịp.", en: "This folk song uses only C, D, E and G in the right hand. Listen first, then play in Wait mode, then in time." }],
              keyboard: { from: "C4", to: "C5", hand: "R", highlight: ["C4", "D4", "E4", "G4"], fingers: { C4: 1, D4: 2, E4: 3, G4: 5 }, demo: ["E4", "D4", "C4", "D4", "E4", "E4", "E4"] },
            },
            { type: "play", prompt: { vi: "Đàn chế độ Chờ", en: "Play in Wait mode" }, score: { id: "l1-mary", bpm: 90, timeSignature: [4, 4], notes: mary }, mode: "wait", pass: 70 },
            { type: "play", prompt: { vi: "Đàn theo nhịp", en: "Play in time" }, score: { id: "l1-mary-pa", bpm: 90, timeSignature: [4, 4], notes: mary }, mode: "playalong", pass: 65 },
          ],
        },
        {
          id: "l1-checkpoint",
          kind: "checkpoint",
          title: { vi: "Kiểm tra Cấp 1", en: "Level 1 checkpoint" },
          summary: { vi: "Nhịp ở 80 BPM, thế tay Đô hai tay", en: "Rhythm at 80 BPM, C position both hands" },
          minutes: 6,
          steps: [
            { type: "rhythm", prompt: { vi: "Gõ tiết tấu ở 80 BPM", en: "Tap the rhythm at 80 BPM" }, pattern: [1, 1, 2, 1, 1, 1, 1, 2, -1, 1, 4], bpm: 80, pass: 0.9 },
            { type: "play", prompt: { vi: "Tay phải Đô–Sol theo nhịp", en: "Right hand C–G in time" }, score: { id: "l1-cp-rh", bpm: 80, timeSignature: [4, 4], notes: fiveFingerRH }, mode: "playalong", pass: 75 },
            { type: "play", prompt: { vi: "Tay trái Đô–Sol theo nhịp", en: "Left hand C–G in time" }, score: { id: "l1-cp-lh", bpm: 80, timeSignature: [4, 4], notes: fiveFingerLH }, mode: "playalong", pass: 75 },
          ],
        },
      ],
    },
  ],
};
