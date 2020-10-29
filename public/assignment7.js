const up = [0, 1, 0]
let target = [5, 10, 0]
let lookAt = true

let gl
let attributeCoords
let uniformColor
let bufferCoords

let attributeNormals
let uniformWorldViewProjection
let uniformWorldInverseTranspose
let uniformReverseLightDirectionLocation
let normalBuffer

const init = () => {
  // get a reference to the canvas and WebGL context
  const canvas = document.querySelector("#canvas");
  canvas.addEventListener("mousedown", webglUtils.doMouseDown, false);
  gl = canvas.getContext("webgl");

  // create and use a GLSL program
  const program = webglUtils.createProgramFromScripts(gl,
    "#vertex-shader-3d", "#fragment-shader-3d");
  gl.useProgram(program);

  // get reference to GLSL attributes and uniforms
  attributeCoords = gl.getAttribLocation(program, "a_coords");
  uniformColor = gl.getUniformLocation(program, "u_color");

  // initialize coordinate attribute to send each vertex to GLSL program
  gl.enableVertexAttribArray(attributeCoords);

  // initialize coordinate buffer to send array of vertices to GPU
  bufferCoords = gl.createBuffer();

  attributeNormals = gl.getAttribLocation(program, "a_normals");
  gl.enableVertexAttribArray(attributeNormals);
  normalBuffer = gl.createBuffer();

  uniformWorldViewProjection = gl.getUniformLocation(program, "u_worldViewProjection");
  uniformWorldInverseTranspose = gl.getUniformLocation(program, "u_worldInverseTranspose");
  uniformReverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");

  // clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // event handlers that read input field data
  document.getElementById("tx").onchange = event => webglUtils.updateTranslation(event, "x")
  document.getElementById("ty").onchange = event => webglUtils.updateTranslation(event, "y")
  document.getElementById("tz").onchange = event => webglUtils.updateTranslation(event, "z")

  document.getElementById("sx").onchange = event => webglUtils.updateScale(event, "x")
  document.getElementById("sy").onchange = event => webglUtils.updateScale(event, "y")
  document.getElementById("sz").onchange = event => webglUtils.updateScale(event, "z")

  document.getElementById("rx").onchange = event => webglUtils.updateRotation(event, "x")
  document.getElementById("ry").onchange = event => webglUtils.updateRotation(event, "y")
  document.getElementById("rz").onchange = event => webglUtils.updateRotation(event, "z")

  document.getElementById("fv").onchange = event => webglUtils.updateFieldOfView(event)

  document.getElementById("color").onchange = event => webglUtils.updateColor(event)

  document.getElementById("lookAt").onchange = event => webglUtils.toggleLookAt(event)
  document.getElementById("ctx").onchange = event => webglUtils.updateCameraTranslation(event, "x")
  document.getElementById("cty").onchange = event => webglUtils.updateCameraTranslation(event, "y")
  document.getElementById("ctz").onchange = event => webglUtils.updateCameraTranslation(event, "z")
  document.getElementById("crx").onchange = event => webglUtils.updateCameraRotation(event, "x")
  document.getElementById("cry").onchange = event => webglUtils.updateCameraRotation(event, "y")
  document.getElementById("crz").onchange = event => webglUtils.updateCameraRotation(event, "z")
  document.getElementById("ltx").onchange = event => webglUtils.updateLookAtTranslation(event, 0)
  document.getElementById("lty").onchange = event => webglUtils.updateLookAtTranslation(event, 1)
  document.getElementById("ltz").onchange = event => webglUtils.updateLookAtTranslation(event, 2)

  document.getElementById("lookAt").checked = lookAt
  document.getElementById("ctx").value = camera.translation.x
  document.getElementById("cty").value = camera.translation.y
  document.getElementById("ctz").value = camera.translation.z
  document.getElementById("crx").value = camera.rotation.x
  document.getElementById("cry").value = camera.rotation.y
  document.getElementById("crz").value = camera.rotation.z

  document.getElementById("dlrx").value = lightSource[0]
  document.getElementById("dlry").value = lightSource[1]
  document.getElementById("dlrz").value = lightSource[2]

  document.getElementById("dlrx").onchange =  event => webglUtils.updateLightDirection(event, 0)
  document.getElementById("dlry").onchange = event => webglUtils.updateLightDirection(event, 1)
  document.getElementById("dlrz").onchange = event => webglUtils.updateLightDirection(event, 2)


  // set default shape
  webglUtils.selectShape(0)
}

