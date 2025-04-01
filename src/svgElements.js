export function createCircleElement(id, [x1, y1]) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  circle.setAttribute("id", id);
  circle.setAttribute("stroke", 2);
  circle.setAttribute("stroke-width", 2);
  circle.setAttribute("fill", "black");
  circle.setAttribute("cx", x1);
  circle.setAttribute("cy", y1);
  circle.setAttribute("r", 30);
  return circle;
}

export function createRectElement(id, [x, y, width, height], fill = "white") {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("id", id);
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", fill);
  rect.setAttribute("stroke", "black");
  return rect;
}

export function createTextElement(id, [x, y], text) {
  const textElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text",
  );
  textElement.setAttribute("id", id);
  textElement.setAttribute("x", x);
  textElement.setAttribute("y", y);
  textElement.setAttribute("font-size", 60);
  textElement.setAttribute("fill", "black");
  textElement.textContent = text;
  return textElement;
}

export function createSpringLineElement(
  id,
  [x1, y1],
  [x2, y2],
  stroke,
  strokeWidth,
) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", id);
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", strokeWidth);
  path.setAttribute("fill", "none");
  path.setAttribute("d", `M${x1} ${y1} L${x2} ${y2}`);
  path.setAttribute("style", "stroke-dasharray: 5, 5;");
  return path;
}

export function appendSpringTo(id, label, [labelX, labelY], [nodeX, nodeY]) {
  const svg = label.closest("svg");
  svg.querySelector(`#${id}`)?.remove();
  svg.appendChild(
    createSpringLineElement(id, [labelX, labelY], [nodeX, nodeY], "green", 15),
  );
}

function appendCircleTo(id, label, [x, y]) {
  const svg = label.closest("svg");
  svg.querySelector(`#${id}`)?.remove();
  svg.appendChild(createCircleElement(id, [x, y]));
}

export function appendTextTo(id, label, [x, y], text) {
  const svg = label.closest("svg");
  svg.querySelector(`#${id}`)?.remove();
  svg.appendChild(createTextElement(id, [x, y], text));
}

export function appendRectTo(id, label, [x, y, width, height], color) {
  const svg = label.closest("svg");
  svg.querySelector(`#${id}`)?.remove();
  svg.appendChild(createRectElement(id, [x, y, width, height], color));
}

export function getSvgToHtmlMovementHeightScaling(node) {
  const svg = node.closest("svg");
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  return viewBox.height / rect.height; // default: svg keep aspect ratio larging the width based on the height
}

export function getEllipseSize(ellipse) {
  return [
    ellipse.cx.baseVal.value,
    ellipse.cy.baseVal.value,
    ellipse.rx.baseVal.value,
    ellipse.ry.baseVal.value,
  ];
}

export function getRectCenterSize(rect) {
  const w = rect.width.baseVal.value;
  const h = rect.height.baseVal.value;
  return [rect.x.baseVal.value + w / 2, rect.y.baseVal.value + h / 2, w, h];
}

export function getRectSize(rect) {
  const w = rect.width.baseVal.value;
  const h = rect.height.baseVal.value;
  return [rect.x.baseVal.value, rect.y.baseVal.value, w, h];
}
