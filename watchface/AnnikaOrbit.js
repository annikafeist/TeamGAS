let orbitingBalls = [];
let moleculeBalls = [];
let hourAtoms = [];

const orbitRadius = 450;
const ballRadius = 8;
const secondDuration = 60 * 1000;
let lastBallTime = 0;

let moleculeVelocity = { x: 0.7, y: -0.4 };

function setup() {
  const canvas = createCanvas(960, 960);
  canvas.parent('thecanvas');
  angleMode(RADIANS);
  noStroke();

  // initiale Mischung aus Stunden- und Minutenelementen
  for (let i = 0; i < 24; i++) {
    let angle = random(TWO_PI);
    let r = random(orbitRadius * 0.5);
    let x = width / 2 + r * cos(angle);
    let y = height / 2 + r * sin(angle);
    let isHour = i < 9;
    moleculeBalls.push(new MoleculeBall(x, y, isHour));
  }

  lastBallTime = millis();
  orbitingBalls.push(new OrbitingBall());
}

function draw() {
  background(0);
  drawOrbit();
  drawStartMarker();

  if (millis() - lastBallTime >= secondDuration && orbitingBalls.length < 60) {
    orbitingBalls.push(new OrbitingBall());
    lastBallTime = millis();
  }

  // bewege gesamtes Molekül
  for (let ball of moleculeBalls) {
    ball.x += moleculeVelocity.x;
    ball.y += moleculeVelocity.y;
  }

  // überprüfe Randkollision für das ganze Molekül
  checkMoleculeBoundary();

  for (let orb of orbitingBalls) {
    orb.update();
  }

  for (let ball of moleculeBalls) {
    ball.update();
  }

  for (let hour of hourAtoms) {
    hour.update();
  }

  handleMolecularConnections();
  handleHourConnections();
}

function drawOrbit() {
  stroke(255);
  noFill();
  strokeWeight(2);
  ellipse(width / 2, height / 2, orbitRadius * 2);
}

function drawStartMarker() {
  noStroke();
  fill('#FF5C57');
  ellipse(width / 2, height / 2 - orbitRadius, 12);
}

class OrbitingBall {
  constructor() {
    this.startTime = millis();
    this.fallen = false;
  }

  update() {
    let elapsed = millis() - this.startTime;
    let progress = constrain(elapsed / secondDuration, 0, 1);
    let angle = -HALF_PI + progress * TWO_PI;

    let orbitX = width / 2 + orbitRadius * cos(angle);
    let orbitY = height / 2 + orbitRadius * sin(angle);

    fill(255);
    ellipse(orbitX, orbitY, ballRadius * 2);

    if (!this.fallen && progress >= 1) {
      this.fallen = true;
      let dropR = orbitRadius - ballRadius * 2;
      let dropX = width / 2 + dropR * cos(angle);
      let dropY = height / 2 + dropR * sin(angle);
      moleculeBalls.push(new MoleculeBall(dropX, dropY, false));
      checkHourTransition();
    }
  }
}

class MoleculeBall {
  constructor(x, y, isHour = false) {
    this.x = x;
    this.y = y;
    this.radius = isHour ? 16 : 8;
    this.isHour = isHour;
    this.connections = 0;
  }

  update() {
    fill(this.isHour ? '#00C0FF' : 'white');
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
  }
}

class HourAtom {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.connections = 0;
  }

  update() {
    fill('#00C0FF');
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
  }
}

function handleMolecularConnections() {
  stroke('#FF5C57');
  strokeWeight(1);

  for (let ball of moleculeBalls) {
    ball.connections = 0;
  }

  for (let i = 0; i < moleculeBalls.length; i++) {
    for (let j = i + 1; j < moleculeBalls.length; j++) {
      let a = moleculeBalls[i];
      let b = moleculeBalls[j];
      if (a.connections >= 3 || b.connections >= 3) continue;

      let d = dist(a.x, a.y, b.x, b.y);
      if (d < 80) {
        line(a.x, a.y, b.x, b.y);
        a.connections++;
        b.connections++;
      }
    }
  }
}

function handleHourConnections() {
  stroke('#00C0FF');
  strokeWeight(1.5);

  for (let atom of hourAtoms) {
    atom.connections = 0;
  }

  for (let i = 0; i < hourAtoms.length; i++) {
    for (let j = i + 1; j < hourAtoms.length; j++) {
      let a = hourAtoms[i];
      let b = hourAtoms[j];
      if (a.connections >= 2 || b.connections >= 2) continue;

      let d = dist(a.x, a.y, b.x, b.y);
      if (d < 100) {
        line(a.x, a.y, b.x, b.y);
        a.connections++;
        b.connections++;
      }
    }
  }
}

function getMoleculeCenter(balls) {
  let sumX = 0;
  let sumY = 0;
  for (let b of balls) {
    sumX += b.x;
    sumY += b.y;
  }
  return {
    x: sumX / balls.length,
    y: sumY / balls.length
  };
}

function checkMoleculeBoundary() {
  for (let ball of moleculeBalls) {
    let dx = ball.x - width / 2;
    let dy = ball.y - height / 2;
    let distToCenter = sqrt(dx * dx + dy * dy);
    if (distToCenter + ball.radius > orbitRadius) {
      // Richtung umkehren
      let normalX = dx / distToCenter;
      let normalY = dy / distToCenter;
      let dot = moleculeVelocity.x * normalX + moleculeVelocity.y * normalY;
      moleculeVelocity.x -= 2 * dot * normalX;
      moleculeVelocity.y -= 2 * dot * normalY;
      moleculeVelocity.x *= 0.95;
      moleculeVelocity.y *= 0.95;
      break; // reicht, wenn eine Kugel kollidiert
    }
  }
}

function checkHourTransition() {
  if (moleculeBalls.length >= 60) {
    let center = getMoleculeCenter(moleculeBalls);
    hourAtoms.push(new HourAtom(center.x, center.y));
    moleculeBalls = [];
  }
}
