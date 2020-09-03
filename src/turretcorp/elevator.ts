/* imports */

import { DelayedTask } from "../tasks/delayedtasks"
import { GameManagerBehaviour, GameState } from "./gamemanager"

/* elevators */

export class ElevatorSystem implements ISystem {

    /* fields */

    // references
    __allElevators = engine.getComponentGroup(ElevatorComponent)

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // iterate all elevators
        for (let e of this.__allElevators.entities) {

            // grab the elevator component
            const elevator = e.getComponent(ElevatorComponent)

            // check if the elevator is busy
            if (elevator.isBusy) {

                // grab the transform
                const transform = e.getComponent(Transform)

                // check the movement direction
                if (elevator.isAtTop) {

                    // find the remaining distance
                    let dist = elevator.bottom.subtract(transform.position)
                    if (dist.length() <= elevator.speed * _deltaTime) {
                        transform.position = elevator.bottom.clone()
                        elevator.isAtTop = false
                        elevator.isBusy = false
                        if (elevator.onReachedBottom) {
                            elevator.onReachedBottom(elevator)
                        }
                        elevator.open()
                    }
                    else {
                        transform.position.addInPlace(dist.normalize().scale(elevator.speed * _deltaTime))
                    }
                }
                else {

                    // find the remaining distance
                    let dist = elevator.top.subtract(transform.position)
                    if (dist.length() <= elevator.speed * _deltaTime) {
                        transform.position = elevator.top.clone()
                        elevator.isAtTop = true
                        elevator.isBusy = false
                        if (elevator.onReachedTop) {
                            elevator.onReachedTop(elevator)
                        }
                        elevator.open()
                    }
                    else {
                        transform.position.addInPlace(dist.normalize().scale(elevator.speed * _deltaTime))
                    }
                }
            }
        }
    }
}

@Component("ElevatorComponent")
export class ElevatorComponent {

    /* fields */

    // animations
    __outerDoorOpenClip: AnimationState
    __outerDoorCloseClip: AnimationState
    __innerDoorOpenClip: AnimationState
    __innerDoorCloseClip: AnimationState
    __controlsUpClip: AnimationState
    __controlsDownClip: AnimationState

    // callbacks
    onClosed: Function
    onOpened: Function
    onReachedBottom: Function
    onReachedTop: Function
    
    // movement
    bottom: Vector3
    top: Vector3
    speed = 5

    // state
    isBusy = false
    isOpen: boolean
    isAtTop = false

    /* constructor */

    constructor(_bottom: Vector3, _top: Vector3, _outerDoorOpenClip: AnimationState, _outerDoorCloseClip: AnimationState, _innerDoorOpenClip: AnimationState, _innerDoorCloseClip: AnimationState, _controlsUpClip: AnimationState, _controlsDownClip: AnimationState) {

        // grab parameters
        this.bottom = _bottom.clone()
        this.top = _top.clone()
        this.__outerDoorOpenClip = _outerDoorOpenClip
        this.__outerDoorCloseClip = _outerDoorCloseClip
        this.__innerDoorOpenClip = _innerDoorOpenClip
        this.__innerDoorCloseClip = _innerDoorCloseClip
        this.__controlsUpClip = _controlsUpClip
        this.__controlsDownClip = _controlsDownClip

        // initialise controls state
        this.__controlsUpClip.stop()
        this.__controlsDownClip.play()        

        // initialise doors state
        this.open()
    }

    /* methods */

    close(): boolean {

        // don't run twice
        if (!this.isOpen) {
            return false
        }

        // close all doors
        this.__innerDoorOpenClip.stop()
        this.__innerDoorCloseClip.play()
        this.__outerDoorOpenClip.stop()
        this.__outerDoorCloseClip.play()

        // flag as closed
        this.isOpen = false

        // flag as busy
        this.isBusy = true

        // fire any callback
        if (this.onClosed) {
            this.onClosed(this)
        }

        // return success
        return true
    }

    open(): boolean {

        // don't run twice
        if (this.isOpen) {
            return false
        }

        // open the appropriate set of doors
        if (!GameManagerBehaviour.instance || GameManagerBehaviour.instance === null || GameManagerBehaviour.instance.state === GameState.Outside) {
            
            // close the inner door, open the outer door
            this.__innerDoorOpenClip.stop()
            this.__innerDoorCloseClip.play()
            this.__outerDoorCloseClip.stop()
            this.__outerDoorOpenClip.play()
        }
        else {

            // close the ouer door, open the inner door
            this.__innerDoorCloseClip.stop()
            this.__innerDoorOpenClip.play()
            this.__outerDoorOpenClip.stop()
            this.__outerDoorCloseClip.play()
        }

        // flag as open
        this.isOpen = true

        // fire any callback
        if (this.onOpened) {
            this.onOpened(this)
        }

        // return success
        return true
    }

