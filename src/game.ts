/* imports */

import * as ui from "../node_modules/@dcl/ui-utils/index"

import { DebugRay, DebugRayComponent, DebugRaySystem } from "./debug/ray"
import { AnglesSpring, AnglesSpringSystem, PositionSpring, PositionSpringSystem } from "./physics/spring"
import { ParallaxComponent, ParallaxSystem } from "./vfx/parallax"
import { ParticleBehaviour, ParticleSpawner, ParticleSystem, ParticleSpawnerSystem } from "./vfx/particles"
import { BezierCurve } from "./math/beziercurve"
import { MathUtils } from "./math/utils"
import { DelayedTask } from "./tasks/delayedtasks"

import { Enemy, EnemyComponent, EnemySystem, EnemyType } from "./turretcorp/enemy"
import { GameManagerBehaviour, GameManagerSystem, GameState, GameManager } from "./turretcorp/gamemanager"
import { SceneManager } from "./turretcorp/scenemanager"
import { Elevator, ElevatorComponent, ElevatorSystem } from "./turretcorp/elevator"
import { StatBarSystem } from "./turretcorp/statbar"
import { TurretSystem, Turret, TurretComponent, TurretType } from "./turretcorp/turret"
import { SmokeParticles } from "./turretcorp/smokeparticles"
import { TurretManagementSystem } from "./turretcorp/turretmanagement"

/* register systems */

// debug
engine.addSystem(new DebugRaySystem())

// physics
engine.addSystem(new PositionSpringSystem())
engine.addSystem(new AnglesSpringSystem())

// vfx
engine.addSystem(new ParallaxSystem())
engine.addSystem(new ParticleSystem())
engine.addSystem(new ParticleSpawnerSystem())

// tower corp
engine.addSystem(new GameManagerSystem())
engine.addSystem(new ElevatorSystem())
engine.addSystem(new StatBarSystem())
engine.addSystem(new EnemySystem())
engine.addSystem(new TurretSystem())
engine.addSystem(new TurretManagementSystem())

/* scene setup */

// fill in the floor
const floorShape = new GLTFShape("src/models/FloorBaseGrass_01/FloorBaseGrass_01.glb")
for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 4; z++) {
        const floorEntity = new Entity()
        floorEntity.addComponent(new Transform({ position: new Vector3(x * 16 + 8, 0, z * 16 + 8) }))
        floorEntity.addComponent(floorShape)
        engine.addEntity(floorEntity)
    }
}

// debug - move player straight to elevator (slight offset to prevent collision flip out)
movePlayerTo(new Vector3(16, 0, 0), new Vector3(24, 1, 0))

// create a game manager
const gameManager = new GameManager().getComponent(GameManagerBehaviour)

// create a scene manager
const sceneManager = new SceneManager()

// load the exterior scene and enable it
sceneManager.loadExterior()
sceneManager.enableExterior()

// load the interior scene but leave it inactive
sceneManager.loadInterior()

// create an elevator
const elevator = new Elevator(new Vector3(24, -0.5, 2), new Vector3(24, gameManager.isPrimaryPlayer ? 22.5 : 44, 2)).getComponent(ElevatorComponent)
elevator.onClosed = (_elevator: ElevatorComponent) => {

    elevator.top = new Vector3(24, gameManager.isPrimaryPlayer ? 22.5 : 44, 2)

    // time a dust particle burst with the door close animation
    new DelayedTask(() => {
        let smokePos = elevator.isAtTop ? elevator.top.clone() : elevator.bottom.clone()
        if (elevator.isAtTop) {
            smokePos.z = 3
        }
        else {
            smokePos.z = 0.5
        }
        for (let y = 1; y < 4; y += 0.5) {
            SmokeParticles.getInstance().emitSphere(5 + Math.random() * 3, smokePos.add(new Vector3(0, y, 0)), 0.2, 0.02, 0.08)
        }
    }, 0.35)

    // change the game state
    new DelayedTask(() => {
        
        // destroy all active enemies
        if (Enemy.__pools && Enemy.__pools !== null) {
            for (let i = 0; i < Enemy.__pools.length; i++) {
                for (let j = 0; j < Enemy.__pools[i].length; j++) {
                    Enemy.__pools[i][j].getComponent(EnemyComponent).kill(true)
                }
            }
        }

        // destroy all turrets
        if (Turret.__allTurrets && Turret.__allTurrets !== null) {
            for (let i = 0; i < Turret.__allTurrets.length; i++) {
                engine.removeEntity(Turret.__allTurrets[i])
            }
            Turret.__allTurrets = []
        }

        // check if we're outside
        if (gameManager.state === GameState.Outside) {

            // switch from exterior to interior (automatically disables exterior)
            let distance = 3
            let speed = elevator.speed
            new DelayedTask(() => {
                sceneManager.enableInterior()
            }, distance / speed)
        }
        else {

            // wait until the elevator has gone below it and remove the interior
            let distance = 3 + (gameManager.isPrimaryPlayer ? 0 : (44 - 22.5))
            let speed = elevator.speed
            new DelayedTask(() => {
                sceneManager.disableInterior()
            }, distance / speed)

            // wait until the elevator has gone sufficiently low to show the exterior
            distance = (gameManager.isPrimaryPlayer ? 22.5 : 44) + 0.5
            distance -= 10
            new DelayedTask(() => {
                sceneManager.enableExterior()
            }, distance / speed);
        }

        gameManager.setState(GameState.InElevator)
    }, 0.75)
}
elevator.onOpened = (_elevator: ElevatorComponent) => {

}
elevator.onReachedBottom = (_elevator: ElevatorComponent) => {
    gameManager.setState(GameState.Outside)
}
elevator.onReachedTop = (_elevator: ElevatorComponent) => {
    
    // update the game state
    gameManager.setState(gameManager.isPrimaryPlayer ? GameState.InArena : GameState.InViewingArea)
}

