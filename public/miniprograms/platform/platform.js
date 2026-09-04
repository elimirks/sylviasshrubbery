function Block(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.gravity = 0.03 * 9.8; // universal gravity constant

  this.$element = $("<div/>")
    .addClass("block")
    .width(this.width)
    .height(this.height)
    .offset({
      top: this.y,
      left: this.x,
    });
}

Block.prototype.addToContainer = function ($container) {
  $container.append(this.$element);
};

Block.prototype.update = function (game) {
  this.$element.offset({
    top: this.y,
    left: this.x,
  });
};

// Test if this block intersects with the given region
Block.prototype.hitTest = function (x, y, width, height) {
  if (x + width < this.x || x > this.x + this.width) {
    return false;
  } else if (y + height < this.y || y > this.y + this.height) {
    return false;
  }
  return true;
};

function Player(x, y) {
  Block.call(this, x, y, 32, 32);
  this.velocityX = 0;
  this.velocityY = 0;
  this.flying = false;
  this.leftPressed = false;
  this.rightPressed = false;

  this.terminalY = 30 * this.gravity;
  this.terminalX = 20 * this.gravity;

  this.bindKeys();

  this.$element.addClass("player");
}
Player.prototype = Object.create(Block.prototype);
Player.prototype.constructor = Block;

Player.prototype.bindKeys = function () {
  var that = this;
  $(document).keydown(function (e) {
    switch (e.which) {
      case 37: // left
        that.leftPressed = true;
        break;
      case 38: // up
        that.flying = true;
        break;
      case 39: // right
        that.rightPressed = true;
        break;
      default:
        return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
  });
  $(document).keyup(function (e) {
    switch (e.which) {
      case 37: // left
        that.leftPressed = false;
        break;
      case 38: // up
        that.flying = false;
        break;
      case 39: // right
        that.rightPressed = false;
        break;
      default:
        return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
  });
};

Player.prototype.update = function (game) {
  var newVelocityX = this.velocityX;
  var newVelocityY = this.velocityY;

  if (this.flying) {
    newVelocityY -= 0.3 * this.gravity;
  } else {
    newVelocityY += this.gravity;
  }

  if (this.leftPressed && !this.rightPressed) {
    newVelocityX -= 0.1;
  } else if (!this.leftPressed && this.rightPressed) {
    newVelocityX += 0.1;
  } else {
    // "Slow down" horizontally
    newVelocityX /= 1.1;
  }

  var newVelocityX = Math.max(
    Math.min(newVelocityX, this.terminalX),
    -this.terminalX,
  );
  var newVelocityY = Math.max(
    Math.min(newVelocityY, this.terminalY),
    -this.terminalY,
  );

  game.tryChangingVelocity(this, newVelocityX, newVelocityY);
  game.updateCamera(this.x, this.y);

  Block.prototype.update.call(this, game);
};

function Game($container) {
  this.$container = $container;
  this.blocks = [
    new Player(32 * 2, 0),
    new Block(32 * 1, 32 * 10, 32 * 10, 32 * 5),
    new Block(32 * 10, 32 * 5, 32 * 10, 32 * 2),
    new Block(32 * 30, 32 * 7, 32 * 10, 32 * 2),
  ];
}

// Expects a "movable" block - that is, a block with velocityX and velocityY
// Handles collisions n' stuff
Game.prototype.tryChangingVelocity = function (block, newVx, newVy) {
  // Primitive colision detection rn... o whale.
  var newX = block.x + newVx;
  var newY = block.y + newVy;

  if (this.hitTest(block, newX, block.y)) {
    block.velocityX = 0;
  } else {
    block.x = newX;
    block.velocityX = newVx;
  }

  if (this.hitTest(block, block.x, newY)) {
    block.velocityY = 0;
  } else {
    block.y = newY;
    block.velocityY = newVy;
  }
};

Game.prototype.hitTest = function (block, newX, newY) {
  for (var i = 0; i < this.blocks.length; i++) {
    var otherBlock = this.blocks[i];
    if (otherBlock === block) {
      continue;
    }

    if (otherBlock.hitTest(newX, newY, block.width, block.height)) {
      return true;
    }
  }
  return false;
};

Game.prototype.addDom = function () {
  for (var i = 0; i < this.blocks.length; i++) {
    this.blocks[i].addToContainer(this.$container);
  }
};

Game.prototype.update = function () {
  for (var i = 0; i < this.blocks.length; i++) {
    this.blocks[i].update(this);
  }
};

Game.prototype.updateCamera = function (x, y) {
  /* janky solution
    for (var i = 0; i < this.blocks.length; i++) {
        this.blocks[i].x += 0.1;
    }
    */
  //this.$container.css('margin-left', '-32px');
  //this.$container.css('margin-top', 0);
};

function init($container) {
  var game = new Game($container);
  game.addDom();

  // Game loop
  setInterval(function () {
    game.update();
  }, 10);
}
