const path = require('path')
const transformer = require('@vanilla-extract/jest-transform')

module.exports = {
    process(sourceText, sourcePath, options) {
        // if this is a vanilla-extract css.ts file then pass it to the vanilla-extract transformer
        if (sourcePath.endsWith('.css.ts')) {
            return transformer.default.process(sourceText, sourcePath, { config: options })
        }
        // otherwise, we just return a simple string that exports the filename because
        // we don't want any CSS being transformed in Jest
        return {
            code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`,
        }
    },
}