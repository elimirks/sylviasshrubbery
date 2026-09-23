const FPS = 30;
const FRAME_DURATION = 1000 / FPS;

const PIXEL_SCALING: number = 4;
const TILE_SIZE = 16;
const SCALED_TILE_SIZE: number = TILE_SIZE * PIXEL_SCALING;

// Values represented as grid tiles, NOT pixel placements.
interface VirtualFloor {
  gridX: number;
  gridY: number;
  width: number;
}

export enum CanvasDims {
  W512H256 = "512x256",
}

export interface CanvasOpts {
  dims: CanvasDims;
}

export class Sim {
  canvas: HTMLCanvasElement;
  dims: CanvasDims;
  ctx: CanvasRenderingContext2D;

  crateSprite: HTMLImageElement;
  catSprite: HTMLImageElement;

  lastRenderTime = 0;

  cats: Cat[] = [];
  furniture: Furniture[] = [];

  gridHeight: number;
  gridWidth: number;

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

    this.furniture.push(new Crate(this, 0, 0, 0));
    this.furniture.push(new Crate(this, 16 * PIXEL_SCALING, 0, 1));
    this.furniture.push(new Crate(this, 48 * PIXEL_SCALING, 0, 2));
    this.furniture.push(new Crate(this, 64 * PIXEL_SCALING, 0, 3));

    for (const furn of this.furniture) {
      console.log(furn.x(), furn.y(), furn.width(), furn.height());
    }

    if (opts.dims === CanvasDims.W512H256) {
      this.gridWidth = 512 / SCALED_TILE_SIZE;
      this.gridHeight = 256 / SCALED_TILE_SIZE;
    } else {
      throw new Error("Unsupported canvas dimensions:", opts.dims);
    }
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

    for (const furn of this.furniture) {
      furn.draw(this.ctx);
    }
    for (const cat of this.cats) {
      cat.draw(this.ctx);
    }

    this.lastRenderTime = now;
  }

  // TODO:
  // - RNG select the fur colour (from a list of options, maybe).
  // addRandomCat() {
  // }

  // FIXME: this is dog shit AI generated code. Make it better.
  //
  // Select a random crate type, and then decide where it _can_ be placed and select one of those spots.
  // It might be worth creating the "virtual" surfaces list first (where the cat can stand), then each time we add a crate, update the surface list accordingly.
  //
  // TODO: use the computeVirtualFloors function for this
  old_addRandomFurniture() {
    // Build occupancy grid
    const grid: boolean[][] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        grid[y][x] = false;
      }
    }
    // Mark occupied cells
    for (const furn of this.furniture) {
      const ox = Math.floor(furn.x() / SCALED_TILE_SIZE);
      const oy = Math.floor(furn.y() / SCALED_TILE_SIZE);
      const ow = Math.ceil((furn as Crate).width() / TILE_SIZE);
      const oh = Math.ceil((furn as Crate).height() / TILE_SIZE);
      for (let dy = 0; dy < oh; dy++) {
        for (let dx = 0; dx < ow; dx++) {
          const gx = ox + dx;
          const gy = oy + dy;
          if (
            gx >= 0 &&
            gx < this.gridWidth &&
            gy >= 0 &&
            gy < this.gridHeight
          ) {
            grid[gy][gx] = true;
          }
        }
      }
    }

    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const crateIndex = Math.floor(Math.random() * crateSpriteLayout.length);
      const crateLayout = crateSpriteLayout[crateIndex];

      const crateGridW = Math.ceil(crateLayout.width / TILE_SIZE);
      const crateGridH = Math.ceil(crateLayout.height / TILE_SIZE);

      const gridX = Math.floor(
        Math.random() * (this.gridWidth - crateGridW + 1),
      );
      const gridY = Math.floor(
        Math.random() * (this.gridHeight - crateGridH + 1),
      );

      // Check if all cells for this crate are empty
      let canPlace = true;
      for (let dy = 0; dy < crateGridH; dy++) {
        for (let dx = 0; dx < crateGridW; dx++) {
          const gx = gridX + dx;
          const gy = gridY + dy;
          if (
            gx < 0 ||
            gx >= this.gridWidth ||
            gy < 0 ||
            gy >= this.gridHeight ||
            grid[gy][gx]
          ) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }
      if (!canPlace) continue;

      // Check for "grounded" placement: every cell under the bottom edge must be at the bottom or have something below
      let grounded = true;
      const bottomY = gridY + crateGridH - 1;
      for (let dx = 0; dx < crateGridW; dx++) {
        const gx = gridX + dx;
        // If at bottom row, it's grounded
        if (bottomY === this.gridHeight - 1) continue;
        // Otherwise, must have something directly below
        if (!grid[bottomY + 1][gx]) {
          grounded = false;
          break;
        }
      }
      if (!grounded) continue;

      // Place crate
      const x = gridX * SCALED_TILE_SIZE;
      const y = gridY * SCALED_TILE_SIZE;
      const newFurn = new Crate(this, x, y, crateIndex) as Furniture;
      this.furniture.push(newFurn);
      return;
    }
    // If we get here, couldn't find a spot after maxAttempts
  }

  addRandomFurniture() {
    const floors = computeVirtualFloors(
      this.furniture, this.gridWidth, this.gridHeight);
    const occupiedTiles = computeOccupiedTiles(
      this.furniture, this.gridWidth, this.gridHeight);

    const crateIndex = Math.floor(Math.random() * crateSpriteLayout.length);
    const crateDims = crateSpriteLayout[crateIndex];
    const crateGridWidth = Math.ceil(crateDims.width / TILE_SIZE);
    const crateGridHeight = Math.ceil(crateDims.height / TILE_SIZE);

    // TODO: finish this function
  }
}