    toggleControls() {

        // check the elevator isn't already busy
        if (this.isBusy) {
            return
        }
    
        // toggle the lever
        if (this.isAtTop) {
            this.__controlsUpClip.stop()
            this.__controlsDownClip.play()
        }
        else {
            this.__controlsDownClip.stop()
            this.__controlsUpClip.play()
        }

        // after the controls animation has finished, close the doors
        new DelayedTask(() => {
            this.close()
        }, 0.35)
    }
}

export class Elevator extends Entity {

    /* static fields */

    // shared meshes
    static __elevatorShape: GLTFShape
    static __doorsShape: GLTFShape
    static __controlsShape: GLTFShape

    /* fields */


    /* constructor */

    constructor(_bottom: Vector3, _top: Vector3) {

        // call the base constructor
        super()

        // ensure the shared meshes are loaded
        if (!Elevator.__elevatorShape || Elevator.__elevatorShape === null) {
            Elevator.__elevatorShape = new GLTFShape("src/models/bitgem/tower-elevator.glb")
        }
        if (!Elevator.__doorsShape || Elevator.__doorsShape === null) {
            Elevator.__doorsShape = new GLTFShape("src/models/bitgem/tower-elevator-doors.glb")
        }
        if (!Elevator.__controlsShape || Elevator.__controlsShape === null) {
            Elevator.__controlsShape = new GLTFShape("src/models/bitgem/tower-elevator-controls.glb")
        }

        // setup the main mesh
        this.addComponent(Elevator.__elevatorShape)
        this.addComponent(new Transform({ position: _bottom }))

        // create the outer doors
        const outerDoors = new Entity()
        outerDoors.addComponent(Elevator.__doorsShape)
        outerDoors.addComponent(new Transform({ position: new Vector3(0, 0, 0) }))
        const outerDoorAnimator = new Animator()
        const outerDoorCloseClip = new AnimationState("doors_close", { looping: false })
        const outerDoorOpenClip = new AnimationState("doors_open", { looping: false })
        outerDoorAnimator.addClip(outerDoorCloseClip)
        outerDoorAnimator.addClip(outerDoorOpenClip)
        outerDoors.addComponent(outerDoorAnimator)
        outerDoors.setParent(this)

        // create the inner doors
        const innerDoors = new Entity()
        innerDoors.addComponent(Elevator.__doorsShape)
        innerDoors.addComponent(new Transform({ position: new Vector3(0, 0, 2.75) }))
        const innerDoorAnimator = new Animator()
        const innerDoorCloseClip = new AnimationState("doors_close", { looping: false })
        const innerDoorOpenClip = new AnimationState("doors_open", { looping: false })
        innerDoorAnimator.addClip(innerDoorCloseClip)
        innerDoorAnimator.addClip(innerDoorOpenClip)
        innerDoors.addComponent(innerDoorAnimator)
        innerDoors.setParent(this)

        // create the controls
        const controls = new Entity()
        controls.addComponent(Elevator.__controlsShape)
        controls.addComponent(new Transform())
        const controlsAnimator = new Animator()
        const controlsUpClip = new AnimationState("lever_up", { looping: false })
        const controlsDownClip = new AnimationState("lever_down", { looping: false })
        controlsAnimator.addClip(controlsUpClip)
        controlsAnimator.addClip(controlsDownClip)
        controls.addComponent(controlsAnimator)
        controls.setParent(this)

        // add the elevator component
        const elevatorComponent = this.addComponent(new ElevatorComponent(_bottom, _top, outerDoorOpenClip, outerDoorCloseClip, innerDoorOpenClip, innerDoorCloseClip, controlsUpClip, controlsDownClip))

        // hookup interaction with the controls
        controls.addComponent(new OnClick(
            (e) => {
                elevatorComponent.toggleControls()
            },
            {
                distance: 2,
                hoverText: "Use elevator"
            }))

        // register the elevator with the engine
        engine.addEntity(this)
        engine.addEntity(controls)
        engine.addEntity(innerDoors)
        engine.addEntity(outerDoors)
    }
}