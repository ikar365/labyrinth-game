"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vector = void 0;
var three_1 = require("three");
/**
 * Represents a 3D vector.
 */
var Vector = /** @class */ (function () {
    function Vector(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector.prototype.copy = function (v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    };
    Vector.prototype.clone = function () {
        return new Vector(this.x, this.y, this.z);
    };
    Vector.prototype.negate = function () {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this;
    };
    Vector.prototype.add = function (a) {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
        return this;
    };
    Vector.prototype.sub = function (a) {
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
        return this;
    };
    Vector.prototype.times = function (a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
        return this;
    };
    Vector.prototype.dividedBy = function (a) {
        this.x /= a;
        this.y /= a;
        this.z /= a;
        return this;
    };
    Vector.prototype.lerp = function (a, t) {
        return this.add(new Vector().copy(a).sub(this).times(t));
    };
    Vector.prototype.unit = function () {
        return this.dividedBy(this.length());
    };
    Vector.prototype.length = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    };
    Vector.prototype.normalize = function () {
        return this.unit();
    };
    Vector.prototype.cross = function (b) {
        var a = this.clone();
        var ax = a.x, ay = a.y, az = a.z;
        var bx = b.x, by = b.y, bz = b.z;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    };
    Vector.prototype.dot = function (b) {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    };
    Vector.prototype.toVector3 = function () {
        return new three_1.Vector3(this.x, this.y, this.z);
    };
    return Vector;
}());
exports.Vector = Vector;