// Returns a flattened grid of occupied tiles. Used for new RNG tile placements
function computeOccupiedTiles(
  furniture: Furniture[],
  gridWidth: number,
  gridHeight: number,
): number[] {
  const occupied: number[] = new Array(gridWidth * gridHeight).fill(0);

  for (const furn of furniture) {
    const fx = Math.floor(furn.x() / SCALED_TILE_SIZE);
    const fw = Math.ceil(furn.width() / SCALED_TILE_SIZE);
    const fy = Math.floor(furn.y() / SCALED_TILE_SIZE);
    const fh = Math.ceil(furn.height() / SCALED_TILE_SIZE);

    for (let dy = 0; dy < fh; dy++) {
      for (let dx = 0; dx < fw; dx++) {
        const gridX = fx + dx;
        const gridY = fy + dy;
        if (
          gridX >= 0 &&
          gridX < gridWidth &&
          gridY >= 0 &&
          gridY < gridHeight
        ) {
          occupied[gridY * gridWidth + gridX] = 1;
        }
      }
    }
  }
  return occupied;
}

function computeVirtualFloors(
  furniture: Furniture[],
  gridWidth: number,
  gridHeight: number,
): VirtualFloor[] {
  // Map: gridY -> list of [xStart, xEnd)
  const rowIntervals = new Map<number, Array<[number, number]>>();

  for (const furn of furniture) {
    const fx = Math.floor(furn.x() / SCALED_TILE_SIZE);
    const fw = Math.ceil(furn.width() / SCALED_TILE_SIZE);
    const fy = Math.floor(furn.y() / SCALED_TILE_SIZE);

    const gridY = fy;
    const xStart = Math.max(0, fx);
    const xEnd = Math.min(gridWidth, fx + fw);

    if (gridY >= 0 && gridY < gridHeight && xStart < xEnd) {
      const intervals = rowIntervals.get(gridY) ?? [];
      intervals.push([xStart, xEnd]);
      rowIntervals.set(gridY, intervals);
    }
  }

  const floors: VirtualFloor[] = [];

  // For each row, merge intervals and create VirtualFloor entries
  for (const [gridY, intervals] of rowIntervals.entries()) {
    // Sort intervals by xStart
    intervals.sort((a, b) => a[0] - b[0]);
    let [curStart, curEnd] = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const [nextStart, nextEnd] = intervals[i];
      if (nextStart <= curEnd) {
        // Overlapping or adjacent, merge
        curEnd = Math.max(curEnd, nextEnd);
      } else {
        // No overlap, push current and start new
        floors.push({ gridX: curStart, gridY, width: curEnd - curStart });
        [curStart, curEnd] = [nextStart, nextEnd];
      }
    }
    // Push last interval
    floors.push({ gridX: curStart, gridY, width: curEnd - curStart });
  }

  // Add the bottom floor as a single surface
  floors.push({ gridX: 0, gridY: gridHeight, width: gridWidth });

  return floors;
}

