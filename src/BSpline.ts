import type { PointLike } from "./PointLike";
import type { Vertex } from "./Vertex";

////////////////////////////////////////
// BSpline

export class BSpline {
    constructor(
        readonly CV: readonly PointLike[],
        maxDegree: number,
        readonly closed: boolean
    ) {
        const p = this.degree = Math.max(0, Math.min(maxDegree, CV.length - 1));
        if (closed) {
            this._CV = CV.concat(CV.slice(0, p));
            this.K = BSpline.createKnotsRegular(this._CV.length + p + 1);
        } else {
            this._CV = CV;
            this.K = BSpline.createKnotsClamped(CV.length + p + 1, p);
        }
        this.D.length = this.degree + 1;
    }

    public readonly degree: number;
    public get segments(): number { return this._CV.length - this.degree; }
    public get tangent(): PointLike { return this._tangent; }

    protected readonly _CV: readonly PointLike[];
    protected readonly K: number[];
    protected readonly D: Vertex[] = [];
    private readonly _tangent: Vertex = { x: 0, y: 0 };

    public get(t: number): PointLike {
        const { D, _CV: C, K, degree: p } = this;
        t = this.normalize(t);
        const k = this.findInterval(t);
        for (let i = 0; i <= p; i++)
            D[i].x = C[i + k - p].x, D[i].y = C[i + k - p].y;
        for (let r = p; r > 0; r--) {
            if (r == 1)
                this._tangent.x = D[1].x - D[0].x,
                    this._tangent.y = D[1].y - D[0].y;
            for (let i = 0; i < r; i++) {
                const i_k = i + k + 1;
                const a = (t - K[i_k - r]) / (K[i_k] - K[i_k - r]);
                const d0 = D[i], d1 = D[i + 1];
                d0.x = (1 - a) * d0.x + a * d1.x;
                d0.y = (1 - a) * d0.y + a * d1.y;
            }
        }
        return D[0];
    }

    protected normalize(t: number): number {
        t = Math.max(0, Math.min(t, 1));
        const p = this.degree;
        const K = this.K;
        return K[p] + t * (K[K.length - p - 1] - K[p]);
    }

    protected findInterval(t: number): number {
        const { K, degree: p } = this;
        const n = K.length;
        for (let i = p; i < n - p - 1; i++)
            if (t < K[i + 1])
                return i;
        return n - p - 2;
    }

    protected static createKnotsClamped(n: number, p: number): number[] {
        const K: number[] = [];
        const m = p + 1;
        K.length = n;
        K.fill(0, 0, m);
        K.fill(1, n - m);
        for (let i = m; i < n - m; i++)
            K[i] = (i - p) / (n - m - m + 1);
        return K;
    }
    protected static createKnotsRegular(n: number): number[] {
        const K: number[] = [];
        K.length = n;
        for (let i = 0; i < n; i++)
            K[i] = i / (n - 1);
        return K;
    }
}
