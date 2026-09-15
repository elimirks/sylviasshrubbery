const FPS = 30;
const FRAME_DURATION = 1000 / FPS;

const PIXEL_SCALING: number = 4;
const CRATE_BASE_SIZE = 16;
const GRID_SIZE: number = CRATE_BASE_SIZE * PIXEL_SCALING;

type Tile = [number, number];

export enum CanvasDims {
  W512H256 = "512x256",
};

export interface CanvasOpts {
  dims: CanvasDims;
};

export class Sim {
  canvas: HTMLCanvasElement;
  dims: CanvasDims;
  ctx: CanvasRenderingContext2D;

  crateSprite: HTMLImageElement;
  catSprite: HTMLImageElement;

  lastRenderTime = 0;

  cats: Cat[] = [];
  objs: Obj[] = [];

  constructor(canvas: HTMLCanvasElement, opts: CanvasOpts) {
    this.canvas = canvas;
    this.dims = opts.dims;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.ctx.imageSmoothingEnabled = false;

    this.crateSprite = new Image();
    this.crateSprite.src = "/images/cat-sim/crates.png";

    this.catSprite = new Image();
    this.catSprite.src = "/images/cat-sim/cat_sprite_sheet.png";

    const cat1 = new Cat(this, 100, 10);
    cat1.sprite.setSequence(0);
    this.cats.push(cat1);
  }

  update(now: DOMHighResTimeStamp) {
    if (this.lastRenderTime && now - this.lastRenderTime < FRAME_DURATION) {
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.lastRenderTime != 0) {
      for (let cat of this.cats) {
        cat.sprite.advance();
      }
    }

    for (const obj of this.objs) {
      obj.draw(this.ctx, obj.x(), obj.y());
    }
    for (const cat of this.cats) {
      cat.draw(this.ctx);
    }

    this.lastRenderTime = now;
  }

  /// TODO:
  /// ```typescript
  /// addRandomCat() {
  /// }
  /// ```

  addRandomFurniture() {
    let width: number;
    let height: number;

    if (this.dims == CanvasDims.W512H256) {
      width = 512;
      height = 256;
    }

    let newFurn = new Crate(this, 200, 100, 5) as Obj;
    this.objs.push(newFurn);
  }
}

export interface Obj {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  x(): number;
  y(): number;
}

// TODO: consider storing `len` instead of `end`
interface AnimSequence {
  start: number;
  end: number;
}

export class AnimSprite {
  sprite: HTMLImageElement;
  width: number;
  height: number;

  scaling: number;
  frameHeight: number;
  frameWidth: number;

  shouldLoop: boolean = true;
  sequenceNum: number = 0;
  sequenceFrame: number = 0;

  sequences: AnimSequence[];

  constructor(
    sprite: HTMLImageElement,
    sequences: AnimSequence[],
    frameWidth: number,
    frameHeight: number,
    scaling: number,
  ) {
    this.sprite = sprite;
    this.width = this.sprite.width;
    this.height = this.sprite.height;

    this.sequences = sequences;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.scaling = scaling;

    if (this.sequences.length === 0) {
      throw new Error("AnimSprite must have at least one sequence");
    }
    if (this.scaling <= 0) {
      throw new Error("Scaling must be greater than 0");
    }
    if (Math.log2(this.scaling) % 1 !== 0) {
      throw new Error("Scaling must be a power of 2");
    }
  }

  setSequence(sequenceNum: number) {
    if (sequenceNum < 0 || sequenceNum >= this.sequences.length) {
      throw new Error("Invalid sequence number");
    }

    this.sequenceNum = sequenceNum;
    this.sequenceFrame = 0;
  }

  advance() {
    const seq = this.sequences[this.sequenceNum];
    const sequenceLength = seq.end - seq.start + 1;
    if (this.sequenceFrame == sequenceLength && !this.shouldLoop) {
      return;
    }
    this.sequenceFrame = (this.sequenceFrame + 1) % sequenceLength;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const seq = this.sequences[this.sequenceNum];
    const absFrame = seq.start + this.sequenceFrame;
    const sx = (absFrame * this.frameWidth) % this.width;
    const sy =
      Math.floor((absFrame * this.frameWidth) / this.width) * this.frameHeight;

    ctx.drawImage(
      this.sprite,
      sx,
      sy,
      this.frameWidth,
      this.frameHeight,
      x,
      y,
      this.frameWidth * this.scaling,
      this.frameHeight * this.scaling,
    );
  }
}

