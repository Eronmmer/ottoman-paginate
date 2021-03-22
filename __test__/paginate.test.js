"use strict";

const dotenv = require("dotenv");
dotenv.config();
const { Schema, model } = require("ottoman");
const ottomanPaginate = require("../index");

const createDocuments = async (modelName) => {
  for (let i = 1; i <= 10; i++) {
    let item = new modelName({
      name: Math.random().toString(36).substring(7),
      age: Math.ceil(Math.random() * 10),
    });
    await item.save();
  }
};

describe("Test ottoman-paginate plugin", () => {
  it("Returns a promise", async () => {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    let promise = Cat.paginate();
    expect(promise.then instanceof Function).toBe(true);
  });

  it("Returns an Object: result", () => {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    Cat.paginate({}, {}, function (err, result) {
      expect(err).toBe(null);
      expect(result instanceof Object).toBe(true);
      Cat.dropCollection();
    });
  });

  it("Result contains all the expected properties", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);
    const options = {
      limit: 2,
      page: 4,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(2);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(2);
      expect(result.page).toBe(4);
      expect(result.pagingCounter).toBe(7);
      expect(result.hasPrevPage).toBe(true);
      expect(result.hasNextPage).toBe(true);
      expect(result.prevPage).toBe(3);
      expect(result.nextPage).toBe(5);
      expect(result.totalPages).toBe(5);
      Cat.dropCollection();
    });
  });

  it("Returns just one page with expected keys and values when limit > doc.length", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);
    const options = {
      limit: 20,
      page: 1,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(10);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(20);
      expect(result.page).toBe(1);
      expect(result.pagingCounter).toBe(1);
      expect(result.hasPrevPage).toBe(false);
      expect(result.hasNextPage).toBe(false);
      expect(result.prevPage).toBe(null);
      expect(result.nextPage).toBe(null);
      expect(result.totalPages).toBe(1);
      Cat.dropCollection();
    });
  });

  it("Returns expected keys & values when first page and limit are passed", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);
    const options = {
      limit: 2,
      page: 1,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(2);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pagingCounter).toBe(1);
      expect(result.hasPrevPage).toBe(false);
      expect(result.hasNextPage).toBe(true);
      expect(result.prevPage).toBe(null);
      expect(result.nextPage).toBe(2);
      expect(result.totalPages).toBe(5);
      Cat.dropCollection();
    });
  });

  it("Returns expected keys & values when last page and limit are passed", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);
    const options = {
      limit: 2,
      page: 5,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(2);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(2);
      expect(result.page).toBe(5);
      expect(result.pagingCounter).toBe(9);
      expect(result.hasPrevPage).toBe(true);
      expect(result.hasNextPage).toBe(false);
      expect(result.prevPage).toBe(4);
      expect(result.nextPage).toBe(null);
      expect(result.totalPages).toBe(5);
      Cat.dropCollection();
    });
  });

  it("Returns expected keys & values when offset & limit", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);
    const options = {
      limit: 2,
      offset: 9,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(2);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(2);
      expect(result.page).toBe(5);
      expect(result.pagingCounter).toBe(9);
      expect(result.hasPrevPage).toBe(true);
      expect(result.hasNextPage).toBe(false);
      expect(result.prevPage).toBe(4);
      expect(result.nextPage).toBe(null);
      expect(result.totalPages).toBe(5);
      Cat.dropCollection();
    });
  });

  it("Returns only metadata when limit=0", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);
    const options = {
      limit: 0,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(0);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(0);
      expect(result.page).toBe(null);
      expect(result.pagingCounter).toBe(null);
      expect(result.hasPrevPage).toBe(false);
      expect(result.hasNextPage).toBe(false);
      expect(result.prevPage).toBe(null);
      expect(result.nextPage).toBe(null);
      expect(result.totalPages).toBe(null);
      Cat.dropCollection();
    });
  });

  it("Empty custom labels", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);

    const myCustomLabels = {
      nextPage: false,
      prevPage: "",
    };
    const options = {
      limit: 2,
      page: 4,
      customLabels: myCustomLabels,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(2);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(2);
      expect(result.page).toBe(4);
      expect(result.pagingCounter).toBe(7);
      expect(result.hasPrevPage).toBe(true);
      expect(result.hasNextPage).toBe(true);
      expect(result.prevPage).toBe(undefined);
      expect(result.nextPage).toBe(undefined);
      expect(result.totalPages).toBe(10);
      Cat.dropCollection();
    });
  });

  it("Custom labels", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);

    const myCustomLabels = {
      totalDocs: "itemCount",
      docs: "itemsList",
      limit: "perPage",
      page: "currentPage",
      nextPage: "next",
      prevPage: "prev",
      totalPages: "pageCount",
      pagingCounter: "pageCounter",
      hasPrevPage: "hasPrevious",
      hasNextPage: "hasNext",
    };
    const options = {
      limit: 2,
      page: 4,
      customLabels: myCustomLabels,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.itemsList.length).toBe(2);
      expect(result.itemCount).toBe(10);
      expect(result.perPage).toBe(2);
      expect(result.currentPage).toBe(4);
      expect(result.pageCounter).toBe(7);
      expect(result.hasPrevious).toBe(true);
      expect(result.hasNext).toBe(true);
      expect(result.prev).toBe(3);
      expect(result.next).toBe(5);
      expect(result.pageCount).toBe(10);
      Cat.dropCollection();
    });
  });

  it("Returns all data when pagination is set to false", function () {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    CatSchema.plugin(ottomanPaginate);
    const Cat = model("Cat", CatSchema);

    createDocuments(Cat);
    const options = {
      pagination: false,
    };

    Cat.paginate({}, options).then((result) => {
      expect(result.docs.length).toBe(10);
      expect(result.totalDocs).toBe(10);
      expect(result.limit).toBe(10);
      expect(result.page).toBe(1);
      expect(result.pagingCounter).toBe(1);
      expect(result.hasPrevPage).toBe(false);
      expect(result.hasNextPage).toBe(false);
      expect(result.prevPage).toBe(null);
      expect(result.nextPage).toBe(null);
      expect(result.totalPages).toBe(1);
      Cat.dropCollection();
    });
  });
});
