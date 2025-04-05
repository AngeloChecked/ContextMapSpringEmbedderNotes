import { contextMapExample } from "./contextMapExample.js";
import {
  createDashLine,
  createText,
  createPoint,
  createSvg,
  createEllipse,
  createSquare,
  createArrow,
} from "./svg.js";
import { interactiveExample1 } from "./interactiveExample1.js";
import { interactiveExample2 } from "./interactiveExample2.js";
import { engine } from "./engine.js";
import { ellipseIntersection, overlappingRectangle } from "./math.js";

const x = md(`
# ContextMap journey with SpringEmbedder

Using a naive approach to dispose elements of the graph or also using a basic spring embedder algorithm without properly considering label placement, I faced some issues:

- Labels around ellipses overlap each other.
- Labels at the center of edges overlap with the ellipses.
- Edges overlap with all other elements.

${contextMapExample}

To face this problems I'm considering some options:

- change the UI design to better prevent element overlapping.
- modify the spring embedder algorithm to better account for element collisions.

Here below are some notes on the topics I'm exploring while trying to implement this.

## Understand the SVG aspect ratio

To fully grasp the SVG element, I need to understand the viewBox attribute and the concept of [aspect ratio](https://developer.mozilla.org/en-US/docs/Glossary/Aspect_ratio) that tricked me many times.

for example:
${"```html"}
<svg viewBox="-500 -500 1000 1000" width="500" height="200">
${"```"}

First of all, the viewBox defines the coordinate system, width, and height of the SVG. With this configuration, the center of the canvas is 0,0.

The pixel size of the SVG html element and the viewBox are different, and are adapted in a way that the [aspect ratio is preserved](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio).

- html size: 500x200,
- viewBox is 1000x1000
- aspect ratio: x5,
- viewBox adapted to preserve aspectRatio: 2500x1000

The default value for the preserveAspectRatio attribute is 'xMidYMid':
>Forces uniform scaling. Align the midpoint X value of the element's viewBox with the midpoint X value of the viewport. Align the midpoint Y value of the element's viewBox with the midpoint Y value of the viewport. This is the default value.
So the aspect ratio is based on the height of the viewBox and the height of the html element:

$$aspectRatio = \\frac {viewboxHeight} {height} = \\frac {1000} {200} = 5 $$

$$viewbox = htmlSize * aspectRatio $$

${"```js"}
function getSvgAspectRatio(svg) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  return viewBox.height / rect.height;
}
${"```"}

This is particularly useful when I want to move an element in the SVG based on the mouse movement:

${"```js"}
const update = (event) => {
  const rect = event.target;
  const [x, y] = [rect.x.baseVal.value, rect.y.baseVal.value];
  rect.setAttribute("x", x + event.movementX * aspectRatio);
  rect.setAttribute("y", y + event.movementY * aspectRatio);
};
rect.onpointermove = update;
${"```"}

## Various ellipse and common vector operations

### distance
$$distance = \\sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$
${"```js"}
function distance([x1, y1], [x2, y2]) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
${"```"}


### middle point
$$(mx,my) = \\left( \\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2} \\right)$$
${"```js"}
function middle([x1, y1], [x2, y2]) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
}
${"```"}

### direction
$$\\vec{(dx,dy)} = \\left( \\text{sign}(x_2 - x_1), \\text{sign}(y_2 - y_1) \\right)$$
${"```js"}
function direction([x1, y1], [x2, y2]) {
  return [Math.sign(x2 - x1), Math.sign(y2 - y1)];
}
${"```"}

### ellipse intersection
$$(iex,iey) = \\left[ x_1 + \\frac{(x_2 - x_1)}{\\sqrt{\\left( \\frac{(x_2 - x_1)^2}{r_x^2} + \\frac{(y_2 - y_1)^2}{r_y^2} \\right)}}, y_1 + \\frac{(y_2 - y_1)}{\\sqrt{\\left( \\frac{(x_2 - x_1)^2}{r_x^2} + \\frac{(y_2 - y_1)^2}{r_y^2} \\right)}} \\right]$$

${"```js"}
function ellipseIntersection(ellipse, point) {
  let [x1, y1, rx, ry] = ellipse;
  let [x2, y2] = point;
  // Translate the system so the ellipse center is at (0,0)
  let dx = x2 - x1;
  let dy = y2 - y1;
  // Compute the intersection point using parametric equations
  let scale = 1 / Math.sqrt(dx ** 2 / rx ** 2 + dy ** 2 / ry ** 2);
  // Get the intersection point on the ellipse perimeter
  let x = x1 + dx * scale;
  let y = y1 + dy * scale;
  return [x, y];
}
${"```"}

