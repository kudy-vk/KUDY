// Airport-direction illustrations for the isolated HTML catalog #257.
// Two genuinely vector SVGs: the approved Gdańsk miniature is traced
// without any embedded raster, and the long-nose aircraft has a hairline
// blue contour. Neither icon has a circular badge.
import { iconShapes, svg } from './kit.mjs';

// Historical option #2 retained on the five-option comparison board.
export function airportFlightIcon(direction, size = 28) {
  if (direction !== 'from' && direction !== 'to') {
    throw new RangeError('Unknown airport direction: ' + direction);
  }
  const plane = svg('g',
    direction === 'from' ? { transform: 'rotate(90 12 12)' } : {},
    ...iconShapes('plane'));
  return svg('svg', {
    class: 'icon airport-flight-icon',
    viewBox: '0 0 24 24', width: size, height: size,
    'aria-hidden': 'true',
  }, plane, svg('path', { d: 'M2 22h20' }));
}

function cityMiniature() {
  return svg('g', { class: 'route-vignette route-city' },
    svg('image', {
      class: 'route-city-image',
      href: './city-art-257.svg',
      x: -2, y: -2, width: 53, height: 53,
      preserveAspectRatio: 'xMidYMid meet',
    }));
}

function airplaneMiniature() {
  return svg('g', { class: 'route-vignette route-airplane' },
    svg('image', {
      class: 'route-plane-image',
      href: './airport-airplane-thin-outline-257.svg',
      x: 7, y: 4, width: 34, height: 42,
      preserveAspectRatio: 'xMidYMid meet',
    }));
}

function routeArrow() {
  return svg('g', { class: 'route-journey-arrow' },
    svg('path', { class: 'route-arrow-line',
      d: 'M54 25.5H78M71 18.5L78 25.5L71 32.5' }));
}

// "From": plane → Gdańsk; "To": Gdańsk → plane.
// Asset images are presentational: the native button retains the ARIA label.
export function airportCityRouteIcon(direction, size = 145) {
  if (direction !== 'from' && direction !== 'to') {
    throw new RangeError('Unknown airport direction: ' + direction);
  }
  const first = direction === 'from' ? airplaneMiniature() : cityMiniature();
  const last = direction === 'from' ? cityMiniature() : airplaneMiniature();
  first.setAttribute('transform', 'translate(0 1)');
  last.setAttribute('transform', 'translate(88 1)');

  return svg('svg', {
    class: 'icon airport-route-icon',
    viewBox: '0 0 136 50',
    width: size,
    height: Math.round(size * 50 / 136),
    'aria-hidden': 'true',
  }, first, routeArrow(), last);
}
