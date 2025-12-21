// =====================
// DOM（最初に定義する）
// =====================
const palette = document.getElementById("chord-palette");
const progressionDiv = document.getElementById("progression");
const playBtn = document.getElementById("play");
const bpmSlider = document.getElementById("bpm");
const bpmValue = document.getElementById("bpm-value");

// =====================
// 音楽理論データ
// =====================
const NOTES = ["C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"];

const CHORD_TYPES = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    seventh: [0, 4, 7, 10],
    minor7: [0, 3, 7, 10],
    major7: [0, 4, 7, 11],
    dim: [0, 3, 6],
    aug: [0, 4, 8],
    sus4: [0, 5, 7]
};

const TYPE_DISPLAY = {
    major: "Major",
    minor: "Minor",
    seventh: "7th",
    minor7: "Minor 7th",
    major7: "Major 7th",
    dim: "Diminished",
    aug: "Augmented",
    sus4: "Sus4"
};

const CHORD_LABELS = {
    major: "",
    minor: "m",
    seventh: "7",
    minor7: "m7",
    major7: "M7",
    dim: "dim",
    aug: "aug",
    sus4: "sus4"
};

const EMPTY_BLOCK = {
    label: "—",
    type: "rest",
    notes: []
};


// =====================
// 状態
// =====================
const chords = [];
const progression = [];
const groupContainers = {};

// =====================
// グループUI生成
// =====================
Object.keys(CHORD_TYPES).forEach(type => {
    const section = document.createElement("section");
    section.className = "chord-group";

    const title = document.createElement("h3");
    title.textContent = TYPE_DISPLAY[type];

    const container = document.createElement("div");
    container.className = "chord-group-body";

    section.appendChild(title);
    section.appendChild(container);
    palette.appendChild(section);

    groupContainers[type] = container;
});

// =====================
// コード生成関数
// =====================
function buildChord(root, octave, type) {
    const rootIndex = NOTES.indexOf(root);

    return CHORD_TYPES[type].map(interval => {
        const index = rootIndex + interval;
        const note = NOTES[index % 12];
        const oct = octave + Math.floor(index / 12);
        return note + oct;
    });
}

// =====================
// 全キー × 全コードタイプ生成
// =====================
NOTES.forEach(root => {
    Object.keys(CHORD_TYPES).forEach(type => {
        chords.push({
            label: root + CHORD_LABELS[type],
            root,
            type,
            notes: buildChord(root, 4, type)
        });
    });
});

const addRestBtn = document.getElementById("add-rest");

addRestBtn.onclick = () => {
    progression.push({ ...EMPTY_BLOCK });
    renderProgression();
};


// =====================
// パレットUI生成
// =====================
chords.forEach(chord => {
    const div = document.createElement("div");
    div.className = "chord";
    div.textContent = chord.label;

    div.onclick = () => {
        progression.push(chord);
        renderProgression();
    };

    groupContainers[chord.type].appendChild(div);
});

// =====================
// プログレッション描画
// =====================
function renderProgression() {
    progressionDiv.innerHTML = "";

    progression.forEach((chord, i) => {
        const div = document.createElement("div");
        div.className = "chord";

        const label = document.createElement("span");
        label.textContent = chord.label;

        const del = document.createElement("button");
        del.textContent = "×";
        del.style.marginLeft = "8px";

        del.onclick = () => {
            progression.splice(i, 1);
            renderProgression();
        };
        div.className = "chord";

        if (chord.type === "rest") {
            div.classList.add("rest");
        }

        div.appendChild(label);
        div.appendChild(del);
        progressionDiv.appendChild(div);
    });
}

// =====================
// 再生
// =====================
const synth = new Tone.PolySynth().toDestination();

playBtn.onclick = async () => {
    await Tone.start();

    Tone.Transport.stop();
    Tone.Transport.cancel();

    const blocks = document.querySelectorAll("#progression .chord");
    blocks.forEach(b => b.classList.remove("playing"));

    const interval = Tone.Time("1n").toSeconds();

    progression.forEach((chord, i) => {
        const t = i * interval;

        // 音
        Tone.Transport.scheduleOnce(time => {
            synth.triggerAttackRelease(chord.notes, "1n", time);

            // 表示（完全同期）
            Tone.Draw.schedule(() => {
                blocks.forEach(b => b.classList.remove("playing"));
                blocks[i]?.classList.add("playing");
            }, time);
        }, t);
    });

    Tone.Transport.start();
};


// =====================
// BPM
// =====================
Tone.Transport.bpm.value = bpmSlider.value;
bpmValue.textContent = bpmSlider.value;

bpmSlider.oninput = () => {
    bpmValue.textContent = bpmSlider.value;
    Tone.Transport.bpm.value = bpmSlider.value;
};
