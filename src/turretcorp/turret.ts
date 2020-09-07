import { EnemyComponent, Enemy } from "./enemy"
import { MathUtils } from "../math/utils"
import { DebugRay } from "../debug/ray"

class __EnemyListItem {
    id: string
    component: EnemyComponent
}

export class TurretSystem implements ISystem {

    /* fields */

    // references
    __allEnemies = engine.getComponentGroup(EnemyComponent)
    __allTurrets = engine.getComponentGroup(TurretComponent)

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // sort the enemies by how far along the path they are (always target the biggest threat in range)
        let enemies: __EnemyListItem[] = []
        for (let e of this.__allEnemies.entities) {
            enemies.push({ id: e.uuid, component: e.getComponent(EnemyComponent)})
        }
        if (enemies.length === 0) {
            return
        }
        enemies.sort((a, b) => { return a.component.pathIndex > b.component.pathIndex ? 1 : a.component.pathIndex < b.component.pathIndex ? -1 : 0 })

        // iterate all turrets
        for (let e of this.__allTurrets.entities) {

            // grab the turret component
            const turret = e.getComponent(TurretComponent)
            const transform = e.getComponent(Transform)

            // todo : find the optimal enemy to target
            const enemyId = enemies[enemies.length - 1].id
            const enemy = enemies[enemies.length - 1].component

            // aim at the enemy
            const dist = enemy.position.subtract(turret.pitcher.position.add(transform.position))
            let flatDist = new Vector3(dist.x, 0, dist.z)
            let targetAngles = new Vector3(Math.atan2(dist.y, flatDist.length()) * -RAD2DEG, Math.atan2(dist.x, dist.z) * RAD2DEG, 0)
            let angDif = targetAngles.subtract(turret.__angles)
            while (angDif.x > 180) {
                angDif.x -= 360
            }
            while (angDif.x < -180) {
                angDif.x += 360
            }
            while (angDif.y > 180) {
                angDif.y -= 360
            }
            while (angDif.y < -180) {
                angDif.y += 360
            }
            while (angDif.z > 180) {
                angDif.z -= 360
            }
            while (angDif.z < -180) {
                angDif.z += 360
            }
            turret.__aimVelocity.addInPlace(angDif.scale(turret.aimForce * _deltaTime).subtract(turret.__aimVelocity.scale(turret.aimDampening * _deltaTime)))
            turret.__angles.addInPlace(turret.__aimVelocity.scale(_deltaTime))
            turret.rotator.rotation = Quaternion.Euler(0, turret.__angles.y, 0)
            turret.pitcher.rotation = Quaternion.Euler(turret.__angles.x - turret.__recoilLevel * 45, 0, 0)
            //turret.pitcher.position = new Vector3(0, 1 + Math.sin(turret.__angles.x * DEG2RAD) * turret.__recoilLevel, -Math.cos(turret.__angles.x * DEG2RAD) * turret.__recoilLevel)
            turret.barrel.position = new Vector3(0, 0, 0.2 - turret.__recoilLevel * 0.65)

            // handle firing
            turret.__sinceLastShot += turret.rateOfFire * _deltaTime
            if (turret.__sinceLastShot < 0 || turret.__sinceLastShot >= 1) {
                turret.__sinceLastShot = 0
                turret.__fireAudio.playOnce()
                //turret.__recoilVelocity += turret.recoilStrength
                turret.__recoilLevel += turret.recoilStrength
                const pitcherPos = turret.pitcher.position.add(transform.position)//.add(MathUtils.getUpVector(turret.__angles).scale(0.5))
                let ray = PhysicsCast.instance.getRayFromPositions(pitcherPos, pitcherPos.add(MathUtils.getForwardVector(turret.__angles).scale(turret.range)))
                PhysicsCast.instance.hitFirst(ray, (e: RaycastHitEntity) => {
                    
                    // get the start and end points for a visual effect
                    let rayStart = new Vector3(ray.origin.x, ray.origin.y, ray.origin.z)
                    let rayEnd = rayStart.add(new Vector3(e.ray.direction.x * e.ray.distance, e.ray.direction.y * e.ray.distance, e.ray.direction.z * e.ray.distance))

                    // check something was hit
                    if (e.didHit) {

                        // limit the ray length for visuals
                        rayEnd = new Vector3(e.hitPoint.x, e.hitPoint.y, e.hitPoint.z)

                        // grab the parent of the hit entity (enemy colliders are sub-objects)
                        const hitEnemy = engine.entities[e.entity.entityId].getParent()
                        if (hitEnemy && hitEnemy !== null) {

                            // try to find an enemy component
                            const hitEnemyComponent = hitEnemy.getComponent(EnemyComponent)
                            if (hitEnemyComponent && hitEnemyComponent !== null) {

                                // damage the hit enemy
                                hitEnemyComponent.takeDamage(turret.damage, new Vector3(e.hitPoint.x, e.hitPoint.y, e.hitPoint.z))
                            }
                        }
                    }

                    // render the visual effect
                    new DebugRay(rayStart, rayEnd, 0.2)
                })
            }
            turret.__recoilVelocity += (-turret.__recoilLevel * turret.recoilForce * _deltaTime) - (turret.__recoilVelocity * turret.recoilDampening * _deltaTime)
            turret.__recoilLevel += turret.__recoilVelocity * _deltaTime
        }
    }
}

