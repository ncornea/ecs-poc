import { defineSystem, defineQuery } from 'bitecs';
import { Click } from '../components/Click';
import { Position } from '../components/Position';

export const createFlipSystem = (
  inBounds: ({x, y}: { x: number, y: number }, { col, row }: { col: number, row: number }) => boolean,
) => {
  const clickQuery = defineQuery([Click]);
  const positionQuery = defineQuery([Position]);

  return defineSystem((world) => {
    const posEntities = positionQuery(world);
    const flippedEntities = posEntities.filter(pe => Position.flip[pe] > 0);

    clickQuery(world).forEach((clickId) => {
      posEntities.forEach((entId) => {
        if (inBounds(
          {x: Click.x[clickId], y: Click.y[clickId]},
          {col: Position.col[entId], row: Position.row[entId]},
        )) {
          Position.flip[entId] = 1;
        }

        if (flippedEntities.length > 2 && flippedEntities.includes(entId)) {
          Position.flip[entId] = 0;
        }
      })
    });

    return world;
  });
};
