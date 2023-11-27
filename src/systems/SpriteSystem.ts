import { defineQuery, defineSystem, enterQuery, exitQuery } from 'bitecs';
import { Format } from '../components/Format';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { TexturePack } from '../scenes/Game';
import { Cursor } from '../components/Cursor';

export const createSpriteSystem = (
  createTexture: ({x, y}: { x: number, y: number }) => HTMLImageElement,
  inBounds: ({x, y}: { x: number, y: number }, { col, row }: { col: number, row: number }) => boolean,
  render: (col: number, row: number, texture: HTMLImageElement, isHover: boolean) => void,
  texturePack: TexturePack,
) => {
  let spritesById: Record<number, HTMLImageElement> = {}; // TODO: Not a fan of this
  const cursorQuery = defineQuery([Cursor]);
  const spriteQuery = defineQuery([Sprite, Format, Position]);
  const spriteQueryEnter = enterQuery(spriteQuery);
  const spriteQueryExit = exitQuery(spriteQuery);
  const cardBackSprite = createTexture({
    x: 13  * texturePack.spriteSize.w,
    y: 3 * texturePack.spriteSize.h,
  });

  return defineSystem((world) => {
    spriteQueryEnter(world).forEach((entId) => {
      spritesById[entId] = createTexture({
        x: Format.value[entId] * texturePack.spriteSize.w,
        y: Format.suite[entId] * texturePack.spriteSize.h,
      });
    });

    cursorQuery(world).forEach((cEntId) => {
      spriteQuery(world).forEach((entId) => {
        render(
          Position.col[entId],
          Position.row[entId],
          Position.flip[entId] > 0 ? spritesById[entId] : cardBackSprite,
          inBounds({
            x: Cursor.x[cEntId],
            y: Cursor.y[cEntId]
          }, {
            col: Position.col[entId],
            row: Position.row[entId],
          }),
        );
      });
    })

    spriteQueryExit(world).forEach((entId) => {
      spritesById =  Object.keys(spritesById).reduce((acc: typeof spritesById, key) => {
        const parsedKey = parseInt(key);

        if (entId === parsedKey) {
          return acc;
        }

        return {
          ...acc,
          [key]: spritesById[parsedKey],
        };
      }, {});
    });

    // spriteQuery(world);

    return world;
  });
};
