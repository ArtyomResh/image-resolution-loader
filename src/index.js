const loaderUtils = require('loader-utils')
const sharp = require('sharp')
const getOutputAndPublicPaths = require('./getOutputAndPublicPaths')
const getLoaderResults = require('./getLoaderResults')
const imageminPngquant = require('imagemin-pngquant')
const imageminZopfli = require('imagemin-zopfli')

const MIMES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

module.exports = function loader(content) {
  const loaderCallback = this.async()
  const config = Object.assign({}, loaderUtils.getOptions(this))
  const image = sharp(content)
  const createFile = ({ data, resolution, ext }) => {
    const name = (config.name || '[name][resolution].[ext]').replace(/\[ext\]/gi, ext)
    const outputContext =
      config.context || this.rootContext || (this.options && this.options.context)
    const fileName = loaderUtils
      .interpolateName(this, name, {
        context: outputContext,
        content: data,
      })
      .replace(/\[resolution\]/gi, `@${resolution}`)

    const { outputPath, publicPath } = getOutputAndPublicPaths(fileName, config)

    this.emitFile(outputPath, data)

    return publicPath
  }

  return image
    .metadata()
    .then(({ width, height, format: ext }) => {
      const mime = MIMES[ext]
      const resolutions = ['1x', '2x', '3x']

      if (!mime) {
        return loaderCallback(
          new Error('No mime type for file with extension ' + ext + 'supported'),
        )
      }

      if (config.disable) {
        const publicPath = createFile({
          data: content,
          resolution: resolutions[2],
          ext,
        })
        const file = {
          path: publicPath,
          width,
          height,
        }
        const files = [
          { ...file, resolution: resolutions[0] },
          { ...file, resolution: resolutions[1] },
          { ...file, resolution: resolutions[2] },
        ]

        return files
      }

      const width1x = width / 3
      const height1x = height / 3

      if (!Number.isInteger(width1x) || !Number.isInteger(height1x)) {
        console.warn(
          `Width (${width}) or height (${height}) of the image ${this.resourcePath} is not divided by 3, additional compression losses are possible`,
        )
      }

      let promises = []
      resolutions.forEach(resolution => {
        const width1xNormalized = Math.floor(width / 3)
        const height1xNormalized = Math.floor(height / 3)
        const newWidth = width1xNormalized * parseInt(resolution)
        const newHeight = height1xNormalized * parseInt(resolution)

        promises.push(
          new Promise((resolve, reject) => {
            const resizedImage = image.clone().resize({
              width: newWidth,
              height: newHeight,
            })

            const toBufferCallback = (err, data, info) => {
              if (err) {
                reject(err)
              } else {
                const publicPath = createFile({
                  data,
                  resolution,
                  ext: info.format,
                })

                resolve({
                  data,
                  path: publicPath,
                  width: newWidth,
                  height: newHeight,
                  resolution,
                })
              }
            }

            if (ext === 'webp') {
              return resizedImage.webp(config.webp).toBuffer(toBufferCallback)
            }

            if (ext === 'png') {
              return resizedImage.toBuffer((err, data, info) => {
                if (err) {
                  reject(err)
                } else {
                  imageminPngquant(config.png)(data)
                    .then(imageminZopfli(config.zopfli))
                    .then(image => {
                      const publicPath = createFile({
                        data: image,
                        resolution,
                        ext: info.format,
                      })

                      resolve({
                        data: image,
                        path: publicPath,
                        width: newWidth,
                        height: newHeight,
                        resolution,
                      })
                    })
                }
              })
            }

            if (ext === 'jpg' || ext === 'jpeg') {
              return resizedImage.jpeg(config.jpeg).toBuffer(toBufferCallback)
            }
          }),
        )
      })

      return Promise.all(promises).then(files => files)
    })
    .then(files => loaderCallback(null, getLoaderResults(files)))
    .catch(err => loaderCallback(err))
}

module.exports.raw = true
