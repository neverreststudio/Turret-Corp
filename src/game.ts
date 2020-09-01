/* imports */

import { AnglesSpring, AnglesSpringSystem, PositionSpring, PositionSpringSystem } from "physics/spring"
import { ParallaxComponent, ParallaxSystem } from "vfx/parallax"
import { ParticleBehaviour, ParticleSpawner, ParticleSystem, ParticleSpawnerSystem } from "vfx/particles"
import { BezierCurve } from "./math/beziercurve"

/* register systems */

// physics
engine.addSystem(new PositionSpringSystem())
engine.addSystem(new AnglesSpringSystem())

// vfx
engine.addSystem(new ParallaxSystem())
engine.addSystem(new ParticleSystem())
engine.addSystem(new ParticleSpawnerSystem())

// create a particle spawner
const mySpawner = new ParticleSpawner()

mySpawner.particleMinLifetime = 1.0
mySpawner.particleMaxLifetime = 2.0

mySpawner.spawnRate = 100
mySpawner.maxPoolSize = 100

mySpawner.position = new Vector3(8, 1, 8)
mySpawner.angles = new Vector3(-30, 60, 0)

mySpawner.spawnAngle = 25.0

mySpawner.particleMinSpeed = 20
mySpawner.particleMaxSpeed = 30

mySpawner.particleDampeningSpeed = 3
mySpawner.particleDampeningRate = 5

mySpawner.particleGravity = new Vector3(0, -6, 0)

mySpawner.particleScaleOverTime = true
mySpawner.particleScaleOverTimeCurve = new BezierCurve(
    new Vector2(0, 0),
    new Vector2(0.6, 1),
    new Vector2(0.7, 1),
    new Vector2(0.9, 1),
    new Vector2(1, 0)
)

mySpawner.onCreateParticle = (_entity: Entity, _particle: ParticleBehaviour) => {
    _entity.addComponent(new SphereShape())
}

const mySpawnerObject = new Entity()
mySpawnerObject.addComponent(mySpawner)
engine.addEntity(mySpawnerObject)

// Input.instance.subscribe("BUTTON_DOWN", ActionButton.POINTER, false, (e) => {
//     mySpawner.spawn()
// })
// mySpawner.spawn()

/*const skyTexture = new Texture("src/textures/sky.png", { samplingMode: 1, wrap: 0, hasAlpha: false })
const skyMaterial = new Material()
skyMaterial.transparencyMode = TransparencyMode.OPAQUE
skyMaterial.albedoTexture = skyTexture
skyMaterial.roughness = 1
skyMaterial.metallic = 0
const sky = new Entity()
sky.addComponent(new Transform({ position: new Vector3(8, 4, 16), rotation: Quaternion.Euler(0, 0, 0), scale: new Vector3(16, 8, 1)}))
const skyPlane = new PlaneShape()
sky.addComponent(skyPlane)
sky.addComponent(skyMaterial)
sky.addComponent(new ParallaxComponent(skyPlane, 100))
engine.addEntity(sky)

const skylineTexture = new Texture("src/textures/skyline-1.png", { samplingMode: 1, wrap: 2, hasAlpha: true })
const skylineMaterial = new Material()
skylineMaterial.transparencyMode = TransparencyMode.ALPHA_TEST
skylineMaterial.alphaTest = 0.01
skylineMaterial.albedoTexture = skylineTexture
skylineMaterial.roughness = 1
skylineMaterial.metallic = 0
const skyline = new Entity()
skyline.addComponent(new Transform({ position: new Vector3(8, 0, 15.99), rotation: Quaternion.Euler(0, 0, 0), scale: new Vector3(16, 16, 1)}))
const skylinePlane = new PlaneShape()
skyline.addComponent(skylinePlane)
skyline.addComponent(skylineMaterial)
skyline.addComponent(new ParallaxComponent(skylinePlane, 45))
engine.addEntity(skyline)

const skyline2Texture = new Texture("src/textures/skyline-2.png", { samplingMode: 1, wrap: 2, hasAlpha: true })
const skyline2Material = new Material()
skyline2Material.transparencyMode = TransparencyMode.ALPHA_TEST
skyline2Material.alphaTest = 0.01
skyline2Material.albedoTexture = skyline2Texture
skyline2Material.roughness = 1
skyline2Material.metallic = 0
const skyline2 = new Entity()
skyline2.addComponent(new Transform({ position: new Vector3(8, -2, 15.98), rotation: Quaternion.Euler(0, 0, 0), scale: new Vector3(16, 16, 1)}))
const skyline2Plane = new PlaneShape()
skyline2.addComponent(skyline2Plane)
skyline2.addComponent(skyline2Material)
skyline2.addComponent(new ParallaxComponent(skyline2Plane, 15))
engine.addEntity(skyline2)

const qub = new Entity()
qub.addComponent(new Transform({ position: new Vector3(8, 0.5, 15.5), scale: new Vector3(16, 1, 1) }))
qub.addComponent(new BoxShape())
engine.addEntity(qub)
const qub2 = new Entity()
qub2.addComponent(new Transform({ position: new Vector3(8, 7.5, 15.5), scale: new Vector3(16, 1, 1) }))
qub2.addComponent(new BoxShape())
engine.addEntity(qub2)
const qub3 = new Entity()
qub3.addComponent(new Transform({ position: new Vector3(0.5, 4, 15.5), scale: new Vector3(1, 8, 1) }))
qub3.addComponent(new BoxShape())
engine.addEntity(qub3)
const qub4 = new Entity()
qub4.addComponent(new Transform({ position: new Vector3(15.5, 4, 15.5), scale: new Vector3(1, 8, 1) }))
qub4.addComponent(new BoxShape())
engine.addEntity(qub4)*/






/*const tower = new Entity()
tower.addComponent(new Transform({ position: new Vector3(32, 0, 24), scale: new Vector3(0.9, 0.9, 0.9) }))
tower.addComponent(new GLTFShape("src/models/exterior/tower.glb"))
engine.addEntity(tower);*/


/*const sentry = new Entity()
let sentryTransform = new Transform({ position: new Vector3(4, 0.7, 4), rotation: Quaternion.Euler(0, 225, 0), scale: new Vector3(2, 2, 2) })
sentry.addComponent(sentryTransform)
const sentryShape = new GLTFShape("src/models/enemies/sentry.glb")
sentry.addComponent(sentryShape)
engine.addEntity(sentry);
sentryTransform = sentry.children[0].getComponent(Transform)
sentryTransform.position = new Vector3(0, -100, 0)*/

/*const server = new Entity()
server.addComponent(new Transform({ position: new Vector3(32, 0, 24), scale: new Vector3(0.9, 0.9, 0.9) }))
server.addComponent(new GLTFShape("src/models/interior/server.glb"))
engine.addEntity(server);*/