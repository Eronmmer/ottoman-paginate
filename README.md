# Ottoman Paginate 🍨

## Introduction

This Plugin, inspired by [mongoose-paginate](https://github.com/aravindnc/mongoose-paginate-v2), offers a simple, yet elegant way to implement pagination with Ottoman.js. You can also alter the return value keys directly in the query itself so that you don't need any extra code for transformation.

## Installation

```sh
yarn add ottoman-paginate
```

## Usage

Add the plugin to a schema and then use the `paginate` method:

```js
const { model, Schema } = require("ottoman");
const ottomanPaginate = require("ottoman-paginate");

const person = new Schema({
  name: String,
});

person.plugin(ottomanPaginate);

const PersonModel = model("Person", issueSchema);

PersonModel.paginate().then({}); // Usage
```

### Model.paginate([filter], [options], [callback])

Returns a promise

**Parameters**

- `[filter]` {Object} - Filter Query. [Documentation](https://v2.ottomanjs.com/globals.html#logicalwhereexpr)
- `[options]` {Object} - Options passed to Ottoman's [find() function](https://v2.ottomanjs.com/classes/findoptions.html#class-findoptions) along with other custom options for pagination.
  - `[select]` {string | string[]} - Fields to return (returns all fields by default). [Documentation](https://v2.ottomanjs.com/classes/findoptions.html#optional-select)
  - `[sort]` {string} - Sort order. [Documentation](https://v2.ottomanjs.com/classes/findoptions.html#optional-sort)
  - `[populate]` {string | string[]} - Paths which should be populated with other documents. [Documentation](https://v2.ottomanjs.com/guides/document.html#populate)
  - `[lean]` {Boolean}
  - `[consistency]` {SearchConsistency} - [Documentation](https://v2.ottomanjs.com/classes/findoptions.html#optional-consistency)
  - `[noCollection]` {undefined | Boolean} - [Documentation](https://v2.ottomanjs.com/classes/findoptions.html#optional-nocollection)
  - `[populateMaxDeep]` {undefined | number} - [Documentation](https://v2.ottomanjs.com/classes/findoptions.html#optional-populatemaxdeep)
  - `[ottomanMetaData=true]` {Boolean} - If `ottomanMetaData` is set to false, it will not include the `meta` property that is usually present in the response object of Ottoman's `find()` function.
  - `[offset=0]` {Number} - Use `offset` or `page` to set skip position
  - `[page=1]` {Number}
  - `[limit=10]` {Number}
  - `[customLabels]` {Object} - Add custom labels to manipulate the response data.
  - `[pagination]` {Boolean} - If `pagination` is set to false, it will return all docs without adding limit condition. (Default: True)
- `[callback(err, result)]` - If specified, the callback is called once pagination results are retrieved or when an error has occurred.

**Return value**

Promise fulfilled with object having properties:

- `docs` {Array} - Array of documents
- `totalDocs` {Number} - Total number of documents in collection that match a query
- `limit` {Number} - Limit that was used
- `hasPrevPage` {Bool} - Availability of previous page.
- `hasNextPage` {Bool} - Availability of next page.
- `page` {Number} - Current page number.
- `totalPages` {Number} - Total number of pages.
- `offset` {Number} - Only if specified or default `page`/`offset` values were used
- `prevPage` {Number} - Previous page number if available or `null`
- `nextPage` {Number} - Next page number if available or `null`
- `pagingCounter` {Number} -  The starting index number of the first document in the current page.
- `meta` {Object} - Request meta data from Ottoman.
- `paginationMetaData` {Object} - Object of pagination meta data (Disabled by default).

The above properties can be renamed by setting customLabels attribute.

### Sample Usage

The following returns the first 10 documents from a collection of 100 documents.

```javascript
const options = {
  page: 1,
  limit: 10,
};

Model.paginate({}, options, function (err, result) {
  // result.docs
  // result.totalDocs = 100
  // result.limit = 10
  // result.page = 1
  // result.totalPages = 10
  // result.hasNextPage = true
  // result.nextPage = 2
  // result.hasPrevPage = false
  // result.prevPage = null
  // result.pagingCounter = 1
  // result.meta
});
```

### With custom return labels

You can change the name of the following attributes

- totalDocs
- docs
- limit
- page
- nextPage
- prevPage
- hasNextPage
- hasPrevPage
- totalPages
- pagingCounter
- paginationMetaData

You should pass the names of the properties you wish to change using `customLabels` object in options.
Set the property to false to remove it from the result.
Below is a query with custom labels.

```javascript
const myCustomLabels = {
  totalDocs: "itemCount",
  docs: "itemsList",
  limit: "perPage",
  page: "currentPage",
  nextPage: "next",
  prevPage: "prev",
  totalPages: "pageCount",
  pagingCounter: "slNo",
  paginationMetaData: "paginator",
};

const options = {
  page: 1,
  limit: 10,
  customLabels: myCustomLabels,
};

Model.paginate({}, options, function (err, result) {
  // result.itemsList [here docs becomes itemsList]
  // result.paginator.itemCount = 100 [here totalDocs becomes itemCount]
  // result.paginator.perPage = 10 [here limit becomes perPage]
  // result.paginator.currentPage = 1 [here page becomes currentPage]
  // result.paginator.pageCount = 10 [here totalPages becomes pageCount]
  // result.paginator.next = 2 [here nextPage becomes next]
  // result.paginator.prev = null [here prevPage becomes prev]
  // result.paginator.slNo = 1 [here pagingCounter becomes slNo]
  // result.paginator.hasNextPage = true
  // result.paginator.hasPrevPage = false
});
```

### Other Examples

Using `offset` and `limit`:

```javascript
Model.paginate({}, { offset: 30, limit: 10 }, function (err, result) {
  // result.docs
  // result.totalPages
  // result.limit - 10
  // result.offset - 30
});
```

With promise:

```js
Model.paginate({}, { offset: 30, limit: 10 }).then(function (result) {
  // ...
});
```

#### Adding more options

```javascript
var filter = {};
var options = {
  select: "title date author",
  sort: { date: "DESC" },
  populate: "author",
  offset: 20,
  limit: 10,
  ottomanMetaData: false,
};

Book.paginate(filter, options).then(function (result) {
  // ...
});
```

#### Zero limit

You can use `limit=0` to get only the pagination metadata:

```javascript
Model.paginate({}, { limit: 0 }).then(function (result) {
  // result.docs - empty array
  // result.totalDocs
  // result.limit - 0
});
```

#### Fetch all docs without pagination.

If you need to fetch all the documents in the collection without applying a limit. Then set the `pagination` option to false,

```javascript
const options = {
  pagination: false,
};

Model.paginate({}, options, function (err, result) {
  // result.docs
  // result.totalDocs = 100
  // result.limit = 100
  // result.page = 1
  // result.totalPages = 1
  // result.hasNextPage = false
  // result.nextPage = null
  // result.hasPrevPage = false
  // result.prevPage = null
  // result.pagingCounter = 1
});
```

## Contribution

If you find an issue with the package or want to add a nice feature, create an issue or submit a PR.

## Test

- Create an `.env` file with your required variables. Check `.example.env` to see how it's done.
- Run the following command.

```sh
yarn test
```

## Todo

- Rewrite with TS and include types
