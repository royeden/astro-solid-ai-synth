import axios from "axios";
import fs from "fs";
import colors from "@colors/colors";
import isCi from "is-ci";

const FILES_TO_COPY = [
  "drawing_utils/drawing_utils.js",
  "pose/pose.js",
  "pose/pose_landmark_full.tflite",
  "pose/pose_landmark_heavy.tflite",
  "pose/pose_landmark_lite.tflite",
  "pose/pose_solution_packed_assets.data",
  "pose/pose_solution_packed_assets_loader.js",
  "pose/pose_solution_simd_wasm_bin.data",
  "pose/pose_solution_simd_wasm_bin.js",
  "pose/pose_solution_simd_wasm_bin.wasm",
  "pose/pose_solution_wasm_bin.js",
  "pose/pose_solution_wasm_bin.wasm",
  "pose/pose_web.binarypb",
];

if (isCi) {
  async function fetchFiles() {
    if (!fs.existsSync("public/scripts")) {
      fs.mkdirSync("public/scripts");
    }
    await Promise.all(
      FILES_TO_COPY.map(async (file) => {
        const target = `public/scripts/${file.split("/").at(-1)}`;
        try {
          console.log(colors.yellow(`Fetching: ${file}...`));
          const response = (
            await axios.get(`https://cdn.jsdelivr.net/npm/@mediapipe/${file}`, {
              headers: {
                "Content-Encoding": "gzip",
              },
            })
          ).data;
          await fs.promises.writeFile(target, response);
          console.log(colors.green(`Fetched to: ${target}!\n`));
        } catch (error) {
          console.error(
            colors.red(
              `Error fetching file to: ${target}!\n${error?.message ?? ""}`
            )
          );
          console.error(error.response);
        }
      })
    );
  }
  fetchFiles();
} else {
  console.log(
    colors.blue(`Copying AI asset files to public/scripts
View the following issue to know why this is a relevant step:
https://github.com/google/mediapipe/issues/1812`)
  );

  FILES_TO_COPY.forEach((file) => {
    const src = `node_modules/@mediapipe/${file}`;
    const target = `public/scripts/${file.split("/").at(-1)}`;
    console.log(colors.yellow(`Copying: ${src}...`));
    fs.promises.copyFile(src, target);
    console.log(colors.green(`Copied to: ${target}!\n`));
  });

  console.log(
    colors.green(colors.bold("Copied all assets into public/scripts!"))
  );
}