const render = () => {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
  gl.vertexAttribPointer(attributeCoords, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(attributeNormals, 3, gl.FLOAT, false, 0, 0);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 1;
  const zFar = 2000;

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);

  let cameraMatrix = m4.identity()
  if(lookAt) {
    cameraMatrix = m4.translate(
      cameraMatrix,
      camera.translation.x,
      camera.translation.y,
      camera.translation.z)
    const cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]]
    cameraMatrix = m4.lookAt(cameraPosition, target, up)
  } else {
    cameraMatrix = m4.translate(
      cameraMatrix,
      camera.translation.x,
      camera.translation.y,
      camera.translation.z);
    cameraMatrix = m4.zRotate(cameraMatrix, m4.degToRad(camera.rotation.z));
    cameraMatrix = m4.xRotate(cameraMatrix, m4.degToRad(camera.rotation.x));
    cameraMatrix = m4.yRotate(cameraMatrix, m4.degToRad(camera.rotation.y));
  }
  cameraMatrix = m4.inverse(cameraMatrix)

  const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar)
  var viewProjectionMatrix = m4.multiply(projectionMatrix, cameraMatrix)

  let worldMatrix = m4.identity()
  const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  const worldInverseMatrix = m4.inverse(worldMatrix);
  const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

  gl.uniformMatrix4fv(uniformWorldViewProjection, false, worldViewProjectionMatrix);
  gl.uniformMatrix4fv(uniformWorldInverseTranspose, false, worldInverseTransposeMatrix);

  gl.uniform3fv(uniformReverseLightDirectionLocation, m4.normalize(lightSource));

  shapes.forEach(shape => {
    gl.uniform4f(uniformColor,
      shape.color.red,
      shape.color.green,
      shape.color.blue, 1);

    // compute transformation matrix
    let matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
    matrix = m4.translate(matrix, shape.translation.x, shape.translation.y);
    matrix = m4.zRotate(matrix, shape.rotation.z);
    matrix = m4.scale(matrix, shape.scale.x, shape.scale.y);

    // apply transformation matrix.
    let M = computeModelViewMatrix(shape, worldViewProjectionMatrix)
    gl.uniformMatrix4fv(uniformWorldViewProjection, false, M)

    if(shape.type === RECTANGLE) {
      renderRectangle(shape)
    } else if(shape.type === TRIANGLE) {
      renderTriangle(shape)
    } else if(shape.type === CIRCLE) {
      renderCircle(shape)
    } else if(shape.type === STAR) {
      renderStar(shape)
    } else if(shape.type === CUBE) {
      renderCube(shape)
    }
  })

  const $shapeList = $("#object-list")
  $shapeList.empty()
  shapes.forEach((shape, index) => {
    const $li = $(`
      <li>
        <button onclick="webglUtils.deleteShape(${index})">
          Delete
        </button>
        <label>
          <input type="radio" id="${shape.type}-${index}" name="shape-index"
            ${index === selectedShapeIndex ? "checked": ""}
            onclick="webglUtils.selectShape(${index})" value="${index}"/>
          ${shape.type}; X: ${shape.translation.x}; Y: ${shape.translation.y}; Z: ${shape.translation.z};
        </label>
      </li>
    `)
  $shapeList.append($li)})
}

