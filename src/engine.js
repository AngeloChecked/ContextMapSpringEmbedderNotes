import {
  createTextElement,
  createCircleElement,
  createSpringLineElement,
} from "./svgElements.js";
import { ellipseIntersection, distance, springForce } from "./math";

export function engine() {
  const svgs = document.querySelectorAll("svg");
  for (const svg of svgs) {
    const shapes = svg.querySelectorAll("ellipse, rect");
    for (const shape of shapes) {
      let xName, yName;
      if (shape.hasAttribute("x")) {
        [xName, yName] = ["x", "y"];
      } else {
        [xName, yName] = ["cx", "cy"];
      }
      const scaleY = getSvgToHtmlMovementHeightScaling(shape);
      const slide = (event) => {
        const [x, y] = [shape[xName].baseVal.value, shape[yName].baseVal.value];
        shape.setAttribute(xName, x + event.movementX * scaleY);
        shape.setAttribute(yName, y + event.movementY * scaleY);
      };
      shape.addEventListener("pointerdown", (event) => {
        shape.onpointermove = slide;
        shape.setPointerCapture(event.pointerId);
      });
      shape.addEventListener("pointerup", (event) => {
        shape.onpointermove = null;
        shape.releasePointerCapture(event.pointerId);
      });
    }
  }
}

function getSvgToHtmlMovementHeightScaling(node) {
  const svg = node.closest("svg");
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  return viewBox.height / rect.height; // default: svg keep aspect ratio larging the width based on the height
}

function getEllipseSize(ellipse) {
  return [
    ellipse.cx.baseVal.value,
    ellipse.cy.baseVal.value,
    ellipse.rx.baseVal.value,
    ellipse.ry.baseVal.value,
  ];
}
function getRectSize(rect) {
  const w = rect.width.baseVal.value;
  const h = rect.height.baseVal.value;
  return [rect.x.baseVal.value + w / 2, rect.y.baseVal.value + h / 2, w, h];
}

export function link(nodeId, labelId) {
  const nodeElement = document.querySelector(`#${nodeId}`);
  const labelElement = document.querySelector(`#${labelId}`);
  const scaleY = getSvgToHtmlMovementHeightScaling(nodeElement);

  const updateLabelPosition = (event) => {
    const [labelX, labelY, labelWidth, labelHeight] = getRectSize(labelElement);
    const newLabelX = labelX + event.movementX * scaleY - labelWidth / 2;
    labelElement.setAttribute("x", newLabelX);
    const newLabelY = labelY + event.movementY * scaleY - labelHeight / 2;
    labelElement.setAttribute("y", newLabelY);
  };

  nodeElement.addEventListener("pointerdown", (_event) => {
    nodeElement.addEventListener("pointermove", updateLabelPosition);
  });
  nodeElement.addEventListener("pointerup", (_event) => {
    nodeElement.removeEventListener("pointermove", updateLabelPosition);
  });

  const onLabelMove = () => {
    let [nodeX, nodeY] = getEllipseSize(nodeElement);
    const [labelX, labelY] = getRectSize(labelElement);
    appendSpringTo("spring", labelElement, [labelX, labelY], [nodeX, nodeY]);
  };
  labelElement.addEventListener("pointermove", onLabelMove);
  onLabelMove();

  const onReturn = async () => {
    const iterations = 5;
    let [nodeX, nodeY, nodeRadiusX, nodeRadiusY] = getEllipseSize(nodeElement);
    const [labelX, labelY, labelWidth, labelHeight] = getRectSize(labelElement);

    const stiffness = 0.8;
    let totalForceX = 0;
    let totalForceY = 0;

    const [intersectionX, intersectionY] = ellipseIntersection(
      [nodeX, nodeY, nodeRadiusX, nodeRadiusY],
      [labelX, labelY],
    );
    const restLength = distance([nodeX, nodeY], [intersectionX, intersectionY]);

    for (let i = 0; i < iterations; i++) {
      const [currentLabelX, currentLabelY] = getRectSize(labelElement);

      const [scaledForceX, scaledForceY, force, stretch, distanceFromNode] =
        springForce(
          [currentLabelX, currentLabelY],
          [nodeX, nodeY],
          stiffness,
          restLength,
        );

      appendTextTo(
        "iterations",
        labelElement,
        [-1000, -450],
        `iteration: ${i + 1}, stiffness: ${stiffness}, restLength: ${Math.trunc(restLength)}, stretch: ${Math.round(stretch)}, distance: ${distanceFromNode}`,
      );

      totalForceX += Math.round(scaledForceX);
      totalForceY += Math.round(scaledForceY);
      const newLabelX = labelX - labelWidth / 2 + totalForceX;
      const newLabelY = labelY - labelHeight / 2 + totalForceY;
      onLabelMove();
      await sleep(300);
      labelElement.setAttribute("x", newLabelX);
      labelElement.setAttribute("y", newLabelY);
      appendTextTo(
        "text",
        labelElement,
        [newLabelX, newLabelY],
        `x:${Math.round(scaledForceX)}, y:${Math.round(scaledForceY)}, f: ${Math.round(force)}`,
      );
    }
    labelElement.setAttribute("x", labelX - labelWidth / 2 + totalForceX);
    labelElement.setAttribute("y", labelY - labelHeight / 2 + totalForceY);
  };
  labelElement.addEventListener("pointerup", onReturn);
}

function appendSpringTo(id, label, [labelX, labelY], [nodeX, nodeY]) {
  const svg = label.closest("svg");
  svg.querySelector(`#${id}`)?.remove();
  svg.appendChild(
    createSpringLineElement(id, [labelX, labelY], [nodeX, nodeY], "green", 15),
  );
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendCircleTo(id, label, [x, y]) {
  const svg = label.closest("svg");
  svg.querySelector(`#${id}`)?.remove();
  svg.appendChild(createCircleElement(id, [x, y]));
}

function appendTextTo(id, label, [x, y], text) {
  const svg = label.closest("svg");
  svg.querySelector(`#${id}`)?.remove();
  svg.appendChild(createTextElement(id, [x, y], text));
}
