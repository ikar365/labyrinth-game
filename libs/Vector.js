import { Vector3 } from './three.module.js';

/**
 * Represents a 3D vector.
 */
class Vector {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    clone() {
        return new Vector(this.x, this.y, this.z);
    }

    negate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    }

    add(a) {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
        return this;
    }

    sub(a) {
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
        return this;
    }

    times(a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
        return this;
    }

    dividedBy(a) {
        this.x /= a;
        this.y /= a;
        this.z /= a;
        return this;
    }

    lerp(a, t) {
        return this.add(new Vector().copy(a).sub(this).times(t));
    }

    unit() {
        return this.dividedBy(this.length());
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    normalize() {
        return this.unit();
    }

    cross(b) {
        const a = this.clone();
        const { x: ax, y: ay, z: az } = a;
        const { x: bx, y: by, z: bz } = b;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    }

    dot(b) {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    }

    toVector3() {
        return new Vector3(this.x, this.y, this.z);
    }
}

export { Vector };
