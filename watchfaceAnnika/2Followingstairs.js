let ball;
let slides = [];
let erster = true;
let hitSound;
let font;
let ballColor = 'darkturquoise';

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

function getCurrentTime(sec) {
  const now = new Date();
  const pad = num => num.toString().padStart(2, '0');

  // return pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds())
  return pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(sec);
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
  const platformCount = 9;
  const platformWidth = 300;
  const platformHeight = 20;
  const platformBaseXLeft = 5650;
  const platformBaseXRight = 6100;
  const platformStartY = 3400;
  const horizontalShift = 15; // pro Reihe nach rechts verschieben

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

  //  ZWEITE TREPPE 
  const secondStairStartX = 6180;
  const secondStairStartY = 5250; // Etwas unter den letzten Plattformen

  for (let i = 0; i < stairCount + 1; i++) {
    const x = secondStairStartX + i * stepX;
    const y = secondStairStartY + i * stepY;

    const slide = Matter.Bodies.rectangle(x, y, stairWidth, stairHeight, {
      isStatic: true,
      label: "slide"
    });

    slide.highlight = false;
    slides.push(slide);
    Matter.World.add(world, slide);
  }

  // Zweite Platform
  const platformBase2XLeft = 11900;
  const platformBase2XRight = 12350;
  const platformStart2Y = 8500;

  for (let i = 0; i < platformCount; i++) {
    let isLeft = i % 2 === 0;
    // x-Versatz anwenden
    let x = isLeft
      ? platformBase2XLeft + i * horizontalShift
      : platformBase2XRight + i * horizontalShift;

    let y = platformStart2Y + i * 180; // Abstand in y-Richtung (Höhe)
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

  // Ball wird erzeugt
  ball = new Ball(world, { x: 100, y: 50, r: 40, color: 'darkturquoise' }, { restitution: 0.8, label: "ball" });

  //ball speed 
  Matter.Body.setVelocity(ball.body, { x: 5.5, y: 0 });

  //Kollision mit Stufe
  Matter.Events.on(engine, 'collisionStart', function (event) {
    event.pairs.forEach(function (pair) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      console.log('Collision:', bodyA.label, bodyB.label);

      // //Sound bei Kollision
      // const labels = [bodyA.label, bodyB.label];
      // if (labels.includes("ball") && labels.includes("slide")) {
      //   console.log('Playing sound!');
      //   hitSound.play();
      // }

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
  //hintergrund schwarz
  background('black');

  //zoomt die kamera je nachdem wo die maus ist
  const zoom = 0.5 // Fester Zoomfaktor, z. B. 1.0 für 100%
  //Berechnet wie kamera ball folgt (in der mitte hält)
  const shiftX = -ball.body.position.x * zoom + width / 2;
  const shiftY = -ball.body.position.y * zoom + height / 2;

  // console.log(shiftX, shiftY)
  //speichert mit push
  push()
  //verschiebt und zoomt die ansicht damit kamera ball folgt
  translate(shiftX, shiftY)
  scale(zoom)

  blendMode(BLEND);
  //Lichtstrahl
  fill('darkturquoise');
  noStroke();
  rectMode(CENTER);
  rect(4120, 4000, 2710, 8000);
  rect(10360, 6000, 2710, 8000);
  // rect(5876, 1000, 810, 5000);
  // rect(7600, 1000, 810, 5000);
  // rect(10291, 1000, 810, 5000);


  // zeichne visuelle zusammenhÃ¤ngende Treppe
  noStroke();
  let stairsToDraw = slides;
  stairsToDraw.forEach((s, i) => {
    const slideIndex = i // slides.indexOf(s);
    push();
    fill(slideIndex > 9 && slideIndex < 20 || slideIndex > 39 && slideIndex < 50
      // || slideIndex > 12 && slideIndex < 16 || slideIndex > 22 && slideIndex < 27 || slideIndex > 32 && slideIndex < 37 || slideIndex > 42 && slideIndex < 47 || slideIndex > 52 && slideIndex < 57 
      ? 'black' : 'darkturquoise');

    if ((slideIndex + 1) % 5 === 0 && slideIndex < 60) {  // <--- Erweitert für zweite Treppe
      if (s.highlight) {
        fill('white')
      }
      push()
      if (slideIndex > 21 && slideIndex < 29 || slideIndex > 51 && slideIndex < 59 ) {
        textSize(50);
        translate(s.position.x, s.position.y)
        rotate(PI / 4)
        translate(-s.position.x, -s.position.y)
      } else {
        textSize(50);
      }
      textAlign(CENTER);
      text(getCurrentTime(slideIndex + 1), s.position.x, s.position.y + 25)
      pop()
    } else {
      drawVertices(s.vertices)
    }
    translate(s.position.x, s.position.y - stairHeight / 2 + 100);
    rectMode(CENTER);
    if (s.highlight && (slideIndex + 1) % 5 != 0) {
      noStroke();
      fill('white');
      rect(0, -90, 272, 20); // Nutzt die Werte, die beim Erstellen benutzt wurden
    }
    pop();
  })

  // Ball zeichnen
  fill(ballColor);
  noStroke();
  blendMode(DIFFERENCE)
  ellipse(ball.body.position.x, ball.body.position.y, 80);

  pop()
  //stellt zeichen einstellungen (kamera, Zoom) zurück

  // Kontinuierlicher Schubs 
  // if x kleiner als so und so und x größer als so und so dann apply force 0
  if (!(ball.body.position.y > 3130 && ball.body.position.y < 4950) &&
    !(ball.body.position.y > 8260 && ball.body.position.y < 10000)) {
    // x < 1000 || x > 2000 && // wenn anders rum dann || benutzen statt &&
    Matter.Body.applyForce(ball.body, ball.body.position, { x: 0.0008, y: 0 });
  }
  // Matter.Body.applyForce(ball.body, ball.body.position, { x: 0.0008, y: 0 });

  // wenn ball an der position angekommen, dann soll wieder von anfang an
  if (ball.body.position.y > 10200) {
    Matter.Body.setPosition(ball.body, { x: 100, y: 50 });
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

// lampe weg blend mode was macht sinnn statt lampe bei kollision invertiert bei uhrzeit statt ball was anderes  