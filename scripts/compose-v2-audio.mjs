import fs from "node:fs";
// Original instrumental loops; generated as build assets, never composed in the browser.
const tracks = [
  ["entry", 78, 0],
  ["ordinary", 82, 1],
  ["messages", 80, 2],
  ["tension", 78, 3],
  ...Array.from({ length: 12 }, (_, i) => [
    "type-" + String(i + 1).padStart(2, "0"),
    96 + (i % 4) * 3,
    4 + i,
  ]),
];
const rate = 16000,
  TAU = 2 * Math.PI;
fs.mkdirSync("frontend/audio", { recursive: true });
for (const [name, bpm, variant] of tracks) {
  const beat = 60 / bpm,
    length = beat * 32,
    n = Math.round(length * rate),
    pcm = Buffer.alloc(n * 2),
    minor = variant === 3,
    root = 48 + (variant % 4),
    chords = minor
      ? [
          [0, 3, 7, 10],
          [5, 8, 12, 15],
          [7, 10, 14, 17],
          [0, 3, 7, 10],
        ]
      : [
          [0, 4, 7, 11],
          [9, 12, 16, 19],
          [5, 9, 12, 16],
          [7, 11, 14, 17],
        ];
  let noiseSeed = 12345 + variant;
  const noise = () => {
    noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
    return (noiseSeed / 4294967296) * 2 - 1;
  };
  const freq = (m) => 440 * 2 ** ((m - 69) / 12);
  for (let i = 0; i < n; i++) {
    const time = i / rate,
      bar = Math.floor(time / (beat * 8)) % 4,
      phase = time % (beat * 2),
      bphase = time % beat,
      b = Math.floor(time / beat),
      chord = chords[bar];
    let value = 0;
    for (const note of chord) {
      const f = freq(root + note),
        env = Math.exp(-phase * 1.3);
      value +=
        (Math.sin(TAU * f * time) + 0.22 * Math.sin(TAU * f * 2 * time)) *
        env *
        0.045;
    }
    value +=
      Math.sin(TAU * freq(root + chord[0] - 12) * time) *
      Math.exp(-bphase * 3) *
      0.08;
    if (name === "ordinary" || variant >= 4) {
      const pluck = time % (beat / 2),
        f = freq(root + 12 + chord[b % 4]);
      value +=
        (Math.sin(TAU * f * pluck) +
          0.35 * Math.sin(TAU * f * 2 * pluck) +
          0.15 * Math.sin(TAU * f * 3 * pluck)) *
        Math.exp(-pluck * 12) *
        0.035;
    }
    if (name !== "entry") {
      value +=
        Math.sin(TAU * (50 + 90 * Math.exp(-bphase * 40)) * bphase) *
        Math.exp(-bphase * 32) *
        0.12;
      if (b % 4 === 2) value += noise() * Math.exp(-bphase * 40) * 0.035;
      value += noise() * Math.exp(-(time % (beat / 2)) * 110) * 0.012;
    }
    if (variant >= 4) {
      const p = time % (beat / 2),
        note = [0, 7, 11, 4, 9, 7, 4, 2][
          (Math.floor(time / (beat / 2)) + variant) % 8
        ];
      value +=
        Math.sin(TAU * freq(root + 12 + note) * time) *
        Math.exp(-p * 9) *
        0.055;
    }
    value += noise() * 0.0015;
    const fade = Math.min(1, time / 0.15, (length - time) / 0.15);
    pcm.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, value * fade)) * 32767),
      i * 2,
    );
  }
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(
    "frontend/audio/" + name + ".wav",
    Buffer.concat([header, pcm]),
  );
}
fs.writeFileSync(
  "frontend/audio/credits.json",
  JSON.stringify(
    {
      license:
        "Original synthesized composition for this project; no sampled commercial recordings.",
      tracks: tracks.map(([name, bpm]) => ({
        name,
        bpm,
        instruments:
          "Rhodes-like sine keys, bass, subdued procedural percussion; plucked guitar harmonics on ordinary and personality tracks",
        duration: Math.round((60 / bpm) * 32),
      })),
      cues: [
        { name: "notification", duration: 0.28 },
        { name: "typing", duration: 0.4 },
        { name: "select", duration: 0.12 },
        { name: "turn", duration: 0.3 },
        { name: "reveal", duration: 4.8 },
      ],
    },
    null,
    2,
  ),
);
console.log("16 original 18–25s instrumental loops composed.");
for (const [name, length] of [
  ["notification", 0.28],
  ["typing", 0.4],
  ["select", 0.12],
  ["turn", 0.3],
  ["reveal", 4.8],
]) {
  const samples = Math.round(length * rate),
    pcm = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const time = i / rate,
      phase = time % (name === "typing" ? 0.08 : 0.14),
      env = Math.exp(-phase * (name === "typing" ? 140 : 25));
    let sample =
      (name === "typing"
        ? Math.sin(TAU * 2300 * time) * 0.08
        : (Math.sin(TAU * (time < 0.14 ? 660 : 880) * time) +
            0.15 * Math.sin(TAU * 1320 * time)) *
          0.13) * env;
    if (name === "select") sample = Math.sin(TAU * (520 - time * 400) * time) * Math.exp(-time * 35) * .28;
    if (name === "turn") sample = (Math.sin(TAU * (260 + time * 750) * time) + .3 * Math.sin(TAU * 1700 * time)) * Math.sin(Math.PI * time / length) * .13;
    if (name === "reveal") {
      const rise = time < 3.4 ? Math.sin(TAU * (220 * time + 150 * time * time)) * Math.sin(Math.PI * time / 3.4) * .08 : 0;
      const chord = [523.25,659.25,783.99,1046.5].reduce((out,f,k) => {
        const phase = time - 3.4 - k * .045;
        return out + (phase < 0 ? 0 : Math.sin(TAU*f*phase) * Math.exp(-phase*3.2) * .12);
      },0);
      sample = (rise + chord) * Math.min(1,(length-time)/.12);
    }
    pcm.writeInt16LE(Math.round(sample * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(
    "frontend/audio/" + name + ".wav",
    Buffer.concat([header, pcm]),
  );
}
