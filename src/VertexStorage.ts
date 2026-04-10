import type { Vertex } from "./Vertex";

export class VertexStorage {
    private static CV_KEY = "data.CV";
    public static load(): Vertex[] | undefined {
        try {
            const list = JSON.parse(localStorage[this.CV_KEY]);
            if (!Array.isArray(list)) return undefined;
            if (list.some(e => typeof (e) !== "object" || typeof (e.x) !== "number" || typeof (e.y) !== "number"))
                return undefined;
            return list;
        } catch { }
    }
    public static save(list: Vertex[]): void {
        try { localStorage[this.CV_KEY] = JSON.stringify(list); }
        catch { }
    }
}
