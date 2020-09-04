import { MathUtils } from "../math/utils"
import { DebugRay } from "../debug/ray"
import { StatBar, StatBarComponent } from "./statbar"

export class EnemySystem implements ISystem {

    /* fields */

    // state
    __time = 0
    
    // references
    __allEnemies = engine.getComponentGroup(EnemyComponent)

    // ai data
    enemyPath = [
        new Vector3(24, 25, 4),
        new Vector3(24, 25, 12),
        new Vector3(32, 25, 12),
        new Vector3(40, 25, 20),
        new Vector3(40, 25, 32),
        new Vector3(32, 25, 37),
        new Vector3(24, 25, 34),
        new Vector3(16, 25, 42),
        new Vector3(21, 25, 50),
        new Vector3(24, 25, 56)
    ]

    /* constructor */

    constructor() {

        // debug - render out the proposed enemy paths
        for (let i = 0; i < this.enemyPath.length - 1; i++) {
            new DebugRay(this.enemyPath[i].subtract(new Vector3(0, 2, 0)), this.enemyPath[i + 1].subtract(new Vector3(0, 2, 0)))
        }        
    }

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // increment the time tracker
        this.__time += _deltaTime

        // iterate all enemies
        for (let e of this.__allEnemies.entities) {

            // grab the enemy component
            const enemy = e.getComponent(EnemyComponent)

            // ignore inactive enemies
            if (!enemy.isActive) {
                continue
            }

            // grab the transform
            const transform = e.getComponent(Transform)

            // check if we don't have a target position
            if (!enemy.targetPosition) {
                enemy.targetPosition = this.enemyPath[enemy.pathIndex]
            }

            // check the remaining distance
            let dist = enemy.targetPosition.subtract(enemy.position.add(enemy.velocity.scale(0.1)))
            if (dist.length() < 2) {
                enemy.pathIndex++
                if (enemy.pathIndex >= this.enemyPath.length) {
                    enemy.pathIndex = 0
                }
                enemy.targetPosition = this.enemyPath[enemy.pathIndex]
            }

            // set velocity based on target position
            let speed = Math.min(dist.length(), enemy.speed)
            let targetVelocity = dist.normalize().scale(enemy.speed)
            let acceleration = targetVelocity.subtract(enemy.velocity)
            acceleration = acceleration.normalizeToNew().scale(Math.min(acceleration.length(), enemy.acceleration * _deltaTime))
            enemy.velocity.addInPlace(acceleration)

            // apply velocity
            enemy.position.addInPlace(enemy.velocity.scale(_deltaTime))

            // turn to face direction of movement
            let targetAngle = Math.atan2(enemy.velocity.x, enemy.velocity.z) * RAD2DEG
            let angleDif = targetAngle - enemy.angles.y
            while (angleDif > 180) {
                angleDif -= 360
            }
            while (angleDif < -180) {
                angleDif += 360
            }
            enemy.turnVelocity += (angleDif * enemy.turnForce - enemy.turnVelocity * enemy.turnDampening) * _deltaTime
            enemy.angles.y += enemy.turnVelocity * _deltaTime

            // bob up and down
            let bob = new Vector3(0, Math.sin(this.__time * 4) * 0.2, 0)
            let rock = new Vector3((Math.sin(this.__time * 2 + 1) + 1) * -6, 0, Math.sin(this.__time * 5) * 3)

            // roll when turning
            rock.x += enemy.velocity.length() * 5
            //rock.x += acceleration.length() * 30
            rock.z += enemy.turnVelocity * -0.1

            // update the transform
            transform.position = enemy.position.add(bob)
            let finalAngles = enemy.angles.add(rock)
            transform.rotation = Quaternion.Euler(0, finalAngles.y, 0)
            enemy.roller.getComponent(Transform).rotation = Quaternion.Euler(finalAngles.x, 0, finalAngles.z)

            // update the stat bar
            enemy.healthBar.position = transform.position.add(new Vector3(0, 2, 0))
        }
    }
}

@Component("EnemyComponent")
export class EnemyComponent {

    /* fields */

    // references
    roller: Entity
    healthBar: StatBarComponent

    // state
    isActive = true

    // movement
    position: Vector3
    angles: Vector3
    velocity = Vector3.Zero()
    acceleration = 10.0
    targetPosition: Vector3
    speed = 5.0
    turnForce = 30.0
    turnDampening = 3.0
    turnVelocity = 0.0
    pathIndex = 0

    /* constructor */

    constructor(_roller: Entity, _position: Vector3, _angles: Vector3) {
        this.roller = _roller
        this.position = _position
        this.angles = _angles
    }
}

export class Enemy extends Entity {

    constructor(_position: Vector3, _angles: Vector3) {

        // call the base constructor
        super()

        // setup the transform
        this.addComponent(new Transform({ position: _position, rotation: Quaternion.Euler(_angles.x, _angles.y, _angles.z) }))

        // create a child entity to handle rock/roll
        const child = new Entity()
        child.addComponent(new Transform({ scale: new Vector3(1, 1.5, 2) }))
        child.setParent(this)

        // setup the renderer
        child.addComponent(new BoxShape())

        // setup the enemy component
        const enemyComponent = new EnemyComponent(child, _position, _angles)
        this.addComponent(enemyComponent)

        // register the enemy with the engine
        engine.addEntity(this)
        engine.addEntity(child)

        // setup a health bar
        enemyComponent.healthBar = new StatBar().getComponent(StatBarComponent)
        enemyComponent.healthBar.current = Math.random() * 100
    }
}