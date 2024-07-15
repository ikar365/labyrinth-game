"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
/**
 * Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
 * by picking a polygon to split along. That polygon (and all other coplanar
 * polygons) are added directly to that node and the other polygons are added to
 * the front and/or back subtrees. This is not a leafy BSP tree since there is
 * no distinction between internal and leaf nodes.
 */
var Node = /** @class */ (function () {
    function Node(polygons) {
        this.plane = null;
        this.front = null;
        this.back = null;
        this.polygons = [];
        if (polygons)
            this.build(polygons);
    }
    Node.prototype.clone = function () {
        var node = new Node();
        node.plane = this.plane && this.plane.clone();
        node.front = this.front && this.front.clone();
        node.back = this.back && this.back.clone();
        node.polygons = this.polygons.map(function (p) { return p.clone(); });
        return node;
    };
    // Convert solid space to empty space and empty space to solid space.
    Node.prototype.invert = function () {
        for (var i = 0; i < this.polygons.length; i++)
            this.polygons[i].flip();
        this.plane && this.plane.flip();
        this.front && this.front.invert();
        this.back && this.back.invert();
        var temp = this.front;
        this.front = this.back;
        this.back = temp;
    };
    // Recursively remove all polygons in `polygons` that are inside this BSP
    // tree.
    Node.prototype.clipPolygons = function (polygons) {
        if (!this.plane)
            return polygons.slice();
        var front = new Array(), back = new Array();
        for (var i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], front, back, front, back);
        }
        if (this.front)
            front = this.front.clipPolygons(front);
        this.back ? (back = this.back.clipPolygons(back)) : (back = []);
        return front.concat(back);
    };
    // Remove all polygons in this BSP tree that are inside the other BSP tree
    // `bsp`.
    Node.prototype.clipTo = function (bsp) {
        this.polygons = bsp.clipPolygons(this.polygons);
        if (this.front)
            this.front.clipTo(bsp);
        if (this.back)
            this.back.clipTo(bsp);
    };
    // Return a list of all polygons in this BSP tree.
    Node.prototype.allPolygons = function () {
        var polygons = this.polygons.slice();
        if (this.front)
            polygons = polygons.concat(this.front.allPolygons());
        if (this.back)
            polygons = polygons.concat(this.back.allPolygons());
        return polygons;
    };
    // Build a BSP tree out of `polygons`. When called on an existing tree, the
    // new polygons are filtered down to the bottom of the tree and become new
    // nodes there. Each set of polygons is partitioned using the first polygon
    // (no heuristic is used to pick a good split).
    Node.prototype.build = function (polygons) {
        if (!polygons.length)
            return;
        if (!this.plane)
            this.plane = polygons[0].plane.clone();
        var front = [], back = [];
        for (var i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
        }
        if (front.length) {
            if (!this.front)
                this.front = new Node();
            this.front.build(front);
        }
        if (back.length) {
            if (!this.back)
                this.back = new Node();
            this.back.build(back);
        }
    };
    return Node;
}());
exports.Node = Node;
