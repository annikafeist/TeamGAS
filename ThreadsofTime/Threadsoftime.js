let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint;
const HALF_PI = Math.PI / 2;
let engine, world;
let balls = [];
let constraints = [];
let canvas;
let mouseConstraint;
let gravityAngle = -HALF_PI; // 初始为正上方向
let magnetActive = false;
let magnetPos;
let ringRadius = 400;
let blueBallCount = 0;
let lastBlueBallTime = 0;
let maxBlueBalls = 60;
let baseWhiteBalls = [];
let baseBlueBalls = [];


function setup() {
  // 创建画布和物理引擎
  canvas = createCanvas(960, 960);
  engine = Engine.create();
  world = engine.world;
  engine.gravity.y = 0;
  // 初始化磁铁位置
  magnetPos = { x: width / 2, y: height / 2 };

  const wallThickness = 30;
  let walls = [
    Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true,restitution: 1 }),
    Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true,restitution: 1 }),
    Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true,restitution: 1 }),
    Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true,restitution: 1 }),
  ];
  World.add(world, walls);

  // 白球
  for (let i = 0; i < 3; i++) {
    let b = createBall(random(width), random(height), 60, color(255));
    balls.push(b);
    baseWhiteBalls.push(b);
  }

  // 初始蓝球
  for (let i = 0; i < 3; i++) {
    addBlueBall();
  }
  
}

function draw() {
  background(0);
  Engine.update(engine);

  // 每秒添加一个蓝球
  if (millis() - lastBlueBallTime > 1000) {
    if (blueBallCount < maxBlueBalls) {
      addBlueBall();
    } else {
      resetBlueBalls();
    }
    lastBlueBallTime = millis();
  }

  // 扰动（磁性关闭时允许扰动）
  if (!magnetActive) {
    balls.forEach(b => {
      let forceMagnitude = 0.01;
      let force = {
        x: (random() - 0.5) * forceMagnitude,
        y: (random() - 0.5) * forceMagnitude
      };
      Body.applyForce(b.body, b.body.position, force);
    });
  }

  // 磁性吸附逻辑
  if (magnetActive) {
  // 让大白球吸向中心
  for (let b of balls) {
    if (b.radius === 60) {
      let pos = b.body.position;
      let dir = {
        x: magnetPos.x - pos.x,
        y: magnetPos.y - pos.y
      };
      let mag = sqrt(dir.x * dir.x + dir.y * dir.y);
      if (mag > 1) {
        dir.x /= mag;
        dir.y /= mag;
        let strength = 0.15;
        Body.applyForce(b.body, b.body.position, {
          x: dir.x * strength,
          y: dir.y * strength
        });
      }
    }
  }

  // 蓝球沿圆环吸附并自动滑动（流线）
 let angleOffset = gravityAngle; // 用重力方向作为起始角度
let spacingAngle = 0.18; // 球之间的角度间隔

baseBlueBalls.forEach((b, i) => {
  let targetAngle = angleOffset + i * spacingAngle;
  let pos = b.body.position;

  let targetX = magnetPos.x + ringRadius * cos(targetAngle);
  let targetY = magnetPos.y + ringRadius * sin(targetAngle);

  // 吸附到圆环上
  let dirToRing = {
    x: targetX - pos.x,
    y: targetY - pos.y
  };
  let distToRing = sqrt(dirToRing.x * dirToRing.x + dirToRing.y * dirToRing.y);
  if (distToRing > 1) {
    dirToRing.x /= distToRing;
    dirToRing.y /= distToRing;
    let attractStrength = 0.02;
    Body.applyForce(b.body, b.body.position, {
      x: dirToRing.x * attractStrength,
      y: dirToRing.y * attractStrength
    });
  }

  
let ballAngle = atan2(pos.y - magnetPos.y, pos.x - magnetPos.x);

// 重力方向与当前位置的夹角差值
let delta = gravityAngle - ballAngle;
let flowStrength = 0.003 * sin(delta); // 控制滑动速度

// 切线方向单位向量
let tangent = {
  x: -sin(ballAngle),
  y: cos(ballAngle)
};

Body.applyForce(b.body, b.body.position, {
  x: tangent.x * flowStrength,
  y: tangent.y * flowStrength
});

});

}


  // 绘制绳子
  stroke(0, 206, 209, 100);
  strokeWeight(2);

  
  for (let c of constraints) {
    let posA = c.bodyA.position;
    let posB = c.bodyB.position;
    line(posA.x, posA.y, posB.x, posB.y);
  }

  // 绘制球
  noStroke();
  for (let b of balls) {
    fill(b.color);
    ellipse(b.body.position.x, b.body.position.y, b.radius * 2);
  }
}

function touchStarted() {
  try {
    // iOS 请求权限
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(response => {
        if (response === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      }).catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    toggleMagnet();  // 用更清晰的函数名代替 mousePressed()
  } catch (e) {
    console.error("touchStarted error:", e);
  }

  return false;
}

function toggleMagnet() {
  magnetActive = !magnetActive;

  // 更新绳子弹性
  for (let c of constraints) {
    c.stiffness = magnetActive ? 0 : 0.02;
  }

  // 吸附后立即设置蓝球速度（保持视觉稳定）
  if (magnetActive) {
    for (let b of baseBlueBalls) {
      Body.setVelocity(b.body, { x: 50, y: 0 });
      Body.setAngularVelocity(b.body, 0);
    }
  }
}



function createBall(x, y, r, col) {
  let body = Bodies.circle(x, y, r, {
    friction: 0,
    restitution: 0.1,
    frictionAir: 0.4,
  });
  World.add(world, body);
  return { body: body, radius: r, color: col };
}

function addBlueBall() {
  let x, y;

  if (magnetActive) {
    // 永远从顶点生成（正上方）
    let angle = -HALF_PI;
    x = magnetPos.x + ringRadius * cos(angle);
    y = magnetPos.y + ringRadius * sin(angle);
  } else {
    // 自由生成
    x = random(width);
    y = random(height);
  }

  let b = createBall(x, y, 20, color(0, 206, 209));
  balls.push(b);
  baseBlueBalls.push(b);
  blueBallCount++;


  // 与所有白球建立连接
  for (let w of baseWhiteBalls) {
    let c = Constraint.create({
      bodyA: b.body,
      bodyB: w.body,
      stiffness: magnetActive ? 0 : 0.05,
      length: undefined
    });
    World.add(world, c);
    constraints.push(c);
  }

  // 如果磁性开启，让小球立即静止（吸附后保持稳定）
  if (magnetActive) {
    Body.setVelocity(b.body, { x: 50, y: 0 });
    Body.setAngularVelocity(b.body, 0);
  }
}


function resetBlueBalls() {
  for (let b of baseBlueBalls) {
    World.remove(world, b.body);
  }
  baseBlueBalls = [];
  balls = baseWhiteBalls.slice(); // 保留白球
  constraints.forEach(c => World.remove(world, c));
  constraints = [];
  blueBallCount = 0;

  // 重新连接白球和蓝球
  for (let i = 0; i < 7; i++) {
    addBlueBall();
  }
}

function handleMotion(event) {
  let ax = event.accelerationIncludingGravity.x;
  let ay = event.accelerationIncludingGravity.y;

  gravityAngle = atan2(ay, ax); // 得到当前“重力方向”
}