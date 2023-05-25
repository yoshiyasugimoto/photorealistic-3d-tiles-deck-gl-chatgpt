import * as THREE from 'three'

interface Obj {
  [prop: string]: any
}

const PI2 = Math.PI * 2.0
function symmetryRandom() {
  return Math.random() * 2.0 - 1.0
}
const vertexShader = `
attribute vec3 aEuler;
attribute float aSize;

varying float pAlpha;

varying vec3 normX;
varying vec3 normY;
varying vec3 normZ;

void main() {
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = aSize * (300.0 / -mvPosition.z);

	float pdist = length(mvPosition.xyz);
    pAlpha = smoothstep(0.0, 1.0, (pdist - 0.1) / 400.);

	// Caculate Normal
	vec3 elrsn = sin(aEuler);
 	vec3 elrcs = cos(aEuler);
 	mat3 rotx = mat3(
		1.0, 0.0, 0.0,
      0.0, elrcs.x, elrsn.x,
      0.0, -elrsn.x, elrcs.x
 	);
	mat3 roty = mat3(
      elrcs.y, 0.0, -elrsn.y,
      0.0, 1.0, 0.0,
      elrsn.y, 0.0, elrcs.y
	);
	mat3 rotz = mat3(
      elrcs.z, elrsn.z, 0.0, 
      -elrsn.z, elrcs.z, 0.0,
      0.0, 0.0, 1.0
	);
	mat3 rotmat = rotx * roty * rotz;

	mat3 trrotm = mat3(
      rotmat[0][0], rotmat[1][0], rotmat[2][0],
      rotmat[0][1], rotmat[1][1], rotmat[2][1],
      rotmat[0][2], rotmat[1][2], rotmat[2][2]
 	);
 	normX = trrotm[0];
 	normY = trrotm[1];
 	normZ = trrotm[2];
}
`
const fragmentShader = `
precision highp float;

varying vec3 normX;
varying vec3 normY;
varying vec3 normZ;

float diffuse = 0.9;
float specular = 0.8;
float rstop = 0.1;

// pos orign r.ab
float ellipse(vec2 p, vec2 o, vec2 r) { 
    vec2 lp = (p - o) / r;
    return length(lp) - 1.0;
}

void main() {
	vec3 p = vec3(gl_PointCoord - vec2(0.5, 0.5), 0.0) * 2.0;
	vec3 d = vec3(0.0, 0.0, -1.0);
	float nd = normZ.z; //dot(-normZ, d);
	if(abs(nd) < 0.0001) discard;

	float np = dot(normZ, p);
    vec3 tp = p + d * np / nd;//dot(-normZ, d) / dot(-normZ, p);
	// Back 2D 
 	vec2 coord = vec2(dot(normX, tp), dot(normY, tp));

	// angle = 15 degree
	const float flwrsn = 0.258819045102521;
	const float flwrcs = 0.965925826289068;
	mat2 flwrm = mat2(flwrcs, -flwrsn, flwrsn, flwrcs);
	// abs => double [0,1]
	vec2 flwrp = vec2(abs(coord.x), coord.y) * flwrm;
	float r;
	if(flwrp.x < 0.0) {
	// middle part(double)
		r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.36, 0.96) * 0.5);
	} else {
		// out part(double)
		r = ellipse(flwrp, vec2(0.065, 0.024) * 0.5, vec2(0.58, 0.96) * 0.5);
	}
	if(r > rstop) discard;
    // r = ellipse(flwrp, vec2(0.250,0.440), vec2(0.140,0.190));
    vec3 col = mix(vec3(1.0, 0.8, 0.75), vec3(1.0, 0.9, 0.87), r);
    
	float grady = mix(0.0, 1.0, pow(coord.y * 0.5 + 0.5, 0.35));
  	col *= vec3(1.0, grady, grady);
	col *= mix(0.8, 1.0, pow(abs(coord.x), 0.3));
  	col = col * diffuse + specular;
    
	gl_FragColor = vec4(col*0.5, 1.);
}
`

class Particle {
  index: number
  velocity: number[]
  rotation: number[]
  position: number[]
  euler: number[]
  size: number
  alpha: number
  zkey: number

  constructor(index: number) {
    this.index = index
    this.velocity = new Array(3)
    this.rotation = new Array(3)
    this.position = new Array(3)
    this.euler = new Array(3)
    this.size = 1.0
    this.alpha = 1.0
    this.zkey = 0.0
  }
  setVelocity(vx: number, vy: number, vz: number) {
    this.velocity[0] = vx
    this.velocity[1] = vy
    this.velocity[2] = vz
  }
  setRotation(rx: number, ry: number, rz: number) {
    this.rotation[0] = rx
    this.rotation[1] = ry
    this.rotation[2] = rz
  }
  setPosition(nx: number, ny: number, nz: number) {
    this.position[0] = nx
    this.position[1] = ny
    this.position[2] = nz
  }
  setEulerAngles(rx: number, ry: number, rz: number) {
    this.euler[0] = rx
    this.euler[1] = ry
    this.euler[2] = rz
  }
  setSize(s: number) {
    this.size = s
  }
  update(dt: number) {
    this.position[0] += this.velocity[0] * dt
    this.position[1] += this.velocity[1] * dt
    this.position[2] += this.velocity[2] * dt

    this.euler[0] += this.rotation[0] * dt
    this.euler[1] += this.rotation[1] * dt
    this.euler[2] += this.rotation[2] * dt
  }
}

