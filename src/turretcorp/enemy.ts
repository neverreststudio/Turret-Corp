export class EnemySystem implements ISystem {

    /* fields */

    // references
    __allEnemies = engine.getComponentGroup(EnemyComponent)

    /* implementation of ISystem */

    update(_deltaTime: number) {

    }
}

@Component("EnemyComponent")
export class EnemyComponent {

}

export class Enemy extends Entity {
    
}