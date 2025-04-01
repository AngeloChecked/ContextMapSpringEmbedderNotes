import { contextMapExample } from "./contextMapExample.js";
import {
  createDashLine,
  createText,
  createPoint,
  createSvg,
  createEllipse,
  createSquare,
} from "./svg.js";
import { interactiveExample1 } from "./interactiveExample1.js";
import { interactiveExample2 } from "./interactiveExample2.js";
import { engine } from "./engine.js";
import { ellipseIntersection } from "./math.js";

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

${createSvg(
  "svg2",
  [600, 300],
  [1000, 1000],
  "lightgray",
  `
    ${createEllipse("node2", [-300, 0], [300, 150], "white", "blue")}
    ${createSquare("label1node2", [-300, -200], [250, 120], "white", "red", 1)}
    ${createSquare("label2node2", [-300, 100], [250, 120], "white", "red", 1)}
    ${createSquare("label3node2", [-700, -100], [250, 120], "white", "red", 1)}
  `,
)}
`);

document.querySelector("#app").innerHTML += `<p>${x}</p>`;

interactiveExample1("node1", "label1node1");
interactiveExample2("node2", "label1node2", "label2node2", "label3node2");

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
