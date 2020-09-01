export class ParallaxSystem implements ISystem {

    /* field definitions */

    __allParallaxEntities = engine.getComponentGroup(ParallaxComponent)
    __camera = Camera.instance

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all parallax entities
        for (let e of this.__allParallaxEntities.entities) {

            // grab the components
            const parallaxComponent = e.getComponent(ParallaxComponent)
            const transform = e.getComponent(Transform)

            // TODO : update the uvs based on the relative camera position and intended depth
            const uvScale = 0.25
            const uvScaleOffset = (1 - uvScale) / 2
            const uvs = [
                0, 0,
                0, 0,
                0, 0,
                0, 0,

                uvScaleOffset, uvScaleOffset,
                1 - uvScaleOffset, uvScaleOffset,
                1 - uvScaleOffset, 1 - uvScaleOffset,
                uvScaleOffset, 1 - uvScaleOffset
            ]
            const vertOffsets = [
                new Vector3(1, -1, 0),
                new Vector3(-1, -1, 0),
                new Vector3(-1, 1, 0),
                new Vector3(1, 1, 0)
            ]
            let uv = 8
            for (let vertOffset of vertOffsets) {
                let vert = new Vector3(transform.position.x, transform.position.y, transform.position.z)
                vert.x += vertOffset.x * transform.scale.x / 2
                vert.y += vertOffset.y * transform.scale.y / 2
                vert.z += vertOffset.z * transform.scale.z / 2
                let offset = vert.subtract(this.__camera.position).normalize()
                let targetZ = vert.z + parallaxComponent.depth
                let scale = (targetZ - this.__camera.position.z) / offset.z;
                offset.scaleInPlace(scale)
                offset.addInPlace(this.__camera.position)
                offset.subtractInPlace(vert)
                /*offset.x -= vert.x
                offset.y -= vert.y*/
                offset.x /= transform.scale.x
                offset.y /= -transform.scale.y
                //offset.scaleInPlace(-parallaxComponent.depth * 40)
                offset.scaleInPlace(-uvScale)
                uvs[uv++] += offset.x
                uvs[uv++] += offset.y
            }
            parallaxComponent.__plane.uvs = uvs
        }
    }
}

@Component("ParallaxComponent")
export class ParallaxComponent {

    /* private fields */

    __plane: PlaneShape

    /* public fields */

    depth: number

    /* constructor */

    constructor(_plane: PlaneShape, _depth: number) {
        this.__plane = _plane
        this.depth = _depth
    }

}