import fg from "fast-glob";
import fs from "fs/promises";
import colors from "@colors/colors";
import path from "path";

console.log(
  colors.blue(`Copying AI asset files to public/scripts
View the following issue to know why this is a relevant step:
https://github.com/google/mediapipe/issues/1812
`)
);

const BASE_PATH = path.join(
  import.meta.url.replace("file://", "").split("/").slice(0, -1).join("/"),
  "node_modules/@mediapipe"
);
const DRAWING_UTILS_ASSETS_PATH = `${BASE_PATH}/drawing_utils`;
const AI_ASSETS_PATH = `${BASE_PATH}/pose`;

const entries = await fg([
  `${DRAWING_UTILS_ASSETS_PATH}/*.js`,
  `${AI_ASSETS_PATH}/*.js`,
  `${AI_ASSETS_PATH}/*.tflite`,
  `${AI_ASSETS_PATH}/*.wasm`,
  `${AI_ASSETS_PATH}/*.binarypb`,
  `${AI_ASSETS_PATH}/*.data`,
]);

entries.forEach((entry) => {
  const target = `public/scripts/${entry.split("/").at(-1)}`;
  console.log(colors.yellow(`Copying: ${entry}...`));
  fs.copyFile(entry, target);
  console.log(colors.green(`Copied to: ${target}!\n`));
});

console.log(colors.green(colors.bold("Copied all assets into public/scripts!")));
