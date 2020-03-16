export function sortNumber(a, b) {
  return a - b;
}

export function findSortOrder(arr) {
  try {
    arr.sort(function(a, b) {
      a = parseInt(a.orders[0].order);
      b = parseInt(b.orders[0].order);
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    });
  } catch (error) {
    console.log("Cannot Sort");
    console.log(error);
  }

  return arr;
}
