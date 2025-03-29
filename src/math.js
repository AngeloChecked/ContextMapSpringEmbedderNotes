export function distance([x1, y1], [x2, y2]) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

export function ellipseIntersection(ellipse, point) {
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

export function springForce([x1, y1], [x2, y2], stiffness, restLength) {
  const [adjacentDeltaX, oppositeDeltaY] = [x1 - x2, y1 - y2]; // translate the system so the spring is at (0,0)
  const distance =
    Math.round(Math.sqrt(adjacentDeltaX ** 2 + oppositeDeltaY ** 2)) + 1;
  const stretch = distance - restLength;
  const force = -stiffness * stretch;
  const [cosOpartX, sinOpartY] = [
    adjacentDeltaX / distance,
    oppositeDeltaY / distance,
  ];
  const [scaledForceX, scaledForceY] = [force * cosOpartX, force * sinOpartY];
  return [scaledForceX, scaledForceY, force, stretch, distance];
}