const renderRectangle = (rectangle) => {
  const x1 = rectangle.position.x - rectangle.dimensions.width / 2;
  const y1 = rectangle.position.y - rectangle.dimensions.height / 2;
  const x2 = rectangle.position.x + rectangle.dimensions.width / 2;
  const y2 = rectangle.position.y + rectangle.dimensions.height / 2;

  const float32Array = new Float32Array([
    x1, y1, 0, x2, y1, 0, x1, y2, 0,
    x1, y2, 0, x2, y1, 0, x2, y2, 0
  ])

  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const renderTriangle = (triangle) => {
  const x1 = triangle.position.x - triangle.dimensions.width / 2;
  const y1 = triangle.position.y - triangle.dimensions.height / 2;
  const x2 = triangle.position.x + triangle.dimensions.width / 2;
  const y2 = triangle.position.y - triangle.dimensions.height / 2;
  const x3 = triangle.position.x;
  const y3 = triangle.position.y + triangle.dimensions.height / 2

  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([
      x1, y1, 0, x2, y2, 0, x3, y3, 0
    ]), gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

const renderStar = (star) => {
  const x1 = star.position.x - star.dimensions.width
  const y1 = star.position.y + star.dimensions.height / 2
  const x2 = star.position.x
  const y2 = star.position.y - star.dimensions.height
  const x3 = star.position.x + star.dimensions.width
  const y3 = star.position.y + star.dimensions.height / 2
  const x4 = star.position.x - star.dimensions.width
  const y4 = star.position.y - star.dimensions.height / 2
  const x5 = star.position.x + star.dimensions.width
  const y5 = star.position.y - star.dimensions.height / 2
  const x6 = star.position.x
  const y6 = star.position.y + star.dimensions.height

  const float32Array = new Float32Array([
    x1, y1, 0, x2, y2, 0, x3, y3, 0,
    x4, y4, 0, x5, y5, 0, x6, y6, 0
  ])

  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const renderCircle = (circle) => {
  const floatArray = [circle.position.x, circle.position.y]

  for(let i = 0; i <= 360; i++) {
    let x = circle.position.x + circle.dimensions.width * Math.cos(i * Math.PI / 180)
    let y = circle.position.y + circle.dimensions.height * Math.sin(i * Math.PI / 180)
    floatArray.push(x, y, 0)
  }

  var float32Array = new Float32Array(floatArray)

  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLE_FAN, 0, 362);
}

const renderCube = (cube) => {
  const geometry = [
     0,  0,  0,    0, 30,  0,   30,  0,  0,
     0, 30,  0,   30, 30,  0,   30,  0,  0,
     0,  0, 30,   30,  0, 30,    0, 30, 30,
     0, 30, 30,   30,  0, 30,   30, 30, 30,
     0, 30,  0,    0, 30, 30,   30, 30, 30,
     0, 30,  0,   30, 30, 30,   30, 30,  0,
     0,  0,  0,   30,  0,  0,   30,  0, 30,
     0,  0,  0,   30,  0, 30,    0,  0, 30,
     0,  0,  0,    0,  0, 30,    0, 30, 30,
     0,  0,  0,    0, 30, 30,    0, 30,  0,
    30,  0, 30,   30,  0,  0,   30, 30, 30,
    30, 30, 30,   30,  0,  0,   30, 30,  0
  ]
  const float32Array = new Float32Array(geometry)
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
  gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW)

  var normals = new Float32Array([
     0,0, 1,  0,0, 1,  0,0, 1,    0,0, 1,  0,0, 1,  0,0, 1,
     0,0,-1,  0,0,-1,  0,0,-1,    0,0,-1,  0,0,-1,  0,0,-1,
     0,-1,0,  0,-1,0,  0,-1,0,    0,-1,0,  0,-1,0,  0,-1,0,
     0, 1,0,  0, 1,0,  0, 1,0,    0, 1,0,  0, 1,0,  0, 1,0,
    -1, 0,0, -1, 0,0, -1, 0,0,   -1, 0,0, -1, 0,0, -1, 0,0,
     1, 0,0,  1, 0,0,  1, 0,0,    1, 0,0,  1, 0,0,  1 ,0,0,
    ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
  var primitiveType = gl.TRIANGLES;
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
}

let fieldOfViewRadians = m4.degToRad(70)
const computeModelViewMatrix = (shape, viewProjectionMatrix) => {
  let M = m4.translate(viewProjectionMatrix, shape.translation.x, shape.translation.y, shape.translation.z)
  M = m4.xRotate(M, m4.degToRad(shape.rotation.x))
  M = m4.yRotate(M, m4.degToRad(shape.rotation.y))
  M = m4.zRotate(M, m4.degToRad(shape.rotation.z))
  M = m4.scale(M, shape.scale.x, shape.scale.y, shape.scale.z)
  return M
}

const addRectangle = (center) => {
  let x = parseInt(document.getElementById("x").value)
  let y = parseInt(document.getElementById("y").value)
  const width = parseInt(document.getElementById("width").value)
  const height = parseInt(document.getElementById("height").value)
  const colorHex = document.getElementById("color").value
  const colorRgb = webglUtils.hexToRgb(colorHex)

  if (center) {
    x = center.position.x
    y = center.position.y
  }
  const rectangle = {
    type: RECTANGLE,
    position: {
      "x": x,
      y: y
    },
    dimensions: {
      width,
      height
    },
    color: colorRgb
  }
  shapes.push(rectangle)
  render()
}

const addTriangle = (center) => {
  let x = parseInt(document.getElementById("x").value)
  let y = parseInt(document.getElementById("y").value)
  const colorHex = document.getElementById("color").value
  const colorRgb = webglUtils.hexToRgb(colorHex)
  const width = parseInt(document.getElementById("width").value)
  const height = parseInt(document.getElementById("height").value)

  if (center) {
    x = center.position.x
    y = center.position.y
  }
  const triangle = {
    type: TRIANGLE,
    position: {x, y},
    dimensions: {width, height},
    color: colorRgb
  }
  shapes.push(triangle)
  render()
}

let selectedShapeIndex = 0
