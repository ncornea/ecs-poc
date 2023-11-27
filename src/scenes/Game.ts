import { addComponent, addEntity, createWorld } from 'bitecs';
import { Format } from '../components/Format';
import { Position } from '../components/Position';
import { Sprite } from '../components/Sprite';
import { createSpriteSystem } from '../systems/SpriteSystem';
import { Cursor } from '../components/Cursor';
import { Click } from '../components/Click';
import { createFlipSystem } from '../systems/FlipSystem';

enum CardSuite {
  SPADES = 0,
  HEARTS = 1,
  CLUBS = 2,
  DIAMONDS = 3,
};

enum CardValue {
  ACE = 0,
  TWO = 1,
  THREE = 2,
  FOUR = 3,
  FIVE = 4,
  SIX = 5,
  SEVEN = 6,
  EIGHT = 7,
  NINE = 8,
  TEN = 9,
  JACK = 10,
  QUEEN = 11,
  KING = 12,
};

type Card = {
  suite: CardSuite;
  value: CardValue;
};

const deck: Card[] = [{
  suite: CardSuite.HEARTS,
  value: CardValue.ACE,
}, {
  suite: CardSuite.HEARTS,
  value: CardValue.KING,
}, {
  suite: CardSuite.DIAMONDS,
  value: CardValue.ACE,
}, {
  suite: CardSuite.DIAMONDS,
  value: CardValue.KING,
},  {
  suite: CardSuite.CLUBS,
  value: CardValue.ACE,
}, {
  suite: CardSuite.CLUBS,
  value: CardValue.KING,
}, {
  suite: CardSuite.SPADES,
  value: CardValue.ACE,
}, {
  suite: CardSuite.SPADES,
  value: CardValue.KING,
}];

const CARD_SPRITE_SHEET_PATH = './assets/cards.png';
const CARD_SPRITE = {
  w: 56.71,
  h: 85,
};

export type TexturePack = {
  textureData: HTMLImageElement;
  spriteSize: {
    w: number;
    h: number;
  };
  packSize: {
    rows: number;
    cols: number;
  };
};

const createTexture = ({ textureData, spriteSize }: TexturePack) => (coords: { x: number, y: number }) => {
  const c = document.createElement('canvas');
  c.width = spriteSize.w;
  c.height = spriteSize.h;

  const ctx = c.getContext('2d');
  if (!ctx) {
    throw new Error('Can\'t get textures, no canvas context available');
  }

  ctx.drawImage(
    textureData,
    coords.x,
    coords.y,
    spriteSize.w,
    spriteSize.h,
    0,
    0,
    spriteSize.w,
    spriteSize.h,
  );

  const sprite = new Image();
  sprite.src = c.toDataURL();

  return sprite;
};

export const game = (config: {} = {}) => {
  const FPS = 60;
  const CANVAS_ID = 'js-canvas';
  const SPACING = 8;
  const SCREEN = {
    w: 640,
    h: 480,
  };

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <canvas
      id="${CANVAS_ID}"
      width="${SCREEN.w}"
      height="${SCREEN.h}"
      style="image-rendering: pixelated; display: block; margin: auto;"
    ></canvas>
  `;

  const canvas: HTMLCanvasElement | null = document.querySelector(`#${CANVAS_ID}`);
  const context = canvas?.getContext('2d');
  if (!canvas || !context) {
    return;
  }

  const inBounds = (
    mX: number = 0,
    mY: number = 0,
  ) =>  (
    {x, y} : {x: number, y: number},
    {col, row}: {col: number, row: number},
  ) => {
    const cXStart = mX + col * CARD_SPRITE.w + col * SPACING;
    const cYStart = mY + row * CARD_SPRITE.h + row * SPACING;

    return (x > cXStart)
      && (x < cXStart + CARD_SPRITE.w)
      && (y > cYStart)
      && (y < cYStart + CARD_SPRITE.h)
  };

  const renderCard = (
    mX: number = 0,
    mY: number = 0,
  ) => (
    col: number,
    row: number,
    texture: HTMLImageElement,
    isHover: boolean = false,
  ) => {
    context.drawImage(
      texture,
      mX + col * CARD_SPRITE.w + col * SPACING,
      mY + row * CARD_SPRITE.h + row * SPACING,
    )

    if (!isHover) {
      return;
    }

    context.strokeStyle = 'yellow';
    context.lineWidth = 3;
    context.lineJoin = 'round';
    context.beginPath();
    context.roundRect(
      mX + col * CARD_SPRITE.w + col * SPACING, 
      mY + row * CARD_SPRITE.h + row * SPACING,
      CARD_SPRITE.w,
      CARD_SPRITE.h,
      4
    );
    context.stroke();
  };

  const preload = () => {
    const texture = new Image();
    texture.src = CARD_SPRITE_SHEET_PATH;
    texture.onload = () => {
      const textureRows = Math.round(texture.height / CARD_SPRITE.h);
      const textureCols = Math.round(texture.width / CARD_SPRITE.w);

      create({
        textureData: texture,
        spriteSize: CARD_SPRITE,
        packSize: {
          rows: textureRows,
          cols: textureCols,
        },
      });
    }
  };

  const update = (updateWorld: () => void) => {
    context.fillStyle = '#3a5a40';
    context.fillRect(0, 0, SCREEN.w, SCREEN.h);

    updateWorld();
  };

  const create = (textures: TexturePack) => {
    const world = createWorld();
    const matchCards = deck.concat(deck);
    const cols = Math.round(Math.sqrt(matchCards.length));
    const mX = (SCREEN.w - cols * CARD_SPRITE.w - cols * SPACING) / 2;
    const mY =  (SCREEN.h - cols * CARD_SPRITE.h - cols * SPACING) / 2;
    const renderCardCenter = renderCard(mX, mY);
    const inBoundsWithMargins = inBounds(mX, mY);
    const createTextureWithData = createTexture(textures);

    const player = addEntity(world);
    addComponent(world, Cursor, player);
    addComponent(world, Click, player);

    matchCards.forEach((c, i) => {
      const card = addEntity(world);

      addComponent(world, Position, card);
      addComponent(world, Format, card);
      addComponent(world, Sprite, card);

      Position.row[card] = Math.floor(i / cols);
      Position.col[card] = i % cols;
      Position.flip[card] = 0;
  
      Format.suite[card] = c.suite;
      Format.value[card] = c.value;
    });

    canvas.addEventListener('mousemove', (e) => {
      Cursor.x[player] = e.offsetX;
      Cursor.y[player] = e.offsetY;
    });

    canvas.addEventListener('click', (e) => {
      Click.x[player] = e.offsetX;
      Click.y[player] = e.offsetY;
    });

    const flipSystem = createFlipSystem(inBoundsWithMargins);
    const spriteSystem = createSpriteSystem(
      createTextureWithData,
      inBoundsWithMargins,
      renderCardCenter,
      textures
    );

    const updateWorld = () => {
      spriteSystem(world);
      flipSystem(world);
    };

    setInterval(() => {
      update(updateWorld);
    }, 1000/FPS);
  };

  preload();
};
