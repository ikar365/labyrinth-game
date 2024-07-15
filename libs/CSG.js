"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSG = void 0;
var three_1 = require("three");
var NBuf_1 = require("./NBuf");
var Node_1 = require("./Node");
var Polygon_1 = require("./Polygon");
var Vector_1 = require("./Vector");
var Vertex_1 = require("./Vertex");
/**
 * Holds a binary space partition tree representing a 3D solid. Two solids can
 * be combined using the `union()`, `subtract()`, and `intersect()` methods.
 */
var CSG = /** @class */ (function () {
    function CSG() {
        this.polygons = [];
    }
    CSG.fromPolygons = function (polygons) {
        var csg = new CSG();
        csg.polygons = polygons;
        return csg;
    };
    CSG.fromGeometry = function (geom, objectIndex) {
        var polys = [];
        var posattr = geom.attributes.position;
        var normalattr = geom.attributes.normal;
        var uvattr = geom.attributes.uv;
        var colorattr = geom.attributes.color;
        var grps = geom.groups;
        var index;
        if (geom.index) {
            index = geom.index.array;
        }
        else {
            index = new Uint16Array((posattr.array.length / posattr.itemSize) | 0);
            for (var i = 0; i < index.length; i++)
                index[i] = i;
        }
        var triCount = (index.length / 3) | 0;
        polys = new Array(triCount);
        for (var i = 0, pli = 0, l = index.length; i < l; i += 3, pli++) {
            var vertices = new Array(3);
            for (var j = 0; j < 3; j++) {
                var vi = index[i + j];
                var vp = vi * 3;
                var vt = vi * 2;
                var x = posattr.array[vp];
                var y = posattr.array[vp + 1];
                var z = posattr.array[vp + 2];
                var nx = normalattr.array[vp];
                var ny = normalattr.array[vp + 1];
                var nz = normalattr.array[vp + 2];
                var u = uvattr === null || uvattr === void 0 ? void 0 : uvattr.array[vt];
                var v = uvattr === null || uvattr === void 0 ? void 0 : uvattr.array[vt + 1];
                vertices[j] = new Vertex_1.Vertex(new Vector_1.Vector(x, y, z), new Vector_1.Vector(nx, ny, nz), new Vector_1.Vector(u, v, 0), colorattr &&
                    new Vector_1.Vector(colorattr.array[vp], colorattr.array[vp + 1], colorattr.array[vp + 2]));
            }
            if (objectIndex === undefined && grps && grps.length > 0) {
                for (var _i = 0, grps_1 = grps; _i < grps_1.length; _i++) {
                    var grp = grps_1[_i];
                    if (i >= grp.start && i < grp.start + grp.count) {
                        polys[pli] = new Polygon_1.Polygon(vertices, grp.materialIndex);
                    }
                }
            }
            else {
                polys[pli] = new Polygon_1.Polygon(vertices, objectIndex);
            }
        }
        return CSG.fromPolygons(polys.filter(function (p) { return !Number.isNaN(p.plane.normal.x); }));
    };
    CSG.toGeometry = function (csg, toMatrix) {
        var triCount = 0;
        var ps = csg.polygons;
        for (var _i = 0, ps_1 = ps; _i < ps_1.length; _i++) {
            var p = ps_1[_i];
            triCount += p.vertices.length - 2;
        }
        var geom = new three_1.BufferGeometry();
        var vertices = new NBuf_1.NBuf3(triCount * 3 * 3);
        var normals = new NBuf_1.NBuf3(triCount * 3 * 3);
        var uvs = new NBuf_1.NBuf2(triCount * 2 * 3);
        var colors;
        var grps = [];
        var dgrp = [];
        for (var _a = 0, ps_2 = ps; _a < ps_2.length; _a++) {
            var p = ps_2[_a];
            var pvs = p.vertices;
            var pvlen = pvs.length;
            if (p.shared !== undefined) {
                if (!grps[p.shared])
                    grps[p.shared] = [];
            }
            if (pvlen && pvs[0].color !== undefined) {
                if (!colors)
                    colors = new NBuf_1.NBuf3(triCount * 3 * 3);
            }
            for (var j = 3; j <= pvlen; j++) {
                var grp = p.shared === undefined ? dgrp : grps[p.shared];
                grp.push(vertices.top / 3, vertices.top / 3 + 1, vertices.top / 3 + 2);
                vertices.write(pvs[0].pos);
                vertices.write(pvs[j - 2].pos);
                vertices.write(pvs[j - 1].pos);
                normals.write(pvs[0].normal);
                normals.write(pvs[j - 2].normal);
                normals.write(pvs[j - 1].normal);
                if (uvs) {
                    uvs.write(pvs[0].uv);
                    uvs.write(pvs[j - 2].uv);
                    uvs.write(pvs[j - 1].uv);
                }
                if (colors) {
                    colors.write(pvs[0].color);
                    colors.write(pvs[j - 2].color);
                    colors.write(pvs[j - 1].color);
                }
            }
        }
        geom.setAttribute('position', new three_1.BufferAttribute(vertices.array, 3));
        geom.setAttribute('normal', new three_1.BufferAttribute(normals.array, 3));
        uvs && geom.setAttribute('uv', new three_1.BufferAttribute(uvs.array, 2));
        colors && geom.setAttribute('color', new three_1.BufferAttribute(colors.array, 3));
        for (var gi = 0; gi < grps.length; gi++) {
            if (grps[gi] === undefined) {
                grps[gi] = [];
            }
        }
        if (grps.length) {
            var index = [];
            var gbase = 0;
            for (var gi = 0; gi < grps.length; gi++) {
                geom.addGroup(gbase, grps[gi].length, gi);
                gbase += grps[gi].length;
                index = index.concat(grps[gi]);
            }
            geom.addGroup(gbase, dgrp.length, grps.length);
            index = index.concat(dgrp);
            geom.setIndex(index);
        }
        var inv = new three_1.Matrix4().copy(toMatrix).invert();
        geom.applyMatrix4(inv);
        geom.computeBoundingSphere();
        geom.computeBoundingBox();
        return geom;
    };
    CSG.fromMesh = function (mesh, objectIndex) {
        var csg = CSG.fromGeometry(mesh.geometry, objectIndex);
        var ttvv0 = new three_1.Vector3();
        var tmpm3 = new three_1.Matrix3();
        tmpm3.getNormalMatrix(mesh.matrix);
        for (var i = 0; i < csg.polygons.length; i++) {
            var p = csg.polygons[i];
            for (var j = 0; j < p.vertices.length; j++) {
                var v = p.vertices[j];
                v.pos.copy(ttvv0.copy(v.pos.toVector3()).applyMatrix4(mesh.matrix));
                v.normal.copy(ttvv0.copy(v.normal.toVector3()).applyMatrix3(tmpm3));
            }
        }
        return csg;
    };
    CSG.toMesh = function (csg, toMatrix, toMaterial) {
        var geom = CSG.toGeometry(csg, toMatrix);
        var m = new three_1.Mesh(geom, toMaterial);
        m.matrix.copy(toMatrix);
        m.matrix.decompose(m.position, m.quaternion, m.scale);
        m.rotation.setFromQuaternion(m.quaternion);
        m.updateMatrixWorld();
        m.castShadow = m.receiveShadow = true;
        return m;
    };
    CSG.union = function (meshA, meshB) {
        var csgA = CSG.fromMesh(meshA);
        var csgB = CSG.fromMesh(meshB);
        return CSG.toMesh(csgA.union(csgB), meshA.matrix, meshA.material);
    };
    CSG.subtract = function (meshA, meshB) {
        var csgA = CSG.fromMesh(meshA);
        var csgB = CSG.fromMesh(meshB);
        return CSG.toMesh(csgA.subtract(csgB), meshA.matrix, meshA.material);
    };
    CSG.intersect = function (meshA, meshB) {
        var csgA = CSG.fromMesh(meshA);
        var csgB = CSG.fromMesh(meshB);
        return CSG.toMesh(csgA.intersect(csgB), meshA.matrix, meshA.material);
    };
    CSG.prototype.clone = function () {
        var csg = new CSG();
        csg.polygons = this.polygons
            .map(function (p) { return p.clone(); })
            .filter(function (p) { return Number.isFinite(p.plane.w); });
        return csg;
    };
    CSG.prototype.toPolygons = function () {
        return this.polygons;
    };
    CSG.prototype.union = function (csg) {
        var a = new Node_1.Node(this.clone().polygons);
        var b = new Node_1.Node(csg.clone().polygons);
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        return CSG.fromPolygons(a.allPolygons());
    };
    CSG.prototype.subtract = function (csg) {
        var a = new Node_1.Node(this.clone().polygons);
        var b = new Node_1.Node(csg.clone().polygons);
        a.invert();
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        a.invert();
        return CSG.fromPolygons(a.allPolygons());
    };
    CSG.prototype.intersect = function (csg) {
        var a = new Node_1.Node(this.clone().polygons);
        var b = new Node_1.Node(csg.clone().polygons);
        a.invert();
        b.clipTo(a);
        b.invert();
        a.clipTo(b);
        b.clipTo(a);
        a.build(b.allPolygons());
        a.invert();
        return CSG.fromPolygons(a.allPolygons());
    };
    // Return a new CSG solid with solid and empty space switched. This solid is
    // not modified.
    CSG.prototype.inverse = function () {
        var csg = this.clone();
        for (var _i = 0, _a = csg.polygons; _i < _a.length; _i++) {
            var p = _a[_i];
            p.flip();
        }
        return csg;
    };
    CSG.prototype.toMesh = function (toMatrix, toMaterial) {
        return CSG.toMesh(this, toMatrix, toMaterial);
    };
    CSG.prototype.toGeometry = function (toMatrix) {
        return CSG.toGeometry(this, toMatrix);
    };
    return CSG;
}());
//exports.CSG = CSG;

export { CSG };
