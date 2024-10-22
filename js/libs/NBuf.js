class NBuf3 {
    constructor(ct) {
        this.top = 0;
        this.array = new Float32Array(ct);
    }

    write(v) {
        this.array[this.top++] = v.x;
        this.array[this.top++] = v.y;
        this.array[this.top++] = v.z;
    }
}

class NBuf2 {
    constructor(ct) {
        this.top = 0;
        this.array = new Float32Array(ct);
    }

    write(v) {
        this.array[this.top++] = v.x;
        this.array[this.top++] = v.y;
    }
}

export { NBuf3, NBuf2 };