@Component("TurretComponent")
export class TurretComponent {

    /* fields */

    // references
    rotator: Transform
    pitcher: Transform
    barrel: Transform

    // aiming
    aimForce = 8
    aimDampening = 5
    __angles = Vector3.Zero()
    __aimVelocity = Vector3.Zero()

    // shooting
    range = 25
    damage = 5
    __sinceLastShot = Math.random() //-999
    rateOfFire = 1
    __recoilLevel = 0
    __recoilVelocity = 0
    recoilStrength = 0.7
    recoilForce = 100
    recoilDampening = 7

    // audio
    __fireAudio: AudioSource

    /* constructor */

    constructor(_fireAudio: AudioSource) {
        this.__fireAudio = _fireAudio
    }
}

export class Turret extends Entity {

    /* static fields */

    // reusable meshes
    static __gunBaseShape: GLTFShape
    static __gunPitcherShape: GLTFShape
    static __gunBarrelShape: GLTFShape

    // reusable audio
    static __gunFireAudio: AudioClip

    /* constructor */

    constructor(_position: Vector3) {

        // call the base constructor
        super()

        // ensure the shared mesh is loaded
        if (!Turret.__gunBaseShape || Turret.__gunBaseShape === null) {
            //Turret.__gunBaseShape = new GLTFShape("src/models/bitgem/turret-gun-base.glb")
            Turret.__gunBaseShape = new GLTFShape("src/models/bitgem/matt-gun-base.glb")
        }
        if (!Turret.__gunPitcherShape || Turret.__gunPitcherShape === null) {
            //Turret.__gunPitcherShape = new GLTFShape("src/models/bitgem/turret-gun-pitcher.glb")
            Turret.__gunPitcherShape = new GLTFShape("src/models/bitgem/matt-gun-head.glb")
        }
        if (!Turret.__gunBarrelShape || Turret.__gunBarrelShape === null) {
            Turret.__gunBarrelShape = new GLTFShape("src/models/bitgem/matt-gun-barrel.glb")
        }

        // ensure the shared audio is loaded
        if (!Turret.__gunFireAudio || Turret.__gunFireAudio === null) {
            Turret.__gunFireAudio = new AudioClip("src/audio/turret-gun-fire.mp3")
        }

        // setup the transform
        this.addComponent(new Transform({ position: _position }))

        // setup the renderer
        this.addComponent(Turret.__gunBaseShape)

        // setup the turret component
        const turretFireAudio = new AudioSource(Turret.__gunFireAudio)
        turretFireAudio.loop = false
        turretFireAudio.playing = false
        this.addComponent(turretFireAudio)
        const turretComponent = new TurretComponent(turretFireAudio)
        this.addComponent(turretComponent)

        // setup the "pitcher" element
        const rotator = new Entity()
        turretComponent.rotator = rotator.addComponent(new Transform())
        const pitcher = new Entity()
        //pitcher.addComponent(new Transform({ position: new Vector3(0, 1, 0) }))
        pitcher.addComponent(new Transform({ position: new Vector3(0, 1.4, 0) }))
        pitcher.addComponent(Turret.__gunPitcherShape)
        turretComponent.pitcher = pitcher.getComponent(Transform)

        // setup the barrel element
        const barrel = new Entity()
        barrel.addComponent(new Transform({ position: new Vector3(0, 0, 0) }))
        barrel.addComponent(Turret.__gunBarrelShape)
        turretComponent.barrel = barrel.getComponent(Transform)

        // register the enemy with the engine
        engine.addEntity(this)
        engine.addEntity(rotator)
        engine.addEntity(pitcher)
        engine.addEntity(barrel)
        rotator.setParent(this)
        pitcher.setParent(rotator)
        barrel.setParent(pitcher)
    }
}