// How each place puts the figure against its ground (pictures.ts): the layers of a scene, back to front.
import { ball, box, cover, type Drawn, floor, FLOOR, house, RADIUS, rest, road, stand, type Standing } from "./picture-parts.ts";
import type { Ground, Place } from "./pictures.ts";

const layers = (d: Drawn, figure: string, behind = false): string => (behind ? d.back + figure + d.front : d.back + d.front + figure);

export const compose: Record<Place, (g: readonly Ground[]) => string> = {
  contained: ([g]) => {
    if (g === "house") {
      const h = house(48, FLOOR, 52, 30);
      return floor() + layers(h, ball(48, rest(FLOOR)));
    }
    const b = box(48, FLOOR, 32, 26, true);
    return floor() + b.back + ball(48, b.top - 5) + b.front;
  },
  "on-surface": ([g]) => {
    const s = stand(g as Standing, 48, FLOOR);
    return floor() + layers(s, ball(48, rest(s.top)));
  },
  under: ([g]) => {
    const ground = g as Standing;
    if (ground === "box") {
      const s = box(48, rest(FLOOR) - RADIUS - 6, 32, 26, false);
      return floor() + layers(s, ball(48, rest(FLOOR)));
    }
    const s = stand(ground, 48, FLOOR);
    return floor() + layers(s, ball(48, rest(FLOOR)), true);
  },
  front: ([g]) => {
    const s = stand(g as Standing, 46, FLOOR);
    return floor() + layers(s, ball(s.right - 6, rest(FLOOR + 6)));
  },
  back: ([g]) => {
    const s = stand(g as Standing, 44, FLOOR);
    return floor() + layers(s, ball(s.right + 1, rest(FLOOR - 5)), true);
  },
  beside: ([g]) => {
    const s = stand(g as Standing, 38, FLOOR);
    return floor() + layers(s, ball(s.right + 4 + RADIUS, rest(FLOOR)));
  },
  near: ([g]) => {
    const s = stand(g as Standing, 31, FLOOR);
    return floor() + layers(s, ball(s.right + 16 + RADIUS, rest(FLOOR - 4)));
  },
  between: ([left, right]) => {
    const l = stand(left as Standing, 20, FLOOR, "small");
    const r = stand(right as Standing, 76, FLOOR, "small");
    return floor() + layers(l, "") + layers(r, ball(48, rest(FLOOR)));
  },
  above: ([g]) => {
    const s = stand(g as Standing, 48, FLOOR);
    return floor() + layers(s, ball(48, s.top - 12 - RADIUS));
  },
  below: ([g]) => {
    const ground = g as Standing;
    if (ground === "box") {
      const s = box(54, 40, 32, 26, false);
      return floor() + layers(s, ball(40, rest(FLOOR)));
    }
    const s = stand(ground, 54, FLOOR, "big", 54);
    return floor() + layers(s, ball(40, rest(FLOOR)));
  },
  across: ([g]) => {
    const s = stand(g as Standing, 75, FLOOR, "small");
    return floor(10, 35) + floor(57, 88) + road(46, 16, 32) + layers(s, ball(20, rest(FLOOR)));
  },
  outside: ([g]) => {
    if (g === "house") {
      const h = house(30, FLOOR, 40, 26);
      return floor() + layers(h, ball(72, rest(FLOOR)));
    }
    const b = box(30, FLOOR, 32, 26, true);
    return floor() + b.back + b.front + ball(72, rest(FLOOR));
  },
  "under-covered": ([g]) => {
    if (g === "cover") {
      const c = cover(48, FLOOR);
      return floor() + ball(57, rest(FLOOR)) + c.front;
    }
    // The ground tipped up on its left side, resting on its right foot, over the ball.
    const b = box(54, FLOOR, 32, 26, false);
    return floor() + ball(36, rest(FLOOR)) + `<g transform="rotate(14 70 ${FLOOR})">${b.front}</g>`;
  },
};
