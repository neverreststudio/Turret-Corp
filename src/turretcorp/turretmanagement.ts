/* imports */

import * as ui from "../../node_modules/@dcl/ui-utils/index"
import { Turret, TurretType } from "./turret"

/* class definition */

class TurretLocation {
    position: Vector3
    turret: Entity
    constructor(_x: number, _y: number, _z: number) {
        this.position = new Vector3(_x, _y, _z)
        this.turret = null
    }
}

export class TurretManagementSystem implements ISystem {

    /* static fields */

    static instance: TurretManagementSystem = null

    /* fields */
    
    __camera = Camera.instance

    __interactionRange = 4
    __activeLocationIndex = -1

    __turretLocations: TurretLocation[] = [
        new TurretLocation(8, 24.5, 12),
        new TurretLocation(40, 24.5, 8),
        new TurretLocation(16, 24.5, 20),
        new TurretLocation(32, 24.5, 20),
        new TurretLocation(32, 24.5, 30),
        new TurretLocation(12, 24.5, 36),
        new TurretLocation(12, 24.5, 50),
        new TurretLocation(24, 24.5, 42),
        new TurretLocation(40, 24.5, 42),
        new TurretLocation(32, 24.5, 50)
    ]

    __iconMaterial: BasicMaterial

    __iconHolder: Entity
    __iconGun: Entity
    __iconRockets: Entity
    __iconMortar: Entity
    __iconStun: Entity
    __iconGenerator: Entity

    __iconRatio = 0
    __iconVelocity = 0
    __iconForce = 100
    __iconDampening = 8

    /* constructor */

    constructor() {
        
        // make this the shared instance
        TurretManagementSystem.instance = this

        // create the turret placement icons
        this.__iconHolder = new Entity()
        this.__iconHolder.addComponent(new Transform())
        this.__iconGun = this.createIcon(TurretType.Gun, "Gun", 0, 0.5, 0.25, 1)
        this.__iconGun.setParent(this.__iconHolder)
        this.__iconRockets = this.createIcon(TurretType.Rockets, "Rocket Launcher", 0.25, 0.5, 0.5, 1)
        this.__iconRockets.setParent(this.__iconHolder)
        this.__iconMortar = this.createIcon(TurretType.Mortar, "Mortar", 0.5, 0.5, 0.75, 1)
        this.__iconMortar.setParent(this.__iconHolder)
        this.__iconStun = this.createIcon(TurretType.Stun, "Stun", 0.75, 0.5, 1, 1)
        this.__iconStun.setParent(this.__iconHolder)
        this.__iconGenerator = this.createIcon(TurretType.Generator, "Generator", 0, 0, 0.25, 0.5)
        this.__iconGenerator.setParent(this.__iconHolder)
        engine.addEntity(this.__iconHolder)
    }

    /* methods */

    createIcon(_type: TurretType, _name: string, _u0: number, _v0: number, _u1: number, _v1: number): Entity {

        // ensure the shared icon material
        if (!this.__iconMaterial || this.__iconMaterial === null) {
            this.__iconMaterial = new BasicMaterial()
            this.__iconMaterial.alphaTest = 0.5
            this.__iconMaterial.texture = new Texture("src/textures/ui/turrets.png", { hasAlpha: true, wrap: 0 })
        }

        // create the icon entity
        const newIcon = new Entity()

        // initialise to shrunk away
        newIcon.addComponent(new Transform({ position: new Vector3(24, -10, 32), scale: Vector3.Zero() }))

        // set up the shape with custom uvs
        const shape = new PlaneShape()
        shape.uvs = [
            _u0, _v0,
            _u1, _v0,
            _u1, _v1,
            _u0, _v1,
            _u0, _v0,
            _u1, _v0,
            _u1, _v1,
            _u0, _v1
        ]
        newIcon.addComponent(shape)

        // apply the material
        newIcon.addComponent(this.__iconMaterial)

        // add the onclick
        newIcon.addComponent(new OnClick(() => {
            if (this.__turretLocations[this.__activeLocationIndex].turret !== null) {
                return
            }
            const position = this.__turretLocations[this.__activeLocationIndex].position
            const newTurret = new Turret(_type, position)
            this.__turretLocations[this.__activeLocationIndex].turret = newTurret
        }, {
            hoverText: "Place a " + _name
        }))

        // register and return the icon
        engine.addEntity(newIcon)
        return newIcon
    }

    reset() {
        for (let i = 0; i < this.__turretLocations.length; i++) {
            this.__turretLocations[i].turret = null
        }
    }

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // iterate the turret locations
        let oldActiveLocationIndex = this.__activeLocationIndex
        this.__activeLocationIndex = -1
        for (let l = 0; l < this.__turretLocations.length; l++) {

            let location = this.__turretLocations[l]

            // check if the player is near enough to interact
            let dist = location.position.subtract(this.__camera.position)
            if (Math.abs(dist.x) < this.__interactionRange) {
                if (Math.abs(dist.z) < this.__interactionRange) {

                    // use this as the active location
                    this.__activeLocationIndex = l
                    break
                }
            }
        }

        // grab the transform for the ui wrapper
        const iconHolder = this.__iconHolder.getComponent(Transform)

        // animate the icons in/out
        const isShowing = this.__activeLocationIndex > -1 && this.__turretLocations[this.__activeLocationIndex].turret === null
        let targetRatio = isShowing ? 1 : 0
        let dif = targetRatio - this.__iconRatio
        let acc = dif * this.__iconForce * _deltaTime
        let dec = this.__iconVelocity * this.__iconDampening * (isShowing ? 1 : 2) * _deltaTime
        this.__iconVelocity += acc - dec
        this.__iconRatio += this.__iconVelocity * _deltaTime
        const allIcons = [
            this.__iconGun.getComponent(Transform),
            this.__iconRockets.getComponent(Transform),
            this.__iconMortar.getComponent(Transform),
            this.__iconStun.getComponent(Transform),
            this.__iconGenerator.getComponent(Transform)
        ]
        for (let i = 0; i < allIcons.length; i++) {
            const transform = allIcons[i]
            const angle = -i * Math.PI * 2 * this.__iconRatio / allIcons.length
            transform.position = new Vector3(
                Math.sin(angle) * this.__iconRatio,
                Math.cos(angle) * this.__iconRatio,
                0
            )
            const scale = Math.max(0, this.__iconRatio)
            transform.scale = new Vector3(scale, scale, scale)
        }

        // check if there is a ui to show
        if (this.__activeLocationIndex > -1) {

            // position the icons above the location
            iconHolder.position = this.__turretLocations[this.__activeLocationIndex].position.add(new Vector3(0, 1.5, 0))
        }

        // always point the ui towards the camera
        iconHolder.lookAt(this.__camera.position)
    }
}