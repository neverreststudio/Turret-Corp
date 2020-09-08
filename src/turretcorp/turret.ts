import { EnemyComponent, Enemy } from "./enemy"
import { MathUtils } from "../math/utils"
import { DebugRay, DebugRayComponent } from "../debug/ray"
import { SmokeParticles } from "./smokeparticles"

export enum TurretType {
    Gun,
    Rockets,
    Mortar,
    Stun,
    Generator
}

class __EnemyListItem {
    id: string
    component: EnemyComponent
}

export class TurretSystem implements ISystem {

    /* fields */

    // references
    __allEnemies = engine.getComponentGroup(EnemyComponent)
    __allTurrets = engine.getComponentGroup(TurretComponent)

    // reusable shapes
    __bulletTrail: GLTFShape

    /* constructor */

    constructor() {
        this.__bulletTrail = new GLTFShape("src/models/bitgem/bullet-trail.glb")
    }

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // sort the enemies by how far along the path they are (always target the biggest threat in range)
        let enemies: __EnemyListItem[] = []
        for (let e of this.__allEnemies.entities) {
            const enemyComponent = e.getComponent(EnemyComponent)
            if (!enemyComponent.isActive) {
                continue
            }
            enemies.push({ id: e.uuid, component: enemyComponent })
        }
        if (enemies.length > 0) {
            enemies.sort((a, b) => { return a.component.pathIndex > b.component.pathIndex ? 1 : a.component.pathIndex < b.component.pathIndex ? -1 : 0 })
        }

        // iterate all turrets
        for (let e of this.__allTurrets.entities) {

            // grab the turret component
            const turret = e.getComponent(TurretComponent)
            const transform = e.getComponent(Transform)

            // check for non-firing turrets
            if (turret.type === TurretType.Generator) {

            }
            else if (turret.type === TurretType.Stun) {

            }
            else {
            
                // find the optimal enemy to target
                let enemy: EnemyComponent = null
                let dist = Vector3.Zero()
                for (let i = enemies.length - 1; i > -1; i--) {
                    enemy = enemies[i].component
                    dist = enemy.position.subtract(turret.pitcher.position.add(transform.position))
                    if (dist.length() <= turret.range) {
                        break
                    }
                    enemy = null
                }

                // aim at the enemy
                let targetAngles = new Vector3(30, 180, 0)
                if (enemy !== null) {
                    let flatDist = new Vector3(dist.x, 0, dist.z)
                    targetAngles = new Vector3(Math.atan2(dist.y, flatDist.length()) * -RAD2DEG, Math.atan2(dist.x, dist.z) * RAD2DEG, 0)
                }
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
                if (enemy !== null) {
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
                                    const hitEnemyComponent = hitEnemy.hasComponent(EnemyComponent) ? hitEnemy.getComponent(EnemyComponent) : null
                                    if (hitEnemyComponent && hitEnemyComponent !== null) {

                                        // damage the hit enemy
                                        hitEnemyComponent.takeDamage(hitEnemy, turret.damage, new Vector3(e.hitPoint.x, e.hitPoint.y, e.hitPoint.z))
                                    }
                                }

                                // spawn some smoke particles at the impact
                                SmokeParticles.getInstance().emitSphere(5 + Math.random() * 5, new Vector3(e.hitPoint.x, e.hitPoint.y, e.hitPoint.z), 0.2)
                            }

                            // render the visual effect
                            let dir = rayEnd.subtract(rayStart).normalize()
                            let overshoot = 0
                            if (rayStart.x < 4) {
                                overshoot = (4 - rayStart.x) / dir.x
                            }
                            else if (rayStart.x > 44) {
                                overshoot = (rayStart.x - 44) / dir.x
                            }
                            if (rayStart.z < 4) {
                                overshoot = (4 - rayStart.z) / dir.z
                            }
                            else if (rayStart.z > 60) {
                                overshoot = (rayStart.z - 60) / dir.z
                            }
                            rayStart.addInPlace(new Vector3(dir.x, dir.y, dir.z).scale(Math.abs(overshoot)))
                            if (rayStart.x < 4) {
                                rayStart.x = 4
                            }
                            else if (rayStart.x > 44) {
                                rayStart.x = 44
                            }
                            if (rayStart.z < 4) {
                                rayStart.z = 4
                            }
                            else if (rayStart.z > 60) {
                                rayStart.z = 60
                            }
                            overshoot = 0
                            if (rayEnd.x < 4) {
                                overshoot = (4 - rayEnd.x) / dir.x
                            }
                            else if (rayEnd.x > 44) {
                                overshoot = (rayEnd.x - 44) / dir.x
                            }
                            if (rayEnd.z < 4) {
                                overshoot = (4 - rayEnd.z) / dir.z
                            }
                            else if (rayEnd.z > 60) {
                                overshoot = (rayEnd.z - 60) / dir.z
                            }
                            rayEnd.addInPlace(new Vector3(dir.x, dir.y, dir.z).scale(-Math.abs(overshoot)))
                            if (rayEnd.x < 4) {
                                rayEnd.x = 4
                            }
                            else if (rayEnd.x > 44) {
                                rayEnd.x = 44
                            }
                            if (rayEnd.z < 4) {
                                rayEnd.z = 4
                            }
                            else if (rayEnd.z > 60) {
                                rayEnd.z = 60
                            }
                            new DebugRay(rayStart, rayEnd, Math.min(0.5, Math.max(0.15, rayEnd.subtract(rayStart).length() * 0.05)), true/*, this.__bulletTrail*/).getComponent(DebugRayComponent).trailOff = true
                        })
                    }
                }
                turret.__recoilVelocity += (-turret.__recoilLevel * turret.recoilForce * _deltaTime) - (turret.__recoilVelocity * turret.recoilDampening * _deltaTime)
                turret.__recoilLevel += turret.__recoilVelocity * _deltaTime
            }
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

    // behaviour
    type: TurretType

    // aiming
    aimForce = 8
    aimDampening = 5
    __angles = new Vector3(30, 180, 0)
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

    constructor(_type: TurretType, _fireAudio: AudioSource) {
        this.type = _type
        this.__fireAudio = _fireAudio
    }
}

