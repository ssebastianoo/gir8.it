const GLYPHS = '!<>-_\\/[]{}=+*^?#$%&01';

export const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
