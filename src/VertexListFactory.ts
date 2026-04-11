import { Vertex } from "./Vertex";

export class VertexListFactory {
    constructor(
        private readonly canvasWidth: number,
        private readonly canvasHeight: number
    ) { }
    
    public sample(): Vertex[] {
        const cv = this.newCV.bind(this);
        return [
            cv(0.5, 0.5), cv(0.1, 0.5), cv(0.1, 0.1),
            cv(0.9, 0.1), cv(0.9, 0.9), cv(0.1, 0.9),
        ];
    }

    public random(count: number, border = 0.1): Vertex[] {
        const CV = new Array(count)
            .fill(0)
            .map(_ => ({x: Math.random(), y: Math.random()}));
        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        CV.forEach(v => {
            minX = Math.min(minX, v.x), minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x), maxY = Math.max(maxY, v.y);
        });
        const range = 1 - border * 2;
        return CV.map(v => this.newCV(
            border + (v.x - minX) / (maxX - minX) * range,
            border + (v.y - minY) / (maxY - minY) * range,
        ));
    }

    private newCV(u: number, v: number): Vertex {
        return { x: u * this.canvasWidth, y: v * this.canvasHeight };
    }
}
