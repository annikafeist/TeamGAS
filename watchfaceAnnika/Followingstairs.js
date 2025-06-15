let ball;
let slides = [];
let erster = true;
let hitSound;
let lampBody;
let rope;
let ballColor = 'white';

//Sound in Script einfügen
function preload() {
  hitSound = loadSound('./Slap-SoundMaster13-49669815.mp3');
  console.log('TestSound')
  hitSound.playMode('sustain');
}

//erzeugt zeichenfläche
function setup() {
  const canvas = createCanvas(960, 960);

  // erzeugt physik engine damit objekte sich realistisch bewegen
  let engine = Matter.Engine.create();
  let world = engine.world;

  // erstellt  Treppen 
  const stairCount = 1000;
  const stairWidth = 270;
  const stairHeight = 200;
  const stepX = 270; // horizontaler Abstand
  const stepY = 150; // vertikaler Abstand
  const baseX = 200;
  const baseY = 300;

  for (let i = 0; i < stairCount; i++) {
    const x = baseX + i * stepX;
    const y = baseY + i * stepY;

    const slide = Matter.Bodies.rectangle(x, y, stairWidth, stairHeight, {
      isStatic: true,
      angle: 0.1,
      label: "slide",
      render: {
        fillStyle: 'purple'
      }
    });

    slide.highlight = false; // Custom property
    slides.push(slide);
    Matter.World.add(world, slide);
  }

 // LAMPE AB STUFE 30 (Index 29)
const lampAnchorX = slides[9].position.x;
const lampAnchorY = slides[9].position.y - 1900; // Hängt 800px über Treppe

// Großer Lampenkörper (Kreis für Glühbirne als physikalisches Objekt)
lampBody = Matter.Bodies.circle(lampAnchorX, lampAnchorY + 500, 100, {
  // restitution: 0.2,
  // density: 0.002,
  label: "lamp"
});
Matter.World.add(world, lampBody);

// Seil (Constraint von Decke zur Lampe)
rope = Matter.Constraint.create({
  pointA: { x: lampAnchorX, y: lampAnchorY },     // Deckenpunkt
  bodyB: lampBody,
  pointB: { x: 0, y: -60 },                        // oben an Lampe
  length: 800,
  stiffness: 0.9
});
Matter.World.add(world, rope);

  // Ball wird erzeugt
  ball = new Ball(world, { x: 100, y: 50, r: 40, color: 'white' }, { restitution: 0.7, label: "ball" });

  //ball speed 
  Matter.Body.setVelocity(ball.body, { x: 6, y: 0 });

//Kollision mit Stufe
  Matter.Events.on(engine, 'collisionStart', function(event) {
  event.pairs.forEach(function(pair) {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;
    console.log('Collision:', bodyA.label, bodyB.label);

    //Sound bei Kollision
    const labels = [bodyA.label, bodyB.label];
    if (labels.includes("ball") && labels.includes("slide")) {
      console.log('Playing sound!');
      hitSound.play();
    }
    // Aufleuchten
    const slide = bodyA.label === "slide" ? bodyA : bodyB;
    slide.highlight = true;
    setTimeout(() => {
      slide.highlight = false;
    }, 200);
  });
});
  
  // Startet physik simulation
  Matter.Runner.run(engine);
}

