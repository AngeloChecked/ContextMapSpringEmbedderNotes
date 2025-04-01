import { getSvgToHtmlMovementHeightScaling } from "./svgElements";

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

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
