let ball;
let slides = [];
let erster = true;
let hitSound;
let font;
let lampBody;
let rope;
let ballColor = 'white';

// erstellt  Treppen 
const stairCount = 20;
const stairWidth = 272;
const stairHeight = 20;
const stepX = 270; // horizontaler Abstand
const stepY = 150; // vertikaler Abstand
const baseX = 200;
const baseY = 200;

//Sound in Script einfügen
function preload() {
  // font = loadFont('assets/Roboto-Regular.otf');
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

  //treppen
  for (let i = 0; i < stairCount; i++) {
    const x = baseX + i * stepX;
    const y = baseY + i * stepY;

    const slide = Matter.Bodies.rectangle(x, y, stairWidth, stairHeight, {
      isStatic: true,
      // angle: 0.0,
      label: "slide"
    });

    slide.highlight = false; // Custom property
    slides.push(slide);
    Matter.World.add(world, slide);
  }

   // 10 geneigte Plattformen
  const platformCount = 10;
  const platformWidth = 300;
  const platformHeight = 20;
  const platformBaseXLeft = 5650;
  const platformBaseXRight = 6100;
  const platformStartY = 3400;
  const horizontalShift = 5; // pro Reihe nach rechts verschieben

  for (let i = 0; i < platformCount; i++) {
    let isLeft = i % 2 === 0;
    // x-Versatz anwenden
    let x = isLeft 
      ? platformBaseXLeft + i * horizontalShift 
      : platformBaseXRight + i * horizontalShift;    
    
    let y = platformStartY + i * 180; // Abstand in y-Richtung (Höhe)
    let angle = isLeft ? 0.7 : -0.7; //  Neigungswinkel für Flipper-Feeling

    let platform = Matter.Bodies.rectangle(x, y, platformWidth, platformHeight, {
      isStatic: true,
      angle: angle,
      label: "platform",
    });
    
    platform.neutral = true; // <--- Merkmal setzen
    platform.highlight = false;
    slides.push(platform);
    Matter.World.add(world, platform);
  }

  // LAMPE AB STUFE 10 (Index 9)
  const lampAnchorX = slides[9].position.x;
  const lampAnchorY = slides[9].position.y - 1800; // Hängt 1800px über Treppe

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
  ball = new Ball(world, { x: 100, y: 50, r: 40, color: 'white' }, { restitution: 0.8, label: "ball" });

  //ball speed 
  Matter.Body.setVelocity(ball.body, { x: 5.5, y: 0 });

  //Kollision mit Stufe
  Matter.Events.on(engine, 'collisionStart', function (event) {
    event.pairs.forEach(function (pair) {
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
  fill('255'); // rein weiß
  rectMode(CENTER);
  rect(lightX, lightY + lightBeamHeight / 2, lightBeamWidth, lightBeamHeight);

  // zeichne visuelle zusammenhÃ¤ngende Treppe
  noStroke();
  let stairsToDraw = slides.slice(0, 1000); // Nur die erste Treppe
  stairsToDraw.forEach((s, i) => {
    push();
    fill(i > 7 && i < 11 ? 'black' : 'white'); // Weiß
    if ((i + 1) % 5 == 0 && i < 24) {
      // stroke('blue')
      if (s.highlight) {
        fill('red')
      }
      textSize(190);
      textAlign(CENTER);
      text(i+1, s.position.x, s.position.y+110)
    } else {
      drawVertices(s.vertices)
    }
    translate(s.position.x, s.position.y - stairHeight / 2 + 100);
    rectMode(CENTER);
    if (s.highlight && (i  + 1) % 5 != 0) {
      noStroke();
      fill('red');
      // fill(s.highlight ? 'red' : 'black');
      rect(0, -90, 272, 20); // Nutzt die Werte, die beim Erstellen benutzt wurden
    }
    pop();
  })

  //Zeichnet plattform und ball
  // for (let s of slides) {
  // }

  // Ball zeichnen
  fill(ballColor);
  noStroke();
  ellipse(ball.body.position.x, ball.body.position.y, 80);

  // LAMPE ZEICHNEN
  stroke(0);
  strokeWeight(4);

  // Rechteckiges Seil
  push();
  fill(255); // Seilfarbe weiß
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
  rect(len / 2, 0, len, 20); // LÃ¤nge = Seillänge, 20 = Dicke
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
  // if x kleiner als so und so und x größer als so und so dann apply force 0
  if (!(ball.body.position.x > 5540 && ball.body.position.x < 7000)) { // x < 1000 || x > 2000 && // wenn anders rum dann || benutzen statt &&
    Matter.Body.applyForce(ball.body, ball.body.position, { x: 0.0008, y: 0 });
  }
  // Matter.Body.applyForce(ball.body, ball.body.position, { x: 0.0008, y: 0 });

  //wenn ball an der position angekommen, dann soll wieder von anfang an
  if (ball.body.position.y > 5500) {
    Matter.Body.setPosition(ball.body, {x: 150, y: 150});
    Matter.Body.setVelocity(ball.body, { x: 5.5, y: 0 });
  }


  function drawVertices(vertices) {
    beginShape();
    for (const vertice of vertices) {
      vertex(vertice.x, vertice.y);
    }
    endShape(CLOSE);
  }
}