var expect = require('expect.js');
var Immutable = require('immutable');
var t = require('../transducers');
var { reduce, transformer, toArray, toObj, toIter, iterate, push, merge, empty,
      transduce, seq, into, compose, map, filter, remove,
      cat, mapcat, keep, dedupe, take, takeWhile,
      drop, dropWhile, partition, protocols } = t;

var context = { num: 5 };

// utility

function first(x) {
  return x[0];
}

function second(x) {
  return x[1];
}

function add(x, y) {
  return x + y;
}

Immutable.Vector.prototype[protocols.transformer] = {
  init: function() {
    return Immutable.Vector().asMutable();
  },
  result: function(vec) {
    return vec.asImmutable();
  },
  step: function(vec, x) {
    return vec.push(x);
  }
};

function eq(x, y) {
  expect(x).to.be(y);
}

function eql(x, y) {
  expect(x).to.eql(y);
}

function immutEql(src, dest) {
  eql(src.toJS(), dest.toJS());
}

describe('', () => {
  it('push/merge should work', () => {
    eql(push([1, 2, 3], 4), [1, 2, 3, 4]);
    eql(merge({ x: 1, y: 2 }, { z: 3 }),
        { x: 1, y: 2, z: 3 });
    eql(merge({ x: 1, y: 2 }, ['z', 3]),
        { x: 1, y: 2, z: 3 });
  });

  it('transformer protocol should work', () => {
    var vec = Immutable.Vector(1, 2, 3);
    var transformer = vec[protocols.transformer];

    immutEql(transformer.init(), Immutable.Vector());

    immutEql(transformer.step(vec, 4),
             Immutable.Vector(1, 2, 3, 4));
  });

  it('map should work', () => {
    eql(map([1, 2, 3, 4], x => x + 1),
        [2, 3, 4, 5]);
    eql(map({ x: 1, y: 2 }, x => [x[0], x[1] + 1]),
        { x: 2, y: 3 });
    eql(map([1, 2, 3, 4], (x, i) => i),
        [0, 1, 2, 3]);
    eql(map([1, 2, 3, 4], function(x) { return x + this.num }, context),
        [6, 7, 8, 9]);
    eql(seq([1, 2, 3, 4],
            map(function(x) { return x + this.num }, context)),
        [6, 7, 8, 9]);

    immutEql(map(Immutable.Vector(1, 2, 3, 4), x => x + 1),
             Immutable.Vector(2, 3, 4, 5));

    eql(transduce([1, 2, 3],
                  map(x => x * 2),
                  transformer(add),
                  0),
        12);
  });

  it('filter should work', () => {
    eql(filter([1, 2, 3, 4], x => x % 2 === 0),
        [2, 4]);
    eql(filter({ x: 1, y: 2 }, x => x[1] % 2 === 0),
        { y: 2 });
    eql(filter([1, 2, 3, 4], (x, i) => i !== 0),
        [2, 3, 4]);
    eql(filter([4, 5, 6], function(x) { return x >= this.num }, context),
        [5, 6]);

    immutEql(filter(Immutable.Vector(1, 2, 3, 4), x => x % 2 === 0),
             Immutable.Vector(2, 4));

    eql(transduce([1, 2, 3],
                  filter(x => x % 2 === 0),
                  transformer(add),
                  0),
        2);
  });

  it('remove should work', () => {
    eql(remove([1, 2, 3, 4], x => x % 2 === 0),
        [1, 3]);
    eql(remove({ x: 1, y: 2 }, x => x[1] % 2 === 0),
        { x: 1 });
    eql(remove([4, 5, 6], function(x) { return x < this.num }, context),
        [5, 6]);

    immutEql(remove(Immutable.Vector(1, 2, 3, 4), x => x % 2 === 0),
             Immutable.Vector(1, 3));

    eql(transduce([1, 2, 3],
                  remove(x => x % 2 ===0),
                  transformer(add),
                  0),
        4);
  });

  it('dedupe should work', () => {
    eql(into([], dedupe(), [1, 2, 2, 3, 3, 3, 5]),
        [1, 2, 3, 5])
  });

  it('keep should work', () => {
    eql(into([], keep(), [1, 2, undefined, null, false, 5]),
        [1, 2, false, 5])
  });

  it('take should work', () => {
    eql(take([1, 2, 3, 4], 2), [1, 2])
    eql(take([1, 2, 3, 4], 10), [1, 2, 3, 4])

    immutEql(take(Immutable.Vector(1, 2, 3, 4), 2),
             Immutable.Vector(1, 2))

    eql(into([], take(2), [1, 2, 3, 4]),
        [1, 2]);
  });

  it('takeWhile should work', () => {
    function lt(n) {
      return function(x) {
        return x < n;
      }
    }

    eql(takeWhile([1, 2, 3, 2], lt(3)), [1, 2]);
    eql(takeWhile([1, 2, 3, 4], lt(10)), [1, 2, 3, 4])
    eql(takeWhile([4, 5, 6], function(x) { return x < this.num }, context),
        [4]);

    immutEql(takeWhile(Immutable.Vector(1, 2, 3, 2), lt(3)),
             Immutable.Vector(1, 2))

    eql(into([], takeWhile(lt(3)), [1, 2, 3, 2]),
        [1, 2]);
  });

  it('drop should work', () => {
    eql(drop([1, 2, 3, 4], 2), [3, 4])
    eql(drop([1, 2, 3, 4], 10), [])

    immutEql(drop(Immutable.Vector(1, 2, 3, 4), 2),
             Immutable.Vector(3, 4))

    eql(into([], drop(2), [1, 2, 3, 4]),
        [3, 4]);
  });

  it('dropWhile should work', () => {
    function lt(n) {
      return function(x) {
        return x < n;
      }
    }

    eql(dropWhile([1, 2, 3, 2], lt(3)), [3, 2]);
    eql(dropWhile([1, 2, 3, 4], lt(10)), []);
    eql(dropWhile([4, 5, 6], function(x) { return x < this.num }, context),
        [5, 6]);

    immutEql(dropWhile(Immutable.Vector(1, 2, 3, 2), lt(3)),
             Immutable.Vector(3, 2));

    eql(into([], dropWhile(lt(3)), [1, 2, 3, 2]),
        [3, 2]);
  });

  it('partition should work', () => {
    eql(partition([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
    eql(partition([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);

    immutEql(partition(Immutable.Vector(1, 2, 3, 4), 2),
             Immutable.Vector(
               Immutable.Vector(1, 2),
               Immutable.Vector(3, 4)
             ));
    immutEql(partition(Immutable.Vector(1, 2, 3, 4, 5), 2),
             Immutable.Vector(
               Immutable.Vector(1, 2),
               Immutable.Vector(3, 4),
               Immutable.Vector(5)
             ));

    eql(into([], partition(2), [1, 2, 3, 4]), [[1, 2], [3, 4]]);
    eql(into([], partition(2), [1, 2, 3, 4, 5]), [[1, 2], [3, 4], [5]]);

    // These 2 are tests for "ensure_unreduced" case
    eql(into([], compose(partition(2), take(2)),
             [1, 2, 3, 4, 5]),
        [[1, 2], [3, 4]]);
    eql(into([], compose(partition(2), take(3)),
             [1, 2, 3, 4, 5]),
        [[1, 2], [3, 4], [5]]);
  });

  it('cat should work', () => {
    eql(into([], cat, [[1, 2], [3, 4]])
        [1, 2, 3, 4]);

    immutEql(into(Immutable.Vector(),
                  cat,
                  Immutable.fromJS([[1, 2], [3, 4]])),
             Immutable.Vector(1, 2, 3, 4));
  });

  it('mapcat should work', () => {
    eql(into([],
             mapcat(arr => {
               return map(arr, x => x + 1);
             }),
             [[1, 2], [3, 4]]),
        [2, 3, 4, 5]);

    eql(into([],
             mapcat(function(arr) {
               return map(arr, x => x + this.num);
             }, context),
             [[1, 2], [3, 4]]),
        [6, 7, 8, 9]);
  });

  it('into should work', () => {
    eql(into([], map(x => x + 1), [1, 2, 3, 4]),
        [2, 3, 4, 5]);
    eql(into([], map(x => x[1] + 1), { x: 10, y: 20 }),
        [11, 21]);
    eql(into({}, map(x => [x[0], x[1] + 1]), { x: 10, y: 20 }),
        { x: 11, y: 21 });
    eql(into({}, map(x => ['foo' + x, x * 2]), [1, 2]),
        { foo1: 2, foo2: 4 });

    eql(into([1, 2, 3], map(x => x + 1), [7, 8, 9]),
        [1, 2, 3, 8, 9, 10]);

    immutEql(into(Immutable.Vector(), map(x => x + 1), [1, 2, 3]),
             Immutable.Vector(2, 3, 4));
  });

  it('seq should work', () => {
    eql(seq([1, 2, 3, 4], map(x => x + 1)),
        [2, 3, 4, 5]);
    eql(seq({ x: 10, y: 20 }, map(x => [x[0], x[1] + 1])),
        { x: 11, y: 21 });

    immutEql(seq(Immutable.Vector(1, 2, 3), map(x => x + 1)),
             Immutable.Vector(2, 3, 4));
  });

  it('transduce and compose should work', () => {
    eql(transduce([1, 2, 3, 4],
                  compose(
                    map(x => x + 1),
                    filter(x => x % 2 === 0)
                  ),
                  transformer(push),
                  []),
        [2, 4])

    eql(transduce({ x: 1, y: 2 },
                  compose(
                    map(second),
                    map(x => x + 1)
                  ),
                  transformer(push),
                  []),
        [2, 3])

    eql(transduce({ x: 1, y: 2 },
                  compose(
                    map(second),
                    map(x => x + 1),
                    map(x => ['foo' + x, x])
                  ),
                  transformer(merge),
                  {}),
        { foo2: 2, foo3: 3 })

    immutEql(transduce(Immutable.Vector(1, 2, 3, 4),
                       compose(
                         map(x => x + 1),
                         filter(x => x % 2 === 0)
                       ),
                       Immutable.Vector.prototype[protocols.transformer],
                       Immutable.Vector()),
             Immutable.Vector(2, 4));

    eql(into([], compose(map(x => [x, x * 2]),
                         cat,
                         filter(x => x > 2)),
             [1, 2, 3, 4]),
        [4, 3, 6, 4, 8]);
  });

  it('array should work', function() {
    var nums = {
      i: 0,
      next: function() {
        return {
          value: this.i++,
          done: false
        };
      },
    };

    eql(toArray([1, 2, 3]), [1, 2, 3]);
    eql(toArray([1, 2, 3, 4], take(3)),
        [1, 2, 3]);
    eql(toArray(nums, take(6)),
        [0, 1, 2, 3, 4, 5]);
  });

  it('obj should work', function() {
    eql(toObj([['foo', 1], ['bar', 2]]),
        { foo: 1, bar: 2 });
    eql(toObj({ foo: 1, bar: 2 }, map(kv => [kv[0], kv[1] + 1])),
        { foo: 2, bar: 3 });
  });

  it('iter should work', function() {
    var nums = {
      i: 0,
      next: function() {
        return {
          value: this.i++,
          done: false
        };
      },
    };

    var lt = toIter(nums, map(x => x * 2));
    expect(lt instanceof t.LazyTransformer).to.be.ok();
    expect(toArray(lt, take(5)),
           [0, 2, 4, 6, 8]);
  });
});
