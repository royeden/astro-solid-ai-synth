import fg from "fast-glob";
import fs from "fs/promises";
import colors from "@colors/colors";

console.log(
  colors.blue(`Copying AI asset files to public/scripts
View the following issue to know why this is a relevant step:
https://github.com/google/mediapipe/issues/1812
`)
);

const entries = await fg([
  "node_modules/@mediapipe/pose/*.js",
  "node_modules/@mediapipe/pose/*.tflite",
  "node_modules/@mediapipe/pose/*.wasm",
  "node_modules/@mediapipe/pose/*.binarypb",
  "node_modules/@mediapipe/pose/*.data",
]);

entries.forEach((entry) => {
  const target = `public/scripts/${entry.split("/").at(-1)}`;
  console.log(colors.yellow(`Copying: ${entry}...`));
  fs.copyFile(entry, target);
  console.log(colors.green(`Copied to: ${target}!\n`));
});

console.log(colors.green(colors.bold("Copied all assets into public/scripts")));
