import { MathUtils } from "../math/utils"
import { SmokeParticles } from "./smokeparticles"
import { DebugRay } from "../debug/ray"
import { StatBar, StatBarComponent } from "./statbar"
import { DelayedTask } from "../tasks/delayedtasks"
import { GameManager, GameManagerBehaviour } from "./gamemanager"

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
            let dist = enemy.targetPosition.subtract(enemy.position.add(enemy.__velocity.scale(0.1)))
            if (dist.length() < 2) {
                if (enemy.pathIndex > -1) {
                    enemy.pathIndex++
                    
                    // if the enemy has reached the goal, stay there, do an attack, and blow up
                    if (enemy.pathIndex >= EnemySystem.enemyPath.length) {
                        enemy.pathIndex = -1
                        enemy.isActive = false
                        enemy.__idleAnimation.stop()
                        enemy.__hitAnimation.stop()
                        enemy.__attackAnimation.reset()
                        enemy.__attackAnimation.play()
                        new DelayedTask(() => {
                            GameManagerBehaviour.instance.playerHealthBar.current -= enemy.damage
                            enemy.takeDamage(e, 9999, enemy.position)
                        }, enemy.type === EnemyType.ChompyBoi ? 1.35 : 1.15)
                    }
                    else {
                        enemy.targetPosition = EnemySystem.enemyPath[enemy.pathIndex]
                    }
                }
            }

            // set velocity based on target position
            //let speed = Math.min(dist.length(), enemy.speed)
            let targetVelocity = dist.normalize().scale(enemy.speed)
            let acceleration = targetVelocity.subtract(enemy.__velocity)
            acceleration = acceleration.normalizeToNew().scale(Math.min(acceleration.length(), enemy.acceleration * _deltaTime))
            enemy.__velocity.addInPlace(acceleration)

            // apply velocity
            enemy.position.addInPlace(enemy.__velocity.scale(_deltaTime))

            // turn to face direction of movement
            let targetAngle = Math.atan2(enemy.__velocity.x, enemy.__velocity.z) * RAD2DEG
            let angleDif = targetAngle - enemy.angles.y
            while (angleDif > 180) {
                angleDif -= 360
            }
            while (angleDif < -180) {
                angleDif += 360
            }
            enemy.__turnVelocity += (angleDif * enemy.turnForce - enemy.__turnVelocity * enemy.turnDampening) * _deltaTime
            enemy.angles.y += enemy.__turnVelocity * _deltaTime

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
            rock.z += rollAmount + enemy.__turnVelocity * -0.1
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
    transform: Transform
    roller: Entity
    healthBar: StatBarComponent

    // state
    isActive = true

    // behaviour
    type: EnemyType
    damage = 1

    // movement
    position: Vector3
    angles: Vector3
    __velocity = Vector3.Zero()
    acceleration = 10.0
    targetPosition: Vector3
    speed = 5.0
    turnForce = 30.0
    turnDampening = 3.0
    __turnVelocity = 0.0
    pathIndex = -1
    __smoothedAcceleration = Vector3.Zero()

    // animations
    __idleAnimation: AnimationState
    __hitAnimation: AnimationState
    __attackAnimation: AnimationState
    __cancelHitTask: DelayedTask

    // callbacks
    onDeath: Function

    /* constructor */

    constructor(_type: EnemyType, _transform: Transform, _roller: Entity, _idleAnimation: AnimationState, _hitAnimation: AnimationState, _attackAnimation: AnimationState, _health: number, _position: Vector3, _angles: Vector3) {
        
        // store the references
        this.type = _type
        this.transform = _transform
        this.roller = _roller
        this.__idleAnimation = _idleAnimation
        this.__hitAnimation = _hitAnimation
        this.__attackAnimation = _attackAnimation
    }

    /* methods */

    kill(_isInstant: boolean = false) {
        
        // disable the enemy
        this.isActive = false
        this.transform.scale = Vector3.Zero()
        this.transform.position = new Vector3(24, -10, 32)
        this.healthBar.position = new Vector3(24, -10, 32)

        // fire any callback and clear it
        if (this.onDeath && this.onDeath !== null) {
            this.onDeath(this)
            this.onDeath = null
        }
    }

    reset(_health: number, _position: Vector3, _angles: Vector3) {

        // store the transform data
        this.position = _position
        this.angles = _angles

        // reset all physics
        this.__smoothedAcceleration = Vector3.Zero()
        this.__velocity = Vector3.Zero()
        
        // reset aiming
        this.__turnVelocity = 0.0

        // reset all pathing data
        this.pathIndex = -1
        this.targetPosition = null

        // reset health
        this.healthBar.current = _health
        this.healthBar.max = _health
        this.healthBar.position = this.position.add(new Vector3(0, 2, 0))

        // initialise transform
        this.transform.scale = Vector3.One()
        this.transform.position = this.position

        // make active
        this.isActive = true
    }

    takeDamage(_entity: IEntity, _damage: number, _location: Vector3) {

        // play the hit animation
        this.__idleAnimation.stop()
        this.__hitAnimation.reset()
        this.__hitAnimation.play()
        if (this.__cancelHitTask && this.__cancelHitTask !== null) {
            this.__cancelHitTask.cancel()
        }
        this.__cancelHitTask = new DelayedTask(() => {
            this.__hitAnimation.stop()
            this.__idleAnimation.play()
        }, 1.5)

        // work out how much of a nudge to give
        const nudge = this.position.subtract(_location).normalize().scale(Math.min(5, _damage * 0.25))
        nudge.y = Math.min(1, Math.max(-1, nudge.y))
        this.__velocity.addInPlace(nudge)
        this.__turnVelocity += (1 - (Math.random() * 2)) * _damage * 2

        // reduce health
        this.healthBar.current = Math.max(this.healthBar.current - _damage, 0)

        // if dead, kill
        if (this.healthBar.current === 0) {

            // spawn some bonus particles to hide the enemy dissappearing
            SmokeParticles.getInstance().emitSphere(15 + Math.random() * 8, this.transform.position, 0.2)

            this.kill()
        }
    }
}

