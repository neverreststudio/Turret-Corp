import { ParticleSpawner, ParticleBehaviour } from "../vfx/particles"
import { BezierCurve } from "../math/beziercurve"

export class SmokeParticles {

    /* fields */

    static __instance: SmokeParticles = null

    __isInitialised = false
    __spawner: ParticleSpawner

    /* methods */

    /*emitCone(_quantity: number, _location: Vector3, _radius: number, _coneAngle: number, _rotation: Quaternion) {
        
        // ensure initialisation
        this.__init();

        // iterate for the number of desired particles
        for (let i = 0; i < _quantity; i++) {

            // request a new particle from the spawner
            let newParticle = this.__spawner.spawn()
        }
    }*/

    emitSphere(_quantity: number, _location: Vector3, _radius: number, _minScale: number = null, _maxScale: number = null) {
        
        // ensure initialisation
        this.__init();

        // handle particle size override
        const oldMaxScale = this.__spawner.particleMaxScale
        const oldMinScale = this.__spawner.particleMinScale
        if (_maxScale !== null) {
            this.__spawner.particleMaxScale = _maxScale
        }
        if (_minScale !== null) {
            this.__spawner.particleMinScale = _minScale
        }
    
        // iterate for the number of desired particles
        for (let i = 0; i < _quantity; i++) {

            // request a new particle from the spawner
            let newParticle = this.__spawner.spawn().getComponent(ParticleBehaviour)
            let direction = new Vector3(Math.random(), Math.random(), Math.random()).normalize()
            newParticle.position = _location.add(direction.scale(_radius))
            newParticle.velocity = direction.scale(newParticle.velocity.length())
        }

        // restore scale
        this.__spawner.particleMaxScale = oldMaxScale
        this.__spawner.particleMinScale = oldMinScale
    }

    static getInstance(): SmokeParticles {
        if (SmokeParticles.__instance === null) {
            SmokeParticles.__instance = new SmokeParticles()
        }
        return SmokeParticles.__instance
    }

    __init() {

        // only initialise once
        if (this.__isInitialised) {
            return
        }
        this.__isInitialised = true

        // create a spawner
        this.__spawner = new ParticleSpawner()

        // they'll never be used but must set a position/angles
        this.__spawner.position = Vector3.Zero()
        this.__spawner.angles = Vector3.Zero()

        // don't automatically spawn at all
        this.__spawner.spawnRate = 0
        this.__spawner.maxPoolSize = 200

        // configure particle defaults
        this.__spawner.particleMinLifetime = 0.5
        this.__spawner.particleMaxLifetime = 0.7
        this.__spawner.particleMinSpeed = 15
        this.__spawner.particleMaxSpeed = 20
        this.__spawner.particleDampeningSpeed = 1
        this.__spawner.particleDampeningRate = 10
        this.__spawner.particleGravity = new Vector3(0, -6, 0)
        this.__spawner.particleMinScale = 0.1
        this.__spawner.particleMaxScale = 0.25
        this.__spawner.particleScaleOverTime = true
        this.__spawner.particleScaleOverTimeCurve = new BezierCurve(
            new Vector2(0, 0),
            new Vector2(0.6, 1),
            new Vector2(0.7, 1),
            new Vector2(0.9, 1),
            new Vector2(1, 0)
        )

        // set a custom particle shape
        const particleShape = new SphereShape()
        particleShape.withCollisions = false
        this.__spawner.onCreateParticle = (_entity: Entity, _particle: ParticleBehaviour) => {
            _entity.addComponent(particleShape)
        }

        // create an entity to hold the spawner
        const spawnerObject = new Entity()
        spawnerObject.addComponent(this.__spawner)
        engine.addEntity(spawnerObject)
    }
}