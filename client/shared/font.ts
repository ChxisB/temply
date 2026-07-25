import type { FallbackFont, FontFormat } from '@temply/shared/theme';

type Font = {
  fontFamily: string;
  fallbackFontFamily: FallbackFont | FallbackFont[];
  webFont?: { url: string; format: FontFormat };
};

export function loadFont(font: Font): void {
  const style = fontStyle(font);

  const styleElement = document.createElement('style');
  styleElement.textContent = style;
  document.head.appendChild(styleElement);
}

export function fontStyle(font: Font): string {
  const { fontFamily, fallbackFontFamily, webFont } = font;

  const src = webFont
    ? `src: url(${webFont.url}) format('${webFont.format}');`
    : '';

  const style = `
  @font-face {
    font-family: '${fontFamily}';
    font-style: normal;
    font-weight: 400;
    mso-font-alt: '${fallbackFontFamily}';
    ${src}
  }`;

  return style;
}
