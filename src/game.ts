/* imports */

import { AnglesSpring, AnglesSpringSystem, PositionSpring, PositionSpringSystem } from "./physics/spring"
import { ParallaxComponent, ParallaxSystem } from "./vfx/parallax"
import { ParticleBehaviour, ParticleSpawner, ParticleSystem, ParticleSpawnerSystem } from "./vfx/particles"
import { BezierCurve } from "./math/beziercurve"
import { MathUtils } from "./math/utils"
import { DelayedTask } from "./tasks/delayedtasks"

import { SceneManager } from "./turretcorp/scenemanager"

/* game manager */

enum GameState {
    Outside,
    InElevator,
    InArena,
    InViewingArea
}

class GameManagerSystem implements ISystem {

    /* field definitions */

    // component group
    gameManagers = engine.getComponentGroup(GameManagerBehaviour)

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all game managers
        for (let entity of this.gameManagers.entities) {

            // grab the component
            const gameManager = entity.getComponent(GameManagerBehaviour)

            // check the current state
            switch (gameManager.state) {

                // handle the player being outside (they haven't yet activated an elevator)
                case GameState.Outside: {

                } break

                // handle the player being in the elevator (they have activated the elevator and begun travelling to a floor)
                case GameState.InElevator: {

                    // move the elevator to the target floor
                    const transform = elevator.getComponent(Transform)
                    if (gameManager.previousState === GameState.Outside) {
                        transform.position.addInPlace(Vector3.Up().scale(5 * _deltaTime))
                        if (transform.position.y >= 22.5) {
                            transform.position.y = 22.5
                            gameManager.setState(GameState.InArena)
                            openElevator()
                        }
                    }
                    else {
                        transform.position.addInPlace(Vector3.Up().scale(-5 * _deltaTime))
                        if (transform.position.y <= -0.5) {
                            transform.position.y = -0.5
                            gameManager.setState(GameState.Outside)
                            openElevator()
                        }
                    }
                } break

                // handle the player being in the arena (they are the active player)
                case GameState.InElevator: {

                } break

                // handle the player being in the viewing area (they are spectating another player)
                case GameState.InElevator: {

                } break
            }
        }
    }

}

@Component("GameManagerBehaviour")
class GameManagerBehaviour {

    /* fields */

    previousState = GameState.Outside
    state = GameState.Outside

    /* methods */
    setState(_state: GameState) {
        if (this.state === _state) {
            return
        }
        this.previousState = this.state
        this.state = _state
    }
}

/* register systems */

// physics
engine.addSystem(new PositionSpringSystem())
engine.addSystem(new AnglesSpringSystem())

// vfx
engine.addSystem(new ParallaxSystem())
engine.addSystem(new ParticleSystem())
engine.addSystem(new ParticleSpawnerSystem())

// tower corp
engine.addSystem(new GameManagerSystem())

/* scene setup */

// create a game manager
const gameManagerEntity = new Entity()
const gameManager = new GameManagerBehaviour()
gameManagerEntity.addComponent(gameManager)
engine.addEntity(gameManagerEntity)

// create a scene manager
const sceneManager = new SceneManager()

// load the exterior scene and enable it
sceneManager.loadExterior()
sceneManager.enableExterior()

// load the interior scene but leave it inactive
sceneManager.loadInterior()

// create an elevator
const elevator = new Entity()
elevator.addComponent(new GLTFShape("src/models/bitgem/tower-elevator.glb"))
elevator.addComponent(new Transform({ position: new Vector3(24, -0.5, 2) }))
engine.addEntity(elevator)

const elevatorDoorsShape = new GLTFShape("src/models/bitgem/tower-elevator-doors.glb")

const elevatorDoors = new Entity()
elevatorDoors.addComponent(elevatorDoorsShape)
elevatorDoors.addComponent(new Transform({ position: new Vector3(0, 0, 0) }))
const elevatorDoorAnimator = new Animator()
const elevatorDoorCloseClip = new AnimationState("doors_close", { looping: false })
const elevatorDoorOpenClip = new AnimationState("doors_open", { looping: false })
elevatorDoorAnimator.addClip(elevatorDoorCloseClip)
elevatorDoorAnimator.addClip(elevatorDoorOpenClip)
elevatorDoors.addComponent(elevatorDoorAnimator)
engine.addEntity(elevatorDoors)
elevatorDoors.setParent(elevator)

