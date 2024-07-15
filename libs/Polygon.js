"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Polygon = void 0;
var Plane_1 = require("./Plane");
/**
 * Represents a convex polygon. The vertices used to initialize a polygon must
 * be coplanar and form a convex loop. They do not have to be `Vertex`
 * instances but they must behave similarly (duck typing can be used for
 * customization).
 *
 * Each convex polygon has a `shared` property, which is shared between all
 * polygons that are clones of each other or were split from the same polygon.
 * This can be used to define per-polygon properties (such as surface color).
 */
var Polygon = /** @class */ (function () {
    function Polygon(vertices, shared) {
        this.vertices = vertices;
        this.shared = shared;
        this.plane = Plane_1.Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
    }
    Polygon.prototype.clone = function () {
        return new Polygon(this.vertices.map(function (v) { return v.clone(); }), this.shared);
    };
    Polygon.prototype.flip = function () {
        this.vertices.reverse().map(function (v) { return v.flip(); });
        this.plane.flip();
    };
    return Polygon;
}());
exports.Polygon = Polygon;
