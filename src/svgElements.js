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
