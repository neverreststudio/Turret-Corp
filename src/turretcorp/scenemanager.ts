/* imports */

import { ParallaxComponent } from "../vfx/parallax"

/* scene management */

export class SceneManager {

    /* fields */

    // state
    isExteriorEnabled = false
    isInteriorEnabled = false

    // exterior elements
    towerExterior: Entity

    // interior elements
    towerArena: Entity
    windowLayer1: Entity
    windowLayer2: Entity
    windowLayer3: Entity

    /* methods */

    disableExterior() {
        
        // don't run twice
        if (!this.isExteriorEnabled) {
            return
        }

        // unregister the exterior from the engine
        engine.removeEntity(this.towerExterior)

        // flag as disabled
        this.isExteriorEnabled = false
    }

    disableInterior() {
        
        // don't run twice
        if (!this.isInteriorEnabled) {
            return
        }

        // unregister the interior from the engine
        engine.removeEntity(this.towerExterior)

        // unregister the window parallax
        engine.removeEntity(this.windowLayer1)
        engine.removeEntity(this.windowLayer2)
        engine.removeEntity(this.windowLayer3)

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

        // register the exterior with the engine
        engine.addEntity(this.towerExterior)

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

        // register the interior with the engine
        engine.addEntity(this.towerArena)

        // register the window parallax
        engine.addEntity(this.windowLayer1)
        engine.addEntity(this.windowLayer2)
        engine.addEntity(this.windowLayer3)

        // flag as enabled
        this.isInteriorEnabled = true
    }

    loadExterior() {

        // load the tower's exterior
        this.towerExterior = new Entity()
        this.towerExterior.addComponent(new GLTFShape("src/models/bitgem/tower-exterior.glb"))
        this.towerExterior.addComponent(new Transform({ position: new Vector3(24, 0, 32) }))
    }

    loadInterior() {

        // prepare the arena but don't activate it so it doesn't count towards limits
        this.towerArena = new Entity()
        this.towerArena.addComponent(new GLTFShape("src/models/bitgem/tower-arena.glb"))
        this.towerArena.addComponent(new Transform({ position: new Vector3(24, 0, 32) }))

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
    }
}