// Studio Webux 2022

const { resolve } = require("path");
const {
  readdirSync,
  symlinkSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} = require("fs");

process.env.DEBUG &&
  process.argv.forEach((val, index) => {
    console.log(`${index}: ${val}`);
  });

function getFiles(workingDirectory) {
  return readdirSync(resolve(process.cwd(), workingDirectory));
}

function listPrefixes(files) {
  return new Set(files.map((file) => file.split("_")[0]));
}

async function getFileCountPerPrefixes(prefixes, files) {
  return Promise.all(prefixes.map((prefix) => getCount(prefix, files)));
}

function getCount(prefix, files) {
  const count = files.filter((file) => file.includes(prefix)).length;
  return {
    prefix,
    count,
    p10_test: (count * 0.1).toFixed(0),
    p20_test: (count * 0.2).toFixed(0),
    p10_training: (count * 0.9).toFixed(0),
    p20_training: (count * 0.8).toFixed(0),
    trainable: count > 500,
  };
}

function verifyImageFormat(files) {
  return files.filter((file) => file.includes(".jpg"));
}

/**
 * image AI seems to require the same amount of picture per categories to have a equivalent probabilities.
 * @param {*} prefixes
 * @param {*} meta
 * @returns
 */
function getMinimumCount(prefixes, meta) {
  const values = prefixes.split(",").map((prefix) => ({
    prefix,
    count: meta.filter((info) => info.prefix === prefix)[0].count,
  }));

  return Math.min.apply(
    Math,
    values.map((i) => i.count)
  );
}

async function symlinkHandler(prefixes, source, dest, files, meta, limit) {
  return Promise.all(
    prefixes.split(",").map(
      (prefix) =>
        symlink(
          prefix,
          source,
          dest,
          files.filter((file) => file.includes(prefix)),
          meta,
          limit
        ),
      meta
    )
  );
}

/**
 * Placeholder in case we need to handle the dup differently.
 * @param {*} file
 */
function fileExist(file) {
  // Currently this approach doesn't support continuing a training because the files can changed;
  // So we might have duplicated file after adding new stuff.

  // I think a better approach is having a mapping to removed the already linked files in
  //  either test or train folders before starting the symlink process
  // unlinkSync(file);
  process.env.DEBUG &&
    console.debug(
      `File [${file}] is already in either test or train, skipping...`
    );

  return true; // Will NOT symlink the file again.
}

/**
 * Allows improving the dataset over time without moving files everywhere and cause more damage.
 * @param {*} dest
 * @param {*} prefix
 * @param {*} file
 * @returns
 */
function checkDup(dest, prefix, file) {
  return (
    existsSync(resolve(dest, "test", prefix, file)) ||
    existsSync(resolve(dest, "train", prefix, file))
  );
}

function symlink(prefix, source, dest, files, meta, limit = null) {
  const testCount = limit
    ? (limit * 0.1).toFixed(0)
    : meta.filter((info) => info.prefix === prefix)[0].p10_test;
  const trainCount = limit
    ? (limit * 0.9).toFixed(0)
    : meta.filter((info) => info.prefix === prefix)[0].p10_training;
  const isTrainable = meta.filter((info) => info.prefix === prefix)[0]
    .trainable;

  if (!isTrainable) {
    throw new Error(`[WARNING] The prefix [${prefix}] is not trainable.`);
  }

  mkdirSync(resolve(dest, "test", prefix), { recursive: true });
  mkdirSync(resolve(dest, "train", prefix), { recursive: true });

  // test structure
  files.slice(0, testCount).forEach((file) => {
    (checkDup(dest, prefix, file) &&
      fileExist(resolve(dest, "test", prefix, file))) ||
      symlinkSync(
        resolve(source, file),
        resolve(dest, "test", prefix, file),
        "file"
      );
  });

  // training structure
  files
    .slice(testCount, parseInt(testCount) + parseInt(trainCount))
    .forEach((file) => {
      (checkDup(dest, prefix, file) &&
        fileExist(resolve(dest, "train", prefix, file))) ||
        symlinkSync(
          resolve(source, file),
          resolve(dest, "train", prefix, file),
          "file"
        );
    });

  // Check
  const trainFileRead = readdirSync(resolve(dest, "train", prefix)).length;
  const testFileRead = readdirSync(resolve(dest, "test", prefix)).length;

  if (trainFileRead != trainCount || testFileRead != testCount) {
    throw new Error(
      `Something went wrong. ${prefix}, training: ${trainFileRead}/${trainCount}; test: ${testFileRead}/${testCount}`
    );
  }

  return {
    prefix,
    source,
    dest,
    count: files.length,
    meta: meta.filter((info) => info.prefix === prefix)[0],
    limit,
  };
}

(async () => {
  try {
    const target = process.argv.slice(2)[0];
    if (!target) {
      throw new Error("Missing target.");
    }

    let files = getFiles(target);
    files = [...verifyImageFormat(files)];
    console.debug("Valid File(s) " + files.length);

    const prefixes = listPrefixes(files);
    const mapping = await getFileCountPerPrefixes([...prefixes], files);

    const minimum = getMinimumCount(process.argv.slice(3)[0], mapping);

    if (process.argv.slice(3)[0] && process.argv.slice(4)[0]) {
      const output = await symlinkHandler(
        process.argv.slice(3)[0], //prefixes
        process.argv.slice(2)[0], //source
        process.argv.slice(4)[0], //dest
        files, // files to process
        mapping, // metadata to build the test/training
        minimum || null
      );
      console.debug(output);
    } else {
      console.log(`Prefixes found: ${[...prefixes].length}`);
      console.log(`Available Prefixes: ${[...prefixes]}`);
      console.log(`Mapping found: ${JSON.stringify(mapping, null, 2)}`);
    }
  } catch (e) {
    console.error(`[ERROR] ${e.message}`);
    console.error(e);
    process.exit(1);
  }
})();
