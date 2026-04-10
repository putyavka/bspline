import { PointSet } from "./PointSet";
import type { Vertex } from "./Vertex";

////////////////////////////////////////
// VertexSet

export class VertexSet implements PointSet {
    constructor(
        readonly radius: number,
        readonly pickRadius: number = radius,
        private readonly onCountChange?: () => void,
        readonly vertices: Vertex[] = []
    ) { }
    get points() { return this.vertices; }
    get(x: number, y: number): number {
        const r = this.pickRadius * devicePixelRatio;
        let winI = -1, winD = r * r;
        this.points.forEach((p, i) => {
            const dx = x - p.x, dy = y - p.y;
            const d = dx * dx + dy * dy;
            if (d < winD) winD = d, winI = i;
        });
        return winI;
    }
    add(x: number, y: number): number {
        this.points.push({ x, y });
        this.onCountChange?.();
        return this.points.length - 1;
    }
    set(index: number, x: number, y: number): void {
        const v = this.vertices[index];
        if (v) v.x = x, v.y = y;
    }
    remove(index: number): void {
        this.vertices.splice(index, 1);
        this.onCountChange?.();
    }
}
