let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;

let engine, world;
let balls = [];
let constraints = [];
let canvas;
let mouseConstraint;



function setup() {
  canvas = createCanvas(960, 960);
  engine = Engine.create();
  world = engine.world;
  engine.gravity.y = 0; // 不受重力影响
  
  const wallThickness = 50;
  let walls = [
  Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true }),
  Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true }),
  Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
  Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
  ];

  World.add(world, walls);

  // 创建三个大白球
  for (let i = 0; i < 3; i++) {
    balls.push(createBall(random(width), random(height), 60, color(255)));
  }

  // 创建七个小淡蓝球
  for (let i = 0; i < 7; i++) {
    balls.push(createBall(random(width), random(height), 20, color(150, 200, 255)));
  }

  // 为所有球添加弹性连接（spring-like）
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      let options = {
        bodyA: balls[i].body,
        bodyB: balls[j].body,
        stiffness: 0.01,//弹性
        length: dist(
          balls[i].body.position.x,
          balls[i].body.position.y,
          balls[j].body.position.x,
          balls[j].body.position.y
        )* 0.9//长度
      };
      let constraint = Constraint.create(options);
      World.add(world, constraint);
      constraints.push(constraint);
    }
  }

  // 添加鼠标拖动控制
  let canvasMouse = Mouse.create(canvas.elt);
  canvasMouse.pixelRatio = pixelDensity();
  let options = {
    mouse: canvasMouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false }
    }
  };
  mouseConstraint = MouseConstraint.create(engine, options);
  World.add(world, mouseConstraint);
}

function draw() {
  background(0);
  Engine.update(engine);

  // 给每个球施加轻微随机力
  balls.forEach(b => {
    let forceMagnitude = 0.01; // 调整这个数值大小控制移动幅度
    let force = {
      x: (random() - 0.5) * forceMagnitude,
      y: (random() - 0.5) * forceMagnitude
    };
    Body.applyForce(b.body, b.body.position, force);
  });

  // 画弹性线
  stroke(100, 150, 255, 100);
  strokeWeight(2);
  for (let c of constraints) {
    let posA = c.bodyA.position;
    let posB = c.bodyB.position;
    line(posA.x, posA.y, posB.x, posB.y);
  }

  // 画球
  noStroke();
  for (let b of balls) {
    fill(b.color);
    ellipse(b.body.position.x, b.body.position.y, b.radius * 2);
  }
}

// 创建球的封装函数
function createBall(x, y, r, col) {
  let body = Bodies.circle(x, y, r, {
    friction: 0,
    restitution: 1,
    frictionAir: 0.02
  });
  World.add(world, body);
  return { body: body, radius: r, color: col };
}
