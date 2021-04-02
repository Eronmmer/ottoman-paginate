import {
  ISelectType,
  SortType,
  SearchConsistency,
  LogicalWhereExpr,
  Schema,
	FindOptions,
	
} from "ottoman";

export interface CustomLabels {
  totalDocs?: string;
  limit?: string;
  page?: string;
  totalPages?: string;
  docs?: string;
  nextPage?: string;
  prevPage?: string;
  pagingCounter?: string;
  hasPrevPage?: string;
  hasNextPage?: string;
  paginationMetaData?: string | null;
}

export interface PaginateOptions {
  select?: string | ISelectType[] | string[];
  sort?: Record<string, SortType>;
  populate?: string | string[];
  lean?: boolean;
  consistency?: SearchConsistency;
  noCollection?: boolean;
  populateMaxDeep?: number;
  /* If `ottomanMetaData` is set to false, it will not include the `meta` property that is usually present in the response object of Ottoman's `find()` function. (Default: `true`) */
  ottomanMetaData?: boolean;
  /* Use `offset` or `page` to set skip position */
  offset?: number;
  /* Use `offset` or `page` to set skip position */
  page?: number;
  limit?: number;
  /* Add custom labels to manipulate the response data */
  customLabels?: CustomLabels;
  /* If pagination is set to `false`, it will return all docs without adding limit condition. (Default: `true`) */
  pagination?: boolean;
}

export interface PaginateResult {
  docs?: any[];
  totalDocs?: number;
  limit?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  page?: number | null;
  totalPages?: number | null;
  offset?: number;
  prevPage?: number | null;
  nextPage?: number | null;
  pagingCounter?: number | null;
  meta?: any;
  paginationMetaData?: any;
  [customLabel: string]: any;
}

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

export function paginate(
  filter?: LogicalWhereExpr,
  options?: PaginateOptions,
  callback?: (err: any, result?: PaginateResult) => void,
) {
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
    parseInt(String(options.limit), 10) > 0
      ? parseInt(String(options.limit), 10)
      : 0;

  let offset: number;
  let page: number;
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
    offset = parseInt(String(options.offset), 10);
    skip = offset;
  } else if (Object.prototype.hasOwnProperty.call(options, "page")) {
    page =
      parseInt(String(options.page), 10) < 1
        ? 1
        : parseInt(String(options.page), 10);
    skip = (page - 1) * limit;
  } else {
    offset = 0;
    page = 1;
    skip = offset;
  }

  // @ts-ignore
  let countPromise = this.count(filter);

  const findOptions: FindOptions = {
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
    // @ts-ignore
    docsPromise = this.find(filter, findOptions);
  }

  return Promise.all([countPromise, docsPromise])
    .then((values): void | PaginateResult | Promise<PaginateResult> => {
      const [count, { meta: ottomanMeta, rows: docs }] = values;
      const paginationMeta = {
        [labelTotal]: count,
      };

      let result: PaginateResult = {};

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

        if (page < Number(pages)) {
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

      return typeof callback === "function"
        ? callback(null, result)
        : Promise.resolve(result);
    })
    .catch((error) => {
      return typeof callback === "function"
        ? callback(error)
        : Promise.reject(error);
    });
}

export default (schema: Schema) => {
  schema.statics.paginate = paginate;
};
