module.exports = files => {
  const images = files
    .map(
      ({ path, width, height, resolution }) => `{
        path: ${path},
        width: ${width},
        height: ${height},
        resolution: "${resolution}",
      }`,
    )
    .join(',')

  const srcSet = files
    .map(({ path, resolution }) => path + `+${JSON.stringify(` ${resolution}`)}`)
    .join('+","+')

  const imagesByResolution = files.reduce((acc, { path, resolution, width, height }) => {
    acc[resolution.replace(/"/gi, '')] = {
      path: path.replace(/"/gi, ''),
      width,
      height,
    }

    return acc
  }, {})

  const mainImage = imagesByResolution['3x']
  const result = `
    module.exports = {
      images: [${images}],
      imagesByResolution: ${JSON.stringify(imagesByResolution)},
      "1x": "${imagesByResolution['1x'].path}",
      "2x": "${imagesByResolution['2x'].path}",
      "3x": "${mainImage.path}",
      srcSet: ${srcSet},
      toString: function(){return "${mainImage.path}"},
    };
  `

  return result
}
