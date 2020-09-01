export class PositionSpringSystem implements ISystem {
    
    /* field definitions */

    // component group
    allSprings = engine.getComponentGroup(PositionSpring)

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all spring components
        for (let entity of this.allSprings.entities) {
            
            // get the transform for the spring
            let transform = entity.getComponent(Transform);
            if (!transform) {
                continue
            }

            // get the spring component
            let spring = entity.getComponent(PositionSpring)

            // apply the spring physics
            let dif = spring.targetPosition.subtract(transform.position)
            let acc = dif.scale(spring.force * _deltaTime)
            let dec = spring.velocity.scale(spring.dampening * _deltaTime)
            spring.velocity = spring.velocity.add(acc).subtract(dec)

            // update the transform
            transform.position = transform.position.add(spring.velocity.scale(_deltaTime))
        }
    }
}

export class AnglesSpringSystem implements ISystem {
    
    /* field definitions */

    // component group
    allSprings = engine.getComponentGroup(AnglesSpring)

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all spring components
        for (let entity of this.allSprings.entities) {
            
            // get the transform for the spring
            let transform = entity.getComponent(Transform);
            if (!transform) {
                continue
            }

            // get the spring component
            let spring = entity.getComponent(AnglesSpring)

            // apply the spring physics
            let dif = spring.targetAngles.subtract(spring.angles)
            while (dif.x > 180) {
                dif.x -= 360
            }
            while (dif.x < -180) {
                dif.x += 360
            }
            while (dif.y > 180) {
                dif.x -= 360
            }
            while (dif.y < -180) {
                dif.x += 360
            }
            while (dif.z > 180) {
                dif.x -= 360
            }
            while (dif.z < -180) {
                dif.x += 360
            }
            let acc = dif.scale(spring.force * _deltaTime)
            let dec = spring.velocity.scale(spring.dampening * _deltaTime)
            spring.velocity.addInPlace(acc).subtractInPlace(dec)

            // update the transform
            spring.angles.addInPlace(spring.velocity.scale(_deltaTime))
            transform.rotation = Quaternion.Euler(spring.angles.x, spring.angles.y, spring.angles.z)
        }
    }
}

@Component("PositionSpring")
export class PositionSpring {
    
    /* field definitions */

    // general
    targetPosition: Vector3

    // physics configuration
    force: number
    dampening: number

    // physics runtime
    velocity: Vector3

    /* constructor */

    constructor(_force: number, _dampening: number) {
        
        // populate the configuration parameters
        this.force = _force
        this.dampening = _dampening

        // initialise runtime fields
        this.velocity = Vector3.Zero()
    }
}

@Component("AnglesSpring")
export class AnglesSpring {
    
    /* field definitions */

    // general
    angles: Vector3
    targetAngles: Vector3

    // physics configuration
    force: number
    dampening: number

    // physics runtime
    velocity: Vector3

    /* constructor */

    constructor(_force: number, _dampening: number) {

        // default the rotation
        this.angles = Vector3.Zero()
        this.targetAngles = Vector3.Zero()

        // populate the configuration parameters
        this.force = _force
        this.dampening = _dampening

        // initialise runtime fields
        this.velocity = Vector3.Zero()
    }
}