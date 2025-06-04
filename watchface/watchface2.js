let orbitingBalls = [];
let moleculeBalls = [];

const orbitRadius = 450;
const ballRadius = 8;
const secondDuration = 60 * 1000;
let lastBallTime = 0;

function setup() {
  const canvas = createCanvas(960, 960);
  canvas.parent('thecanvas');
  angleMode(RADIANS);
  noStroke();

  // Init: 9 Stunden- und 15 Minutenkugeln zufällig gemischt
for (let i = 0; i < 24; i++) {
  let r = random(orbitRadius * 0.6);
  let angle = random(TWO_PI);
  let x = width / 2 + r * cos(angle);
  let y = height / 2 + r * sin(angle);
  let isHour = i < 9;
  moleculeBalls.push(new MoleculeBall(x, y, isHour));
}

  // Init: eine rotierende Kugel aktiv
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

  let center = getMoleculeCenter(moleculeBalls);
  for (let ball of moleculeBalls) {
    ball.update(center);
  }

  handleMolecularConnections();
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

    let x = width / 2 + orbitRadius * cos(angle);
    let y = height / 2 + orbitRadius * sin(angle);

    fill(255);
    ellipse(x, y, ballRadius * 2);

    if (!this.fallen && progress >= 1) {
      this.fallen = true;
      moleculeBalls.push(new MoleculeBall(x, y, false)); // hat vx/vy – OK
    }    
  }
}

class MoleculeBall {
  constructor(x, y, isHour = false) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);   // ➜ sorgt für Bewegung
    this.vy = random(-1, 1);
    this.radius = isHour ? 16 : 8;
    this.isHour = isHour;
  }

  update(center) {
    this.x += this.vx;
    this.y += this.vy;
  
    // Rückstellkraft zum Molekülzentrum
    let dx = this.x - center.x;
    let dy = this.y - center.y;
    this.vx -= dx * 0.001;
    this.vy -= dy * 0.001;
  
    // Begrenzung durch Außenkreis
    let cx = width / 2;
    let cy = height / 2;
    let distToCenter = dist(this.x, this.y, cx, cy);
    if (distToCenter + this.radius > orbitRadius) {
      let normalX = (this.x - cx) / distToCenter;
      let normalY = (this.y - cy) / distToCenter;
      let dot = this.vx * normalX + this.vy * normalY;
      this.vx -= 2 * dot * normalX;
      this.vy -= 2 * dot * normalY;
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
  
    fill(this.isHour ? '#00C0FF' : 'white');
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
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

function handleMolecularConnections() {
  stroke('#FF5C57');
  strokeWeight(1);
  for (let i = 0; i < moleculeBalls.length; i++) {
    for (let j = i + 1; j < moleculeBalls.length; j++) {
      let a = moleculeBalls[i];
      let b = moleculeBalls[j];
      line(a.x, a.y, b.x, b.y);
    }
  }
}


let hourAtoms = [];

function checkHourTransition() {
  if (moleculeBalls.length >= 60) {
    // berechne Schwerpunkt des Moleküls
    let sumX = 0;
    let sumY = 0;
    for (let b of moleculeBalls) {
      sumX += b.x;
      sumY += b.y;
    }
    let avgX = sumX / moleculeBalls.length;
    let avgY = sumY / moleculeBalls.length;

    // füge neue Stundenkugel hinzu
    hourAtoms.push(new HourAtom(avgX, avgY));

    // Minutenkugeln zurücksetzen
    moleculeBalls = [];
  }
}

class HourAtom {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.radius = 16;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Begrenzung durch Außenkreis
    let dx = this.x - width / 2;
    let dy = this.y - height / 2;
    let distToCenter = sqrt(dx * dx + dy * dy);

    if (distToCenter + this.radius > orbitRadius) {
      let normalX = dx / distToCenter;
      let normalY = dy / distToCenter;
      let dot = this.vx * normalX + this.vy * normalY;
      this.vx -= 2 * dot * normalX;
      this.vy -= 2 * dot * normalY;
      this.vx *= 0.9;
      this.vy *= 0.9;
    }

    // zeichne Kugel
    fill('#00C0FF');
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
  }
}

function handleHourConnections() {
  stroke('#00C0FF');
  strokeWeight(1.5);
  for (let i = 0; i < hourAtoms.length; i++) {
    for (let j = i + 1; j < hourAtoms.length; j++) {
      let a = hourAtoms[i];
      let b = hourAtoms[j];
      let d = dist(a.x, a.y, b.x, b.y);
      if (d < a.radius + b.radius + 40) {
        line(a.x, a.y, b.x, b.y);
      }
    }
  }
}

