'use strict';

class MockSQLiteDatabase {
  constructor (overrides) {
    this.overrides = overrides;
  }

  get () {
    const func = this.overrides['get'] || throwNotImplementedError;
    func.apply(this, arguments);
  }

  all () {
    const func = this.overrides['all'] || throwNotImplementedError;
    func.apply(this, arguments);
  }
}

function throwNotImplementedError () {
  throw new Error('Function not implemented');
}

module.exports = MockSQLiteDatabase;
