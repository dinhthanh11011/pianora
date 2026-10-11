import type { LevelInput } from "./schema";
import { line } from "./build";

const WHITE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

export const level0: LevelInput = {
  level: 0,
  title: { vi: "Làm quen: tư thế & bàn phím", en: "Getting started: posture & keyboard" },
  goal: {
    vi: "Tìm mọi phím Đô/Fa trên 88 phím trong 30 giây; gọi tên 7 nốt trắng chính xác ≥ 95%.",
    en: "Find every C and F on all 88 keys within 30 s; name the 7 white notes with ≥ 95% accuracy.",
  },
  units: [
    {
      id: "l0-sitting",
      title: { vi: "Ngồi đúng, tay đúng", en: "Sitting and hand shape" },
      lessons: [
        {
          id: "l0-posture",
          kind: "theory",
          title: { vi: "Tư thế ngồi", en: "How to sit" },
          summary: { vi: "Ghế, khoảng cách và cổ tay", en: "Bench, distance and wrists" },
          minutes: 4,
          steps: [
            {
              type: "theory",
              title: { vi: "Ngồi thoải mái, lưng thẳng", en: "Sit tall and relaxed" },
              body: [
                {
                  vi: "Ngồi ở nửa trước của ghế, hai bàn chân đặt phẳng trên sàn. Lưng thẳng nhưng không gồng, vai thả lỏng.",
                  en: "Sit on the front half of the bench with both feet flat on the floor. Keep your back tall but not stiff, shoulders relaxed.",
                },
                {
                  vi: "Chỉnh ghế sao cho khi đặt tay lên phím, cẳng tay song song với mặt đất và khuỷu tay cao ngang hoặc hơi cao hơn phím.",
                  en: "Adjust the bench so that with your hands on the keys your forearms are level with the floor and elbows are at or slightly above key height.",
                },
                {
                  vi: "Ngồi giữa đàn, đối diện Đô giữa (C4). Khoảng cách vừa đủ để khuỷu tay hơi đưa ra trước thân người.",
                  en: "Sit at the centre of the piano, facing middle C (C4), close enough that your elbows are slightly in front of your body.",
                },
              ],
              tips: [
                { vi: "Nếu thấy đau vai, cổ tay hay ngón: dừng lại và nghỉ. Đàn không bao giờ được đau.", en: "If your shoulders, wrists or fingers hurt: stop and rest. Playing should never hurt." },
                { vi: "Tập 15–30 phút mỗi ngày tốt hơn nhiều so với 3 giờ một lần mỗi tuần.", en: "15–30 minutes every day beats three hours once a week." },
              ],
            },
            {
              type: "quiz",
              prompt: { vi: "Khi đặt tay lên phím, cẳng tay nên thế nào?", en: "With your hands on the keys, your forearms should be…" },
              options: [
                { vi: "Song song với mặt đất", en: "Level with the floor" },
                { vi: "Chúc xuống thật thấp", en: "Pointing steeply down" },
                { vi: "Hướng lên trên", en: "Pointing upwards" },
              ],
              answer: 0,
              explain: { vi: "Cẳng tay ngang giúp cổ tay không bị gập và ngón tay nhẹ nhàng hơn.", en: "Level forearms keep your wrists straight and fingers free." },
            },
          ],
        },
        {
          id: "l0-hand-shape",
          kind: "theory",
          title: { vi: "Dáng tay & số ngón", en: "Hand shape & finger numbers" },
          summary: { vi: "Tay “cầm quả bóng”, ngón 1–5", en: "“Holding a ball”, fingers 1–5" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "Tay như đang cầm quả bóng", en: "Hands like holding a ball" },
              body: [
                {
                  vi: "Thả tay xuôi theo người rồi đưa lên phím: các ngón sẽ tự cong tự nhiên như đang ôm một quả bóng nhỏ. Giữ dáng cong đó khi đàn.",
                  en: "Let your arms hang, then bring your hands up to the keys: your fingers curve naturally as if holding a small ball. Keep that curve while you play.",
                },
                {
                  vi: "Bấm bằng đầu ngón (phần thịt gần móng), không bấm bằng cả đốt ngón dẹt. Cổ tay ngang phím, không võng xuống, không nhô lên.",
                  en: "Play on your fingertips (the pad near the nail), not on flat fingers. Keep your wrists level with the keys — not sagging, not raised.",
                },
              ],
              tips: [{ vi: "Ngón cái chạm phím bằng cạnh ngoài, không phải bằng bụng ngón.", en: "The thumb plays on its outer edge, not its flat pad." }],
            },
            {
              type: "theory",
              title: { vi: "Số ngón tay 1–5", en: "Finger numbers 1–5" },
              body: [
                {
                  vi: "Ở cả hai tay, ngón cái là 1, ngón trỏ 2, ngón giữa 3, ngón áp út 4, ngón út 5. Bản nhạc ghi các số này phía trên hoặc dưới nốt.",
                  en: "On both hands the thumb is 1, index 2, middle 3, ring 4 and little finger 5. Sheet music prints these numbers above or below the notes.",
                },
                {
                  vi: "Đặt ngón 1 tay phải lên Đô giữa (C4) và mỗi ngón lên một phím trắng kế tiếp. Bấm thử từng ngón theo số trên bàn phím.",
                  en: "Place right-hand finger 1 on middle C (C4) and each finger on the next white key. Try pressing each finger as numbered on the keyboard.",
                },
              ],
              keyboard: {
                from: "C3", to: "C6", hand: "R",
                highlight: ["C4", "D4", "E4", "F4", "G4"],
                fingers: { C4: 1, D4: 2, E4: 3, F4: 4, G4: 5 },
                demo: ["C4", "D4", "E4", "F4", "G4"],
              },
            },
            {
              type: "quiz",
              prompt: { vi: "Ngón số 1 là ngón nào?", en: "Which finger is number 1?" },
              options: [
                { vi: "Ngón út", en: "Little finger" },
                { vi: "Ngón cái", en: "Thumb" },
                { vi: "Ngón trỏ", en: "Index finger" },
              ],
              answer: 1,
            },
            {
              type: "quiz",
              prompt: { vi: "Ở tay trái, ngón số 5 là ngón nào?", en: "On the left hand, finger 5 is…" },
              options: [
                { vi: "Ngón cái", en: "Thumb" },
                { vi: "Ngón giữa", en: "Middle finger" },
                { vi: "Ngón út", en: "Little finger" },
              ],
              answer: 2,
              explain: { vi: "Hai tay đánh số giống nhau: từ ngón cái (1) đến ngón út (5).", en: "Both hands are numbered the same way: thumb (1) to little finger (5)." },
            },
            {
              type: "play",
              prompt: { vi: "Bấm lần lượt ngón 1 → 5 rồi quay lại", en: "Play fingers 1 → 5 and back" },
              score: {
                id: "l0-fingers-rh", bpm: 60, timeSignature: [4, 4],
                notes: line("R", [["C4", 1, 1], ["D4", 1, 2], ["E4", 1, 3], ["F4", 1, 4], ["G4", 1, 5], ["F4", 1, 4], ["E4", 1, 3], ["D4", 1, 2], ["C4", 4, 1]]),
              },
              mode: "wait",
              pass: 60,
            },
          ],
        },
      ],
    },
    {
      id: "l0-map",
      title: { vi: "Bản đồ 88 phím", en: "The 88-key map" },
      lessons: [
        {
          id: "l0-black-keys",
          kind: "theory",
          title: { vi: "Nhóm phím đen", en: "Black-key groups" },
          summary: { vi: "Nhóm 2 và nhóm 3 phím đen", en: "Groups of two and three" },
          minutes: 4,
          steps: [
            {
              type: "theory",
              title: { vi: "88 phím, lặp lại một khuôn mẫu", en: "88 keys, one repeating pattern" },
              body: [
                {
                  vi: "Đàn piano có 88 phím: 52 phím trắng và 36 phím đen, từ La0 (A0) thấp nhất đến Đô8 (C8) cao nhất. Bên trái là âm trầm, bên phải là âm cao.",
                  en: "A piano has 88 keys: 52 white and 36 black, from A0 (lowest) to C8 (highest). Left is low, right is high.",
                },
                {
                  vi: "Phím đen xếp thành nhóm 2 phím và nhóm 3 phím xen kẽ nhau. Nhờ khuôn mẫu này ta tìm được mọi nốt mà không cần nhìn chữ.",
                  en: "Black keys come in alternating groups of two and three. This pattern lets you find any note without labels.",
                },
              ],
              keyboard: { from: "C3", to: "B4", highlight: ["C#3", "D#3", "C#4", "D#4"], labels: "none", demo: ["C#4", "D#4", "F#4", "G#4", "A#4"] },
            },
            {
              type: "quiz",
              prompt: { vi: "Đàn piano tiêu chuẩn có bao nhiêu phím?", en: "How many keys does a standard piano have?" },
              options: [{ vi: "61", en: "61" }, { vi: "76", en: "76" }, { vi: "88", en: "88" }, { vi: "100", en: "100" }],
              answer: 2,
            },
            {
              type: "quiz",
              prompt: { vi: "Các phím màu trên đàn thuộc nhóm mấy phím đen?", en: "The highlighted keys belong to which group?" },
              keyboard: { from: "C4", to: "B4", highlight: ["F#4", "G#4", "A#4"], labels: "none" },
              options: [{ vi: "Nhóm 2 phím đen", en: "Group of two" }, { vi: "Nhóm 3 phím đen", en: "Group of three" }],
              answer: 1,
            },
          ],
        },
        {
          id: "l0-find-c",
          kind: "drill",
          title: { vi: "Tìm Đô (C) và Đô giữa", en: "Find C and middle C" },
          summary: { vi: "Đô nằm ngay bên trái nhóm 2 phím đen", en: "C sits left of the two black keys" },
          minutes: 5,
          steps: [
            {
              type: "theory",
              title: { vi: "Đô ở bên trái nhóm 2 phím đen", en: "C is left of the two black keys" },
              body: [
                {
                  vi: "Phím trắng nằm ngay bên trái mỗi nhóm 2 phím đen là Đô (C). Trên 88 phím có 8 phím Đô.",
                  en: "The white key just left of every group of two black keys is C. There are 8 Cs on 88 keys.",
                },
                {
                  vi: "Đô gần giữa đàn nhất là Đô giữa, viết là C4. Đây là “ngôi nhà” của hai tay khi mới học.",
                  en: "The C nearest the middle is middle C, written C4. It is home base for both hands as a beginner.",
                },
              ],
              keyboard: { from: "C2", to: "C6", highlight: ["C2", "C3", "C4", "C5", "C6"], labels: "none", demo: ["C3", "C4", "C5"] },
            },
            {
              type: "findNote",
              prompt: { vi: "Bấm Đô giữa (C4)", en: "Press middle C (C4)" },
              targets: ["C4"], rounds: 3, from: "C2", to: "C6", pass: 0.6,
            },
            {
              type: "findNote",
              prompt: { vi: "Bấm hết mọi phím Đô trên 88 phím trong 30 giây", en: "Press every C on all 88 keys within 30 seconds" },
              targets: ["C"], rounds: 1, all: true, timeLimitSec: 30, pass: 0.5,
            },
          ],
        },
        {
          id: "l0-find-f",
          kind: "drill",
          title: { vi: "Tìm Fa (F)", en: "Find F" },
          summary: { vi: "Fa nằm ngay bên trái nhóm 3 phím đen", en: "F sits left of the three black keys" },
          minutes: 4,
          steps: [
            {
              type: "theory",
              title: { vi: "Fa ở bên trái nhóm 3 phím đen", en: "F is left of the three black keys" },
              body: [
                { vi: "Phím trắng ngay bên trái mỗi nhóm 3 phím đen là Fa (F). Đô và Fa là hai mốc giúp bạn định vị nhanh.", en: "The white key just left of every group of three black keys is F. C and F are your two quick landmarks." },
              ],
              keyboard: { from: "C3", to: "C5", highlight: ["F3", "F4"], labels: "none" },
            },
            {
              type: "findNote",
              prompt: { vi: "Bấm hết mọi phím Fa trong 30 giây", en: "Press every F within 30 seconds" },
              targets: ["F"], rounds: 1, all: true, timeLimitSec: 30, pass: 0.5,
            },
            {
              type: "findNote",
              prompt: { vi: "Đô hay Fa? Bấm phím được gọi tên (quãng tám nào cũng được)", en: "C or F? Press the named key (any octave)" },
              targets: ["C", "F"], rounds: 8, from: "C3", to: "C6", pass: 0.75,
            },
          ],
        },
        {
          id: "l0-white-keys",
          kind: "drill",
          title: { vi: "Bảy nốt trắng", en: "The seven white notes" },
          summary: { vi: "Đô Rê Mi Fa Sol La Si", en: "C D E F G A B" },
          minutes: 6,
          steps: [
            {
              type: "theory",
              title: { vi: "Đô Rê Mi Fa Sol La Si", en: "C D E F G A B" },
              body: [
                {
                  vi: "Bảy phím trắng mang tên Đô, Rê, Mi, Fa, Sol, La, Si — theo chữ cái là C, D, E, F, G, A, B. Hết Si lại về Đô, cao hơn một quãng tám.",
                  en: "The seven white keys are named C, D, E, F, G, A, B (Do, Re, Mi, Fa, Sol, La, Si). After B the pattern starts again on C, one octave higher.",
                },
                {
                  vi: "Số sau chữ cái là quãng tám: C4 là Đô giữa, C5 là Đô cao hơn một quãng tám.",
                  en: "The number after the letter is the octave: C4 is middle C, C5 is the C one octave higher.",
                },
              ],
              keyboard: { from: "C4", to: "C5", labels: "white", highlight: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"], demo: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"] },
            },
            {
              type: "findNote",
              prompt: { vi: "Bấm nốt được gọi tên", en: "Press the named note" },
              targets: WHITE_LETTERS, rounds: 14, from: "C3", to: "C6", pass: 0.85,
            },
          ],
        },
        {
          id: "l0-checkpoint",
          kind: "checkpoint",
          title: { vi: "Kiểm tra Cấp 0", en: "Level 0 checkpoint" },
          summary: { vi: "Tìm Đô/Fa và gọi tên nốt trắng", en: "Find C/F and name white notes" },
          minutes: 5,
          steps: [
            { type: "findNote", prompt: { vi: "Mọi phím Đô trong 30 giây", en: "Every C within 30 seconds" }, targets: ["C"], rounds: 1, all: true, timeLimitSec: 30, pass: 0.8 },
            { type: "findNote", prompt: { vi: "Mọi phím Fa trong 30 giây", en: "Every F within 30 seconds" }, targets: ["F"], rounds: 1, all: true, timeLimitSec: 30, pass: 0.8 },
            { type: "findNote", prompt: { vi: "Gọi tên 7 nốt trắng", en: "Name the 7 white notes" }, targets: WHITE_LETTERS, rounds: 20, from: "C3", to: "C6", pass: 0.95 },
            {
              type: "quiz",
              prompt: { vi: "Từ một nốt Đô đến nốt Đô kế tiếp bên phải gọi là gì?", en: "From one C to the next C on the right is called…" },
              options: [{ vi: "Một quãng tám", en: "An octave" }, { vi: "Một phách", en: "A beat" }, { vi: "Một ô nhịp", en: "A bar" }],
              answer: 0,
            },
          ],
        },
      ],
    },
  ],
};
