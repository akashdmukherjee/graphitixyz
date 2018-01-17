## StoryBook

It is built using React, Redux, DnD, Webpack. It is based on a standard React / React Router aplication architecture.
All development environment is prepared using Babel and Webpack. Below You'll find how to use it in the development environment and how to build it for production usage.

## Usage

```
$ npm install
$ npm start
```
...and go to: http://localhost:3000

Live website hosted on: http://akash.jsdemo.be (with basic auth / login and pass sent by e-mail).

## Prepare for production

If you are ready to prepare your production files. You can run `npm run build`. Webpack will bundle and save all needed files (.js, .css, img, .html) in the `public` folder. Then you can open in the browser .html files located in the public folder.

## Tests and ESLint

It uses Mocha runner config. You can use Enzyme, Chai, Sinon and JSDOM too.
Configuration allows you to test components which uses CSS Modules.
If you want to run tests put your test files in the `__tests__` folder and run `npm test` (it will run eslint too) or `npm run testonly`.
You'll find example tests in the `__tests__` folder.

### sGrid docs

- [stylusgrid.com](http://stylusgrid.com)

Works in Node with Promises support.