export enum EnemyType {
    Squid = 0,
    ChompyBoi = 1
}

export class Enemy extends Entity {

    /* static fields */

    // reusable meshes
    static __alienMesh1: GLTFShape
    static __alienMesh2: GLTFShape

    // pooling
    static __expectingCreate = false
    static __pools: Entity[][]
    static __maxPoolSize = 20

    /* constructor */

    constructor(_type: EnemyType, _health: number, _position: Vector3, _angles: Vector3) {

        // call the base constructor
        super()

        // ensure we've come through the spawn method
        if (!Enemy.__expectingCreate) {
            error("Don't call the Enemy constructor directly - use the Spawn method.")
            return
        }
        Enemy.__expectingCreate = false

        // ensure the shared mesh
        if (!Enemy.__alienMesh1 || Enemy.__alienMesh1 === null) {
            Enemy.__alienMesh1 = new GLTFShape("src/models/bitgem/alien_1.glb")
        }
        if (!Enemy.__alienMesh2 || Enemy.__alienMesh2 === null) {
            Enemy.__alienMesh2 = new GLTFShape("src/models/bitgem/alien_2.glb")
        }

        // setup the transform
        const transform = new Transform({ position: _position, rotation: Quaternion.Euler(_angles.x, _angles.y, _angles.z) })
        this.addComponent(transform)

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
        const enemyComponent = new EnemyComponent(_type, transform, child, idleClip, hitClip, attackClip, _health, _position, _angles)
        this.addComponent(enemyComponent)

        // register the enemy with the engine
        engine.addEntity(this)
        engine.addEntity(child)

        // setup a health bar
        enemyComponent.healthBar = new StatBar().getComponent(StatBarComponent)
        
        // reset the enemy
        enemyComponent.reset(_health, _position, _angles)

        // add to the pool
        Enemy.__pools[_type].push(this)
    }

    /* static methods */

    static spawn(_type: EnemyType, _health: number, _position: Vector3, _angles: Vector3): Entity {

        // ensure the pools are prepared
        if (!Enemy.__pools || Enemy.__pools === null) {
            Enemy.__pools = []
        }
        while (Enemy.__pools.length <= _type) {
            Enemy.__pools.push([])
        }

        // check for an existing enemy from the pool
        for (let i = 0; i < Enemy.__pools[_type].length; i++) {
            const enemy = Enemy.__pools[_type][i]
            if (enemy && enemy !== null) {
                const enemyComponent = enemy.getComponent(EnemyComponent)
                if (enemyComponent && enemyComponent !== null && !enemyComponent.isActive) {
                    
                    // prep the enemy
                    enemyComponent.reset(_health, _position, _angles)

                    // return it
                    return enemy
                }
            }
        }

        // if there is no room left in the pool then we'll have to give up
        if (Enemy.__pools[_type].length >= Enemy.__maxPoolSize) {
            return null
        }

        // prep for creation
        Enemy.__expectingCreate = true

        // create the enemy (automatically added to the pool) and return it
        return new Enemy(_type, _health, _position, _angles)
    }
}