interface StaticSpriteLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class StaticSprite {
  sprite: HTMLImageElement;
  width: number;
  height: number;

  scaling: number;

  layout: StaticSpriteLayout[];

  constructor(
    sprite: HTMLImageElement,
    layout: StaticSpriteLayout[],
    scaling: number,
  ) {
    this.sprite = sprite;
    this.width = this.sprite.width;
    this.height = this.sprite.height;
    
    this.layout = layout;
    this.scaling = scaling;

    if (this.layout.length === 0) {
      throw new Error("StaticSprite must have at least one layout");
    }
    if (this.scaling <= 0) {
      throw new Error("Scaling must be greater than 0");
    }
    if (Math.log2(this.scaling) % 1 !== 0) {
      throw new Error("Scaling must be a power of 2");
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, layoutIndex: number) {
    if (layoutIndex < 0 || layoutIndex >= this.layout.length) {
      throw new Error("Invalid layout index");
    }

    const layout = this.layout[layoutIndex];

    ctx.drawImage(
      this.sprite,
      layout.x,
      layout.y,
      layout.width,
      layout.height,
      x,
      y,
      layout.width * this.scaling,
      layout.height * this.scaling,
    );
  }
}

export class Cat {
  sprite: AnimSprite;
  _x: number;
  _y: number;

  constructor(sim: Sim, x: number = 0, y: number = 0) {
    // TODO: support variable duration sequences.
    // Some of the anim frames should take longer than others!
    const sequences: AnimSequence[] = [
      {
        start: 0,
        end: 3,
      },
      {
        start: 8,
        end: 11,
      },
      {
        start: 16,
        end: 19,
      },
      {
        start: 24,
        end: 27,
      },
      {
        start: 32,
        end: 39,
      },
      {
        start: 40,
        end: 47,
      },
      {
        start: 48,
        end: 51,
      },
      {
        start: 56,
        end: 56 + 5,
      },
      {
        start: 64,
        end: 64 + 6,
      },
      {
        start: 72,
        end: 79,
      },
    ];

    this.sprite = new AnimSprite(sim.catSprite, sequences, 32, 32, 4);
    this._x = x;
    this._y = y;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.sprite.draw(ctx, this._x, this._y);
  }

  x(): number {
    return this._x;
  }

  y(): number {
    return this._y;
  }
}

export class Crate {
  sprite: StaticSprite;
  _x: number;
  _y: number;
  crateIndex: number;

  constructor(
    sim: Sim,
    x: number,
    y: number,
    crateIndex: number,
  ) {
    this._x = x;
    this._y = y;
    this.crateIndex = crateIndex;

    const spriteLayout = [
      {
        x: 0,
        y: 0,
        width: 16,
        height: 16,
      },
      {
        x: 16,
        y: 0,
        width: 16,
        height: 16,
      },
      {
        x: 0,
        y: 16,
        width: 16,
        height: 16,
      },
      {
        x: 16,
        y: 16,
        width: 32,
        height: 32,
      },
      {
        x: 0,
        y: 32,
        width: 16,
        height: 32,
      },
      {
        x: 16,
        y: 16,
        width: 32,
        height: 32,
      },
      {
        x: 16,
        y: 48,
        width: 32,
        height: 16,
      },
    ];
    this.sprite = new StaticSprite(
      sim.crateSprite,
      spriteLayout,
      4,
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.sprite.draw(ctx, this._x, this._y, this.crateIndex);
  }

  x(): number {
    return this._x;
  }

  y(): number {
    return this._y;
  }

  width(): number {
    const layout = [
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 32 },
      { width: 16 },
      { width: 32 },
      { width: 32 },
    ];
    return layout[this.crateIndex]?.width ?? 16;
  }

  height(): number {
    const layout = [
      { height: 16 },
      { height: 16 },
      { height: 16 },
      { height: 32 },
      { height: 32 },
      { height: 32 },
      { height: 16 },
    ];
    return layout[this.crateIndex]?.height ?? 16;
  }
}
