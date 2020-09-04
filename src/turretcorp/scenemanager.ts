/* imports */

import { ParallaxComponent } from "../vfx/parallax"

/* scene management */

export class SceneManager {

    /* fields */

    // private
    __exteriorEntities: Entity[]
    __interiorEntities: Entity[]

    // state
    isExteriorEnabled = false
    isInteriorEnabled = false

    // exterior elements
    towerExterior: Entity

    // interior elements
    towerArena: Entity
    turretLayout: Entity
    windowLayer1: Entity
    windowLayer2: Entity
    windowLayer3: Entity

    /* constructor */

    constructor() {

        // prepare collections of entities for exterior/interior for more easily enabling/disabling in bulk
        this.__exteriorEntities = []
        this.__interiorEntities = []
    }

    /* methods */

    disableExterior() {
        
        // don't run twice
        if (!this.isExteriorEnabled) {
            return
        }

        // iterate the exterior entities and unregister them
        for (let i = 0; i < this.__exteriorEntities.length; i++) {
            engine.removeEntity(this.__exteriorEntities[i])
        }

        // flag as disabled
        this.isExteriorEnabled = false
    }

    disableInterior() {
        
        // don't run twice
        if (!this.isInteriorEnabled) {
            return
        }

        // iterate the interior entities and unregister them
        for (let i = 0; i < this.__interiorEntities.length; i++) {
            engine.removeEntity(this.__interiorEntities[i])
        }

        // flag as disabled
        this.isInteriorEnabled = false
    }

    enableExterior() {
        
        // don't run twice
        if (this.isExteriorEnabled) {
            return
        }

        // ensure the interior is disabled
        this.disableInterior()

        // iterate the exterior entities and register them
        for (let i = 0; i < this.__exteriorEntities.length; i++) {
            engine.addEntity(this.__exteriorEntities[i])
        }

        // flag as enabled
        this.isExteriorEnabled = true
    }

    enableInterior() {
        
        // don't run twice
        if (this.isInteriorEnabled) {
            return
        }

        // ensure the interior is disabled
        this.disableExterior()

        // iterate the interior entities and register them
        for (let i = 0; i < this.__interiorEntities.length; i++) {
            engine.addEntity(this.__interiorEntities[i])
        }

        // flag as enabled
        this.isInteriorEnabled = true
    }

    loadExterior() {

        // load the tower's exterior
        this.towerExterior = new Entity()
        this.towerExterior.addComponent(new GLTFShape("src/models/bitgem/tower-exterior.glb"))
        this.towerExterior.addComponent(new Transform({ position: new Vector3(24, 0, 32) }))
        this.__exteriorEntities.push(this.towerExterior)
    }

    loadInterior() {

        // prepare the arena but don't activate it so it doesn't count towards limits
        this.towerArena = new Entity()
        this.towerArena.addComponent(new GLTFShape("src/models/bitgem/tower-arena.glb"))
        this.towerArena.addComponent(new Transform({ position: new Vector3(24, 0, 32) }))
        this.__interiorEntities.push(this.towerArena)

        // load the turret layout
        this.turretLayout = new Entity()
        this.turretLayout.addComponent(new GLTFShape("src/models/bitgem/turret-layout.glb"))
        this.turretLayout.addComponent(new Transform({ position: new Vector3(24, 0, 32)}))
        this.__interiorEntities.push(this.turretLayout)

        // create the parallax layers for the "window"
        // --- layer 1 : sky
        const skyTexture = new Texture("src/textures/sky.png", { samplingMode: 1, wrap: 0, hasAlpha: false })
        const skyMaterial = new Material()
        skyMaterial.transparencyMode = TransparencyMode.OPAQUE
        skyMaterial.albedoTexture = skyTexture
        skyMaterial.emissiveTexture = skyTexture
        skyMaterial.emissiveIntensity = 1
        skyMaterial.roughness = 1
        skyMaterial.metallic = 0
        this.windowLayer1 = new Entity()
        this.windowLayer1.addComponent(new Transform({ position: new Vector3(24, 33, 63), rotation: Quaternion.Euler(0, 0, 0), scale: new Vector3(48, 24, 1)}))
        const skyPlane = new PlaneShape()
        this.windowLayer1.addComponent(skyPlane)
        this.windowLayer1.addComponent(skyMaterial)
        this.windowLayer1.addComponent(new ParallaxComponent(skyPlane, 100))
        this.__interiorEntities.push(this.windowLayer1)
        // --- layer 2 : distant buildings
        const skylineTexture = new Texture("src/textures/skyline-1.png", { samplingMode: 1, wrap: 2, hasAlpha: true })
        const skylineMaterial = new Material()
        skylineMaterial.transparencyMode = TransparencyMode.ALPHA_TEST
        skylineMaterial.alphaTest = 0.01
        skylineMaterial.albedoTexture = skylineTexture
        skylineMaterial.emissiveTexture = skylineTexture
        skylineMaterial.emissiveIntensity = 1
        skylineMaterial.roughness = 1
        skylineMaterial.metallic = 0
        this.windowLayer2 = new Entity()
        this.windowLayer2.addComponent(new Transform({ position: new Vector3(24, 34, 62.99), rotation: Quaternion.Euler(0, 0, 0), scale: new Vector3(48, 48, 1)}))
        const skylinePlane = new PlaneShape()
        this.windowLayer2.addComponent(skylinePlane)
        this.windowLayer2.addComponent(skylineMaterial)
        this.windowLayer2.addComponent(new ParallaxComponent(skylinePlane, 45))
        this.__interiorEntities.push(this.windowLayer2)
        // --- layer 3 : near buildings
        const skyline2Texture = new Texture("src/textures/skyline-2.png", { samplingMode: 1, wrap: 2, hasAlpha: true })
        const skyline2Material = new Material()
        skyline2Material.transparencyMode = TransparencyMode.ALPHA_TEST
        skyline2Material.alphaTest = 0.01
        skyline2Material.albedoTexture = skyline2Texture
        skyline2Material.emissiveTexture = skyline2Texture
        skyline2Material.emissiveIntensity = 1
        skyline2Material.roughness = 1
        skyline2Material.metallic = 0
        this.windowLayer3 = new Entity()
        this.windowLayer3.addComponent(new Transform({ position: new Vector3(24, 24, 62.98), rotation: Quaternion.Euler(0, 0, 0), scale: new Vector3(48, 48, 1)}))
        const skyline2Plane = new PlaneShape()
        this.windowLayer3.addComponent(skyline2Plane)
        this.windowLayer3.addComponent(skyline2Material)
        this.windowLayer3.addComponent(new ParallaxComponent(skyline2Plane, 15))
        this.__interiorEntities.push(this.windowLayer3)

        // todo : load in the servers
        const serverShape = new GLTFShape("src/models/interior/server.glb")
        const leftServer = new Entity()
        leftServer.addComponent(new Transform({ position: new Vector3(7, 23, 58), rotation: Quaternion.Euler(0, -90, 0), scale: new Vector3(3, 3, 3) }))
        leftServer.addComponent(serverShape)
        engine.addEntity(leftServer)
        const rightServer = new Entity()
        rightServer.addComponent(new Transform({ position: new Vector3(41, 23, 58), rotation: Quaternion.Euler(0, 90, 0), scale: new Vector3(3, 3, 3) }))
        rightServer.addComponent(serverShape)
        engine.addEntity(rightServer)
    }
}