${pointExample()}

## Understand spring force and simple physics simulation

To implement the spring embedder algorithm, I need to get the physics behind spring forces. There's some literature on it, I'm super naive on this stuff. So, I started with the basics, the Hooke’s Law is the more plain physics principle I discover.

### Hooke’s Law:
$$f = -k*x $$

or more readable: $$ {force} = -{stiffness}*stretch$$

## Understand Hooke’s Law in a 2d space:

First of all, Hooke's Law gives me the force needed to return a spring to its rest state in 1D. But to apply this in 2D, the force must be split into x and y and must consider also the direction.

To do this, I need to understand the following formula:

$$ (F_x,F_y)  = [F \\cdot \\cos(\\theta), F \\cdot \\sin(\\theta)]$$

To get this data I need to to understand the trigonometry idea around opposite and adjacent sides of a right triangle:

$$(\\cos(\\theta), \\sin(\\theta)) = [\\frac{\\text{adjacent}}{\\text{hypotenuse}} = \\frac{dx}{\\text{distance}}, \\frac{\\text{opposite}}{\\text{hypotenuse}} = \\frac{dy}{\\text{distance}}]$$

${"```js"}
         x1
          ●
          |\\
 (dy)     | \\  ← Distance (hypotenuse)
 opposite |  \\ x2
          |___● 00
       adjacent(dx)
${"```"}
In trigonometry, opposite and adjacent refer to the sides of a right triangle relative to a specific angle θ0.
- Hypotenuse: The longest side of a right triangle.
- Opposite Side: The side that is opposite to the angle θθ.
- Adjacent Side: The side that is next to the angle θθ, but not the hypotenuse.

So the final formula to get the force in 2D is:

$$(F_x,F_y) = [-k \\cdot \\text{stretch} \\cdot \\frac{dx}{\\text{distance}}, -k \\cdot \\text{stretch} \\cdot \\frac{dy}{\\text{distance}} ] $$

${"```js"}
function springForce([x1, y1], [x2, y2], stiffness, restLength) {
  const [adjacentDeltaX, oppositeDeltaY] = [x1 - x2, y1 - y2]; // translate the system so the triangle is at (0,0)
  const distance = Math.sqrt(adjacentDeltaX ** 2 + oppositeDeltaY ** 2) + 1;
  const stretch = distance - restLength;
  const force = -stiffness * stretch;
  const [cosOpartX, sinOpartY] = [adjacentDeltaX / distance, oppositeDeltaY / distance];
  const [scaledForceX, scaledForceY] = [force * cosOpartX, force * sinOpartY];
  return [scaledForceX, scaledForceY];
}
${"```"}

## Understand time

In physics simulation I understand that the time is handled by the iteration of a for loop:

${"```js"}
const stiffness = 0.8;
const iterations = 5;
const [nodeX, nodeY] = [0, 0];
let [currentLabelX, currentLabelY] = [100, 100];
const restLength = ellipseIntersection([nodeX, nodeY, nodeRadiusX, nodeRadiusY], [currentLabelX, currentLabelY]);
let [totalForceX, totalForceY] = [0, 0];
for (let i = 0; i < iterations; i++) {
  const [scaledForceX, scaledForceY] = springForce(
    [currentLabelX, currentLabelY],
    [nodeX, nodeY],
    stiffness,
    restLength,
  );
  totalForceX += scaledForceX;
  totalForceY += scaledForceY;
}
const [newLabelX,newLabelY] = [labelX + totalForceX, labelY + totalForceY];
[currentLabelX, currentLabelY] = [newLabelX, newLabelY];
${"```"}

An interactive example:

${createSvg(
  "svg1",
  [600, 300],
  [1000, 1000],
  "lightgray",
  `
    ${createEllipse("node1", [-300, 0], [300, 150], "white", "blue")}
    ${createSquare("label1node1", [-300, 0], [250, 120], "white", "red", 1)}
  `,
)}

## Collisions and propagate forces

To manage label overlapping, my idea is to check each label for collisions, prevent them from overlapping, and adjust their positions with a repulsion to favor a more distributed layout.

${rectOverlapExample()}

$$\\text{If } \\max(x_1, x_2) < \\min(x_1 + w_1, x_2 + w_2) \\text{ and } \\max(y_1, y_2) < \\min(y_1 + h_1, y_2 + h_2), \\text{ then overlap is } \\left( \\max(x_1, x_2), \\max(y_1, y_2), \\min(x_1 + w_1, x_2 + w_2), \\min(y_1 + h_1, y_2 + h_2) \\right)$$

