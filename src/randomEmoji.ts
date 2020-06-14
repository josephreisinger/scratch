// Set the unicode version.
// Your system may not support Unicode 7.0 charecters just yet! So hipster.
const UNICODE_VERSION = 6;

// Sauce: http://www.unicode.org/charts/PDF/U1F300.pdf
const EMOJI_RANGES_UNICODE: Record<number, [number, number][]> = {
    6: [
        [0x1f300, 0x1f320],
        [0x1f330, 0x1f335],
        [0x1f337, 0x1f37c],
        [0x1f380, 0x1f393],
        [0x1f3a0, 0x1f3c4],
        [0x1f3c6, 0x1f3ca],
        [0x1f3e0, 0x1f3f0],
        [0x1f400, 0x1f43e],
        [0x1f440, 0x1f440],
        [0x1f442, 0x1f4f7],
        [0x1f4f9, 0x1f4fc],
        [0x1f500, 0x1f53c],
        [0x1f540, 0x1f543],
        [0x1f550, 0x1f567],
        [0x1f5fb, 0x1f5ff],
    ],
    7: [
        [0x1f300, 0x1f32c],
        [0x1f330, 0x1f37d],
        [0x1f380, 0x1f3ce],
        [0x1f3d4, 0x1f3f7],
        [0x1f400, 0x1f4fe],
        [0x1f500, 0x1f54a],
        [0x1f550, 0x1f579],
        [0x1f57b, 0x1f5a3],
        [0x1f5a5, 0x1f5ff],
    ],
    8: [
        [0x1f300, 0x1f579],
        [0x1f57b, 0x1f5a3],
        [0x1f5a5, 0x1f5ff],
    ],
};

function weightedSample(weights: number[]) {
    let sum = 0;
    let r = Math.random();

    const norm = weights.reduce((a, b) => a + b, 0);

    for (let i = 0; i < weights.length; i++) {
        sum += weights[i] / norm;
        if (r <= sum) return i;
    }

    return weights.length - 1;
}

export const randomEmoji = (unicodeVersion: number = UNICODE_VERSION) => {
    const codePlane = EMOJI_RANGES_UNICODE[unicodeVersion];
    const weights = codePlane.map(([start, end]) => end - start + 1);
    const [start, end] = codePlane[weightedSample(weights)];
    return String.fromCodePoint(Math.floor((start + Math.random() * (end - start + 1)) / 2) * 2);
};
