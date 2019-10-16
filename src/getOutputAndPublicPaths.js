const path = require('path')

module.exports = (fileName, { outputPath: configOutputPath, publicPath: configPublicPath }) => {
  let outputPath = fileName

  if (configOutputPath) {
    if (typeof configOutputPath === 'function') {
      outputPath = configOutputPath(fileName)
    } else {
      outputPath = path.posix.join(configOutputPath, fileName)
    }
  }

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`

  if (configPublicPath) {
    if (typeof configPublicPath === 'function') {
      publicPath = configPublicPath(fileName)
    } else if (configPublicPath.endsWith('/')) {
      publicPath = configPublicPath + fileName
    } else {
      publicPath = `${configPublicPath}/${fileName}`
    }
    publicPath = JSON.stringify(publicPath)
  }

  return {
    outputPath,
    publicPath,
  }
}
