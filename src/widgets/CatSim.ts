const FPS = 30;
const FRAME_DURATION = 1000 / FPS;

export class Sim {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  crateSprite: HTMLImageElement;
  catSprite: HTMLImageElement;

  lastRenderTime = 0;

  cat: Cat;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    this.ctx.imageSmoothingEnabled = false;

    this.crateSprite = new Image();
    this.crateSprite.src = "/images/cat-sim/crates.png";

    this.catSprite = new Image();
    this.catSprite.src = "/images/cat-sim/cat_sprite_sheet.png";

    this.cat = new Cat(this);
  }

  update(now: DOMHighResTimeStamp) {
    if (this.lastRenderTime && now - this.lastRenderTime < FRAME_DURATION) {
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.lastRenderTime != 0) {
      this.cat.sprite.advance();
    }
    this.cat.draw(this.ctx, 0, 0);

    this.lastRenderTime = now;
  }
}

export interface Obj {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
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

export class Cat {
  sprite: AnimSprite;

  constructor(sim: Sim) {
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
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    this.sprite.draw(ctx, x, y);
  }
}