export class Turret extends Entity {

    /* static fields */

    // reusable meshes
    static __baseShape: GLTFShape
    static __gunHeadShape: GLTFShape
    static __gunBarrelShape: GLTFShape
    static __rocketsHeadShape: GLTFShape
    static __mortarHeadShape: GLTFShape
    static __stunHeadShape: GLTFShape
    static __generatorHeadShape: GLTFShape

    // track live instances
    static __allTurrets: Entity[]

    // reusable audio
    static __gunFireAudio: AudioClip

    /* constructor */

    constructor(_type: TurretType, _position: Vector3) {

        // call the base constructor
        super()

        // ensure the shared mesh is loaded
        if (!Turret.__baseShape || Turret.__baseShape === null) {
            //Turret.__gunBaseShape = new GLTFShape("src/models/bitgem/turret-gun-base.glb")
            Turret.__baseShape = new GLTFShape("src/models/bitgem/matt-gun-base.glb")
        }
        if (!Turret.__gunHeadShape || Turret.__gunHeadShape === null) {
            //Turret.__gunPitcherShape = new GLTFShape("src/models/bitgem/turret-gun-pitcher.glb")
            Turret.__gunHeadShape = new GLTFShape("src/models/bitgem/matt-gun-head.glb")
        }
        if (!Turret.__gunBarrelShape || Turret.__gunBarrelShape === null) {
            Turret.__gunBarrelShape = new GLTFShape("src/models/bitgem/matt-gun-barrel.glb")
        }
        if (!Turret.__rocketsHeadShape || Turret.__rocketsHeadShape === null) {
            Turret.__rocketsHeadShape = new GLTFShape("src/models/bitgem/matt-rockets-head.glb")
        }
        if (!Turret.__mortarHeadShape || Turret.__mortarHeadShape === null) {
            Turret.__mortarHeadShape = new GLTFShape("src/models/bitgem/matt-mortar-head.glb")
        }
        if (!Turret.__stunHeadShape || Turret.__stunHeadShape === null) {
            Turret.__stunHeadShape = new GLTFShape("src/models/bitgem/matt-stun-head.glb")
        }
        if (!Turret.__generatorHeadShape || Turret.__generatorHeadShape === null) {
            Turret.__generatorHeadShape = new GLTFShape("src/models/bitgem/matt-generator-head.glb")
        }

        // ensure the shared audio is loaded
        if (!Turret.__gunFireAudio || Turret.__gunFireAudio === null) {
            Turret.__gunFireAudio = new AudioClip("src/audio/turret-gun-fire.mp3")
        }

        // setup the transform
        this.addComponent(new Transform({ position: _position }))

        // setup the renderer
        this.addComponent(Turret.__baseShape)

        // setup the turret component
        const turretFireAudio = new AudioSource(Turret.__gunFireAudio)
        turretFireAudio.loop = false
        turretFireAudio.playing = false
        this.addComponent(turretFireAudio)
        const turretComponent = new TurretComponent(_type, turretFireAudio)
        this.addComponent(turretComponent)

        // setup the "pitcher" element
        const rotator = new Entity()
        turretComponent.rotator = rotator.addComponent(new Transform())
        const pitcher = new Entity()
        //pitcher.addComponent(new Transform({ position: new Vector3(0, 1, 0) }))
        pitcher.addComponent(new Transform({ position: new Vector3(0, 1.4, 0) }))
        switch (_type) {
            case TurretType.Generator: {
                pitcher.addComponent(Turret.__generatorHeadShape)
            } break
            case TurretType.Gun: {
                pitcher.addComponent(Turret.__gunHeadShape)
            } break
            case TurretType.Mortar:
            case TurretType.Rockets: {
            } break
            case TurretType.Stun: {
                pitcher.addComponent(Turret.__stunHeadShape)
            } break
        }
        turretComponent.pitcher = pitcher.getComponent(Transform)

        // setup the barrel element
        let barrel: Entity = new Entity()
        barrel.addComponent(new Transform({ position: new Vector3(0, 0, 0) }))
        switch (_type) {
            case TurretType.Generator: {
            } break
            case TurretType.Gun: {
                barrel.addComponent(Turret.__gunBarrelShape)
            } break
            case TurretType.Mortar: {
                barrel.addComponent(Turret.__mortarHeadShape)
            } break
            case TurretType.Rockets: {
                barrel.addComponent(Turret.__rocketsHeadShape)
            } break
            case TurretType.Stun: {
            } break
        }
        turretComponent.barrel = barrel.getComponent(Transform)

        // track the turret
        if (!Turret.__allTurrets || Turret.__allTurrets === null) {
            Turret.__allTurrets = []
        }
        Turret.__allTurrets.push(this)

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