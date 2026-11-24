import { readFileSync } from "node:fs";
const home = JSON.parse(readFileSync("src/data/home.json", "utf8"));
console.log("topics:", home.topics.length, JSON.stringify(home.topics[0], null, 1));
console.log("topicsFull:", home.topicsFull ? home.topicsFull.length : "none");
console.log("moreTopics:", JSON.stringify(home.moreTopics));
console.log("keys:", Object.keys(home));
// topics section wrapper from SSR html
const s = readFileSync("docs/research/chophim/home.html", "utf8");
const i = s.indexOf("Bạn đang quan tâm");
console.log("--- topics ctx ---");
console.log(s.slice(Math.max(0, i - 600), i + 200).replace(/></g, ">\n<"));
// comments box wrapper
const j = s.indexOf("Bình Luận Mới");
console.log("--- comments ctx ---");
console.log(s.slice(Math.max(0, j - 700), j + 100).replace(/></g, ">\n<"));
