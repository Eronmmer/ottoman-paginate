"use strict";

const defaultOptions = {
  customLabels: {
    totalDocs: "totalDocs",
    limit: "limit",
    page: "page",
    totalPages: "totalPages",
    docs: "docs",
    nextPage: "nextPage",
    prevPage: "prevPage",
    pagingCounter: "pagingCounter",
    hasPrevPage: "hasPrevPage",
    hasNextPage: "hasNextPage",
    meta: null,
  },
  limit: 10,
  select: "",
  pagination: true,
};

function paginate(filter, options, callback) {
  options = {
    ...defaultOptions,
    ...options,
  };

  filter = filter || {};

  const {
    select,
    pagination,
    populate,
    sort,
    consistency,
    lean,
    noCollection,
    populateMaxDeep,
  } = options;

  const customLabels = {
    ...defaultOptions.customLabels,
    ...options.customLabels,
  };

  const limit =
    parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 0;

  const isCallbackSpecified = typeof callback === "function";

  let offset;
  let page;
  let skip;

  let docsPromise = [];

  const labelDocs = customLabels.docs;
  const labelLimit = customLabels.limit;
  const labelTotal = customLabels.totalDocs;
  const labelPage = customLabels.page;
  const labelTotalPages = customLabels.totalPages;
  const labelNextPage = customLabels.nextPage;
  const labelPrevPage = customLabels.prevPage;
  const labelPagingCounter = customLabels.pagingCounter;
  const labelHasPrevPage = customLabels.hasPrevPage;
  const labelHasNextPage = customLabels.hasNextPage;
  const labelMeta = customLabels.meta;

  if (Object.prototype.hasOwnProperty.call(options, "offset")) {
    offset = parseInt(options.offset, 10);
    skip = offset;
  } else if (Object.prototype.hasOwnProperty.call(options, "page")) {
    page = parseInt(options.page, 10) < 1 ? 1 : parseInt(options.page, 10);
    skip = (page - 1) * limit;
  } else {
    offset = 0;
    page = 1;
    skip = offset;
  }

  let countPromise = this.count(filter).exec();

  const findOptions = {
    consistency,
    lean,
    noCollection,
    populateMaxDeep,
    populate,
    sort,
    select,
  };
  // verify this later
  let sanitizedFindOptions = {};

  Object.entries(findOptions).forEach(([key, value], idx, array) => {
    if (value !== undefined) {
      sanitizedFindOptions[key] = value;
    }
    if (idx === array.length - 1 && pagination) {
      sanitizedFindOptions["skip"] = skip;
      sanitizedFindOptions["limit"] = limit;
    }
  });

  if (limit) {
    const dbQuery = this.find(filter, sanitizedFindOptions);

    if (pagination) {
      dbQuery.skip(skip);
      dbQuery.limit(limit);
    }

    // exec?
    docsPromise = dbQuery.exec();
  }

  return Promise.all([countPromise, docsPromise])
    .then((values) => {
      const [count, docs] = values;
      const meta = {
        [labelTotal]: count,
      };

      let result = {};

      if (typeof offset !== "undefined") {
        meta.offset = offset;
        page = Math.ceil((offset + 1) / limit);
      }

      const pages = limit > 0 ? Math.ceil(count / limit) || 1 : null;

      // default values
      meta[labelLimit] = count;
      meta[labelTotalPages] = 1;
      meta[labelPage] = page;
      meta[labelPagingCounter] = (page - 1) * limit + 1;

      meta[labelHasPrevPage] = false;
      meta[labelHasNextPage] = false;
      meta[labelPrevPage] = null;
      meta[labelNextPage] = null;

      if (pagination) {
        meta[labelLimit] = limit;
        meta[labelTotalPages] = pages;

        if (page > 1) {
          meta[labelHasPrevPage] = true;
          meta[labelPrevPage] = page - 1;
        }

        if (page < pages) {
          meta[labelHasNextPage] = true;
          meta[labelNextPage] = page + 1;
        }
      }

      if (limit == 0) {
        meta[labelLimit] = 0;
        meta[labelTotalPages] = null;
        meta[labelPage] = null;
        meta[labelPagingCounter] = null;
        meta[labelPrevPage] = null;
        meta[labelNextPage] = null;
        meta[labelHasPrevPage] = false;
        meta[labelHasNextPage] = false;
      }

      if (labelMeta) {
        result = {
          [labelDocs]: docs,
          [labelMeta]: meta,
        };
      } else {
        result = {
          [labelDocs]: docs,
          ...meta,
        };
      }

      return isCallbackSpecified
        ? callback(null, result)
        : Promise.resolve(result);
    })
    .catch((error) => {
      return isCallbackSpecified ? callback(error) : Promise.reject(error);
    });
}

module.exports = (schema) => {
  schema.statics.paginate = paginate;
};
module.exports.paginate = paginate;
