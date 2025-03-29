export function createSvg(
  id,
  [width, height],
  [innerWidth, innerHeight] = [1000, 1000],
  bgColor,
  body,
) {
  const svg = `
<svg
  id="${id}"
  viewBox="-${innerWidth / 2} -${innerHeight / 2} ${innerWidth} ${innerHeight}"
  width="${width}"
  height="${height}"
  style="background-color:${bgColor};"
>
${body}
</svg>
`;
  return svg;
}

export function createEllipse(
  id,
  [x, y],
  [rx, ry],
  fill,
  stroke,
  strokeWidth = 15,
) {
  return `
  <ellipse id="${id}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" style="cursor: pointer;"/>
  `;
}

export function createSquare(
  id,
  [x, y],
  [width, height],
  fill,
  stroke,
  strokeWidth = 15,
) {
  return `
  <rect id="${id}" x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" style="cursor: pointer;" />
  `;
}

export function createText(id, [x, y], text, fontSize = 60) {
  return `<text id="${id}" x="${x}" y="${y}" font-size="${fontSize}" fill="black">${text}</text>`;
}

export function createPoint(id, [x, y], r = 20, fill = "black") {
  return `<circle id="${id}" cx="${x}" cy="${y}" r="${r}" fill="${fill}" />
${createText(`${id}`, [x + 40, y + 20], `${x},${y}`, 60)}
`;
}

export function createDashLine(id, [x1, y1], [x2, y2]) {
  return `<line id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="${2}px" style="stroke-dasharray: 30;" />`;
}

export function createLineSpring(
  id,
  [x1, y1],
  [x2, y2],
  stroke,
  strokeWidth = 15,
) {
  return `
  <line id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}px" style="stroke-dasharray: 5, 5;" />
  `;
}

function text(id, [x, y], text, fontSize = 20) {
  return `
  <text id="${id}" x="${x}" y="${y}" font-size="${fontSize}" fill="black">${text}</text>
  `;
}
