"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NBuf2 = exports.NBuf3 = void 0;
var NBuf3 = /** @class */ (function () {
    function NBuf3(ct) {
        this.top = 0;
        this.array = new Float32Array(ct);
    }
    NBuf3.prototype.write = function (v) {
        this.array[this.top++] = v.x;
        this.array[this.top++] = v.y;
        this.array[this.top++] = v.z;
    };
    return NBuf3;
}());
exports.NBuf3 = NBuf3;
var NBuf2 = /** @class */ (function () {
    function NBuf2(ct) {
        this.top = 0;
        this.array = new Float32Array(ct);
    }
    NBuf2.prototype.write = function (v) {
        this.array[this.top++] = v.x;
        this.array[this.top++] = v.y;
    };
    return NBuf2;
}());
exports.NBuf2 = NBuf2;
