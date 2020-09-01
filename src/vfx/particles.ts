import { BezierCurve } from "math/beziercurve"
import { MathUtils } from "math/utlis"

export class ParticleSystem implements ISystem {
    
    /* field definitions */

    // component group
    allParticles = engine.getComponentGroup(ParticleBehaviour)

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all spring components
        for (let entity of this.allParticles.entities) {
            
            // get the particle component
            let particle = entity.getComponent(ParticleBehaviour)

            // don't bother with inactive particles
            if (!particle.isActive) {
                continue
            }

            // decrease lifetime
            particle.lifetime -= _deltaTime
            if (particle.lifetime <= 0) {
                particle.isActive = false
                particle.transform.scale = Vector3.Zero()
                if (particle.destroyOnDeath) {
                    engine.removeEntity(entity)
                }
                continue
            }
            const lifetimeRatio = particle.lifetime / particle.startingLifetime

            // handle movement
            if (particle.dampeningRate > 0) {
                let len = particle.velocity.length()
                if (len > particle.dampeningSpeed) {
                    let dif = len - particle.dampeningSpeed
                    len -= dif * Math.min(1, particle.dampeningRate * _deltaTime)
                    particle.velocity.normalize().scaleInPlace(len)
                }
            }
            particle.velocity.addInPlace(particle.gravity.scale(_deltaTime))
            particle.position.addInPlace(particle.velocity.scale(_deltaTime))

            // evaluate scaling over lifetime
            let currentScale = 1.0
            if (particle.scaleOverTime) {
                currentScale = particle.scaleOverTimeCurve.evaluate(1 - lifetimeRatio).y
            }

            // update the transform
            particle.transform.position = particle.position
            particle.transform.scale = Vector3.One().scale(particle.scale * currentScale)
        }
    }
}

export class ParticleSpawnerSystem implements ISystem {
    
    /* field definitions */

    // component group
    allSpawners = engine.getComponentGroup(ParticleSpawner)

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all spring components
        for (let entity of this.allSpawners.entities) {
            
            // get the particle spawner
            let spawner = entity.getComponent(ParticleSpawner)

            // check if it is time to spawn a new particle
            if (spawner.spawnRate > 0.0) {
                spawner.__sinceLastSpawn += _deltaTime
                if (spawner.__sinceLastSpawn >= 1 / spawner.spawnRate) {
                    spawner.spawn()
                }
            }
        }
    }
}

@Component("ParticleBehaviour")
export class ParticleBehaviour {
    
    /* field definitions */

    // references
    transform: Transform

    // lifetime
    isActive = true
    destroyOnDeath = true
    lifetime = 1.0
    startingLifetime = 1.0

    // movement
    position = Vector3.Zero()
    velocity = Vector3.Zero()
    gravity = Vector3.Zero()
    dampeningSpeed = 0.0
    dampeningRate = 0.0

    // scaling
    scale = 1.0
    scaleOverTime = false
    scaleOverTimeCurve: BezierCurve

    /* constructor */

    constructor(_transform: Transform, _lifeTime: number, _position: Vector3, _scale: number) {

        // store configuration
        this.transform = _transform
        this.lifetime = _lifeTime
        this.startingLifetime = _lifeTime
        this.position = _position
        this.scale = _scale

        // temporarily zero scale the transform until the particle system is able to update it properly
        this.transform.scale = Vector3.Zero()
    }
}

@Component("ParticleSpawner")
export class ParticleSpawner {

    /* fields */

    // runtime
    __sinceLastSpawn = 0.0

    // spawn rate
    spawnRate = 0.0

    // transform
    position: Vector3
    angles: Vector3

    // pooling
    pool: Entity[]
    maxPoolSize = 10

    // default particle settings
    particleMinLifetime = 1.0
    particleMaxLifetime = 1.0

    particleMinScale = 1.0
    particleMaxScale = 1.0
    particleScaleOverTime = false
    particleScaleOverTimeCurve: BezierCurve

    particleMinSpeed = 1.0
    particleMaxSpeed = 1.0

    particleGravity = Vector3.Zero()
    particleDampeningRate = 0.0
    particleDampeningSpeed = 0.0

    // spawn shape settings
    spawnAngle = 0.0

    // callbacks
    onCreateParticle: Function
    onConfigureParticle: Function

    /* methods */

    configureParticle(_particle: ParticleBehaviour) {

        // lifetime
        _particle.isActive = true
        _particle.destroyOnDeath = false
        _particle.lifetime = MathUtils.getRandomBetween(this.particleMinLifetime, this.particleMaxLifetime)
        _particle.startingLifetime = _particle.lifetime

        // scaling
        _particle.scale = MathUtils.getRandomBetween(this.particleMinScale, this.particleMaxScale)
        _particle.scaleOverTime = this.particleScaleOverTime
        _particle.scaleOverTimeCurve = this.particleScaleOverTimeCurve

        // movement
        _particle.position = this.position.clone()
        const speed = MathUtils.getRandomBetween(this.particleMinSpeed, this.particleMaxSpeed)
        let angles = this.angles.clone()
        const angleOffset = this.spawnAngle / -2
        angles.addInPlace(new Vector3(MathUtils.getRandomBetween(-angleOffset, angleOffset), MathUtils.getRandomBetween(-angleOffset, angleOffset), 0))
        const vx = Math.sin(angles.y * DEG2RAD) * Math.cos(angles.x * DEG2RAD) * speed
        const vy = Math.sin(angles.x * DEG2RAD) * -speed
        const vz = Math.cos(angles.y * DEG2RAD) * Math.cos(angles.x * DEG2RAD) * speed
        _particle.velocity = new Vector3(vx, vy, vz)
        _particle.dampeningRate = this.particleDampeningRate
        _particle.dampeningSpeed = this.particleDampeningSpeed
        _particle.gravity = this.particleGravity

        // fire any callback
        if (this.onConfigureParticle && this.onConfigureParticle !== null) {
            this.onConfigureParticle(_particle)
        }
    }

    spawn(): Entity {

        // iterate the pool until a free particle is found
        if (!this.pool || this.pool === null) {
            this.pool = new Array(0)
        }
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i] !== null) {
                const iterationParticle = this.pool[i].getComponent(ParticleBehaviour)
                if (!iterationParticle.isActive) {
                    this.configureParticle(iterationParticle)
                    this.__sinceLastSpawn = 0.0
                    return this.pool[i]
                }
            }
            else {
                this.pool.splice(i, 1)
                i--
            }
        }

        // no ready particle so check if there is room to make one
        if (this.pool.length >= this.maxPoolSize) {
            return null
        }

        // create a new particle entity
        const newEntity = new Entity()

        // add a transform component
        const newTransform = new Transform()
        newEntity.addComponent(newTransform)

        // add and configure the particle component
        const newParticle = new ParticleBehaviour(newTransform, 0, this.position, 0.0)
        this.configureParticle(newParticle)
        newEntity.addComponent(newParticle)

        // fire any callback
        if (this.onCreateParticle !== null) {
            this.onCreateParticle(newEntity, newParticle)
        }

        // register the entity with the engine
        engine.addEntity(newEntity)

        // add it to the pool
        this.pool.push(newEntity)

        // track the last spawn time
        this.__sinceLastSpawn = 0.0

        // return the constructed particle
        return newEntity
    }
}