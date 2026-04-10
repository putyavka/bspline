const fs = require('fs');

function run() {
    fs.copyFileSync('./src/index.html', './dist/index.html');
    fs.copyFileSync('./dist/bundle.js', './dist/index.js',);
    fs.readdirSync('./dist')
        .filter(name => !name.startsWith('index.'))
        .map(name => `./dist/${name}`)
        .forEach(path => fs.unlinkSync(path))
}

run();