export class StatBarSystem implements ISystem {

    /* fields */

    // references
    __allStatBars = engine.getComponentGroup(StatBarComponent)
    __camera = Camera.instance

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // iterate all stat bars
        for (let e of this.__allStatBars.entities) {

            // grab the components
            const statBar = e.getComponent(StatBarComponent)
            const transform = e.getComponent(Transform)

            // update the position
            transform.position = statBar.position
            let dist = this.__camera.position.subtract(statBar.position)
            let targetAngle = Math.atan2(dist.x, dist.z) * RAD2DEG
            transform.rotation = Quaternion.Euler(0, targetAngle, 0)

            // update the inner bar
            const offset = 0.03
            const scale = new Vector3(1 - (offset / transform.scale.x) * 2, 1 - (offset / transform.scale.y) * 2, 1)
            statBar.inner.scale = new Vector3(statBar.current / statBar.max, 1, 1).multiply(scale)
            statBar.inner.position = new Vector3((1 - statBar.inner.scale.x) / 2 - offset, 0, 0.01)
        }
    }
}

@Component("StatBarComponent")
export class StatBarComponent {

    /* fields */

    // references
    inner: Transform

    // values
    current = 100
    max = 100

    // references
    position: Vector3
}

export class StatBar extends Entity {

    /* static fields */

    // reusable meshes
    static __outerShape: PlaneShape
    static __innerShape: PlaneShape
    static __material: Material
    static __texture: Texture

    /* fields */

    /* constructor */

    constructor() {

        // call the base constructor
        super()

        // ensure the reusable meshes
        const uvSafety = 0.05
        if (!StatBar.__outerShape || StatBar.__outerShape === null) {
            StatBar.__outerShape = new PlaneShape()
            StatBar.__outerShape.uvs = [
                0.25 + uvSafety, 0.75 + uvSafety,
                0.5 - uvSafety, 0.75 + uvSafety,
                0.5 - uvSafety, 1 - uvSafety,
                0.25 + uvSafety, 1 - uvSafety,

                0.25 + uvSafety, 0.75 + uvSafety,
                0.5 - uvSafety, 0.75 + uvSafety,
                0.5 - uvSafety, 1 - uvSafety,
                0.25 + uvSafety, 1 - uvSafety
            ]
        }
        if (!StatBar.__innerShape || StatBar.__innerShape === null) {
            StatBar.__innerShape = new PlaneShape()
            StatBar.__innerShape.uvs = [
                0 + uvSafety, 0.75 + uvSafety,
                0.25 - uvSafety, 0.75 + uvSafety,
                0.25 - uvSafety, 1 - uvSafety,
                0 + uvSafety, 1 - uvSafety,

                0 + uvSafety, 0.75 + uvSafety,
                0.25 - uvSafety, 0.75 + uvSafety,
                0.25 - uvSafety, 1 - uvSafety,
                0 + uvSafety, 1 - uvSafety
            ]
        }
        if (!StatBar.__material || StatBar.__material === null) {
            StatBar.__texture = new Texture("src/textures/bars.png", { hasAlpha: false, samplingMode: 0 })
            StatBar.__material = new Material()
            StatBar.__material.transparencyMode = TransparencyMode.OPAQUE
            StatBar.__material.ambientColor = Color3.White()
            StatBar.__material.roughness = 1
            StatBar.__material.metallic = 0
            StatBar.__material.albedoColor = Color4.White()
            StatBar.__material.albedoTexture = StatBar.__texture
            StatBar.__material.emissiveTexture = StatBar.__texture
            StatBar.__material.emissiveIntensity = 1.5
            StatBar.__material.emissiveColor = Color3.White()
        }

        // set up the outer bar
        this.addComponent(new Transform({ scale: new Vector3(1, 0.2, 1) }))
        this.addComponent(StatBar.__outerShape)
        this.addComponent(StatBar.__material)
        const statBarComponent = new StatBarComponent()
        this.addComponent(statBarComponent)

        // set up the inner bar
        const inner = new Entity()
        inner.addComponent(new Transform())
        inner.addComponent(StatBar.__innerShape)
        inner.addComponent(StatBar.__material)
        statBarComponent.inner = inner.getComponent(Transform)

        // register with the engine
        engine.addEntity(this)
        engine.addEntity(inner)

        // parent the inner bar to the outer
        inner.setParent(this)
    }
}