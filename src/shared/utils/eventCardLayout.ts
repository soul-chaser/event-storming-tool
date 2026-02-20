export interface EventCardDimensions {
    width: number;
    height: number;
}

export const EVENT_CARD_LAYOUT = {
    MIN_WIDTH: 120,
    MAX_WIDTH: 320,
    MIN_HEIGHT: 80,
    PADDING: 10,
    FONT_SIZE: 14,
    LINE_HEIGHT: 1.25,
} as const;

const isWideChar = (char: string): boolean => /[^\u0000-\u00ff]/.test(char);

const getTextUnits = (text: string): number => {
    let units = 0;
    for (const char of text) {
        units += isWideChar(char) ? 2 : 1;
    }

    return Math.max(1, units);
};

export const getEventCardDimensions = (text: string): EventCardDimensions => {
    const pxPerUnit = EVENT_CARD_LAYOUT.FONT_SIZE * 0.52;
    const minInnerWidth = EVENT_CARD_LAYOUT.MIN_WIDTH - (EVENT_CARD_LAYOUT.PADDING * 2);
    const maxInnerWidth = EVENT_CARD_LAYOUT.MAX_WIDTH - (EVENT_CARD_LAYOUT.PADDING * 2);
    const lines = text.split('\n');
    const widestLineUnits = Math.max(1, ...lines.map((line) => getTextUnits(line)));
    const estimatedInnerWidth = widestLineUnits * pxPerUnit;
    const innerWidth = Math.min(maxInnerWidth, Math.max(minInnerWidth, estimatedInnerWidth));
    const unitsPerLine = Math.max(1, Math.floor(innerWidth / pxPerUnit));
    const lineCount = Math.max(
        1,
        lines.reduce((count, line) => count + Math.max(1, Math.ceil(getTextUnits(line) / unitsPerLine)), 0)
    );
    const contentHeight = Math.ceil(lineCount * EVENT_CARD_LAYOUT.FONT_SIZE * EVENT_CARD_LAYOUT.LINE_HEIGHT);

    return {
        width: Math.ceil(innerWidth + (EVENT_CARD_LAYOUT.PADDING * 2)),
        height: Math.max(EVENT_CARD_LAYOUT.MIN_HEIGHT, contentHeight + (EVENT_CARD_LAYOUT.PADDING * 2)),
    };
};
