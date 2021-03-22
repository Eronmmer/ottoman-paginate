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
    paginationMetaData: null,
  },
  limit: 10,
  select: "",
  pagination: true,
  ottomanMetaData: true,
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
    ottomanMetaData,
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
  const labelMeta = customLabels.paginationMetaData;

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

  let countPromise = this.count(filter);

  const findOptions = {
    consistency,
    lean,
    noCollection,
    populateMaxDeep,
    populate,
    sort,
    select,
  };

  if (limit && pagination) {
    findOptions["skip"] = skip;
    findOptions["limit"] = limit;
  }

  if (limit) {
    docsPromise = this.find(filter, findOptions);
  }

  return Promise.all([countPromise, docsPromise])
    .then((values) => {
      const [count, { meta: ottomanMeta, rows: docs }] = values;
      const paginationMeta = {
        [labelTotal]: count,
      };

      let result = {};

      if (typeof offset !== "undefined") {
        paginationMeta.offset = offset;
        page = Math.ceil((offset + 1) / limit);
      }

      const pages = limit > 0 ? Math.ceil(count / limit) || 1 : null;

      // default values
      paginationMeta[labelLimit] = count;
      paginationMeta[labelTotalPages] = 1;
      paginationMeta[labelPage] = page;
      paginationMeta[labelPagingCounter] = (page - 1) * limit + 1;
      paginationMeta[labelHasPrevPage] = false;
      paginationMeta[labelHasNextPage] = false;
      paginationMeta[labelPrevPage] = null;
      paginationMeta[labelNextPage] = null;

      if (pagination) {
        paginationMeta[labelLimit] = limit;
        paginationMeta[labelTotalPages] = pages;

        if (page > 1) {
          paginationMeta[labelHasPrevPage] = true;
          paginationMeta[labelPrevPage] = page - 1;
        }

        if (page < pages) {
          paginationMeta[labelHasNextPage] = true;
          paginationMeta[labelNextPage] = page + 1;
        }
      }

      if (limit == 0) {
        paginationMeta[labelLimit] = 0;
        paginationMeta[labelTotalPages] = null;
        paginationMeta[labelPage] = null;
        paginationMeta[labelPagingCounter] = null;
        paginationMeta[labelPrevPage] = null;
        paginationMeta[labelNextPage] = null;
        paginationMeta[labelHasPrevPage] = false;
        paginationMeta[labelHasNextPage] = false;
      }

      if (labelMeta) {
        result = {
          [labelDocs]: docs,
          [labelMeta]: paginationMeta,
        };
      } else {
        result = {
          [labelDocs]: docs,
          ...paginationMeta,
        };
      }

      result["meta"] = ottomanMeta;

      if (ottomanMetaData === false) {
        delete result.meta;
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
