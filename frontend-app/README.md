StoryBook Docs
===================

### Requirements
You need at least **Node 4** and new NPM you also need **Meteor**. Project is written using this approach: http://julian.io/react-with-webpack-meteor-as-a-backend/

### Structure

All is separated. Meteor is used here as a backend only. On the client side we have React/Redux and Webpack. You can read more about the structure in the article above.

If you need to run the app you need two separated terminal tabs. In the first one in the `server` folder run `meteor -p 9000` in the second one in the `client` folder you need to run `npm start`.

We use DDP client to connect with the Meteor backend. It is called [Asteroid](https://github.com/mondora/asteroid). You'll find the configuration in the `client/app/asteroid/asteroid.js` file. If you need to work locally change the Meteor's endpoint in the configuration.

All in the client folder is just a standard Webpack - React boilerplate. You will find Webpack config here and also all React components. We also use Redux here so in the `client/app/redux` folder you'll find all reducers, actions etc. There is many reducers. We probably could reduce reducers amount ;) Refactoring is needed for sure. It was builded over long time so there is some code which could be written cleaner with current knowledge about the project.

All in the server folder is just a Meteor app. Just simple server code with realtime data. We don't have accounts and security stuff yet. 

In the `app/components` folder you'll find all needed React components which are based on Redux data flow. In the `app/common` folder you'll find some of the global helpers which are used in many places in the app.

### Libraries
We use [Redux](https://github.com/reactjs/redux) and [ReactDnD](http://gaearon.github.io/react-dnd/), but also [react-css-modules](https://github.com/gajus/react-css-modules).

All states in the app are managed by Redux. Every dynamic React component uses `connect()` method from redux, here imported as `reduxConnect()`. You'll find it in many components at the end of the file. So you basically wrap components and map states to props and map dispatch methods to props. This is implemented according React-Redux workflow described here : http://redux.js.org/docs/basics/UsageWithReact.html This is a standard implementation. Nothing unusuall, but of course you need to know Redux a little bit. All reducers, actions etc. are located in the `client/app/redux` folder. What is needed here for sure is optimization of reducers, because there is too much of them. I'm sure it could be done better.

We also use ReactDnD here. It is used in components which implements DnD functionality such as timeline items, blocks, resizing. For example we use `dropTarget` in the `Canvas` component and we expect that there will be `dndItemTypes.DRAGABLEBOX, dndItemTypes.SORTABLEMENUITEM` dropped. The types are defined in `client/app/common/vars.js`. Then we use for example `DraggableBox.js` as a `dragSource` for the `Canvas`. All is very similar in the case of other draggable components. Of course you need to know how the ReactDnD works. This part is quite complicated, so if you'll have questions write e-mail.

### Global state of the app (data flow)

As mentioned above we use Redux, but how it works? 
In the global `client/app/redux` folder we have our actions, reducers, and store. The most important is store here, this is our one source of truth, but in fact in this file we don't have much, just our store configuration. All the magic is located in reducers.js file (needs to be refactored for sure). Here we have many different reducers which at the end of the file are combined into one big main reducer. Reducers triggers our actions and modify the store. So when in our components we will trigger some action it will modify the particular part of the data because it is configured in reducers part. The actions file in this folders has whole actions configuration. There is also async-action file which defines actions which triggers calls to the server side methods using special Redux middleware called [thunk](https://github.com/gaearon/redux-thunk).

As you probably know the React components are based on states and props. This is the way how to make them reactive. In Redux the main purpose is to have one source of truth and propagate the data from the top component to others. This is done in the main component, here in `client/app/App.js`. As you can see we pass the store using special `Provider` component which comes from react-redux library. This library is here to make our lives easier and provide many useful tools to consume Readux possibilities. 

What we need to do in our components is to wrap the view only stuff in data containers components which will map actions (in fact dispatchers of actions) to props and states to props. (in fact here we use the same components, needs to be refactored to be able to have better separation of the view only components). Let's see the example: in 'client/app/components/home/Home.js'. As you can see on the bottom of the file we use special `reduxConnect` method which does exactly what we described before. This way we just pass to props some current states from the main store and some methods which are dispatchers of defined actions which can change the current state in the store. 

### Tricky parts of the app

#### `sizesRecalc()` method
Because all is recalculated in the app every actions needs to dispach other actions. So for example when we change the sizes of the browser's window this method is fired and all sidebars and elements on the canvas are recalculated. We use this in couple of places so all operations are defined in this one method. 

```
import { staticLeftMenuWidth, topMenuHeight, bottomFooterBar } from './vars';
import store from '../redux/store';
import { setMainSizes, setCanvasSizes, setStaticleftmenuSizes, changeBox, changeBoxResizableSizes } from '../redux/actions';
```

As you can see we import some static sizes from `vars.js` file here. These sizes are constant. They are just needed to process other calculations. Then we import stores so we will be able to read current values. Next we need all actions for elements which will change so we'll be able to dispatch them when needed. 

This method has impact on couple of elements in the app. These elements are main **Canvas sizes**. **Boxes sizes** and also **boxes positions**. So when you open the menu or just resize the browser's window `sizesRecalc()` method is fired. It takes current sizes from the store and recalculates them. Next it dispatches actions which updates the store. It will work also when you try to resize main timeline container. The Canvas and Boxes should change its sizes and positions.

#### Resizable boxes

Here we have our own implementation of `resizable` elements based on ReactDnD. This part could be probably optimized. We have 8 small squares and borders attached to the boxes, they are draggable elements. When we drop them the redux actions are dispatched and current box changes its sizes. Most of the implementation is located in `Canvas` component because it is also the drop target for these elements. So we just use `if` statement here. We check if dropped item is a `resizableHandler`. Which is defined in `client/app/common/resizable-element/ResizableHandler.js`

#### Backend integration

We use Meteor as a backend only here and `Asteroid` library which implements `DDP` protocol which is a standard when communicating with Meteor. It is protocol for WebSockets. With `Asteroid` we are able to connect our separated React app with Meteor backend and we can achieve reactive data sync. So for example when we will drag the box on the canvas and we will drop it the reactive data in the MongoDB will be updated with new position of the box, so when we refresh the page we will be able to download current state of the whole elements which are connected to the real time data store on the backend.

How it works? We have separated React app which has no information about the backend. We just use `Asteriod` which connects with the WebSockets endpoint served by Meteor app. You can see this in `client/app/asteroid/asteroid.js`. In the server folder we have Meteor app configured which has bunch of backend methods and it also publish some reactive data (you will find this code in every folder in `server/imports/server`). Then in the `asteroid.js` file we can listen to this publication and react on each data change. So when the data is changed we could for example trigger some Redux actions on the front-end which will update the state of the app changing values in the main stores. It could of course work in the other way. When we trigger some action on the front end using Redux async actions which are located in `client/app/redux/async-actions.js` we are able to trigger the method defined on the Meteor backend using Asteroid API. This is quite clean and centralized approach. Also you have full control over your reactive data changes configuration and standard calls to the server.

#### s-Grid Flexbox grid system

[s-grid](http://stylusgrid.com/) is a simple stylus based flexbox abstraction. You can use it like:

```
.main-container
    grid()
.column-1
    cell(1, 2)
.column-2
    cell(1, 2)
```

You'll get two columns 50% width.

You can use any fraction in `cell()` function. You can manage the grid by using parameters in `grid()` method like `grid(cells-align: 'center')` etc.

You can use many other stylus functions and parameters which are described here: [http://stylusgrid.com/docs.html](http://stylusgrid.com/docs.html)

If you want to better understand how to use it, you can go and see many demo examples here: [http://stylusgrid.com/examples.html](http://stylusgrid.com/examples.html) where you'll find usage with configured classes and with stylus functions only which give you the same effect. But remember that in this app we don't use calsses, just stylus functions.