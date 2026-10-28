// Converts the samples of library/samples to the new library's shape in place (scripts/v1/convert-samples.ts), and
// names each file it wrote; running it again changes nothing.
// Run: bun run scripts/convert-samples.ts [root]
import { convertSamples } from "./v1/convert-samples.ts";
import { SAMPLES_ROOT } from "./v1/load.ts";

const written = await convertSamples(process.argv[2] ?? SAMPLES_ROOT);
for (const file of written) console.log(`  ${file}`);