export function sakuraParticle(scene: THREE.Scene, particlesNum: number) {

  const geometry = new THREE.BufferGeometry()
  const particleControl: Obj = {
    particlesNum: particlesNum,
    area: [50, 50, 50],
  }
  const positions = new Float32Array(particleControl.particlesNum * 3)
  const eulers = new Float32Array(particleControl.particlesNum * 3)
  const sizes = new Float32Array(particleControl.particlesNum)

  particleControl.particles = new Array(particlesNum)

  const tempVec3 = new THREE.Vector3()
  let tempVelocity = 0
  for (let i = 0; i < particlesNum; i++) {
    particleControl.particles[i] = new Particle(i)
    const particle = particleControl.particles[i]

    tempVec3.x = symmetryRandom() * 0.3 + 0.8
    tempVec3.y = symmetryRandom() * 0.2 - 1.0
    tempVec3.z = symmetryRandom() * 0.3 + 0.5
    tempVec3.normalize()
    tempVelocity = 5.0 + Math.random() * 1.0
    tempVec3.multiplyScalar(tempVelocity)

    particle.setVelocity(tempVec3.x, tempVec3.y, tempVec3.z)
    particle.setRotation(
      symmetryRandom() * PI2 * 0.5,
      symmetryRandom() * PI2 * 0.5,
      symmetryRandom() * PI2 * 0.5
    )
    particle.setPosition(
      symmetryRandom() * particleControl.area[0],
      symmetryRandom() * particleControl.area[1],
      symmetryRandom() * particleControl.area[2]
    )
    particle.setEulerAngles(
      Math.random() * Math.PI * 2.0,
      Math.random() * Math.PI * 2.0,
      Math.random() * Math.PI * 2.0
    )
    particle.setSize(4 + Math.random() * 1)

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aEuler', new THREE.BufferAttribute(eulers, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    const uniforms = {
      far: {
        type: 'f',
        value: particleControl.area[2],
      },
    }
    const points = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader,
        fragmentShader,
      })
    )
    scene.add(points)
  }
  // Cycle Position
  function repeatPos(particle: any, area: any) {
    for (let index = 0; index < 3; index++) {
      const limit = area[index]
      if (Math.abs(particle.position[index]) - particle.size * 0.5 > limit) {
        // Out Of Area
        if (particle.position[index] > 0) {
          particle.position[index] -= limit * 2.0
        } else {
          particle.position[index] += limit * 2.0
        }
      }
    }
  }

  // Cycle Euler
  function repeatEuler(particle: any) {
    for (let index = 0; index < 3; index++) {
      particle.euler[index] = particle.euler[index] % PI2
      if (particle.euler[index] < 0.0) {
        particle.euler[index] += PI2
      }
    }
  }

  const clock = new THREE.Clock()
  function render() {
    const delta = clock.getDelta()
    particleControl.particles.map((particle: Particle) => {
      const i = particle.index
      particle.update(delta)
      repeatPos(particle, particleControl.area)
      repeatEuler(particle)
      // Position
      positions[i * 3] = particle.position[0]
      positions[i * 3 + 1] = particle.position[1]
      positions[i * 3 + 2] = particle.position[2]
      // Rotation
      eulers[i * 3] = particle.euler[0]
      eulers[i * 3 + 1] = particle.euler[1]
      eulers[i * 3 + 2] = particle.euler[2]
      // Size
      sizes[i] = particle.size
    })
    // for (let i = 0; i < particleControl.particlesNum; i++) {
    //   const particle = particleControl.particles[i]
    //   particle.update(delta)
    //   repeatPos(particle, particleControl.area)
    //   repeatEuler(particle)
    //   // Position
    //   positions[i * 3] = particle.position[0]
    //   positions[i * 3 + 1] = particle.position[1]
    //   positions[i * 3 + 2] = particle.position[2]
    //   // Rotation
    //   eulers[i * 3] = particle.euler[0]
    //   eulers[i * 3 + 1] = particle.euler[1]
    //   eulers[i * 3 + 2] = particle.euler[2]
    //   // Size
    //   sizes[i] = particle.size
    // }
    geometry.attributes['position'].needsUpdate = true
    geometry.attributes['aEuler'].needsUpdate = true
    geometry.attributes['aSize'].needsUpdate = true

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
  return
}
