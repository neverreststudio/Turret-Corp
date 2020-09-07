export class MathUtils {

    /* static helper methods */

    static clamp(_value: number, _min: number, _max: number): number {
        return Math.min(_max, Math.max(_min, _value))
    }

    static clamp01(_value: number): number {
        return MathUtils.clamp(_value, 0, 1)
    }

    static getForwardVector(_angles: Vector3): Vector3 {
        const angles = _angles.scale(DEG2RAD)
        return new Vector3(
            Math.sin(angles.y) * Math.cos(angles.x),
            -Math.sin(angles.x),
            Math.cos(angles.y) * Math.cos(angles.x)
        )
    }

    static getRightVector(_angles: Vector3): Vector3 {
        const angles = _angles.add(new Vector3(0, 90, 0)).scale(DEG2RAD)
        return new Vector3(
            Math.sin(angles.y) * Math.cos(angles.x),
            -Math.sin(angles.x),
            Math.cos(angles.y) * Math.cos(angles.x)
        )
    }

    static getUpVector(_angles: Vector3): Vector3 {
        const angles = _angles.add(new Vector3(-90, 0, 0)).scale(DEG2RAD)
        return new Vector3(
            Math.sin(angles.y) * Math.cos(angles.x),
            -Math.sin(angles.x),
            Math.cos(angles.y) * Math.cos(angles.x)
        )
    }

    static getRandomBetween(_min: number, _max: number): number {
        return _min + Math.random() * (_max - _min)
    }

    static getSign(_value: number): number {
        return _value >= 0 ? 1 : -1
    }
}