export class DebugRaySystem implements ISystem {

    /* fields */

    // references
    __allDebugRays = engine.getComponentGroup(DebugRayComponent)

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // iterate all debug rays
        for (let e of this.__allDebugRays.entities) {

            // grab the ray component
            const ray = e.getComponent(DebugRayComponent)
            if (ray.remaining > 0) {
                ray.remaining -= _deltaTime
                if (ray.remaining <= 0) {
                    engine.removeEntity(e)
                    continue
                }
            }
            let ratio = 1 - ray.remaining / ray.duration
            ratio = Math.pow(ratio, 2)
            //ratio = 1 - Math.pow(1 - ratio, 2.5)
            const start = ray.trailOff ? Vector3.Lerp(ray.start, ray.end, ratio) : ray.start
            const dist = ray.end.subtract(start)
            const transform = e.getComponent(Transform)
            transform.scale = new Vector3(0.05, 0.05, dist.length())
            transform.position = start.add(dist.scale(0.5))
            transform.lookAt(ray.end)
        }
    }
}

@Component("DebugRayComponent")
export class DebugRayComponent {

    /* fields */

    start: Vector3
    end: Vector3

    duration: number
    remaining: number
    trailOff = false

    /* constructor */

    constructor(_start: Vector3, _end: Vector3, _duration: number = 0) {

        this.start = _start
        this.end = _end

        this.duration = _duration
        this.remaining = _duration
    }
}

export class DebugRay extends Entity {
    
    static __material: Material
    static __shape: BoxShape

    constructor(_start: Vector3, _end: Vector3, _duration: number = 0, _addToEngine: boolean = true, _customShape: GLTFShape = null) {

        // ensure a shared material
        if (!DebugRay.__material || DebugRay.__material === null) {
            DebugRay.__material = new Material()
            DebugRay.__material.albedoColor = Color4.Red()
            DebugRay.__material.emissiveColor = Color3.Red()
            DebugRay.__material.emissiveIntensity = 2
        }

        // call the base constructor
        super()

        // setup a transform component
        this.addComponent(new Transform())

        // setup a debug ray component
        this.addComponent(new DebugRayComponent(_start, _end, _duration))

        // add a box shape for rendering
        this.addComponent(DebugRay.__material)
        if (_customShape === null) {
            if (!DebugRay.__shape || DebugRay.__shape === null) {
                DebugRay.__shape = new BoxShape()
                DebugRay.__shape.isPointerBlocker = false
                DebugRay.__shape.withCollisions = false
            }
            this.addComponent(DebugRay.__shape)
        }
        else {
            this.addComponent(_customShape)
        }

        // automatically register with the engine
        if (_addToEngine) {
            engine.addEntity(this)
        }
    }

    setCustomShape(_customShape: GLTFShape): Entity {
        this.removeComponent(BoxShape)
        this.addComponent(_customShape)
        return this
    }
}