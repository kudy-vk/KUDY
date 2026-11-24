// MAP-10: approved historical Gdańsk menu artwork.
// Hit masks and reveal silhouettes remain the ones in the original menu package.
export const historicalMenuAssets = {
  'nearby': {city:require('./historical/pieces/nearby.png'),ui:require('./historical/pieces/nearby--ui.png'),light:require('../menu-map-city-only/pieces/nearby--light.png')},
  'guides': {city:require('./historical/pieces/guides.png'),ui:require('./historical/pieces/guides--ui.png'),light:require('../menu-map-city-only/pieces/guides--light.png')},
  'discovery': {city:require('./historical/pieces/discovery.png'),ui:require('./historical/pieces/discovery--ui.png'),light:require('../menu-map-city-only/pieces/discovery--light.png')},
  'reserve-1': {city:require('./historical/pieces/reserve-1.png'),ui:require('./historical/pieces/reserve-1--ui.png'),light:require('../menu-map-city-only/pieces/reserve-1--light.png')},
  'kudy': {city:require('./historical/pieces/kudy.png'),ui:require('./historical/pieces/kudy--ui.png'),light:require('../menu-map-city-only/pieces/kudy--light.png')},
} as const;
export const historicalSceneAssets = {
  water:require('./historical/layers/water.png'),
  fortifications:require('./historical/layers/fortifications.png'),
} as const;
