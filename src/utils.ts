export const W = "w";
export const A = "a";
export const S = "s";
export const D = "d";
export const SHIFT = "shift";
export const DIRECTIONS = [W, A, S, D];

// DISPLAY
export class KeyDisplay {
    map: Map<string, HTMLDivElement> = new Map();

    constructor() {
        const w: HTMLDivElement = document.createElement("div");
        const a: HTMLDivElement = document.createElement("div");
        const s: HTMLDivElement = document.createElement("div");
        const d: HTMLDivElement = document.createElement("div");
        const shift: HTMLDivElement = document.createElement("div");
        const containerDiv: HTMLDivElement = document.createElement("div");
        const fragmentDom = document.createDocumentFragment();

        this.map.set(W, w);
        this.map.set(A, a);
        this.map.set(S, s);
        this.map.set(D, d);
        this.map.set(SHIFT, shift);

        this.map.forEach((v, k) => {
            v.style.color = "black";
            v.style.fontSize = "30px";
            v.style.fontWeight = "800";
            v.style.position = "absolute";
            v.textContent = k;
        });

        this.updatePosition();/** Display controls */

        this.map.forEach((v, _) => {
            fragmentDom.appendChild(v);
        });
        containerDiv.setAttribute("class", "ctrlsContainer");
        containerDiv.appendChild(fragmentDom);
        
        document.body.append(containerDiv);
    }
                    /** Methods */
    /** Position absolute to Window when resize */
    public updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 120}px`;
        this.map.get(A).style.top = `${window.innerHeight - 80}px`;
        this.map.get(S).style.top = `${window.innerHeight - 80}px`;
        this.map.get(D).style.top = `${window.innerHeight - 80}px`;
        this.map.get(SHIFT).style.top = `${window.innerHeight - 80}px`;

        this.map.get(W).style.left = `${150}px`;
        this.map.get(A).style.left = `${100}px`;
        this.map.get(S).style.left = `${150}px`;
        this.map.get(D).style.left = `${200}px`;
        this.map.get(SHIFT).style.left = `${20}px`;
    }

    public down(key: string) {
        if (this.map.get(key)) {
            this.map.get(key).style.color = "white";
        }
    }

    public up(key: string) {
        if (this.map.get(key)) {
            this.map.get(key).style.color = "black";
        }
    }
}
