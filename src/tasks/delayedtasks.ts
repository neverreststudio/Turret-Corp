export class DelayedTaskSystem implements ISystem {

    /* fields */

    // runtime
    __tasks: DelayedTask[]

    // static
    static instance: DelayedTaskSystem

    /* constructor */

    constructor() {
        
        // intialise the task collection
        this.__tasks = []

        // store this as the global instance
        DelayedTaskSystem.instance = this
    }

    /* methods */

    static registerTask(_task: DelayedTask) {

        // ensure a system
        if (!DelayedTaskSystem.instance || DelayedTaskSystem.instance === null) {
            engine.addSystem(new DelayedTaskSystem())
        }

        // add the task to the collection
        DelayedTaskSystem.instance.__tasks.push(_task)
    }

    /* implementation of ISystem */

    update(_deltaTime: number) {

        // iterate any registered tasks
        for (let i = 0; i < this.__tasks.length; i++) {

            // countdown the delay
            const task = this.__tasks[i]
            task.__delay -= _deltaTime
            if (task.__delay <= 0) {

                // fire the callback
                if (task.callback && task.callback !== null) {
                    task.callback()
                }

                // check if this is a repeating task
                if (task.isRepeating) {

                    // restart the timer
                    task.__delay = task.delay
                }
                else {

                    // remove the task
                    this.__tasks.splice(i, 1)
                    i--
                }
            }
        }
    }
}

export class DelayedTask {
    
    /* fields */

    // runtime
    __delay = 0

    // configuration
    callback: Function
    delay = 0
    isRepeating = false

    /* constructor */
    
    constructor(_callback: Function, _delay: number, _isRepeating: boolean = false) {
        
        // store parameters
        this.callback = _callback
        this.delay = _delay
        this.isRepeating = _isRepeating
        
        // initialise the delay
        this.__delay = this.delay

        // register with the system
        DelayedTaskSystem.registerTask(this)
    }
}