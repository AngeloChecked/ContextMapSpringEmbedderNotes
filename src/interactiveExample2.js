import {
  ellipseIntersection,
  distance,
  springForce,
  overlappingRectangle,
} from "./math";
import {
  appendSpringTo,
  appendTextTo,
  appendRectTo,
  getEllipseSize,
  getRectCenterSize,
  getRectSize,
  getSvgToHtmlMovementHeightScaling,
} from "./svgElements";
import { sleep } from "./engine";

export function interactiveExample2(nodeId, labelId, label2Id, label3Id) {
  const nodeElement = document.querySelector(`#${nodeId}`);
  const labelElement = document.querySelector(`#${labelId}`);
  const label2Element = document.querySelector(`#${label2Id}`);
  const label3Element = document.querySelector(`#${label3Id}`);
  const scaleY = getSvgToHtmlMovementHeightScaling(nodeElement);
  const labels = [labelElement, label2Element, label3Element];

  const updateLabelPosition = (event) => {
    for (const label of labels) {
      const [labelX, labelY, labelWidth, labelHeight] =
        getRectCenterSize(label);
      const newLabelX = labelX + event.movementX * scaleY - labelWidth / 2;
      label.setAttribute("x", newLabelX);
      const newLabelY = labelY + event.movementY * scaleY - labelHeight / 2;
      label.setAttribute("y", newLabelY);
    }
  };

  nodeElement.addEventListener("pointerdown", (_event) => {
    nodeElement.addEventListener("pointermove", updateLabelPosition);
  });
  nodeElement.addEventListener("pointerup", (_event) => {
    nodeElement.removeEventListener("pointermove", updateLabelPosition);
  });

  const onLabelMove = (event) => {
    for (const labelElement of labels) {
      let [nodeX, nodeY] = getEllipseSize(nodeElement);
      const [labelX, labelY] = getRectCenterSize(labelElement);
      appendSpringTo(
        `spring${labelElement.getAttribute("id")}`,
        labelElement,
        [labelX, labelY],
        [nodeX, nodeY],
      );
    }
  };

  for (const label of labels) {
    label.addEventListener("pointermove", onLabelMove);
    onLabelMove();
  }

  const onReturn = async (event) => {
    for (const l of labels) {
      const targetId = event.target.getAttribute("id");
      const currentId = l.getAttribute("id");
      if (targetId === currentId) {
        l.setAttribute("fill", "pink");
      } else {
        l.setAttribute("fill", "white");
      }
    }
    const iterations = 5;
    let [nodeX, nodeY, nodeRadiusX, nodeRadiusY] = getEllipseSize(nodeElement);
    const stiffness = 0.8;

    const positionCenters = [];
    const positions = [];
    const forces = [];
    for (const label of labels) {
      forces.push([0, 0]);
      const [x, y, w, h] = getRectSize(label);
      positions.push([x, y, w, h]);
      const [cx, cy] = getRectCenterSize(label);
      positionCenters.push([cx, cy, w, h]);
    }

    for (let i = 0; i < iterations; i++) {
      for (const [currentLabelIdx, currentLabel] of labels.entries()) {
        let [fx1, fy1] = forces[currentLabelIdx];
        let [cx1, cy1] = positionCenters[currentLabelIdx];
        let [x1, y1, w1, h1] = positions[currentLabelIdx];
        [cx1, cy1] = [cx1 + fx1, cy1 + fy1];
        [x1, y1] = [x1 + fx1, y1 + fy1];

        const [intersectionX, intersectionY] = ellipseIntersection(
          [nodeX, nodeY, nodeRadiusX, nodeRadiusY],
          [cx1, cy1],
        );
        const restLength = distance(
          [nodeX, nodeY],
          [intersectionX, intersectionY],
        );

        const [currentForceX, currentForceY, force, stretch, distanceFromNode] =
          springForce([cx1, cy1], [nodeX, nodeY], stiffness, restLength);

        appendTextTo(
          "iterations",
          currentLabel,
          [-1000, -450],
          `iteration: ${i + 1}, stiffness: ${stiffness}, restLength: ${Math.trunc(restLength)}, stretch: ${Math.round(stretch)}, distance: ${distanceFromNode}`,
        );

        let [nextLabelX, nextLabelY] = [x1 + currentForceX, y1 + currentForceY];
        for (const [otherLabelIdx] of labels.entries()) {
          if (otherLabelIdx === currentLabelIdx) continue;

          const [oxf, oyf] = forces[otherLabelIdx];
          const [x2, y2, w2, h2] = positions[otherLabelIdx];
          const otherLabelXPredict = x2 + oxf;
          const otherLabelYPredict = y2 + oyf;

          const overlappingRect = overlappingRectangle(
            [nextLabelX, nextLabelY, w1, h1],
            [otherLabelXPredict, otherLabelYPredict, w2, h2],
          );

          if (overlappingRect) {
            const [ox1, oy1, ox2, oy2, ow, oh] = overlappingRect;
            const [dirX, dirY] = [
              Math.sign(nextLabelX - x2),
              Math.sign(nextLabelY - y2),
            ];
            forces[currentLabelIdx] = [
              fx1 + currentForceX + ow * dirX,
              fy1 + currentForceY + oh * dirY,
            ];
            forces[otherLabelIdx] = [oxf + ow * -dirX, oyf + oh * -dirY];
          } else {
            forces[currentLabelIdx] = [
              fx1 + currentForceX,
              fy1 + currentForceY,
            ];
          }
        }

        [fx1, fy1] = forces[currentLabelIdx];
        const [newLabelX, newLabelY] = [
          Math.round(x1 + currentForceX),
          Math.round(y1 + currentForceY),
        ];
        onLabelMove(event);
        await sleep(100);
        appendTextTo(
          "text",
          currentLabel,
          [newLabelX, newLabelY],
          `x:${Math.round(currentForceX)}, y:${Math.round(currentForceY)}, f: ${Math.round(force)}`,
        );

        for (const [idx, otherLabel] of labels.entries()) {
          const [oxf, oyf] = forces[idx];
          const [x2, y2] = positions[idx];
          otherLabel.setAttribute("x", x2 + oxf);
          otherLabel.setAttribute("y", y2 + oyf);
        }
      }
    }
    for (const [idx, label] of labels.entries()) {
      const [oxf, oyf] = forces[idx];
      const [x, y] = positions[idx];
      label.setAttribute("x", x + oxf);
      label.setAttribute("y", y + oyf);
    }
  };
  for (const label of labels) {
    label.addEventListener("pointerup", onReturn);
  }
}
