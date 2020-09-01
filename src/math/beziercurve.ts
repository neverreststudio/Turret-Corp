export class BezierCurve {
    
    /* field definitions */

    points: Vector2[]

    /* constructor */

    constructor(... _points: Vector2[]) {

        // store the provided points, in ascending x order
        if (_points !== null && _points.length > 0) {
            this.points = _points.sort((a, b) => a.x > b.x ? 1 : a.x < b.x ? -1 : 0)
        }
    }

    /* methods */

    evaluate(_t: number): Vector2 {

        // check the number of points available (anything less than 1 means no interpolation)
        if (this.points === null || this.points.length === 0) {
            return Vector2.Zero()
        }
        if (this.points.length === 1) {
            return this.points[0]
        }

        // if we're all the way at an end then return it
        if (_t <= 0) {
            return this.points[0]
        }
        if (_t >= 1) {
            return this.points[this.points.length - 1]
        }

        // if there are only 2 points then linearly interpolate
        if (this.points.length === 2) {
            return this.points[0].add(this.points[1].subtract(this.points[0]).scale(_t))
        }

        // if there are 3 or more points then its bezier o'clock
        let recursivePointsCount = this.points.length
        let recursivePoints: Vector2[] = new Array(recursivePointsCount)
        for (let i = 0; i < recursivePointsCount; i++) {
            recursivePoints[i] = this.points[i].clone()
        }
        while (recursivePointsCount > 1) {
            log("iterate")
            for (let i = 0; i < recursivePointsCount - 1; i++) {
                let rangeX = recursivePoints[i + 1].x - recursivePoints[i].x
                let rangeY = recursivePoints[i + 1].y - recursivePoints[i].y
                recursivePoints[i].x += rangeX * _t
                recursivePoints[i].y += rangeY * _t
            }
            recursivePointsCount--
        }
        return recursivePoints[0]
    }
}