const elevatorRearDoors = new Entity()
elevatorRearDoors.addComponent(elevatorDoorsShape)
elevatorRearDoors.addComponent(new Transform({ position: new Vector3(0, 0, 2.75) }))
const elevatorRearDoorAnimator = new Animator()
const elevatorRearDoorCloseClip = new AnimationState("doors_close", { looping: false })
const elevatorRearDoorOpenClip = new AnimationState("doors_open", { looping: false })
elevatorRearDoorAnimator.addClip(elevatorRearDoorCloseClip)
elevatorRearDoorAnimator.addClip(elevatorRearDoorOpenClip)
elevatorRearDoors.addComponent(elevatorRearDoorAnimator)
engine.addEntity(elevatorRearDoors)
elevatorRearDoors.setParent(elevator)

const elevatorControls = new Entity()
elevatorControls.addComponent(new GLTFShape("src/models/bitgem/tower-elevator-controls.glb"))
elevatorControls.addComponent(new Transform())
const elevatorControlsAnimator = new Animator()
const elevatorControlsUpClip = new AnimationState("lever_up", { looping: false })
const elevatorControlsDownClip = new AnimationState("lever_down", { looping: false })
elevatorControlsAnimator.addClip(elevatorControlsUpClip)
elevatorControlsAnimator.addClip(elevatorControlsDownClip)
elevatorControls.addComponent(elevatorControlsAnimator)
engine.addEntity(elevatorControls)
elevatorControls.setParent(elevator)

elevatorControlsUpClip.stop()
elevatorControlsDownClip.play()

// methods to handle opening/closing the elevator doors and any other related actions
const closeElevator = function(): boolean {
    
    // can't open if already closed
    if (!elevatorDoorsAreOpen) {
        return false
    }

    // run the animations
    elevatorDoorOpenClip.stop()
    elevatorDoorCloseClip.play()
    elevatorRearDoorOpenClip.stop()
    elevatorRearDoorCloseClip.play()

    // time a dust particle burst with the door close animation
    new DelayedTask(() => {
        mySpawner.burst(20)            
    }, 0.35)

    // change the game state
    new DelayedTask(() => {
        
        // check if we're outside
        if (gameManager.state === GameState.Outside) {

            // switch from exterior to interior (automatically disables exterior)
            sceneManager.enableInterior()
        }
        else {

            new DelayedTask(() => {

                // switch from interior to exterior (automatically disables interior)
                sceneManager.enableExterior()
            }, 1.5)
        }

        gameManager.setState(GameState.InElevator)
    }, 0.75)

    // flag as close
    elevatorDoorsAreOpen = false

    return true
}
const openElevator = function(): boolean {
    
    // can't open if already open
    if (elevatorDoorsAreOpen) {
        return false
    }

    // run the animations
    if (gameManager.state === GameState.Outside) {
        elevatorRearDoorOpenClip.stop()
        elevatorRearDoorCloseClip.play()
        elevatorDoorCloseClip.stop()
        elevatorDoorOpenClip.play()
    }
    else {
        elevatorDoorOpenClip.stop()
        elevatorDoorCloseClip.play()
        elevatorRearDoorCloseClip.stop()
        elevatorRearDoorOpenClip.play()
    }

    // flag as open
    elevatorDoorsAreOpen = true

    return true
}

elevatorControls.addComponent(new OnClick((e) => {

    if (gameManager.state === GameState.InElevator) {
        return
    }

    // toggle the lever
    if (gameManager.state === GameState.Outside) {
        elevatorControlsDownClip.stop()
        elevatorControlsUpClip.play()
        new DelayedTask(() => {
            closeElevator()
        }, 0.35)
    }
    else {
        elevatorControlsUpClip.stop()
        elevatorControlsDownClip.play()
        new DelayedTask(() => {
            closeElevator()
        }, 0.35)
    }
}, { distance: 2 }))

// by default, open the elevator and set as ground floor
let elevatorDoorsAreOpen = false
openElevator()

// load the elevator shaft
const towerShaft = new Entity()
towerShaft.addComponent(new GLTFShape("src/models/bitgem/tower-shaft.glb"))
towerShaft.addComponent(new Transform({ position: new Vector3(24, 0, 32) }))
engine.addEntity(towerShaft)

/* tests */

// create a particle spawner
const mySpawner = new ParticleSpawner()

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
engine.addEntity(mySpawnerObject)

// Input.instance.subscribe("BUTTON_DOWN", ActionButton.POINTER, false, (e) => {
//     mySpawner.spawn()
// })
// mySpawner.spawn()






// debug - move player straight to elevator
movePlayerTo(new Vector3(24, 2, 0))

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