${"```"}js
function overlappingRectangle(rect1, rect2) {
  let [x1, y1, w1, h1] = rect1;
  let [x2, y2, w2, h2] = rect2;

  [x1, y1, x2, y2] = [
    Math.max(x1, x2),
    Math.max(y1, y2),
    Math.min(x1 + w1, x2 + w2),
    Math.min(y1 + h1, y2 + h2),
  ];

  const areOverlapping = x1 < x2 && y1 < y2;
  if (areOverlapping) {
    const [w, h] = [x2 - x1, y2 - y1];
    return [x1, y1, x2, y2, w, h];
  }
  return null;
}
${"```"}

so if I identify a overlap, I skip the force application for that iteration and repulse the label for their overlapping area:

${"```"}js
for (let i = 0; i < iterations; i++) {
  for (const [currentLabelIdx, currentLabel] of labels.entries()) {
    let [fx1, fy1] = forces[currentLabelIdx];
    let [cx1, cy1] = positionCenters[currentLabelIdx];
    let [x1, y1, w1, h1] = positions[currentLabelIdx];
    [cx1, cy1] = [cx1 + fx1, cy1 + fy1];
    [x1, y1] = [x1 + fx1, y1 + fy1];

    const [intersectionX, intersectionY] = ellipseIntersection([nodeX, nodeY, nodeRadiusX, nodeRadiusY], [cx1, cy1]);
    const restLength = distance([nodeX, nodeY], [intersectionX, intersectionY]);
    const [currentForceX, currentForceY] = springForce([cx1, cy1], [nodeX, nodeY], stiffness, restLength);

    forces[currentLabelIdx] = [fx1 + currentForceX, fy1 + currentForceY];
    for (const [otherLabelIdx] of labels.entries()) {
      if (currentLabelIdx === otherLabelIdx) continue;
      const [oxf, oyf] = forces[otherLabelIdx];
      const [x2, y2, w2, h2] = positions[otherLabelIdx];
      const [otherLXPredict, otherLYPredict] = [x2 + oxf, y2 + oyf];

      const overlappingRect = overlappingRectangle([x1, y1, w1, h1], [otherLXPredict, otherLYPredict, w2, h2]);
      if (overlappingRect) {
        const [ox1, oy1, ox2, oy2, ow, oh] = overlappingRect;

        const [dirX, dirY] = [Math.sign(x1 - x2), Math.sign(y1 - y2)];
        forces[currentLabelIdx] = [fx1 + ow * dirX, fy1 + oh * dirY];
        forces[otherLabelIdx] = [oxf - ow * dirX, oyf - oh * dirY];
      }
    }
  }
}
${"```"}


${createSvg(
  "svg2",
  [600, 300],
  [1000, 1000],
  "lightgray",
  `
    ${createEllipse("node2", [-300, 0], [300, 150], "white", "blue")}
    ${createSquare("label1node2", [-300, -200], [250, 120], "white", "red", 1)}
    ${createSquare("label2node2", [-300, 100], [250, 120], "white", "red", 1)}
    ${createSquare("label3node2", [-200, -150], [250, 120], "white", "red", 1)}
    ${createSquare("label4node2", [-800, -100], [250, 120], "white", "red", 1)}
    ${createSquare("label5node2", [-500, -100], [250, 120], "white", "red", 1)}
  `,
)}
`);

document.querySelector("#app").innerHTML += `<p>${x}</p>`;

interactiveExample1("node1", "label1node1");
interactiveExample2("node2", [
  "label1node2",
  "label2node2",
  "label3node2",
  "label4node2",
  "label5node2",
]);

engine();

function pointExample() {
  const [w, h] = [1000, 1000];
  const [ex, ey, erx, ery] = [-400, -100, 300, 150];
  const [sx, sy, sw, sh] = [-1300, -400, 250, 120];
  const [scx, scy] = [sx + sw / 2, sy + sh / 2];
  const [eix, eiy] = ellipseIntersection([ex, ey, erx, ery], [scx, scy]);
  const [ex2, ey2, erx2, ery2] = [900, 350, 300, 150];
  const [eix2, eiy2] = ellipseIntersection([ex2, ey2, erx2, ery2], [ex, ey]);
  const svg = `