// TODO: move to a new test file or something. Also maybe it's worth using a test framework
function testComputeVirtualFloors() {
  function makeFurniture(
    x: number,
    y: number,
    w: number,
    h: number,
  ): Furniture {
    return {
      x: () => x,
      y: () => y,
      width: () => w,
      height: () => h,
      draw: () => {},
    };
  }

  function prettyPrint(label: string, result: any) {
    console.log(label, JSON.stringify(result, null, 2));
  }

  // Test 1: Single furniture, fits in one tile
  let furniture = [makeFurniture(0, 0, 16, 16)];
  let result = computeVirtualFloors(furniture, 4, 4);
  prettyPrint("Test 1:", result);
  // Expected: [{gridX:0, gridY:0, width:1}, {gridX:0, gridY:4, width:4}]

  // Test 2: Two adjacent furniture, should merge
  furniture = [makeFurniture(0, 0, 16, 16), makeFurniture(16, 0, 16, 16)];
  result = computeVirtualFloors(furniture, 4, 4);
  prettyPrint("Test 2:", result);
  // Expected: [{gridX:0, gridY:0, width:2}, {gridX:0, gridY:4, width:4}]

  // Test 3: Two separated furniture
  furniture = [makeFurniture(0, 0, 16, 16), makeFurniture(32, 0, 16, 16)];
  result = computeVirtualFloors(furniture, 4, 4);
  prettyPrint("Test 3:", result);
  // Expected: [{gridX:0, gridY:0, width:1}, {gridX:2, gridY:0, width:1}, {gridX:0, gridY:4, width:4}]

  // Test 4: Overlapping furniture (should merge)
  furniture = [makeFurniture(0, 0, 32, 16), makeFurniture(16, 0, 32, 16)];
  result = computeVirtualFloors(furniture, 4, 4);
  prettyPrint("Test 4:", result);
  // Expected: [{gridX:0, gridY:0, width:3}, {gridX:0, gridY:4, width:4}]

  // Test 5: Furniture on different rows
  furniture = [makeFurniture(0, 0, 16, 16), makeFurniture(16, 16, 16, 16)];
  result = computeVirtualFloors(furniture, 4, 4);
  prettyPrint("Test 5:", result);
  // Expected: [{gridX:0, gridY:0, width:1}, {gridX:1, gridY:1, width:1}, {gridX:0, gridY:4, width:4}]

  // Test 6: Furniture wider than one tile
  furniture = [makeFurniture(0, 0, 32, 16)];
  result = computeVirtualFloors(furniture, 4, 4);
  prettyPrint("Test 6:", result);
  // Expected: [{gridX:0, gridY:0, width:2}, {gridX:0, gridY:4, width:4}]

  // Test 7: No furniture
  furniture = [];
  result = computeVirtualFloors(furniture, 4, 4);
  prettyPrint("Test 7:", result);
  // Expected: [{gridX:0, gridY:4, width:4}]
}

export interface Furniture {
  draw(ctx: CanvasRenderingContext2D): void;
  // Values represented in pixels, NOT grid tiles.
  x(): number;
  y(): number;
  width(): number;
  height(): number;
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

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    layoutIndex: number,
  ) {
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

    this.sprite = new AnimSprite(
      sim.catSprite,
      sequences,
      32,
      32,
      PIXEL_SCALING,
    );
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

const crateSpriteLayout = [
  // I'm not crazy about these two crate types
  // {
  //   x: 0,
  //   y: 0,
  //   width: 16,
  //   height: 16,
  // },
  // {
  //   x: 16,
  //   y: 0,
  //   width: 16,
  //   height: 16,
  // },
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
    y: 48,
    width: 32,
    height: 16,
  },
];

export class Crate {
  sprite: StaticSprite;
  _x: number;
  _y: number;
  crateIndex: number;

  constructor(sim: Sim, x: number, y: number, crateIndex: number) {
    this._x = x;
    this._y = y;
    this.crateIndex = crateIndex;
    this.sprite = new StaticSprite(
      sim.crateSprite,
      crateSpriteLayout,
      PIXEL_SCALING,
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
    return crateSpriteLayout[this.crateIndex]?.width ?? 16;
  }

  height(): number {
    return crateSpriteLayout[this.crateIndex]?.height ?? 16;
  }
}
