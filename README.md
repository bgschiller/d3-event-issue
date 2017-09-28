# D3 event troubles

Our story begins with some code that boils down to this:

```javascript
const grid = document.querySelector('#grid svg');
const highlightCoordinates = function() {
  const coords = d3.mouse(grid);
  // do something with those coordinates.
};
grid.addEventListener('mousemove', highlightCoordinates);
```

The issues appeared when we decided to throttle that function (using lodash, but underscore would likely be the same):

```javascript
grid.addEventListener('mousemove', _.throttle(highlightCoordinates, 100));
```

Lodash's throttle has `trailing` true by default (and we wanted to keep it on). The trailing call to `highlightCoordinates`, by definition, occurs *after* all of the mousemove events are done. Using `d3.mouse()` meant that we were depending on the value of `d3.event`, and it had already been cleaned up at that point.

![](https://trello-attachments.s3.amazonaws.com/58d428743111af1d0a20cf28/59cbeb80295a82a03226fca5/89f83cf5e7d2392b793279b93fba1f31/capture.png)

Following the advice on [this stack overflow post](https://stackoverflow.com/a/43424214/1586229), I set about modifying [lodash.throttle](https://github.com/lodash/lodash/blob/4.17.4/lodash.js#L10911) to capture the value of `d3.event`, and then put it back in place before invoking the function. Here's the interesting part of the code (or check out the [whole thing](https://github.com/NREL/openstudio-geometry-editor/blob/0790f88dd04123320278a6a1f22443690d587d29/src/utilities/d3-aware-throttle.js) if you like):

```javascript
function debounced() {
  var time = _.now(),
      isInvoking = shouldInvoke(time);

  lastArgs = arguments;
  lastThis = this;
  lastCallTime = time;
  // same as we're saving off the arguments and the context,
  // store the d3 event at the time of call.
  lastD3Event = d3.event;

  //... and now the actual work of checking if
  // we should invoke the function or do stuff with
  // the timer, etc....
}

function invokeFunc(time) {
  var args = lastArgs,
      thisArg = lastThis;

  // save the current value of d3.event, to put back after
  // we're done faking the value.
  var saveD3Event = d3.event;

  // put the d3 event at time of last call in place
  d3.event = lastD3Event;
  lastD3Event = lastArgs = lastThis = undefined;
  lastInvokeTime = time;
  result = func.apply(thisArg, args);

  // put back whatever was there before we messed with the value.
  d3.event = saveD3Event;
  return result;
}
```

New code, new error. Now, running this code gave the following error message:

![](https://trello-attachments.s3.amazonaws.com/58d428743111af1d0a20cf28/59cbec593206a0ef014a1d0f/af6d3293fc434f38ca4946252ea78084/capture.png)

It seems that `d3.event` can only be read from, not written to. I wasn't able to find where that is set up in d3's code, but I did find [this test](https://github.com/d3/d3/blob/17fbf8d4b16ed19303d71dee4881d871bddbc037/test/d3-test.js#L11-L20), which suggested that I could write to `d3Selection.event`, and it would change the value of `d3.event`. Inspecting the property in node confirmed that:

```
$ node
> const d3 = require('d3')
undefined
> Object.getOwnPropertyDescriptor(d3, 'event').get.toString()
'function () { return d3Selection.event; }'
```

Okay! Now we're getting somewhere! I changed my throttle code to set `d3Selection.event` instead, and this... worked! But, it seems, not on every machine. My teammate, Katie, was seeing the same error as before:

```
Uncaught TypeError: Cannot read property 'sourceEvent' of null
```

Debugging on her machine showed that *somehow*, setting d3Selection.event wasn't impacting the value of `d3.event`:

![](https://trello-attachments.s3.amazonaws.com/58d428743111af1d0a20cf28/59cd21030a4bec508e696a3c/bcb076afbf2615dcafe69a7d7deb9140/capture.png)

## The story continues

I still haven't solved this yet. I don't know why it works on my machine but not Katie's. I put together this repo to make it easier to investigate. Check out

- [setting d3.event directly](./dist/setD3Event.html) (and the [source](./src/index.js))
- [setting d3Selection.event](./dist/setD3SelectionEvent.html) (and the [source](./src/selectionIndex.js)
- [setting d3.event directly, but without bundling d3 with webpack](./dist/cdn-d3.html)

## Got an idea?

You can run this code locally

1. `npm install` # install webpack, babel, d3, etc
2. `npm run build` # produces the files in dist.

## Another clue!

Oh! I almost forgot. Potentially another clue is that Katie's machine doesn't seem to be loading `d3-selection-multi` correctly (or I set it up correctly). I'm loading it via

```javascript
import 'd3-selection-multi';
```

but she gets the following error:

```
Uncaught TypeError: measure.select(...).attr(...).attr(...).attr(...).attrs is not a function
```

## Potentially Relevant Links

- https://github.com/d3/d3/issues/2733#issuecomment-271321156
