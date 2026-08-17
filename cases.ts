import { m } from "./mod.js"; // ok, not flagged
import { m as m2 } from "./mod.ts"; // -> ./mod.js    correct
import a from "./data.json" with { type: "json" }; // -> ./data.js   breaks
import c from "./style.css"; // -> ./style.js  breaks

console.log(m, m2, a, c);
