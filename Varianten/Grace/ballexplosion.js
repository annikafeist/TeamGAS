let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

let engine, world;
let mainParticle = null;
let trailParticles = [];
let autoParticleCount = 0;
let autoParticles = [];
let blocks = [];
let explosionParticles = [];


function setup() {
  createCanvas(960, 960);
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 1;
  background(100);

let interval = setInterval(() => {
  if (autoParticleCount < 30) {
    // Zentrum der Uhr
    let cx = width / 2;
    let cy = height / 2;

    // Berechne Winkel wie auf einer Uhr (1–12 → 30° Schritte)
    let angle = (autoParticleCount % 30) * 12 - 90;
    let rad = radians(angle);

    // Position an Uhrkante
    let r = 150; // Radius von Uhr
    let x = cx + cos(rad) * r;
    let y = cy + sin(rad) * r;

    let p = new Particle(x, y);
    autoParticles.push(p);

    // Startrichtung nach innen zur Mitte
    let speed = 25; // Erhöhe diesen Wert für mehr "Flugkraft"
    let vx = cos(rad) * speed;
    let vy = sin(rad) * speed;
    Matter.Body.setVelocity(p.body, { x: vx, y: vy });

    autoParticleCount++;
  } else {
    clearInterval(interval);
  }
}, 2000);

   blocks.push(new Block({ x: width / 2, y: height + 25, w: width, h: 50, shape: 'rect', color: 'Lightblue' }, { isStatic: true, restitution: 0.2 }));
    blocks.push(new Block({ x: width / 2, y: -25, w: width, h: 50, shape: 'rect', color: 'silver' }, { isStatic: true, restitution: 0.2 }));
    blocks.push(new Block({ x: -25, y: height / 2, w: 50, h: height, shape: 'rect', color: 'silver' }, { isStatic: true, restitution: 0.2 }));
    blocks.push(new Block({ x: width + 25, y: height / 2, w: 50, h: height, shape: 'rect', color: 'silver' }, { isStatic: true, restitution: 0.2 }));
    }

function draw() {
  background(100, 100, 100, 40);
  Engine.update(engine);
  
  for (let b of blocks) {
  b.show();
}
  for (let i = autoParticles.length - 1; i >= 0; i--) {
  let p = autoParticles[i];
  p.update();
  p.show();
 if (p.opacity < 10 || p.body.position.y > height + 100) {
  // Explosion erzeugen
  for (let j = 0; j < 10; j++) {
    explosionParticles.push(new ExplosionParticle(p.body.position.x, p.body.position.y));
  }
  World.remove(world, p.body);
  autoParticles.splice(i, 1);
}
}

  // 更新主圆
  if (mainParticle) {
    mainParticle.update();
    mainParticle.show();

    if (mainParticle.r < 5 || mainParticle.opacity < 10 || mainParticle.body.position.y > height + 100) {
      World.remove(world, mainParticle.body);
      mainParticle = null;
    }
  }

  // 更新尾巴粒子
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    let p = trailParticles[i];
    p.update();
    p.show();
    if (p.r < 2 || p.opacity < 5) {
      trailParticles.splice(i, 1); // 移除已淡出的
    }
  }

for (let i = explosionParticles.length - 1; i >= 0; i--) {
  let ep = explosionParticles[i];
  ep.update();
  ep.show();
  if (ep.isFinished()) {
    explosionParticles.splice(i, 1);
  }
}  
}

function mouseDragged() {
  if (mainParticle) {
  World.remove(world, mainParticle.body);
  }

  // 创建主圆
  mainParticle = new Particle(mouseX, mouseY);

  // 拷贝一个“静态影子粒子”加入尾巴
  let trail = new TrailParticle(mouseX, mouseY, mainParticle.r);
  trailParticles.push(trail);

  // 限制尾巴长度（保留较多）
  if (trailParticles.length > 60) {
    trailParticles.shift();
  }
}

class Particle {
  constructor(x, y) {
    this.r = random(40, 60);
    this.opacity = 255;
    this.body = Bodies.circle(x, y, this.r, {
      restitution: 1.0,
      friction: 0.05,
    });
    World.add(world, this.body);
  }

  update() {
  this.opacity *= 0.99;
}

  show() {
    let pos = this.body.position;
    push();
    translate(pos.x, pos.y);
    stroke(0);
    strokeWeight(1);
    fill(255, this.opacity);
    ellipse(0, 0, this.r * 2);
    pop();
  }
}

class TrailParticle {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.opacity = 200;
  }

  update() {
    this.r *= 0.98;
    this.opacity *= 0.95;
  }

  show() {
    push();
    translate(this.x, this.y);
    stroke(0);
    strokeWeight(1);
    fill(255, this.opacity);
    ellipse(0, 0, this.r * 2);
    pop();
  }
}

class ExplosionParticle {
  constructor(x, y) {
    this.r = random(3, 6);
    this.opacity = 255;
    this.x = x;
    this.y = y;
    this.vx = random(-5, 5);
    this.vy = random(-5, 5);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.opacity *= 0.95;
  }

  show() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill(255, this.opacity);
    ellipse(0, 0, this.r * 2);
    pop();
  }

  isFinished() {
    return this.opacity < 5;
  }
}



class Block {
  constructor(pos, options) {
    this.w = pos.w;
    this.h = pos.h;
    this.color = pos.color || 'white';
    this.body = Bodies.rectangle(pos.x, pos.y, this.w, this.h, options);
    World.add(world, this.body);
  }

  show() {
    let pos = this.body.position;
    let angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    noStroke();
    fill(this.color);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h);
    pop();
  }
}


