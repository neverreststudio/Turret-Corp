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
            if (ray.duration > 0) {
                ray.duration -= _deltaTime
                if (ray.duration <= 0) {
                    engine.removeEntity(e)
                    continue
                }
            }
            const dist = ray.end.subtract(ray.start)
            const transform = e.getComponent(Transform)
            transform.scale = new Vector3(0.05, 0.05, dist.length())
            transform.position = ray.start.add(dist.scale(0.5))
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

    /* constructor */

    constructor(_start: Vector3, _end: Vector3, _duration: number = 0) {

        this.start = _start
        this.end = _end

        this.duration = _duration
    }
}

export class DebugRay extends Entity {
    
    static __material: Material

    constructor(_start: Vector3, _end: Vector3, _duration: number = 0) {

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
        const boxShape = new BoxShape()
        boxShape.isPointerBlocker = false
        boxShape.withCollisions = false
        this.addComponent(boxShape)

        // automatically register with the engine
        engine.addEntity(this)
    }
}