export enum GameState {
    Outside,
    InElevator,
    InArena,
    InViewingArea
}

export class GameManagerSystem implements ISystem {

    /* field definitions */

    // component group
    gameManagers = engine.getComponentGroup(GameManagerBehaviour)

    /* implementation of ISystem */

    // called every frame
    update(_deltaTime: number) {

        // iterate all game managers
        for (let entity of this.gameManagers.entities) {

            // grab the component
            const gameManager = entity.getComponent(GameManagerBehaviour)

            // check the current state
            switch (gameManager.state) {

                // handle the player being outside (they haven't yet activated an elevator)
                case GameState.Outside: {

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