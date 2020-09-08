import * as ui from "../../node_modules/@dcl/ui-utils/index"
import { DelayedTask } from "../tasks/delayedtasks"
import { MathUtils } from "../math/utils"
import { DebugRay } from "../debug/ray"

export enum GameState {
    Outside,
    InElevator,
    InArena,
    InViewingArea
}

class claimData {
    id: string
}

export class GameManagerSystem implements ISystem {

    /* field definitions */

    // component group
    gameManagers = engine.getComponentGroup(GameManagerBehaviour)
    messageBus = new MessageBus()
    isPrimaryPlayer = true
    claimTask: DelayedTask
    id = Math.round(Math.random() * 10000).toString()
    camera = Camera.instance

    /* constructor */

    constructor() {
        this.messageBus.on("claim", (e: claimData) => {
            if (e.id !== this.id) {
                this.claimTask.cancel()
                this.isPrimaryPlayer = false
            }
        })
        this.claimTask = new DelayedTask(() => {
            const data = new claimData()
            data.id = this.id
            this.messageBus.emit("claim", data)
        }, 5, true)
    }

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all game managers
        for (let entity of this.gameManagers.entities) {

            // grab the component
            const gameManager = entity.getComponent(GameManagerBehaviour)
            gameManager.isPrimaryPlayer = this.isPrimaryPlayer

            // check the current state
            switch (gameManager.state) {

                // handle the player being outside (they haven't yet activated an elevator)
                case GameState.Outside: {

                    // if the player enters one of the "fake" elevators, teleport them to the real one
                    // ---east
                    let xDist = this.camera.position.x - 2
                    let zDist = this.camera.position.z - 32
                    let forward = MathUtils.getForwardVectorQ(this.camera.rotation)
                    if (Math.abs(xDist) <= 1.5 && Math.abs(zDist) <= 3.5) {
                        const newPosition = new Vector3(24 - zDist, this.camera.feetPosition.y, 2 + xDist)
                        const newTarget = new Vector3(24 - zDist, this.camera.position.y, 2 + xDist)
                        let temp = forward.x
                        forward.x = -forward.z
                        forward.z = temp
                        const target = newTarget.add(forward)
                        movePlayerTo({ x: newPosition.x, y: newPosition.y, z: newPosition.z });//, { x: target.x, y: target.y, z: target.z })
                    }
                    // ---west
                    xDist = this.camera.position.x - 46
                    zDist = this.camera.position.z - 32
                    if (Math.abs(xDist) <= 1.5 && Math.abs(zDist) <= 3.5) {
                        const newPosition = new Vector3(24 + zDist, this.camera.feetPosition.y, 2 - xDist)
                        const newTarget = new Vector3(24 + zDist, this.camera.position.y, 2 - xDist)
                        let temp = -forward.x
                        forward.x = forward.z
                        forward.z = temp
                        const target = newTarget.add(forward)
                        movePlayerTo({ x: newPosition.x, y: newPosition.y, z: newPosition.z });//, { x: target.x, y: target.y, z: target.z })
                    }
                    // ---north
                    xDist = this.camera.position.x - 24
                    zDist = this.camera.position.z - 62
                    if (Math.abs(xDist) <= 3.5 && Math.abs(zDist) <= 1.5) {
                        const newPosition = new Vector3(24 - xDist, this.camera.feetPosition.y, 2 - zDist)
                        const newTarget = new Vector3(24 - xDist, this.camera.position.y, 2 - zDist)
                        forward.x = -forward.x
                        forward.z = -forward.z
                        const target = newTarget.add(forward)
                        movePlayerTo({ x: newPosition.x, y: newPosition.y, z: newPosition.z }, { x: target.x, y: target.y, z: target.z })
                    }
                } break

                // handle the player being in the elevator (they have activated the elevator and begun travelling to a floor)
                case GameState.InElevator: {

                } break

                // handle the player being in the arena (they are the active player)
                case GameState.InElevator: {

                } break

                // handle the player being in the viewing area (they are spectating another player)
                case GameState.InElevator: {

                } break
            }
        }
    }

}

@Component("GameManagerBehaviour")
export class GameManagerBehaviour {

    /* static fields */

    static instance: GameManagerBehaviour

    /* fields */

    // state
    previousState = GameState.Outside
    state = GameState.Outside
    isPrimaryPlayer = true // TODO : needs to be determined through synchronisation

    /* constructor */

    constructor() {
        GameManagerBehaviour.instance = this
    }

    /* methods */
    
    setState(_state: GameState) {
        if (this.state === _state) {
            return
        }
        this.previousState = this.state
        this.state = _state
    }
}

export class GameManager extends Entity {
    constructor() {
        super()
        this.addComponent(new GameManagerBehaviour())
        engine.addEntity(this)
    }
}