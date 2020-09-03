export class MathUtils {

    /* static helper methods */

    static getRandomBetween(_min: number, _max: number) {
        return _min + Math.random() * (_max - _min)
    }

    static getSign(_value: number) {
        return _value >= 0 ? 1 : -1
    }
}