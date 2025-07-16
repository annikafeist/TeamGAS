let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

let engine, world;
let mainParticle = null;
let trailParticles = [];
let secondTrailGroups = [];
let hourHand, minuteHand, secondHand;


function setup() {
  createCanvas(960, 960);
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 1;
  background(100);

  // Uhrenzeiger initialisieren
  secondHand = new ClockHand(300, 4, () => color(255));
  minuteHand = new ClockHand(200, 6, () => color(255));
  hourHand = new ClockHand(120, 8, () => color(255));
  background(100);
}



function draw() {
  background(100);
  Engine.update(engine);

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
    drawClockArms();
    updateSecondBalls();


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
      restitution: 0.5,
      friction: 0.05,
    });
    World.add(world, this.body);
  }

  update() {
    this.r *= 0.995;
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

function drawClockArms() {
  let s = second();
  let m = minute();
  let h = hour() % 12;

  let secAngle = map(s, 0, 60, 0, TWO_PI);
  let minAngle = map(m, 0, 60, 0, TWO_PI);
  let hourAngle = map(h + m / 60, 0, 12, 0, TWO_PI);

  secondHand.update(secAngle);
  minuteHand.update(minAngle);
  hourHand.update(hourAngle);

  secondHand.show();
  minuteHand.show();
  hourHand.show();
}


function drawArm(angle, length, col) {
  push();
  rotate(angle - HALF_PI); // 12 Uhr nach oben
  stroke(col);
  strokeWeight(8);
  line(0, 0, length, 0); // einfacher Zeiger
  pop();
}

function updateSecondBalls() {
  let currentSecond = second();

  // Eintrag nur einmal pro Sekunde
  if (!secondTrailGroups[currentSecond]) {
    secondTrailGroups[currentSecond] = [];

    // Spiralparameter
    let a = 40;
    let b = 10;
    let angle = currentSecond * (PI / 6);
    let r = a + b * currentSecond;

    let cx = width / 2;
    let cy = height / 2;
    let x = cx + cos(angle) * r;
    let y = cy + sin(angle) * r;

    // Neue TrailParticle erzeugen
    let tp = new TrailParticle(x, y, 12);
    secondTrailGroups[currentSecond].push(tp);
  }

  // Alle TrailParticles updaten und anzeigen
  for (let group of secondTrailGroups) {
    if (!group) continue;

    for (let i = group.length - 1; i >= 0; i--) {
      let p = group[i];
      p.update();
      p.show();
      if (p.r < 2 || p.opacity < 5) {
        group.splice(i, 1); // Entfernen wenn zu klein oder transparent
      }
    }
  }
}

class ClockHand {
  constructor(length, thickness, colorFunc) {
    this.length = length;
    this.thickness = thickness;
    this.colorFunc = colorFunc; // Funktion, die dir z.B. die Farbe zurückgibt
    this.angle = 0;
  }

  update(angle) {
    this.angle = angle;
  }

  show() {
    push();
    translate(width / 2, height / 2); // Mittelpunkt der Uhr
    rotate(this.angle - HALF_PI); // 12 Uhr = oben
    stroke(this.colorFunc());
    strokeWeight(this.thickness);
    line(0, 0, this.length, 0);
    pop();
  }
}
