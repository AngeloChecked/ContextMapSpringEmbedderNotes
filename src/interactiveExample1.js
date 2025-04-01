import { ellipseIntersection, distance, springForce } from "./math";
import {
  appendSpringTo,
  appendTextTo,
  getEllipseSize,
  getRectCenterSize,
  getSvgToHtmlMovementHeightScaling,
} from "./svgElements";
import { sleep } from "./engine";

export function interactiveExample1(nodeId, labelId) {
  const nodeElement = document.querySelector(`#${nodeId}`);
  const labelElement = document.querySelector(`#${labelId}`);
  const scaleY = getSvgToHtmlMovementHeightScaling(nodeElement);

  const updateLabelPosition = (event) => {
    const [labelX, labelY, labelWidth, labelHeight] =
      getRectCenterSize(labelElement);
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
    const [labelX, labelY] = getRectCenterSize(labelElement);
    appendSpringTo("spring", labelElement, [labelX, labelY], [nodeX, nodeY]);
  };
  labelElement.addEventListener("pointermove", onLabelMove);
  onLabelMove();

  const onReturn = async () => {
    const iterations = 5;
    let [nodeX, nodeY, nodeRadiusX, nodeRadiusY] = getEllipseSize(nodeElement);
    const [labelX, labelY, labelWidth, labelHeight] =
      getRectCenterSize(labelElement);

    const stiffness = 0.8;
    let totalForceX = 0;
    let totalForceY = 0;

    const [intersectionX, intersectionY] = ellipseIntersection(
      [nodeX, nodeY, nodeRadiusX, nodeRadiusY],
      [labelX, labelY],
    );
    const restLength = distance([nodeX, nodeY], [intersectionX, intersectionY]);

    for (let i = 0; i < iterations; i++) {
      const [currentLabelX, currentLabelY] = getRectCenterSize(labelElement);

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