function draw() {
  //zoomt die kamera je nachdem wo die maus ist
  const zoom = map(mouseX, 0, width, 0.5, 2)
  //Berechnet wie kamera ball folgt (in der mitte hält)
  const shiftX = -ball.body.position.x * zoom + width / 2;
  const shiftY = -ball.body.position.y * zoom + height / 2;

  // console.log(shiftX, shiftY)
  //speichert mit push
  push()
  //verschiebt und zoomt die ansicht damit kamera ball folgt
  translate(shiftX, shiftY)
  scale(zoom)
  //hintergrund schwarz
  background(0);

// Fester weißer Lichtstrahl unter der Lampe (ohne Transparenz)
let lightBeamWidth = 811;
let lightBeamHeight = 5000;
let lightX = lampBody.position.x;
let lightY = lampBody.position.y;

// --- Ballfarbe ändern, wenn im Lichtstrahl ---
let beamLeft = lightX - lightBeamWidth / 2;
let beamRight = lightX + lightBeamWidth / 2;
let beamTop = lightY;
let beamBottom = lightY + lightBeamHeight;

let bx = ball.body.position.x;
let by = ball.body.position.y;

if (bx >= beamLeft && bx <= beamRight && by >= beamTop && by <= beamBottom) {
  ballColor = 'black';
} else {
  ballColor = 'white';
}

noStroke();
fill(255); // rein weiß
rectMode(CENTER);
rect(lightX, lightY + lightBeamHeight / 2, lightBeamWidth, lightBeamHeight);

// --- Schwarze Stufen im Lichtkegel (invertierter Effekt) ---
for (let i = 3; i <= 5; i++) {
  let s = slides[i];
  push();
  translate(s.position.x, s.position.y);
  rectMode(CENTER);
  noStroke();
  fill(0); // Schwarz
  rect(0, -90, 270, 20); // Gleiche Maße wie weiße Stufen
  pop();
}

  // zeichne visuelle zusammenhängende Treppe
  noStroke();
  fill(255); // Weiß
  beginShape();
  let stairsToDraw = slides.slice(0, 1000); // Nur die erste Treppe
  stairsToDraw.forEach((s, i) => {
    // obere linke Ecke jeder Stufe
    vertex(s.position.x - 135, s.position.y - 100); 
    // obere rechte Ecke jeder Stufe
    vertex(s.position.x + 135, s.position.y - 100);
  });
  // Rückweg unten entlang
  for (let i = stairsToDraw.length - 1; i >= 0; i--) {
    let s = stairsToDraw[i];
    // untere rechte Ecke jeder Stufe
    vertex(s.position.x + 135, s.position.y + 2000);
    // untere linke Ecke jeder Stufe
    vertex(s.position.x - 135, s.position.y + 2000);
  }
  endShape(CLOSE);

  //Zeichnet plattform und ball
  for (let s of slides) {
    push();
    translate(s.position.x, s.position.y);
    // rotate(s.angle);
    rectMode(CENTER);
    noStroke();
    fill(s.highlight ? 'red' : 'white');
    rect(0, -90, 270, 20); // Nutze die Werte, die du beim Erstellen benutzt hast
    pop();
  }

// Ball zeichnen ohne class
fill(ballColor);
noStroke();
ellipse(ball.body.position.x, ball.body.position.y, 80);

  // LAMPE ZEICHNEN
  stroke(0);
  strokeWeight(4);

  // Rechteckiges Seil
  push();
  fill(255); // Seilfarbe, z. B. dunkelgrau oder braun
  noStroke();

  // Berechne Vektor vom oberen Punkt zur Lampe
  let dx = lampBody.position.x - rope.pointA.x;
  let dy = (lampBody.position.y - 60) - rope.pointA.y;
  let angle = atan2(dy, dx);
  let len = dist(rope.pointA.x, rope.pointA.y, lampBody.position.x, lampBody.position.y - 60);

  // Rechteck zentriert zwischen den beiden Punkten zeichnen
  translate(rope.pointA.x, rope.pointA.y);
  rotate(angle);
  rectMode(CENTER);
  rect(len / 2, 0, len, 20); // Länge = Seillänge, 20 = Dicke
  pop();

  // Glühbirne
  fill(255);
  ellipse(lampBody.position.x, lampBody.position.y, 80); // kleine Birne

  // Großer Schirm als Bogen (halbkreis)
  fill(255);
  arc(lampBody.position.x, lampBody.position.y, 811, 500, PI, 0, CHORD); // großer Halbbogen


  pop()
  //stellt zeichen einstellungen (kamera, Zoom) zurück

  // Kontinuierlicher Schubs
  Matter.Body.applyForce(ball.body, ball.body.position, { x: 0.0005, y: 0 });

  // //wenn ball an der position angekommen, dann soll wieder von anfang an
  // if (ball.body.position.y > 9200) {
  //   Matter.Body.setPosition(ball.body, {x: 150, y: 150});
  //   Matter.Body.setVelocity(ball.body, { x: 5, y: 0 });
  // }
}