// load the elevator shaft
const towerShaft = new Entity()
towerShaft.addComponent(new GLTFShape("src/models/bitgem/tower-shaft.glb"))
towerShaft.addComponent(new Transform({ position: new Vector3(24, 0, 32) }))
engine.addEntity(towerShaft)

/* tests */

// create a particle spawner
/*const mySpawner = new ParticleSpawner()

mySpawner.particleMinLifetime = 0.5
mySpawner.particleMaxLifetime = 0.7

mySpawner.spawnRate = 0
mySpawner.maxPoolSize = 20

mySpawner.position = new Vector3(24, 2, 0.5)
mySpawner.angles = new Vector3(0, 0, 0)

mySpawner.spawnAngle = 60.0

mySpawner.particleMinSpeed = 15
mySpawner.particleMaxSpeed = 20

mySpawner.particleDampeningSpeed = 1
mySpawner.particleDampeningRate = 10

mySpawner.particleGravity = new Vector3(0, -6, 0)

mySpawner.particleMinScale = 0.05
mySpawner.particleMaxScale = 0.15
mySpawner.particleScaleOverTime = true
mySpawner.particleScaleOverTimeCurve = new BezierCurve(
    new Vector2(0, 0),
    new Vector2(0.6, 1),
    new Vector2(0.7, 1),
    new Vector2(0.9, 1),
    new Vector2(1, 0)
)

const particleShape = new SphereShape()
particleShape.withCollisions = false
mySpawner.onCreateParticle = (_entity: Entity, _particle: ParticleBehaviour) => {
    _entity.addComponent(particleShape)
}

const mySpawnerObject = new Entity()
mySpawnerObject.addComponent(mySpawner)
engine.addEntity(mySpawnerObject)*/

// mySpawner.spawn()




// debug - spawn an enemy on the ground
const testEnemyLocations = [
    new Vector3(16, 2, 16),
    new Vector3(32, 2, 16),
    new Vector3(16, 2, 48),
    new Vector3(32, 2, 48)
]
for (let i = 0; i < testEnemyLocations.length; i++) {
    const testEnemy = Enemy.spawn(Math.random() < 0.5 ? EnemyType.ChompyBoi : EnemyType.Squid, 1000, testEnemyLocations[i], Vector3.Zero()).getComponent(EnemyComponent)
    testEnemy.targetPosition = new Vector3(MathUtils.getRandomBetween(16, 32), 2, MathUtils.getRandomBetween(16, 48))
    testEnemy.onDeath = () => {
        testEnemyMover.cancel()
    }
    const testEnemyMover = new DelayedTask(() => {
        testEnemy.targetPosition = new Vector3(MathUtils.getRandomBetween(16, 32), 2, MathUtils.getRandomBetween(16, 48))
    }, 1, true)
}
// debug - spawn a turret
const myTurret = new Turret(TurretType.Gun, new Vector3(24, 0, 32)).getComponent(TurretComponent)
myTurret.damage = 4
myTurret.rateOfFire = 3
myTurret.aimForce = 20
myTurret.aimDampening = 5

// debug - occasionally report out the player posisiton
/*new DelayedTask(() => {
    ui.displayAnnouncement(Camera.instance.position.x + ", " + Camera.instance.position.y + ", " + Camera.instance.position.z)
}, 5, true)*/

/*

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
engine.addEntity(tower)*/


/*const sentry = new Entity()
let sentryTransform = new Transform({ position: new Vector3(4, 0.7, 4), rotation: Quaternion.Euler(0, 225, 0), scale: new Vector3(2, 2, 2) })
sentry.addComponent(sentryTransform)
const sentryShape = new GLTFShape("src/models/enemies/sentry.glb")
sentry.addComponent(sentryShape)
engine.addEntity(sentry)
sentryTransform = sentry.children[0].getComponent(Transform)
sentryTransform.position = new Vector3(0, -100, 0)*/

/*const server = new Entity()
server.addComponent(new Transform({ position: new Vector3(32, 0, 24), scale: new Vector3(0.9, 0.9, 0.9) }))
server.addComponent(new GLTFShape("src/models/interior/server.glb"))
engine.addEntity(server)*/


/*const server = new Entity()
server.addComponent(new Transform({ position: new Vector3(32, 0, 24), scale: new Vector3(0.9, 0.9, 0.9) }))
server.addComponent(new GLTFShape("src/textures/grasstest.glb"))
engine.addEntity(server)
*/