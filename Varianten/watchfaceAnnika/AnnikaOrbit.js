let orbitingBalls = [];
let moleculeBalls = [];
let hourAtoms = [];

const orbitRadius = 450;
const ballRadius = 8;
const secondDuration = 60 * 1000;
let lastBallTime = 0;

let moleculeVelocity = { x: 0.7, y: -0.4 };

  // apply rotation of device to gravity
  // engine.gravity.x = (rotationY / 2 - engine.gravity.x) * 0.5;
  // engine.gravity.y = (rotationX / 2 - engine.gravity.y) * 0.5;

function setup() {
  const canvas = createCanvas(960, 960);
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
    // ball.x += moleculeVelocity.x;
    // ball.y += moleculeVelocity.y;
  // apply rotation of device to gravity
  ball.x += (rotationY / 2 - ball.x) * 0.5;
  ball.y += (rotationX / 2 - ball.y) * 0.5;
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
    
      if (!isTooClose(dropX, dropY, ballRadius, 10)) {
        moleculeBalls.push(new MoleculeBall(dropX, dropY, false));
        checkHourTransition();
      }
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

function checkHourTransition() {
  if (moleculeBalls.length >= 60) {
    let center = getMoleculeCenter(moleculeBalls);

    if (!isTooClose(center.x, center.y, 16, 10)) {
      hourAtoms.push(new HourAtom(center.x, center.y));
    }

    moleculeBalls = [];
  }
}

function handleMolecularConnections() {
  stroke('#FF5C57');
  strokeWeight(1);

  // Reset
  for (let ball of moleculeBalls) {
    ball.connections = 0;
  }

  // Schritt 1: Sortiere Bälle kreisförmig (z. B. nach Winkel vom Mittelpunkt)
  let center = getMoleculeCenter(moleculeBalls);
  let sorted = moleculeBalls.slice().sort((a, b) => {
    let angleA = atan2(a.y - center.y, a.x - center.x);
    let angleB = atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });

  // Schritt 2: Verbinde sie ringförmig
  for (let i = 0; i < sorted.length; i++) {
    let a = sorted[i];
    let b = sorted[(i + 1) % sorted.length]; // Ring schließen
    if (a.connections < 3 && b.connections < 3) {
      line(a.x, a.y, b.x, b.y);
      a.connections++;
      b.connections++;
    }
  }

  // Optional: weitere Verbindungen, um Verzweigungen hinzuzufügen (z. B. Nachbarn 2 Schritte entfernt)
  for (let i = 0; i < sorted.length; i++) {
    let a = sorted[i];
    let b = sorted[(i + 2) % sorted.length];
    if (a.connections < 3 && b.connections < 3) {
      line(a.x, a.y, b.x, b.y);
      a.connections++;
      b.connections++;
    }
  }
}

function handleHourConnections() {
  stroke('#00C0FF');
  strokeWeight(1.5);

  // Reset connections
  for (let atom of hourAtoms) {
    atom.connections = 0;
  }

  // Verbindungslogik: sicherstellen, dass jede Kugel mindestens eine Verbindung hat
  let connected = new Set();

  for (let i = 0; i < hourAtoms.length; i++) {
    for (let j = i + 1; j < hourAtoms.length; j++) {
      let a = hourAtoms[i];
      let b = hourAtoms[j];

      if (a.connections >= 2 || b.connections >= 2) continue;

      let d = dist(a.x, a.y, b.x, b.y);
      if (d < 200) {  // großzügigerer Abstand für visuelle Klarheit
        line(a.x, a.y, b.x, b.y);
        a.connections++;
        b.connections++;
        connected.add(i);
        connected.add(j);
      }
    }
  }

  // Nachprüfung: einsame Kugeln
  for (let i = 0; i < hourAtoms.length; i++) {
    if (!connected.has(i) && hourAtoms.length > 1) {
      let a = hourAtoms[i];
      let minDist = Infinity;
      let closest = null;

      for (let j = 0; j < hourAtoms.length; j++) {
        if (i === j) continue;
        let b = hourAtoms[j];
        let d = dist(a.x, a.y, b.x, b.y);
        if (b.connections < 2 && d < minDist) {
          minDist = d;
          closest = b;
        }
      }

      if (closest) {
        line(a.x, a.y, closest.x, closest.y);
        a.connections++;
        closest.connections++;
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
    
    if (!isOverlapping(center.x, center.y, 16)) {
      hourAtoms.push(new HourAtom(center.x, center.y));
    }

    moleculeBalls = [];
  }
}

function isTooClose(x, y, radius, minDistance = 100) {
  for (let ball of moleculeBalls) {
    let d = dist(x, y, ball.x, ball.y);
    if (d < radius + ball.radius + minDistance) return true;
  }
  for (let atom of hourAtoms) {
    let d = dist(x, y, atom.x, atom.y);
    if (d < radius + atom.radius + minDistance) return true;
  }
  return false;
}