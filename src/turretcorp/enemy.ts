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
    static enemyPath = [
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
                enemy.pathIndex = Math.min(EnemySystem.enemyPath.length - 1, Math.max(0, enemy.pathIndex))
                enemy.targetPosition = EnemySystem.enemyPath[enemy.pathIndex]
            }

            // check the remaining distance
            let dist = enemy.targetPosition.subtract(enemy.position.add(enemy.velocity.scale(0.1)))
            if (dist.length() < 2) {
                if (enemy.pathIndex > -1) {
                    enemy.pathIndex++
                    if (enemy.pathIndex >= EnemySystem.enemyPath.length) {
                        enemy.pathIndex = 0
                    }
                    enemy.targetPosition = EnemySystem.enemyPath[enemy.pathIndex]
                }
            }

            // set velocity based on target position
            //let speed = Math.min(dist.length(), enemy.speed)
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
            enemy.__smoothedAcceleration.addInPlace(acceleration.scale(15 * _deltaTime)).subtractInPlace(enemy.__smoothedAcceleration.scale(5 * _deltaTime))
            let forward = MathUtils.getForwardVector(new Vector3(0, enemy.angles.y, 0))
            let right = MathUtils.getRightVector(new Vector3(0, enemy.angles.y, 0))
            let rockAmount = Vector3.Dot(enemy.__smoothedAcceleration.normalize(), forward) * enemy.__smoothedAcceleration.length() * 30
            let rollAmount = Vector3.Dot(enemy.__smoothedAcceleration.normalize(), right) * enemy.__smoothedAcceleration.length() * -30
            rock.x += rockAmount
            //rock.x += acceleration.length() * 30
            rock.z += rollAmount + enemy.turnVelocity * -0.1
            rock.x = MathUtils.clamp(rock.x, -50, 50)
            rock.z = MathUtils.clamp(rock.z, -50, 50)

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
    pathIndex = -1
    __smoothedAcceleration = Vector3.Zero()

    /* constructor */

    constructor(_roller: Entity, _position: Vector3, _angles: Vector3) {
        this.roller = _roller
        this.position = _position
        this.angles = _angles
    }

    /* methods */

    takeDamage(_damage: number, _location: Vector3) {
        const nudge = this.position.subtract(_location).normalize().scale(_damage * 1)
        nudge.y = Math.min(1, Math.max(-1, nudge.y))
        this.velocity.addInPlace(nudge)
        this.turnVelocity += (1 - (Math.random() * 2)) * _damage * 2
        this.healthBar.current = Math.max(this.healthBar.current - _damage, 0)
        if (this.healthBar.current === 0) {
            this.isActive = false
        }
    }
}

export enum EnemyType {
    Squid,
    ChompyBoi
}

export class Enemy extends Entity {

    /* static fields */

    static __alienMesh1: GLTFShape
    static __alienMesh2: GLTFShape

    /* constructor */

    constructor(_type: EnemyType, _position: Vector3, _angles: Vector3) {

        // call the base constructor
        super()

        // ensure the shared mesh
        if (!Enemy.__alienMesh1 || Enemy.__alienMesh1 === null) {
            Enemy.__alienMesh1 = new GLTFShape("src/models/bitgem/alien_1.glb")
        }
        if (!Enemy.__alienMesh2 || Enemy.__alienMesh2 === null) {
            Enemy.__alienMesh2 = new GLTFShape("src/models/bitgem/alien_2.glb")
        }

        // setup the transform
        this.addComponent(new Transform({ position: _position, rotation: Quaternion.Euler(_angles.x, _angles.y, _angles.z) }))

        // create a child entity to handle rock/roll
        const child = new Entity()
        child.addComponent(new Transform())
        child.setParent(this)

        // setup the renderer
        switch (_type) {
            case EnemyType.ChompyBoi: {
                child.addComponent(Enemy.__alienMesh2)
            } break;
            case EnemyType.Squid: {
                child.addComponent(Enemy.__alienMesh1)
            } break;
        }
        const idleClip =  new AnimationState("Idle", { looping: true, speed: 1, weight: 1 })
        const hitClip =  new AnimationState("Hit", { looping: false, speed: 1, weight: 1 })
        const attackClip =  new AnimationState("Attack", { looping: false, speed: 1, weight: 1 })
        const enemyAnimator = new Animator()
        enemyAnimator.addClip(idleClip)
        enemyAnimator.addClip(hitClip)
        enemyAnimator.addClip(attackClip)
        idleClip.play()
        hitClip.stop()
        attackClip.stop()
        child.addComponent(enemyAnimator)

        // setup the enemy component
        const enemyComponent = new EnemyComponent(child, _position, _angles)
        this.addComponent(enemyComponent)

        // register the enemy with the engine
        engine.addEntity(this)
        engine.addEntity(child)

        // setup a health bar
        enemyComponent.healthBar = new StatBar().getComponent(StatBarComponent)
    }
}