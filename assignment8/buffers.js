const initializeBuffers = (gl) => {
    const positionBuffer = initializePositionBuffer(gl);
    const colorBuffer = initializeColorBuffer(gl);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

const initializePositionBuffer = (gl) => {
    const positions = [
        -1.0, 1.0,   1.0, 1.0,   -1.0, -1.0,   1.0, -1.0,
     ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    return positionBuffer;
}

const initializeColorBuffer = (gl) => {
    const colors = [
       1.0,  1.0,  1.0,  1.0,    // vertex 0 is white
       1.0,  0.0,  0.0,  1.0,    // vertex 1 is red
       0.0,  1.0,  0.0,  1.0,    // vertex 2 is green
       0.0,  0.0,  1.0,  1.0,    // vertex 3 is blue
    ];

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return colorBuffer
}