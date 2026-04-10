import { BSpline } from "./BSpline";
import type { PointLike } from "./PointLike";
import type { Vertex } from "./Vertex";

////////////////////////////////////////
// BSplineDescribed

export class BSplineDescribed extends BSpline {
    constructor(CV: readonly PointLike[], maxDegree: number, closed: boolean) {
        super(CV, maxDegree, closed);

        for (let i = 0; i < this.D.length; i++)
            this.D[i] = { x: 0, y: 0 };
        for (let i = this.degree + 1; i >= 1; i--)
            this.G.push(new Array(i).fill(0).map(_ => ({ x: 0, y: 0 })));
    }

    private readonly G: Vertex[][] = [];

    public get knots(): number[] { return this.K; }

    public getGuides(t: number): readonly PointLike[][] {
        const { G, _CV: C, K, degree: p } = this;
        t = this.normalize(t);
        const k = this.findInterval(t);
        for (let i = 0; i <= p; i++)
            G[0][i]!.x = C[i + k - p]!.x, G[0][i]!.y = C[i + k - p]!.y;
        for (let r = p; r > 0; r--) {
            const D0 = G[p - r];
            const D1 = G[p - r + 1];
            for (let i = 0; i < r; i++) {
                const i_k = i + k + 1;
                const a = (t - K[i_k - r]!) / (K[i_k]! - K[i_k - r]!);
                D1[i].x = (1 - a) * D0[i]!.x + a * D0[i + 1]!.x;
                D1[i].y = (1 - a) * D0[i]!.y + a * D0[i + 1]!.y;
            }
        }
        return this.G;
    }

    public getSegment(t: number): number {
        return this.findInterval(this.normalize(t)) - this.degree;
    }

    public getSegmentControlKnots(iSeg: number): {start: number, end: number} {
        const start = iSeg + 1;
        return { start, end: start + this.degree * 2 };
    }

    public getSegmentKnots(): number[] {
        return this.K.slice(this.degree, this.K.length - this.degree);
    }

    public getSegmentControlPoints(s_i: number): PointLike[] {
        s_i = Math.max(0, Math.min(s_i, this.segments - 1));
        const p = this.degree;
        return this._CV.slice(s_i, s_i + p + 1);
    }

    public getSegmentIntervals(): number[] {
        const K = this.K;
        const I: number[] = [];
        const p = this.degree;
        I.length = K.length - 2 * p + 1;
        const len = K[K.length - p - 1] - K[p];
        for (let i = p; i <= K.length - p; i++)
            I[i - p] = (K[i] - K[p]) / len;
        return I;
    }

    public getNormalized(t: number): number {
        return this.normalize(t);
    }
}