<svg viewBox="-${w / 2} -${h / 2} ${w}, ${h}" width="600" height="200" style="background:lightgray;">
<g>
  ${createEllipse("any", [ex, ey], [erx, ery], "white", "blue")}
  ${createPoint("any", [ex, ey])}
  ${createSquare("any", [sx, sy], [sw, sh], "white", "red", 1)}
  ${createPoint("any", [scx, scy])}
  ${createPoint("any", [scx, ey])}
  ${createDashLine("any", [scx, ey], [ex, ey])}
  ${createDashLine("any", [scx, ey], [scx, scy])}
  ${createDashLine("any", [scx, scy], [ex, ey])}
  ${createText("any", [-900, -400], `c1:${scx - ex}, c2:${scy - ey}, c3:${Math.round(Math.sqrt((scx - ex) ** 2 + (scy - ey) ** 2))}(distance)`)}
  ${createPoint("any", [Math.round(eix), Math.round(eiy)])}
  ${createEllipse("any", [ex2, ey2], [erx2, ery2], "white", "blue")}
  ${createPoint("any", [ex2, ey2])}
  ${createDashLine("any", [ex2, ey2], [ex, ey])}
  ${createPoint("any", [Math.round((ex2 + ex) / 2), Math.round((ey2 + ey) / 2)])}
  ${createPoint("any", [Math.round(eix2), Math.round(eiy2)])}
</g>
${createDashLine("any", [0, -1000], [0, 1000])}
${createDashLine("any", [-1500, 0], [1500, 0])}
${createPoint("any", [0, 0])}
</svg>
  `;
  return svg;
}

function rectOverlapExample() {
  const [w, h] = [1000, 1000];
  const [x1, y1, w1, h1] = [-200, 0, 600, 300];
  const [x2, y2, w2, h2] = [-600, -100, 600, 300];
  const overlappingRect = overlappingRectangle(
    [x1, y1, w1, h1],
    [x2, y2, w2, h2],
  );
  const [ox1, oy1, ox2, oy2, ow, oh] = overlappingRect;
  const [centerX1, centerY1] = [x1 + w1 / 2, y1 + h1 / 2];
  const [centerX2, centerY2] = [x2 + w2 / 2, y2 + h2 / 2];
  const [dirX1toX2, dirY1toY2] = [centerX1 - centerX2, centerY1 - centerY2];
  const [dirX2toX1, dirY2toX1] = [centerX2 - centerX1, centerY2 - centerY1];
  const [forceX1toX2, forceY1toY2] = [
    Math.sign(dirX1toX2) * ow,
    Math.sign(dirY1toY2) * oh,
  ];
  const [forceX2toX1, forceY2toX1] = [
    Math.sign(dirX2toX1) * ow,
    Math.sign(dirY2toX1) * oh,
  ];
  const svg = `
<svg viewBox="-${w / 2} -${h / 2} ${w}, ${h}" width="600" height="200" style="background:lightgray;">
<g>
  ${createSquare("any", [x1, y1], [w1, h1], "white", "red", 1)}
  ${createSquare("any", [x2, y2], [w2, h2], "white", "red", 1)}
  ${createPoint("any", [x1, y1])}
  ${createPoint("any", [x1 + w1, y1])}
  ${createPoint("any", [x1, y1 + h1])}
  ${createPoint("any", [x1 + w1, y1 + h1])}

  ${createPoint("any", [x2, y2])}
  ${createPoint("any", [x2 + w2, y2])}
  ${createPoint("any", [x2, y2 + h2])}
  ${createPoint("any", [x2 + w2, y2 + h2])}

  ${createPoint("any", [ox1, oy1], 33, "red")}
  ${createPoint("any", [ox1 + ow, oy1], 33, "red")}
  ${createPoint("any", [ox1, oy1 + oh], 33, "red")}
  ${createPoint("any", [ox1 + ow, oy1 + oh], 33, "red")}

  ${createDashLine("any", [ox1, oy1], [ox1 + ow, oy1])}
  ${createDashLine("any", [ox1, oy1], [ox1, oy1 + oh])}

  ${createPoint("any", [centerX1, centerY1], 25, "blue")}
  ${createPoint("any", [centerX2, centerY2], 25, "blue")}
  ${createDashLine("any", [centerX1, centerY1], [centerX2, centerY2])}

  ${createArrow("any", [centerX1, centerY1 - 400], [centerX2, centerY2 - 400])}
  ${createText("any", [centerX2, centerY2 - 475], `${dirX1toX2}, ${dirY1toY2}: direction, ${forceX1toX2}, ${forceY1toY2}: force`)}

  ${createArrow("any", [centerX2, centerY2 - 450], [centerX1, centerY1 - 450])}
  ${createText("any", [centerX1, centerY1 - 350], `${dirX2toX1}, ${dirY2toX1}: direction, ${forceX2toX1}, ${forceY2toX1}: force`)}
</g>
</svg>
  `;
  return svg;
}
